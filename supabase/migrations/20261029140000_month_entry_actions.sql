begin;

create table public.financial_entry_copy_sources (
  household_id uuid not null references public.households (id) on delete cascade,
  source_entry_id uuid not null,
  target_month date not null,
  copied_entry_id uuid not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (household_id, source_entry_id)
    references public.financial_entries (household_id, id) on delete cascade,
  foreign key (household_id, copied_entry_id)
    references public.financial_entries (household_id, id) on delete cascade,
  check (target_month = date_trunc('month', target_month)::date),
  unique (household_id, source_entry_id, target_month),
  unique (household_id, copied_entry_id)
);

alter table public.financial_entry_copy_sources enable row level security;
revoke all on table public.financial_entry_copy_sources from public, anon, authenticated;

create or replace function public.copy_financial_entries_to_month(
  p_household_id uuid,
  p_target_month date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_entry record;
  copied_entry_id uuid;
  copied_count integer := 0;
  source_month date;
  copied_due_date date;
begin
  if (select auth.uid()) is null
    or not (select private.is_household_member(p_household_id)) then
    raise exception 'not authorized';
  end if;

  if p_target_month is null
    or p_target_month <> date_trunc('month', p_target_month)::date then
    raise exception 'invalid target month';
  end if;

  source_month := (p_target_month - interval '1 month')::date;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_household_id::text || ':' || p_target_month::text,
      0
    )
  );

  for source_entry in
    select
      entry.id,
      entry.title,
      entry.entry_type,
      entry.amount,
      entry.category,
      entry.due_date,
      entry.source_kind
    from public.financial_entries as entry
    where entry.household_id = p_household_id
      and entry.competence_month = source_month
      and entry.status <> 'cancelled'
      and entry.source_kind in ('manual', 'card_statement')
      and not exists (
        select 1
        from public.financial_entry_copy_sources as copied
        where copied.household_id = p_household_id
          and copied.source_entry_id = entry.id
          and copied.target_month = p_target_month
      )
    order by entry.created_at, entry.id
  loop
    copied_due_date := null;
    if source_entry.due_date is not null then
      copied_due_date := p_target_month + (
        least(
          extract(day from source_entry.due_date)::integer,
          extract(day from (p_target_month + interval '1 month - 1 day'))::integer
        ) - 1
      );
    end if;

    insert into public.financial_entries (
      household_id,
      title,
      entry_type,
      amount,
      category,
      competence_month,
      due_date,
      status,
      settled_at,
      source_kind,
      created_by
    ) values (
      p_household_id,
      source_entry.title,
      source_entry.entry_type,
      source_entry.amount,
      source_entry.category,
      p_target_month,
      copied_due_date,
      'planned',
      null,
      source_entry.source_kind,
      (select auth.uid())
    ) returning id into copied_entry_id;

    insert into public.financial_entry_copy_sources (
      household_id,
      source_entry_id,
      target_month,
      copied_entry_id,
      created_by
    ) values (
      p_household_id,
      source_entry.id,
      p_target_month,
      copied_entry_id,
      (select auth.uid())
    );
    copied_count := copied_count + 1;
  end loop;

  return copied_count;
end;
$$;

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
  entry_row record;
  deleted_count integer := 0;
begin
  if (select auth.uid()) is null
    or not (select private.is_household_member(p_household_id)) then
    raise exception 'not authorized';
  end if;

  if p_month is null or p_month <> date_trunc('month', p_month)::date then
    raise exception 'invalid month';
  end if;

  for entry_row in
    select
      id,
      household_id,
      recurring_item_id,
      installment_plan_id,
      installment_number,
      competence_month
    from public.financial_entries
    where household_id = p_household_id
      and competence_month = p_month
      and (recurring_item_id is not null or installment_plan_id is not null)
  loop
    insert into public.financial_entry_exclusions (
      household_id,
      recurring_item_id,
      installment_plan_id,
      competence_month,
      installment_number,
      created_by
    ) values (
      entry_row.household_id,
      entry_row.recurring_item_id,
      entry_row.installment_plan_id,
      entry_row.competence_month,
      entry_row.installment_number,
      (select auth.uid())
    ) on conflict do nothing;
  end loop;

  delete from public.financial_entries
  where household_id = p_household_id
    and competence_month = p_month;
  get diagnostics deleted_count = row_count;

  return deleted_count;
end;
$$;

revoke all on function public.copy_financial_entries_to_month(uuid, date) from public, anon;
revoke all on function public.delete_financial_entries_for_month(uuid, date) from public, anon;
grant execute on function public.copy_financial_entries_to_month(uuid, date) to authenticated;
grant execute on function public.delete_financial_entries_for_month(uuid, date) to authenticated;

commit;
