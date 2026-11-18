-- Review existing duplicate active payments and unscanned files before applying.
begin;

-- Fails rather than silently cancelling real provider checkouts if duplicates exist.
create unique index if not exists job_payments_one_open_checkout
on public.job_payments(job_id) where status in ('creating', 'pending');

create or replace function public.storage_file_is_clean(p_bucket text, p_path text, p_updated_at timestamptz)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.file_scans
    where bucket_id = p_bucket and object_path = p_path and status = 'clean'
      and scanned_at >= p_updated_at
  );
$$;
revoke all on function public.storage_file_is_clean(text,text,timestamptz) from public;
grant execute on function public.storage_file_is_clean(text,text,timestamptz) to authenticated, anon;

update storage.buckets set public = false where id in (
  'bug-screenshots','bug-videos','tester-banking-documents',
  'qualification-evidence','specialization-evidence','job-attachments'
);

-- Restrictive policies are ANDed with existing ownership/access policies.
-- Service-role scanning still has access to quarantined objects through RLS bypass.
drop policy if exists scanned_files_only on storage.objects;
create policy scanned_files_only on storage.objects as restrictive
for select to authenticated, anon using (
  bucket_id not in ('bug-screenshots','bug-videos','tester-banking-documents',
    'qualification-evidence','specialization-evidence','job-attachments')
  or public.storage_file_is_clean(bucket_id,name,updated_at)
);

-- Use fresh paths; never replace bytes behind a previously issued signed URL.
drop policy if exists scanned_files_immutable on storage.objects;
create policy scanned_files_immutable on storage.objects as restrictive
for update to authenticated, anon using (
  bucket_id not in ('bug-screenshots','bug-videos','tester-banking-documents',
    'qualification-evidence','specialization-evidence','job-attachments')
);
commit;
