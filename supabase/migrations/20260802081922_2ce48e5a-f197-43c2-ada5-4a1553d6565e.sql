REVOKE ALL ON FUNCTION public.seed_budget_split_rules_for_month(UUID, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_budget_split_rules_for_month(UUID, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.seed_budget_split_rules_for_month(UUID, DATE) TO authenticated;
