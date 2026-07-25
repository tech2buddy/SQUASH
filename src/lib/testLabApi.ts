import { isSupabaseConfigured, supabase } from './supabase';

export type TestLabSession = {
  id: string;
  assignmentId: string;
  progressPercent: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'cancelled';
  metadata: Record<string, unknown>;
  lastSavedAt: string | null;
};

function mapSession(row: any): TestLabSession {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    progressPercent: row.progress_percent || 0,
    status: row.status,
    metadata: row.metadata || {},
    lastSavedAt: row.last_saved_at || null,
  };
}

export async function getOrCreateTestLabSession(input: { assignmentId: string; jobId: string; testerId: string }) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
  const { data: existing, error: existingError } = await (supabase.from('test_lab_sessions') as any)
    .select('*').eq('assignment_id', input.assignmentId).maybeSingle();
  if (existingError) throw existingError;
  if (existing) return mapSession(existing);

  const { data, error } = await (supabase.from('test_lab_sessions') as any)
    .insert({ assignment_id: input.assignmentId, job_id: input.jobId, tester_id: input.testerId, status: 'in_progress', started_at: new Date().toISOString() })
    .select('*').single();
  if (error) throw error;
  return mapSession(data);
}

export async function saveTestLabProgress(input: { sessionId: string; tasks: string[]; taskState: boolean[]; reportSummary: string }) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
  const progressPercent = input.taskState.length ? Math.round((input.taskState.filter(Boolean).length / input.taskState.length) * 100) : 0;
  const { data: session, error: sessionError } = await (supabase.from('test_lab_sessions') as any)
    .select('assignment_id, job_id, tester_id').eq('id', input.sessionId).single();
  if (sessionError) throw sessionError;

  const now = new Date().toISOString();
  const taskRows = input.tasks.map((title, index) => ({
    session_id: input.sessionId,
    assignment_id: session.assignment_id,
    job_id: session.job_id,
    tester_id: session.tester_id,
    task_key: `task-${index + 1}`,
    task_order: index + 1,
    title,
    instructions: title,
    status: input.taskState[index] ? 'completed' : 'not_started',
    completed_at: input.taskState[index] ? now : null,
  }));
  if (taskRows.length) {
    const { error: taskError } = await (supabase.from('test_task_results') as any)
      .upsert(taskRows, { onConflict: 'session_id,task_key' });
    if (taskError) throw taskError;
  }

  const { error } = await (supabase.from('test_lab_sessions') as any)
    .update({ progress_percent: progressPercent, last_saved_at: now, metadata: { task_state: input.taskState, report_summary: input.reportSummary } })
    .eq('id', input.sessionId);
  if (error) throw error;
}
export async function markTestLabSubmitted(sessionId: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.');
  const now = new Date().toISOString();
  const { error } = await (supabase.from('test_lab_sessions') as any)
    .update({ status: 'submitted', submitted_at: now, last_saved_at: now, progress_percent: 100 })
    .eq('id', sessionId);
  if (error) throw error;
}
export async function getTesterTestLabSessions(testerId: string): Promise<TestLabSession[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await (supabase.from('test_lab_sessions') as any)
    .select('*').eq('tester_id', testerId).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapSession);
}