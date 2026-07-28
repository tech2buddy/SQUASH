import {
  Camera,
  ClipboardList,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import SquashScore, { type SquashScoreBreakdown } from './components/SquashScore';
import { useAuth } from './auth';
import {
  getDeveloperSubmittedReports,
  getSubmissionDetails,
  reviewSubmittedReport,
  type DeveloperSubmissionDetails,
} from './lib/jobApi';
import { listTesterJobEvidence, type TesterJobEvidence } from './lib/storageApi';

function formatDateTime(value: string | null) {
  if (!value) return 'Not submitted yet';
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function SquashReportDetailsPage() {
  const { session } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const submissionId = params.get('submission');
  const jobId = params.get('job');

  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [realReport, setRealReport] = useState<DeveloperSubmissionDetails | null>(null);
  const [evidence, setEvidence] = useState<TesterJobEvidence[]>([]);
  const [noReportsForJob, setNoReportsForJob] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    const currentUserId = session?.userId;
    if (!currentUserId || !session.roles.includes('developer')) return;

    let mounted = true;
    setLoadingReport(true);
    setReportError('');

    const loadData = async () => {
      try {
        let targetId = submissionId;

        if (!targetId) {
          // Filter by specific job if ?job= param is present
          const allReports = await getDeveloperSubmittedReports(currentUserId);
          if (!mounted) return;

          const filtered = jobId ? allReports.filter((r) => r.jobId === jobId) : allReports;

          if (filtered.length > 0) {
            targetId = filtered[0].id;
            if (jobId) setJobTitle(filtered[0].jobTitle || null);
          } else {
            // No reports for this job — show proper empty state
            if (jobId) {
              // Try to get the job title from the full list
              const jobReport = allReports.find((r) => r.jobId === jobId);
              setJobTitle(jobReport?.jobTitle || null);
              setNoReportsForJob(true);
            }
            setRealReport(null);
            return;
          }
        }

        const details = await getSubmissionDetails(targetId);
        if (!mounted) return;

        if (details) {
          setRealReport(details);
          setEvidence(await listTesterJobEvidence(details.testerId, details.jobId));
          if (jobId) setJobTitle(details.jobTitle || null);
        } else {
          setReportError('The specified report could not be found.');
        }
      } catch (err) {
        if (mounted) {
          setReportError(err instanceof Error ? err.message : 'Could not load report details.');
        }
      } finally {
        if (mounted) setLoadingReport(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [session?.roles, session?.userId, submissionId, jobId]);

  const handleReviewAction = async (newStatus: 'approved' | 'changes_requested' | 'rejected') => {
    if (!realReport) return;
    setReviewing(true);
    setActionNotice('');
    setReportError('');

    try {
      await reviewSubmittedReport({
        submissionId: realReport.id,
        assignmentId: realReport.assignmentId,
        status: newStatus,
      });

      setRealReport((prev: DeveloperSubmissionDetails | null) => (prev ? { ...prev, status: newStatus } : null));
      setActionNotice(
        newStatus === 'approved'
          ? 'Report has been approved. Tester payment has been authorized.'
          : newStatus === 'changes_requested'
            ? 'Changes requested from the tester.'
            : 'Report was marked as rejected.',
      );
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Failed to update report status.');
    } finally {
      setReviewing(false);
    }
  };


  const scores: SquashScoreBreakdown = realReport?.scores || {
    usability: 0,
    performance: 0,
    onboarding: 0,
    bugSeverity: 0,
    deviceCompatibility: 0,
  };
  const hasScores = Object.values(scores).some((score) => score > 0);

  return (
    <div>
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {loadingReport ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
                Loading report details...
              </div>
            ) : noReportsForJob ? (
              <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-600 ring-1 ring-green-100">
                  <ClipboardList className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-2xl font-black text-slate-900">
                  No Reports for {jobTitle || 'This Job'} Yet
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Accepted testers haven't submitted any reports for this job yet. Once they complete testing, their bug reports and scores will appear here.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/developer/jobs"
                    className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    View Active Jobs
                  </Link>
                  <Link
                    to="/developer/submissions"
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    All Submissions
                  </Link>
                </div>
              </div>
            ) : !realReport ? (
              <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-600 ring-1 ring-green-100">
                  <ClipboardList className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-2xl font-black text-slate-900">No Submitted Reports Yet</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  When accepted testers complete testing on your active jobs, their bug reports, steps to reproduce, and overall usability scores will appear here.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/developer/jobs"
                    className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    View Active Jobs
                  </Link>
                  <Link
                    to="/post-job"
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Post a New Job
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {realReport.jobPlatform}
                        </span>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold capitalize text-green-700 ring-1 ring-green-100">
                          {realReport.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h1 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">{realReport.jobTitle}</h1>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                        <span>Submitted by <strong className="text-slate-900">{realReport.testerName}</strong></span>
                        <span>•</span>
                        <span>{formatDateTime(realReport.submittedAt || realReport.createdAt)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={reviewing}
                        onClick={() => handleReviewAction('approved')}
                        className="rounded-2xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {reviewing ? 'Updating...' : 'Approve Report'}
                      </button>
                      <button
                        type="button"
                        disabled={reviewing}
                        onClick={() => handleReviewAction('changes_requested')}
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                      >
                        Request Changes
                      </button>
                      <button
                        type="button"
                        disabled={reviewing}
                        onClick={() => handleReviewAction('rejected')}
                        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {actionNotice ? (
                    <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-xs font-semibold text-green-800">
                      {actionNotice}
                    </div>
                  ) : null}

                  {reportError ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                      {reportError}
                    </div>
                  ) : null}
                </div>

                {/* Grid Content */}
                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                  {/* Left Column: Summary & Bugs */}
                  <div className="space-y-6">
                    {/* Tester Summary */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                      <h2 className="text-lg font-bold text-slate-900">Tester Summary & Feedback</h2>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {realReport.summary || 'Tester completed testing and submitted findings.'}
                      </p>
                    </div>

                    {/* Submitted Evidence */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-slate-900">Submitted Evidence</h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {evidence.length}
                        </span>
                      </div>
                      {evidence.length > 0 ? (
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          {evidence.map((item) => (
                            <figure key={item.path} className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
                              {item.type === 'screenshot' ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                  <img src={item.url} alt="Tester-submitted evidence" className="h-64 w-full object-contain" />
                                </a>
                              ) : (
                                <video controls preload="metadata" src={item.url} className="h-64 w-full object-contain" />
                              )}
                              <figcaption className="flex items-center gap-2 bg-white px-4 py-3 text-xs font-semibold text-slate-700">
                                {item.type === 'screenshot' ? <Camera className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                                {item.type === 'screenshot' ? 'Screenshot evidence' : 'Video evidence'}
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                          No screenshot or video was submitted with this report.
                        </p>
                      )}
                    </div>
                    {/* Reported Bugs */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">
                          Reported Bugs ({realReport.bugs.length})
                        </h2>
                        {realReport.criticalBugCount > 0 ? (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-100">
                            {realReport.criticalBugCount} Critical Bug{realReport.criticalBugCount === 1 ? '' : 's'}
                          </span>
                        ) : null}
                      </div>

                      {realReport.bugs.length > 0 ? (
                        <div className="mt-6 space-y-6">
                          {realReport.bugs.map((bug: any, index: number) => (
                            <div key={bug.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                                    #{index + 1}
                                  </span>
                                  <h3 className="font-bold text-slate-900">{bug.title}</h3>
                                </div>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    bug.severity === 'Critical'
                                      ? 'bg-red-100 text-red-700'
                                      : bug.severity === 'High'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {bug.severity}
                                </span>
                              </div>

                              {bug.description ? (
                                <p className="mt-3 text-xs leading-5 text-slate-600">{bug.description}</p>
                              ) : null}

                              {bug.stepsToReproduce && bug.stepsToReproduce.length > 0 ? (
                                <div className="mt-4">
                                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Steps to Reproduce:</div>
                                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs text-slate-700">
                                    {bug.stepsToReproduce.map((step: string, sIdx: number) => (
                                      <li key={sIdx}>{step}</li>
                                    ))}
                                  </ol>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 text-xs font-semibold text-slate-500">No specific bugs were logged in this test run.</div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Scores & Tester Profile */}
                  <div className="space-y-6">
                    {/* Scores Card */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-bold text-slate-900">Squash Quality Score</h3>
                      <div className="mt-4">
                        {hasScores ? (
                          <SquashScore scores={scores} compact={false} />
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                            No scored questionnaire was collected for this submission.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tester Info Card */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-base font-bold text-slate-900">Tester Details</h3>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 font-bold text-white">
                          {realReport.testerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{realReport.testerName}</div>
                          <div className="text-xs text-slate-500">{realReport.testerEmail || 'Verified Tester'}</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Tests Completed:</span>
                        <span className="font-bold text-slate-900">{realReport.testerTestsCompleted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

    </div>
  );
}
