CREATE TABLE IF NOT EXISTS public.budget_split_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  percentage numeric(6,2) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  base_type text NOT NULL DEFAULT 'income' CHECK (base_type IN ('income', 'disposable')),
  month text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, month, base_type)
);

CREATE INDEX IF NOT EXISTS budget_split_rules_user_month_idx
  ON public.budget_split_rules (user_id, month, active);

ALTER TABLE public.budget_split_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.budget_split_rules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.budget_split_rules FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.budget_split_rules FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.budget_split_rules FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
