
-- Add transaction fee columns
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS transaction_fee numeric NOT NULL DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS source_debt_payment_id uuid;
ALTER TABLE public.account_transactions ADD COLUMN IF NOT EXISTS transaction_fee numeric NOT NULL DEFAULT 0;

-- Archive flag for settled debts
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Display currency for profile (separate from base currency)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_currency text NOT NULL DEFAULT 'KES';

-- ===== Update expenses balance trigger to include fees =====
CREATE OR REPLACE FUNCTION public.expenses_sync_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.apply_account_delta(NEW.account_id, -(NEW.amount + COALESCE(NEW.transaction_fee, 0)));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.apply_account_delta(OLD.account_id, (OLD.amount + COALESCE(OLD.transaction_fee, 0)));
    PERFORM public.apply_account_delta(NEW.account_id, -(NEW.amount + COALESCE(NEW.transaction_fee, 0)));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.apply_account_delta(OLD.account_id, (OLD.amount + COALESCE(OLD.transaction_fee, 0)));
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $function$;

-- ===== Update account_transactions trigger: fees come out of source =====
CREATE OR REPLACE FUNCTION public.account_transactions_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.kind = 'transfer' THEN
      PERFORM public.apply_account_delta(NEW.account_id, -(ABS(NEW.amount) + COALESCE(NEW.transaction_fee, 0)));
      PERFORM public.apply_account_delta(NEW.to_account_id, ABS(NEW.amount));
    ELSIF NEW.kind = 'adjustment' THEN
      PERFORM public.apply_account_delta(NEW.account_id, NEW.amount);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.kind = 'transfer' THEN
      PERFORM public.apply_account_delta(OLD.account_id, (ABS(OLD.amount) + COALESCE(OLD.transaction_fee, 0)));
      PERFORM public.apply_account_delta(OLD.to_account_id, -ABS(OLD.amount));
    ELSIF OLD.kind = 'adjustment' THEN
      PERFORM public.apply_account_delta(OLD.account_id, -OLD.amount);
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $function$;

-- ===== Debt payments: don't touch account directly; create an expense which adjusts balance.
--      Also reduce debt balance and archive when settled. =====
CREATE OR REPLACE FUNCTION public.debt_payments_sync_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_debt_name text;
  v_new_balance numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name, balance INTO v_debt_name, v_new_balance FROM public.debts WHERE id = NEW.debt_id;
    v_new_balance := GREATEST(0, COALESCE(v_new_balance, 0) - NEW.amount);
    UPDATE public.debts
      SET balance = v_new_balance,
          archived_at = CASE WHEN v_new_balance <= 0 THEN COALESCE(archived_at, now()) ELSE archived_at END
      WHERE id = NEW.debt_id;
    -- Auto-create expense row, which itself debits the account via expenses_sync_account.
    -- Skip if an expense was already linked (avoids double-entry when called from app).
    IF NEW.account_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.expenses WHERE source_debt_payment_id = NEW.id) THEN
      INSERT INTO public.expenses (user_id, date, amount, category, description, payment_method, is_emergency, account_id, source_debt_payment_id)
      VALUES (NEW.user_id, NEW.date, NEW.amount, 'Loans / Debt repayment',
              'Debt: ' || COALESCE(v_debt_name, 'payment'), 'Bank transfer', false, NEW.account_id, NEW.id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Restore debt balance and unarchive if needed
    UPDATE public.debts
      SET balance = balance + OLD.amount,
          archived_at = CASE WHEN balance + OLD.amount > 0 THEN NULL ELSE archived_at END
      WHERE id = OLD.debt_id;
    DELETE FROM public.expenses WHERE source_debt_payment_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $function$;
