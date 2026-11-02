begin;

create or replace function public.list_space_members(p_space_id uuid)
returns table (
  user_id uuid,
  display_name text,
  email text,
  avatar_url text,
  member_role text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not (select private.is_household_member(p_space_id)) then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  return query
  select
    member.user_id,
    coalesce(
      nullif(pg_catalog.btrim(user_record.raw_user_meta_data ->> 'full_name'), ''),
      nullif(pg_catalog.btrim(user_record.raw_user_meta_data ->> 'name'), ''),
      nullif(pg_catalog.split_part(user_record.email, '@', 1), ''),
      'Usuário'
    ) as display_name,
    user_record.email::text,
    profile.avatar_url,
    member.member_role::text,
    member.joined_at
  from public.space_members as member
  join auth.users as user_record on user_record.id = member.user_id
  left join public.user_profiles as profile on profile.user_id = member.user_id
  where member.space_id = p_space_id
  order by case when member.member_role = 'owner' then 0 else 1 end,
    member.joined_at,
    member.user_id;
end;
$$;

revoke all on function public.list_space_members(uuid) from public, anon;
grant execute on function public.list_space_members(uuid) to authenticated;

create or replace function public.remove_space_member(
  p_space_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
begin
  if (select auth.uid()) is null
    or p_space_id is null
    or p_user_id is null then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  if p_user_id = (select auth.uid()) then
    raise exception using errcode = '22023', message = 'cannot remove yourself';
  end if;

  select member.member_role
  into caller_role
  from public.space_members as member
  where member.space_id = p_space_id
    and member.user_id = (select auth.uid())
  for update;

  if caller_role is distinct from 'owner' then
    raise exception using errcode = '42501', message = 'owner role required';
  end if;

  delete from public.space_members as member
  where member.space_id = p_space_id
    and member.user_id = p_user_id
    and member.member_role = 'member';

  if not found then
    raise exception using errcode = 'P0002', message = 'member not found';
  end if;

  return true;
end;
$$;

revoke all on function public.remove_space_member(uuid, uuid) from public, anon;
grant execute on function public.remove_space_member(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
