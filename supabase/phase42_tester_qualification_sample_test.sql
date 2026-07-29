-- SQUASH Phase 42: controlled tester qualification sample test
--
-- Stores a tester's practical Academy submission separately from paid-job
-- reports. There is no developer, payment or real customer data involved.

begin;

create table if not exists public.tester_qualification_sample_reports (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.tester_qualification_attempts(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  sample_variant_key text not null references public.tester_qualification_variants(variant_key),
  task_outcomes jsonb not null default '[]'::jsonb,
  bug_title text not null check (char_length(trim(bug_title)) between 8 and 180),
  steps_to_reproduce text not null check (char_length(trim(steps_to_reproduce)) between 20 and 4000),
  expected_result text not null check (char_length(trim(expected_result)) between 10 and 2000),
  actual_result text not null check (char_length(trim(actual_result)) between 10 and 2000),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  reproducibility text not null check (reproducibility in ('always', 'often', 'sometimes', 'once')),
  tester_notes text check (tester_notes is null or char_length(tester_notes) <= 3000),
  environment jsonb not null default '{}'::jsonb,
  evidence_paths text[] not null default '{}',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tester_qualification_sample_report_outcomes_array check (jsonb_typeof(task_outcomes) = 'array')
);

create index if not exists tester_qualification_sample_reports_review_idx
  on public.tester_qualification_sample_reports(submitted_at asc);

drop trigger if exists tester_qualification_sample_reports_set_updated_at on public.tester_qualification_sample_reports;
create trigger tester_qualification_sample_reports_set_updated_at
before update on public.tester_qualification_sample_reports
for each row execute function public.set_updated_at();

alter table public.tester_qualification_sample_reports enable row level security;

drop policy if exists "qualification_sample_reports_select_own_or_admin" on public.tester_qualification_sample_reports;
create policy "qualification_sample_reports_select_own_or_admin"
on public.tester_qualification_sample_reports for select to authenticated
using (tester_id = auth.uid() or public.is_admin());

-- Submissions are inserted only by the authenticated server endpoint after it
-- validates ownership, report completeness and the submitted attempt state.
revoke all on table public.tester_qualification_sample_reports from anon, authenticated;
grant select on public.tester_qualification_sample_reports to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'qualification-evidence',
  'qualification-evidence',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Files are always stored as <tester-id>/<attempt-id>/<random-file>.
drop policy if exists "qualification_evidence_insert_own_active_attempt" on storage.objects;
create policy "qualification_evidence_insert_own_active_attempt"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'qualification-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.tester_qualification_attempts a
    where a.id::text = (storage.foldername(name))[2]
      and a.tester_id = auth.uid()
      and a.status in ('quiz_passed', 'sample_in_progress')
  )
);

drop policy if exists "qualification_evidence_select_owner_or_admin" on storage.objects;
create policy "qualification_evidence_select_owner_or_admin"
on storage.objects for select to authenticated
using (
  bucket_id = 'qualification-evidence'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "qualification_evidence_delete_own_before_submit" on storage.objects;
create policy "qualification_evidence_delete_own_before_submit"
on storage.objects for delete to authenticated
using (
  bucket_id = 'qualification-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.tester_qualification_attempts a
    where a.id::text = (storage.foldername(name))[2]
      and a.tester_id = auth.uid()
      and a.status in ('quiz_passed', 'sample_in_progress')
  )
);

notify pgrst, 'reload schema';

commit;
