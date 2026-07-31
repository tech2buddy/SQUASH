-- SQUASH Phase 48: measured network conditions for low-data testing
--
-- The Low-Data package (R150) sells testing under real 2G/3G conditions, but
-- the delivered report has so far been prose: "the checkout felt slow". That is
-- worth less than it should be, and it is unfalsifiable.
--
-- This phase records what the connection actually was while the tester worked.
-- Samples are taken from the browser's Network Information API during an active
-- session and summarised onto the report, so the developer receives something
-- like:
--
--   Tested on 3G - 480 kbps down - 180 ms RTT - slowest page 8.4 s
--
-- That is the geographic moat made legible: nobody testing from outside South
-- Africa can produce this data, because they are not on these networks.

begin;

create table if not exists public.test_session_network_samples (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_lab_sessions(id) on delete cascade,
  tester_id uuid not null references public.tester_profiles(user_id) on delete cascade,
  -- Values come from navigator.connection. effective_type is the browser's own
  -- classification ('slow-2g' | '2g' | '3g' | '4g'); it is a round-trip-time
  -- based estimate, not the radio technology, which is what we actually care
  -- about for perceived speed.
  effective_type text check (effective_type in ('slow-2g', '2g', '3g', '4g', 'unknown')),
  downlink_kbps integer check (downlink_kbps >= 0),
  rtt_ms integer check (rtt_ms >= 0),
  save_data boolean not null default false,
  -- Largest page load observed since the previous sample, in milliseconds.
  slowest_load_ms integer check (slowest_load_ms >= 0),
  sampled_at timestamptz not null default now()
);

create index if not exists test_session_network_samples_session_idx
  on public.test_session_network_samples(session_id, sampled_at);

alter table public.test_session_network_samples enable row level security;

-- Same visibility rule as test_lab_sessions: the tester who produced it, the
-- developer who paid for the job, and admins.
drop policy if exists "network_samples_select_related" on public.test_session_network_samples;
create policy "network_samples_select_related" on public.test_session_network_samples
for select using (
  public.is_admin()
  or tester_id = auth.uid()
  or exists (
    select 1
    from public.test_lab_sessions s
    join public.jobs j on j.id = s.job_id
    where s.id = test_session_network_samples.session_id
      and j.developer_id = auth.uid()
  )
);

drop policy if exists "network_samples_insert_own_active_session" on public.test_session_network_samples;
create policy "network_samples_insert_own_active_session" on public.test_session_network_samples
for insert with check (
  tester_id = auth.uid()
  and exists (
    select 1 from public.test_lab_sessions s
    where s.id = session_id
      and s.tester_id = auth.uid()
      and s.status <> 'submitted'::public.lab_session_status
  )
);

grant select, insert on public.test_session_network_samples to authenticated;

-- ------------------------------------------------------------
-- Summary for the developer-facing report
-- ------------------------------------------------------------
--
-- Returns null-ish zero row rather than raising when a session has no samples:
-- a job posted before this phase, or a tester on a browser without the Network
-- Information API (Safari and Firefox do not implement it), legitimately has
-- none. The client renders "not captured" in that case rather than implying the
-- test was never run.

create or replace function public.get_session_network_summary(p_session_id uuid)
returns table (
  sample_count integer,
  dominant_effective_type text,
  median_downlink_kbps integer,
  median_rtt_ms integer,
  slowest_load_ms integer,
  save_data_share numeric,
  first_sample_at timestamptz,
  last_sample_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::integer as sample_count,
    mode() within group (order by effective_type) as dominant_effective_type,
    (percentile_cont(0.5) within group (order by downlink_kbps))::integer as median_downlink_kbps,
    (percentile_cont(0.5) within group (order by rtt_ms))::integer as median_rtt_ms,
    max(slowest_load_ms)::integer as slowest_load_ms,
    round(avg(case when save_data then 1 else 0 end), 2) as save_data_share,
    min(sampled_at) as first_sample_at,
    max(sampled_at) as last_sample_at
  from public.test_session_network_samples
  where session_id = p_session_id;
$$;

revoke all on function public.get_session_network_summary(uuid) from public;
grant execute on function public.get_session_network_summary(uuid) to authenticated;

commit;
