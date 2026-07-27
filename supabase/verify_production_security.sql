-- Read-only production security report.
-- Run this in the PRODUCTION Supabase SQL editor. It changes nothing.
--
-- Returns ONE result set so nothing gets hidden: the Supabase SQL editor
-- only displays the last result of a multi-statement script, which meant
-- the earlier version of this file silently hid its two most important
-- checks. Every row is either PASS or FAIL -- read the FAIL rows.

with rls_disabled as (
  select tablename::text as detail
  from pg_tables
  where schemaname = 'public' and rowsecurity = false
),
definer_exposed as (
  select (p.proname || ' -> ' || r.rolname)::text as detail
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a on true
  join pg_roles r on r.oid = a.grantee
  where n.nspname = 'public'
    and p.prosecdef
    and r.rolname in ('anon', 'public')
),
public_buckets as (
  select id::text as detail
  from storage.buckets
  where public = true
),
anon_writable as (
  select (table_name || ' (' || privilege_type || ')')::text as detail
  from information_schema.role_table_grants
  where table_schema = 'public'
    and grantee = 'anon'
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
),
unprotected_money as (
  -- Tables holding money or banking data must have RLS on, no exceptions.
  select t.tablename::text as detail
  from pg_tables t
  where t.schemaname = 'public'
    and t.rowsecurity = false
    and t.tablename in (
      'payouts', 'job_payments', 'payout_methods', 'payout_batches',
      'tester_banking_details', 'payment_webhook_events'
    )
)
select
  '1. Tables with RLS disabled' as check_name,
  case when exists (select 1 from rls_disabled) then 'FAIL' else 'PASS' end as status,
  coalesce((select string_agg(detail, ', ' order by detail) from rls_disabled), 'none') as details
union all
select
  '2. SECURITY DEFINER functions reachable by anon/public',
  case when exists (select 1 from definer_exposed) then 'FAIL' else 'PASS' end,
  coalesce((select string_agg(detail, ', ' order by detail) from definer_exposed), 'none')
union all
select
  '3. Money/banking tables without RLS',
  case when exists (select 1 from unprotected_money) then 'FAIL' else 'PASS' end,
  coalesce((select string_agg(detail, ', ' order by detail) from unprotected_money), 'none')
union all
select
  '4. anon role has write access to public tables',
  case when exists (select 1 from anon_writable) then 'FAIL' else 'PASS' end,
  coalesce((select string_agg(detail, ', ' order by detail) from anon_writable), 'none')
union all
select
  '5. Public (unauthenticated) storage buckets',
  case when exists (select 1 from public_buckets) then 'REVIEW' else 'PASS' end,
  coalesce((select string_agg(detail, ', ' order by detail) from public_buckets), 'none')
order by check_name;
