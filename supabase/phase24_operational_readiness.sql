-- SQUASH Phase 24: production support, escalation, moderation and incident operations.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('account', 'payment', 'payout', 'job', 'report', 'safety', 'privacy', 'other')),
  subject text not null check (char_length(subject) between 5 and 160),
  description text not null check (char_length(description) between 10 and 5000),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  escalation_level integer not null default 0 check (escalation_level between 0 and 3),
  response_due_at timestamptz not null,
  assigned_admin uuid references auth.users(id) on delete set null,
  escalated_at timestamptz,
  admin_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_created_idx on public.support_tickets(user_id, created_at desc);
create index if not exists support_tickets_admin_queue_idx on public.support_tickets(status, response_due_at);
alter table public.support_tickets enable row level security;

drop policy if exists "support_ticket_owner_or_admin_select" on public.support_tickets;
create policy "support_ticket_owner_or_admin_select" on public.support_tickets
for select using (user_id = auth.uid() or public.is_admin());

revoke insert, update, delete on public.support_tickets from authenticated;

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  is_admin_reply boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_messages_ticket_idx on public.support_ticket_messages(ticket_id, created_at);
alter table public.support_ticket_messages enable row level security;

drop policy if exists "support_message_participant_select" on public.support_ticket_messages;
create policy "support_message_participant_select" on public.support_ticket_messages
for select using (
  public.is_admin()
  or exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id and t.user_id = auth.uid()
  )
);

revoke insert, update, delete on public.support_ticket_messages from authenticated;

create or replace function public.create_support_ticket(
  p_category text,
  p_subject text,
  p_description text
) returns public.support_tickets
language plpgsql security definer set search_path = public
as $$
declare
  v_priority text;
  v_due interval;
  v_ticket public.support_tickets;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_category not in ('account', 'payment', 'payout', 'job', 'report', 'safety', 'privacy', 'other') then
    raise exception 'Invalid support category';
  end if;

  v_priority := case
    when p_category in ('safety', 'privacy') then 'urgent'
    when p_category in ('payment', 'payout') then 'high'
    else 'normal'
  end;
  v_due := case v_priority
    when 'urgent' then interval '1 hour'
    when 'high' then interval '4 hours'
    else interval '1 day'
  end;

  insert into public.support_tickets (
    user_id, category, subject, description, priority, response_due_at
  ) values (
    auth.uid(), p_category, trim(p_subject), trim(p_description), v_priority, now() + v_due
  ) returning * into v_ticket;

  insert into public.support_ticket_messages(ticket_id, sender_id, body)
  values (v_ticket.id, auth.uid(), trim(p_description));
  return v_ticket;
end;
$$;

revoke all on function public.create_support_ticket(text, text, text) from public;
grant execute on function public.create_support_ticket(text, text, text) to authenticated;

create or replace function public.add_support_ticket_message(
  p_ticket_id uuid,
  p_body text
) returns public.support_ticket_messages
language plpgsql security definer set search_path = public
as $$
declare
  v_ticket public.support_tickets;
  v_message public.support_ticket_messages;
  v_is_admin boolean := public.is_admin();
begin
  select * into v_ticket from public.support_tickets where id = p_ticket_id for update;
  if v_ticket.id is null then raise exception 'Support ticket not found'; end if;
  if not v_is_admin and v_ticket.user_id <> auth.uid() then raise exception 'Access denied'; end if;
  if v_ticket.status = 'closed' then raise exception 'This support ticket is closed'; end if;

  insert into public.support_ticket_messages(ticket_id, sender_id, body, is_admin_reply)
  values (p_ticket_id, auth.uid(), trim(p_body), v_is_admin)
  returning * into v_message;

  update public.support_tickets
  set status = case when v_is_admin then 'waiting_user' else 'open' end,
      updated_at = now()
  where id = p_ticket_id;
  return v_message;
end;
$$;

revoke all on function public.add_support_ticket_message(uuid, text) from public;
grant execute on function public.add_support_ticket_message(uuid, text) to authenticated;

