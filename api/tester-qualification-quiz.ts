import { createClient } from '@supabase/supabase-js';

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctOption: number;
};

const PASS_MARK = 9;
const quizzes: Record<string, QuizQuestion[]> = {
  'qa-basics-v1': [
    { id: 'v1-1', prompt: 'Which title is most useful for a bug report?', options: ['App broken', 'Login button does nothing after valid credentials are entered', 'Please fix this', 'There is an error'], correctOption: 1 },
    { id: 'v1-2', prompt: 'What should reproduction steps allow another person to do?', options: ['Understand your opinion', 'Find the same issue using the same actions', 'See your device model only', 'Skip the test quickly'], correctOption: 1 },
    { id: 'v1-3', prompt: 'What is an expected result?', options: ['What happened on your device', 'What should happen after the step is completed', 'How severe the issue feels', 'The name of the app'], correctOption: 1 },
    { id: 'v1-4', prompt: 'When should a task be marked Blocked?', options: ['Whenever a task is difficult', 'When a real issue prevents the task from being completed', 'When you do not like the design', 'When you have already found one bug'], correctOption: 1 },
    { id: 'v1-5', prompt: 'Which evidence is strongest for a visual checkout error?', options: ['A screenshot or short recording showing the error and the steps around it', 'A message saying it happened', 'A screenshot from another app', 'No evidence is needed'], correctOption: 0 },
    { id: 'v1-6', prompt: 'A typo on a non-critical help page is usually:', options: ['Critical', 'High', 'Low', 'Always blocked'], correctOption: 2 },
    { id: 'v1-7', prompt: 'What should you do if a job requires an iPhone and you only have Android?', options: ['Apply and guess the results', 'Apply because the report format is the same', 'Do not apply for that job', 'Borrow screenshots from someone else'], correctOption: 2 },
    { id: 'v1-8', prompt: 'What must you do with a pre-release app or private test instructions?', options: ['Share useful screenshots publicly', 'Keep them confidential', 'Send them to other testers', 'Post about the test after submission'], correctOption: 1 },
    { id: 'v1-9', prompt: 'What is the actual result section for?', options: ['Describe what occurred after your steps', 'Describe how the developer should rebuild the app', 'Write your tester biography', 'Repeat the title'], correctOption: 0 },
    { id: 'v1-10', prompt: 'If you cannot reproduce an issue a second time, what is best?', options: ['Claim it happens every time', 'Record the conditions honestly and choose the matching reproducibility', 'Delete all notes', 'Increase severity automatically'], correctOption: 1 },
    { id: 'v1-11', prompt: 'A crash that prevents every user from opening the app is most likely:', options: ['Low severity', 'Medium severity', 'High or critical severity', 'Not a reportable issue'], correctOption: 2 },
    { id: 'v1-12', prompt: 'Why should device, browser and operating system be included?', options: ['They help reproduce and diagnose the issue', 'They make the report look longer', 'They replace evidence', 'They are only needed for payment'], correctOption: 0 },
  ],
  'qa-basics-v2': [
    { id: 'v2-1', prompt: 'Which report gives a developer the clearest starting point?', options: ['Something is wrong with payment', 'Payment failed', 'Card payment shows a blank screen after tapping Pay on Chrome 150', 'Please investigate urgently'], correctOption: 2 },
    { id: 'v2-2', prompt: 'What belongs in the steps-to-reproduce field?', options: ['The exact actions taken before the issue appeared', 'Only the app name', 'A guess about the cause', 'Your bank account details'], correctOption: 0 },
    { id: 'v2-3', prompt: 'What does actual result mean?', options: ['The ideal experience', 'The result you genuinely observed', 'The task instruction', 'The payment amount'], correctOption: 1 },
    { id: 'v2-4', prompt: 'When is Not Applicable the right task outcome?', options: ['When the task does not apply to the assigned device or scenario', 'When you run out of time', 'When a page has a minor typo', 'When you prefer not to test'], correctOption: 0 },
    { id: 'v2-5', prompt: 'What should a screen recording show where possible?', options: ['Only the final error screen', 'The relevant steps leading to the issue and the resulting behaviour', 'Another tester talking about the issue', 'Private chats or unrelated tabs'], correctOption: 1 },
    { id: 'v2-6', prompt: 'Which is a high-severity issue?', options: ['A primary feature cannot be used by many users', 'A small spacing inconsistency', 'A colour preference', 'A suggestion for a future feature'], correctOption: 0 },
    { id: 'v2-7', prompt: 'What should you do if your screener/profile answer is not true for you?', options: ['Change it to qualify', 'Do not apply or answer honestly', "Copy a friend's answer", 'Wait until after payment'], correctOption: 1 },
    { id: 'v2-8', prompt: 'What is the correct approach to test credentials and private links?', options: ['Keep them inside the assigned test only', 'Share them with friends who can help', 'Use them after the job ends', 'Post them in a public review'], correctOption: 0 },
    { id: 'v2-9', prompt: 'Which report is vague?', options: ['Search returns no results after entering a valid city', 'The app is confusing', 'Checkout button remains disabled after a valid card is added', 'Profile photo upload rejects a valid JPEG'], correctOption: 1 },
    { id: 'v2-10', prompt: 'What should you do if your evidence contains personal information?', options: ['Upload it unchanged', 'Remove or obscure unrelated personal information before uploading', 'Send it to social media', 'Use someone else’s evidence'], correctOption: 1 },
    { id: 'v2-11', prompt: 'Why does SQUASH ask for expected and actual results separately?', options: ['To distinguish the intended behaviour from what happened', 'To make reports harder', 'To decide bank verification', 'To hide developer information'], correctOption: 0 },
    { id: 'v2-12', prompt: 'If a task succeeds exactly as instructed, you should:', options: ['Invent a problem to make the report valuable', 'Mark it Pass and record an honest observation if useful', 'Mark it Blocked', 'Skip it without a result'], correctOption: 1 },
  ],
};

