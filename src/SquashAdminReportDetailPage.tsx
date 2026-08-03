import {
  ArrowLeft,
  Bug,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  ExternalLink,
  FileText,
  Home,
  LockKeyhole,
  Monitor,
  ShieldCheck,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';

import { useAuth } from './auth';
import { getSubmissionDetails, type DeveloperSubmissionDetails } from './lib/jobApi';
import { listTesterJobEvidence, type TesterJobEvidence } from './lib/storageApi';
import {
  captureSessionEnvironment,
  getSessionEnvironment,
  getTaskResultsForAssignment,
  type SessionEnvironment,
  type TestTaskResult,
} from './lib/testLabApi';

function formatDateTime(value: string | null) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-ZA', {
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

function statusTone(status: DeveloperSubmissionDetails['status']) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-100 border-emerald-200';
  if (status === 'submitted') return 'bg-amber-50 text-amber-700 ring-amber-100 border-amber-200';
  if (status === 'changes_requested') return 'bg-sky-50 text-sky-700 ring-sky-100 border-sky-200';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700 ring-rose-100 border-rose-200';
  return 'bg-slate-100 text-slate-700 ring-slate-200 border-slate-200';
}

export default function SquashAdminReportDetailPage() {
  const { submissionId } = useParams();
  const { session } = useAuth();
  const [report, setReport] = useState<DeveloperSubmissionDetails | null>(null);
  const [evidence, setEvidence] = useState<TesterJobEvidence[]>([]);
  const [taskResults, setTaskResults] = useState<TestTaskResult[]>([]);
  const [environment, setEnvironment] = useState<SessionEnvironment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTask, setExpandedTask] = useState<number | null>(1);
  const adminName = session?.name || 'Owner Admin';

  useEffect(() => {
    if (!submissionId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const details = await getSubmissionDetails(submissionId);
        if (!mounted) return;
        if (!details) {
          setError('This report could not be found.');
          return;
        }
        setReport(details);
        setEvidence(await listTesterJobEvidence(details.testerId, details.jobId));
        try {
          setTaskResults(await getTaskResultsForAssignment(details.assignmentId));
          setEnvironment(await getSessionEnvironment(details.assignmentId));
        } catch {
          setTaskResults([]);
        }
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Could not load this report.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [submissionId]);

  const displayQualityScore = useMemo(() => {
    if (!report) return null;
    const values = Object.values(report.scores).filter((value) => value > 0);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  }, [report]);

  const rawTitle = report?.jobTitle || 'Test Job';
  const cleanJobTitle = rawTitle.replace(/(?:'s\s*)?Test\s*Report$/i, '').trim();
  const displayTitle = `${cleanJobTitle || 'Test Job'}'s Test Report`;
  const displayTesterName = report?.testerName || 'Unknown tester';
  const displaySubmittedAt = formatDateTime(report?.submittedAt || report?.createdAt || null);
  const displayReportId = report?.id ? `SQA-${report.id.slice(0, 4).toUpperCase()}` : 'Not available';

  const formatTaskDuration = (seconds: number | null) => {
    if (seconds == null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const taskResultsList = taskResults.map((result, index) => ({
    id: index + 1,
    title: result.title,
    status: result.status === 'completed' ? 'pass' : result.status === 'skipped' ? 'fail' : 'pending',
    duration: formatTaskDuration(result.durationSeconds),
    difficulty: result.difficultyRating,
    emotion: result.emotionRating,
    flagged: result.emotionRating === 'Confusing' || result.emotionRating === 'Frustrating',
  }));

  const reportedBugs = report?.bugs ?? [];

  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home },
    { label: 'Payout Queue', href: '/A31/payouts', icon: CreditCard },
    { label: 'Users', href: '/A31/users', icon: Users },
    { label: 'Jobs', href: '/A31/jobs', icon: FileText },
    { label: 'Reports', href: '/A31/reports', icon: FileText },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole },
    { label: 'Operations', href: '/A31/operations', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <img src="/squash-logo.png" alt="SQUASH logo" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm" />
            <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">SQUASH</a>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.label === 'Reports';
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <a
                href="/A31/reports"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to reports
              </a>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-xs">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-bold">{adminName}</div>
                  <div className="text-xs text-slate-500">Admin</div>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6">
            {loading ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mb-3" />
                <p className="text-sm font-bold text-slate-800">Loading admin report oversight...</p>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm font-semibold text-rose-700 shadow-2xs">
                {error}
              </div>
            ) : null}

            {!loading && !error && report ? (
              <div className="space-y-6">
                {/* Top Banner Card */}
                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Title & Metadata Badges */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-white shadow-xs overflow-hidden">
                          {report.jobLogoUrl ? (
                            <img src={report.jobLogoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm font-black tracking-tight">
                              {(cleanJobTitle || 'B').slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl truncate">
                          {displayTitle}
                        </h1>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-600 pl-[52px]">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize border ${statusTone(report.status)}`}>
                          {report.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>Tester: <strong className="text-slate-800">{displayTesterName}</strong> ({report.testerEmail})</span>
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

                    {/* Quality score card */}
                    <div className={`flex shrink-0 items-center gap-3 rounded-2xl px-4.5 py-2.5 shadow-xs ${
                      displayQualityScore == null ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 text-white'
                    }`}>
                      <ShieldCheck className={`h-6 w-6 ${displayQualityScore == null ? 'text-slate-400' : 'text-emerald-100'}`} />
                      <div className="text-left">
                        <p className={`mb-0.5 text-[10px] font-bold uppercase leading-none tracking-wider ${
                          displayQualityScore == null ? 'text-slate-500' : 'text-emerald-100'
                        }`}>Quality score</p>
                        <p className="text-xl font-black leading-none">
                          {displayQualityScore == null ? 'Not scored' : `${displayQualityScore}%`}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Metric Summary Cards Row (4 Cards Across, Fully Dynamic) */}
                <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[
                    { value: taskResultsList.length, label: 'Tasks Tested', icon: FileText, tone: 'bg-blue-50 text-blue-600 border-blue-100' },
                    { value: taskResultsList.filter((t) => t.status === 'pass').length, label: 'Passed', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                    { value: taskResultsList.filter((t) => t.status === 'fail').length, label: 'Failed', icon: XCircle, tone: 'bg-rose-50 text-rose-600 border-rose-100' },
                    { value: reportedBugs.length, label: 'Bugs Found', icon: Bug, tone: 'bg-amber-50 text-amber-600 border-amber-100' },
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

                {/* Main Content Layout */}
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  {/* Left Main Column */}
                  <div className="space-y-6 min-w-0">
                    {/* Executive Summary */}
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        Executive Summary
                      </h2>
                      <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line font-medium">
                        {report.summary?.trim() || 'No written summary was added for this submission.'}
                      </p>
                    </section>

                    {/* Task Results Accordion */}
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Task Results ({taskResultsList.length})
                        </h2>
                      </div>

                      <div className="space-y-2.5">
                        {taskResultsList.map((task) => {
                          const isExpanded = expandedTask === task.id;
                          return (
                            <div
                              key={task.id}
                              className={`rounded-xl border transition-all ${
                                task.status === 'pass'
                                  ? 'border-emerald-200/80 bg-emerald-50/30'
                                  : task.status === 'fail'
                                    ? 'border-rose-200/80 bg-rose-50/30'
                                    : 'border-slate-200 bg-white'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                                className="flex w-full items-center justify-between p-3.5 text-left transition"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                      task.status === 'pass'
                                        ? 'border border-emerald-400 bg-emerald-50 text-emerald-700'
                                        : 'border border-rose-400 bg-rose-50 text-rose-700 font-black'
                                    }`}
                                  >
                                    {task.id}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 text-xs">{task.title}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider ${
                                      task.status === 'pass'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-rose-100 text-rose-700'
                                    }`}
                                  >
                                    {task.status.toUpperCase()}
                                  </span>
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
                  </div>

                  {/* Right Sidebar Column */}
                  <div className="space-y-6 min-w-0">
                    {/* Reported Bugs List */}
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Bug className="h-4 w-4 text-rose-500" />
                        Bugs Reported ({reportedBugs.length})
                      </h2>

                      {reportedBugs.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200/80 p-6 text-center text-xs font-semibold text-slate-500">
                          No bugs were reported for this session.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reportedBugs.map((bug, index) => (
                            <div key={bug.id || index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-extrabold text-slate-900 text-xs leading-snug">
                                  {bug.title}
                                </h3>
                                <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 shrink-0">
                                  {bug.severity}
                                </span>
                              </div>

                              {bug.description ? (
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                  {bug.description}
                                </p>
                              ) : null}

                              {bug.reproductionSteps.length > 0 ? (
                                <div className="space-y-1 pt-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Steps:</span>
                                  <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-0.5">
                                    {bug.reproductionSteps.map((step, sIdx) => (
                                      <li key={sIdx}>{step}</li>
                                    ))}
                                  </ol>
                                </div>
                              ) : null}

                              {bug.screenshotPath || bug.videoPath ? (
                                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                                  <Camera className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-[11px] font-bold text-slate-600">Attached evidence file</span>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Stored Evidence Media */}
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Camera className="h-4 w-4 text-slate-400" />
                          Evidence Media ({evidence.length})
                        </h2>
                      </div>

                      {evidence.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200/80 p-5 text-center text-xs font-semibold text-slate-500">
                          No stored media files.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {evidence.map((item) => (
                            <figure key={item.path} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
                              {item.type === 'screenshot' ? (
                                <a href={item.url} target="_blank" rel="noreferrer">
                                  <img src={item.url} alt="Report evidence" className="h-48 w-full object-contain" />
                                </a>
                              ) : (
                                <video controls preload="metadata" src={item.url} className="h-48 w-full object-contain" />
                              )}
                              <figcaption className="flex items-center justify-between bg-white px-3 py-2 text-xs font-semibold text-slate-700 border-t border-slate-200">
                                <span className="inline-flex items-center gap-1.5">
                                  {item.type === 'screenshot' ? <Camera className="h-3.5 w-3.5 text-slate-500" /> : <Video className="h-3.5 w-3.5 text-slate-500" />}
                                  {item.type === 'screenshot' ? 'Screenshot' : 'Video Recording'}
                                </span>
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-bold text-[11px]">
                                  Open <ExternalLink className="h-3 w-3" />
                                </a>
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Captured Environment Specs */}
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-slate-400" />
                        Captured Environment
                      </h2>

                      {(() => {
                        const activeEnv = environment || captureSessionEnvironment();
                        return (
                          <div className="grid grid-cols-2 gap-3 text-xs">
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
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}