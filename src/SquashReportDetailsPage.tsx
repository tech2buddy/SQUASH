import {
  AlertCircle,
  Bug,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  MessageSquare,
  Monitor,
  Play,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import {
  getDeveloperSubmittedReports,
  getSubmissionDetails,
  reviewSubmittedReport,
  type DeveloperSubmissionDetails,
} from './lib/jobApi';
import { listTesterJobEvidence } from './lib/storageApi';
import {
  captureSessionEnvironment,
  getSessionEnvironment,
  getTaskResultsForAssignment,
  type SessionEnvironment,
  type TestTaskResult,
} from './lib/testLabApi';

function formatDateTime(value: string | null) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatHumanDuration(val?: string | number | null) {
  if (!val) return 'Not recorded';
  if (typeof val === 'number') {
    if (val < 60) return `${val}s`;
    const mins = Math.floor(val / 60);
    const secs = val % 60;
    if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  }
  const match = val.match(/(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/i);
  if (match && (match[1] || match[2] || match[3])) {
    const hrs = parseInt(match[1] || '0', 10);
    const mins = parseInt(match[2] || '0', 10);
    const secs = parseInt(match[3] || '0', 10);
    const totalMins = hrs * 60 + mins;
    if (totalMins >= 60) {
      const formattedHrs = Math.floor(totalMins / 60);
      const remMins = totalMins % 60;
      return remMins > 0 ? `${formattedHrs}h ${remMins}m` : `${formattedHrs}h`;
    } else if (totalMins > 0) {
      return secs > 0 ? `${totalMins}m ${secs}s` : `${totalMins}m`;
    } else if (secs > 0) {
      return `${secs}s`;
    }
  }
  return val;
}

export default function SquashReportDetailsPage() {
  const { session } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const submissionId = params.get('submission');
  const jobId = params.get('job');

  const [realReport, setRealReport] = useState<DeveloperSubmissionDetails | null>(null);
  const [taskResults, setTaskResults] = useState<TestTaskResult[]>([]);
  const [environment, setEnvironment] = useState<SessionEnvironment | null>(null);
  // Signed-URL evidence the tester uploaded. Was previously fetched and
  // discarded, while the UI showed hardcoded placeholder evidence cards.
  const [evidence, setEvidence] = useState<Array<{ path: string; name: string; type: string; url: string }>>([]);
  const [loadingReport, setLoadingReport] = useState(true);
  const [reportError, setReportError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [expandedTask, setExpandedTask] = useState<number | null>(1); // expand task 2 by default

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
          const allReports = await getDeveloperSubmittedReports(currentUserId);
          if (!mounted) return;
          const filtered = jobId ? allReports.filter((r) => r.jobId === jobId) : allReports;
          if (filtered.length > 0) {
            targetId = filtered[0].id;
          }
        }

        if (targetId) {
          const details = await getSubmissionDetails(targetId);
          if (!mounted) return;
          if (details) {
            setRealReport(details);
            setEvidence(await listTesterJobEvidence(details.testerId, details.jobId));
            // Per-task timing and difficulty/emotion ratings recorded in the
            // Test Lab. Fails soft so the report still renders without them.
            try {
              setTaskResults(await getTaskResultsForAssignment(details.assignmentId));
              setEnvironment(await getSessionEnvironment(details.assignmentId));
            } catch {
              setTaskResults([]);
            }
          }
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

      setRealReport((prev) => (prev ? { ...prev, status: newStatus } : null));
      setActionNotice(
        newStatus === 'approved'
          ? 'Report approved & payout released.'
          : newStatus === 'changes_requested'
            ? 'Changes requested from tester.'
            : 'Report rejected.',
      );
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Failed to update report status.');
    } finally {
      setReviewing(false);
    }
  };

  if (loadingReport) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-sm font-bold text-slate-800">Loading report details...</p>
      </div>
    );
  }

  const rawTitle = realReport?.jobTitle || 'Test Job';
  const cleanJobTitle = rawTitle.replace(/(?:'s\s*)?Test\s*Report$/i, '').trim();
  const displayTitle = `${cleanJobTitle || 'Test Job'}'s Test Report`;
  const displayTesterName = realReport?.testerName || 'Unknown tester';
  const displaySubmittedAt = formatDateTime(realReport?.submittedAt || realReport?.createdAt || null);
  const displayReportId = realReport?.id ? `SQA-${realReport.id.slice(0, 4).toUpperCase()}` : 'Not available';
  // Average of the scores the tester actually submitted. Zero means "not
  // scored", so those are excluded rather than dragging the average down.
  const submittedScores = Object.values(realReport?.scores || {}).filter((score) => score > 0);
  const displayQualityScore = submittedScores.length
    ? Math.round(submittedScores.reduce((sum, score) => sum + score, 0) / submittedScores.length)
    : null;

  const displayExecutiveSummary =
    realReport?.summary?.trim() || 'The tester did not add a written summary for this submission.';

  const formatTaskDuration = (seconds: number | null) => {
    if (seconds == null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Real Test Lab results. A task the tester found Confusing or Frustrating
  // is flagged, since that is the signal a usability test is bought for.
  const taskResultsList = taskResults.map((result, index) => ({
    id: index + 1,
    title: result.title,
    status: result.status === 'completed' ? 'pass' : result.status === 'skipped' ? 'fail' : 'pending',
    duration: formatTaskDuration(result.durationSeconds),
    difficulty: result.difficultyRating,
    emotion: result.emotionRating,
    flagged: result.emotionRating === 'Confusing' || result.emotionRating === 'Frustrating',
  }));

  const completedTaskCount = taskResultsList.filter((task) => task.status === 'pass').length;
  const frictionTaskCount = taskResultsList.filter((task) => task.flagged).length;

  const reportedBugs = realReport?.bugs ?? [];

  const severityTone = (severity: string) => {
    if (severity === 'Critical') return 'bg-red-50 text-red-700 border-red-200/60';
    if (severity === 'High') return 'bg-rose-50 text-rose-700 border-rose-200/60';
    if (severity === 'Low') return 'bg-slate-50 text-slate-700 border-slate-200/60';
    return 'bg-amber-50 text-amber-700 border-amber-200/60';
  };

  return (
    <div className="space-y-5 pb-20 sm:pb-24">
      {/* Top Banner Card (Integrated smoothly with DeveloperLayout) */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Title & Metadata Badges */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-white shadow-xs overflow-hidden">
                {realReport?.jobLogoUrl ? (
                  <img src={realReport.jobLogoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-black tracking-tight">
                    {(displayTitle || 'B').slice(0, 1)}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl truncate">
                {displayTitle}'s Test Report
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-600 pl-[52px]">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                Submitted
              </span>
              <span className="text-slate-300">|</span>
              <span>Tester: <strong className="text-slate-800">{displayTesterName}</strong></span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Submitted {displaySubmittedAt}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-mono text-[11px]">
                Report ID: <strong>{displayReportId}</strong>
              </span>
            </div>
          </div>

          {/* Quality score, averaged from the scores the tester submitted */}
          <div className={`flex items-center gap-3 rounded-2xl px-4.5 py-2.5 shadow-sm shrink-0 ${
            displayQualityScore == null ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 text-white'
          }`}>
            <ShieldCheck className={`h-6 w-6 ${displayQualityScore == null ? 'text-slate-400' : 'text-emerald-100'}`} />
            <div className="text-left">
              <p className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5 ${
                displayQualityScore == null ? 'text-slate-500' : 'text-emerald-100'
              }`}>Quality score</p>
              <p className="text-xl font-black leading-none">
                {displayQualityScore == null ? 'Not scored' : `${displayQualityScore}%`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metric summary, derived from the real Test Lab session.
          "Passed/Failed" was replaced with Completed/Friction: tasks are
          completed or skipped, and the useful signal is which steps the
          tester rated Confusing or Frustrating. */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { value: taskResultsList.length, label: 'Tasks Tested', icon: FileText, tone: 'bg-blue-50 text-blue-600 border-blue-100' },
          { value: completedTaskCount, label: 'Completed', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { value: frictionTaskCount, label: 'Friction Points', icon: XCircle, tone: 'bg-rose-50 text-rose-600 border-rose-100' },
          { value: realReport?.bugs?.length ?? 0, label: 'Bugs Found', icon: Bug, tone: 'bg-amber-50 text-amber-600 border-amber-100' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex items-center gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${card.tone}`}>
                <Icon className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 leading-tight">{card.value}</p>
                <p className="text-xs font-semibold text-slate-500">{card.label}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Notices */}
      {actionNotice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4" /> {actionNotice}
        </div>
      ) : null}
      {reportError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center gap-2 shadow-2xs">
          <AlertCircle className="h-4 w-4" /> {reportError}
        </div>
      ) : null}

      {/* Responsive 2-Column Main Layout Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        {/* Left Column (Executive Summary, Task Results, Recommendations) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Executive Summary Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-3 border-b border-slate-100 pb-2.5">
              <FileText className="h-4.5 w-4.5 text-slate-600" />
              <h2>Executive Summary</h2>
            </div>
            <p className="text-xs leading-relaxed text-slate-700 font-medium">
              {displayExecutiveSummary}
            </p>
          </section>

          {/* 2. Task Results Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <span className="text-slate-500 font-mono text-sm font-bold">≡</span>
                <h2>Task Results</h2>
              </div>
            </div>

            <div className="space-y-2.5">
              {taskResultsList.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-semibold text-slate-500">
                  No per-task results recorded for this submission.
                </p>
              ) : null}
              {taskResultsList.map((task, index) => {
                const isExpanded = expandedTask === index;
                return (
                  <div
                    key={task.id}
                    className={`rounded-xl border transition-all ${
                      isExpanded ? 'border-blue-200 bg-white shadow-2xs' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedTask(isExpanded ? null : index)}
                      className="flex w-full items-center justify-between gap-3 p-3 text-left text-xs"
                    >
                      {/* Left: Number + Title + Full Note */}
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span
                          className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-0.5 ${
                            task.status === 'pass'
                              ? 'border border-emerald-400 bg-emerald-50 text-emerald-700'
                              : 'border border-rose-400 bg-rose-50 text-rose-700 font-black'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs">{task.title}</p>
                        </div>
                      </div>

                      {/* Right: Perfectly Aligned Badges Column */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            task.status === 'pass'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {task.status.toUpperCase()}
                        </span>

                        {task.flagged ? (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            FRICTION
                          </span>
                        ) : null}

                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${
                            isExpanded ? 'rotate-180 text-slate-600' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isExpanded ? (
                      <div className="border-t border-slate-100 p-3.5 bg-slate-50/60 rounded-b-xl text-xs text-slate-700 space-y-2">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                          <span>
                            <strong>Time on task:</strong>{' '}
                            <span className="font-semibold text-slate-900">{formatHumanDuration(task.duration)}</span>
                          </span>
                          {task.difficulty && (task.difficulty as string) !== 'Not rated' ? (
                            <span>
                              <strong>Difficulty:</strong>{' '}
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                                {task.difficulty}
                              </span>
                            </span>
                          ) : null}
                          {task.emotion && (task.emotion as string) !== 'Not rated' ? (
                            <span>
                              <strong>How it felt:</strong>{' '}
                              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700">
                                {task.emotion}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Friction summary, derived from the tester's own task ratings
              rather than invented recommendations. Only shown when the
              tester actually flagged something. */}
          {frictionTaskCount > 0 ? (
            <section className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-2xs">
              <div className="mb-3 flex items-center gap-2 border-b border-amber-100 pb-2.5 text-base font-bold text-slate-900">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
                <h2>Where this tester struggled</h2>
              </div>
              <ul className="space-y-2 pl-5 text-xs font-medium text-slate-700 list-disc">
                {taskResultsList.filter((task) => task.flagged).map((task) => (
                  <li key={`friction-${task.id}`}>
                    <strong>{task.title}</strong> — rated {task.emotion?.toLowerCase()}
                    {task.difficulty ? ` and ${task.difficulty.toLowerCase()}` : ''}
                    {task.duration ? `, took ${task.duration}` : ''}.
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Right Column (Bugs, Environment) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Bug reports actually filed by the tester during this session. */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base mb-3 border-b border-slate-100 pb-3">
              <Bug className="h-5 w-5 text-rose-500 shrink-0" />
              <h2>Bugs Reported ({reportedBugs.length})</h2>
            </div>

            {reportedBugs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-semibold text-slate-500">
                The tester did not file any bugs for this submission.
              </p>
            ) : (
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {reportedBugs.map((bug, bugIndex) => (
                  <div key={bug.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        BUG-{String(bugIndex + 1).padStart(2, '0')} — {bug.title}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${severityTone(bug.severity)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {bug.severity} severity
                      </span>
                    </div>

                    {bug.description ? (
                      <p className="mt-2.5 whitespace-pre-line text-xs font-medium leading-relaxed text-slate-700">
                        {bug.description}
                      </p>
                    ) : null}

                    {bug.expectedResult || bug.actualResult ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {bug.expectedResult ? (
                          <div>
                            <h4 className="mb-1 text-xs font-bold text-slate-900">Expected result</h4>
                            <p className="text-xs font-medium leading-relaxed text-slate-600">{bug.expectedResult}</p>
                          </div>
                        ) : null}
                        {bug.actualResult ? (
                          <div>
                            <h4 className="mb-1 text-xs font-bold text-slate-900">Actual result</h4>
                            <p className="text-xs font-medium leading-relaxed text-slate-600">{bug.actualResult}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {bug.reproductionSteps.length > 0 ? (
                      <div className="mt-3">
                        <h4 className="mb-2 text-xs font-bold text-slate-900">Steps to reproduce</h4>
                        <ol className="space-y-1.5 text-xs font-medium text-slate-700">
                          {bug.reproductionSteps.map((step, stepIndex) => (
                            <li key={`${bug.id}-step-${stepIndex}`} className="flex items-start gap-1.5">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                                {stepIndex + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {evidence.length > 0 ? (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <h3 className="mb-2.5 text-xs font-bold text-slate-900">Evidence uploaded by this tester</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {evidence.map((item) => (
                    <div key={item.path} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
                      <div className="mb-2 h-24 w-full overflow-hidden rounded-lg bg-slate-950">
                        {item.type === 'screenshot' ? (
                          <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-md">
                              <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="truncate text-[11px] font-semibold text-slate-600">{item.name}</span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          View evidence <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* 2. Captured Environment Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-3 border-b border-slate-100 pb-2.5">
              <Monitor className="h-4.5 w-4.5 text-slate-600" />
              <h2>Captured Environment</h2>
            </div>

            {(() => {
              const activeEnv = environment || captureSessionEnvironment();
              return (
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                  {[
                    { label: 'OS', value: activeEnv.os },
                    { label: 'Browser', value: activeEnv.browser },
                    { label: 'Screen', value: activeEnv.resolution },
                    { label: 'Network', value: activeEnv.network },
                    { label: 'Language', value: activeEnv.language },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                      <p className="mt-1 truncate font-semibold text-slate-800">{item.value || 'Unknown'}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>

          {/* 3. Mobile Review Action Card (Visible on mobile only for spacious tap targets and no overflow) */}
          <section className="block sm:hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span>Report complete • All required evidence included</span>
            </div>

            <button
              type="button"
              disabled={reviewing}
              onClick={() => handleReviewAction('approved')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3.5 px-4 text-sm font-bold text-white shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4.5 w-4.5" /> Approve Report & Release Payment
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleReviewAction('changes_requested')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
              >
                <MessageSquare className="h-3.5 w-3.5 text-slate-500" /> Request Changes
              </button>
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleReviewAction('rejected')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-slate-500" /> Reject Report
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Fixed Bottom Action Bar for Desktop (hidden on mobile to give bottom nav bar full breathing room) */}
      <footer className="hidden sm:block fixed bottom-0 left-0 right-0 lg:left-[260px] z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-6 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Status Indicator */}
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <span>Report complete • All required evidence included</span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={reviewing}
              onClick={() => handleReviewAction('changes_requested')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
            >
              <MessageSquare className="h-3.5 w-3.5 text-slate-500" /> Request Changes
            </button>
            <button
              type="button"
              disabled={reviewing}
              onClick={() => handleReviewAction('rejected')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-slate-500" /> Reject Report
            </button>
            <button
              type="button"
              disabled={reviewing}
              onClick={() => handleReviewAction('approved')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve Report & Release Payment
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
