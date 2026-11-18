import { createClient } from '@supabase/supabase-js';

type SampleTask = {
  id: string;
  title: string;
  instruction: string;
  expectedResult: string;
};

type SampleScenario = {
  key: string;
  title: string;
  productName: string;
  objective: string;
  environment: string;
  outOfScope: string;
  appUrl: string | null;
  accessInstructions: string | null;
  logoUrl: string | null;
  tasks: SampleTask[];
};

// Scenario content used to be hardcoded here. It now lives in
// tester_qualification_scenario_templates so admin can edit it -- see
// phase58_qualification_scenario_templates.sql. loadScenario() below reads it.

const outcomes = new Set(['pass', 'fail', 'blocked', 'not_applicable']);
const severities = new Set(['low', 'medium', 'high', 'critical']);
const reproducibilities = new Set(['always', 'often', 'sometimes', 'once']);

function bearerToken(header: unknown) {
  return typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
}

function isText(value: unknown, min: number, max: number) {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = bearerToken(req.headers.authorization);
  // Same split as the quiz route: a missing server credential is a 500, not a
  // 401, so a misconfigured deployment cannot look like a rejected login.
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('tester-qualification-sample: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in this environment');
    return res.status(500).json({ error: 'The qualification service is not configured. Please contact SQUASH support.' });
  }
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const attemptId = req.method === 'POST' ? req.body?.attemptId : req.query?.attemptId;
  const attemptQuery = supabase
    .from('tester_qualification_attempts')
    .select('id, attempt_number, sample_variant_key, status, quiz_score, quiz_total')
    .eq('tester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);
  const { data: attempt, error: attemptError } = typeof attemptId === 'string'
    ? await attemptQuery.eq('id', attemptId).maybeSingle()
    : await attemptQuery.maybeSingle();

  if (attemptError) {
    console.error('tester-qualification-sample: attempt lookup failed', attemptError);
    return res.status(500).json({ error: 'Unable to load your sample test.' });
  }
  if (!attempt) return res.status(404).json({ error: 'Pass the QA foundations quiz before opening the practical sample.' });

  const { data: variantRow } = await supabase
    .from('tester_qualification_variants')
    .select('title')
    .eq('variant_key', attempt.sample_variant_key)
    .maybeSingle();
  const { data: templateRow, error: templateError } = await supabase
    .from('tester_qualification_scenario_templates')
    .select('product_name, objective, environment, out_of_scope, app_url, access_instructions, logo_url, tasks')
    .eq('variant_key', attempt.sample_variant_key)
    .maybeSingle();
  if (templateError) {
    console.error('tester-qualification-sample: scenario template lookup failed', templateError);
    return res.status(500).json({ error: 'Unable to load your sample test.' });
  }
  if (!templateRow) return res.status(503).json({ error: 'This practical sample is not available right now.' });
  const scenario: SampleScenario = {
    key: attempt.sample_variant_key,
    title: variantRow?.title || templateRow.product_name,
    productName: templateRow.product_name,
    objective: templateRow.objective,
    environment: templateRow.environment,
    outOfScope: templateRow.out_of_scope,
    // Only https links are accepted on write (phase59), but this is rendered as
    // a link the tester clicks, so re-check here rather than trusting the row.
    appUrl: typeof templateRow.app_url === 'string' && /^https:\/\/\S+$/.test(templateRow.app_url) ? templateRow.app_url : null,
    accessInstructions: templateRow.access_instructions || null,
    // Same re-check as app_url: this is rendered as an <img> src.
    logoUrl: typeof templateRow.logo_url === 'string' && /^https:\/\/\S+$/.test(templateRow.logo_url) ? templateRow.logo_url : null,
    tasks: (templateRow.tasks || []) as SampleTask[],
  };

  if (req.method === 'GET') {
    if (attempt.status === 'quiz_passed') {
      const { error: startError } = await supabase
        .from('tester_qualification_attempts')
        .update({ status: 'sample_in_progress' })
        .eq('id', attempt.id)
        .eq('tester_id', user.id)
        .eq('status', 'quiz_passed');
      if (startError) {
        console.error('tester-qualification-sample: could not move attempt to sample_in_progress', startError);
        return res.status(500).json({ error: 'Unable to start your sample test.' });
      }
      attempt.status = 'sample_in_progress';
    }
    if (!['sample_in_progress', 'sample_submitted'].includes(attempt.status)) {
      return res.status(409).json({ error: 'Your practical sample is not available in its current state.' });
    }
    return res.status(200).json({
      attempt: { id: attempt.id, attemptNumber: attempt.attempt_number, status: attempt.status, quizScore: attempt.quiz_score, quizTotal: attempt.quiz_total },
      scenario,
    });
  }

  if (attempt.status === 'sample_submitted') return res.status(200).json({ submitted: true });
  if (attempt.status !== 'sample_in_progress') {
    return res.status(409).json({ error: attempt.status === 'sample_submitted' ? 'This practical sample is already submitted.' : 'Complete the QA foundations quiz before submitting this sample.' });
  }

  const { taskOutcomes, issueReports, testerNotes, environment } = req.body || {};
  if (!Array.isArray(taskOutcomes) || taskOutcomes.length !== scenario.tasks.length || taskOutcomes.some((item) => !item || typeof item !== 'object' || !scenario.tasks.some((task) => task.id === item.taskId) || !outcomes.has(item.outcome) || !isText(item.note, 3, 1000))) {
    return res.status(400).json({ error: 'Record a clear outcome and note for every sample task.' });
  }

  // One structured issue per task marked Fail or Blocked -- not one report
  // for the whole submission. A tester who found two separate problems on
  // two different tasks needs to describe each on its own, and a reviewer
  // needs to see which task each report is actually about.
  const failedTaskIds = new Set(taskOutcomes.filter((item) => item.outcome === 'fail' || item.outcome === 'blocked').map((item) => item.taskId));
  if (!Array.isArray(issueReports)) {
    return res.status(400).json({ error: 'Record a structured issue for every task marked Fail or Blocked.' });
  }
  const issueTaskIds = issueReports.map((issue) => issue && typeof issue === 'object' ? issue.taskId : null);
  const hasDuplicateIssue = issueTaskIds.some((taskId, index) => taskId && issueTaskIds.indexOf(taskId) !== index);
  const coversExactlyFailedTasks = issueTaskIds.length === failedTaskIds.size && issueTaskIds.every((taskId) => failedTaskIds.has(taskId));
  if (hasDuplicateIssue || !coversExactlyFailedTasks) {
    return res.status(400).json({ error: 'Every task marked Fail or Blocked needs exactly one structured issue, and no issue should exist for a task that passed.' });
  }
  if (issueReports.some((issue) =>
    !issue || typeof issue !== 'object'
    || !isText(issue.bugTitle, 8, 180)
    || !isText(issue.stepsToReproduce, 20, 4000)
    || !isText(issue.expectedResult, 10, 2000)
    || !isText(issue.actualResult, 10, 2000)
    || !severities.has(issue.severity)
    || !reproducibilities.has(issue.reproducibility)
    || !Array.isArray(issue.evidencePaths)
    || issue.evidencePaths.length < 1
    || issue.evidencePaths.length > 3
    || issue.evidencePaths.some((path: unknown) => typeof path !== 'string' || !path.startsWith(`${user.id}/${attempt.id}/`) || path.includes('..'))
  )) {
    return res.status(400).json({ error: 'Each issue needs a clear title, steps to reproduce, expected vs. actual result, and at least one evidence file.' });
  }
  if (testerNotes !== undefined && testerNotes !== null && !isText(testerNotes, 1, 3000)) return res.status(400).json({ error: 'Additional notes are too long.' });

  const allEvidencePaths = [...new Set(issueReports.flatMap((issue) => issue.evidencePaths as string[]))];
  if (allEvidencePaths.length) {
    const { data: scanRows, error: scanError } = await supabase
      .from('file_scans')
      .select('object_path, status')
      .eq('bucket_id', 'qualification-evidence')
      .in('object_path', allEvidencePaths);
    const cleanPaths = new Set((scanRows || []).filter((row: any) => row.status === 'clean').map((row: any) => row.object_path));
    if (scanError || allEvidencePaths.some((path) => !cleanPaths.has(path))) {
      return res.status(400).json({ error: 'Each evidence file must finish a clean malware scan before submission.' });
    }
  }

  const { error: submitError } = await supabase.rpc('submit_qualification_sample', {
    p_attempt_id: attempt.id,
    p_tester_id: user.id,
    p_report: {
      task_outcomes: taskOutcomes,
      issue_reports: issueReports.map((issue) => ({
      taskId: issue.taskId,
      bugTitle: issue.bugTitle.trim(),
      stepsToReproduce: issue.stepsToReproduce.trim(),
      expectedResult: issue.expectedResult.trim(),
      actualResult: issue.actualResult.trim(),
      severity: issue.severity,
      reproducibility: issue.reproducibility,
      evidencePaths: issue.evidencePaths,
      })),
      tester_notes: typeof testerNotes === 'string' ? testerNotes.trim() || null : null,
      environment: environment && typeof environment === 'object' ? environment : {},
      evidence_paths: allEvidencePaths,
    },
  });
  if (submitError) {
    console.error('tester-qualification-sample: atomic submission failed', submitError);
    return res.status(500).json({ error: 'Unable to submit your practical sample. Please try again.' });
  }

  return res.status(200).json({ submitted: true });
}
