import { supabase, SERVICE_UNAVAILABLE_MESSAGE } from './supabase';

export type QualificationReviewDecision = 'approved' | 'retry_required' | 'declined';
export type QualificationTaskOutcome = { taskId: string; outcome: 'pass' | 'fail' | 'blocked' | 'not_applicable'; note: string };

export type AdminQualificationReview = {
  attemptId: string;
  attemptNumber: number;
  testerId: string;
  testerName: string;
  testerEmail: string;
  sampleVariantKey: string;
  submittedAt: string;
  quizScore: number | null;
  quizTotal: number | null;
  taskOutcomes: QualificationTaskOutcome[];
  bugTitle: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reproducibility: 'always' | 'often' | 'sometimes' | 'once';
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
  const [{ data: reports, error: reportError }, { data: profiles, error: profileError }] = await Promise.all([
    (supabase.from('tester_qualification_sample_reports') as any)
      .select('attempt_id, task_outcomes, bug_title, steps_to_reproduce, expected_result, actual_result, severity, reproducibility, tester_notes, environment, evidence_paths, submitted_at')
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
    return [{
      attemptId: attempt.id,
      attemptNumber: attempt.attempt_number,
      testerId: attempt.tester_id,
      testerName: profile?.full_name || 'Tester',
      testerEmail: profile?.email || 'Email unavailable',
      sampleVariantKey: attempt.sample_variant_key,
      submittedAt: report.submitted_at || attempt.sample_submitted_at,
      quizScore: attempt.quiz_score ?? null,
      quizTotal: attempt.quiz_total ?? null,
      taskOutcomes: Array.isArray(report.task_outcomes) ? report.task_outcomes as QualificationTaskOutcome[] : [],
      bugTitle: report.bug_title,
      stepsToReproduce: report.steps_to_reproduce,
      expectedResult: report.expected_result,
      actualResult: report.actual_result,
      severity: report.severity,
      reproducibility: report.reproducibility,
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
  tasks: QualificationScenarioTask[];
  updatedAt: string | null;
};

export async function getQualificationScenarioTemplates(): Promise<QualificationScenarioTemplate[]> {
  const { data: variants, error: variantError } = await (supabase.from('tester_qualification_variants') as any)
    .select('variant_key, title')
    .eq('kind', 'sample')
    .order('variant_key', { ascending: true });
  if (variantError) throw new Error(variantError.message || SERVICE_UNAVAILABLE_MESSAGE);
  if (!variants?.length) return [];

  const { data: templates, error: templateError } = await (supabase.from('tester_qualification_scenario_templates') as any)
    .select('variant_key, product_name, objective, environment, out_of_scope, tasks, updated_at')
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
      tasks: Array.isArray(template?.tasks) ? template.tasks as QualificationScenarioTask[] : [],
      updatedAt: template?.updated_at || null,
    } satisfies QualificationScenarioTemplate;
  });
}

export async function updateQualificationScenarioTemplate(variantKey: string, patch: {
  productName: string;
  objective: string;
  environment: string;
  outOfScope: string;
  tasks: QualificationScenarioTask[];
}) {
  const { error } = await (supabase.from('tester_qualification_scenario_templates') as any)
    .update({
      product_name: patch.productName.trim(),
      objective: patch.objective.trim(),
      environment: patch.environment.trim(),
      out_of_scope: patch.outOfScope.trim(),
      tasks: patch.tasks,
    })
    .eq('variant_key', variantKey);
  if (error) throw new Error(error.message || SERVICE_UNAVAILABLE_MESSAGE);
}
