# Export from Supabase SQL editor

If you cannot access the old Supabase project through the API or service role key, the SQL editor is still useful.

## 1. Run this in the old project SQL editor

Use the following SQL to export rows from the app tables.

```sql
-- Replace the table list if your schema differs.
SELECT 'profiles' AS table_name;

-- For each table, run a query like this:
SELECT * FROM profiles;
SELECT * FROM accounts;
SELECT * FROM incomes;
SELECT * FROM income_entries;
SELECT * FROM expenses;
SELECT * FROM budgets;
SELECT * FROM recurring_budgets;
SELECT * FROM subscriptions;
SELECT * FROM debts;
SELECT * FROM debt_payments;
SELECT * FROM savings_goals;
SELECT * FROM investments;
SELECT * FROM offerings;
SELECT * FROM tithe_payments;
SELECT * FROM financial_events;
SELECT * FROM month_closures;
SELECT * FROM deductions;
SELECT * FROM ai_insights;
SELECT * FROM devotionals;
SELECT * FROM families;
SELECT * FROM family_members;
SELECT * FROM family_contributions;
```

## 2. Copy the results into a SQL file

Copy the returned rows into a file such as:

```bash
supabase-data.sql
```

## 3. Import into the new project

Open the new Supabase SQL editor and run the SQL file contents there.

## 4. Important note

This only works if the old database is still reachable from the SQL editor and if the new project already has the matching tables and schema.
