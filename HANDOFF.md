# SQUASH — System Handoff

Context document for anyone (human or AI) picking up this codebase.
Last updated: 28 July 2026.

---

## 1. What SQUASH is

A two-sided marketplace for software testing, focused on South Africa.

- **Developers** post testing jobs for their app or website and pay up front.
- **Testers** (everyday people, not QA professionals) apply, complete the test, and submit bug reports and usability feedback.
- **SQUASH** takes a commission and pays testers out by EFT.

The core pitch is *real humans on real devices and real networks* — not bots, not the developer's own team. The South-Africa-specific angles (testing on 2G/3G, native-language testing across SA languages) are the genuine differentiators.

Production: <https://www.squashqa.co.za> (note: `www` — the bare domain redirects, and that redirect has already broken one integration; see §8).

---

## 2. Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite 8, Tailwind 4, React Router 7 |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Serverless | Vercel functions (`/api/*`) |
| Payments | Yoco (hosted checkout, ZAR) |
| Email | Resend |
| Malware scanning | Cloudmersive |
| Hosting | Vercel, deployed from `main` on GitHub |

There is **no dedicated backend server**. Business logic lives in three places, and knowing which is which matters:

1. **Postgres functions** (`security definer` RPCs) — the authoritative source for anything involving money or permissions.
2. **Vercel serverless functions** — anything needing a secret (Yoco key, service role key, Cloudmersive key).
3. **React client** — everything else, talking to Supabase directly under Row Level Security.

---

## 3. Roles and routing

Three roles: `developer`, `tester`, `admin`. A single user can hold both developer and tester roles (see `phase3_multi_role.sql`).

Route protection is in `src/App.tsx` via `<ProtectedRoute>`:

- `/dashboard`, `/post-job`, `/billing`, `/developer/*` → developer
- `/tester/*`, `/tester-jobs`, `/active-test`, `/test-lab` → tester
- `/A31/*` → admin, **and additionally requires MFA (AAL2)** — an admin without a verified TOTP code is bounced to `/A31/mfa`

`/A31` is a deliberately obscure admin path (not `/admin`). It is excluded from `robots.txt`.

---

## 4. Test types and pricing

**Single source of truth: `src/lib/testTypes.ts`.** Change rates there, not in the SQL and not in page copy.

| Test type | Rate/tester | Min testers | Default | ~Time |
|---|---|---|---|---|
| Bug Hunting | R100 | 5 | 10 | 20 min |
| Onboarding / First Impressions | R90 | 3 | 5 | 15 min |
| Usability Testing | R140 | 5 | 5 | 30 min |
| Low-Data Testing | R150 | 3 | 3 | 30 min |
| Localization Testing | R180 | 3 | 3 | 30 min |
| Accessibility Testing | R220 | 3 | 3 | 40 min |

Job total = `rate per tester × number of testers`.

A job holds **one** test type, stored in `jobs.package_key`. (The column name is historical — it used to hold Starter/Growth/Pro tiers.) Mixing multiple test types in one job was deliberately deferred; it would need a `job_test_types` line-item table. A developer wanting two types posts two jobs.

Separately, `jobs.category` holds a *platform* category (Mobile App, Website, E-commerce, …) from `src/components/testCategories.tsx`. These are two different axes — don't confuse them. There is also a legacy `jobs.test_workflow` enum column from phase 13 that overlaps conceptually and is largely unused.

### Verified specializations (phase 47) — read before touching the premium types

Three test types charge a premium for a *human attribute* rather than for more time:

| Test type | What the price actually buys |
|---|---|
| Low-Data | Someone genuinely on a 2G/3G connection |
| Localization | Someone who genuinely speaks the language |
| Accessibility | Someone who genuinely uses assistive technology |

Before phase 47 none of that was checked. A specialization was a self-declared checkbox in `tester_specializations`; the keys drove notification matching (phase 14) and were displayed to developers, but nothing verified them and nothing gated on them. A tester who spoke no isiZulu could be paid for an R180 localization job.

Now:

- `tester_specializations.verification_status` is one of `declared` → `pending` → `approved` / `rejected`. **`declared` is worthless on its own** — it is a claim, not a credential. Pre-existing rows were deliberately left at `declared` rather than grandfathered in.
- Testers cannot write their own verification state. A trigger (`guard_specialization_verification`) resets those columns on any direct write; only `submit_specialization_evidence` and `review_tester_specialization` can set them, guarded by the `squash.specialization_write` setting — the same pattern phase 43 uses.
- `test_type_specialization_requirements` maps a `package_key` to the keys that satisfy it. A test type with no rows is unrestricted — bug-hunting, onboarding and usability have none on purpose, because "an ordinary South African with a phone" is the whole point of them.
- **The gate is a `before insert` trigger on `job_applications`**, not a UI check. An application without an approved matching specialization is refused by the database. Admins bypass it, so a tester can still be placed manually.
- When a job's `preferred_specializations` overlaps the requirement set, the narrower list wins — that is what lets a developer buy "isiXhosa specifically" rather than "any SA language".

