import { hasExpectedFileSignature, type SafeFileKind } from './fileValidation';
import { supabase, SERVICE_UNAVAILABLE_MESSAGE } from './supabase';

export type QualificationReviewDecision = 'approved' | 'retry_required' | 'declined';
export type QualificationTaskOutcome = { taskId: string; outcome: 'pass' | 'fail' | 'blocked' | 'not_applicable'; note: string };

export type QualificationIssueReport = {
  taskId: string;
  taskTitle: string;
  bugTitle: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reproducibility: 'always' | 'often' | 'sometimes' | 'once';
  evidencePaths: string[];
};

export type AdminQualificationReview = {
  attemptId: string;
  attemptNumber: number;
  testerId: string;
  testerName: string;
  testerEmail: string;
  sampleVariantKey: string;
  sampleVariantTitle: string;
  submittedAt: string;
  quizScore: number | null;
  quizTotal: number | null;
  taskOutcomes: QualificationTaskOutcome[];
  // One structured issue per task the tester marked Fail or Blocked, in task
  // order -- not a single report for the whole submission (phase66).
  issueReports: QualificationIssueReport[];
  testerNotes: string | null;
  environment: Record<string, unknown>;
  evidencePaths: string[];
};

export async function getAdminQualificationReviews(): Promise<AdminQualificationReview[]> {
  const { data: attempts, error: attemptError } = await (supabase.from('tester_qualification_attempts') as any)
    .select('id, attempt_number, tester_id, sample_variant_key, sample_submitted_at, quiz_score, quiz_total')
    .eq('status', 'sample_submitted')
    .order('sample_submitted_at', { ascending: true });
  if (attemptError) throw new Error(attemptError.message || SERVICE_UNAVAILABLE_MESSAGE);
  if (!attempts?.length) return [];

  const attemptIds = attempts.map((attempt: any) => attempt.id);
  const testerIds = [...new Set<string>(attempts.map((attempt: any) => attempt.tester_id as string))];
  const variantKeys = [...new Set<string>(attempts.map((attempt: any) => attempt.sample_variant_key as string))];
  // Sample tests are admin-authored (phase59), so the queue has to read the
  // real title -- it used to map two hardcoded keys to two hardcoded labels,
  // which now mislabels every scenario an admin creates.
  const [{ data: variants }, { data: templates }] = await Promise.all([
    (supabase.from('tester_qualification_variants') as any).select('variant_key, title').in('variant_key', variantKeys),
    (supabase.from('tester_qualification_scenario_templates') as any).select('variant_key, tasks').in('variant_key', variantKeys),
  ]);
  const variantTitleByKey = new Map<string, string>((variants || []).map((variant: any) => [variant.variant_key, variant.title] as [string, string]));
  // taskId -> task title, scoped per variant, so an issue report can show
  // which task it was actually about without the reviewer cross-referencing
  // the scenario template by hand.
  const taskTitleByVariant = new Map<string, Map<string, string>>(
    (templates || []).map((template: any) => [
      template.variant_key,
      new Map<string, string>((Array.isArray(template.tasks) ? template.tasks : []).map((task: any) => [task.id, task.title])),
    ]),
  );

  const [{ data: reports, error: reportError }, { data: profiles, error: profileError }] = await Promise.all([
    (supabase.from('tester_qualification_sample_reports') as any)
      .select('attempt_id, task_outcomes, issue_reports, tester_notes, environment, evidence_paths, submitted_at')
      .in('attempt_id', attemptIds),
    (supabase.from('profiles') as any).select('id, full_name, email').in('id', testerIds),
  ]);
  if (reportError) throw new Error(reportError.message || SERVICE_UNAVAILABLE_MESSAGE);
  if (profileError) throw new Error(profileError.message || SERVICE_UNAVAILABLE_MESSAGE);

  const reportByAttempt = new Map<string, any>((reports || []).map((report: any) => [report.attempt_id, report] as [string, any]));
  const profileById = new Map<string, any>((profiles || []).map((profile: any) => [profile.id, profile] as [string, any]));

  return attempts.flatMap((attempt: any) => {
    const report = reportByAttempt.get(attempt.id);
    if (!report) return [];
    const profile = profileById.get(attempt.tester_id);
    const taskTitles = taskTitleByVariant.get(attempt.sample_variant_key) || new Map<string, string>();
    const issueReports: QualificationIssueReport[] = (Array.isArray(report.issue_reports) ? report.issue_reports : []).map((issue: any) => ({
      taskId: issue.taskId,
      taskTitle: taskTitles.get(issue.taskId) || issue.taskId,
      bugTitle: issue.bugTitle,
      stepsToReproduce: issue.stepsToReproduce,
      expectedResult: issue.expectedResult,
      actualResult: issue.actualResult,
      severity: issue.severity,
      reproducibility: issue.reproducibility,
      evidencePaths: Array.isArray(issue.evidencePaths) ? issue.evidencePaths.filter((path: unknown): path is string => typeof path === 'string') : [],
    }));
    return [{
      attemptId: attempt.id,
      attemptNumber: attempt.attempt_number,
      testerId: attempt.tester_id,
      testerName: profile?.full_name || 'Tester',
      testerEmail: profile?.email || 'Email unavailable',
      sampleVariantKey: attempt.sample_variant_key,
      sampleVariantTitle: variantTitleByKey.get(attempt.sample_variant_key) || 'Sample test',
      submittedAt: report.submitted_at || attempt.sample_submitted_at,
      quizScore: attempt.quiz_score ?? null,
      quizTotal: attempt.quiz_total ?? null,
      taskOutcomes: Array.isArray(report.task_outcomes) ? report.task_outcomes as QualificationTaskOutcome[] : [],
      issueReports,
      testerNotes: report.tester_notes || null,
      environment: report.environment && typeof report.environment === 'object' ? report.environment : {},
      evidencePaths: Array.isArray(report.evidence_paths) ? report.evidence_paths.filter((path: unknown): path is string => typeof path === 'string') : [],
    } satisfies AdminQualificationReview];
  });
}

