
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
