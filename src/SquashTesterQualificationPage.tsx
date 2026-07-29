import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileSearch,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from './auth';
import {
  beginTesterQualification,
  getQualificationQuiz,
  getTesterQualificationProfile,
  submitQualificationQuiz,
  type QualificationQuiz,
  type QualificationStatus,
} from './lib/testerQualificationApi';

type QuizResult = { passed: boolean; score: number; total: number; passMark: number } | null;

function statusCopy(status: QualificationStatus) {
  if (status === 'approved') return { label: 'Verified tester', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100' };
  if (status === 'retry_required') return { label: 'Retry available', tone: 'bg-amber-50 text-amber-700 ring-amber-100' };
  if (status === 'declined') return { label: 'Application closed', tone: 'bg-rose-50 text-rose-700 ring-rose-100' };
  return { label: 'Application in progress', tone: 'bg-sky-50 text-sky-700 ring-sky-100' };
}

export default function SquashTesterQualificationPage() {
  const { session } = useAuth();
  const [status, setStatus] = useState<QualificationStatus>('not_started');
  const [probationEndsAt, setProbationEndsAt] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QualificationQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const progress = useMemo(() => {
    if (status === 'approved') return 100;
    if (quiz?.attempt.status === 'sample_submitted') return 75;
    if (quiz?.attempt.status === 'sample_in_progress') return 60;
    if (result?.passed || quiz?.attempt.status === 'quiz_passed') return 50;
    if (quiz) return 25;
    return 0;
  }, [quiz, result?.passed, status]);

  useEffect(() => {
    const userId = session?.userId;
    if (!userId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const qualification = await getTesterQualificationProfile(userId);
        const currentStatus = qualification.status;
        if (!active) return;
        setStatus(currentStatus);
        setProbationEndsAt(qualification.probationEndsAt);
        if (currentStatus !== 'approved' && currentStatus !== 'declined') {
          const currentQuiz = await getQualificationQuiz();
          if (!active) return;
          setQuiz(currentQuiz);
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load your tester application.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [session?.userId]);

  const startQuiz = async () => {
    setStarting(true);
    setError('');
    setResult(null);
    try {
      await beginTesterQualification();
      const nextQuiz = await getQualificationQuiz();
      if (!nextQuiz) throw new Error('Your qualification quiz could not be prepared. Please try again.');
      setQuiz(nextQuiz);
      setAnswers({});
      setStatus('quiz_in_progress');
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Unable to start your qualification.');
    } finally {
      setStarting(false);
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    if (Object.keys(answers).length !== quiz.questions.length) {
      setError('Answer every question before submitting your quiz.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const nextResult = await submitQualificationQuiz(quiz.attempt.id, answers);
      setResult(nextResult);
      setQuiz({ ...quiz, attempt: { ...quiz.attempt, status: nextResult.passed ? 'quiz_passed' : 'retry_required', score: nextResult.score, total: nextResult.total } });
      setStatus(nextResult.passed ? 'quiz_passed' : 'retry_required');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit your quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const label = statusCopy(status);
  const canStart = !quiz || quiz.attempt.status === 'retry_required';
  const showingQuiz = quiz?.attempt.status === 'quiz_in_progress';

  if (!session) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 bg-[radial-gradient(circle_at_top_right,#dcfce7_0%,#ffffff_46%,#f8fafc_100%)] p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${label.tone}`}>
              <ShieldCheck className="h-3.5 w-3.5" /> {label.label}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Your SQUASH tester application</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Great testing is more than finding problems. Complete the short Academy so developers receive clear, honest and useful reports from day one.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2"><BookOpenCheck className="h-4 w-4 text-green-700" /> About 10 minutes</span>
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2"><LockKeyhole className="h-4 w-4 text-green-700" /> No payment details needed</span>
            </div>
          </div>
          <div className="self-center rounded-3xl border border-white bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-6">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-300"><span>Application progress</span><span>{progress}%</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-green-400 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
            <p className="mt-5 text-sm leading-6 text-slate-300">You will unlock paid job applications after the Academy, a practical sample test, and SQUASH review.</p>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { number: '1', title: 'Profile basics', text: 'Your device, location and tester details are saved.', complete: true, icon: BadgeCheck },
          { number: '2', title: 'QA foundations', text: 'Show that you can write reports developers can use.', complete: progress >= 50, current: showingQuiz || canStart, icon: ClipboardCheck },
          { number: '3', title: 'Sample test', text: 'Complete a controlled practical test in the SQUASH Lab.', complete: quiz?.attempt.status === 'sample_submitted', current: quiz?.attempt.status === 'quiz_passed' || quiz?.attempt.status === 'sample_in_progress', icon: FileSearch },
          { number: '4', title: 'SQUASH review', text: 'Our team checks your work before paid jobs unlock.', complete: status === 'approved', icon: ShieldCheck },
        ].map((step) => {
          const Icon = step.icon;
          return <div key={step.number} className={`rounded-3xl border p-5 shadow-sm ${step.current ? 'border-green-200 bg-green-50/70' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${step.complete ? 'bg-green-600 text-white' : step.current ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{step.complete ? <CheckCircle2 className="h-4 w-4" /> : step.number}</span><Icon className={`h-5 w-5 ${step.complete || step.current ? 'text-green-700' : 'text-slate-400'}`} /></div>
            <h2 className="mt-5 font-bold text-slate-900">{step.title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{step.text}</p>
          </div>;
        })}
      </section>

      {loading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Preparing your SQUASH Tester Academy...</section>
      ) : status === 'approved' ? (
        <section className="rounded-[30px] border border-green-200 bg-green-50 p-7 shadow-sm sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-600 text-white"><Sparkles className="h-6 w-6" /></span><div><h2 className="text-2xl font-black text-slate-950">You are a verified SQUASH tester</h2><p className="mt-1 text-sm text-slate-600">Your tester profile is ready for matching paid opportunities.</p>{probationEndsAt ? <p className="mt-2 text-xs font-semibold text-green-800">Your first 30 days are monitored for report quality and platform safety.</p> : null}</div></div><Link to="/tester-jobs" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-700">Explore available jobs <ArrowRight className="h-4 w-4" /></Link></div>
        </section>
      ) : status === 'declined' ? (
        <section className="rounded-[30px] border border-rose-200 bg-rose-50 p-7 text-sm leading-6 text-rose-800 shadow-sm"><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="font-bold">Your tester application is not active</h2><p className="mt-1">Contact SQUASH support if you believe this needs a review.</p></div></div></section>
      ) : (
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {!quiz || quiz.attempt.status === 'retry_required' ? (
            <div className="grid gap-7 lg:grid-cols-[1fr_0.78fr] lg:items-center">
              <div><div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700"><BookOpenCheck className="h-3.5 w-3.5" /> Step 2 of 4</div><h2 className="mt-4 text-2xl font-black text-slate-950">QA foundations quiz</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Twelve quick scenarios check whether you can document issues clearly, choose honest task outcomes, protect confidential material, and provide evidence developers can act on.</p>{quiz?.attempt.status === 'retry_required' ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"><strong>Fresh retry:</strong> your next attempt uses a completely different quiz and a different practical sample-test scenario.</div> : null}</div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-green-700 shadow-sm"><ClipboardCheck className="h-5 w-5" /></span><div><div className="font-bold text-slate-900">Before you begin</div><div className="text-sm text-slate-500">One attempt at a time</div></div></div><ul className="mt-5 space-y-3 text-sm text-slate-600"><li>• Answer based on real testing practice.</li><li>• You need 9 correct answers out of 12.</li><li>• Your answers are reviewed securely.</li></ul><button type="button" onClick={() => void startQuiz()} disabled={starting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-green-700 disabled:opacity-60">{starting ? 'Preparing your quiz...' : quiz ? 'Start fresh retry' : 'Start QA foundations quiz'} <ArrowRight className="h-4 w-4" /></button></div>
            </div>
          ) : result?.passed || quiz.attempt.status === 'quiz_passed' ? (
            <div className="rounded-3xl border border-green-200 bg-green-50 p-6 sm:p-7"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-green-600 text-white"><CheckCircle2 className="h-6 w-6" /></span><div><div className="text-sm font-bold text-green-700">QA foundations complete</div><h2 className="mt-1 text-2xl font-black text-slate-950">Strong start — your quiz is passed.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">You scored {quiz.attempt.score ?? result?.score}/{quiz.attempt.total ?? result?.total}. The next step is a controlled SQUASH Lab sample test. Complete it with the same care you would give a real developer report.</p><Link to="/tester-qualification/sample" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-green-700">Start practical sample <ArrowRight className="h-4 w-4" /></Link></div></div></div>
          ) : quiz.attempt.status === 'sample_in_progress' ? (
            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 sm:p-7"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-600 text-white"><FileSearch className="h-6 w-6" /></span><div><div className="text-sm font-bold text-sky-700">Practical sample in progress</div><h2 className="mt-1 text-2xl font-black text-slate-950">Finish your controlled SQUASH Lab test.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">Record each task outcome, attach clean evidence, then submit one structured issue report for reviewer assessment.</p><Link to="/tester-qualification/sample" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700">Resume practical sample <ArrowRight className="h-4 w-4" /></Link></div></div></div>
          ) : quiz.attempt.status === 'sample_submitted' ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-7"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white"><FileSearch className="h-6 w-6" /></span><div><div className="text-sm font-bold text-amber-700">Sample awaiting SQUASH review</div><h2 className="mt-1 text-2xl font-black text-slate-950">Your practical work is in the review queue.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">An administrator will assess the clarity of your task notes, report and evidence before paid job applications unlock.</p></div></div></div>
          ) : (
            <div>
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700"><ClipboardCheck className="h-3.5 w-3.5" /> QA foundations</div><h2 className="mt-3 text-2xl font-black text-slate-950">Choose the best testing answer</h2><p className="mt-1 text-sm text-slate-600">Question {Object.keys(answers).length} of {quiz.questions.length} answered. You need {quiz.passMark}/{quiz.questions.length} to continue.</p></div><div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">Attempt {quiz.attempt.attemptNumber} of 2</div></div>
              <div className="mt-6 space-y-5">{quiz.questions.map((question, index) => <fieldset key={question.id} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5"><legend className="px-1 text-sm font-black text-slate-900">{index + 1}. {question.prompt}</legend><div className="mt-4 grid gap-2">{question.options.map((option, optionIndex) => { const selected = answers[question.id] === optionIndex; return <label key={option} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${selected ? 'border-green-400 bg-green-50 text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}><input className="mt-0.5 accent-green-600" type="radio" name={question.id} checked={selected} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} /><span>{option}</span></label>; })}</div></fieldset>)}</div>
              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Your answers are saved only when you submit.</p><button type="button" onClick={() => void submitQuiz()} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-60">{submitting ? 'Checking answers...' : 'Submit quiz'} <ArrowRight className="h-4 w-4" /></button></div>
            </div>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-green-700" /><p><strong className="text-slate-900">How SQUASH protects quality:</strong> the quiz prepares you for paid testing, while the practical sample and review make sure reports are clear, honest and useful to developers. Banking details are not part of this application.</p></div></section>
    </div>
  );
}
