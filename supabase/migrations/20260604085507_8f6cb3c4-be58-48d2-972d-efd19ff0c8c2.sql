ALTER TABLE public.account_transactions DROP CONSTRAINT IF EXISTS account_transactions_kind_check;
ALTER TABLE public.account_transactions ADD CONSTRAINT account_transactions_kind_check
  CHECK (kind = ANY (ARRAY['deposit','withdrawal','transfer','adjustment','debt_inflow','auto_ziidi','manual_adjustment']));