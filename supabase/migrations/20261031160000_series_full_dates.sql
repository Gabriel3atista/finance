alter table public.recurring_items
  drop constraint if exists recurring_items_starts_on_check,
  drop constraint if exists recurring_items_ends_on_check;

alter table public.installment_plans
  drop constraint if exists installment_plans_first_month_check;

alter table public.installment_plans
  rename column first_month to starts_on;

alter table public.installment_plans
  add column ends_on date;

update public.installment_plans
set ends_on = (
  starts_on + ((installment_count - 1) * interval '1 month')
)::date;

alter table public.installment_plans
  alter column ends_on set not null,
  add constraint installment_plans_date_range_check check (
    ends_on >= starts_on
    and date_trunc('month', ends_on)::date = (
      date_trunc('month', starts_on)
      + ((installment_count - 1) * interval '1 month')
    )::date
  );

notify pgrst, 'reload schema';
