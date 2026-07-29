# SQUASH Supabase Backend Notes

This folder contains database setup for the SQUASH backend.

## Security rules

- Never commit real Supabase keys, database passwords, service role keys, payment secrets, or webhook secrets.
- The frontend may only use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local` or Vercel environment variables.
- The Supabase service role key must only live in trusted server-side code or dashboard settings, never in React/Vite code.
- Keep Row Level Security enabled on every table that contains user, job, report, payout, or payment data.

## Phase 1 setup

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase project URL and anon key to `.env.local`.
3. In Supabase SQL Editor, run `supabase/schema.sql` once.
4. Confirm all tables have RLS enabled.
5. Add the same env vars to Vercel Project Settings > Environment Variables.

## Phase 2 auth setup

1. In Supabase SQL Editor, run `supabase/phase2_auth.sql` once.
2. In Supabase SQL Editor, run `supabase/phase2_grants.sql` once.
3. The auth trigger automatically creates `profiles`, `developer_profiles`, and `tester_profiles` rows when users sign up.
4. The grants allow authenticated users to reach tables while RLS still controls which rows they can access.
5. Keep email confirmation on for stronger security, or turn it off temporarily only for local MVP testing.

## Next phase

Phase 3 connects the Post Job page to Supabase so developer jobs are saved to the real database.

## Phase 3: Multi-role accounts

Run supabase/phase3_multi_role.sql after Phase 2. This keeps profiles.role as the default workspace while allowing users to have both developer_profiles and tester_profiles rows.

To add a developer workspace to an existing tester account:

`sql
select public.add_developer_workspace('person@example.com');
` 

To add a tester workspace to an existing developer account:

`sql
select public.add_tester_workspace('person@example.com');
` 



## Phase 4: Developer applicant review

Run `supabase/phase4_developer_applicant_review.sql` after Phase 3.

This adds narrow RLS policies so developers can read tester profile details only for testers who applied to their own jobs. It powers the `/developer/submissions` applicant review page without exposing all tester profiles.

Developer applicant flow:

```sql
-- Tester clicks Apply Now in the app.
-- Developer reviews under /developer/submissions.
-- Accepting updates job_applications.status and creates a test_assignments row.
```


## Phase 5: Tester payout requests

Run `supabase/phase5_tester_payout_requests.sql` after Phase 4.

This allows testers to create their own pending payout requests. Admins still control processing and final payout status updates.

## Phase 34: Platform commission pricing

Run `supabase/phase34_commission_pricing.sql` after Phase 33.

Before this phase, `request_tester_payout()` computed a tester's available balance as `floor(total_amount_zar / testers_needed)` per approved submission — the entire job price split evenly across testers, with zero margin retained by SQUASH before payment processing fees.

This phase changes the split to 62% tester pool / 38% SQUASH commission:

```
floor(total_amount_zar * 0.62 / testers_needed)
```

Example at the current package prices:

| Package | Price | Testers | Old payout/tester | New payout/tester | SQUASH commission |
|---|---|---|---|---|---|
| Starter | R500 | 5 | R100 | R62 | R190 |
| Growth | R1,200 | 10 | R120 | R74 | R456 |
| Pro | R2,500 | 20 | R125 | R77 | R950 |

The real, authoritative payout amount is enforced inside `request_tester_payout()` (`security definer`, callable only via RPC by `authenticated` users). Changing only client-side display numbers would not change what actually gets paid out — this migration is what actually moves the commission split into effect.

The client-side earnings/report display functions in `src/lib/jobApi.ts` were updated in the same change to compute the same 62% split from `total_amount_zar` and `testers_needed`, so what testers see on their dashboard now matches what `request_tester_payout()` will actually approve.

## Phase 35: Test-type-based pricing

Run `supabase/phase35_test_type_pricing.sql` after Phase 34.

Replaces the flat Starter/Growth/Pro tester-count packages with pricing based on what kind of test a developer orders. `jobs.package_key` now holds one of six test types instead of a package tier:

| Test Type | Rate / Tester | Min Testers | Default Testers |
|---|---|---|---|
| Bug Hunting | R100 | 5 | 10 |
| Onboarding / First Impressions | R90 | 3 | 5 |
| Usability Testing | R140 | 5 | 5 |
| Low-Data Testing | R150 | 3 | 3 |
| Localization Testing | R180 | 3 | 3 |
| Accessibility Testing | R220 | 3 | 3 |

These live in `src/lib/testTypes.ts` as the single source of truth for rates, minimums, and defaults — update that file if rates change, not the SQL.

The 62/38 commission split from Phase 34 is untouched: `total_amount_zar` is still just `rate_per_tester * testers_needed`, so `request_tester_payout()` and the tester earnings display keep working exactly as before with no further changes.

A job currently holds one test type — mixing multiple test types in a single job posting (e.g. Bug Hunting + Usability together) was deliberately left out of this phase. It would need a `job_test_types` line-item table instead of a single `package_key` column, and is a bigger schema change than this pricing fix. A developer who wants multiple test types today posts multiple jobs.

### Phase 35b: Backfill legacy package_key values

If Phase 35 fails with `ERROR: 23514: check constraint "jobs_package_key_check" ... is violated`, it means real job rows already exist with the old `starter`/`growth`/`pro`/`enterprise` values. Run `supabase/phase35b_backfill_legacy_package_keys.sql` — it remaps those rows to `bug-hunting` (their `total_amount_zar` and `testers_needed` are untouched, so nothing already charged or paid changes) and then re-applies the constraint.

## Phase 36: Notification and privacy preferences actually do something

Run `supabase/phase36_notification_preferences.sql` after Phase 35 (or 35b).

Before this phase, every toggle under Settings > Notifications and Settings > Privacy saved a value to `user_settings.toggles` that nothing ever read back — every notification was sent unconditionally regardless of what a tester turned off, and "Show specialization tags" / "Allow direct invites" had no effect on anything.

What this phase wires up:

| Toggle | What it now gates |
|---|---|
| New test invites | The existing `cron_job_match_alerts()` job (the "Perfect Match" notification) skips a tester if they've turned this off. |
| Approval updates | `Report Approved` / `Report Rejected` notifications, gated client-side via `createNotification({ preferenceKey: 'approvalUpdates' })`. |
| Changes requested | `Action Required` notification, gated the same way with `preferenceKey: 'changesRequested'`. |
| Payout alerts | `admin_update_weekly_payout()` now sends a "Payout Sent" notification when a payout is marked `paid`, gated by this toggle. |
| Weekly summary | New `cron_weekly_summary()` job, scheduled every Monday 08:00 UTC — only sends to testers who had at least one approved test in the past 7 days and haven't disabled it. |
| Show specialization tags | `getDeveloperApplications()` in `src/lib/jobApi.ts` now omits a tester's specialization tags from what a developer sees if they've turned this off. |
| Allow direct invites | **Left as "Coming soon" and disabled in the UI, not wired up.** There is no direct-invite feature anywhere in the app for this to gate — building one is a separate feature, not a toggle fix. |

Two RLS-related SQL functions back this: `user_wants_notification(uuid, text)` and `get_testers_hiding_specializations(uuid[])`, both `security definer`. They exist because `user_settings` RLS only allows a user to read their own row — a developer's session approving a tester's report, or viewing a tester's application, can't read that tester's settings directly, so the check has to go through a function that runs with elevated privilege instead of a plain client-side query.

## Phase 37: service_role table grants for the payment/email serverless functions

Run `supabase/phase37_service_role_grants.sql` after Phase 36.

`api/create-checkout.ts`, `api/payment-webhook.ts`, and `api/send-email.ts` all connect with the `SUPABASE_SERVICE_ROLE_KEY`. That role bypasses Row Level Security, but RLS bypass and object-level table privileges are two separate things in Postgres — bypassing RLS only skips row policies, it doesn't grant permission to touch the table at all. `jobs`, `job_payments`, `payment_webhook_events`, `job_applications`, `test_submissions`, and `payouts` were only ever granted to `authenticated`/`anon` in earlier phases, so `service_role` had no access to them and every real request failed with `permission denied for table jobs` (Postgres error `42501`) the first time the live payment flow was actually exercised. This phase grants `service_role` exactly the operations those three functions perform on those six tables — not a blanket grant.

## Phase 39: fix text -> enum casts in the core workflow RPCs

Run `supabase/phase39_enum_status_cast_fix.sql` after Phase 38.

`review_job_application`, `review_test_submission`, and `admin_update_weekly_payout` all declare `p_status text` and assign it directly to a column typed as a Postgres enum. Postgres has no implicit or assignment cast from `text` to an enum in an `UPDATE`, so every one of those calls failed with:

```
42804: column "status" is of type application_status but expression is of type text
```

That broke the entire core workflow — a developer could not accept a tester, could not approve a submitted report, and an admin could not mark a payout as paid. It was introduced when phase 19 rewrote these functions during security hardening, and stayed hidden because rows created before phase 19 still show accepted/approved states, so the data looked normal.

Fixed with an explicit `::public.<enum_type>` cast. Each function already validates `p_status` against an allow-list before the cast, so no unexpected value can reach it.

Tables using `text` + a check constraint (`tester_banking_details.verification_status`, `payout_batches.status`, `support_tickets.status`) were never affected.

### Phase 39b: completes the enum cast fix

Run `supabase/phase39b_assignment_status_cast.sql` after Phase 39.

Phase 39 fixed `set status = p_status` in `review_job_application` but missed a second text -> enum assignment in the same function's `ON CONFLICT` clause, so accepting a tester still failed one line later with `42804: column "status" is of type assignment_status`.

A bare literal (`set status = 'active'`) is coerced straight to the column type and is fine. A `CASE` expression must resolve its own result type before the assignment target is considered, and with every branch an untyped literal it resolves to `text` — which then cannot be assigned to an enum column. The fix casts the whole `CASE` result.

Every other status assignment in these functions was audited and is either a bare literal or an already enum-typed plpgsql variable.

## Phase 40: make in-app notifications actually deliver

Run `supabase/phase40_notification_delivery_fix.sql` after Phase 39b.

No notification was ever received when a tester applied to a job, when a developer accepted an applicant, or when a tester submitted a report. Two independent causes, both silent:

1. The only INSERT policy on `public.notifications` is `notifications_admin_insert` (`with check public.is_admin()`). Every one of those events writes a notification for the *other* party from a developer or tester session, so RLS rejected all of them. The client swallowed the error.
2. The client generated its own id (`notif_<timestamp>_<rand>`) and passed it to a `uuid` column, producing `invalid input syntax for type uuid`.

Adds `notify_user(...)`, a `security definer` RPC that writes the notification only if the caller is an admin, is notifying themselves, or shares a job with the recipient as the opposite party (developer ↔ tester via `job_applications` or `test_assignments`). Loosening the INSERT policy instead would have let any authenticated user push arbitrary notifications to anyone.

Banking-status notifications were unaffected — `notify_tester_banking_status()` is a `security definer` trigger and already bypassed RLS.
## Phase 41: Tester qualification foundation

Run `supabase/phase41_tester_qualification_foundation.sql` after Phase 40.

This creates the secure data foundation for the SQUASH Tester Academy: qualification status, two-attempt qualification records, consent records, and separate quiz/sample variants. A tester can never receive the same quiz or practical sample variant twice; the second attempt is assigned the alternate assessment and training scenario.

All tester profiles that existed at the initial rollout are grandfathered as `approved`, so current testers are not interrupted. New tester profiles begin as `not_started`.

Phase 41 intentionally does **not** block job applications yet. The application gate is switched on only in Phase 5, once the Academy, sample test, and admin review workflow have all shipped. This prevents a new tester from being blocked before there is a complete in-product way to qualify.

The migration also prevents a tester from setting their own qualification status through the existing profile-update policy. Qualification state may only change through the protected SQUASH workflow.

## Phase 42: Controlled practical qualification sample

Run `supabase/phase42_tester_qualification_sample_test.sql` after Phase 41.

This adds the private qualification-sample report table and the `qualification-evidence` storage bucket. The practical sample is separate from paid jobs, has no developer or payment data, and requires a structured report plus one to three private evidence files. Evidence is stored inside the tester and attempt folder, with tester/admin-only access and the existing malware scan endpoint.

The application assigns `checkout-flow-v1` on the first attempt and `booking-flow-v1` on the retry. These are deliberately different simulated flows, so a retry cannot simply repeat the original test.
## Phase 43: Administrator qualification review

Run `supabase/phase43_tester_qualification_review.sql` after Phase 42.

This adds `review_tester_qualification_attempt`, a protected administrator-only review function. It records the reviewer, decision and note, then atomically updates the tester's qualification status. `approved` unlocks qualification; `retry_required` makes exactly one fresh alternate quiz and sample flow available; `declined` closes the application. Retry and decline decisions require a clear reviewer note.
## Phase 44: Qualification gate, notifications and probation

Run `supabase/phase44_tester_qualification_gate_notifications.sql` after Phase 43.

This is the launch gate: only active testers with `qualification_status = 'approved'` can insert a paid job application. Qualification decisions also create an in-app notification linked to the Tester Academy. Newly approved testers receive a visible 30-day quality and safety monitoring period; it does not prevent them from applying, but gives SQUASH an early operational review window.
## Phase 45: Qualification quality rubric

Run `supabase/phase45_tester_qualification_quality_rubric.sql` after Phase 44.

Every qualification decision now records four 1–5 reviewer scores: report clarity, reproducibility, evidence quality and task coverage. Approval is enforced only at 70% or above, with no category below 3. The score is kept with the qualification attempt and included in the approval notification, making the admission standard auditable and consistent.
## Phase 46: Operational new-tester probation

Run `supabase/phase46_tester_probation_operations.sql` after Phase 45.

This turns the 30-day quality and safety monitoring period into an auditable admin workflow. From `/A31/probation`, an administrator can clear a reliable tester, extend the observation period by 7–90 days, or restrict future paid-job applications while an issue is investigated. Every decision needs a written reason, preserves the tester’s history, and sends a private in-app notification to the tester.