export async function getQualificationEvidenceUrl(path: string) {
  const { data, error } = await supabase.storage.from('qualification-evidence').createSignedUrl(path, 300);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not open this evidence file.');
  return data.signedUrl;
}

export type QualificationReviewRubric = {
  clarity: number;
  reproducibility: number;
  evidence: number;
  taskCoverage: number;
};

export async function reviewTesterQualification(input: { attemptId: string; decision: QualificationReviewDecision; note?: string; rubric: QualificationReviewRubric }) {
  const { data, error } = await (supabase.rpc as any)('review_tester_qualification_attempt', {
    p_attempt_id: input.attemptId,
    p_decision: input.decision,
    p_note: input.note?.trim() || null,
    p_clarity_score: input.rubric.clarity,
    p_reproducibility_score: input.rubric.reproducibility,
    p_evidence_score: input.rubric.evidence,
    p_task_coverage_score: input.rubric.taskCoverage,
  });
  if (error) throw new Error(error.message || SERVICE_UNAVAILABLE_MESSAGE);
  return data;
}

export type QualificationScenarioTask = { id: string; title: string; instruction: string; expectedResult: string };

export type QualificationScenarioTemplate = {
  variantKey: string;
  title: string;
  productName: string;
  objective: string;
  environment: string;
  outOfScope: string;
  appUrl: string;
  accessInstructions: string;
  logoUrl: string;
  tasks: QualificationScenarioTask[];
  isActive: boolean;
  updatedAt: string | null;
};

export type QualificationScenarioInput = {
  title: string;
  productName: string;
  objective: string;
  environment: string;
  outOfScope: string;
  appUrl: string;
  accessInstructions: string;
  logoUrl: string;
  tasks: QualificationScenarioTask[];
  isActive: boolean;
};

export async function getQualificationScenarioTemplates(): Promise<QualificationScenarioTemplate[]> {
  const { data: variants, error: variantError } = await (supabase.from('tester_qualification_variants') as any)
    .select('variant_key, title, is_active, created_at')
    .eq('kind', 'sample')
    .order('created_at', { ascending: true });
  if (variantError) throw new Error(variantError.message || SERVICE_UNAVAILABLE_MESSAGE);
  if (!variants?.length) return [];

  const { data: templates, error: templateError } = await (supabase.from('tester_qualification_scenario_templates') as any)
    .select('variant_key, product_name, objective, environment, out_of_scope, app_url, access_instructions, logo_url, tasks, updated_at')
    .in('variant_key', variants.map((variant: any) => variant.variant_key));
  if (templateError) throw new Error(templateError.message || SERVICE_UNAVAILABLE_MESSAGE);

  const templateByKey = new Map<string, any>((templates || []).map((template: any) => [template.variant_key, template] as [string, any]));

  return variants.map((variant: any) => {
    const template = templateByKey.get(variant.variant_key);
    return {
      variantKey: variant.variant_key,
      title: variant.title,
      productName: template?.product_name || '',
      objective: template?.objective || '',
      environment: template?.environment || '',
      outOfScope: template?.out_of_scope || '',
      appUrl: template?.app_url || '',
      accessInstructions: template?.access_instructions || '',
      logoUrl: template?.logo_url || '',
      tasks: Array.isArray(template?.tasks) ? template.tasks as QualificationScenarioTask[] : [],
      isActive: variant.is_active !== false,
      updatedAt: template?.updated_at || null,
    } satisfies QualificationScenarioTemplate;
  });
}

