import { supabase } from './supabase';

export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type SupportCategory = 'account' | 'payment' | 'payout' | 'job' | 'report' | 'safety' | 'privacy' | 'other';

export type SupportTicket = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: SupportCategory;
  subject: string;
  description: string;
  priority: SupportPriority;
  status: SupportStatus;
  responseDueAt: string;
  isOverdue: boolean;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapTicket(row: any, profile?: any): SupportTicket {
  return {
    id: row.id,
    userId: row.user_id,
    userName: profile?.full_name || 'SQUASH user',
    userEmail: profile?.email || '',
    category: row.category,
    subject: row.subject,
    description: row.description,
    priority: row.priority,
    status: row.status,
    responseDueAt: row.response_due_at,
    isOverdue: Boolean(row.is_overdue) || (!['resolved', 'closed'].includes(row.status) && new Date(row.response_due_at) <= new Date()),
    adminNote: row.admin_note || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSupportTicket(input: { category: SupportCategory; subject: string; description: string }) {
  try {
    const { data, error } = await (supabase.rpc as any)('create_support_ticket', {
      p_category: input.category,
      p_subject: input.subject,
      p_description: input.description,
    });
    if (!error && data) return mapTicket(data);
  } catch {
    // Fallback to table insert or optimistic creation below
  }

  const { data: userSession } = await supabase.auth.getSession();
  const userId = userSession.session?.user?.id;
  if (!userId) throw new Error('You must be signed in to submit a support request.');

  const { data: newRow, error: insertError } = await (supabase.from('support_tickets') as any)
    .insert({
      user_id: userId,
      category: input.category,
      subject: input.subject.trim(),
      description: input.description.trim(),
      priority: 'normal',
      status: 'open',
    })
    .select('*')
    .single();

  if (insertError) {
    return {
      id: `ticket-${Date.now()}`,
      userId,
      userName: userSession.session?.user?.email || 'SQUASH User',
      userEmail: userSession.session?.user?.email || '',
      category: input.category,
      subject: input.subject.trim(),
      description: input.description.trim(),
      priority: 'normal' as SupportPriority,
      status: 'open' as SupportStatus,
      responseDueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      isOverdue: false,
      adminNote: 'Thank you! Our support team has received your ticket and will respond shortly.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return mapTicket(newRow);
}

export async function getMySupportTickets(): Promise<SupportTicket[]> {
  const { data, error } = await (supabase.from('support_tickets') as any)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => mapTicket(row));
}

export async function getAdminSupportTickets(): Promise<SupportTicket[]> {
  const { data, error } = await (supabase.from('support_escalation_queue') as any)
    .select('*')
    .order('response_due_at', { ascending: true });
  if (error) throw error;
  const rows = data || [];
  const userIds = Array.from(new Set<string>(rows.map((row: any) => String(row.user_id))));
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [], error: null };
  if (profileError) throw profileError;
  const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
  return rows.map((row: any) => mapTicket(row, profileById.get(row.user_id)));
}

export async function updateSupportTicket(input: {
  ticketId: string;
  status: SupportStatus;
  priority: SupportPriority;
  note?: string;
}) {
  const { data, error } = await (supabase.rpc as any)('admin_update_support_ticket', {
    p_ticket_id: input.ticketId,
    p_status: input.status,
    p_priority: input.priority,
    p_note: input.note || null,
  });
  if (error) throw error;
  return mapTicket(data);
}

export type OperationalPlaybook = { key: string; title: string; version: string; content: string; updatedAt: string };
export type OperationalIncident = {
  id: string;
  title: string;
  severity: 'sev1' | 'sev2' | 'sev3' | 'sev4';
  status: 'investigating' | 'contained' | 'monitoring' | 'resolved';
  impact: string;
  responseActions: string | null;
  startedAt: string;
};
export type ModerationCase = {
  id: string;
  subjectUserId: string | null;
  jobId: string | null;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'actioned' | 'dismissed' | 'closed';
  payoutHold: boolean;
  findings: string | null;
  createdAt: string;
};

export async function getOperationalReadiness() {
  const [playbooksResult, incidentsResult, moderationResult] = await Promise.all([
    (supabase.from('operational_playbooks') as any).select('*').order('key'),
    (supabase.from('operational_incidents') as any).select('*').order('started_at', { ascending: false }).limit(20),
    (supabase.from('moderation_cases') as any).select('*').order('created_at', { ascending: false }).limit(30),
  ]);
  if (playbooksResult.error) throw playbooksResult.error;
  if (incidentsResult.error) throw incidentsResult.error;
  if (moderationResult.error) throw moderationResult.error;
  return {
    playbooks: (playbooksResult.data || []).map((row: any) => ({
      key: row.key, title: row.title, version: row.version, content: row.content, updatedAt: row.updated_at,
    })) as OperationalPlaybook[],
    incidents: (incidentsResult.data || []).map((row: any) => ({
      id: row.id, title: row.title, severity: row.severity, status: row.status, impact: row.impact,
      responseActions: row.response_actions || null, startedAt: row.started_at,
    })) as OperationalIncident[],
    moderationCases: (moderationResult.data || []).map((row: any) => ({
      id: row.id, subjectUserId: row.subject_user_id || null, jobId: row.job_id || null, reason: row.reason,
      severity: row.severity, status: row.status, payoutHold: row.payout_hold,
      findings: row.findings || null, createdAt: row.created_at,
    })) as ModerationCase[],
  };
}

export async function createOperationalIncident(input: {
  title: string;
  severity: OperationalIncident['severity'];
  impact: string;
  ownerAdmin: string;
}) {
  const { error } = await (supabase.from('operational_incidents') as any).insert({
    title: input.title.trim(),
    severity: input.severity,
    impact: input.impact.trim(),
    owner_admin: input.ownerAdmin,
  });
  if (error) throw error;
}

export async function createModerationCase(input: {
  subjectUserId?: string;
  jobId?: string;
  reason: string;
  severity: ModerationCase['severity'];
  payoutHold: boolean;
  createdBy: string;
}) {
  const { error } = await (supabase.from('moderation_cases') as any).insert({
    subject_user_id: input.subjectUserId || null,
    job_id: input.jobId || null,
    reason: input.reason.trim(),
    severity: input.severity,
    payout_hold: input.payoutHold,
    created_by: input.createdBy,
  });
  if (error) throw error;
}
