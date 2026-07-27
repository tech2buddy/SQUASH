-- Phase 37: Grant service_role table access needed by the serverless
-- payment and email functions (api/create-checkout.ts, api/payment-webhook.ts,
-- api/send-email.ts).
--
-- service_role already bypasses Row Level Security (that's inherent to the
-- role, not something these grants change) -- but bypassing RLS only skips
-- row-level policies, it does not imply object-level table privileges.
-- Postgres still requires an explicit GRANT before any role, including
-- service_role, can touch a table at all. These tables were only ever
-- granted to 'authenticated' and 'anon' in earlier phases, so the
-- server-only service role key was silently unable to read or write them,
-- surfacing as "permission denied for table jobs" (error 42501) the first
-- time the real payment flow was exercised.
--
-- Scope is limited to exactly the tables/operations the serverless
-- functions above actually perform -- not a blanket grant.

grant select, update on public.jobs to service_role;
grant select, insert, update on public.job_payments to service_role;
grant select, insert on public.payment_webhook_events to service_role;
grant select on public.job_applications to service_role;
grant select on public.test_submissions to service_role;
grant select on public.payouts to service_role;
