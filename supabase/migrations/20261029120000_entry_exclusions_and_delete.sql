begin;

create table public.financial_entry_exclusions (
  household_id uuid not null references public.households (id) on delete cascade,
  recurring_item_id uuid,
  installment_plan_id uuid,
  competence_month date not null,
  installment_number integer,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (household_id, recurring_item_id)
    references public.recurring_items (household_id, id) on delete cascade,
  foreign key (household_id, installment_plan_id)
    references public.installment_plans (household_id, id) on delete cascade,
  check (
    (recurring_item_id is not null and installment_plan_id is null and installment_number is null)
    or (recurring_item_id is null and installment_plan_id is not null and installment_number is not null and installment_number > 0)
  ),
  check (competence_month = date_trunc('month', competence_month)::date)
);

create unique index financial_entry_exclusions_recurrence_idx
  on public.financial_entry_exclusions (household_id, recurring_item_id, competence_month)
  where recurring_item_id is not null;
create unique index financial_entry_exclusions_installment_idx
  on public.financial_entry_exclusions (household_id, installment_plan_id, installment_number)
  where installment_plan_id is not null;

alter table public.financial_entry_exclusions enable row level security;
revoke all on table public.financial_entry_exclusions from public, anon, authenticated;
grant select, insert on table public.financial_entry_exclusions to authenticated;

create policy financial_entry_exclusions_read_member
  on public.financial_entry_exclusions for select to authenticated
  using ((select private.is_household_member(household_id)));
create policy financial_entry_exclusions_insert_member
  on public.financial_entry_exclusions for insert to authenticated
  with check (
    (select private.is_household_member(household_id))
    and created_by = (select auth.uid())
  );

grant select, insert, update, delete on table public.financial_entries to authenticated;
create policy financial_entries_delete_member
  on public.financial_entries for delete to authenticated
  using ((select private.is_household_member(household_id)));

create or replace function public.delete_financial_entry(p_entry_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  entry_row record;
begin
  select
    id, household_id, recurring_item_id, installment_plan_id,
    installment_number, competence_month
  into entry_row
  from public.financial_entries
  where id = p_entry_id
  for update;

  if not found then
    return false;
  end if;

  if entry_row.recurring_item_id is not null
    or entry_row.installment_plan_id is not null then
    insert into public.financial_entry_exclusions (
      household_id, recurring_item_id, installment_plan_id, competence_month,
      installment_number, created_by
    ) values (
      entry_row.household_id, entry_row.recurring_item_id,
      entry_row.installment_plan_id, entry_row.competence_month,
      entry_row.installment_number, (select auth.uid())
    ) on conflict do nothing;
  end if;

  delete from public.financial_entries
  where household_id = entry_row.household_id
    and id = entry_row.id;

  return found;
end;
$$;

revoke all on function public.delete_financial_entry(uuid) from public, anon;
grant execute on function public.delete_financial_entry(uuid) to authenticated;

commit;
