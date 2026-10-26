begin;

create table public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
revoke all on table public.user_profiles from public, anon, authenticated;
grant select on table public.user_profiles to authenticated;

create policy user_profiles_read_self
  on public.user_profiles for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function private.sync_user_profile_avatar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  provider_avatar_url text;
begin
  provider_avatar_url := coalesce(
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'picture'), '')
  );

  insert into public.user_profiles (user_id, avatar_url, updated_at)
  values (new.id, provider_avatar_url, pg_catalog.now())
  on conflict (user_id) do update
    set avatar_url = excluded.avatar_url,
        updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function private.sync_user_profile_avatar() from public, anon, authenticated;

create trigger auth_users_sync_profile_avatar
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function private.sync_user_profile_avatar();

insert into public.user_profiles (user_id, avatar_url)
select
  user_record.id,
  coalesce(
    nullif(pg_catalog.btrim(user_record.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(pg_catalog.btrim(user_record.raw_user_meta_data ->> 'picture'), '')
  )
from auth.users as user_record
on conflict (user_id) do update
  set avatar_url = excluded.avatar_url,
      updated_at = pg_catalog.now();

commit;
