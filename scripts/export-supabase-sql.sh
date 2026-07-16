#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${OUTPUT_FILE:-}" ]]; then
  OUTPUT_FILE="/tmp/supabase-export.sql"
fi

cat > "$OUTPUT_FILE" <<'SQL'
-- Export helper for Supabase SQL editor
-- Run this in the old Lovable-managed Supabase SQL editor.
-- It will print the content of your app tables as INSERT statements.

-- Adjust the table list below if needed.
WITH tables AS (
  SELECT 'profiles' AS name UNION ALL
  SELECT 'accounts' UNION ALL
  SELECT 'incomes' UNION ALL
  SELECT 'income_entries' UNION ALL
  SELECT 'expenses' UNION ALL
  SELECT 'budgets' UNION ALL
  SELECT 'recurring_budgets' UNION ALL
  SELECT 'subscriptions' UNION ALL
  SELECT 'debts' UNION ALL
  SELECT 'debt_payments' UNION ALL
  SELECT 'savings_goals' UNION ALL
  SELECT 'investments' UNION ALL
  SELECT 'offerings' UNION ALL
  SELECT 'tithe_payments' UNION ALL
  SELECT 'financial_events' UNION ALL
  SELECT 'month_closures' UNION ALL
  SELECT 'deductions' UNION ALL
  SELECT 'ai_insights' UNION ALL
  SELECT 'devotionals' UNION ALL
  SELECT 'families' UNION ALL
  SELECT 'family_members' UNION ALL
  SELECT 'family_contributions'
)
SELECT format('/* %s */', name) FROM tables;
SQL

echo "Save the output from the SQL editor to a file and then import it into the new project."
echo "Example: copy the output from the SQL editor into a file named supabase-data.sql"
