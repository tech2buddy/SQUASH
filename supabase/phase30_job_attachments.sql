-- Phase 30: private developer job attachments and additional job notes

alter table public.jobs
  add column if not exists additional_info text;

create table if not exists public.job_attachments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  developer_id uuid not null references public.developer_profiles(user_id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg', 'image/webp')),
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  created_at timestamptz not null default now()
);

create index if not exists job_attachments_job_idx
  on public.job_attachments(job_id, created_at);

alter table public.job_attachments enable row level security;

drop policy if exists "job_attachments_select_related" on public.job_attachments;
create policy "job_attachments_select_related"
on public.job_attachments for select
to authenticated
using (
  developer_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.test_assignments ta
    where ta.job_id = job_attachments.job_id
      and ta.tester_id = auth.uid()
  )
);

drop policy if exists "job_attachments_insert_owner" on public.job_attachments;
create policy "job_attachments_insert_owner"
on public.job_attachments for insert
to authenticated
with check (
  developer_id = auth.uid()
  and exists (
    select 1 from public.jobs j
    where j.id = job_attachments.job_id
      and j.developer_id = auth.uid()
  )
);

drop policy if exists "job_attachments_delete_owner" on public.job_attachments;
create policy "job_attachments_delete_owner"
on public.job_attachments for delete
to authenticated
using (developer_id = auth.uid());

grant select, insert, delete on public.job_attachments to authenticated;
revoke all on public.job_attachments from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-attachments',
  'job-attachments',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "job_attachments_storage_insert_owner" on storage.objects;
create policy "job_attachments_storage_insert_owner"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'job-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_developer()
);

drop policy if exists "job_attachments_storage_select_related" on storage.objects;
create policy "job_attachments_storage_select_related"
on storage.objects for select
to authenticated
using (
  bucket_id = 'job-attachments'
  and exists (
    select 1
    from public.job_attachments ja
    where ja.file_path = name
      and (
        ja.developer_id = auth.uid()
        or public.is_admin()
        or exists (
          select 1
          from public.test_assignments ta
          where ta.job_id = ja.job_id
            and ta.tester_id = auth.uid()
        )
      )
  )
);

drop policy if exists "job_attachments_storage_delete_owner" on storage.objects;
create policy "job_attachments_storage_delete_owner"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'job-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);