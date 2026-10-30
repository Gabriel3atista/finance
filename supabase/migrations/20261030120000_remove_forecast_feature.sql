begin;

-- This trigger only maintained projection overrides; payment status remains
-- stored directly on financial_entries and does not depend on these tables.
drop trigger if exists financial_entries_clear_forecast_override
  on public.financial_entries;

drop table if exists public.financial_forecast_category_overrides;
drop table if exists public.financial_forecast_overrides;
drop table if exists public.household_finance_settings;

drop function if exists private.clear_forecast_override_after_settlement();
drop function if exists private.validate_forecast_override();
drop function if exists private.prevent_household_scope_change();

commit;
