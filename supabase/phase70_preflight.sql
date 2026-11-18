-- Read-only checks to run before phase70_payment_upload_guards.sql.
-- Both result sets should be empty before enforcing the new rules.

-- Resolve duplicate open checkouts against Yoco before creating the unique index.
select job_id, count(*) as open_count,
       array_agg(id order by created_at) as payment_ids
from public.job_payments
where status in ('creating', 'pending')
group by job_id
having count(*) > 1;

-- Existing files without a current clean scan would become unreadable.
-- Re-scan or remove these objects before enforcing quarantine.
select o.bucket_id, o.name, o.updated_at, f.status as scan_status,
       f.scanned_at
from storage.objects o
left join public.file_scans f
  on f.bucket_id = o.bucket_id and f.object_path = o.name
where o.bucket_id in (
  'bug-screenshots','bug-videos','tester-banking-documents',
  'qualification-evidence','specialization-evidence','job-attachments'
)
and (f.id is null or f.status <> 'clean' or f.scanned_at < o.updated_at)
order by o.bucket_id, o.name;

-- Old pending checkouts lack an expiry and need provider-side reconciliation.
select id, job_id, provider_checkout_id, created_at, status
from public.job_payments
where status = 'pending'
  and nullif(metadata->>'checkout_expires_at', '') is null
order by created_at;
