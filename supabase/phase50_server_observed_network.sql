-- SQUASH Phase 50: server-observed network conditions
--
-- Phase 48 recorded the connection, but the tester's own browser wrote the row.
-- Anyone with the console open could insert `effective_type: '2g'` against their
-- own session and manufacture a perfect Low-Data report. Browser DevTools
-- throttling also changes navigator.connection for real, so even the honest code
-- path reported "3G" for someone sitting on fibre.
--
-- This phase splits what the tester *says* from what SQUASH *observes*:
--
--   reported_*  -- client hints from navigator.connection. Useful, not trusted.
--   observed_*  -- derived server-side in /api/network-probe from the request
--                  itself. The tester cannot author these without a proxy.
--
-- The strongest observed signal is the caller's ASN. A tester claiming a
-- township mobile connection whose requests arrive from a hosting provider or a
-- fixed-line ISP is contradicted by infrastructure, not by their own testimony.
--
-- Honest limit: this raises faking from "type a number in the console" to
-- "route real traffic through a real SA mobile connection". It does not make
-- fraud impossible, and nothing here should be described to a developer as
-- proof. It is evidence, and it is checkable.

begin;

-- ------------------------------------------------------------
-- 1. ASN classification
-- ------------------------------------------------------------
--
-- Data-driven rather than a constant in the serverless function, so the
-- classification can be corrected without a deploy -- ASN ownership changes,
-- and the seed below is a starting point that needs maintenance, not gospel.

