begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.entry_type as enum ('income', 'expense');
create type public.entry_status as enum ('planned', 'settled', 'cancelled');
create type public.entry_source_kind as enum (
  'manual',
  'recurrence',
  'installment',
  'card_statement',
  'historical_import'
);
revoke all on type public.entry_type from public, anon, authenticated;
revoke all on type public.entry_status from public, anon, authenticated;
revoke all on type public.entry_source_kind from public, anon, authenticated;
grant usage on type public.entry_type to authenticated;
grant usage on type public.entry_status to authenticated;
grant usage on type public.entry_source_kind to authenticated;

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on public.household_members (user_id, household_id);

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  invited_email text not null check (
    invited_email = lower(btrim(invited_email))
    and invited_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  invited_by uuid not null references auth.users (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (status = 'accepted' and accepted_at is not null and accepted_by is not null)
    or (status <> 'accepted' and accepted_at is null and accepted_by is null)
  )
);
create unique index household_invitations_pending_email_idx
  on public.household_invitations (household_id, invited_email)
  where status = 'pending';

create table public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  entry_type public.entry_type not null,
  planned_amount numeric(14, 2) not null check (planned_amount > 0),
  category text,
  due_day smallint check (due_day between 1 and 31),
  starts_on date not null check (starts_on = date_trunc('month', starts_on)::date),
  ends_on date check (ends_on is null or ends_on = date_trunc('month', ends_on)::date),
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (household_id, id),
  check (ends_on is null or ends_on >= starts_on)
);
create index recurring_items_household_active_idx
  on public.recurring_items (household_id, starts_on, ends_on)
  where is_active;

create table public.installment_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  total_amount numeric(14, 2) not null check (total_amount > 0),
  installment_count integer not null check (installment_count > 0),
  first_month date not null check (first_month = date_trunc('month', first_month)::date),
  due_day smallint check (due_day between 1 and 31),
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (household_id, id)
);
create index installment_plans_household_active_idx
  on public.installment_plans (household_id, first_month)
  where is_active;

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete restrict,
  source_file_name text not null check (char_length(btrim(source_file_name)) between 1 and 255),
  source_file_sha256 text not null check (source_file_sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'preview' check (status in ('preview', 'committed', 'cancelled')),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (household_id, id),
  unique (household_id, source_file_sha256)
);

create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  entry_type public.entry_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  category text,
  competence_month date not null check (competence_month = date_trunc('month', competence_month)::date),
  due_date date,
  status public.entry_status not null default 'planned',
  settled_at timestamptz,
  source_kind public.entry_source_kind not null default 'manual',
  recurring_item_id uuid,
  installment_plan_id uuid,
  installment_number integer,
  import_batch_id uuid,
  source_sheet text,
  source_row integer,
  responsible_user_id uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (household_id, recurring_item_id)
    references public.recurring_items (household_id, id) on delete restrict,
  foreign key (household_id, installment_plan_id)
    references public.installment_plans (household_id, id) on delete restrict,
  foreign key (household_id, import_batch_id)
    references public.import_batches (household_id, id) on delete restrict,
  check ((status = 'settled') = (settled_at is not null)),
  check (
    (source_kind = 'recurrence'
      and recurring_item_id is not null
      and installment_plan_id is null and installment_number is null
      and import_batch_id is null and source_sheet is null and source_row is null)
    or (source_kind = 'installment'
      and recurring_item_id is null
      and installment_plan_id is not null and installment_number is not null and installment_number > 0
      and import_batch_id is null and source_sheet is null and source_row is null)
    or (source_kind = 'historical_import'
      and recurring_item_id is null and installment_plan_id is null and installment_number is null
      and import_batch_id is not null and source_sheet is not null and source_row is not null and source_row > 0)
    or (source_kind in ('manual', 'card_statement')
      and recurring_item_id is null and installment_plan_id is null and installment_number is null
      and import_batch_id is null and source_sheet is null and source_row is null)
  ),
  check (source_kind <> 'card_statement' or entry_type = 'expense'),
  unique (household_id, id)
);
create index financial_entries_household_month_idx
  on public.financial_entries (household_id, competence_month);
