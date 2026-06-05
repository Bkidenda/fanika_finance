
-- 1. Expenses timestamp
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now();
UPDATE public.expenses SET occurred_at = (date::timestamptz + interval '12 hours') WHERE occurred_at IS NULL OR occurred_at::date <> date;

-- 2. Accounts ↔ debts linkage
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS linked_debt_id uuid;

CREATE OR REPLACE FUNCTION public.accounts_negative_creates_debt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_debt_id uuid;
BEGIN
  IF NEW.balance < 0 AND NEW.linked_debt_id IS NULL THEN
    INSERT INTO public.debts (user_id, name, creditor, kind, principal, balance, notes)
    VALUES (NEW.user_id, NEW.name || ' (overdraft)', NEW.institution, 'informal', -NEW.balance, -NEW.balance,
            'Auto-created from negative account balance')
    RETURNING id INTO v_debt_id;
    NEW.linked_debt_id := v_debt_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_accounts_negative_creates_debt ON public.accounts;
CREATE TRIGGER trg_accounts_negative_creates_debt
BEFORE INSERT ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.accounts_negative_creates_debt();

CREATE OR REPLACE FUNCTION public.accounts_sync_linked_debt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.linked_debt_id IS NOT NULL THEN
    UPDATE public.debts
       SET balance = GREATEST(0, -NEW.balance),
           archived_at = CASE WHEN -NEW.balance <= 0 THEN COALESCE(archived_at, now()) ELSE NULL END
     WHERE id = NEW.linked_debt_id;
  ELSIF NEW.balance < 0 AND OLD.linked_debt_id IS NULL THEN
    -- New negative state on existing account, create the linked debt
    DECLARE v_id uuid;
    BEGIN
      INSERT INTO public.debts (user_id, name, creditor, kind, principal, balance, notes)
      VALUES (NEW.user_id, NEW.name || ' (overdraft)', NEW.institution, 'informal', -NEW.balance, -NEW.balance,
              'Auto-created from negative account balance')
      RETURNING id INTO v_id;
      NEW.linked_debt_id := v_id;
    END;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_accounts_sync_linked_debt ON public.accounts;
CREATE TRIGGER trg_accounts_sync_linked_debt
BEFORE UPDATE OF balance ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.accounts_sync_linked_debt();

-- 3. Username uniqueness (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- 4. Fix Ziidi autosave trigger (precedence bug)
CREATE OR REPLACE FUNCTION public.expenses_mpesa_autosave()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_src_name text;
  v_rate numeric;
  v_enabled boolean;
  v_ziidi_id uuid;
  v_transfer numeric;
BEGIN
  IF NEW.skip_autosave OR NEW.account_id IS NULL THEN RETURN NEW; END IF;

  SELECT name INTO v_src_name FROM public.accounts WHERE id = NEW.account_id AND user_id = NEW.user_id;
  IF v_src_name IS NULL THEN RETURN NEW; END IF;
  IF NOT (lower(v_src_name) LIKE '%mpesa%' OR lower(v_src_name) LIKE '%m-pesa%') THEN
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
END $$;

DROP TRIGGER IF EXISTS trg_expenses_mpesa_autosave ON public.expenses;
CREATE TRIGGER trg_expenses_mpesa_autosave
AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.expenses_mpesa_autosave();

-- 5. Offerings (Charity & Giving)
CREATE TABLE IF NOT EXISTS public.offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  account_id uuid,
  note text,
  linked_expense_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offerings TO authenticated;
GRANT ALL ON public.offerings TO service_role;
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.offerings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.offerings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.offerings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.offerings FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.offerings_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_expense_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF lower(NEW.category) <> 'tithe' AND NEW.account_id IS NOT NULL AND NEW.amount > 0 THEN
      INSERT INTO public.expenses (user_id, date, amount, category, description, payment_method, account_id, is_emergency)
      VALUES (NEW.user_id, NEW.paid_on, NEW.amount, 'Charity & Giving',
              NEW.category || COALESCE(': ' || NEW.note, ''), 'Bank transfer', NEW.account_id, false)
      RETURNING id INTO v_expense_id;
      NEW.linked_expense_id := v_expense_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.linked_expense_id IS NOT NULL THEN
      DELETE FROM public.expenses WHERE id = OLD.linked_expense_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_offerings_sync_ins ON public.offerings;
CREATE TRIGGER trg_offerings_sync_ins BEFORE INSERT ON public.offerings
FOR EACH ROW EXECUTE FUNCTION public.offerings_sync();

DROP TRIGGER IF EXISTS trg_offerings_sync_del ON public.offerings;
CREATE TRIGGER trg_offerings_sync_del AFTER DELETE ON public.offerings
FOR EACH ROW EXECUTE FUNCTION public.offerings_sync();

-- 6. Family Suite
CREATE TABLE IF NOT EXISTS public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT ALL ON public.families TO service_role;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own families select" ON public.families FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "own families insert" ON public.families FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own families update" ON public.families FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "own families delete" ON public.families FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  relationship text,
  monthly_allowance numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own members select" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own members insert" ON public.family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own members update" ON public.family_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own members delete" ON public.family_members FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.family_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  account_id uuid,
  category text NOT NULL DEFAULT 'allowance',
  note text,
  linked_expense_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_contributions TO authenticated;
GRANT ALL ON public.family_contributions TO service_role;
ALTER TABLE public.family_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contrib select" ON public.family_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own contrib insert" ON public.family_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own contrib update" ON public.family_contributions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own contrib delete" ON public.family_contributions FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.family_contributions_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member_name text;
  v_expense_id uuid;
  v_label text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NOT NULL THEN
      SELECT name INTO v_member_name FROM public.family_members WHERE id = NEW.member_id;
      v_label := COALESCE(v_member_name, 'Family') || ' · ' || NEW.category;
      INSERT INTO public.expenses (user_id, date, amount, category, description, payment_method, account_id, is_emergency)
      VALUES (NEW.user_id, NEW.paid_on, NEW.amount, 'Family', v_label || COALESCE(' — ' || NEW.note, ''),
              'Bank transfer', NEW.account_id, NEW.category = 'emergency')
      RETURNING id INTO v_expense_id;
      NEW.linked_expense_id := v_expense_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.linked_expense_id IS NOT NULL THEN
      DELETE FROM public.expenses WHERE id = OLD.linked_expense_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_family_contrib_ins ON public.family_contributions;
CREATE TRIGGER trg_family_contrib_ins BEFORE INSERT ON public.family_contributions
FOR EACH ROW EXECUTE FUNCTION public.family_contributions_sync();

DROP TRIGGER IF EXISTS trg_family_contrib_del ON public.family_contributions;
CREATE TRIGGER trg_family_contrib_del AFTER DELETE ON public.family_contributions
FOR EACH ROW EXECUTE FUNCTION public.family_contributions_sync();
