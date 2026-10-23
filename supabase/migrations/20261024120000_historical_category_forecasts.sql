begin;

create table public.financial_forecast_category_overrides (
  household_id uuid not null references public.households (id) on delete cascade,
  competence_month date not null check (
    competence_month = date_trunc('month', competence_month)::date
  ),
  category text not null check (char_length(btrim(category)) between 1 and 80),
  override_amount numeric(14, 2) not null check (override_amount > 0),
  note text check (note is null or char_length(note) <= 160),
  updated_by uuid not null references auth.users (id) on delete restrict,
  updated_at timestamptz not null default now(),
  primary key (household_id, competence_month, category)
);

alter table public.financial_forecast_category_overrides enable row level security;
revoke all on table public.financial_forecast_category_overrides
  from public, anon, authenticated;
grant select, insert, update, delete
  on table public.financial_forecast_category_overrides to authenticated;

create policy financial_forecast_category_overrides_read_member
  on public.financial_forecast_category_overrides for select to authenticated
  using ((select private.is_household_member(household_id)));
create policy financial_forecast_category_overrides_insert_member
  on public.financial_forecast_category_overrides for insert to authenticated
  with check (
    (select private.is_household_member(household_id))
    and updated_by = (select auth.uid())
  );
create policy financial_forecast_category_overrides_update_member
  on public.financial_forecast_category_overrides for update to authenticated
  using ((select private.is_household_member(household_id)))
  with check (
    (select private.is_household_member(household_id))
    and updated_by = (select auth.uid())
  );
create policy financial_forecast_category_overrides_delete_member
  on public.financial_forecast_category_overrides for delete to authenticated
  using ((select private.is_household_member(household_id)));

create trigger financial_forecast_category_overrides_prevent_scope_change
  before update on public.financial_forecast_category_overrides
  for each row execute function private.prevent_household_scope_change();

commit;
