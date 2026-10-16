-- ============================================================================
-- 0005_storage.sql
-- Bucket privado 'evidencias' + politicas de acesso
-- Path: {secao_id}/{item_id}/{timestamp}.jpg  e  .../thumb.jpg
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

-- (storage.foldername(name))[1] = secao_id
create policy evidencias_store_insert on storage.objects for insert
  with check (
    bucket_id = 'evidencias'
    and public.pode_ver_secao(((storage.foldername(name))[1])::uuid)
  );

create policy evidencias_store_select on storage.objects for select
  using (
    bucket_id = 'evidencias'
    and (public.is_cartorio()
         or public.pode_ver_secao(((storage.foldername(name))[1])::uuid))
  );

create policy evidencias_store_update on storage.objects for update
  using (
    bucket_id = 'evidencias'
    and (public.is_cartorio()
         or public.pode_ver_secao(((storage.foldername(name))[1])::uuid))
  );

create policy evidencias_store_delete on storage.objects for delete
  using (bucket_id = 'evidencias' and public.is_cartorio());
