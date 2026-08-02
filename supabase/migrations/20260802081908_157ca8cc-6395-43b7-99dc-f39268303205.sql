CREATE TABLE IF NOT EXISTS public.budget_split_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  percentage NUMERIC NOT NULL DEFAULT 0,
  base_type TEXT NOT NULL DEFAULT 'disposable',
  month DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT budget_split_rules_base_type_check CHECK (base_type IN ('income','disposable')),
  CONSTRAINT budget_split_rules_unique UNIQUE (user_id, category, month, base_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_split_rules TO authenticated;
GRANT ALL ON public.budget_split_rules TO service_role;

ALTER TABLE public.budget_split_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own split rules"
ON public.budget_split_rules FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_budget_split_rules_updated_at ON public.budget_split_rules;
CREATE TRIGGER update_budget_split_rules_updated_at
BEFORE UPDATE ON public.budget_split_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.seed_budget_split_rules_for_month(p_user_id UUID, p_target_month DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month DATE := date_trunc('month', p_target_month)::date;
  v_source DATE;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF EXISTS (SELECT 1 FROM public.budget_split_rules WHERE user_id = p_user_id AND month = v_month) THEN
    RETURN;
  END IF;

  SELECT max(month) INTO v_source
  FROM public.budget_split_rules
  WHERE user_id = p_user_id AND month < v_month AND active;

  IF v_source IS NOT NULL THEN
    INSERT INTO public.budget_split_rules (user_id, category, percentage, base_type, month, active, notes)
    SELECT user_id, category, percentage, base_type, v_month, true, notes
    FROM public.budget_split_rules
    WHERE user_id = p_user_id AND month = v_source AND active
    ON CONFLICT (user_id, category, month, base_type) DO NOTHING;
  ELSE
    INSERT INTO public.budget_split_rules (user_id, category, percentage, base_type, month, active, notes)
    VALUES
      (p_user_id, 'Savings', 20, 'disposable', v_month, true, 'Default split'),
      (p_user_id, 'Rent', 25, 'disposable', v_month, true, 'Default split'),
      (p_user_id, 'Food & Groceries', 15, 'disposable', v_month, true, 'Default split'),
      (p_user_id, 'Transport', 10, 'disposable', v_month, true, 'Default split'),
      (p_user_id, 'Charity & Giving', 5, 'disposable', v_month, true, 'Default split')
    ON CONFLICT (user_id, category, month, base_type) DO NOTHING;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_budget_split_rules_for_month(UUID, DATE) TO authenticated;