create index financial_entries_household_due_idx
  on public.financial_entries (household_id, due_date)
  where status = 'planned';
create unique index financial_entries_recurrence_occurrence_idx
  on public.financial_entries (household_id, recurring_item_id, competence_month)
  where recurring_item_id is not null;
create unique index financial_entries_installment_occurrence_idx
  on public.financial_entries (household_id, installment_plan_id, installment_number)
  where installment_plan_id is not null;
create unique index financial_entries_import_source_row_idx
  on public.financial_entries (import_batch_id, source_sheet, source_row)
  where import_batch_id is not null;

create or replace function private.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.household_members as member
      where member.household_id = target_household_id
        and member.user_id = (select auth.uid())
    );
$$;

create or replace function private.has_pending_household_invitation(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_invitations as invitation
    join auth.users as invited_user on invited_user.id = (select auth.uid())
    where invitation.household_id = target_household_id
      and invitation.status = 'pending'
      and invitation.expires_at > pg_catalog.now()
      and invited_user.email_confirmed_at is not null
      and pg_catalog.lower(invitation.invited_email) = pg_catalog.lower(invited_user.email)
  );
$$;

create or replace function private.add_household_creator_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.household_members (household_id, user_id, member_role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create or replace function private.accept_household_invitation_after_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invited_user_email text;
begin
  select pg_catalog.lower(user_record.email)
    into invited_user_email
  from auth.users as user_record
  where user_record.id = new.user_id
    and user_record.email_confirmed_at is not null;

  if invited_user_email is not null then
    update public.household_invitations
    set status = 'accepted', accepted_at = pg_catalog.now(), accepted_by = new.user_id
    where household_id = new.household_id
      and invited_email = invited_user_email
      and status = 'pending'
      and expires_at > pg_catalog.now();
  end if;
  return new;
end;
$$;

create or replace function private.expire_previous_household_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.household_invitations
  set status = 'expired'
  where household_id = new.household_id
    and invited_email = new.invited_email
    and status = 'pending'
    and expires_at <= pg_catalog.now();
  return new;
end;
$$;

create or replace function private.prevent_household_scope_or_creator_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.household_id is distinct from old.household_id
    or new.created_by is distinct from old.created_by then
    raise exception using errcode = '23514', message = 'household_id and created_by are immutable';
  end if;
  return new;
end;
$$;

create or replace function private.validate_responsible_household_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.responsible_user_id is not null and not exists (
    select 1
    from public.household_members as member
    where member.household_id = new.household_id
      and member.user_id = new.responsible_user_id
  ) then
    raise exception using errcode = '23514', message = 'responsible user must belong to the same household';
  end if;
  return new;
end;
$$;

revoke all on function private.is_household_member(uuid) from public, anon, authenticated;
revoke all on function private.has_pending_household_invitation(uuid) from public, anon, authenticated;
revoke all on function private.add_household_creator_as_member() from public, anon, authenticated;
revoke all on function private.accept_household_invitation_after_membership() from public, anon, authenticated;
revoke all on function private.expire_previous_household_invitation() from public, anon, authenticated;
revoke all on function private.prevent_household_scope_or_creator_change() from public, anon, authenticated;
revoke all on function private.validate_responsible_household_member() from public, anon, authenticated;
grant execute on function private.is_household_member(uuid) to authenticated;
grant execute on function private.has_pending_household_invitation(uuid) to authenticated;

create trigger households_add_creator_member
  after insert on public.households
  for each row execute function private.add_household_creator_as_member();

create trigger household_members_accept_invitation
  after insert on public.household_members
  for each row execute function private.accept_household_invitation_after_membership();

create trigger household_invitations_expire_previous
  before insert on public.household_invitations
  for each row execute function private.expire_previous_household_invitation();

create trigger recurring_items_prevent_scope_change
  before update on public.recurring_items
  for each row execute function private.prevent_household_scope_or_creator_change();
create trigger installment_plans_prevent_scope_change
  before update on public.installment_plans
  for each row execute function private.prevent_household_scope_or_creator_change();
create trigger financial_entries_prevent_scope_change
  before update on public.financial_entries
  for each row execute function private.prevent_household_scope_or_creator_change();
create trigger financial_entries_validate_responsible_member
  before insert or update on public.financial_entries
  for each row execute function private.validate_responsible_household_member();
create trigger import_batches_prevent_scope_change
  before update on public.import_batches
  for each row execute function private.prevent_household_scope_or_creator_change();

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.recurring_items enable row level security;
alter table public.installment_plans enable row level security;
alter table public.financial_entries enable row level security;
alter table public.import_batches enable row level security;

revoke all on table public.households, public.household_members, public.household_invitations,
  public.recurring_items, public.installment_plans, public.financial_entries, public.import_batches
  from public, anon, authenticated;

grant select, insert on table public.households to authenticated;
grant select, insert on table public.household_members to authenticated;
grant select, insert on table public.household_invitations to authenticated;
grant select, insert, update on table public.recurring_items to authenticated;
grant select, insert, update on table public.installment_plans to authenticated;
grant select, insert, update on table public.financial_entries to authenticated;
grant select, insert, update on table public.import_batches to authenticated;

create policy households_read_members
  on public.households for select to authenticated
  using ((select private.is_household_member(id)));
create policy households_create_for_self
  on public.households for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy household_members_read_same_household
  on public.household_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_household_member(household_id))
  );
