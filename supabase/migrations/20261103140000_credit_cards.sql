begin;

create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  bank_name text not null check (char_length(btrim(bank_name)) between 1 and 80),
  last_four text not null check (last_four ~ '^[0-9]{4}$'),
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (space_id, id)
);

create index credit_cards_space_active_idx
  on public.credit_cards (space_id, is_active, created_at desc);

alter table public.recurring_items
  add column credit_card_id uuid,
  add constraint recurring_items_credit_card_space_fk
    foreign key (space_id, credit_card_id)
    references public.credit_cards (space_id, id) on delete restrict,
  add constraint recurring_items_credit_card_expense_check
    check (credit_card_id is null or entry_type = 'expense');

alter table public.installment_plans
  add column credit_card_id uuid,
  add constraint installment_plans_credit_card_space_fk
    foreign key (space_id, credit_card_id)
    references public.credit_cards (space_id, id) on delete restrict;

alter table public.financial_entries
  add column credit_card_id uuid,
  add constraint financial_entries_credit_card_space_fk
    foreign key (space_id, credit_card_id)
    references public.credit_cards (space_id, id) on delete restrict,
  add constraint financial_entries_credit_card_expense_check
    check (credit_card_id is null or entry_type = 'expense');

-- Keep copying entries between months faithful to their card assignment.
do $$
declare
  definition text;
begin
  definition := pg_catalog.pg_get_functiondef(
    'public.copy_financial_entries_to_month(uuid,date)'::pg_catalog.regprocedure
  );
  if position('entry.category,' || E'\n      entry.due_date,' in definition) = 0
    or position('category,' || E'\n        competence_month,' in definition) = 0
    or position('source_entry.category,' || E'\n        p_target_month,' in definition) = 0
    or position('category = source_entry.category,' || E'\n        due_date = copied_due_date,' in definition) = 0 then
    raise exception 'Could not extend month copy to preserve credit card assignments';
  end if;
  definition := pg_catalog.replace(
    definition,
    'entry.category,' || E'\n      entry.due_date,',
    'entry.category,' || E'\n      entry.credit_card_id,' || E'\n      entry.due_date,'
  );
  definition := pg_catalog.replace(
    definition,
    'category,' || E'\n        competence_month,',
    'category,' || E'\n        credit_card_id,' || E'\n        competence_month,'
  );
  definition := pg_catalog.replace(
    definition,
    'source_entry.category,' || E'\n        p_target_month,',
    'source_entry.category,' || E'\n        source_entry.credit_card_id,' || E'\n        p_target_month,'
  );
  definition := pg_catalog.replace(
    definition,
    'category = source_entry.category,' || E'\n        due_date = copied_due_date,',
    'category = source_entry.category,' || E'\n        credit_card_id = source_entry.credit_card_id,' || E'\n        due_date = copied_due_date,'
  );
  execute definition;
end;
$$;

-- The existing series conversion RPC stays compatible. This overload supplies
-- its card context to rows created or relinked by the established transaction.
create function private.apply_conversion_credit_card()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  selected_card text := pg_catalog.current_setting('app.credit_card_id', true);
begin
  if selected_card is not null then
    new.credit_card_id := nullif(selected_card, '')::uuid;
  end if;
  return new;
end;
$$;

create trigger recurring_items_conversion_card
  before insert or update on public.recurring_items
  for each row execute function private.apply_conversion_credit_card();
create trigger installment_plans_conversion_card
  before insert or update on public.installment_plans
  for each row execute function private.apply_conversion_credit_card();
create trigger financial_entries_conversion_card
  before update on public.financial_entries
  for each row execute function private.apply_conversion_credit_card();

create function public.convert_financial_series_kind(
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
  p_indefinite boolean,
  p_credit_card_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.set_config(
    'app.credit_card_id', coalesce(p_credit_card_id::text, ''), true
  );
  return public.convert_financial_series_kind(
    p_space_id,
    p_series_id,
    p_from_kind,
    p_to_kind,
    p_title,
    p_entry_type,
    p_amount,
    p_category,
    p_due_day,
    p_starts_on,
    p_ends_on,
    p_installment_count,
    p_indefinite
  );
end;
$$;

revoke all on function public.convert_financial_series_kind(
  uuid, uuid, text, text, text, public.entry_type, numeric, text,
  smallint, date, date, integer, boolean, uuid
) from public, anon;
grant execute on function public.convert_financial_series_kind(
  uuid, uuid, text, text, text, public.entry_type, numeric, text,
  smallint, date, date, integer, boolean, uuid
) to authenticated;

alter table public.credit_cards enable row level security;
grant select, insert, update on public.credit_cards to authenticated;

create policy credit_cards_read_member
  on public.credit_cards for select to authenticated
  using ((select private.is_household_member(space_id)));

create policy credit_cards_insert_member
  on public.credit_cards for insert to authenticated
  with check (
    (select private.is_household_member(space_id))
    and created_by = (select auth.uid())
  );

create policy credit_cards_update_member
  on public.credit_cards for update to authenticated
  using ((select private.is_household_member(space_id)))
  with check ((select private.is_household_member(space_id)));

notify pgrst, 'reload schema';
commit;
