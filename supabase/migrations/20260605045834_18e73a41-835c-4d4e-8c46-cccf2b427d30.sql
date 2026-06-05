
REVOKE EXECUTE ON FUNCTION public.accounts_negative_creates_debt() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.accounts_sync_linked_debt() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.offerings_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.family_contributions_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expenses_mpesa_autosave() FROM PUBLIC, anon, authenticated;