`TEST_TYPE_SPECIALIZATION_REQUIREMENTS` in `src/components/testerSpecializations.ts` mirrors the SQL seed so the UI can explain the rule before someone wastes time applying. **The database is authoritative.** `testerSpecializations.test.ts` parses phase 47 and fails if the two drift — the same guard `pricing.test.ts` puts on the payout formula.

The specialization ids are load-bearing (the requirements table stores them). Add new ids; don't rename existing ones without a migration.

### Measured network conditions (phase 48)

`test_session_network_samples` records `navigator.connection` readings during an active Test Lab session, so a Low-Data report can state what the connection actually was instead of asserting it. `get_session_network_summary()` aggregates it, and `describeNetworkSummary()` renders the one-liner on the developer's report.

The Network Information API is Chromium-only. On Safari and Firefox no samples are written and the report says "not captured" — an absent measurement is never guessed at.

---

## 5. Money flow — read this carefully

### The split

**62% to testers, 38% to SQUASH.** After Yoco's processing fee (~3%), net margin is ~35% regardless of job size.

### Where it is enforced

The authoritative calculation is in Postgres, in `request_tester_payout()` (`phase34_commission_pricing.sql`):

```sql
floor(total_amount_zar * 0.62 / testers_needed)
```

The client mirror is `testerPayoutForJob()` in `src/lib/pricing.ts`. **These two must stay identical.** `src/lib/pricing.test.ts` independently reimplements the SQL formula and asserts they match — if you change the rate, that test fails until both sides agree.

This is not theoretical: before phase 34/35, tester dashboards showed R200 per test while the payout RPC only ever authorised R125. Testers were being shown money they could not withdraw.

### Payment flow (developer pays)

1. Developer completes the post-job form → job saved as `draft`
2. Client calls `POST /api/create-checkout`
3. Function verifies the job belongs to the caller, creates a `job_payments` row (`status: creating`), calls Yoco, stores the checkout URL (`status: pending`)
4. Browser redirects to Yoco's hosted page — **card details never touch SQUASH**
5. Yoco redirects back to `/billing?payment=success|cancelled|failed&job=<id>`
6. **Asynchronously**, Yoco POSTs to `/api/payment-webhook` (delivered via Svix)
7. Webhook verifies the HMAC signature, matches amount + currency, sets `job_payments.status = 'succeeded'`, and flips `jobs.status = 'active'`

**The redirect does not confirm payment — the webhook does.** The billing page polls `job_payments` for a few seconds after redirect, then falls back to "will go live shortly".

Double-payment protection: `create-checkout` refuses if a payment for that job is already `succeeded`, reuses the existing link if `pending`, and blocks if `creating`. A narrow race remains if two tabs fire simultaneously — not closed at the database level.

### Payout flow (tester gets paid)

1. Tester submits report → developer approves → earnings become available
2. Tester must have **admin-approved banking details** (`tester_banking_details.verification_status = 'approved'`) — enforced inside the RPC, not just the UI
3. Tester requests payout (minimum R100) via `request_tester_payout()`, which recomputes the available balance server-side
4. Payout is scheduled for the next Friday
5. Admin marks it paid via `admin_update_weekly_payout()`, which **requires an EFT reference and an uploaded proof-of-payment document**

Only EFT actually works. SnapScan and Airtime appear in the UI but are marked "Coming soon" and disabled — there is no backend for them.

---

## 6. Database

Run migrations **in numeric order** in the Supabase SQL editor: `schema.sql`, then `phase2_*` … `phase38_*`. They are not idempotent as a set; they assume the previous phase ran.

Notable ones:

| File | What it does |
|---|---|
| `phase13` | Test Lab (live testing sessions, tasks, notes) |
| `phase14` | pg_cron jobs — deadline reminders, expiry, level-ups, job matches |
| `phase19`, `27`, `29` | RLS and function privilege hardening |
| `phase22` | `job_payments`, `payment_webhook_events` |
| `phase34` | **62/38 commission split** |
| `phase35` | Test-type pricing (`package_key` constraint change) |
| `phase36` | Notification/privacy preferences actually take effect |
| `phase37` | `service_role` table grants — **without this, all payments fail** |
| `phase38` | `file_scans` table for malware scanning |

