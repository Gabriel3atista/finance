begin;

create table public.financial_entry_logs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  entry_id uuid not null,
  actor_id uuid references auth.users (id) on delete set null,
  changed_fields jsonb not null,
  created_at timestamptz not null default now(),
  foreign key (space_id, entry_id)
    references public.financial_entries (space_id, id) on delete cascade,
  check (changed_fields <> '{}'::jsonb)
);

create index financial_entry_logs_entry_created_idx
  on public.financial_entry_logs (space_id, entry_id, created_at desc);

alter table public.financial_entry_logs enable row level security;
revoke all on table public.financial_entry_logs from public, anon;
grant select on table public.financial_entry_logs to authenticated;

create policy financial_entry_logs_read_member
  on public.financial_entry_logs for select to authenticated
  using ((select private.is_household_member(space_id)));

create or replace function private.log_financial_entry_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed jsonb := '{}'::jsonb;
begin
  if old.title is distinct from new.title then
    changed := changed || pg_catalog.jsonb_build_object(
      'title', pg_catalog.jsonb_build_object('from', old.title, 'to', new.title)
    );
  end if;
  if old.entry_type is distinct from new.entry_type then
    changed := changed || pg_catalog.jsonb_build_object(
      'entry_type', pg_catalog.jsonb_build_object('from', old.entry_type::text, 'to', new.entry_type::text)
    );
  end if;
  if old.amount is distinct from new.amount then
    changed := changed || pg_catalog.jsonb_build_object(
      'amount', pg_catalog.jsonb_build_object('from', old.amount, 'to', new.amount)
    );
  end if;
  if old.category is distinct from new.category then
    changed := changed || pg_catalog.jsonb_build_object(
      'category', pg_catalog.jsonb_build_object('from', old.category, 'to', new.category)
    );
  end if;
  if old.competence_month is distinct from new.competence_month then
    changed := changed || pg_catalog.jsonb_build_object(
      'competence_month', pg_catalog.jsonb_build_object('from', old.competence_month, 'to', new.competence_month)
    );
  end if;
  if old.due_date is distinct from new.due_date then
    changed := changed || pg_catalog.jsonb_build_object(
      'due_date', pg_catalog.jsonb_build_object('from', old.due_date, 'to', new.due_date)
    );
  end if;
  if old.status is distinct from new.status then
    changed := changed || pg_catalog.jsonb_build_object(
      'status', pg_catalog.jsonb_build_object('from', old.status::text, 'to', new.status::text)
    );
  end if;
  if old.settled_at is distinct from new.settled_at then
    changed := changed || pg_catalog.jsonb_build_object(
      'settled_at', pg_catalog.jsonb_build_object('from', old.settled_at, 'to', new.settled_at)
    );
  end if;

  if changed <> '{}'::jsonb then
    insert into public.financial_entry_logs (
      space_id, entry_id, actor_id, changed_fields
    ) values (
      new.space_id, new.id, (select auth.uid()), changed
    );
  end if;

  return new;
end;
$$;

revoke all on function private.log_financial_entry_update() from public, anon, authenticated;

create trigger financial_entries_audit_update
  after update on public.financial_entries
  for each row execute function private.log_financial_entry_update();

create or replace function public.list_financial_entry_logs(p_entry_id uuid)
returns table (
  id uuid,
  actor_id uuid,
  actor_name text,
  changed_fields jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_space_id uuid;
begin
  if (select auth.uid()) is null or p_entry_id is null then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  select entry.space_id
  into target_space_id
  from public.financial_entries as entry
  where entry.id = p_entry_id;

  if target_space_id is null
    or not (select private.is_household_member(target_space_id)) then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  return query
  select
    log.id,
    log.actor_id,
    coalesce(
      nullif(pg_catalog.btrim(user_record.raw_user_meta_data ->> 'full_name'), ''),
      nullif(pg_catalog.btrim(user_record.raw_user_meta_data ->> 'name'), ''),
      nullif(pg_catalog.split_part(user_record.email, '@', 1), ''),
      'Usuário'
    ),
    log.changed_fields,
    log.created_at
  from public.financial_entry_logs as log
  left join auth.users as user_record on user_record.id = log.actor_id
  where log.space_id = target_space_id
    and log.entry_id = p_entry_id
  order by log.created_at desc, log.id desc;
end;
$$;

revoke all on function public.list_financial_entry_logs(uuid) from public, anon;
grant execute on function public.list_financial_entry_logs(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