/**
 * Creates (variantKey null) or updates a sample test. This goes through
 * `admin_save_qualification_scenario` rather than writing the two tables from
 * here: a scenario is a variant row (what the qualification flow assigns) plus
 * a template row (what the tester reads), and a variant saved without its
 * template fails the tester at the sample stage with "This practical sample is
 * not available right now". The function writes both or neither.
 */
export async function saveQualificationScenario(variantKey: string | null, input: QualificationScenarioInput): Promise<string> {
  const { data, error } = await (supabase.rpc as any)('admin_save_qualification_scenario', {
    p_variant_key: variantKey,
    p_title: input.title.trim(),
    p_product_name: input.productName.trim(),
    p_objective: input.objective.trim(),
    p_environment: input.environment.trim(),
    p_out_of_scope: input.outOfScope.trim(),
    p_tasks: input.tasks,
    p_app_url: input.appUrl.trim() || null,
    p_access_instructions: input.accessInstructions.trim() || null,
    p_logo_url: input.logoUrl.trim() || null,
    p_is_active: input.isActive,
  });
  if (error) throw new Error(error.message || SERVICE_UNAVAILABLE_MESSAGE);
  if (typeof data !== 'string' || !data) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
  return data;
}

export type QualificationScenarioDeletion = {
  /**
   * `in_use`   -- nothing changed; testers are on it, call again with force.
   * `deleted`  -- gone, along with any in-flight testers being moved or reset.
   * `retired`  -- could not be deleted because a submitted or already reviewed
   *               attempt points at it; deactivated instead.
   */
  outcome: 'deleted' | 'in_use' | 'retired';
  /** Testers part-way through: reset or moved to another test on force. */
  inFlight: number;
  /** Submitted or reviewed attempts. These are never deleted. */
  locked: number;
  reassigned: number;
  reset: number;
};

/**
 * Two-step by design. Called without `force` it reports what is in the way and
 * changes nothing, so the confirmation can name the actual cost; called with
 * `force` it removes the test and handles the affected testers -- moving them
 * to another active test where one exists, otherwise resetting them to a clean
 * start. Submitted and reviewed attempts are never destroyed: that record is
 * how a tester was admitted to paid work.
 */
export async function deleteQualificationScenario(variantKey: string, force = false): Promise<QualificationScenarioDeletion> {
  const { data, error } = await (supabase.rpc as any)('admin_delete_qualification_scenario', {
    p_variant_key: variantKey,
    p_force: force,
  });
  if (error) throw new Error(error.message || SERVICE_UNAVAILABLE_MESSAGE);
  if (!data || typeof data !== 'object') throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
  return {
    outcome: data.outcome,
    inFlight: Number(data.inFlight) || 0,
    locked: Number(data.locked) || 0,
    reassigned: Number(data.reassigned) || 0,
    reset: Number(data.reset) || 0,
  };
}

/**
 * Uploads a sample-test logo and returns its public URL. The bucket only
 * grants write to an administrator (phase62), and the file signature is
 * checked here so a renamed executable cannot be passed off as a PNG.
 */
export async function uploadQualificationScenarioLogo(file: File, adminUserId: string): Promise<string> {
  const allowed: Record<string, SafeFileKind> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  const safeKind = allowed[file.type];
  if (!safeKind) throw new Error('Use a PNG, JPEG or WebP image for the logo.');
  if (file.size > 1024 * 1024) throw new Error('Keep the logo under 1MB.');
  if (!(await hasExpectedFileSignature(file, safeKind))) {
    throw new Error('The file contents do not match its declared type.');
  }

  const path = `${adminUserId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeKind}`;
  const { error } = await supabase.storage.from('qualification-logos').upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error(error.message || 'Could not upload that logo.');

  const { data } = supabase.storage.from('qualification-logos').getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Could not read the uploaded logo URL.');
  return data.publicUrl;
}
