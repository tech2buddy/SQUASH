-- Phase 58: admin-editable content for the Tester Academy practical sample.
--
-- Previously the two sample scenarios ("checkout-flow-v1", "booking-flow-v1")
-- were hardcoded in api/tester-qualification-sample.ts -- only a developer
-- editing code could change what a tester sees in the practical sample.
-- This moves that content into the database so admin can edit it, mirroring
-- how a developer edits a real job's brief and tasks.

create table if not exists public.tester_qualification_scenario_templates (
  variant_key text primary key references public.tester_qualification_variants(variant_key) on delete cascade,
  product_name text not null,
  objective text not null,
  environment text not null,
  out_of_scope text not null,
  tasks jsonb not null default '[]'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

drop trigger if exists tester_qualification_scenario_templates_set_updated_at on public.tester_qualification_scenario_templates;
create trigger tester_qualification_scenario_templates_set_updated_at
before update on public.tester_qualification_scenario_templates
for each row execute function public.set_updated_at();

-- Seed with the exact content that was hardcoded in
-- api/tester-qualification-sample.ts, so nothing changes for a tester
-- mid-flow until admin actually edits it.
insert into public.tester_qualification_scenario_templates
  (variant_key, product_name, objective, environment, out_of_scope, tasks)
values
  (
    'checkout-flow-v1',
    'Northstar Store',
    'Verify that a customer can complete a standard card checkout in this simulated store.',
    'Desktop or mobile browser. Use only the sample details shown in the lab; no real payment is taken.',
    'Do not test real card numbers, real accounts, browser extensions or unrelated pages.',
    '[
      {"id": "choose-plan", "title": "Choose the Standard plan", "instruction": "Select the Standard plan on the sample checkout.", "expectedResult": "The selected plan and R149 total are shown."},
      {"id": "enter-details", "title": "Enter sample customer details", "instruction": "Use the sample name and email provided in the checkout panel.", "expectedResult": "The details are accepted and the Pay button becomes available."},
      {"id": "complete-payment", "title": "Attempt the sample payment", "instruction": "Select Card and press Pay R149 once.", "expectedResult": "A simulated confirmation page appears with a successful order reference."}
    ]'::jsonb
  ),
  (
    'booking-flow-v1',
    'Harbour Studio',
    'Verify that a customer can choose a session and receive a booking confirmation in this simulated schedule.',
    'Desktop or mobile browser. This is a controlled training scenario; no real booking is created.',
    'Do not contact a real business, use personal details, or test dates outside the supplied sample flow.',
    '[
      {"id": "choose-session", "title": "Choose a Saturday session", "instruction": "Select the Saturday 10:30 session from the sample schedule.", "expectedResult": "The selected time is reflected in the booking summary."},
      {"id": "enter-guest", "title": "Enter the sample guest details", "instruction": "Use the sample guest name and email in the booking panel.", "expectedResult": "The form validates the details and enables Confirm booking."},
      {"id": "confirm-booking", "title": "Attempt the booking", "instruction": "Press Confirm booking once.", "expectedResult": "A simulated booking confirmation and reference number appear."}
    ]'::jsonb
  )
on conflict (variant_key) do update set
  product_name = excluded.product_name,
  objective = excluded.objective,
  environment = excluded.environment,
  out_of_scope = excluded.out_of_scope,
  tasks = excluded.tasks,
  updated_at = now();

alter table public.tester_qualification_scenario_templates enable row level security;

-- Admin-only read/write via the existing public.is_admin() helper (phase27),
-- same dual-layer pattern as phase54-56: named grants, RLS restricts rows.
grant select, update on public.tester_qualification_scenario_templates to authenticated;

drop policy if exists "qualification_scenario_templates_admin_select" on public.tester_qualification_scenario_templates;
create policy "qualification_scenario_templates_admin_select" on public.tester_qualification_scenario_templates
  for select to authenticated using (public.is_admin());

drop policy if exists "qualification_scenario_templates_admin_update" on public.tester_qualification_scenario_templates;
create policy "qualification_scenario_templates_admin_update" on public.tester_qualification_scenario_templates
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- The serverless route (api/tester-qualification-sample.ts) reads this with
-- the service role key. RLS bypass is not the same as table privileges --
-- see HANDOFF.md's phase37 note -- so this grant is required separately.
grant select on public.tester_qualification_scenario_templates to service_role;
