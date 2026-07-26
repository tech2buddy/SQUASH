-- Run this read-only report in the PRODUCTION Supabase SQL editor after phase27.
-- Expected result: the first and third queries return zero rows.

select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity = false
order by tablename;

select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select n.nspname as schema_name, p.proname as function_name, r.rolname as grantee
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a on true
join pg_roles r on r.oid = a.grantee
where n.nspname = 'public'
  and p.prosecdef
  and r.rolname in ('anon', 'public')
order by p.proname, r.rolname;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

select public.is_admin() as admin_access_with_current_aal,
       auth.jwt() ->> 'aal' as current_aal;