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
 * Parses a response body as JSON, returning `null` when the response either
 * isn't declared as JSON or doesn't parse. Callers must not treat that `null`
 * as data -- see `requireJsonPayload`.
 */
async function readJsonPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (!/\bapplication\/([\w.+-]+\+)?json\b/i.test(contentType)) return null;
  return await response.json().catch(() => null);
}

/**
 * Guards against a 200 response that carries no usable JSON. This is not
 * hypothetical: running the frontend with plain `vite` (no `/api` functions
 * behind it) serves the raw `.ts` module source at
 * `/api/tester-qualification-quiz` with a 200 and a JavaScript content type.
 * Without this check the body parses to `null`, the getters return `null`, and
 * the page reads that as "this tester has no attempt yet" -- so it offers to
 * start an attempt that the database says already exists, and the tester
 * dead-ends on "Complete or wait for review of your current qualification
 * attempt" with nothing to click.
 *
 * Only a genuine 404 means "no attempt". Anything else that isn't a real JSON
 * object is a broken deployment, and per the no-fallback policy documented
 * below it has to surface as an error the tester can act on.
 */
function requireJsonPayload<T>(payload: unknown, fallback: string): T {
  if (!payload || typeof payload !== 'object') throw new Error(fallback);
  return payload as T;
}

const QUIZ_UNAVAILABLE_MESSAGE = 'The qualification service is not responding correctly, so your QA foundations quiz could not be loaded. Please reload the page and try again, and contact support if this keeps happening.';
const SAMPLE_UNAVAILABLE_MESSAGE = 'The qualification service is not responding correctly, so your practical sample could not be loaded. Please reload the page and try again, and contact support if this keeps happening.';

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
  const payload = await readJsonPayload(response);
  if (!response.ok) throw new Error(readError(payload, 'Unable to load the QA foundations quiz. Please try again.'));
  return requireJsonPayload<QualificationQuiz>(payload, QUIZ_UNAVAILABLE_MESSAGE);
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
  const payload = await readJsonPayload(response);
  if (!response.ok) throw new Error(readError(payload, 'Unable to submit your QA foundations quiz. Please try again.'));
  // Same guard as the getters: a 200 with no usable JSON would otherwise hand
  // the caller a `null` result whose `passed` reads as undefined -- i.e. the
  // fabricated "you failed" outcome this file exists to prevent.
  return requireJsonPayload<{ passed: boolean; score: number; total: number; passMark: number; sampleVariantKey: string }>(
    payload,
    'Your QA foundations answers could not be submitted because the qualification service is not responding correctly. Your answers have not been recorded -- please reload the page and try again.',
  );
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
  scenario: { key: string; title: string; productName: string; objective: string; environment: string; outOfScope: string; appUrl: string | null; accessInstructions: string | null; logoUrl: string | null; tasks: QualificationSampleTask[] };
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
  const payload = await readJsonPayload(response);
  if (!response.ok) throw new Error(readError(payload, 'Unable to load the practical sample. Please try again.'));
  return requireJsonPayload<QualificationSample>(payload, SAMPLE_UNAVAILABLE_MESSAGE);
}

export type QualificationIssueReport = {
  taskId: string;
  bugTitle: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reproducibility: 'always' | 'often' | 'sometimes' | 'once';
  evidencePaths: string[];
};

export async function submitQualificationSample(input: {
  attemptId: string;
  taskOutcomes: Array<{ taskId: string; outcome: 'pass' | 'fail' | 'blocked' | 'not_applicable'; note: string }>;
  // One structured issue per task marked fail/blocked -- must exactly match
  // those taskIds, no more, no fewer. See api/tester-qualification-sample.ts.
  issueReports: QualificationIssueReport[];
  testerNotes: string;
  environment: Record<string, unknown>;
}) {
  const headers = await authHeaders();
  const response = await fetch('/api/tester-qualification-sample', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await readJsonPayload(response);
  if (!response.ok) throw new Error(readError(payload, 'Unable to submit your practical sample. Please try again.'));
  // A 200 with no usable JSON must not read as a successful submission -- that
  // is exactly the "submitted" confirmation for an unrecorded sample described
  // above.
  return requireJsonPayload<{ submitted: true }>(
    payload,
    'Your practical sample could not be submitted because the qualification service is not responding correctly. Nothing has been recorded -- please reload the page and try again.',
  );
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