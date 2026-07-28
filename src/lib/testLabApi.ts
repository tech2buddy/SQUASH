import { isSupabaseConfigured, supabase, SERVICE_UNAVAILABLE_MESSAGE } from './supabase';
import type { TaskOutcome } from './testBrief';

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
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
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

export type SessionEnvironment = {
  os: string;
  browser: string;
  resolution: string;
  network: string;
  language: string;
};

/**
 * Captures the tester's real device context. A bug report is far more
 * actionable when the developer can see what it was reproduced on, and this
 * previously showed hardcoded values (Windows 11 / Chrome 150 / 1920x1080).
 */
export function captureSessionEnvironment(): SessionEnvironment {
  const nav = typeof navigator === 'undefined' ? undefined : (navigator as any);
  const uaData = nav?.userAgentData;
  const ua = nav?.userAgent || '';

  const browserFromUa = () => {
    const match = ua.match(/(Firefox|Edg|OPR|Chrome|Safari)\/([\d.]+)/);
    if (!match) return 'Unknown browser';
    const name = match[1] === 'Edg' ? 'Edge' : match[1] === 'OPR' ? 'Opera' : match[1];
    return `${name} ${match[2].split('.')[0]}`;
  };

  const osFromUa = () => {
    if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Android ([\d.]+)/.test(ua)) return `Android ${ua.match(/Android ([\d.]+)/)![1]}`;
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown OS';
  };

  return {
    os: uaData?.platform || osFromUa(),
    browser: browserFromUa(),
    resolution:
      typeof window !== 'undefined' && window.screen
        ? `${window.screen.width} x ${window.screen.height}`
        : 'Unknown',
    // effectiveType reflects measured speed (4g/3g/2g), which matters for the
    // low-data testing SQUASH sells.
    network: nav?.connection?.effectiveType ? String(nav.connection.effectiveType).toUpperCase() : 'Unknown',
    language: nav?.language || 'Unknown',
  };
}

/** Environment captured for a submitted assignment, if the tester recorded one. */
export async function getSessionEnvironment(assignmentId: string): Promise<SessionEnvironment | null> {
  if (!isSupabaseConfigured || !assignmentId) return null;
  const { data, error } = await (supabase.from('test_lab_sessions') as any)
    .select('metadata').eq('assignment_id', assignmentId).maybeSingle();
  if (error || !data) return null;
  const environment = (data.metadata || {}).environment;
  return environment && typeof environment === 'object' ? (environment as SessionEnvironment) : null;
}

export async function saveTestLabProgress(input: { sessionId: string; tasks: string[]; taskState: boolean[]; reportSummary: string }) {
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
  const progressPercent = input.taskState.length ? Math.round((input.taskState.filter(Boolean).length / input.taskState.length) * 100) : 0;
  const { data: session, error: sessionError } = await (supabase.from('test_lab_sessions') as any)
    .select('assignment_id, job_id, tester_id').eq('id', input.sessionId).single();
  if (sessionError) throw sessionError;

  const now = new Date().toISOString();

  // Only creates missing task rows -- it must not update existing ones.
  // Task status, started_at, completed_at and the difficulty/emotion ratings
  // are owned by startTestLabTask/completeTestLabTask. This autosave runs on
  // an interval, so writing status here would repeatedly reset a task to
  // 'not_started' and destroy the timing data those functions record.
  const taskRows = input.tasks.map((title, index) => ({
    session_id: input.sessionId,
    assignment_id: session.assignment_id,
    job_id: session.job_id,
    tester_id: session.tester_id,
    task_key: `task-${index + 1}`,
    task_order: index + 1,
    title,
    instructions: title,
    status: 'not_started',
  }));
  if (taskRows.length) {
    const { error: taskError } = await (supabase.from('test_task_results') as any)
      .upsert(taskRows, { onConflict: 'session_id,task_key', ignoreDuplicates: true });
    if (taskError) throw taskError;
  }

  const { error } = await (supabase.from('test_lab_sessions') as any)
    .update({
      progress_percent: progressPercent,
      last_saved_at: now,
      metadata: {
        task_state: input.taskState,
        report_summary: input.reportSummary,
        environment: captureSessionEnvironment(),
      },
    })
    .eq('id', input.sessionId);
  if (error) throw error;
}
export const DIFFICULTY_RATINGS = ['Very easy', 'Easy', 'Neutral', 'Difficult', 'Very difficult'] as const;
export const EMOTION_RATINGS = ['Smooth', 'Clear', 'Neutral', 'Confusing', 'Frustrating'] as const;

export type DifficultyRating = (typeof DIFFICULTY_RATINGS)[number];
export type EmotionRating = (typeof EMOTION_RATINGS)[number];