create table if not exists public.asn_classifications (
  asn integer primary key,
  asn_name text not null,
  -- mobile      -- cellular carrier, what Low-Data testing is meant to be on
  -- fixed       -- fibre/DSL/fixed wireless
  -- datacenter  -- hosting, cloud, VPN exit. Never a real tester's phone.
  -- unknown     -- not classified yet
  network_kind text not null check (network_kind in ('mobile', 'fixed', 'datacenter', 'unknown')),
  country_code text,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.asn_classifications enable row level security;

drop policy if exists "asn_classifications_admin_read" on public.asn_classifications;
create policy "asn_classifications_admin_read" on public.asn_classifications
for select using (public.is_admin());

drop policy if exists "asn_classifications_admin_write" on public.asn_classifications;
create policy "asn_classifications_admin_write" on public.asn_classifications
for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.asn_classifications to authenticated;

-- Major South African networks. ASN ownership does change -- treat this as a
-- seed to verify against your own traffic, not a permanent truth. Anything not
-- listed resolves to 'unknown', which is reported as unverified rather than
-- being held against the tester.
insert into public.asn_classifications (asn, asn_name, network_kind, country_code, notes)
values
  (29975, 'Vodacom', 'mobile', 'ZA', 'Vodacom mobile'),
  (37457, 'Telkom SA', 'fixed', 'ZA', 'Telkom fixed line'),
  (36994, 'Vodacom Business', 'fixed', 'ZA', null),
  (16637, 'MTN South Africa', 'mobile', 'ZA', 'MTN mobile'),
  (327693, 'Cell C', 'mobile', 'ZA', 'Cell C mobile'),
  (328145, 'Rain Networks', 'mobile', 'ZA', 'Rain fixed-LTE/5G'),
  (3741, 'Dimension Data / Internet Solutions', 'fixed', 'ZA', null),
  (10474, 'Openserve', 'fixed', 'ZA', null),
  (327814, 'Afrihost', 'fixed', 'ZA', null),
  (37179, 'RSAWEB', 'fixed', 'ZA', null),
  -- Common hosting and VPN exits. A tester's phone is never behind these.
  (16509, 'Amazon AWS', 'datacenter', null, null),
  (14618, 'Amazon AWS', 'datacenter', null, null),
  (15169, 'Google', 'datacenter', null, null),
  (8075, 'Microsoft Azure', 'datacenter', null, null),
  (13335, 'Cloudflare', 'datacenter', null, null),
  (14061, 'DigitalOcean', 'datacenter', null, null),
  (16276, 'OVH', 'datacenter', null, null),
  (24940, 'Hetzner', 'datacenter', null, null),
  (20473, 'Vultr / Choopa', 'datacenter', null, null),
  (9009, 'M247', 'datacenter', null, 'Common VPN exit'),
  (60068, 'Datacamp / CDN77', 'datacenter', null, 'Common VPN exit'),
  (212238, 'Datacamp', 'datacenter', null, 'Common VPN exit')
on conflict (asn) do nothing;

-- ------------------------------------------------------------
-- 2. Observed columns on the sample
-- ------------------------------------------------------------

alter table public.test_session_network_samples
  add column if not exists observed_asn integer,
  add column if not exists observed_asn_name text,
  add column if not exists observed_network_kind text
    check (observed_network_kind in ('mobile', 'fixed', 'datacenter', 'unknown')),
  add column if not exists observed_country_code text,
  -- consistent   -- client hints agree with what the server observed
  -- contradicted -- they cannot both be true (e.g. "2G" from a datacenter)
  -- unverified   -- ASN unknown, or the browser exposed no hints at all
  add column if not exists consistency text not null default 'unverified'
    check (consistency in ('consistent', 'contradicted', 'unverified')),
  add column if not exists consistency_reason text,
  -- 'client' rows are legacy phase 48 data, written before the server became
  -- the only writer. Kept, but never counted as evidence.
  --
  -- Added defaulting to 'client' so every pre-existing row is correctly marked
  -- as untrusted, then flipped to 'server' for new inserts. Defaulting to
  -- 'server' would silently relabel the client-written history as observed.
  add column if not exists source text not null default 'client'
    check (source in ('client', 'server'));

alter table public.test_session_network_samples
  alter column source set default 'server';

create index if not exists network_samples_consistency_idx
  on public.test_session_network_samples(session_id, consistency);

-- ------------------------------------------------------------
-- 3. The client stops being a writer
-- ------------------------------------------------------------
--
-- /api/network-probe holds the service role key and is now the only path that
-- can create a sample. Without this the observed_* columns would be theatre:
-- a tester could still insert a row with observed_network_kind = 'mobile'.

drop policy if exists "network_samples_insert_own_active_session" on public.test_session_network_samples;
revoke insert on public.test_session_network_samples from authenticated;

-- Select stays as phase 48 defined it: tester, paying developer, admin.

-- ------------------------------------------------------------
-- 4. Summary, restricted to observed samples
-- ------------------------------------------------------------
--
-- Replaces the phase 48 version. Legacy client-written rows are excluded
-- entirely: a developer reading "Tested on 3G" must be reading an observation,
-- not a claim. A session with only client rows now summarises as no samples,
-- and the report falls back to "not captured" -- which is the honest answer.

drop function if exists public.get_session_network_summary(uuid);

create or replace function public.get_session_network_summary(p_session_id uuid)
returns table (
  sample_count integer,
  dominant_effective_type text,
  median_downlink_kbps integer,
  median_rtt_ms integer,
  rtt_stddev_ms integer,
  slowest_load_ms integer,
  save_data_share numeric,
  observed_network_kind text,
  observed_asn_name text,
  contradicted_count integer,
  unverified_count integer,
  first_sample_at timestamptz,
  last_sample_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::integer,
    mode() within group (order by effective_type),
    (percentile_cont(0.5) within group (order by downlink_kbps))::integer,
    (percentile_cont(0.5) within group (order by rtt_ms))::integer,
    -- Near-zero jitter across a whole session is a tell: real mobile links vary
    -- with congestion and handoffs, DevTools throttling applies a flat delay.
    -- Weak on its own, useful next to the ASN.
    coalesce(stddev_samp(rtt_ms), 0)::integer,
    max(slowest_load_ms)::integer,
    round(avg(case when save_data then 1 else 0 end), 2),
    mode() within group (order by observed_network_kind),
    mode() within group (order by observed_asn_name),
    count(*) filter (where consistency = 'contradicted')::integer,
    count(*) filter (where consistency = 'unverified')::integer,
    min(sampled_at),
    max(sampled_at)
  from public.test_session_network_samples
  where session_id = p_session_id
    and source = 'server';
$$;

revoke all on function public.get_session_network_summary(uuid) from public;
grant execute on function public.get_session_network_summary(uuid) to authenticated;

commit;