create or replace function public.admin_update_support_ticket(
  p_ticket_id uuid,
  p_status text,
  p_priority text,
  p_note text default null
) returns public.support_tickets
language plpgsql security definer set search_path = public
as $$
declare
  v_ticket public.support_tickets;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('open', 'in_progress', 'waiting_user', 'resolved', 'closed') then raise exception 'Invalid ticket status'; end if;
  if p_priority not in ('low', 'normal', 'high', 'urgent') then raise exception 'Invalid ticket priority'; end if;

  update public.support_tickets set
    status = p_status,
    priority = p_priority,
    assigned_admin = coalesce(assigned_admin, auth.uid()),
    admin_note = nullif(trim(p_note), ''),
    escalation_level = case
      when p_priority = 'urgent' then greatest(escalation_level, 2)
      when p_priority = 'high' then greatest(escalation_level, 1)
      else escalation_level
    end,
    escalated_at = case when p_priority in ('high', 'urgent') then coalesce(escalated_at, now()) else escalated_at end,
    resolved_at = case when p_status in ('resolved', 'closed') then coalesce(resolved_at, now()) else null end,
    updated_at = now()
  where id = p_ticket_id
  returning * into v_ticket;
  if v_ticket.id is null then raise exception 'Support ticket not found'; end if;

  insert into public.admin_activity_logs(admin_id, action, entity_type, entity_id, note, metadata)
  values (auth.uid(), 'support_ticket_' || p_status, 'support_ticket', p_ticket_id, nullif(trim(p_note), ''), jsonb_build_object('priority', p_priority));
  return v_ticket;
end;
$$;

revoke all on function public.admin_update_support_ticket(uuid, text, text, text) from public;
grant execute on function public.admin_update_support_ticket(uuid, text, text, text) to authenticated;

create or replace view public.support_escalation_queue
with (security_invoker = true)
as
select t.*,
  case
    when t.status in ('resolved', 'closed') then false
    else t.response_due_at <= now()
  end as is_overdue
from public.support_tickets t
where t.status not in ('resolved', 'closed');

grant select on public.support_escalation_queue to authenticated;

create table if not exists public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid references auth.users(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  report_id uuid references public.test_submissions(id) on delete set null,
  reason text not null check (char_length(reason) between 5 and 2000),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'investigating', 'actioned', 'dismissed', 'closed')),
  payout_hold boolean not null default false,
  findings text,
  assigned_admin uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.moderation_cases enable row level security;
drop policy if exists "moderation_cases_admin_only" on public.moderation_cases;
create policy "moderation_cases_admin_only" on public.moderation_cases
for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.operational_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 160),
  severity text not null check (severity in ('sev1', 'sev2', 'sev3', 'sev4')),
  status text not null default 'investigating' check (status in ('investigating', 'contained', 'monitoring', 'resolved')),
  impact text not null check (char_length(impact) between 5 and 5000),
  response_actions text,
  owner_admin uuid not null references auth.users(id) on delete restrict,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.operational_incidents enable row level security;
drop policy if exists "operational_incidents_admin_only" on public.operational_incidents;
create policy "operational_incidents_admin_only" on public.operational_incidents
for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.operational_playbooks (
  key text primary key,
  title text not null,
  version text not null,
  content text not null,
  updated_at timestamptz not null default now()
);

alter table public.operational_playbooks enable row level security;
drop policy if exists "operational_playbooks_admin_only" on public.operational_playbooks;
create policy "operational_playbooks_admin_only" on public.operational_playbooks
for select using (public.is_admin());
revoke insert, update, delete on public.operational_playbooks from authenticated;

insert into public.operational_playbooks(key, title, version, content) values
('support-escalation', 'Support escalation rules', '1.0',
'Urgent safety and privacy cases: acknowledge within 1 hour and notify the owner admin. Payment and payout cases: acknowledge within 4 hours. Other cases: acknowledge within one business day. Escalate repeated abuse, suspected fraud, account takeover, data exposure, or payment mismatch immediately.'),
('moderation', 'Moderation playbook', '1.0',
'Preserve evidence before action. Record the reported user, job or submission, reason, severity and findings. Use a payout hold only for a documented risk. Apply the least restrictive proportionate action. Record the decision and provide an appeal path. Never delete financial or audit evidence.'),
('incident-response', 'Incident response procedure', '1.0',
'1. Record the incident and severity. 2. Contain the affected function and protect evidence. 3. Assess users, funds and data affected. 4. Notify the owner admin and required service providers. 5. Recover and verify controls. 6. Communicate accurately to affected users when required. 7. Resolve only after monitoring. 8. Complete a written review and corrective actions.')
on conflict (key) do update set
  title = excluded.title,
  version = excluded.version,
  content = excluded.content,
  updated_at = now();

grant select on public.support_tickets to authenticated;
grant select on public.support_ticket_messages to authenticated;
grant select, insert, update on public.moderation_cases to authenticated;
grant select, insert, update on public.operational_incidents to authenticated;
grant select on public.operational_playbooks to authenticated;
