insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('teaching-media', 'teaching-media', false, 3145728,
  array['image/png','image/jpeg','image/webp','audio/mpeg','audio/wav','audio/ogg']);

create policy teaching_media_read_own on storage.objects for select to authenticated
using (bucket_id = 'teaching-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select role from public.profiles where id = (select auth.uid())) = 'teacher');

create policy teaching_media_upload_own on storage.objects for insert to authenticated
with check (bucket_id = 'teaching-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select role from public.profiles where id = (select auth.uid())) = 'teacher');
