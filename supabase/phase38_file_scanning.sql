-- Phase 38: malware scan records for uploaded files.
--
-- Uploads are scanned by api/scan-upload.ts (Cloudmersive) immediately
-- after they land in Storage. Infected files are deleted from the bucket
-- and recorded here so there is an audit trail of what was rejected.
--
-- One table keyed by (bucket, path) rather than scan columns on each of
-- bug_reports / tester_banking_details / job_attachments, so every bucket
-- is covered by the same mechanism and a new bucket needs no schema change.

create table if not exists public.file_scans (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  object_path text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  status text not null check (status in ('clean', 'infected', 'error')),
  threat_names text[] not null default '{}',
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (bucket_id, object_path)
);

create index if not exists file_scans_status_idx
on public.file_scans(status, scanned_at desc);

alter table public.file_scans enable row level security;

-- Scan verdicts are not sensitive (they describe files the user already
-- has access to via the parent record) but writes are server-only.
drop policy if exists "file_scans_read" on public.file_scans;
create policy "file_scans_read"
on public.file_scans for select
to authenticated
using (uploaded_by = auth.uid() or public.is_admin());

revoke all on public.file_scans from anon, authenticated;
grant select on public.file_scans to authenticated;
grant select, insert, update on public.file_scans to service_role;
