-- Migration: 20260526074856_29608a2c-ae92-4d83-9ec9-f232b3fea892.sql


-- Enums
CREATE TYPE public.deduction_type AS ENUM ('statutory','custom');
CREATE TYPE public.rule_type AS ENUM ('fixed','percentage');
CREATE TYPE public.frequency_type AS ENUM ('monthly','annual','one_time');
CREATE TYPE public.investment_type AS ENUM ('savings','sacco','stocks','crypto','bonds','fixed_deposit','business','other');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  currency TEXT NOT NULL DEFAULT 'KES',
  gross_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  frequency public.frequency_type NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.deduction_type NOT NULL,
  name TEXT NOT NULL,
  rule public.rule_type NOT NULL DEFAULT 'fixed',
  value NUMERIC(14,4) NOT NULL DEFAULT 0,
  frequency public.frequency_type NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  month DATE NOT NULL,
  limit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, month)
);

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(14,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.investment_type NOT NULL DEFAULT 'savings',
  institution TEXT,
  amount_invested NUMERIC(14,2) NOT NULL DEFAULT 0,
  current_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL,
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verse TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  egw_quote TEXT NOT NULL,
  egw_source TEXT,
  reflection TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed devotionals
INSERT INTO public.devotionals (verse, verse_reference, egw_quote, egw_source, reflection, tag) VALUES
('Bring ye all the tithes into the storehouse, that there may be meat in mine house, and prove me now herewith, saith the Lord of hosts, if I will not open you the windows of heaven.', 'Malachi 3:10', 'A faithful return of tithe is a part of the worship that we owe to God.', 'Counsels on Stewardship, p. 81', 'Stewardship begins with returning what is already God''s. Notice how He invites you to test Him.', 'giving'),
('Honor the Lord with your wealth, with the firstfruits of all your crops.', 'Proverbs 3:9', 'God is the giver of every good gift. He intends that there shall be order and harmony in the distribution of His blessings.', 'Counsels on Stewardship, p. 65', 'Plan your finances before spending, so the first portion always honors God.', 'budgeting'),
('The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.', 'Proverbs 21:5', 'Economy is a virtue worthy of being cultivated by every Christian.', 'Counsels on Stewardship, p. 250', 'Slow, steady discipline beats impulsive spending every time.', 'discipline'),
('Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap.', 'Luke 6:38', 'No one can fail to be benefited by giving. He who gives most receives most in return.', 'Acts of the Apostles, p. 339', 'Generosity is a habit of the heart; small consistent giving compounds.', 'generosity'),
('My God shall supply all your need according to his riches in glory by Christ Jesus.', 'Philippians 4:19', 'Trust in the Lord, and rest in Him; let nothing rob you of your faith.', 'Ministry of Healing, p. 481', 'Financial stress is real, yet provision is promised. Lean on Him.', 'trust'),
('For which of you, intending to build a tower, sitteth not down first, and counteth the cost?', 'Luke 14:28', 'Economy in the use of money is excellent. The careful and frugal use of money is a duty.', 'Counsels on Stewardship, p. 249', 'Budgets are the disciple''s blueprint—count the cost before spending.', 'budgeting'),
('A good man leaveth an inheritance to his children''s children.', 'Proverbs 13:22', 'Parents should provide for their children, but should not lavish upon them money for selfish gratification.', 'Adventist Home, p. 391', 'Building wealth is not selfish when it''s done to bless future generations.', 'investing'),
('Cast thy bread upon the waters: for thou shalt find it after many days.', 'Ecclesiastes 11:1', 'Be not weary in well doing, for in due season ye shall reap, if ye faint not.', 'Christian Service, p. 86', 'Faithful saving and giving today produce a future harvest.', 'savings'),
('The borrower is slave to the lender.', 'Proverbs 22:7', 'Keep out of debt. Do not borrow unless you can see the way clear to pay back.', 'Counsels on Stewardship, p. 254', 'Freedom from debt is freedom to serve. Make a plan to be free.', 'discipline'),
('Where your treasure is, there will your heart be also.', 'Matthew 6:21', 'Money has great value, because it can do great good. In the hands of God''s children it is food for the hungry.', 'Counsels on Stewardship, p. 137', 'Look at your spending—it tells the true story of what you love.', 'general');

-- has_role pattern reserved for future. Not needed for v1.

-- Trigger function: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;

-- Owner-only policies
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['incomes','deductions','budgets','expenses','investments','savings_goals']) LOOP
    EXECUTE format('CREATE POLICY "own select" ON public.%I FOR SELECT USING (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own update" ON public.%I FOR UPDATE USING (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own delete" ON public.%I FOR DELETE USING (auth.uid() = user_id);', t);
  END LOOP;
