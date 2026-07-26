begin;

create table if not exists public.email_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.email_rate_limits enable row level security;
revoke all on table public.email_rate_limits from public, anon, authenticated;
grant all on table public.email_rate_limits to service_role;

create or replace function public.consume_email_rate_limit(p_user_id uuid, p_limit integer default 20)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if p_user_id is null or p_limit < 1 or p_limit > 100 then return false; end if;
  insert into public.email_rate_limits (user_id, window_started_at, request_count, updated_at)
  values (p_user_id, now(), 1, now())
  on conflict (user_id) do update set
    window_started_at = case when email_rate_limits.window_started_at <= now() - interval '1 hour' then now() else email_rate_limits.window_started_at end,
    request_count = case when email_rate_limits.window_started_at <= now() - interval '1 hour' then 1 else email_rate_limits.request_count + 1 end,
    updated_at = now()
  returning request_count into v_count;
  return v_count <= p_limit;
end;
$$;
revoke all on function public.consume_email_rate_limit(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_email_rate_limit(uuid, integer) to service_role;

-- Require AAL2 for every existing policy and RPC that calls public.is_admin().
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'::public.user_role
    and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

-- Enforce size and declared MIME constraints at the Storage service.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']::text[]
where id = 'bug-screenshots';

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['video/mp4', 'video/webm']::text[]
where id = 'bug-videos';

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg']::text[]
where id = 'tester-banking-documents';
commit;
