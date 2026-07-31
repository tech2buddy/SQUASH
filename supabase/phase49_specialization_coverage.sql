-- SQUASH Phase 49: coverage capacity and match quality
--
-- Two reporting functions that only become answerable once phase 47 makes
-- specializations verifiable.
--
-- 1. Coverage. "How many verified isiZulu speakers do you have?" is the first
--    question a serious buyer asks, and until now the honest answer was "we
--    don't know, they tick their own boxes". It also shows where recruitment is
--    thin: a language with two verified testers cannot support a 3-tester
--    minimum localization job.
--
-- 2. Match quality. Phase 14's cron notifies testers whose specializations
--    intersect a job's preferred_specializations. Nothing has ever checked
--    whether those matched testers actually produce better work. This measures
--    it, so the matching can be tuned against evidence rather than intuition.

begin;

-- ------------------------------------------------------------
-- Coverage by specialization
-- ------------------------------------------------------------
--
-- Aggregate counts only -- no tester is identifiable from the output -- so this
-- is safe to surface on an admin dashboard and, if you want, in sales copy.
-- Restricted to authenticated callers regardless; publishing it is a marketing
-- decision, not a default.

create or replace function public.get_specialization_coverage()
returns table (
  specialization_key text,
  approved_count integer,
  pending_count integer,
  declared_count integer,
  requires_verification boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ts.specialization_key,
    count(*) filter (where ts.verification_status = 'approved')::integer as approved_count,
    count(*) filter (where ts.verification_status = 'pending')::integer as pending_count,
    count(*) filter (where ts.verification_status = 'declared')::integer as declared_count,
    exists (
      select 1 from public.test_type_specialization_requirements r
      where r.specialization_key = ts.specialization_key
    ) as requires_verification
  from public.tester_specializations ts
  group by ts.specialization_key
  order by ts.specialization_key;
$$;

revoke all on function public.get_specialization_coverage() from public;
grant execute on function public.get_specialization_coverage() to authenticated;

-- ------------------------------------------------------------
-- Deliverable capacity per restricted test type
-- ------------------------------------------------------------
--
-- Answers "can we actually staff a localization job right now?" against the
-- minimum tester counts in src/lib/testTypes.ts. The minimum is passed in
-- rather than duplicated here, because testTypes.ts is the single source of
-- truth for it and a second copy in SQL would drift.

create or replace function public.get_test_type_capacity(p_package_key text, p_min_testers integer)
returns table (
  package_key text,
  verified_testers integer,
  min_testers integer,
  can_staff boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p_package_key,
    coalesce(count(distinct ts.tester_id), 0)::integer as verified_testers,
    p_min_testers,
    coalesce(count(distinct ts.tester_id), 0) >= p_min_testers as can_staff
  from public.test_type_specialization_requirements r
  left join public.tester_specializations ts
    on ts.specialization_key = r.specialization_key
   and ts.verification_status = 'approved'
  where r.package_key = p_package_key;
$$;

revoke all on function public.get_test_type_capacity(text, integer) from public;
grant execute on function public.get_test_type_capacity(text, integer) to authenticated;

-- ------------------------------------------------------------
-- Match quality
-- ------------------------------------------------------------
--
-- For every reviewed submission, was the tester a specialization match for the
-- job they worked on? Comparing approval rates across the two groups says
-- whether phase 14's matching is doing real work.
--
-- Admin-only: it aggregates over submission outcomes across all developers.

create or replace function public.get_specialization_match_quality()
returns table (
  matched boolean,
  submissions integer,
  approved integer,
  approval_rate numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  return query
  with reviewed as (
    select
      s.status,
      exists (
        select 1
        from public.tester_specializations ts
        where ts.tester_id = s.tester_id
          and ts.specialization_key = any(coalesce(j.preferred_specializations, '{}'))
      ) as is_match
    from public.test_submissions s
    join public.jobs j on j.id = s.job_id
    where s.status in ('approved', 'rejected')
      and coalesce(array_length(j.preferred_specializations, 1), 0) > 0
  )
  select
    r.is_match as matched,
    count(*)::integer as submissions,
    count(*) filter (where r.status = 'approved')::integer as approved,
    case
      when count(*) = 0 then 0
      else round(count(*) filter (where r.status = 'approved')::numeric / count(*), 3)
    end as approval_rate
  from reviewed r
  group by r.is_match;
end;
$$;

revoke all on function public.get_specialization_match_quality() from public;
grant execute on function public.get_specialization_match_quality() to authenticated;

commit;