END $$;

-- Devotionals: any authenticated user can read
CREATE POLICY "devotionals read" ON public.devotionals FOR SELECT TO authenticated USING (true);

-- Migration: 20260526074911_c2a5e01e-2b7e-44d3-8209-d4478c5f905d.sql


CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- handle_new_user must stay SECURITY DEFINER to insert into profiles on signup,
-- but revoke direct execute from public roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Migration: 20260527001648_8e8ad6f3-db12-44ec-8eb2-e6bf3809c5f9.sql


-- Profile enhancements
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tithe_base text NOT NULL DEFAULT 'gross' CHECK (tithe_base IN ('gross','net')),
  ADD COLUMN IF NOT EXISTS is_resident boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS nssf_mode text NOT NULL DEFAULT 'tiered' CHECK (nssf_mode IN ('simple','tiered'));

-- Emergency expenses
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_id uuid;

-- Accounts
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank','mpesa','cash','sacco','investment','other')),
  institution text,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.accounts FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "own insert" ON public.accounts FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "own update" ON public.accounts FOR UPDATE USING (auth.uid()=user_id);
CREATE POLICY "own delete" ON public.accounts FOR DELETE USING (auth.uid()=user_id);

-- Account transactions
CREATE TABLE IF NOT EXISTS public.account_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  to_account_id uuid,
  kind text NOT NULL CHECK (kind IN ('deposit','withdrawal','transfer')),
  amount numeric NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_transactions TO authenticated;
GRANT ALL ON public.account_transactions TO service_role;
ALTER TABLE public.account_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.account_transactions FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "own insert" ON public.account_transactions FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "own update" ON public.account_transactions FOR UPDATE USING (auth.uid()=user_id);
CREATE POLICY "own delete" ON public.account_transactions FOR DELETE USING (auth.uid()=user_id);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Subscriptions',
  amount numeric NOT NULL DEFAULT 0,
  cycle text NOT NULL DEFAULT 'monthly' CHECK (cycle IN ('weekly','monthly','quarterly','annual')),
  next_charge date,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.subscriptions FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "own insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "own update" ON public.subscriptions FOR UPDATE USING (auth.uid()=user_id);
CREATE POLICY "own delete" ON public.subscriptions FOR DELETE USING (auth.uid()=user_id);

-- Debts
CREATE TABLE IF NOT EXISTS public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  creditor text,
  principal numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0,
  monthly_payment numeric NOT NULL DEFAULT 0,
  start_date date,
  due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debts TO authenticated;
