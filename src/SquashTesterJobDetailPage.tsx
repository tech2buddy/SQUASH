import { ArrowLeft, CheckCircle2, Clock3, FileText, Globe2, Smartphone, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from './auth';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { applyToJob, getActiveJobById, getTesterApplications, type DeveloperJob } from './lib/jobApi';
import { testerPayoutForJob } from './lib/pricing';
import { getTesterQualificationStatus, type QualificationStatus } from './lib/testerQualificationApi';
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
  const [qualificationStatus, setQualificationStatus] = useState<QualificationStatus | null>(null);
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
    if (!session?.userId) return;
    let active = true;
    void getTesterQualificationStatus(session.userId)
      .then((status) => { if (active) setQualificationStatus(status); })
      .catch(() => { if (active) setQualificationStatus('not_started'); });
    return () => { active = false; };
  }, [session?.userId]);

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
    if (qualificationStatus !== 'approved') {
      setApplyError('Complete the SQUASH Tester Academy and receive approval before applying to paid jobs.');
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
        <Link to="/tester-jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-[#e63946] hover:text-[#d62828]">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {loadError || 'This job is no longer available.'}
        </div>
      </div>
    );
  }

  const testType = getTestTypeByKey(job.packageKey);
  // Mirrors job_application_requirement_keys in phase 47 -- shown so a tester
  // learns about the requirement here rather than from a rejected application.
  const category = getCategoryById(job.category as TestCategoryId);
  const payout = testerPayoutForJob(job.totalAmountZar, job.testersNeeded);
  const tasks = (job.tasks || '').split('\n').map((task) => task.trim()).filter(Boolean);
  const isOwnJob = job.developerId === session?.userId;

  return (
    <div className="space-y-4">
      <Link to="/tester-jobs" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#666663] hover:text-[#181817] transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to job board
      </Link>

      {notice ? (
        <div className="p-3 rounded-md bg-[#EAF7EF] border border-[#238554]/20 text-xs text-[#238554] font-medium">{notice}</div>
      ) : null}
      {applyError ? (
        <div className="p-3 rounded-md bg-[#FDECEC] border border-[#C95050]/20 text-xs text-[#C95050] font-medium">{applyError}</div>
      ) : null}

      {/* Main Header Panel */}
      <section className="squash-panel p-5 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            {job.logoUrl ? (
              <img src={job.logoUrl} alt="" className="h-10 w-10 rounded-md object-cover border border-[#E7E7E5]" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F7F7F6] border border-[#E7E7E5] text-xs font-semibold text-[#181817]">
                {job.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[#181817]">{job.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="squash-status-pill squash-status-info">{testType.label}</span>
                <span className="squash-status-pill squash-status-neutral">{category.name}</span>
                <span className="squash-status-pill squash-status-neutral">{job.platform}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-xl bg-[#1d4b38] text-white p-3 text-center min-w-[140px] shadow-[0_8px_18px_rgba(29,75,56,0.18)]">
            <div className="text-xl font-semibold tracking-tight text-white">R{payout}</div>
            <div className="text-[10px] text-[#c7e7d2]">Per Approved QA Report</div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 pt-3 border-t border-[#EEEEEC]">
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#F7F7F6] border border-[#E7E7E5] text-xs font-medium text-[#181817]">
            <Clock3 className="h-3.5 w-3.5 text-[#666663]" />
            <span>Est. {testType.estimatedMinutes} mins</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#F7F7F6] border border-[#E7E7E5] text-xs font-medium text-[#181817]">
            <Users className="h-3.5 w-3.5 text-[#666663]" />
            <span>{job.testersNeeded} testers needed</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#F7F7F6] border border-[#E7E7E5] text-xs font-medium text-[#181817]">
            <Smartphone className="h-3.5 w-3.5 text-[#666663]" />
            <span>{job.platform}</span>
          </div>
        </div>
      </section>

      {/* About App */}
      <section className="squash-panel p-5 space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#181817]">About Application</h2>
        <p className="text-xs text-[#666663] whitespace-pre-line leading-relaxed">
          {job.description || 'No description provided.'}
        </p>
        {job.appUrl ? (
          <div className="mt-3 flex items-center gap-2 text-xs pt-2 border-t border-[#EEEEEC]">
            <Globe2 className="h-3.5 w-3.5 text-[#92928E]" />
            <span className="font-medium text-[#181817]">Target URL / App:</span>
            <span className="text-[#666663] truncate">{job.appUrl}</span>
          </div>
        ) : null}
      </section>

      {/* Test Tasks */}
      <section className="squash-panel p-5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#181817]">Tasks To Execute</h2>
        {tasks.length ? (
          <ol className="space-y-2">
            {tasks.map((task, index) => (
              <li key={`${task}-${index}`} className="flex items-start gap-2.5 text-xs text-[#181817]">
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded bg-[#F7F7F6] border border-[#E7E7E5] text-[10px] font-semibold text-[#666663] mt-0.5">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{task}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-[#92928E]">The developer will share specific test cases upon acceptance.</p>
        )}
      </section>

      {/* Primary Action Panel */}
      <section className="squash-panel p-4 bg-[#FAFAF9]">
        {isOwnJob ? (
          <div className="p-3 text-xs text-[#A86E19] bg-[#FFF5E6] rounded-md font-medium">
            This is your own job posting; you cannot apply to it.
          </div>
        ) : qualificationStatus !== null && qualificationStatus !== 'approved' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#FFF5E6] rounded-md text-xs">
            <div>
              <div className="font-semibold text-[#A86E19]">Academy Qualification Required</div>
              <p className="text-[#666663]">Complete your SQUASH Academy sample test before applying to paid jobs.</p>
            </div>
            <Link to="/tester-qualification" className="squash-btn-primary shrink-0">
              Continue Academy
            </Link>
          </div>
        ) : applicationStatus === 'accepted' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#238554]">
              <CheckCircle2 className="h-4 w-4" /> Application Accepted.
            </div>
            <button
              type="button"
              onClick={() => navigate('/active-test')}
              className="squash-btn-primary"
            >
              Enter Test Lab
            </button>
          </div>
        ) : applicationStatus === 'pending' ? (
          <div className="flex items-center gap-2 text-xs font-medium text-[#A86E19]">
            <FileText className="h-4 w-4" /> Application Under Review.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#181817]">Ready to execute this assignment?</div>
              <div className="text-[11px] text-[#666663]">
                R{payout} payout upon approved report submission.
              </div>
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="squash-btn-primary"
            >
              {applying ? 'Applying...' : 'Apply Now'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
