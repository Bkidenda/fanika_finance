
-- 1. Informal vs formal debts
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'formal';
ALTER TABLE public.debts ADD CONSTRAINT debts_kind_chk CHECK (kind IN ('formal','informal'));

-- 2. Link payments / debt payments / subscriptions to accounts
ALTER TABLE public.debt_payments ADD COLUMN IF NOT EXISTS account_id uuid;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS account_id uuid;

-- 3. Income receipts (actual money received, separate from recurring income definitions)
CREATE TABLE IF NOT EXISTS public.income_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL,
  amount numeric NOT NULL,
  account_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_entries TO authenticated;
GRANT ALL ON public.income_entries TO service_role;
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.income_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.income_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.income_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.income_entries FOR DELETE USING (auth.uid() = user_id);

-- 4. Month closures (reconciliation snapshots)
CREATE TABLE IF NOT EXISTS public.month_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL, -- 'YYYY-MM'
  closed_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(user_id, period)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.month_closures TO authenticated;
GRANT ALL ON public.month_closures TO service_role;
ALTER TABLE public.month_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.month_closures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.month_closures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.month_closures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.month_closures FOR DELETE USING (auth.uid() = user_id);

-- 5. Account balance auto-sync triggers
CREATE OR REPLACE FUNCTION public.apply_account_delta(p_account uuid, p_delta numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_account IS NULL OR p_delta = 0 THEN RETURN; END IF;
  UPDATE public.accounts SET balance = balance + p_delta WHERE id = p_account;
END; $$;

-- Expenses trigger
CREATE OR REPLACE FUNCTION public.expenses_sync_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.apply_account_delta(NEW.account_id, -NEW.amount);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.apply_account_delta(OLD.account_id, OLD.amount);
    PERFORM public.apply_account_delta(NEW.account_id, -NEW.amount);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.apply_account_delta(OLD.account_id, OLD.amount);
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS trg_expenses_sync ON public.expenses;
CREATE TRIGGER trg_expenses_sync AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.expenses_sync_account();

-- Debt payments trigger
CREATE OR REPLACE FUNCTION public.debt_payments_sync_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.apply_account_delta(NEW.account_id, -NEW.amount);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.apply_account_delta(OLD.account_id, OLD.amount);
    PERFORM public.apply_account_delta(NEW.account_id, -NEW.amount);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.apply_account_delta(OLD.account_id, OLD.amount);
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS trg_debt_payments_sync ON public.debt_payments;
CREATE TRIGGER trg_debt_payments_sync AFTER INSERT OR UPDATE OR DELETE ON public.debt_payments
  FOR EACH ROW EXECUTE FUNCTION public.debt_payments_sync_account();

-- Income entries trigger (credits account)
CREATE OR REPLACE FUNCTION public.income_entries_sync_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.apply_account_delta(NEW.account_id, NEW.amount);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.apply_account_delta(OLD.account_id, -OLD.amount);
    PERFORM public.apply_account_delta(NEW.account_id, NEW.amount);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.apply_account_delta(OLD.account_id, -OLD.amount);
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS trg_income_entries_sync ON public.income_entries;
CREATE TRIGGER trg_income_entries_sync AFTER INSERT OR UPDATE OR DELETE ON public.income_entries
  FOR EACH ROW EXECUTE FUNCTION public.income_entries_sync_account();

-- Account transfers trigger (kind = 'transfer' moves between accounts)
CREATE OR REPLACE FUNCTION public.account_transactions_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.kind = 'transfer' THEN
      PERFORM public.apply_account_delta(NEW.account_id, -ABS(NEW.amount));
      PERFORM public.apply_account_delta(NEW.to_account_id, ABS(NEW.amount));
    ELSIF NEW.kind = 'adjustment' THEN
      PERFORM public.apply_account_delta(NEW.account_id, NEW.amount);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.kind = 'transfer' THEN
      PERFORM public.apply_account_delta(OLD.account_id, ABS(OLD.amount));
      PERFORM public.apply_account_delta(OLD.to_account_id, -ABS(OLD.amount));
    ELSIF OLD.kind = 'adjustment' THEN
      PERFORM public.apply_account_delta(OLD.account_id, -OLD.amount);
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS trg_account_transactions_sync ON public.account_transactions;
CREATE TRIGGER trg_account_transactions_sync AFTER INSERT OR DELETE ON public.account_transactions
  FOR EACH ROW EXECUTE FUNCTION public.account_transactions_sync();
