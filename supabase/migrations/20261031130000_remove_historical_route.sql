begin;

drop function if exists public.commit_historical_import(uuid, text, text, jsonb);

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname, pg_catalog.pg_get_constraintdef(oid) as definition
    from pg_catalog.pg_constraint
    where conrelid = 'public.financial_entries'::regclass
      and contype = 'c'
      and (
        pg_catalog.pg_get_constraintdef(oid) ilike '%source_kind%'
        or pg_catalog.pg_get_constraintdef(oid) ilike '%import_batch_id%'
        or pg_catalog.pg_get_constraintdef(oid) ilike '%source_sheet%'
        or pg_catalog.pg_get_constraintdef(oid) ilike '%source_row%'
        or pg_catalog.pg_get_constraintdef(oid) ilike '%source_cell%'
        or pg_catalog.pg_get_constraintdef(oid) ilike '%settled_at%'
      )
  loop
    execute pg_catalog.format(
      'alter table public.financial_entries drop constraint %I',
      constraint_record.conname
    );
  end loop;

  for constraint_record in
    select conname
    from pg_catalog.pg_constraint
    where conrelid = 'public.financial_entries'::regclass
      and contype = 'f'
      and confrelid = 'public.import_batches'::regclass
  loop
    execute pg_catalog.format(
      'alter table public.financial_entries drop constraint %I',
      constraint_record.conname
    );
  end loop;
end;
$$;

-- Keep the imported financial facts as ordinary entries before removing their provenance.
update public.financial_entries
set source_kind = 'manual',
    import_batch_id = null,
    source_sheet = null,
    source_row = null,
    source_cell = null,
    settled_at = case
      when status = 'settled' and settled_at is null
        then competence_month::timestamp at time zone 'UTC'
      else settled_at
    end
where source_kind = 'historical_import';

drop index if exists public.financial_entries_import_source_row_idx;
drop index if exists public.financial_entries_import_source_cell_idx;

drop table if exists public.import_batches;

alter table public.financial_entries
  drop column if exists import_batch_id,
  drop column if exists source_sheet,
  drop column if exists source_row,
  drop column if exists source_cell;

alter table public.financial_entries
  alter column source_kind drop default;

create type public.entry_source_kind_without_history as enum (
  'manual',
  'recurrence',
  'installment',
  'card_statement'
);

alter table public.financial_entries
  alter column source_kind type public.entry_source_kind_without_history
  using source_kind::text::public.entry_source_kind_without_history;

drop type public.entry_source_kind;
alter type public.entry_source_kind_without_history rename to entry_source_kind;

alter table public.financial_entries
  alter column source_kind set default 'manual'::public.entry_source_kind,
  add constraint financial_entries_settlement_date_check
    check (
      (status = 'settled' and settled_at is not null)
      or (status <> 'settled' and settled_at is null)
    ),
  add constraint financial_entries_source_provenance_check
    check (
      (source_kind = 'recurrence'
        and recurring_item_id is not null
        and installment_plan_id is null and installment_number is null)
      or (source_kind = 'installment'
        and recurring_item_id is null
        and installment_plan_id is not null
        and installment_number is not null and installment_number > 0)
      or (source_kind in ('manual', 'card_statement')
        and recurring_item_id is null
        and installment_plan_id is null and installment_number is null)
    ),
  add constraint financial_entries_card_statement_expense_check
    check (source_kind <> 'card_statement' or entry_type = 'expense');

revoke all on type public.entry_source_kind from public, anon, authenticated;
grant usage on type public.entry_source_kind to authenticated;

notify pgrst, 'reload schema';

commit;
