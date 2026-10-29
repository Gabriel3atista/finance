begin;

drop trigger if exists financial_entries_validate_responsible_member
  on public.financial_entries;
drop trigger if exists recurring_items_validate_responsible_member
  on public.recurring_items;
drop trigger if exists installment_plans_validate_responsible_member
  on public.installment_plans;

drop function if exists private.validate_responsible_household_member();

alter table public.financial_entries
  drop column if exists responsible_user_id;

alter table public.recurring_items
  drop column if exists responsible_user_id;

alter table public.installment_plans
  drop column if exists responsible_user_id;

commit;
