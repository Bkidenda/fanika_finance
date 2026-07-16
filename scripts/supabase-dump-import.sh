#!/usr/bin/env bash
set -euo pipefail

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required but was not found. Install postgresql-client first." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but was not found. Install postgresql-client first." >&2
  exit 1
fi

if [[ -z "${SOURCE_DB_URL:-}" ]]; then
  echo "Set SOURCE_DB_URL to the direct connection string for the old Supabase project." >&2
  exit 1
fi

if [[ -z "${TARGET_DB_URL:-}" ]]; then
  echo "Set TARGET_DB_URL to the direct connection string for the new Supabase project." >&2
  exit 1
fi

DUMP_DIR="${DUMP_DIR:-/tmp/supabase-migration}"
mkdir -p "$DUMP_DIR"

SOURCE_DUMP="$DUMP_DIR/source.dump.sql"

echo "Dumping source database..."
pg_dump "$SOURCE_DB_URL" --format=plain --no-owner --no-privileges > "$SOURCE_DUMP"

echo "Importing into target database..."
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$SOURCE_DUMP"

echo "Migration completed."
