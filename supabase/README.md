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
