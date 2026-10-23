begin;

drop function if exists public.commit_historical_import(uuid, text, text, jsonb);

drop policy if exists import_batches_insert_member on public.import_batches;
drop policy if exists import_batches_update_member on public.import_batches;

revoke insert, update on table public.import_batches from authenticated;

commit;
