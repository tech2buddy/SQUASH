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

export async function getQualificationQuiz(): Promise<QualificationQuiz | null> {
  const headers = await authHeaders();
  const response = await fetch('/api/tester-qualification-quiz', { headers });
  if (response.status === 404) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readError(payload, SERVICE_UNAVAILABLE_MESSAGE));
  return payload as QualificationQuiz;
}

export async function beginTesterQualification(): Promise<QualificationAttempt> {
  const { data, error } = await (supabase.rpc as any)('begin_tester_qualification_attempt');
  if (error || !data) throw new Error(error?.message || SERVICE_UNAVAILABLE_MESSAGE);
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
  if (!response.ok) throw new Error(readError(payload, SERVICE_UNAVAILABLE_MESSAGE));
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

export async function getQualificationSample(): Promise<QualificationSample | null> {
  const headers = await authHeaders();
  const response = await fetch('/api/tester-qualification-sample', { headers });
  if (response.status === 404) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readError(payload, SERVICE_UNAVAILABLE_MESSAGE));
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
  if (!response.ok) throw new Error(readError(payload, SERVICE_UNAVAILABLE_MESSAGE));
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
    throw new Error(
      scanError instanceof Error ? scanError.message : 'This evidence file could not be accepted.',
      { cause: scanError },
    );
  }
  return { path: data.path, name: file.name, type: file.type.startsWith('video/') ? 'video' : 'image' };
}