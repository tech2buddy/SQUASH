import { ArrowLeft, CheckCircle2, Clock3, FileText, Globe2, Lock, Smartphone, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './auth';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { getSpecializationLabel } from './components/testerSpecializations';
import { applyToJob, getActiveJobById, getTesterApplications, type DeveloperJob } from './lib/jobApi';
import { testerPayoutForJob } from './lib/pricing';
import { getTestTypeByKey } from './lib/testTypes';

type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export default function SquashTesterJobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();

  const [job, setJob] = useState<DeveloperJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [applying, setApplying] = useState(false);
  const [notice, setNotice] = useState('');
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    setLoading(true);

    getActiveJobById(jobId)
      .then((result) => {
        if (!active) return;
        setJob(result);
        setLoadError(result ? '' : 'This job is no longer available.');
      })
      .catch((error: Error) => {
        if (active) setLoadError(error.message || 'Unable to load this job right now.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [jobId]);

  useEffect(() => {
    if (!session?.userId || !jobId) return;
    let active = true;

    getTesterApplications(session.userId)
      .then((applications) => {
        if (!active) return;
        const match = applications.find((application) => application.jobId === jobId);
        setApplicationStatus(match ? (match.status as ApplicationStatus) : null);
      })
      .catch(() => {
        // Non-fatal: the apply button still works, it just won't show prior state.
      });

    return () => {
      active = false;
    };
  }, [session?.userId, jobId]);

  const handleApply = async () => {
    if (!job || !session?.userId) {
      setApplyError('Please log in with a tester account before applying.');
      return;
    }
    if (job.developerId === session.userId) {
      setApplyError('You cannot apply to a job you posted yourself.');
      return;
    }

    setApplying(true);
    setApplyError('');
    try {
      const application = await applyToJob(job.id, session.userId);
      setApplicationStatus(application.status as ApplicationStatus);
      setNotice('Application sent. The developer can now review your tester profile.');
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : 'Unable to apply right now.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-sm font-semibold text-slate-600">
        Loading job details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <Link to="/tester-jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {loadError || 'This job is no longer available.'}
        </div>
      </div>
    );
  }

  const testType = getTestTypeByKey(job.packageKey);
  const category = getCategoryById(job.category as TestCategoryId);
  const payout = testerPayoutForJob(job.totalAmountZar, job.testersNeeded);
  const tasks = (job.tasks || '').split('\n').map((task) => task.trim()).filter(Boolean);
  const isOwnJob = job.developerId === session?.userId;

  return (
    <div className="space-y-6">
      <Link to="/tester-jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

      {notice ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{notice}</div>
      ) : null}
      {applyError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{applyError}</div>
      ) : null}

      <section className="apple-bento-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {job.logoUrl ? (
              <img src={job.logoUrl} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-green-700 text-lg font-black text-white">
                {job.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{job.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-800">{testType.label}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{category.name}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{job.platform}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-green-50 px-5 py-4 text-center ring-1 ring-green-100">
            <div className="text-3xl font-black text-green-700">R{payout}</div>
            <div className="mt-1 text-xs font-semibold text-slate-600">per approved test</div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-4 py-3">
            <Clock3 className="h-4 w-4 shrink-0 text-green-700" />
            <span className="text-sm font-semibold text-slate-700">About {testType.estimatedMinutes} min</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-4 py-3">
            <Users className="h-4 w-4 shrink-0 text-green-700" />
            <span className="text-sm font-semibold text-slate-700">{job.testersNeeded} testers needed</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-4 py-3">
            <Smartphone className="h-4 w-4 shrink-0 text-green-700" />
            <span className="text-sm font-semibold text-slate-700">{job.platform}</span>
          </div>
        </div>
      </section>

      <section className="apple-bento-card p-6">
        <h2 className="text-lg font-bold text-slate-900">About this app</h2>
        <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
          {job.description || 'The developer has not added a description for this app.'}
        </p>
        {job.appUrl ? (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Globe2 className="h-4 w-4 shrink-0 text-green-700" />
            <span className="font-semibold text-slate-700">You will test:</span>
            <span className="break-all text-slate-600">{job.appUrl}</span>
          </div>
        ) : null}
      </section>

      <section className="apple-bento-card p-6">
        <h2 className="text-lg font-bold text-slate-900">What you will do</h2>
        {tasks.length ? (
          <ol className="mt-4 space-y-3">
            {tasks.map((task, index) => (
              <li key={`${task}-${index}`} className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-100 text-xs font-bold text-green-800">
                  {index + 1}
                </span>
                <span className="leading-7 text-slate-700">{task}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-slate-600">The developer will share the task list once you are accepted.</p>
        )}
      </section>

      {job.focusAreas ? (
        <section className="apple-bento-card p-6">
          <h2 className="text-lg font-bold text-slate-900">What to focus on</h2>
          <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{job.focusAreas}</p>
        </section>
      ) : null}

      {job.additionalInfo ? (
        <section className="apple-bento-card p-6">
          <h2 className="text-lg font-bold text-slate-900">Extra notes from the developer</h2>
          <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{job.additionalInfo}</p>
        </section>
      ) : null}

      {job.preferredSpecializations.length ? (
        <section className="apple-bento-card p-6">
          <h2 className="text-lg font-bold text-slate-900">Tester profile the developer wants</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.preferredSpecializations.map((id) => (
              <span key={id} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                {getSpecializationLabel(id)}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            These are preferences, not hard requirements. You can still apply if some do not match you.
          </p>
        </section>
      ) : null}

      <section className="apple-bento-card p-6">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Attachments</h2>
            <p className="mt-2 leading-7 text-slate-600">
              Any files the developer attached — screens, test accounts or briefs — become available
              on your Test Lab screen once your application is accepted. They stay private until then.
            </p>
          </div>
        </div>
      </section>

      <section className="apple-bento-card p-6">
        {isOwnJob ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            This is your own job posting, so you cannot apply to it.
          </div>
        ) : applicationStatus === 'accepted' ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <CheckCircle2 className="h-5 w-5" /> You have been accepted for this job.
            </div>
            <button
              type="button"
              onClick={() => navigate('/active-test')}
              className="rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Go to my tests
            </button>
          </div>
        ) : applicationStatus === 'pending' ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <FileText className="h-5 w-5" /> Application sent — the developer is reviewing your profile.
          </div>
        ) : applicationStatus === 'rejected' ? (
          <div className="text-sm font-semibold text-slate-600">
            Your application for this job was not accepted this time.
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-bold text-slate-900">Ready to take this on?</div>
              <div className="mt-1 text-sm text-slate-600">
                You earn R{payout} once your report is approved.
              </div>
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="rounded-2xl bg-green-600 px-8 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {applying ? 'Applying...' : 'Apply Now'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