function bearerToken(header: unknown) {
  return typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
}

function publicQuestion(question: QuizQuestion) {
  return { id: question.id, prompt: question.prompt, options: question.options };
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
    .select('id, attempt_number, quiz_variant_key, sample_variant_key, status, quiz_score, quiz_total')
    .eq('tester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);
  const { data: attempt, error: attemptError } = typeof attemptId === 'string'
    ? await attemptQuery.eq('id', attemptId).maybeSingle()
    : await attemptQuery.maybeSingle();

  if (attemptError) {
    // Was previously swallowed -- the client only ever saw "Unable to load
    // your qualification.", with the actual Postgres error visible nowhere.
    // Logged here so it shows up in Vercel's function logs for this route.
    console.error('tester-qualification-quiz: attempt lookup failed', attemptError);
    return res.status(500).json({ error: 'Unable to load your qualification.' });
  }
  if (!attempt) return res.status(404).json({ error: 'Start your qualification before opening the quiz.' });

  const questions = quizzes[attempt.quiz_variant_key];
  if (!questions) return res.status(503).json({ error: 'This quiz version is not available right now.' });

  if (req.method === 'GET') {
    return res.status(200).json({
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attempt_number,
        quizVariantKey: attempt.quiz_variant_key,
        sampleVariantKey: attempt.sample_variant_key,
        status: attempt.status,
        score: attempt.quiz_score,
        total: attempt.quiz_total,
      },
      passMark: PASS_MARK,
      questions: questions.map(publicQuestion),
    });
  }

  if (attempt.status !== 'quiz_in_progress') {
    return res.status(409).json({ error: 'This quiz attempt has already been submitted.' });
  }

  const answers = req.body?.answers;
  if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'Answer every question before submitting.' });
  if (questions.some((question) => !Number.isInteger(answers[question.id]) || answers[question.id] < 0 || answers[question.id] >= question.options.length)) {
    return res.status(400).json({ error: 'Answer every question before submitting.' });
  }

  const score = questions.reduce((total, question) => total + (answers[question.id] === question.correctOption ? 1 : 0), 0);
  const passed = score >= PASS_MARK;
  const { error: updateError } = await supabase
    .from('tester_qualification_attempts')
    .update({
      status: passed ? 'quiz_passed' : 'retry_required',
      quiz_score: score,
      quiz_total: questions.length,
      quiz_passed_at: passed ? new Date().toISOString() : null,
    })
    .eq('id', attempt.id)
    .eq('tester_id', user.id)
    .eq('status', 'quiz_in_progress');

  if (updateError) {
    console.error('tester-qualification-quiz: result save failed', updateError);
    return res.status(500).json({ error: 'Unable to save your quiz result.' });
  }
  return res.status(200).json({ passed, score, total: questions.length, passMark: PASS_MARK, sampleVariantKey: attempt.sample_variant_key });
}