export type TestTaskResult = {
  taskKey: string;
  taskOrder: number;
  title: string;
  status: 'not_started' | 'active' | 'completed' | 'skipped';
  startedAt: string | null;
  completedAt: string | null;
  difficultyRating: DifficultyRating | null;
  emotionRating: EmotionRating | null;
  outcome: TaskOutcome | null;
  outcomeNote: string | null;
  /** Seconds spent on the task, when both timestamps exist. */
  durationSeconds: number | null;
};

function mapTaskResult(row: any): TestTaskResult {
  const startedAt = row.started_at || null;
  const completedAt = row.completed_at || null;
  return {
    taskKey: row.task_key,
    taskOrder: row.task_order,
    title: row.title,
    status: row.status,
    startedAt,
    completedAt,
    difficultyRating: row.difficulty_rating || null,
    emotionRating: row.emotion_rating || null,
    outcome: row.outcome || null,
    outcomeNote: row.outcome_note || null,
    durationSeconds:
      startedAt && completedAt
        ? Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000))
        : null,
  };
}

export async function getTestLabTaskResults(sessionId: string): Promise<TestTaskResult[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await (supabase.from('test_task_results') as any)
    .select('task_key, task_order, title, status, started_at, completed_at, difficulty_rating, emotion_rating, outcome, outcome_note')
    .eq('session_id', sessionId)
    .order('task_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapTaskResult);
}

/**
 * Task results for a submitted report, keyed by assignment rather than
 * session -- report pages hold an assignmentId, not a lab session id.
 *
 * Readable by the tester who produced it, the developer who owns the job,
 * and admins (see the test_task_results RLS policy in phase 13), so the same
 * call backs the tester, developer and admin report views.
 */
export async function getTaskResultsForAssignment(assignmentId: string): Promise<TestTaskResult[]> {
  if (!isSupabaseConfigured || !assignmentId) return [];
  const { data, error } = await (supabase.from('test_task_results') as any)
    .select('task_key, task_order, title, status, started_at, completed_at, difficulty_rating, emotion_rating')
    .eq('assignment_id', assignmentId)
    .order('task_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapTaskResult);
}

/**
 * Marks a task as started, so the time a tester actually spends on it can be
 * measured. Never overwrites an existing started_at -- reopening a task
 * should not reset how long it originally took.
 */
export async function startTestLabTask(sessionId: string, taskKey: string) {
  if (!isSupabaseConfigured) return;
  const { data: existing, error: readError } = await (supabase.from('test_task_results') as any)
    .select('started_at, status').eq('session_id', sessionId).eq('task_key', taskKey).maybeSingle();
  if (readError) throw readError;
  if (!existing || existing.started_at || existing.status === 'completed') return;

  const { error } = await (supabase.from('test_task_results') as any)
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('task_key', taskKey);
  if (error) throw error;
}

/**
 * Completes a task and records how it felt. The ratings are what turn a
 * checklist into usability evidence -- a developer can see which steps were
 * rated Confusing or Frustrating and how long each one took.
 */
export async function completeTestLabTask(input: {
  sessionId: string;
  taskKey: string;
  difficultyRating?: DifficultyRating | null;
  emotionRating?: EmotionRating | null;
}) {
  if (!isSupabaseConfigured) return;
  const now = new Date().toISOString();

  // Backfill started_at for tasks completed before they were ever marked
  // active, so duration is never computed against a null start.
  const { data: existing } = await (supabase.from('test_task_results') as any)
    .select('started_at').eq('session_id', input.sessionId).eq('task_key', input.taskKey).maybeSingle();

  const payload: Record<string, unknown> = { status: 'completed', completed_at: now };
  if (!existing?.started_at) payload.started_at = now;
  if (input.difficultyRating !== undefined) payload.difficulty_rating = input.difficultyRating;
  if (input.emotionRating !== undefined) payload.emotion_rating = input.emotionRating;

  const { error } = await (supabase.from('test_task_results') as any)
    .update(payload)
    .eq('session_id', input.sessionId)
    .eq('task_key', input.taskKey);
  if (error) throw error;
}

export async function recordTestTaskOutcome(input: {
  sessionId: string;
  taskKey: string;
  outcome: TaskOutcome;
  note?: string;
}) {
  if (!isSupabaseConfigured) return;
  const now = new Date().toISOString();
  const { error } = await (supabase.from('test_task_results') as any)
    .update({ status: 'completed', outcome: input.outcome, outcome_note: input.note?.trim() || null, completed_at: now })
    .eq('session_id', input.sessionId)
    .eq('task_key', input.taskKey);
  if (error) throw error;
}
export async function reopenTestLabTask(sessionId: string, taskKey: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await (supabase.from('test_task_results') as any)
    .update({ status: 'active', completed_at: null, outcome: null, outcome_note: null })
    .eq('session_id', sessionId)
    .eq('task_key', taskKey);
  if (error) throw error;
}

export async function markTestLabSubmitted(sessionId: string) {
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
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