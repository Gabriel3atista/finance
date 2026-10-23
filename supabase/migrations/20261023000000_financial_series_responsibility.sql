begin;

alter table public.recurring_items
  add column responsible_user_id uuid references auth.users (id) on delete set null;

alter table public.installment_plans
  add column category text,
  add column responsible_user_id uuid references auth.users (id) on delete set null;

create trigger recurring_items_validate_responsible_member
  before insert or update on public.recurring_items
  for each row execute function private.validate_responsible_household_member();

create trigger installment_plans_validate_responsible_member
  before insert or update on public.installment_plans
  for each row execute function private.validate_responsible_household_member();

commit;
