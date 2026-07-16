-- Copy this into the old Lovable-managed Supabase SQL editor.
-- It exports your data as INSERT statements for the app tables.
-- Then paste the result into the new project's SQL editor.

-- Helper: use this if your SQL editor supports returning rows.
-- If it does not, export the result as CSV and convert it manually.

SELECT 'profiles' AS table_name, * FROM public.profiles;
SELECT 'accounts' AS table_name, * FROM public.accounts;
SELECT 'incomes' AS table_name, * FROM public.incomes;
SELECT 'income_entries' AS table_name, * FROM public.income_entries;
SELECT 'expenses' AS table_name, * FROM public.expenses;
SELECT 'budgets' AS table_name, * FROM public.budgets;
SELECT 'recurring_budgets' AS table_name, * FROM public.recurring_budgets;
SELECT 'subscriptions' AS table_name, * FROM public.subscriptions;
SELECT 'debts' AS table_name, * FROM public.debts;
SELECT 'debt_payments' AS table_name, * FROM public.debt_payments;
SELECT 'savings_goals' AS table_name, * FROM public.savings_goals;
SELECT 'investments' AS table_name, * FROM public.investments;
SELECT 'offerings' AS table_name, * FROM public.offerings;
SELECT 'tithe_payments' AS table_name, * FROM public.tithe_payments;
SELECT 'financial_events' AS table_name, * FROM public.financial_events;
SELECT 'month_closures' AS table_name, * FROM public.month_closures;
SELECT 'deductions' AS table_name, * FROM public.deductions;
SELECT 'ai_insights' AS table_name, * FROM public.ai_insights;
SELECT 'devotionals' AS table_name, * FROM public.devotionals;
SELECT 'families' AS table_name, * FROM public.families;
SELECT 'family_members' AS table_name, * FROM public.family_members;
SELECT 'family_contributions' AS table_name, * FROM public.family_contributions;
