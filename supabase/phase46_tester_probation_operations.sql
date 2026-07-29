-- SQUASH Phase 46: operational new-tester probation controls

begin;

alter table public.tester_profiles
  add column if not exists probation_status text not null default 'not_applicable'
    check (probation_status in ('not_applicable', 'active', 'extended', 'cleared', 'restricted')),
  add column if not exists probation_note text,
  add column if not exists probation_last_reviewed_at timestamptz,
  add column if not exists probation_reviewer_id uuid references public.profiles(id) on delete set null;

update public.tester_profiles
set probation_status = 'active'
where qualification_status = 'approved'
  and qualification_probation_ends_at > now()
  and probation_status = 'not_applicable';

create or replace function public.guard_tester_qualification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin()
     and current_setting('squash.qualification_write', true) is distinct from 'on'
     and (
       new.qualification_status is distinct from old.qualification_status
       or new.qualification_approved_at is distinct from old.qualification_approved_at
       or new.qualification_updated_at is distinct from old.qualification_updated_at
       or new.qualification_probation_started_at is distinct from old.qualification_probation_started_at
       or new.qualification_probation_ends_at is distinct from old.qualification_probation_ends_at
       or new.probation_status is distinct from old.probation_status
       or new.probation_note is distinct from old.probation_note
       or new.probation_last_reviewed_at is distinct from old.probation_last_reviewed_at
       or new.probation_reviewer_id is distinct from old.probation_reviewer_id
     ) then
    raise exception 'Qualification and probation status are managed by the SQUASH review workflow';
  end if;
  return new;
end;
$$;

-- Keeps probation status synchronized with protected qualification decisions.
create or replace function public.sync_tester_probation_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.qualification_status = 'approved'
     and old.qualification_status is distinct from 'approved' then
    new.probation_status := 'active';
    new.probation_note := null;
    new.probation_last_reviewed_at := null;
    new.probation_reviewer_id := null;
  elsif new.qualification_status <> 'approved' then
    new.probation_status := 'not_applicable';
    new.probation_note := null;
    new.probation_last_reviewed_at := null;
    new.probation_reviewer_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists tester_profiles_sync_qualification_probation on public.tester_profiles;
create trigger tester_profiles_sync_qualification_probation
before update on public.tester_profiles
for each row execute function public.sync_tester_probation_status();

create or replace function public.is_tester_qualified(p_tester_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_tester_id is null then false
    when p_tester_id <> auth.uid() and not public.is_admin() then false
    else exists (
      select 1
      from public.tester_profiles tp
      join public.profiles p on p.id = tp.user_id
      where tp.user_id = p_tester_id
        and tp.qualification_status = 'approved'
        and tp.probation_status <> 'restricted'
        and p.account_status = 'active'
    )
  end;
$$;

create or replace function public.review_tester_probation(
  p_tester_id uuid,
  p_decision text,
  p_note text,
  p_extension_days integer default 30
)
returns public.tester_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.tester_profiles;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_title text;
  v_body text;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('cleared', 'extended', 'restricted') then raise exception 'Unsupported probation decision'; end if;
  if coalesce(char_length(v_note), 0) < 10 then raise exception 'Add a clear probation review note'; end if;
  if char_length(v_note) > 3000 then raise exception 'Probation review note is too long'; end if;
  if p_decision = 'extended' and p_extension_days not between 7 and 90 then raise exception 'Probation extension must be between 7 and 90 days'; end if;

  select * into v_profile from public.tester_profiles where user_id = p_tester_id for update;
  if v_profile.user_id is null then raise exception 'Tester profile not found'; end if;
  if v_profile.qualification_status <> 'approved' then raise exception 'Only approved testers can be reviewed for probation'; end if;
  if v_profile.probation_status not in ('active', 'extended') then raise exception 'This tester is not in an active probation period'; end if;

  perform set_config('squash.qualification_write', 'on', true);
  update public.tester_profiles
  set probation_status = p_decision,
      probation_note = v_note,
      probation_last_reviewed_at = now(),
      probation_reviewer_id = auth.uid(),
      qualification_probation_ends_at = case
        when p_decision = 'cleared' then now()
        when p_decision = 'extended' then greatest(coalesce(qualification_probation_ends_at, now()), now()) + make_interval(days => p_extension_days)
        else qualification_probation_ends_at
      end,
      qualification_updated_at = now()
  where user_id = p_tester_id
  returning * into v_profile;

  if p_decision = 'cleared' then
    v_title := 'Your SQUASH probation is complete';
    v_body := 'Your new-tester quality monitoring period is complete. Keep submitting clear, reproducible reports with useful evidence.';
  elsif p_decision = 'extended' then
    v_title := 'Your SQUASH probation was extended';
    v_body := 'Your quality monitoring period was extended. Reviewer note: ' || v_note;
  else
    v_title := 'Your SQUASH tester access is under review';
    v_body := 'New paid-job applications are paused while SQUASH reviews your probation. Reviewer note: ' || v_note;
  end if;

  insert into public.notifications (user_id, title, body, notification_type, link_path, priority, status)
  values (p_tester_id, v_title, v_body, 'security', '/tester-qualification', case when p_decision = 'restricted' then 'high' else 'normal' end, 'unread');

  return v_profile;
end;
$$;

revoke all on function public.review_tester_probation(uuid, text, text, integer) from public;
grant execute on function public.review_tester_probation(uuid, text, text, integer) to authenticated;

create index if not exists tester_profiles_probation_watch_idx
  on public.tester_profiles(probation_status, qualification_probation_ends_at)
  where probation_status in ('active', 'extended');

commit;
