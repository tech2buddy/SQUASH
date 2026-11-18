-- Read-only: show every file that Phase 70 would quarantine and its records.
-- Run in the production Supabase SQL Editor. No files or rows are changed.
with affected as (
  select o.bucket_id, o.name as object_path, o.updated_at,
         f.status as scan_status, f.scanned_at
  from storage.objects o
  left join public.file_scans f
    on f.bucket_id = o.bucket_id and f.object_path = o.name
  where o.bucket_id in (
    'bug-screenshots','bug-videos','tester-banking-documents',
    'qualification-evidence','specialization-evidence','job-attachments'
  )
    and (f.id is null or f.status <> 'clean' or f.scanned_at < o.updated_at)
), linked_records as (
  select a.bucket_id, a.object_path, 'job_attachment' as record_type,
         j.id::text as record_id, j.job_id::text as related_job_id
  from affected a join public.job_attachments j
    on a.bucket_id = 'job-attachments' and j.file_path = a.object_path
  union all
  select a.bucket_id, a.object_path, 'banking_document', b.tester_id::text, null::text
  from affected a join public.tester_banking_details b
    on a.bucket_id = 'tester-banking-documents' and b.proof_document_path = a.object_path
  union all
  select a.bucket_id, a.object_path, 'bug_report', b.id::text, b.job_id::text
  from affected a join public.bug_reports b
    on a.bucket_id in ('bug-screenshots','bug-videos')
   and (b.screenshot_path = a.object_path or b.video_path = a.object_path
        or a.object_path = any(b.evidence_paths))
  union all
  select a.bucket_id, a.object_path, 'qualification_report', q.id::text, null::text
  from affected a join public.tester_qualification_sample_reports q
    on a.bucket_id = 'qualification-evidence'
   and (a.object_path = any(q.evidence_paths)
        or exists (
          select 1 from jsonb_array_elements(q.issue_reports) issue
          where issue->'evidencePaths' ? a.object_path
        ))
  union all
  select a.bucket_id, a.object_path, 'specialization', s.id::text, null::text
  from affected a join public.tester_specializations s
    on a.bucket_id = 'specialization-evidence' and s.evidence_path = a.object_path
)
select a.bucket_id, a.object_path, a.scan_status, a.updated_at, a.scanned_at,
       coalesce(r.record_type, 'no_matching_record') as record_type,
       r.record_id, r.related_job_id
from affected a left join linked_records r
  on r.bucket_id = a.bucket_id and r.object_path = a.object_path
order by a.bucket_id, a.object_path, record_type;
