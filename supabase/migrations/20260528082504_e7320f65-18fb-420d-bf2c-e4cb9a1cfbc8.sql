
REVOKE EXECUTE ON FUNCTION public.apply_account_delta(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expenses_sync_account() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debt_payments_sync_account() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.income_entries_sync_account() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.account_transactions_sync() FROM PUBLIC, anon, authenticated;
