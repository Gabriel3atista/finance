create function private.enforce_financial_series_generation_horizon()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_month date := pg_catalog.date_trunc(
    'month',
    pg_catalog.timezone('America/Sao_Paulo', pg_catalog.now())
  )::date;
  last_allowed_month date := (current_month + interval '12 months')::date;
begin
  if new.source_kind in ('recurrence', 'installment')
    and new.competence_month > last_allowed_month
  then
    raise exception using
      errcode = '23514',
      message = 'Automatic series entries are limited to 12 months ahead.';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_financial_series_generation_horizon()
  from public, anon, authenticated;

create trigger financial_entries_limit_series_generation_horizon
  before insert on public.financial_entries
  for each row execute function private.enforce_financial_series_generation_horizon();
