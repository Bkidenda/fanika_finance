CREATE OR REPLACE FUNCTION public.seed_budget_split_rules_for_month(p_user_id UUID, p_target_month DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
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

REVOKE ALL ON FUNCTION public.seed_budget_split_rules_for_month(UUID, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_budget_split_rules_for_month(UUID, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.seed_budget_split_rules_for_month(UUID, DATE) TO authenticated;
