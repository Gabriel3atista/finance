begin;

create table public.household_finance_settings (
  household_id uuid primary key references public.households (id) on delete cascade,
  opening_balance numeric(14, 2),
  balance_as_of date,
  updated_by uuid not null references auth.users (id) on delete restrict,
  updated_at timestamptz not null default now(),
  check ((opening_balance is null) = (balance_as_of is null))
);

create table public.financial_forecast_overrides (
  household_id uuid not null references public.households (id) on delete cascade,
  entry_id uuid not null,
  override_amount numeric(14, 2) not null check (override_amount > 0),
  note text check (note is null or char_length(note) <= 160),
  updated_by uuid not null references auth.users (id) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (household_id, entry_id),
  foreign key (household_id, entry_id)
    references public.financial_entries (household_id, id) on delete cascade
);

alter table public.household_finance_settings enable row level security;
alter table public.financial_forecast_overrides enable row level security;

revoke all on table public.household_finance_settings,
  public.financial_forecast_overrides from public, anon, authenticated;
grant select, insert, update on table public.household_finance_settings to authenticated;
grant select, insert, update, delete on table public.financial_forecast_overrides to authenticated;

create policy household_finance_settings_read_member
  on public.household_finance_settings for select to authenticated
  using ((select private.is_household_member(household_id)));
create policy household_finance_settings_insert_member
  on public.household_finance_settings for insert to authenticated
  with check (
    (select private.is_household_member(household_id))
    and updated_by = (select auth.uid())
  );
create policy household_finance_settings_update_member
  on public.household_finance_settings for update to authenticated
  using ((select private.is_household_member(household_id)))
  with check (
    (select private.is_household_member(household_id))
    and updated_by = (select auth.uid())
  );

create policy financial_forecast_overrides_read_member
  on public.financial_forecast_overrides for select to authenticated
  using ((select private.is_household_member(household_id)));
create policy financial_forecast_overrides_insert_member
  on public.financial_forecast_overrides for insert to authenticated
  with check (
    (select private.is_household_member(household_id))
    and updated_by = (select auth.uid())
  );
create policy financial_forecast_overrides_update_member
  on public.financial_forecast_overrides for update to authenticated
  using ((select private.is_household_member(household_id)))
  with check (
    (select private.is_household_member(household_id))
    and updated_by = (select auth.uid())
  );
create policy financial_forecast_overrides_delete_member
  on public.financial_forecast_overrides for delete to authenticated
  using ((select private.is_household_member(household_id)));

create or replace function private.prevent_household_scope_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.household_id is distinct from old.household_id then
    raise exception using errcode = '23514', message = 'household_id is immutable';
  end if;
  return new;
end;
$$;

create or replace function private.validate_forecast_override()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.financial_entries as entry
    where entry.id = new.entry_id
      and entry.household_id = new.household_id
      and entry.status = 'planned'
  ) then
    raise exception using errcode = '23514', message = 'only planned entries can have forecast overrides';
  end if;
  return new;
end;
$$;

create or replace function private.clear_forecast_override_after_settlement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'planned' then
    delete from public.financial_forecast_overrides
    where household_id = new.household_id
      and entry_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_household_scope_change() from public, anon, authenticated;
revoke all on function private.validate_forecast_override() from public, anon, authenticated;
revoke all on function private.clear_forecast_override_after_settlement() from public, anon, authenticated;

create trigger household_finance_settings_prevent_scope_change
  before update on public.household_finance_settings
  for each row execute function private.prevent_household_scope_change();
create trigger financial_forecast_overrides_prevent_scope_change
  before update on public.financial_forecast_overrides
  for each row execute function private.prevent_household_scope_change();
create trigger financial_forecast_overrides_require_planned_entry
  before insert or update on public.financial_forecast_overrides
  for each row execute function private.validate_forecast_override();
create trigger financial_entries_clear_forecast_override
  after update of status on public.financial_entries
  for each row execute function private.clear_forecast_override_after_settlement();

commit;
