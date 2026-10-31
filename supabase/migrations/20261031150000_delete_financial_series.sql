begin;

create or replace function public.delete_financial_series(
  p_household_id uuid,
  p_series_id uuid,
  p_kind text
)
returns boolean
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

  if p_series_id is null or p_kind not in ('recurrence', 'installment') then
    raise exception 'invalid financial series';
  end if;

  if p_kind = 'recurrence' then
    update public.financial_entries
    set source_kind = 'manual',
        recurring_item_id = null
    where space_id = p_household_id
      and recurring_item_id = p_series_id;

    delete from public.recurring_items
    where space_id = p_household_id
      and id = p_series_id;
  else
    update public.financial_entries
    set source_kind = 'manual',
        installment_plan_id = null,
        installment_number = null
    where space_id = p_household_id
      and installment_plan_id = p_series_id;

    delete from public.installment_plans
    where space_id = p_household_id
      and id = p_series_id;
  end if;

  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

revoke all on function public.delete_financial_series(uuid, uuid, text)
  from public, anon;
grant execute on function public.delete_financial_series(uuid, uuid, text)
  to authenticated;

notify pgrst, 'reload schema';

commit;