GRANT ALL ON public.debts TO service_role;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.debts FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "own insert" ON public.debts FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "own update" ON public.debts FOR UPDATE USING (auth.uid()=user_id);
CREATE POLICY "own delete" ON public.debts FOR DELETE USING (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  debt_id uuid NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.debt_payments TO authenticated;
GRANT ALL ON public.debt_payments TO service_role;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.debt_payments FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "own insert" ON public.debt_payments FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "own update" ON public.debt_payments FOR UPDATE USING (auth.uid()=user_id);
CREATE POLICY "own delete" ON public.debt_payments FOR DELETE USING (auth.uid()=user_id);

-- AI insights cache
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'monthly',
  period text NOT NULL,
  score integer,
  summary text NOT NULL,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.ai_insights FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "own insert" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "own update" ON public.ai_insights FOR UPDATE USING (auth.uid()=user_id);
CREATE POLICY "own delete" ON public.ai_insights FOR DELETE USING (auth.uid()=user_id);

-- Migration: 20260528082451_a9039074-d7b6-429c-b8a7-0cee170d2682.sql


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

-- Migration: 20260528082504_e7320f65-18fb-420d-bf2c-e4cb9a1cfbc8.sql


REVOKE EXECUTE ON FUNCTION public.apply_account_delta(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expenses_sync_account() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debt_payments_sync_account() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.income_entries_sync_account() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.account_transactions_sync() FROM PUBLIC, anon, authenticated;

-- Migration: 20260529072323_ab681c75-53be-4ed1-b1f8-3abb526fd1e9.sql

-- Rename gross_income to net_income on profiles (multi-country, no statutory engine)
ALTER TABLE public.profiles RENAME COLUMN gross_income TO net_income;
-- Drop Kenya-specific statutory fields (no longer used)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS nssf_mode;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_resident;
-- tithe_base now always implicitly "net" (since we removed gross); drop column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tithe_base;

-- Refresh devotionals with short, verified attributions
DELETE FROM public.devotionals;
INSERT INTO public.devotionals (verse, verse_reference, egw_quote, egw_source, reflection, tag) VALUES
('Honour the Lord with thy substance, and with the firstfruits of all thine increase.', 'Proverbs 3:9 (KJV)', 'Every man is a steward of God.', 'Christ''s Object Lessons, chap. "Talents" (1900, public domain)', 'Stewardship begins with acknowledging that nothing we hold is truly ours — we are managers, not owners.', 'Stewardship'),
('Will a man rob God? Yet ye have robbed me. But ye say, Wherein have we robbed thee? In tithes and offerings.', 'Malachi 3:8 (KJV)', 'Money has great value, because it can do great good.', 'Christ''s Object Lessons, chap. "Talents" (1900, public domain)', 'Money is a tool for kingdom good — returning the tithe trains the heart to hold the rest with open hands.', 'Tithing'),
('The rich ruleth over the poor, and the borrower is servant to the lender.', 'Proverbs 22:7 (KJV)', 'It is a sin to live beyond our means.', 'The Adventist Home, chap. 32 (1952; underlying counsels are public domain)', 'Debt is a quiet master. Living within our means is one of the most spiritual financial disciplines we can practise.', 'Debt'),
('Let your conversation be without covetousness; and be content with such things as ye have.', 'Hebrews 13:5 (KJV)', 'Contentment is great gain.', 'paraphrasing 1 Timothy 6:6 in EGW devotional writings', 'Contentment is not the absence of ambition — it is the discipline of gratitude that prevents money from owning us.', 'Contentment');-- Migration: 20260531005943_32b32c8a-4a6e-49b0-a214-e90c97c6899e.sql

CREATE TABLE public.financial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'reminder',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_events TO authenticated;
GRANT ALL ON public.financial_events TO service_role;
ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.financial_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.financial_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.financial_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.financial_events FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX financial_events_user_date_idx ON public.financial_events(user_id, date);-- Migration: 20260601094527_0b5a8b6c-5faa-41e6-867d-72924054b9b5.sql


-- 1. Profile: tithe settings + active flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tithe_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tithe_rate numeric NOT NULL DEFAULT 0.10,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2. Income entry: optional per-entry tithe override
ALTER TABLE public.income_entries
  ADD COLUMN IF NOT EXISTS tithe_on boolean;

-- 3. Recurring budget envelopes (e.g. rent) that auto-seed each new month
CREATE TABLE IF NOT EXISTS public.recurring_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  start_month date NOT NULL,
  end_month date,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_budgets TO authenticated;
GRANT ALL ON public.recurring_budgets TO service_role;

ALTER TABLE public.recurring_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.recurring_budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.recurring_budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.recurring_budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.recurring_budgets FOR DELETE USING (auth.uid() = user_id);

-- 4. One-time wipe for bkidenda@gmail.com so June starts clean. Auth row preserved.
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'bkidenda@gmail.com' LIMIT 1;
  IF uid IS NOT NULL THEN
    DELETE FROM public.account_transactions WHERE user_id = uid;
    DELETE FROM public.debt_payments        WHERE user_id = uid;
    DELETE FROM public.expenses             WHERE user_id = uid;
    DELETE FROM public.income_entries       WHERE user_id = uid;
    DELETE FROM public.incomes              WHERE user_id = uid;
    DELETE FROM public.budgets              WHERE user_id = uid;
    DELETE FROM public.recurring_budgets    WHERE user_id = uid;
    DELETE FROM public.subscriptions        WHERE user_id = uid;
    DELETE FROM public.savings_goals        WHERE user_id = uid;
    DELETE FROM public.debts                WHERE user_id = uid;
    DELETE FROM public.investments          WHERE user_id = uid;
    DELETE FROM public.accounts             WHERE user_id = uid;
    DELETE FROM public.ai_insights          WHERE user_id = uid;
    DELETE FROM public.month_closures       WHERE user_id = uid;
    DELETE FROM public.financial_events     WHERE user_id = uid;
    DELETE FROM public.deductions           WHERE user_id = uid;
    UPDATE public.profiles SET net_income = 0 WHERE id = uid;
  END IF;
END $$;

-- Migration: 20260602055713_2611afef-f360-400a-a772-21f44b497e7c.sql


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

-- Migration: 20260603065700_8f4651df-053e-4539-af79-ad43e1697635.sql


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

-- Migration: 20260603065713_cd8fdd92-e1ba-41cb-a9fe-609990b28121.sql


REVOKE EXECUTE ON FUNCTION public.debts_credit_account_on_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expenses_mpesa_autosave() FROM PUBLIC, anon, authenticated;

-- Migration: 20260604085507_8f6cb3c4-be58-48d2-972d-efd19ff0c8c2.sql

ALTER TABLE public.account_transactions DROP CONSTRAINT IF EXISTS account_transactions_kind_check;
ALTER TABLE public.account_transactions ADD CONSTRAINT account_transactions_kind_check
  CHECK (kind = ANY (ARRAY['deposit','withdrawal','transfer','adjustment','debt_inflow','auto_ziidi','manual_adjustment']));-- Migration: 20260605045817_c488a426-3bb0-439d-8678-4bcc6d4d734e.sql


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

-- Migration: 20260605045834_18e73a41-835c-4d4e-8c46-cccf2b427d30.sql


REVOKE EXECUTE ON FUNCTION public.accounts_negative_creates_debt() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.accounts_sync_linked_debt() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.offerings_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.family_contributions_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expenses_mpesa_autosave() FROM PUBLIC, anon, authenticated;

-- Migration: 20260701124748_9d60b981-a349-46c4-a715-b0451b35fbac.sql


-- 1. Add family_plan_enabled to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS family_plan_enabled boolean NOT NULL DEFAULT false;

-- 2. Extend family_members with new fields for the Family Hub
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('spouse','child','other'));
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS avatar_colour text DEFAULT 'teal';
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS pocket_money numeric NOT NULL DEFAULT 0;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','shared'));

-- 3. Child entries
CREATE TABLE IF NOT EXISTS public.child_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense','saving','giving')),
  amount numeric NOT NULL,
  category text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_entries TO authenticated;
GRANT ALL ON public.child_entries TO service_role;
ALTER TABLE public.child_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own child_entries" ON public.child_entries FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 4. Child goals
CREATE TABLE IF NOT EXISTS public.child_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_goals TO authenticated;
GRANT ALL ON public.child_goals TO service_role;
ALTER TABLE public.child_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own child_goals" ON public.child_goals FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Migration: 20260702093526_b96b3e8b-4137-47bb-b484-4c0b664634b9.sql


ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS budgets_user_month_idx ON public.budgets (user_id, month);

-- Migration: 20260703061742_3f929c13-0eb1-4fde-ad4b-86a3bd9e3639.sql


-- Profile: avatar + display name
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Subscriptions: track last charge for automation idempotency
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_charged date;

-- Debts: link to an account so an existing bank loan can be shown as negative balance
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS linked_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Family invites & roles
CREATE TABLE IF NOT EXISTS public.family_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_invites TO authenticated;
GRANT ALL ON public.family_invites TO service_role;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites owner rw" ON public.family_invites FOR ALL
  USING (invited_by = auth.uid()) WITH CHECK (invited_by = auth.uid());

-- Family chores with monetary rewards
CREATE TABLE IF NOT EXISTS public.family_chores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  title text NOT NULL,
  reward numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_chores TO authenticated;
GRANT ALL ON public.family_chores TO service_role;
ALTER TABLE public.family_chores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chores owner rw" ON public.family_chores FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Migration: 20260703061918_996f4bf8-6210-409e-8113-2340c975e658.sql


CREATE POLICY "avatars own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "avatars own write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "avatars own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "avatars own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());
