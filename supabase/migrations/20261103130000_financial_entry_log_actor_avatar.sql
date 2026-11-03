begin;

drop function public.list_financial_entry_logs(uuid);

create function public.list_financial_entry_logs(p_entry_id uuid)
returns table (
  id uuid,
  actor_id uuid,
  actor_name text,
  actor_avatar_url text,
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
    coalesce(
      nullif(pg_catalog.btrim(user_record.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(pg_catalog.btrim(user_record.raw_user_meta_data ->> 'picture'), ''),
      profile.avatar_url
    ),
    log.changed_fields,
    log.created_at
  from public.financial_entry_logs as log
  left join auth.users as user_record on user_record.id = log.actor_id
  left join public.user_profiles as profile on profile.user_id = log.actor_id
  where log.space_id = target_space_id
    and log.entry_id = p_entry_id
  order by log.created_at desc, log.id desc;
end;
$$;

revoke all on function public.list_financial_entry_logs(uuid) from public, anon;
grant execute on function public.list_financial_entry_logs(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
