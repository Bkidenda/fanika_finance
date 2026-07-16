# Supabase fallback migration via SQL dump

If you cannot access the old Supabase project through the API keys, use the database connection strings instead.

## 1. Get the database connection strings

From the old Lovable-created Supabase project:
- Open Database → Connect
- Copy the connection string for a Postgres client

From the new Supabase project:
- Open Database → Connect
- Copy the connection string for a Postgres client

You need the direct Postgres connection strings, not just the HTTP URL.

## 2. Run the dump/import script

```bash
chmod +x scripts/supabase-dump-import.sh

export SOURCE_DB_URL="postgresql://postgres:password@db.<old-project>.supabase.co:5432/postgres"
export TARGET_DB_URL="postgresql://postgres:password@db.<new-project>.supabase.co:5432/postgres"

./scripts/supabase-dump-import.sh
```

## 3. If the import fails

You may need to:
- disable triggers or foreign keys temporarily
- import schema first
- run the migration in smaller batches
- exclude auth tables if they already exist

## 4. Important note

This approach copies the database contents directly, which is often the most reliable fallback when the API keys are unavailable.
