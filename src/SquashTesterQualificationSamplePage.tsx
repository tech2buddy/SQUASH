import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileVideo,
  ImagePlus,
  KeyRound,
  ListOrdered,
  LockKeyhole,
  Monitor,
  Paperclip,
  Slash,
  Target,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from './auth';
import TesterApplicationProgress from './components/TesterApplicationProgress';
import { captureSessionEnvironment } from './lib/testLabApi';
import {
  getQualificationSample,
  submitQualificationSample,
  uploadQualificationEvidence,
  type QualificationEvidence,
  type QualificationSample,
  type QualificationSampleTask,
} from './lib/testerQualificationApi';

type Outcome = 'pass' | 'fail' | 'blocked' | 'not_applicable';
type Severity = 'low' | 'medium' | 'high' | 'critical';
type Reproducibility = 'always' | 'often' | 'sometimes' | 'once';

type IssueDraft = {
  bugTitle: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: Severity;
  reproducibility: Reproducibility;
  evidence: QualificationEvidence[];
  // Whether the tester has explicitly confirmed this issue is complete. Reset
  // to false on any further edit, so an edited-into-invalid state can never
  // read as "done" just because it was valid a moment ago.
  saved: boolean;
};

type TaskEntry = { outcome: Outcome; note: string; issue: IssueDraft };

function emptyIssue(defaultTitle: string): IssueDraft {
  return {
    bugTitle: defaultTitle,
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    severity: 'medium',
    reproducibility: 'always',
    evidence: [],
    saved: false,
  };
}

export default function SquashTesterQualificationSamplePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [sample, setSample] = useState<QualificationSample | null>(null);
  const [taskEntries, setTaskEntries] = useState<Record<string, TaskEntry>>({});
  const [expandedTaskIndex, setExpandedTaskIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const nextSample = await getQualificationSample();
        if (!active) return;
        setSample(nextSample);
        setSubmitted(nextSample?.attempt.status === 'sample_submitted');
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'Unable to load your practical sample.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const entryOrDefault = (task: QualificationSampleTask): TaskEntry =>
    taskEntries[task.id] || { outcome: 'pass', note: '', issue: emptyIssue(task.title) };

  const updateNote = (task: QualificationSampleTask, note: string) => {
    setTaskEntries((current) => ({ ...current, [task.id]: { ...entryOrDefault(task), note } }));
  };

  // Marking Fail or Blocked auto-seeds the bug title from the task's own
  // name -- only if the tester hasn't already typed one, so re-clicking
  // Fail/Blocked after editing the title never clobbers it.
  const setTaskOutcome = (task: QualificationSampleTask, outcome: Outcome) => {
    setTaskEntries((current) => {
      const existing = entryOrDefault(task);
      const needsTitleSeed = (outcome === 'fail' || outcome === 'blocked') && !existing.issue.bugTitle.trim();
      return {
        ...current,
        [task.id]: { ...existing, outcome, issue: needsTitleSeed ? { ...existing.issue, bugTitle: task.title } : existing.issue },
      };
    });
  };

  const updateIssue = (taskId: string, patch: Partial<Pick<IssueDraft, 'bugTitle' | 'stepsToReproduce' | 'expectedResult' | 'actualResult' | 'severity' | 'reproducibility'>>) => {
    setTaskEntries((current) => {
      const existing = current[taskId];
      if (!existing) return current;
      return { ...current, [taskId]: { ...existing, issue: { ...existing.issue, ...patch, saved: false } } };
    });
  };

  const addIssueEvidence = async (taskId: string, files: FileList | null) => {
    const testerId = session?.userId;
    const existing = taskEntries[taskId];
    if (!files || !sample || !testerId || !existing) return;
    const selected = Array.from(files).slice(0, 3 - existing.issue.evidence.length);
    if (!selected.length) return;
    setUploadingTaskId(taskId);
    setMessage('');
    try {
      const uploads = await Promise.all(selected.map((file) => uploadQualificationEvidence(file, testerId, sample.attempt.id)));
      setTaskEntries((current) => {
        const currentEntry = current[taskId];
        if (!currentEntry) return current;
        return { ...current, [taskId]: { ...currentEntry, issue: { ...currentEntry.issue, evidence: [...currentEntry.issue.evidence, ...uploads].slice(0, 3), saved: false } } };
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not upload your evidence.');
    } finally {
      setUploadingTaskId(null);
      const input = fileInputRefs.current[taskId];
      if (input) input.value = '';
    }
  };

  const removeIssueEvidence = (taskId: string, path: string) => {
    setTaskEntries((current) => {
      const existing = current[taskId];
      if (!existing) return current;
      return { ...current, [taskId]: { ...existing, issue: { ...existing.issue, evidence: existing.issue.evidence.filter((item) => item.path !== path), saved: false } } };
    });
  };

  // A task counts as done differently depending on its outcome: a pass or
  // N/A just needs a short observation, but a fail or blocked needs its
  // structured issue explicitly saved -- filling the fields isn't enough on
  // its own, the tester has to confirm it via Save.
  const isTaskDone = (task: QualificationSampleTask) => {
    const entry = taskEntries[task.id];
    if (!entry) return false;
    if (entry.outcome === 'fail' || entry.outcome === 'blocked') return entry.issue.saved;
    return Boolean(entry.note.trim());
  };

  const saveIssue = (task: QualificationSampleTask, index: number) => {
    const entry = taskEntries[task.id];
    if (!entry) return;
    const issue = entry.issue;
    if (issue.bugTitle.trim().length < 8 || issue.stepsToReproduce.trim().length < 20 || issue.expectedResult.trim().length < 10 || issue.actualResult.trim().length < 10) {
      setMessage(`Task "${task.title}": fill in a clear bug title, steps to reproduce, and the expected vs. actual result before saving.`);
      return;
    }
    if (!issue.evidence.length) {
      setMessage(`Task "${task.title}": attach at least one screenshot or short video before saving this issue.`);
      return;
    }
    setMessage('');
    setTaskEntries((current) => {
      const existing = current[task.id];
      if (!existing) return current;
      return { ...current, [task.id]: { ...existing, issue: { ...existing.issue, saved: true } } };
    });
    // "...then they save that before going to Task 2": advance to the next
    // task automatically rather than leaving this one expanded.
    const nextTask = sample?.scenario.tasks[index + 1];
    setExpandedTaskIndex(nextTask ? index + 1 : -1);
  };

  const submit = async () => {
    if (!sample) return;
    const missingTask = sample.scenario.tasks.find((task) => !isTaskDone(task));
    if (missingTask) {
      setMessage(`Finish "${missingTask.title}" before submitting -- record an outcome and note, or save its issue report if you marked it Fail or Blocked.`);
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const issueReports = sample.scenario.tasks
        .filter((task) => {
          const entry = taskEntries[task.id];
          return entry && (entry.outcome === 'fail' || entry.outcome === 'blocked');
        })
        .map((task) => {
          const issue = taskEntries[task.id].issue;
          return {
            taskId: task.id,
            bugTitle: issue.bugTitle.trim(),
            stepsToReproduce: issue.stepsToReproduce.trim(),
            expectedResult: issue.expectedResult.trim(),
            actualResult: issue.actualResult.trim(),
            severity: issue.severity,
            reproducibility: issue.reproducibility,
            evidencePaths: issue.evidence.map((item) => item.path),
          };
        });
      await submitQualificationSample({
        attemptId: sample.attempt.id,
        taskOutcomes: sample.scenario.tasks.map((task) => ({ taskId: task.id, outcome: taskEntries[task.id].outcome, note: taskEntries[task.id].note.trim() })),
        issueReports,
        testerNotes: notes,
        environment: captureSessionEnvironment(),
      });
      setSubmitted(true);
      navigate('/tester-qualification', { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit your practical sample.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Preparing your controlled SQUASH Lab sample...</div>;
  if (!sample) return <div className="mx-auto max-w-3xl rounded-[30px] border border-amber-200 bg-amber-50 p-8 text-center shadow-sm"><AlertCircle className="mx-auto h-8 w-8 text-amber-700" /><h1 className="mt-3 text-2xl font-black text-slate-950">Your practical sample is not ready yet</h1><p className="mt-2 text-sm text-slate-600">Pass the QA foundations quiz first, then return here to start your controlled sample test.</p><Link to="/tester-qualification" className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Back to Tester Academy</Link></div>;
  if (submitted) return <Navigate to="/tester-qualification" replace />;

  const doneCount = sample.scenario.tasks.filter((task) => isTaskDone(task)).length;

  return <div className="space-y-4"><TesterApplicationProgress current={3} />

    {/* Top Banner Card — matches the real Test Lab banner (SquashActiveTestScreen) */}
    <section className="apple-bento-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link to="/tester-qualification" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-500 font-bold text-white shadow-xs">
            {sample.scenario.logoUrl ? (
              <img src={sample.scenario.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-black tracking-tight">{sample.scenario.productName.slice(0, 1)}</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 truncate sm:text-lg">{sample.scenario.productName}</h1>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-500">
              <span className="font-semibold text-slate-700">Attempt {sample.attempt.attemptNumber} of 2</span>
              <span className="text-slate-300">|</span>
              <span>Quiz {sample.attempt.quizScore}/{sample.attempt.quizTotal}</span>
            </div>
          </div>
        </div>
        {sample.scenario.appUrl ? (
          <a
            href={sample.scenario.appUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-emerald-700"
          >
            <ExternalLink className="h-4 w-4" /> Open the app
          </a>
        ) : null}
      </div>
    </section>

    {sample.scenario.accessInstructions ? (
      <section className="apple-bento-card p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
          <KeyRound className="h-4 w-4 text-slate-500" />
          <h2>How to get in</h2>
        </div>
        <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-slate-700">{sample.scenario.accessInstructions}</p>
      </section>
    ) : null}

    {message ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{message}</div> : null}

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
      <div className="lg:col-span-7 space-y-4">
        {/* Developer Brief */}
        <section className="apple-bento-card p-4 sm:p-5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-4 border-b border-slate-100 pb-2.5">
            <Target className="h-4 w-4 text-slate-500" />
            <h2>Developer Brief</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 flex items-center gap-1.5 mb-1.5"><Target className="h-3.5 w-3.5 text-rose-500" /> Objective</span>
              <p className="text-slate-800 leading-relaxed font-semibold">{sample.scenario.objective}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between">
              <span className="font-bold text-slate-500 flex items-center gap-1.5 mb-1.5"><Monitor className="h-3.5 w-3.5 text-indigo-500" /> Environment</span>
              <p className="text-slate-800 font-semibold leading-relaxed">{sample.scenario.environment}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex flex-col justify-between sm:col-span-2">
              <span className="font-bold text-slate-500 flex items-center gap-1.5 mb-1.5"><Ban className="h-3.5 w-3.5 text-amber-500" /> Out of scope</span>
              <p className="text-slate-700 font-medium leading-relaxed">{sample.scenario.outOfScope}</p>
            </div>
          </div>
        </section>

        {/* Test Tasks accordion. Each task carries its own PASS/FAIL/BLOCKED/N/A
            outcome; a Fail or Blocked task opens a structured issue form
            (auto-titled from the task name) with its own evidence upload,
            which must be explicitly saved before the tester can move on. */}
        <section className="apple-bento-card p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <ListOrdered className="h-4 w-4 text-slate-600" />
              <h2>Test Tasks</h2>
              <span className="text-slate-300 font-normal">—</span>
              <span className="text-xs font-semibold text-slate-500">{doneCount} of {sample.scenario.tasks.length} done</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {sample.scenario.tasks.map((task, index) => {
              const entry = taskEntries[task.id];
              const isExpanded = expandedTaskIndex === index;
              const done = isTaskDone(task);
              const isIssueMode = entry?.outcome === 'fail' || entry?.outcome === 'blocked';
              return (
                <div key={task.id} className={`rounded-xl border transition-all ${isExpanded ? 'border-blue-200 bg-white shadow-xs' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
                  <button type="button" onClick={() => setExpandedTaskIndex(isExpanded ? -1 : index)} className="flex w-full items-center gap-2.5 p-3 text-left">
                    <span className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-emerald-500 text-white' : isExpanded ? 'border-2 border-blue-500 text-blue-600 font-extrabold' : 'border border-slate-300 bg-white text-slate-600'}`}>
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-xs font-bold text-slate-800 uppercase tracking-tight">{task.title}</span>
                    <div className="flex items-center gap-2">
                      {done ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60"><CheckCircle2 className="h-3 w-3" /> Done</span>
                      ) : isIssueMode ? (
                        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-200">Needs saving</span>
                      ) : isExpanded ? (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600">In progress</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">Pending</span>
                      )}
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-slate-600' : ''}`} />
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-slate-100 p-3.5 space-y-3 bg-white rounded-b-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div>
                          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Instruction</h3>
                          <p className="text-xs leading-relaxed text-slate-700 font-medium">{task.instruction}</p>
                        </div>
                        <div className="border-t border-slate-100 pt-3 md:border-t-0 md:border-l md:border-slate-100 md:pl-4 md:pt-0">
                          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Expected result</h3>
                          <p className="text-xs leading-relaxed text-slate-700 font-medium">{task.expectedResult}</p>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
                        <button type="button" onClick={() => setTaskOutcome(task, 'pass')} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${entry?.outcome === 'pass' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20' : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50/50'}`}><CheckCircle2 className="h-3.5 w-3.5" /> PASS</button>
                        <button type="button" onClick={() => setTaskOutcome(task, 'fail')} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${entry?.outcome === 'fail' ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20' : 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50/50'}`}><XCircle className="h-3.5 w-3.5 text-rose-500" /> FAIL</button>
                        <button type="button" onClick={() => setTaskOutcome(task, 'blocked')} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${entry?.outcome === 'blocked' ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20' : 'border-amber-200 bg-white text-amber-600 hover:bg-amber-50/50'}`}><Slash className="h-3.5 w-3.5 text-amber-500" /> BLOCKED</button>
                        <button type="button" onClick={() => setTaskOutcome(task, 'not_applicable')} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${entry?.outcome === 'not_applicable' ? 'border-slate-500 bg-slate-100 text-slate-700 ring-2 ring-slate-400/20' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>N/A</button>
                      </div>

                      {isIssueMode && entry ? (
                        <div className="space-y-2.5 rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                            <Bug className="h-3.5 w-3.5" /> Structured issue for this task
                            {entry.issue.saved ? <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200"><CheckCircle2 className="h-3 w-3" /> Saved</span> : null}
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Bug title <span className="text-rose-500">*</span></label>
                            <input value={entry.issue.bugTitle} onChange={(event) => updateIssue(task.id, { bugTitle: event.target.value })} placeholder="Short, clear summary of the issue" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Steps to reproduce <span className="text-rose-500">*</span></label>
                            <textarea rows={2} value={entry.issue.stepsToReproduce} onChange={(event) => updateIssue(task.id, { stepsToReproduce: event.target.value })} placeholder="List the exact steps you took for this task." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Expected result <span className="text-rose-500">*</span></label>
                              <textarea rows={2} value={entry.issue.expectedResult} onChange={(event) => updateIssue(task.id, { expectedResult: event.target.value })} placeholder="What should have happened?" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Actual result <span className="text-rose-500">*</span></label>
                              <textarea rows={2} value={entry.issue.actualResult} onChange={(event) => updateIssue(task.id, { actualResult: event.target.value })} placeholder="What actually happened?" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Severity</label>
                              <select value={entry.issue.severity} onChange={(event) => updateIssue(task.id, { severity: event.target.value as Severity })} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500">
                                <option value="critical">🔴 Critical</option>
                                <option value="high">🟠 High</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="low">🟢 Low</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Reproducibility</label>
                              <select value={entry.issue.reproducibility} onChange={(event) => updateIssue(task.id, { reproducibility: event.target.value as Reproducibility })} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500">
                                <option value="always">Always</option>
                                <option value="often">Often</option>
                                <option value="sometimes">Sometimes</option>
                                <option value="once">Once</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700">Evidence <span className="text-rose-500">*</span></label>
                              <span className="text-[10px] font-semibold text-slate-400">{entry.issue.evidence.length} / 3</span>
                            </div>
                            <input
                              ref={(el) => { fileInputRefs.current[task.id] = el; }}
                              onChange={(event) => void addIssueEvidence(task.id, event.target.files)}
                              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                              multiple
                              type="file"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[task.id]?.click()}
                              disabled={uploadingTaskId === task.id || entry.issue.evidence.length >= 3}
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                            >
                              <Paperclip className="h-3.5 w-3.5" /> {uploadingTaskId === task.id ? 'Uploading and scanning...' : 'Attach screenshot or video for this issue'}
                            </button>
                            {entry.issue.evidence.length ? (
                              <div className="mt-2 space-y-1.5">
                                {entry.issue.evidence.map((item) => (
                                  <div key={item.path} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">
                                    <span className="flex min-w-0 items-center gap-2 truncate font-semibold text-slate-700">
                                      {item.type === 'video' ? <FileVideo className="h-4 w-4 shrink-0 text-rose-600" /> : <ImagePlus className="h-4 w-4 shrink-0 text-blue-600" />}
                                      {item.name}
                                    </span>
                                    <button type="button" onClick={() => removeIssueEvidence(task.id, item.path)} className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100">Remove</button>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            <div className="mt-2 flex items-start gap-1.5 text-[10px] leading-4 text-slate-400"><LockKeyhole className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />Private, malware-scanned, visible only to you and authorised SQUASH reviewers.</div>
                          </div>

                          <button type="button" onClick={() => saveIssue(task, index)} className="w-full rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 transition">
                            {entry.issue.saved ? 'Update saved issue' : 'Save issue and continue'}
                          </button>
                        </div>
                      ) : (
                        <textarea value={entry?.note || ''} onChange={(event) => updateNote(task, event.target.value)} placeholder="What did you observe? Be specific." rows={2} className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="lg:col-span-5 space-y-4">
        {/* Every Fail/Blocked task now carries its own structured issue and
            evidence, saved inline within its own accordion panel above. This
            column is just the submission-wide wrap-up: optional overall
            notes, and the final Submit action. */}
        <section className="apple-bento-card p-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2.5 border-b border-slate-100 pb-2"><Bug className="h-4 w-4 text-slate-500" /><h2>Overall Summary</h2></div>
          <p className="mb-2.5 text-[11px] leading-5 text-slate-500">
            Each task you marked Fail or Blocked has its own saved issue report above -- this creates one structured, per-task record instead of a single mixed report. Use the field below only for anything that doesn't belong to a specific task.
          </p>
          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Additional notes <span className="font-medium text-slate-400">(optional)</span></label>
          <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything else a reviewer should know?" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
        </section>

        <section className="apple-bento-card p-4 space-y-2.5">
          <p className="text-xs leading-5 text-slate-500">A reviewer will assess clarity, reproducibility, evidence and honesty — not whether you guessed a hidden answer.</p>
          <button type="button" onClick={() => void submit()} disabled={submitting || uploadingTaskId !== null} className="squash-btn-primary w-full">
            {submitting ? 'Submitting for Review...' : 'Submit Practical Sample'} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </section>
      </div>
    </div>
  </div>;
}
