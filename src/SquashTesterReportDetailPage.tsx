import {
  AlertCircle,
  ArrowLeft,
  Bug,
  Calendar,
  CheckCircle2,
  ChevronDown,

  FileText,
  Monitor,

  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from './auth';
import {
  attachEvidenceToBugReport,
  getTesterSubmissionDetails,
  type DeveloperSubmissionDetails,
} from './lib/jobApi';
import { listTesterJobEvidence, uploadBugReportFile } from './lib/storageApi';
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

export default function SquashTesterReportDetailPage() {
  const { submissionId } = useParams();
  const { session } = useAuth();
  const [report, setReport] = useState<DeveloperSubmissionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadNotice, setUploadNotice] = useState('');
  const [expandedTask, setExpandedTask] = useState<number | null>(1); // expand task 2 by default
  const [taskResults, setTaskResults] = useState<TestTaskResult[]>([]);
  const [environment, setEnvironment] = useState<SessionEnvironment | null>(null);

  useEffect(() => {
    if (!session?.userId) return;
    const testerId = session.userId;
    let mounted = true;

    const loadReport = async () => {
      if (!submissionId) {
        setError('No report selected.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const details = await getTesterSubmissionDetails(submissionId, testerId);
        if (!mounted) return;
        if (details) {
          setReport(details);
          await listTesterJobEvidence(details.testerId, details.jobId);
          try {
            setTaskResults(await getTaskResultsForAssignment(details.assignmentId));
            setEnvironment(await getSessionEnvironment(details.assignmentId));
          } catch {
            setTaskResults([]);
          }
        } else {
          setError('This report could not be found.');
        }
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Could not load this report.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadReport();
    return () => {
      mounted = false;
    };
  }, [session?.userId, submissionId]);

  const handleFileUpload = async (bugId: string, file: File) => {
    if (!session?.userId) return;
    const type = file.type.startsWith('image/') ? 'screenshot' : file.type.startsWith('video/') ? 'video' : null;
    if (!type) {
      setUploadNotice('Please select an image (PNG, JPEG, WebP) or video (MP4, WebM).');
      return;
    }

    try {
      setUploadNotice('Uploading evidence...');
      if (!report?.jobId) throw new Error('This report is not linked to a job yet.');
      const upload = await uploadBugReportFile(file, type, session.userId, report.jobId);
      if (upload.error || !upload.path) throw new Error(upload.error || 'Upload failed.');
      await attachEvidenceToBugReport({ bugId, testerId: session.userId, type, path: upload.path });
      setUploadNotice('Evidence attached successfully!');
    } catch (err) {
      setUploadNotice(err instanceof Error ? err.message : 'Could not attach evidence.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-sm font-bold text-slate-800">Loading report details...</p>
      </div>
    );
  }

  const rawTitle = report?.jobTitle || 'Test Job';
  const cleanJobTitle = rawTitle.replace(/(?:'s\s*)?Test\s*Report$/i, '').trim();
  const displayTitle = `${cleanJobTitle || 'Test Job'}'s Test Report`;
  const displayTesterName = session?.name || report?.testerName || 'Unknown tester';
  const displaySubmittedAt = formatDateTime(report?.submittedAt || report?.createdAt || null);
  const displayReportId = report?.id ? `SQA-${report.id.slice(0, 4).toUpperCase()}` : 'Not available';

  // Averaged from the scores actually submitted; zero means "not scored".
  const submittedScores = Object.values(report?.scores || {}).filter((score) => score > 0);
  const displayQualityScore = submittedScores.length
    ? Math.round(submittedScores.reduce((sum, score) => sum + score, 0) / submittedScores.length)
    : null;

  const displayExecutiveSummary =
    report?.summary?.trim() || 'No written summary was added for this submission.';

  const formatTaskDuration = (seconds: number | null) => {
    if (seconds == null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Real per-task results recorded in the Test Lab.
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

  return (
    <div className="space-y-5 pb-20 sm:pb-24">
      {/* Top Banner Card (Integrated smoothly with TesterLayout) */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Title & Metadata Badges */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-3">
              <Link to="/tester/reports" className="text-slate-400 hover:text-slate-600 transition shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-white shadow-xs overflow-hidden">
                {report?.jobLogoUrl ? (
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

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-600 pl-[84px]">
              <span className="rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-0.5 text-xs font-bold capitalize text-amber-700">
                {(report?.status || 'submitted').replace('_', ' ')}
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

          {/* Quality score, averaged from the scores actually submitted */}
          <div className={`flex shrink-0 items-center gap-3 rounded-2xl px-4.5 py-2.5 shadow-sm ${
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

      {/* Notices */}
      {uploadNotice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4" /> {uploadNotice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center gap-2 shadow-2xs">
          <AlertCircle className="h-4 w-4" /> {error}
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

          {/* 3. Tester Recommendations Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-3 border-b border-slate-100 pb-2.5">
              <span className="text-amber-500 text-lg">💡</span>
              <h2>Tester Recommendations</h2>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 font-medium list-disc pl-5">
              <li>Refresh payment methods immediately after save</li>
              <li>Add a visible success confirmation</li>
              <li>Keep the entered billing details when retrying.</li>
            </ul>
          </section>
        </div>

        {/* Right Column (Bug Details & Captured Environment) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Bugs this tester filed, with per-bug evidence upload. */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-extrabold text-slate-900 sm:text-base">
              <Bug className="h-5 w-5 shrink-0 text-rose-500" />
              <h2>Bugs You Reported ({reportedBugs.length})</h2>
            </div>

            {reportedBugs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-semibold text-slate-500">
                You did not file any bugs for this submission.
              </p>
            ) : (
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {reportedBugs.map((bug, bugIndex) => (
                  <div key={bug.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        BUG-{String(bugIndex + 1).padStart(2, '0')} — {bug.title}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
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

                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                      <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
                        <Upload className="h-3 w-3" /> Attach evidence
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleFileUpload(bug.id, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {bug.screenshotPath ? (
                        <span className="text-[11px] font-semibold text-slate-500">Screenshot attached</span>
                      ) : null}
                      {bug.videoPath ? (
                        <span className="text-[11px] font-semibold text-slate-500">Video attached</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          {/* Mobile Action Card */}
          <section className="block sm:hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span>Report complete • Submitted for review</span>
            </div>

            <Link
              to="/test-lab"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3.5 px-4 text-sm font-bold text-white shadow-sm transition"
            >
              <FileText className="h-4.5 w-4.5" /> Go to Test Lab
            </Link>

            <Link
              to="/tester/reports"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-500" /> Back to My Reports
            </Link>
          </section>
        </div>
      </div>

      {/* Desktop Fixed Footer */}
      <footer className="hidden sm:block fixed bottom-0 left-0 right-0 lg:left-[260px] z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-6 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Status Indicator */}
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <span>Report complete • Submitted to developer for review</span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/tester/reports"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-500" /> Back to My Reports
            </Link>
            <Link
              to="/test-lab"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition"
            >
              <FileText className="h-4 w-4" /> Go to Test Lab
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}