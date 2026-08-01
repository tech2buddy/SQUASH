import { hasExpectedFileSignature, type SafeFileKind } from './fileValidation';
import { scanUploadedFile } from './scanApi';
import { supabase, SERVICE_UNAVAILABLE_MESSAGE } from './supabase';

export type QualificationStatus = 'not_started' | 'quiz_in_progress' | 'quiz_passed' | 'sample_submitted' | 'retry_required' | 'approved' | 'declined';
export type QualificationAttemptStatus = 'quiz_in_progress' | 'quiz_passed' | 'sample_in_progress' | 'sample_submitted' | 'retry_required' | 'approved' | 'declined';

export type QualificationAttempt = {
  id: string;
  attemptNumber: number;
  quizVariantKey: string;
  sampleVariantKey: string;
  status: QualificationAttemptStatus;
  score: number | null;
  total: number | null;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

export type QualificationQuiz = {
  attempt: QualificationAttempt;
  passMark: number;
  questions: QuizQuestion[];
};

async function authHeaders() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error('Please log in again before continuing your application.');
  return { Authorization: `Bearer ${session.access_token}` };
}

function readError(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error?: unknown }).error === 'string') {
    return (payload as { error: string }).error;
  }
  return fallback;
}

/**
 * These three functions used to fall back to a client-side copy of the quiz
 * (different questions, different answer key) and to writing progress
 * directly to `tester_qualification_attempts` under a column name
 * (`tester_user_id`) that table has never had. Neither fallback could ever
 * succeed: the table only grants `authenticated` SELECT, so the direct writes
 * were silently rejected by Postgres, and the fallback quiz's answer key
 * didn't match the ids of whatever was actually on screen.
 *
 * The practical effect: if the real request to `/api/tester-qualification-*`
 * ever failed or returned a non-OK response for any reason, the fallback
 * silently took over and produced a locally "graded" result -- scoring 0 on
 * every question if the real quiz was on screen, since the fallback checked
 * for question ids that don't exist in the answers object -- and then quietly
 * failed to save anything at all. A tester who answered every question
 * correctly would be told they failed, and even a genuine pass was never
 * written to the database, so logging out and back in reverted them to
 * whatever stage they were last on before the failure.
 *
 * There is no safe fallback here: qualification status gates who gets paid
 * work, so a wrong or fabricated result is worse than a clear error asking
 * the tester to try again.
 */
export async function getQualificationQuiz(): Promise<QualificationQuiz | null> {
  const headers = await authHeaders();
  const response = await fetch('/api/tester-qualification-quiz', { headers });
  if (response.status === 404) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readError(payload, 'Unable to load the QA foundations quiz. Please try again.'));
  return payload as QualificationQuiz;
}

export async function beginTesterQualification(): Promise<QualificationAttempt> {
  const { data, error } = await (supabase.rpc as any)('begin_tester_qualification_attempt');
  if (error) throw new Error(error.message || 'Unable to start your QA foundations quiz. Please try again.');
  return {
    id: data.id,
    attemptNumber: data.attempt_number,
    quizVariantKey: data.quiz_variant_key,
    sampleVariantKey: data.sample_variant_key,
    status: data.status,
    score: data.quiz_score,
    total: data.quiz_total,
  };
}

export async function submitQualificationQuiz(attemptId: string, answers: Record<string, number>) {
  const headers = await authHeaders();
  const response = await fetch('/api/tester-qualification-quiz', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ attemptId, answers }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readError(payload, 'Unable to submit your QA foundations quiz. Please try again.'));
  return payload as { passed: boolean; score: number; total: number; passMark: number; sampleVariantKey: string };
}

export type TesterQualificationProfile = {
  status: QualificationStatus;
  probationEndsAt: string | null;
};

export async function getTesterQualificationProfile(userId: string): Promise<TesterQualificationProfile> {
  const { data, error } = await (supabase.from('tester_profiles') as any)
    .select('qualification_status, qualification_probation_ends_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message || SERVICE_UNAVAILABLE_MESSAGE);
  return {
    status: (data?.qualification_status || 'not_started') as QualificationStatus,
    probationEndsAt: data?.qualification_probation_ends_at || null,
  };
}

export async function getTesterQualificationStatus(userId: string): Promise<QualificationStatus> {
  return (await getTesterQualificationProfile(userId)).status;
}

export type QualificationEvidence = {
  path: string;
  name: string;
  type: 'image' | 'video';
};

export type QualificationSampleTask = {
  id: string;
  title: string;
  instruction: string;
  expectedResult: string;
};

export type QualificationSample = {
  attempt: { id: string; attemptNumber: number; status: 'sample_in_progress' | 'sample_submitted'; quizScore: number | null; quizTotal: number | null };
  scenario: { key: string; title: string; productName: string; objective: string; environment: string; outOfScope: string; tasks: QualificationSampleTask[] };
};

/**
 * Same reasoning as the quiz functions above: no client-side fallback. The
 * previous version of `getQualificationSample` faked a passing quiz score
 * (`quizScore: attemptRow?.quiz_score ?? 11`) whenever the real request
 * failed, and `submitQualificationSample` always returned `{ submitted: true }`
 * even when nothing had been saved -- a tester could see a "submitted"
 * confirmation for a sample test the database never recorded, then find
 * themselves back on the quiz step after logging back in.
 */
export async function getQualificationSample(): Promise<QualificationSample | null> {
  const headers = await authHeaders();
  const response = await fetch('/api/tester-qualification-sample', { headers });
  if (response.status === 404) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readError(payload, 'Unable to load the practical sample. Please try again.'));
  return payload as QualificationSample;
}

export async function submitQualificationSample(input: {
  attemptId: string;
  taskOutcomes: Array<{ taskId: string; outcome: 'pass' | 'fail' | 'blocked' | 'not_applicable'; note: string }>;
  bugTitle: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reproducibility: 'always' | 'often' | 'sometimes' | 'once';
  testerNotes: string;
  environment: Record<string, unknown>;
  evidencePaths: string[];
}) {
  const headers = await authHeaders();
  const response = await fetch('/api/tester-qualification-sample', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readError(payload, 'Unable to submit your practical sample. Please try again.'));
  return payload as { submitted: true };
}

export async function uploadQualificationEvidence(file: File, testerId: string, attemptId: string): Promise<QualificationEvidence> {
  const allowedTypes: Record<string, SafeFileKind> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  const safeKind = allowedTypes[file.type];
  if (!safeKind) throw new Error('Use a PNG, JPEG, WebP, MP4 or WebM evidence file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Evidence files must be 10 MB or smaller.');
  if (!(await hasExpectedFileSignature(file, safeKind))) throw new Error('The file contents do not match its declared type.');

  const filePath = `${testerId}/${attemptId}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${safeKind}`;
  const { data, error } = await supabase.storage.from('qualification-evidence').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error || !data) throw new Error(error?.message || 'Unable to upload your evidence.');
  try {
    await scanUploadedFile('qualification-evidence', data.path);
  } catch (scanError) {
    // Keep the original error as `cause` so the underlying scanner failure
    // is still inspectable rather than being replaced by the friendly copy.
    throw new Error(
      scanError instanceof Error ? scanError.message : 'This evidence file could not be accepted.',
      { cause: scanError },
    );
  }
  return { path: data.path, name: file.name, type: file.type.startsWith('video/') ? 'video' : 'image' };
}