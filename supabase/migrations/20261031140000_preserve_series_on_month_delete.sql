begin;

create or replace function public.delete_financial_entries_for_month(
  p_household_id uuid,
  p_month date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer := 0;
begin
  if (select auth.uid()) is null
    or not (select private.is_household_member(p_household_id)) then
    raise exception 'not authorized';
  end if;

  if p_month is null or p_month <> date_trunc('month', p_month)::date then
    raise exception 'invalid month';
  end if;

  delete from public.financial_entries
  where space_id = p_household_id
    and competence_month = p_month
    and recurring_item_id is null
    and installment_plan_id is null;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_financial_entries_for_month(uuid, date)
  from public, anon;
grant execute on function public.delete_financial_entries_for_month(uuid, date)
  to authenticated;

notify pgrst, 'reload schema';

commit;
