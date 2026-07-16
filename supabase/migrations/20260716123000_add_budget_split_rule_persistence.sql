create or replace function public.seed_budget_split_rules_for_month(p_user_id uuid, p_target_month text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  source_month text;
begin
  if p_user_id is null or p_target_month is null then
    return;
  end if;

  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'unauthorized';
  end if;

  if exists (
    select 1
    from public.budget_split_rules
    where user_id = p_user_id
      and month = p_target_month
      and active = true
  ) then
    return;
  end if;

  select max(month)
  into source_month
  from public.budget_split_rules
  where user_id = p_user_id
    and active = true
    and month < p_target_month;

  if source_month is null then
    return;
  end if;

  insert into public.budget_split_rules (
    user_id,
    category,
    percentage,
    base_type,
    month,
    active,
    notes
  )
  select
    p_user_id,
    category,
    percentage,
    base_type,
    p_target_month,
    true,
    notes
  from public.budget_split_rules
  where user_id = p_user_id
    and month = source_month
    and active = true
  on conflict (user_id, category, month, base_type) do nothing;
end;
$$;

grant execute on function public.seed_budget_split_rules_for_month(uuid, text) to authenticated;
