# Supabase migration guide

## 1. Export the old project data

Use the Supabase SQL editor in the old project and run a dump of the relevant tables if you want a backup before moving data.

If you want to preserve auth users as well, the script in this repo can copy them from the old project into the new project.

## 2. Set the environment variables

Run the migration from the repo root:

```bash
export SOURCE_SUPABASE_URL="https://your-old-project-ref.supabase.co"
export SOURCE_SUPABASE_SERVICE_ROLE_KEY="your-old-service-role-key"
export TARGET_SUPABASE_URL="https://your-new-project-ref.supabase.co"
export TARGET_SUPABASE_SERVICE_ROLE_KEY="your-new-service-role-key"
export TEMP_PASSWORD="ChangeMe123!"
```

> Replace the example values above with the real values from the Supabase Dashboard. Do not leave the angle brackets or placeholder text in place.

## 3. Run the migration script

```bash
node scripts/migrate-supabase-data.mjs
```

## 4. Important notes

- The script uses Supabase service role keys, so it can bypass RLS and copy data.
- It creates auth users in the new project if they do not already exist.
- It tries to preserve relationships by mapping old user IDs to new auth IDs when possible.
- Some tables may need custom handling if your schema differs from the default expectations.

## 5. If the new Supabase project already has data

If you already have rows in the target tables, the script uses `upsert` on `id` to avoid duplicates. If a target table does not have an `id` column, it falls back to plain insert.
