begin;

alter table public.financial_entries
  add column source_cell text;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_catalog.pg_constraint
    where conrelid = 'public.financial_entries'::regclass
      and contype = 'c'
      and pg_catalog.pg_get_constraintdef(oid) like '%settled_at%'
  loop
    execute pg_catalog.format(
      'alter table public.financial_entries drop constraint %I',
      constraint_name
    );
  end loop;

  for constraint_name in
    select conname
    from pg_catalog.pg_constraint
    where conrelid = 'public.financial_entries'::regclass
      and contype = 'c'
      and pg_catalog.pg_get_constraintdef(oid) like '%historical_import%'
      and pg_catalog.pg_get_constraintdef(oid) like '%source_row%'
  loop
    execute pg_catalog.format(
      'alter table public.financial_entries drop constraint %I',
      constraint_name
    );
  end loop;
end;
$$;

alter table public.financial_entries
  add constraint financial_entries_settlement_date_check
  check (
    (status = 'settled' and (settled_at is not null or source_kind = 'historical_import'))
    or (status <> 'settled' and settled_at is null)
  );

alter table public.financial_entries
  add constraint financial_entries_source_provenance_check
  check (
    (source_kind = 'recurrence'
      and recurring_item_id is not null
      and installment_plan_id is null and installment_number is null
      and import_batch_id is null and source_sheet is null and source_row is null and source_cell is null)
    or (source_kind = 'installment'
      and recurring_item_id is null
      and installment_plan_id is not null and installment_number is not null and installment_number > 0
      and import_batch_id is null and source_sheet is null and source_row is null and source_cell is null)
    or (source_kind = 'historical_import'
      and recurring_item_id is null and installment_plan_id is null and installment_number is null
      and import_batch_id is not null and source_sheet is not null and source_row is not null and source_row > 0
      and source_cell is not null and source_cell ~ '^[A-Z]{1,3}[1-9][0-9]*$')
    or (source_kind in ('manual', 'card_statement')
      and recurring_item_id is null and installment_plan_id is null and installment_number is null
      and import_batch_id is null and source_sheet is null and source_row is null and source_cell is null)
  );

drop index if exists public.financial_entries_import_source_row_idx;
create unique index financial_entries_import_source_cell_idx
  on public.financial_entries (import_batch_id, source_sheet, source_cell)
  where import_batch_id is not null;

create or replace function public.commit_historical_import(
  p_household_id uuid,
  p_source_file_name text,
  p_source_file_sha256 text,
  p_entries jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  batch_id uuid;
  batch_status text;
  inserted_count integer;
  existing_count integer;
  entry_record jsonb;
  entry_month date;
  entry_due_date date;
  entry_amount numeric(14, 2);
begin
  if not (select private.is_household_member(p_household_id)) then
    raise exception using errcode = '42501', message = 'Household access denied';
  end if;

  if p_source_file_name is null
    or char_length(btrim(p_source_file_name)) not between 1 and 255
    or p_source_file_sha256 is null
    or p_source_file_sha256 !~ '^[0-9a-f]{64}$'
    or jsonb_typeof(p_entries) <> 'array'
    or jsonb_array_length(p_entries) < 1
    or jsonb_array_length(p_entries) > 2000 then
    raise exception using errcode = '22023', message = 'Invalid import batch';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_entries) as item(value)
    group by item.value ->> 'source_sheet', item.value ->> 'source_cell'
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'Duplicate source cell in import';
  end if;

  for entry_record in select value from pg_catalog.jsonb_array_elements(p_entries)
  loop
    if jsonb_typeof(entry_record) <> 'object'
      or nullif(btrim(entry_record ->> 'title'), '') is null
      or char_length(btrim(entry_record ->> 'title')) > 160
      or entry_record ->> 'entry_type' is null
      or entry_record ->> 'entry_type' not in ('income', 'expense')
      or entry_record ->> 'status' is null
      or entry_record ->> 'status' not in ('planned', 'settled')
      or entry_record ->> 'source_sheet' is null
      or char_length(entry_record ->> 'source_sheet') not between 1 and 31
      or entry_record ->> 'source_cell' is null
      or entry_record ->> 'source_cell' !~ '^[A-Z]{1,3}[1-9][0-9]*$'
      or entry_record ->> 'source_row' is null
      or entry_record ->> 'source_row' !~ '^[1-9][0-9]*$'
      or entry_record ->> 'competence_month' is null
      or entry_record ->> 'competence_month' !~ '^\d{4}-\d{2}-01$'
      or (entry_record ->> 'category' is not null and char_length(entry_record ->> 'category') > 80) then
      raise exception using errcode = '22023', message = 'Invalid imported entry';
    end if;

    entry_month := (entry_record ->> 'competence_month')::date;
    if entry_month <> pg_catalog.date_trunc('month', entry_month)::date then
      raise exception using errcode = '22023', message = 'Invalid competence month';
    end if;

    entry_amount := (entry_record ->> 'amount')::numeric(14, 2);
    if entry_amount is null or entry_amount <= 0 then
      raise exception using errcode = '22023', message = 'Imported amount must be positive';
    end if;

    if nullif(entry_record ->> 'due_date', '') is not null then
      entry_due_date := (entry_record ->> 'due_date')::date;
      if entry_due_date < entry_month
        or entry_due_date >= (entry_month + interval '1 month')::date then
        raise exception using errcode = '22023', message = 'Due date is outside competence month';
      end if;
    end if;
  end loop;

  insert into public.import_batches (
    household_id, source_file_name, source_file_sha256, status, created_by
  ) values (
    p_household_id, btrim(p_source_file_name), p_source_file_sha256, 'preview', (select auth.uid())
  )
  on conflict (household_id, source_file_sha256) do nothing
  returning id, status into batch_id, batch_status;

  if batch_id is null then
    select id, status
      into batch_id, batch_status
    from public.import_batches
    where household_id = p_household_id
      and source_file_sha256 = p_source_file_sha256
    for update;
  end if;

  if batch_id is null or batch_status = 'cancelled' then
    raise exception using errcode = '22023', message = 'Import batch is unavailable';
  end if;

  insert into public.financial_entries (
    household_id, title, entry_type, amount, category, competence_month, due_date,
    status, settled_at, source_kind, import_batch_id, source_sheet, source_row,
    source_cell, created_by
  )
  select
    p_household_id,
    btrim(item.value ->> 'title'),
    (item.value ->> 'entry_type')::public.entry_type,
    (item.value ->> 'amount')::numeric(14, 2),
    nullif(btrim(item.value ->> 'category'), ''),
    (item.value ->> 'competence_month')::date,
    nullif(item.value ->> 'due_date', '')::date,
    (item.value ->> 'status')::public.entry_status,
    null,
    'historical_import'::public.entry_source_kind,
    batch_id,
    item.value ->> 'source_sheet',
    (item.value ->> 'source_row')::integer,
    item.value ->> 'source_cell',
    (select auth.uid())
  from pg_catalog.jsonb_array_elements(p_entries) as item(value)
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  update public.import_batches
  set status = 'committed'
  where household_id = p_household_id and id = batch_id;

  select count(*)::integer
    into existing_count
  from public.financial_entries
  where household_id = p_household_id and import_batch_id = batch_id;

  return pg_catalog.jsonb_build_object(
    'batch_id', batch_id,
    'inserted_count', inserted_count,
    'total_count', existing_count,
    'already_imported', inserted_count = 0
  );
end;
$$;

revoke all on function public.commit_historical_import(uuid, text, text, jsonb) from public, anon;
grant execute on function public.commit_historical_import(uuid, text, text, jsonb) to authenticated;

commit;
