import { hasExpectedFileSignature, type SafeFileKind } from './fileValidation';
import { scanUploadedFile } from './scanApi';
import { supabase, isSupabaseConfigured, SERVICE_UNAVAILABLE_MESSAGE } from './supabase';

/**
 * Verified specializations (supabase/phase47_verified_specializations.sql).
 *
 * A tester declares a specialization by ticking a box, which is worth nothing on
 * its own -- `declared` is explicitly not enough to apply to a restricted test
 * type. To be worth something they upload evidence (`pending`) and an
 * administrator approves it (`approved`). Only `approved` satisfies the
 * job-application trigger.
 */
export type SpecializationVerificationStatus =
  | 'declared'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revoked';

export type TesterSpecialization = {
  id: string;
  testerId: string;
  key: string;
  status: SpecializationVerificationStatus;
  note: string | null;
  evidencePath: string | null;
  evidenceName: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  /** Null means no expiry. Network specializations expire yearly (phase 51). */
  expiresAt: string | null;
  revokedReason: string | null;
  challengeExpiresAt: string | null;
};

/**
 * A verification only satisfies the application gate while it is approved *and*
 * unexpired — the same predicate `enforce_job_application_specialization` uses.
 * Anything checking "is this tester verified" must go through here rather than
 * comparing status alone, or the UI will promise access the database refuses.
 */
export function isSpecializationActive(item: TesterSpecialization): boolean {
  if (item.status !== 'approved') return false;
  if (!item.expiresAt) return true;
  return new Date(item.expiresAt).getTime() > Date.now();
}

export type SpecializationCoverageRow = {
  key: string;
  /** Approved and unexpired — the number that can actually be staffed. */
  approved: number;
  pending: number;
  declared: number;
  expired: number;
  revoked: number;
  requiresVerification: boolean;
};

export type MatchQualityRow = {
  matched: boolean;
  submissions: number;
  approved: number;
  approvalRate: number;
};

type SpecializationRow = {
  id: string;
  tester_id: string;
  specialization_key: string;
  verification_status: SpecializationVerificationStatus;
  verification_note: string | null;
  evidence_path: string | null;
  evidence_name: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  expires_at: string | null;
  revoked_reason: string | null;
  challenge_expires_at: string | null;
};

function mapSpecialization(row: SpecializationRow): TesterSpecialization {
  return {
    id: row.id,
    testerId: row.tester_id,
    key: row.specialization_key,
    status: row.verification_status,
    note: row.verification_note,
    evidencePath: row.evidence_path,
    evidenceName: row.evidence_name,
    submittedAt: row.submitted_at,
    verifiedAt: row.verified_at,
    expiresAt: row.expires_at,
    revokedReason: row.revoked_reason,
    challengeExpiresAt: row.challenge_expires_at,
  };
}

const SPECIALIZATION_COLUMNS =
  'id, tester_id, specialization_key, verification_status, verification_note, evidence_path, evidence_name, submitted_at, verified_at, expires_at, revoked_reason, challenge_expires_at';

