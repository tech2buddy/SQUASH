begin;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Remove that
-- inherited permission from every SECURITY DEFINER function except the four
-- read-only identity helpers used safely inside RLS policies.
do $$
declare
  target_function regprocedure;
begin
  for target_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.proname not in ('current_user_role', 'is_admin', 'is_developer', 'is_tester')
  loop
    execute format('revoke execute on function %s from public, anon', target_function);
  end loop;
end;
$$;

-- Prevent future postgres-owned functions in public from automatically
-- becoming executable through the PUBLIC pseudo-role.
alter default privileges in schema public revoke execute on functions from public;

-- Legacy workspace, notification, referral, cron and trigger helpers are not
-- called by the browser application. They remain executable only by their owner.

-- The RLS helpers are non-mutating and return null/false without a user JWT.
grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_developer() to anon, authenticated;
grant execute on function public.is_tester() to anon, authenticated;

commit;