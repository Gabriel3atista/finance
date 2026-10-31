begin;

alter table public.households rename to spaces;
alter table public.household_members rename to space_members;
alter table public.household_invitations rename to space_invitations;

-- Rename the scope column everywhere it exists, keeping rows and constraints.
do $$
declare
  item record;
begin
  for item in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'household_id'
  loop
    execute format(
      'alter table public.%I rename column household_id to space_id',
      item.table_name
    );
  end loop;
end;
$$;

-- Update stored function bodies that refer to the old scope names.
-- Keep RPC argument names stable so already deployed clients remain compatible.
do $$
declare
  item record;
  updated_definition text;
begin
  for item in
    select p.oid, pg_get_functiondef(p.oid) as definition
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosrc ilike '%household%'
  loop
    updated_definition := replace(item.definition, 'households', 'spaces');
    updated_definition := replace(updated_definition, 'household_members', 'space_members');
    updated_definition := replace(updated_definition, 'household_invitations', 'space_invitations');
    updated_definition := replace(updated_definition, 'household_id', 'space_id');
    updated_definition := replace(updated_definition, 'p_space_id', 'p_household_id');
    updated_definition := replace(updated_definition, 'target_space_id', 'target_household_id');
    execute updated_definition;
  end loop;
end;
$$;

-- Rename catalog objects for a consistent schema browser and diagnostics.
do $$
declare
  item record;
  new_name text;
begin
  for item in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and policyname ilike '%household%'
  loop
    new_name := replace(item.policyname, 'household', 'space');
    execute format(
      'alter policy %I on %I.%I rename to %I',
      item.policyname, item.schemaname, item.tablename, new_name
    );
  end loop;

  for item in
    select
      event_object_schema as table_schema,
      event_object_table as table_name,
      trigger_name
    from information_schema.triggers
    where trigger_schema = 'public' and trigger_name ilike '%household%'
  loop
    new_name := replace(item.trigger_name, 'household', 'space');
    execute format(
      'alter trigger %I on %I.%I rename to %I',
      item.trigger_name, item.table_schema, item.table_name, new_name
    );
  end loop;

  for item in
    select n.nspname as schema_name, c.relname as table_name, con.conname
    from pg_constraint as con
    join pg_class as c on c.oid = con.conrelid
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public' and con.conname ilike '%household%'
  loop
    new_name := replace(item.conname, 'household', 'space');
    execute format(
      'alter table %I.%I rename constraint %I to %I',
      item.schema_name, item.table_name, item.conname, new_name
    );
  end loop;

  for item in
    select schemaname, indexname
    from pg_indexes
    where schemaname = 'public' and indexname ilike '%household%'
  loop
    new_name := replace(item.indexname, 'household', 'space');
    execute format(
      'alter index %I.%I rename to %I', item.schemaname, item.indexname, new_name
    );
  end loop;
end;
$$;

commit;