`verify_production_security.sql` is a read-only PASS/FAIL report — run it against production after any security-relevant change.

### A trap worth knowing

`service_role` bypasses RLS, but **RLS bypass is not the same as table privileges**. Postgres still requires an explicit `GRANT`. Every payment failed with `42501 permission denied for table jobs` until phase 37 granted them. If you add a new table that a serverless function touches, you must grant `service_role` access to it explicitly.

---

## 7. Serverless functions (`/api`)

| Endpoint | Purpose |
|---|---|
| `create-checkout.ts` | Creates a Yoco checkout session for a job |
| `payment-webhook.ts` | Receives Yoco payment events, activates paid jobs |
| `send-email.ts` | Transactional email via Resend, rate-limited |
| `scan-upload.ts` | Malware-scans uploaded files, deletes infected ones |

All use `SUPABASE_SERVICE_ROLE_KEY` and must never be called with client-side credentials.

---

## 8. Environment variables

Client-side (baked into the bundle at build time — **must not hold secrets**):

| Variable | Notes |
|---|---|
| `VITE_SUPABASE_URL` | Bare project URL. **No trailing slash, no `/rest/v1`** — appending that path caused doubled URLs and broke login. |
| `VITE_SUPABASE_ANON_KEY` | Public by design; safe in the browser |
| `VITE_PAYMENTS_ENABLED` | Must be exactly `"true"` to enable paid job posting |

Server-only (never prefix with `VITE_`):

| Variable | Notes |
|---|---|
| `SUPABASE_URL` | Same value as the VITE one |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses all RLS — treat as a master password |
| `YOCO_SECRET_KEY` | `sk_test_…` or `sk_live_…` |
| `YOCO_WEBHOOK_SECRET` | `whsec_…`, **unique per registered webhook** |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email |
| `CLOUDMERSIVE_API_KEY` | Malware scanning |
| `APP_URL` | Production domain; falls back to `VERCEL_URL` |

Because Vite inlines `VITE_*` at build time, **changing them requires a redeploy** — saving in Vercel is not enough.

### Yoco webhooks

Registered by **API call, not dashboard UI**:

```bash
curl -X POST https://payments.yoco.com/api/webhooks \
  -H "Authorization: Bearer <SECRET_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"name":"squash-payments","url":"https://www.squashqa.co.za/api/payment-webhook"}'
```

The response contains a `secret` shown **once** — that becomes `YOCO_WEBHOOK_SECRET`.

Two hard-won lessons:

1. **Use the `www` URL.** The bare domain redirects, and webhook senders don't follow redirects on POST. A webhook registered against `squashqa.co.za` silently never arrives.
2. **Test and live modes need separate webhook registrations**, each with its own secret.

---

## 9. Current state (as of this writing)

**Working:** auth (email + OAuth), job posting, applications, test lab, submissions, developer review, notifications, EFT payouts, admin dashboard with MFA, Yoco payments end-to-end (verified with a real test-mode transaction).

**Needs action before real customers:**

1. **Yoco is in TEST mode on production.** `YOCO_SECRET_KEY` is `sk_test_…`, so real cards cannot be charged. Going live: get live keys, register a live-mode webhook, update both env vars, redeploy.
2. **`CLOUDMERSIVE_API_KEY` is not set.** Until it is, banking-document uploads are rejected outright (they fail closed by design).
3. **`verify_production_security.sql` has not been confirmed run** against production.
4. **Admin MFA has not been verified end-to-end** on production.
5. **No independent penetration test.**

**Known gaps:**

- Test coverage is 16 tests, concentrated on pricing/payout math. Most of the app is untested.
- Referrals is a stub — `getTesterReferrals()` returns `[]`.
- `SquashCertificatePage` still uses hardcoded data (`// TODO: Replace with Supabase query`).
- "Allow direct invites" setting is disabled/"Coming soon" — no invite feature exists to gate.
- Orphaned Storage files remain after job deletion (DB rows cascade; files don't).
- One pre-existing lint error in `auth.tsx` (`setState` in effect) plus ~75 warnings.

---

## 10. Conventions

- **Verify before claiming.** `npm run typecheck && npm run lint && npm run test` before every commit.
- **Never expose the backend provider in user-facing errors.** Use `SERVICE_UNAVAILABLE_MESSAGE` from `src/lib/supabase.ts`; log the real error to console for developers.
- **Icons come from `lucide-react`.** Not emoji, not unicode characters, not Font Awesome.
- **Money math belongs in `src/lib/pricing.ts`** — dependency-free and unit tested.
- **Don't hardcode rates in page copy.** Derive from `TEST_TYPES`. Marketing copy claiming numbers the system doesn't pay has been a recurring bug.
