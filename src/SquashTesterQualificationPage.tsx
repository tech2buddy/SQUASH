import { ArrowRight, CheckCircle2, CircleAlert, ClipboardCheck, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from './auth';
import TesterApplicationProgress from './components/TesterApplicationProgress';
import {
  beginTesterQualification,
  getQualificationQuiz,
  getTesterQualificationProfile,
  submitQualificationQuiz,
  type QualificationQuiz,
  type QualificationStatus,
} from './lib/testerQualificationApi';

export default function SquashTesterQualificationPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<QualificationStatus>('not_started');
  const [quiz, setQuiz] = useState<QualificationQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.userId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const qualification = await getTesterQualificationProfile(session.userId!);
        if (!active) return;
        setStatus(qualification.status);
        if (qualification.status !== 'approved' && qualification.status !== 'declined') {
          const currentQuiz = await getQualificationQuiz();
          if (active) setQuiz(currentQuiz);
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load your Tester Academy.');
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
    try {
      await beginTesterQualification();
      const nextQuiz = await getQualificationQuiz();
      if (!nextQuiz) throw new Error('Your QA foundations quiz could not be prepared. Please try again.');
      setQuiz(nextQuiz);
      setAnswers({});
      setStatus('quiz_in_progress');
    } catch (startError) {
      const msg = startError instanceof Error ? startError.message : 'Unable to start your QA foundations quiz.';
      if (
        msg.toLowerCase().includes('complete or wait for review') ||
        msg.toLowerCase().includes('current qualification attempt') ||
        msg.toLowerCase().includes('in progress')
      ) {
        // A quiz attempt already exists server-side, so re-fetch it rather
        // than surfacing the "already in progress" message. This inner call
        // used to be unguarded: if it also failed, the exception escaped the
        // outer catch entirely -- setError(msg) below never ran, and the
        // button just stopped spinning with no explanation. Wrapped so a
        // second failure here still reaches the user.
        try {
          const nextQuiz = await getQualificationQuiz();
          if (nextQuiz) {
            setQuiz(nextQuiz);
            setAnswers({});
            setStatus('quiz_in_progress');
            setError('');
            return;
          }
        } catch (retryError) {
          setError(retryError instanceof Error ? retryError.message : msg);
          return;
        }
      }
      setError(msg);
    } finally {
      setStarting(false);
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    if (Object.keys(answers).length !== quiz.questions.length) {
      setError('Answer every question before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await submitQualificationQuiz(quiz.attempt.id, answers);
      if (result.passed) {
        navigate('/tester-qualification/sample', { replace: true });
        return;
      }
      setStatus('retry_required');
      setQuiz({ ...quiz, attempt: { ...quiz.attempt, status: 'retry_required', score: result.score, total: result.total } });
      setAnswers({});
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit your QA foundations quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) return null;
  if (status === 'approved') return <Navigate to="/tester/dashboard" replace />;
  if (status === 'quiz_passed') return <Navigate to="/tester-qualification/sample" replace />;

  return (
    <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
      <TesterApplicationProgress current={status === 'sample_submitted' ? 4 : 2} awaitingReview={status === 'sample_submitted'} />

      {loading ? <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Preparing QA foundations...</section> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

      {!loading && status === 'sample_submitted' ? (
        <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-7 text-center shadow-sm sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500 text-white"><CheckCircle2 className="h-7 w-7" /></span>
          <h2 className="mt-5 text-2xl font-black text-slate-950">Awaiting SQUASH review</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-700">Your sample test, report and evidence were submitted successfully. We will notify you once a reviewer has made a decision.</p>
        </section>
      ) : null}

      {!loading && status === 'declined' ? (
        <section className="rounded-[30px] border border-rose-200 bg-rose-50 p-7 text-center shadow-sm"><CircleAlert className="mx-auto h-8 w-8 text-rose-600" /><h2 className="mt-4 text-2xl font-black text-slate-950">Your application is closed</h2><p className="mt-2 text-sm text-slate-700">Contact SQUASH support if you believe this needs a review.</p></section>
      ) : null}

      {!loading && status !== 'sample_submitted' && status !== 'declined' && (!quiz || quiz.attempt.status === 'retry_required') ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-900"><ClipboardCheck className="h-5 w-5" /></div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">QA Foundations Quiz</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 font-normal">Answer 12 short testing scenario questions to demonstrate your core software testing knowledge. 9 correct answers required to pass.</p>
          {quiz?.attempt.status === 'retry_required' ? <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-xs leading-5 text-amber-800 font-medium">Your retry attempt will feature a fresh set of questions.</div> : null}
          <button type="button" onClick={() => void startQuiz()} disabled={starting} className="squash-btn-primary mt-6">{starting ? 'Preparing Quiz...' : quiz ? 'Start Retry' : 'Start QA Foundations'} <ArrowRight className="h-4 w-4" /></button>
        </section>
      ) : null}

      {!loading && quiz?.attempt.status === 'quiz_in_progress' ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">QA Foundations Scenarios</h2>
              <p className="mt-0.5 text-xs text-slate-500 font-normal">Select the best answer for each testing scenario below.</p>
            </div>
            <span className="rounded-full bg-slate-100/80 border border-slate-200/60 px-3 py-1 text-xs font-semibold text-slate-700">
              {Object.keys(answers).length} / {quiz.questions.length} Answered
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {quiz.questions.map((question, index) => (
              <fieldset key={question.id} className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 sm:p-5">
                <legend className="px-1 text-xs sm:text-sm font-bold text-slate-900">{index + 1}. {question.prompt}</legend>
                <div className="mt-3.5 grid gap-2">
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[question.id] === optionIndex;
                    return (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-xs sm:text-sm transition-all ${
                          selected
                            ? 'border-slate-900 bg-slate-900/5 text-slate-900 font-medium shadow-2xs'
                            : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          checked={selected}
                          onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                          className="mt-0.5 accent-slate-900"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 text-xs text-slate-400 font-normal">
              <LockKeyhole className="h-3.5 w-3.5 text-slate-400" />
              Answers are evaluated only upon submission.
            </p>
            <button
              type="button"
              onClick={() => void submitQuiz()}
              disabled={submitting}
              className="squash-btn-primary"
            >
              {submitting ? 'Evaluating...' : 'Submit Answers'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
