
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
