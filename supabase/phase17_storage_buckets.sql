-- Phase 17: Supabase Storage buckets for bug report attachments
-- This creates storage buckets for screenshots and videos with proper RLS policies
-- Run this in Supabase SQL Editor

-- Insert storage bucket for bug report screenshots
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bug-screenshots',
  'bug-screenshots',
  false,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Insert storage bucket for bug report videos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bug-videos',
  'bug-videos',
  false,
  10485760, -- 10MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do nothing;

-- RLS Policies for bug-screenshots bucket
alter table storage.objects enable row level security;

-- Allow testers to upload to their own bug report folders
create policy "screenshots_upload_tester_assigned"
on storage.objects for insert
with check (
  bucket_id = 'bug-screenshots'
  and auth.role() = 'authenticated'
  and (
    -- Extract tester_id from path pattern: bug-screenshots/{tester_id}/{job_id}/{filename}
    split_part(storage.foldername(name), '/', 1) = auth.uid()::text
    or exists (
      select 1 from public.test_assignments ta
      where ta.tester_id = auth.uid()
      and ta.id::text = split_part(storage.foldername(name), '/', 2)
    )
  )
);

-- Allow related users to view screenshots
create policy "screenshots_view_related"
on storage.objects for select
using (
  bucket_id = 'bug-screenshots'
  and (
    auth.uid()::text = split_part(storage.foldername(name), '/', 1) -- tester who uploaded
    or exists (
      -- Developer who owns the job
      select 1 from public.jobs j
      where j.id::text = split_part(storage.foldername(name), '/', 2)
      and j.developer_id = auth.uid()
    )
    or public.is_admin()
  )
);

-- Allow testers to delete their own uploads
create policy "screenshots_delete_own"
on storage.objects for delete
using (
  bucket_id = 'bug-screenshots'
  and split_part(storage.foldername(name), '/', 1) = auth.uid()::text
);

-- RLS Policies for bug-videos bucket
-- Allow testers to upload to their own bug report folders
create policy "videos_upload_tester_assigned"
on storage.objects for insert
with check (
  bucket_id = 'bug-videos'
  and auth.role() = 'authenticated'
  and (
    -- Extract tester_id from path pattern: bug-videos/{tester_id}/{job_id}/{filename}
    split_part(storage.foldername(name), '/', 1) = auth.uid()::text
    or exists (
      select 1 from public.test_assignments ta
      where ta.tester_id = auth.uid()
      and ta.id::text = split_part(storage.foldername(name), '/', 2)
    )
  )
);

-- Allow related users to view videos
create policy "videos_view_related"
on storage.objects for select
using (
  bucket_id = 'bug-videos'
  and (
    auth.uid()::text = split_part(storage.foldername(name), '/', 1) -- tester who uploaded
    or exists (
      -- Developer who owns the job
      select 1 from public.jobs j
      where j.id::text = split_part(storage.foldername(name), '/', 2)
      and j.developer_id = auth.uid()
    )
    or public.is_admin()
  )
);

-- Allow testers to delete their own uploads
create policy "videos_delete_own"
on storage.objects for delete
using (
  bucket_id = 'bug-videos'
  and split_part(storage.foldername(name), '/', 1) = auth.uid()::text
);

-- Grant necessary permissions
grant usage on schema storage to authenticated, anon;
grant usage on schema storage to postgres;
grant all on storage.buckets to postgres;
grant all on storage.objects to postgres;
grant all on all tables in schema storage to postgres;
grant all on all sequences in schema storage to postgres;
grant all on all functions in schema storage to postgres;
