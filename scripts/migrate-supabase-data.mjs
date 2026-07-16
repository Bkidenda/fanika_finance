#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const requiredEnvVars = [
  'SOURCE_SUPABASE_URL',
  'SOURCE_SUPABASE_SERVICE_ROLE_KEY',
  'TARGET_SUPABASE_URL',
  'TARGET_SUPABASE_SERVICE_ROLE_KEY',
];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]?.trim());

if (missingEnvVars.length > 0) {
  console.error(`[migrate] Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('[migrate] Export them in your shell before running this script.');
  process.exit(1);
}

function ensureRealValue(name, value) {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${name} is empty.`);
  }

  if (/[<>]/.test(trimmed) || /old-project|new-project|service-role-key|project-ref/i.test(trimmed)) {
    throw new Error(
      `${name} still contains a placeholder value. Replace it with the real value from your Supabase project, for example: https://abc123.supabase.co`,
    );
  }

  return trimmed;
}

function ensureSupabaseUrl(name, value) {
  const trimmed = ensureRealValue(name, value);

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error();
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    throw new Error(
      `${name} is invalid. It must be a full Supabase project URL such as https://abc123.supabase.co`,
    );
  }
}

const sourceUrl = ensureSupabaseUrl('SOURCE_SUPABASE_URL', process.env.SOURCE_SUPABASE_URL);
const sourceServiceRoleKey = ensureRealValue('SOURCE_SUPABASE_SERVICE_ROLE_KEY', process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY);
const targetUrl = ensureSupabaseUrl('TARGET_SUPABASE_URL', process.env.TARGET_SUPABASE_URL);
const targetServiceRoleKey = ensureRealValue('TARGET_SUPABASE_SERVICE_ROLE_KEY', process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY);
const tempPassword = process.env.TEMP_PASSWORD?.trim() || 'ChangeMe123!';

const tables = (process.env.TABLES || [
  'profiles',
  'accounts',
  'incomes',
  'income_entries',
  'expenses',
  'budgets',
  'recurring_budgets',
  'subscriptions',
  'debts',
  'debt_payments',
  'savings_goals',
  'investments',
  'offerings',
  'tithe_payments',
  'financial_events',
  'month_closures',
  'deductions',
  'ai_insights',
  'devotionals',
  'families',
  'family_members',
  'family_contributions',
].join(','))
  .split(',')
  .map((table) => table.trim())
  .filter(Boolean);

const sourceClient = createClient(sourceUrl, sourceServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const targetClient = createClient(targetUrl, targetServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function normalizeRow(row, table, authIdMap) {
  const normalized = { ...row };

  if (table === 'profiles' && normalized.id && authIdMap.has(normalized.id)) {
    normalized.id = authIdMap.get(normalized.id);
  }

  for (const key of ['user_id', 'owner_id', 'profile_id', 'created_by', 'updated_by']) {
    if (normalized[key] && authIdMap.has(normalized[key])) {
      normalized[key] = authIdMap.get(normalized[key]);
    }
  }

  return normalized;
}

async function transferAuthUsers() {
  console.log('[migrate] Syncing Supabase Auth users...');

  const { data: sourceUsersData, error: sourceUsersError } = await sourceClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (sourceUsersError) {
    throw sourceUsersError;
  }

  const sourceUsers = sourceUsersData?.users ?? [];

  const { data: targetUsersData, error: targetUsersError } = await targetClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (targetUsersError) {
    throw targetUsersError;
  }

  const existingUsersByEmail = new Map(
    (targetUsersData?.users ?? [])
      .filter((user) => Boolean(user.email))
      .map((user) => [user.email.toLowerCase(), user]),
  );

  const authIdMap = new Map();

  for (const user of sourceUsers) {
    if (!user.email) {
      continue;
    }

    const normalizedEmail = user.email.toLowerCase();
    const existingUser = existingUsersByEmail.get(normalizedEmail);

    if (existingUser) {
      authIdMap.set(user.id, existingUser.id);
      continue;
    }

    const { data: createdUser, error: createError } = await targetClient.auth.admin.createUser({
      email: user.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: user.user_metadata ?? {},
      app_metadata: user.app_metadata ?? {},
    });

    if (createError) {
      console.warn(`[migrate] Could not create auth user ${user.email}: ${createError.message}`);
      continue;
    }

    authIdMap.set(user.id, createdUser.user.id);
    existingUsersByEmail.set(normalizedEmail, createdUser.user);
  }

  return authIdMap;
}

async function transferTable(tableName, authIdMap) {
  console.log(`[migrate] Transferring table: ${tableName}`);

  const { data, error } = await sourceClient.from(tableName).select('*');
  if (error) {
    console.warn(`[migrate] Could not read rows from ${tableName}: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`[migrate] ${tableName}: no rows to transfer`);
    return;
  }

  const rows = data.map((row) => normalizeRow(row, tableName, authIdMap));
  const batchSize = 200;

  for (let index = 0; index < rows.length; index += batchSize) {
    const chunk = rows.slice(index, index + batchSize);
    let result = await targetClient.from(tableName).upsert(chunk, { onConflict: 'id' });

    if (result.error && /column "id" does not exist|does not exist/i.test(result.error.message)) {
      result = await targetClient.from(tableName).insert(chunk);
    }

    if (result.error) {
      console.warn(`[migrate] Failed to insert chunk for ${tableName}: ${result.error.message}`);
    }
  }

  console.log(`[migrate] Completed ${tableName}: ${rows.length} rows`);
}

async function main() {
  console.log('[migrate] Starting Supabase data migration');

  const authIdMap = await transferAuthUsers();
  console.log(`[migrate] Auth users mapped: ${authIdMap.size}`);

  for (const tableName of tables) {
    await transferTable(tableName, authIdMap);
  }

  console.log('[migrate] Migration finished.');
  console.log('[migrate] Important: these users were created with a temporary password. Ask them to reset it.');
}

main().catch((error) => {
  console.error('[migrate] Migration failed:', error);
  process.exit(1);
});