/** Every specialization a tester holds, with its verification state. */
export async function getTesterSpecializationDetails(testerId: string): Promise<TesterSpecialization[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await (supabase.from('tester_specializations') as any)
    .select(SPECIALIZATION_COLUMNS)
    .eq('tester_id', testerId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return ((data || []) as SpecializationRow[]).map(mapSpecialization);
}

/** Only the keys the application gate actually accepts: approved and unexpired. */
export async function getApprovedSpecializationKeys(testerId: string): Promise<string[]> {
  const all = await getTesterSpecializationDetails(testerId);
  return all.filter(isSpecializationActive).map((item) => item.key);
}

export type VerificationChallenge = {
  promptText: string;
  expiresAt: string;
};

/**
 * Asks for a challenge before recording language evidence (phase 52).
 *
 * The prompt is chosen at random server-side and expires in 30 minutes. The
 * tester cannot see the pool, cannot re-roll for a prompt they already have
 * recorded, and cannot extend the deadline — all three are enforced in the RPC,
 * because all three are exactly what someone reusing a borrowed recording would
 * try to do.
 */
export async function requestVerificationChallenge(
  specializationKey: string,
): Promise<VerificationChallenge | null> {
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

  const { data, error } = await (supabase.rpc as any)('request_specialization_challenge', {
    p_specialization_key: specializationKey,
  });
  if (error) throw new Error(error.message || 'Unable to start verification right now.');

  const row = (data || [])[0] as { prompt_text: string; expires_at: string } | undefined;
  if (!row) return null;
  return { promptText: row.prompt_text, expiresAt: row.expires_at };
}

/** True when this specialization is proved by answering a live prompt. */
export function usesChallenge(specializationKey: string): boolean {
  // Mirrors the seeded prompt pool in phase 52: languages are challenged,
  // network and assistive-technology claims are not ("record a speed test on
  // demand" makes no sense).
  return ['zulu', 'xhosa', 'sotho', 'afrikaans', 'venda', 'tsonga'].includes(specializationKey);
}

export async function revokeSpecialization(specializationId: string, reason: string) {
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

  const { data, error } = await (supabase.rpc as any)('revoke_tester_specialization', {
    p_specialization_id: specializationId,
    p_reason: reason,
  });
  if (error) throw new Error(error.message || 'Unable to revoke this verification.');

  const row = (data || [])[0] as
    | { strikes: number; blocked_until: string | null; affected_submissions: number }
    | undefined;

  return {
    strikes: row?.strikes ?? 0,
    blockedUntil: row?.blocked_until ?? null,
    affectedSubmissions: row?.affected_submissions ?? 0,
  };
}

/** The prompt a tester was given, so a reviewer can check the answer fits it. */
export async function getChallengePrompt(specializationId: string) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await (supabase.rpc as any)('get_specialization_challenge_prompt', {
    p_specialization_id: specializationId,
  });
  if (error) return null;

  const row = (data || [])[0] as
    | { prompt_text: string; issued_at: string; answered_within_window: boolean }
    | undefined;
  if (!row) return null;

  return {
    promptText: row.prompt_text,
    issuedAt: row.issued_at,
    answeredWithinWindow: row.answered_within_window,
  };
}

/**
 * Uploads evidence and asks for verification.
 *
 * Mirrors `uploadQualificationEvidence`: the declared MIME type is checked
 * against the file's actual magic bytes, and the stored object is malware
 * scanned before it is attached to anything. A file that fails either check is
 * never referenced by a specialization row.
 */
export async function submitSpecializationEvidence(
  testerId: string,
  specializationKey: string,
  file: File,
): Promise<TesterSpecialization> {
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

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
  if (!(await hasExpectedFileSignature(file, safeKind))) {
    throw new Error('The file contents do not match its declared type.');
  }

  const filePath = `${testerId}/${specializationKey}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${safeKind}`;
  const { data, error } = await supabase.storage
    .from('specialization-evidence')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error || !data) throw new Error(error?.message || 'Unable to upload your evidence.');

  try {
    await scanUploadedFile('specialization-evidence', data.path);
  } catch (scanError) {
    throw new Error(
      scanError instanceof Error ? scanError.message : 'This evidence file could not be accepted.',
      { cause: scanError },
    );
  }

  const { data: row, error: rpcError } = await (supabase.rpc as any)('submit_specialization_evidence', {
    p_specialization_key: specializationKey,
    p_evidence_path: data.path,
    p_evidence_name: file.name,
  });

  if (rpcError) throw new Error(rpcError.message || 'Unable to request verification right now.');
  return mapSpecialization(row as SpecializationRow);
}

/** Signed URL so an admin reviewer can actually watch or view the evidence. */
export async function getSpecializationEvidenceUrl(path: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.storage
    .from('specialization-evidence')
    .createSignedUrl(path, 60 * 10);

  if (error) return null;
  return data?.signedUrl ?? null;
}

export type PendingSpecializationReview = TesterSpecialization & {
  testerName: string;
  testerEmail: string;
};