create policy household_members_accept_valid_invitation
  on public.household_members for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and member_role = 'member'
    and (select private.has_pending_household_invitation(household_id))
  );

create policy household_invitations_read_member_or_invited_user
  on public.household_invitations for select to authenticated
  using (
    (select private.is_household_member(household_id))
    or (select private.has_pending_household_invitation(household_id))
  );
create policy household_invitations_create_by_member
  on public.household_invitations for insert to authenticated
  with check (
    (select private.is_household_member(household_id))
    and invited_by = (select auth.uid())
    and status = 'pending'
    and accepted_at is null
    and accepted_by is null
    and expires_at > (select now())
  );

create policy recurring_items_read_member
  on public.recurring_items for select to authenticated
  using ((select private.is_household_member(household_id)));
create policy recurring_items_insert_member
  on public.recurring_items for insert to authenticated
  with check (
    (select private.is_household_member(household_id))
    and created_by = (select auth.uid())
  );
create policy recurring_items_update_member
  on public.recurring_items for update to authenticated
  using ((select private.is_household_member(household_id)))
  with check ((select private.is_household_member(household_id)));

create policy installment_plans_read_member
  on public.installment_plans for select to authenticated
  using ((select private.is_household_member(household_id)));
create policy installment_plans_insert_member
  on public.installment_plans for insert to authenticated
  with check (
    (select private.is_household_member(household_id))
    and created_by = (select auth.uid())
  );
create policy installment_plans_update_member
  on public.installment_plans for update to authenticated
  using ((select private.is_household_member(household_id)))
  with check ((select private.is_household_member(household_id)));

create policy financial_entries_read_member
  on public.financial_entries for select to authenticated
  using ((select private.is_household_member(household_id)));
create policy financial_entries_insert_member
  on public.financial_entries for insert to authenticated
  with check (
    (select private.is_household_member(household_id))
    and created_by = (select auth.uid())
  );
create policy financial_entries_update_member
  on public.financial_entries for update to authenticated
  using ((select private.is_household_member(household_id)))
  with check ((select private.is_household_member(household_id)));

create policy import_batches_read_member
  on public.import_batches for select to authenticated
  using ((select private.is_household_member(household_id)));
create policy import_batches_insert_member
  on public.import_batches for insert to authenticated
  with check (
    (select private.is_household_member(household_id))
    and created_by = (select auth.uid())
  );
create policy import_batches_update_member
  on public.import_batches for update to authenticated
  using ((select private.is_household_member(household_id)))
  with check ((select private.is_household_member(household_id)));

commit;
