-- SQUASH Phase 9 Job logos
-- Run this in Supabase SQL Editor before using real job logo uploads.
-- It adds the job logo URL field and creates a public Storage bucket for job logos.

alter table public.jobs
add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-logos',
  'job-logos',
  true,
  1048576,
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Developers can upload own job logos" on storage.objects;
create policy "Developers can upload own job logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'job-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Developers can update own job logos" on storage.objects;
create policy "Developers can update own job logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'job-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'job-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Developers can delete own job logos" on storage.objects;
create policy "Developers can delete own job logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'job-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);