/** Everything awaiting an admin decision, oldest first. */
export async function listPendingSpecializations(): Promise<PendingSpecializationReview[]> {
  return listSpecializationsByStatus('pending');
}

/**
 * Currently-verified specializations, so an admin has somewhere to revoke one
 * from. Newest first — a recently approved verification is the likeliest thing
 * to be looking for after a complaint.
 */
export async function listApprovedSpecializations(): Promise<PendingSpecializationReview[]> {
  return listSpecializationsByStatus('approved');
}

async function listSpecializationsByStatus(
  status: SpecializationVerificationStatus,
): Promise<PendingSpecializationReview[]> {
  if (!isSupabaseConfigured) return [];

  const ascending = status === 'pending';
  const { data, error } = await (supabase.from('tester_specializations') as any)
    .select(SPECIALIZATION_COLUMNS)
    .eq('verification_status', status)
    .order(ascending ? 'submitted_at' : 'verified_at', { ascending });

  if (error) throw error;

  const rows = ((data || []) as SpecializationRow[]).map(mapSpecialization);
  if (rows.length === 0) return [];

  // Names live on profiles, which an admin session can read. Fetched separately
  // rather than as an embedded join, matching how jobApi hydrates applicants.
  const testerIds = Array.from(new Set(rows.map((row) => row.testerId)));
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', testerIds);

  if (profileError) throw profileError;

  const profileById = new Map(
    ((profiles || []) as Array<{ id: string; full_name: string | null; email: string | null }>).map(
      (profile) => [profile.id, profile],
    ),
  );

  return rows.map((row) => ({
    ...row,
    testerName: profileById.get(row.testerId)?.full_name || 'Unnamed tester',
    testerEmail: profileById.get(row.testerId)?.email || '',
  }));
}

export async function reviewSpecialization(
  specializationId: string,
  decision: 'approved' | 'rejected',
  note: string,
): Promise<TesterSpecialization> {
  if (!isSupabaseConfigured) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);

  const { data, error } = await (supabase.rpc as any)('review_tester_specialization', {
    p_specialization_id: specializationId,
    p_decision: decision,
    p_note: note.trim() || null,
  });

  if (error) throw new Error(error.message || 'Unable to record this decision right now.');
  return mapSpecialization(data as SpecializationRow);
}

export async function getSpecializationCoverage(): Promise<SpecializationCoverageRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await (supabase.rpc as any)('get_specialization_coverage');
  if (error) throw error;

  return ((data || []) as Array<{
    specialization_key: string;
    approved_count: number;
    pending_count: number;
    declared_count: number;
    expired_count: number;
    revoked_count: number;
    requires_verification: boolean;
  }>).map((row) => ({
    key: row.specialization_key,
    approved: row.approved_count,
    pending: row.pending_count,
    declared: row.declared_count,
    expired: row.expired_count ?? 0,
    revoked: row.revoked_count ?? 0,
    requiresVerification: row.requires_verification,
  }));
}

export async function getTestTypeCapacity(packageKey: string, minTesters: number) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await (supabase.rpc as any)('get_test_type_capacity', {
    p_package_key: packageKey,
    p_min_testers: minTesters,
  });
  if (error) throw error;

  const row = (data || [])[0] as
    | { verified_testers: number; min_testers: number; can_staff: boolean }
    | undefined;
  if (!row) return null;

  return {
    packageKey,
    verifiedTesters: row.verified_testers,
    minTesters: row.min_testers,
    canStaff: row.can_staff,
  };
}

export async function getSpecializationMatchQuality(): Promise<MatchQualityRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await (supabase.rpc as any)('get_specialization_match_quality');
  if (error) throw error;

  return ((data || []) as Array<{
    matched: boolean;
    submissions: number;
    approved: number;
    approval_rate: number;
  }>).map((row) => ({
    matched: row.matched,
    submissions: row.submissions,
    approved: row.approved,
    approvalRate: Number(row.approval_rate),
  }));
}
