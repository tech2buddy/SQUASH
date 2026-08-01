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
  tasks: SampleTask[];
};

const scenarios: Record<string, SampleScenario> = {
  'checkout-flow-v1': {
    key: 'checkout-flow-v1',
    title: 'Checkout flow sample',
    productName: 'Northstar Store',
    objective: 'Verify that a customer can complete a standard card checkout in this simulated store.',
    environment: 'Desktop or mobile browser. Use only the sample details shown in the lab; no real payment is taken.',
    outOfScope: 'Do not test real card numbers, real accounts, browser extensions or unrelated pages.',
    tasks: [
      { id: 'choose-plan', title: 'Choose the Standard plan', instruction: 'Select the Standard plan on the sample checkout.', expectedResult: 'The selected plan and R149 total are shown.' },
      { id: 'enter-details', title: 'Enter sample customer details', instruction: 'Use the sample name and email provided in the checkout panel.', expectedResult: 'The details are accepted and the Pay button becomes available.' },
      { id: 'complete-payment', title: 'Attempt the sample payment', instruction: 'Select Card and press Pay R149 once.', expectedResult: 'A simulated confirmation page appears with a successful order reference.' },
    ],
  },
  'booking-flow-v1': {
    key: 'booking-flow-v1',
    title: 'Booking flow sample',
    productName: 'Harbour Studio',
    objective: 'Verify that a customer can choose a session and receive a booking confirmation in this simulated schedule.',
    environment: 'Desktop or mobile browser. This is a controlled training scenario; no real booking is created.',
    outOfScope: 'Do not contact a real business, use personal details, or test dates outside the supplied sample flow.',
    tasks: [
      { id: 'choose-session', title: 'Choose a Saturday session', instruction: 'Select the Saturday 10:30 session from the sample schedule.', expectedResult: 'The selected time is reflected in the booking summary.' },
      { id: 'enter-guest', title: 'Enter the sample guest details', instruction: 'Use the sample guest name and email in the booking panel.', expectedResult: 'The form validates the details and enables Confirm booking.' },
      { id: 'confirm-booking', title: 'Attempt the booking', instruction: 'Press Confirm booking once.', expectedResult: 'A simulated booking confirmation and reference number appear.' },
    ],
  },
};

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
  if (!supabaseUrl || !serviceRoleKey || !token) return res.status(401).json({ error: 'Unauthorized' });

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
  const scenario = scenarios[attempt.sample_variant_key];
  if (!scenario) return res.status(503).json({ error: 'This practical sample is not available right now.' });

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

  if (attempt.status !== 'sample_in_progress') {
    return res.status(409).json({ error: attempt.status === 'sample_submitted' ? 'This practical sample is already submitted.' : 'Complete the QA foundations quiz before submitting this sample.' });
  }

  const { taskOutcomes, bugTitle, stepsToReproduce, expectedResult, actualResult, severity, reproducibility, testerNotes, environment, evidencePaths } = req.body || {};
  if (!Array.isArray(taskOutcomes) || taskOutcomes.length !== scenario.tasks.length || taskOutcomes.some((item) => !item || typeof item !== 'object' || !scenario.tasks.some((task) => task.id === item.taskId) || !outcomes.has(item.outcome) || !isText(item.note, 3, 1000))) {
    return res.status(400).json({ error: 'Record a clear outcome and note for every sample task.' });
  }
  if (!isText(bugTitle, 8, 180) || !isText(stepsToReproduce, 20, 4000) || !isText(expectedResult, 10, 2000) || !isText(actualResult, 10, 2000) || !severities.has(severity) || !reproducibilities.has(reproducibility)) {
    return res.status(400).json({ error: 'Complete the structured bug report with clear reproduction details.' });
  }
  if (testerNotes !== undefined && testerNotes !== null && !isText(testerNotes, 1, 3000)) return res.status(400).json({ error: 'Additional notes are too long.' });
  if (!Array.isArray(evidencePaths) || evidencePaths.length < 1 || evidencePaths.length > 3 || evidencePaths.some((path) => typeof path !== 'string' || !path.startsWith(`${user.id}/${attempt.id}/`) || path.includes('..'))) {
    return res.status(400).json({ error: 'Attach one to three evidence files from this sample test.' });
  }

  const { data: scanRows, error: scanError } = await supabase
    .from('file_scans')
    .select('object_path, status')
    .eq('bucket_id', 'qualification-evidence')
    .in('object_path', evidencePaths);
  const cleanPaths = new Set((scanRows || []).filter((row: any) => row.status === 'clean').map((row: any) => row.object_path));
  if (scanError || evidencePaths.some((path) => !cleanPaths.has(path))) {
    return res.status(400).json({ error: 'Each evidence file must finish a clean malware scan before submission.' });
  }

  const { error: reportError } = await supabase.from('tester_qualification_sample_reports').insert({
    attempt_id: attempt.id,
    tester_id: user.id,
    sample_variant_key: attempt.sample_variant_key,
    task_outcomes: taskOutcomes,
    bug_title: bugTitle.trim(),
    steps_to_reproduce: stepsToReproduce.trim(),
    expected_result: expectedResult.trim(),
    actual_result: actualResult.trim(),
    severity,
    reproducibility,
    tester_notes: typeof testerNotes === 'string' ? testerNotes.trim() || null : null,
    environment: environment && typeof environment === 'object' ? environment : {},
    evidence_paths: evidencePaths,
  });
  if (reportError) {
    console.error('tester-qualification-sample: report insert failed', reportError);
    return res.status(500).json({ error: 'Unable to save your practical sample.' });
  }

  const { error: submitError } = await supabase
    .from('tester_qualification_attempts')
    .update({ status: 'sample_submitted', sample_submitted_at: new Date().toISOString() })
    .eq('id', attempt.id)
    .eq('tester_id', user.id)
    .eq('status', 'sample_in_progress');
  if (submitError) {
    console.error('tester-qualification-sample: could not mark attempt sample_submitted', submitError);
    return res.status(500).json({ error: 'Your sample was saved but could not be queued for review. Contact SQUASH support.' });
  }

  return res.status(200).json({ submitted: true });
}
