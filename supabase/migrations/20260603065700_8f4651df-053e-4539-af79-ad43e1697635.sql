
-- 1. Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS mpesa_autosave_rate numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS mpesa_autosave_enabled boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (lower(username));

-- 2. Tithe payments table
CREATE TABLE IF NOT EXISTS public.tithe_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  account_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tithe_payments TO authenticated;
GRANT ALL ON public.tithe_payments TO service_role;

ALTER TABLE public.tithe_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.tithe_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.tithe_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.tithe_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.tithe_payments FOR DELETE USING (auth.uid() = user_id);

-- 3. Debts: deposit account + auto-credit trigger
ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS deposit_account_id uuid;

CREATE OR REPLACE FUNCTION public.debts_credit_account_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deposit_account_id IS NOT NULL AND NEW.balance > 0 THEN
    PERFORM public.apply_account_delta(NEW.deposit_account_id, NEW.balance);
    INSERT INTO public.account_transactions (user_id, account_id, kind, amount, description, date)
    VALUES (NEW.user_id, NEW.deposit_account_id, 'adjustment', 0, 'Debt inflow: ' || NEW.name, CURRENT_DATE);
    -- amount=0 prevents double-counting (apply_account_delta already moved balance); row exists for audit.
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS debts_credit_account_trg ON public.debts;
CREATE TRIGGER debts_credit_account_trg
AFTER INSERT ON public.debts
FOR EACH ROW EXECUTE FUNCTION public.debts_credit_account_on_insert();

-- 4. Expenses: opt-out flag + M-Pesa → Ziidi 5% auto-transfer
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS skip_autosave boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.expenses_mpesa_autosave()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src_name text;
  v_rate numeric;
  v_enabled boolean;
  v_ziidi_id uuid;
  v_transfer numeric;
BEGIN
  IF NEW.skip_autosave OR NEW.account_id IS NULL THEN RETURN NEW; END IF;

  SELECT name INTO v_src_name FROM public.accounts WHERE id = NEW.account_id AND user_id = NEW.user_id;
  IF v_src_name IS NULL OR lower(v_src_name) NOT LIKE '%mpesa%' AND lower(v_src_name) NOT LIKE '%m-pesa%' THEN
    RETURN NEW;
  END IF;

  SELECT mpesa_autosave_rate, mpesa_autosave_enabled INTO v_rate, v_enabled
    FROM public.profiles WHERE id = NEW.user_id;
  IF NOT COALESCE(v_enabled, false) OR COALESCE(v_rate, 0) <= 0 THEN RETURN NEW; END IF;

  SELECT id INTO v_ziidi_id FROM public.accounts
    WHERE user_id = NEW.user_id AND lower(name) LIKE '%ziidi%' LIMIT 1;
  IF v_ziidi_id IS NULL OR v_ziidi_id = NEW.account_id THEN RETURN NEW; END IF;

  v_transfer := round(NEW.amount * v_rate / 100, 2);
  IF v_transfer <= 0 THEN RETURN NEW; END IF;

  INSERT INTO public.account_transactions (user_id, account_id, to_account_id, kind, amount, description, date)
  VALUES (NEW.user_id, NEW.account_id, v_ziidi_id, 'transfer', v_transfer,
          'Auto-save to Ziidi (' || v_rate || '% of M-Pesa spend)', NEW.date);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS expenses_mpesa_autosave_trg ON public.expenses;
CREATE TRIGGER expenses_mpesa_autosave_trg
AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.expenses_mpesa_autosave();

-- 5. Username helper for handle_new_user (also pull username from metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'username', '')
  );
  RETURN NEW;
END;
$$;
