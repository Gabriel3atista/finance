begin;

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
  copied_title text;
  target_installment_number integer;
  plan_installment_count integer;
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
      entry.source_kind,
      entry.recurring_item_id,
      entry.installment_plan_id
    from public.financial_entries as entry
    where entry.household_id = p_household_id
      and entry.competence_month = source_month
      and entry.status <> 'cancelled'
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

    copied_entry_id := null;
    copied_title := source_entry.title;
    target_installment_number := null;
    plan_installment_count := null;

    if source_entry.source_kind = 'recurrence' then
      select entry.id
      into copied_entry_id
      from public.financial_entries as entry
      where entry.household_id = p_household_id
        and entry.recurring_item_id = source_entry.recurring_item_id
        and entry.competence_month = p_target_month;
    elsif source_entry.source_kind = 'installment' then
      select entry.id, entry.installment_number
      into copied_entry_id, target_installment_number
      from public.financial_entries as entry
      where entry.household_id = p_household_id
        and entry.installment_plan_id = source_entry.installment_plan_id
        and entry.competence_month = p_target_month;

      if copied_entry_id is not null then
        select plan.installment_count
        into plan_installment_count
        from public.installment_plans as plan
        where plan.household_id = p_household_id
          and plan.id = source_entry.installment_plan_id;

        if plan_installment_count is not null then
          copied_title := pg_catalog.regexp_replace(
            source_entry.title,
            '\([0-9]+/[0-9]+\)$',
            '(' || target_installment_number || '/' || plan_installment_count || ')'
          );
        end if;
      end if;
    end if;

    if copied_entry_id is null then
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
        copied_title,
        source_entry.entry_type,
        source_entry.amount,
        source_entry.category,
        p_target_month,
        copied_due_date,
        'planned',
        null,
        case
          when source_entry.source_kind in ('manual', 'card_statement')
            then source_entry.source_kind
          else 'manual'::public.entry_source_kind
        end,
        (select auth.uid())
      ) returning id into copied_entry_id;
    else
      update public.financial_entries
      set
        title = copied_title,
        entry_type = source_entry.entry_type,
        amount = source_entry.amount,
        category = source_entry.category,
        due_date = copied_due_date,
        status = 'planned',
        settled_at = null
      where household_id = p_household_id
        and id = copied_entry_id;
    end if;

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

revoke all on function public.copy_financial_entries_to_month(uuid, date) from public, anon;
grant execute on function public.copy_financial_entries_to_month(uuid, date) to authenticated;

commit;
