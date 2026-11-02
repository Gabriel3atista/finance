begin;

create or replace function public.convert_financial_series_kind(
  p_space_id uuid,
  p_series_id uuid,
  p_from_kind text,
  p_to_kind text,
  p_title text,
  p_entry_type public.entry_type,
  p_amount numeric,
  p_category text,
  p_due_day smallint,
  p_starts_on date,
  p_ends_on date,
  p_installment_count integer,
  p_indefinite boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_series_id uuid := gen_random_uuid();
  series_created_by uuid;
  series_is_active boolean;
begin
  if (select auth.uid()) is null
    or not (select private.is_household_member(p_space_id)) then
    raise exception 'not authorized';
  end if;

  if p_series_id is null
    or p_from_kind not in ('recurrence', 'installment')
    or p_to_kind not in ('recurrence', 'installment')
    or p_from_kind = p_to_kind
    or p_title is null
    or char_length(btrim(p_title)) not between 1 and 160
    or p_entry_type is null
    or p_amount is null
    or p_amount <= 0
    or p_amount > 999999999999.99
    or p_starts_on is null
    or (p_due_day is not null and p_due_day not between 1 and 31) then
    raise exception 'invalid financial series';
  end if;

  if p_to_kind = 'installment' and (
    p_entry_type <> 'expense'
    or p_indefinite
    or p_installment_count is null
    or p_installment_count not between 1 and 600
    or p_ends_on is null
    or p_ends_on < p_starts_on
    or (
      (extract(year from p_ends_on)::integer - extract(year from p_starts_on)::integer) * 12
      + extract(month from p_ends_on)::integer
      - extract(month from p_starts_on)::integer
      + 1
    ) <> p_installment_count
  ) then
    raise exception 'invalid installment plan';
  end if;

  if p_to_kind = 'recurrence' and not p_indefinite and (
    p_ends_on is null or p_ends_on < p_starts_on
  ) then
    raise exception 'invalid recurrence period';
  end if;

  if p_from_kind = 'recurrence' then
    select created_by, is_active
    into series_created_by, series_is_active
    from public.recurring_items
    where space_id = p_space_id and id = p_series_id
    for update;
  else
    select created_by, is_active
    into series_created_by, series_is_active
    from public.installment_plans
    where space_id = p_space_id and id = p_series_id
    for update;
  end if;

  if series_created_by is null then
    raise exception 'financial series not found';
  end if;

  if p_to_kind = 'installment' then
    insert into public.installment_plans (
      id,
      space_id,
      title,
      total_amount,
      installment_count,
      starts_on,
      ends_on,
      due_day,
      category,
      is_active,
      created_by
    ) values (
      new_series_id,
      p_space_id,
      p_title,
      p_amount,
      p_installment_count,
      p_starts_on,
      p_ends_on,
      p_due_day,
      p_category,
      series_is_active,
      series_created_by
    );

    if p_from_kind = 'recurrence' then
      insert into public.financial_entry_exclusions (
        space_id,
        recurring_item_id,
        installment_plan_id,
        competence_month,
        installment_number,
        created_by
      )
      select
        exclusion.space_id,
        null,
        new_series_id,
        exclusion.competence_month,
        (
          (extract(year from exclusion.competence_month)::integer - extract(year from p_starts_on)::integer) * 12
          + extract(month from exclusion.competence_month)::integer
          - extract(month from p_starts_on)::integer
          + 1
        ),
        exclusion.created_by
      from public.financial_entry_exclusions as exclusion
      where exclusion.space_id = p_space_id
        and exclusion.recurring_item_id = p_series_id
        and date_trunc('month', exclusion.competence_month)::date >= date_trunc('month', p_starts_on)::date
        and date_trunc('month', exclusion.competence_month)::date <= date_trunc('month', p_ends_on)::date
      on conflict do nothing;

      with matching_entries as (
        select
          entry.id,
          (
            (extract(year from entry.competence_month)::integer - extract(year from p_starts_on)::integer) * 12
            + extract(month from entry.competence_month)::integer
            - extract(month from p_starts_on)::integer
            + 1
          ) as installment_number
        from public.financial_entries as entry
        where entry.space_id = p_space_id
          and entry.recurring_item_id = p_series_id
          and date_trunc('month', entry.competence_month)::date >= date_trunc('month', p_starts_on)::date
          and date_trunc('month', entry.competence_month)::date <= date_trunc('month', p_ends_on)::date
      )
      update public.financial_entries as entry
      set source_kind = 'installment',
          recurring_item_id = null,
          installment_plan_id = new_series_id,
          installment_number = matching_entries.installment_number
      from matching_entries
      where entry.id = matching_entries.id
        and matching_entries.installment_number between 1 and p_installment_count;

      update public.financial_entries
      set source_kind = 'manual',
          recurring_item_id = null
      where space_id = p_space_id
        and recurring_item_id = p_series_id;

      delete from public.recurring_items
      where space_id = p_space_id and id = p_series_id;
    else
      insert into public.financial_entry_exclusions (
        space_id,
        recurring_item_id,
        installment_plan_id,
        competence_month,
        installment_number,
        created_by
      )
      select
        exclusion.space_id,
        null,
        new_series_id,
        exclusion.competence_month,
        exclusion.installment_number,
        exclusion.created_by
      from public.financial_entry_exclusions as exclusion
      where exclusion.space_id = p_space_id
        and exclusion.installment_plan_id = p_series_id
        and date_trunc('month', exclusion.competence_month)::date >= date_trunc('month', p_starts_on)::date
        and date_trunc('month', exclusion.competence_month)::date <= date_trunc('month', p_ends_on)::date
      on conflict do nothing;

      update public.financial_entries
      set source_kind = 'installment',
          recurring_item_id = null,
          installment_plan_id = new_series_id
      where space_id = p_space_id
        and installment_plan_id = p_series_id
        and date_trunc('month', competence_month)::date >= date_trunc('month', p_starts_on)::date
        and date_trunc('month', competence_month)::date <= date_trunc('month', p_ends_on)::date;

      update public.financial_entries
      set source_kind = 'manual',
          installment_plan_id = null,
          installment_number = null
      where space_id = p_space_id
        and installment_plan_id = p_series_id;

      delete from public.installment_plans
      where space_id = p_space_id and id = p_series_id;
    end if;
  else
    insert into public.recurring_items (
      id,
      space_id,
      title,
      entry_type,
      planned_amount,
      category,
      due_day,
      starts_on,
      ends_on,
      is_active,
      created_by
    ) values (
      new_series_id,
      p_space_id,
      p_title,
      p_entry_type,
      p_amount,
      p_category,
      p_due_day,
      p_starts_on,
      case when p_indefinite then null else p_ends_on end,
      series_is_active,
      series_created_by
    );

    if p_from_kind = 'installment' then
      insert into public.financial_entry_exclusions (
        space_id,
        recurring_item_id,
        installment_plan_id,
        competence_month,
        installment_number,
        created_by
      )
      select
        exclusion.space_id,
        new_series_id,
        null,
        exclusion.competence_month,
        null,
        exclusion.created_by
      from public.financial_entry_exclusions as exclusion
      where exclusion.space_id = p_space_id
        and exclusion.installment_plan_id = p_series_id
        and date_trunc('month', exclusion.competence_month)::date >= date_trunc('month', p_starts_on)::date
        and (
          p_indefinite
          or date_trunc('month', exclusion.competence_month)::date <= date_trunc('month', p_ends_on)::date
        )
      on conflict do nothing;

      update public.financial_entries
      set source_kind = 'recurrence',
          recurring_item_id = new_series_id,
          installment_plan_id = null,
          installment_number = null
      where space_id = p_space_id
        and installment_plan_id = p_series_id
        and date_trunc('month', competence_month)::date >= date_trunc('month', p_starts_on)::date
        and (
          p_indefinite
          or date_trunc('month', competence_month)::date <= date_trunc('month', p_ends_on)::date
        );

      update public.financial_entries
      set source_kind = 'manual',
          installment_plan_id = null,
          installment_number = null
      where space_id = p_space_id
        and installment_plan_id = p_series_id;

      delete from public.installment_plans
      where space_id = p_space_id and id = p_series_id;
    else
      raise exception 'unsupported series conversion';
    end if;
  end if;

  return true;
end;
$$;

revoke all on function public.convert_financial_series_kind(
  uuid, uuid, text, text, text, public.entry_type, numeric, text,
  smallint, date, date, integer, boolean
) from public, anon;
grant execute on function public.convert_financial_series_kind(
  uuid, uuid, text, text, text, public.entry_type, numeric, text,
  smallint, date, date, integer, boolean
) to authenticated;

notify pgrst, 'reload schema';

commit;
