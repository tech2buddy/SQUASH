import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Bug,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileVideo,
  ImagePlus,
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
} from './lib/testerQualificationApi';

type Outcome = 'pass' | 'fail' | 'blocked' | 'not_applicable';
type TaskEntry = { outcome: Outcome; note: string };

export default function SquashTesterQualificationSamplePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [sample, setSample] = useState<QualificationSample | null>(null);
  const [taskEntries, setTaskEntries] = useState<Record<string, TaskEntry>>({});
  const [expandedTaskIndex, setExpandedTaskIndex] = useState(0);
  const [evidence, setEvidence] = useState<QualificationEvidence[]>([]);
  const [bugTitle, setBugTitle] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [reproducibility, setReproducibility] = useState<'always' | 'often' | 'sometimes' | 'once'>('always');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement | null>(null);

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

  const updateTask = (taskId: string, patch: Partial<TaskEntry>) => setTaskEntries((current) => ({ ...current, [taskId]: { outcome: current[taskId]?.outcome || 'pass', note: current[taskId]?.note || '', ...patch } }));

  const addEvidence = async (files: FileList | null) => {
    const testerId = session?.userId;
    if (!files || !sample || !testerId) return;
    const selected = Array.from(files).slice(0, 3 - evidence.length);
    if (!selected.length) return;
    setUploading(true);
    setMessage('');
    try {
      const uploads = await Promise.all(selected.map((file) => uploadQualificationEvidence(file, testerId, sample.attempt.id)));
      setEvidence((current) => [...current, ...uploads].slice(0, 3));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not upload your evidence.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const submit = async () => {
    if (!sample) return;
    if (sample.scenario.tasks.some((task) => !taskEntries[task.id]?.note.trim())) {
      setMessage('Record an outcome and short observation for every task.');
      return;
    }
    if (!evidence.length) {
      setMessage('Attach at least one screenshot or short video that supports your report.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await submitQualificationSample({
        attemptId: sample.attempt.id,
        taskOutcomes: sample.scenario.tasks.map((task) => ({ taskId: task.id, outcome: taskEntries[task.id].outcome, note: taskEntries[task.id].note.trim() })),
        bugTitle,
        stepsToReproduce: steps,
        expectedResult: expected,
        actualResult: actual,
        severity,
        reproducibility,
        testerNotes: notes,
        environment: captureSessionEnvironment(),
        evidencePaths: evidence.map((item) => item.path),
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

  const notedCount = Object.values(taskEntries).filter((entry) => entry.note.trim()).length;

  return <div className="space-y-4"><TesterApplicationProgress current={3} />

    {/* Top Banner Card — matches the real Test Lab banner (SquashActiveTestScreen) */}
    <section className="apple-bento-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link to="/tester-qualification" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-white shadow-xs">
            <span className="text-sm font-black tracking-tight">{sample.scenario.productName.slice(0, 1)}</span>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 truncate sm:text-lg">{sample.scenario.productName}</h1>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-500">
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-100">Training scenario · no real payment or booking</span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-700">Attempt {sample.attempt.attemptNumber} of 2</span>
              <span className="text-slate-300">|</span>
              <span>Quiz {sample.attempt.quizScore}/{sample.attempt.quizTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

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

        {/* Test Tasks accordion */}
        <section className="apple-bento-card p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <ListOrdered className="h-4 w-4 text-slate-600" />
              <h2>Test Tasks</h2>
              <span className="text-slate-300 font-normal">—</span>
              <span className="text-xs font-semibold text-slate-500">{notedCount} of {sample.scenario.tasks.length} noted</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {sample.scenario.tasks.map((task, index) => {
              const entry = taskEntries[task.id];
              const isExpanded = expandedTaskIndex === index;
              const done = Boolean(entry?.note.trim());
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
                        <button type="button" onClick={() => updateTask(task.id, { outcome: 'pass' })} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${entry?.outcome === 'pass' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20' : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50/50'}`}><CheckCircle2 className="h-3.5 w-3.5" /> PASS</button>
                        <button type="button" onClick={() => updateTask(task.id, { outcome: 'fail' })} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${entry?.outcome === 'fail' ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20' : 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50/50'}`}><XCircle className="h-3.5 w-3.5 text-rose-500" /> FAIL</button>
                        <button type="button" onClick={() => updateTask(task.id, { outcome: 'blocked' })} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${entry?.outcome === 'blocked' ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20' : 'border-amber-200 bg-white text-amber-600 hover:bg-amber-50/50'}`}><Slash className="h-3.5 w-3.5 text-amber-500" /> BLOCKED</button>
                        <button type="button" onClick={() => updateTask(task.id, { outcome: 'not_applicable' })} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold transition-all ${entry?.outcome === 'not_applicable' ? 'border-slate-500 bg-slate-100 text-slate-700 ring-2 ring-slate-400/20' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>N/A</button>
                      </div>

                      <textarea value={entry?.note || ''} onChange={(event) => updateTask(task.id, { note: event.target.value })} placeholder="What did you observe? Be specific." rows={2} className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="lg:col-span-5 space-y-4">
        {/* Evidence */}
        <section className="apple-bento-card p-4">
          <div className="flex items-center justify-between mb-2.5 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm"><Camera className="h-4 w-4 text-blue-600" /><h2>Evidence</h2></div>
            <span className="text-[11px] font-semibold text-slate-400">{evidence.length} / 3 uploaded</span>
          </div>
          <input ref={fileInput} onChange={(event) => void addEvidence(event.target.files)} accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" multiple type="file" className="hidden" />
          <div onClick={() => fileInput.current?.click()} className="cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center transition hover:border-emerald-400 hover:bg-emerald-50/20">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs text-slate-400 mb-1.5"><Camera className="h-4 w-4 text-emerald-600" /></div>
            <p className="text-xs font-bold text-slate-800">{uploading ? 'Uploading and scanning...' : 'Click to upload screenshot or evidence'}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Supports PNG, JPG, WEBP, MP4</p>
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2">
            <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading || evidence.length >= 3} className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"><Paperclip className="h-3.5 w-3.5 text-slate-500" /> Attach file</button>
          </div>
          {evidence.length ? <div className="mt-2.5 space-y-2">{evidence.map((item) => <div key={item.path} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"><span className="flex min-w-0 items-center gap-2 truncate font-semibold text-slate-700">{item.type === 'video' ? <FileVideo className="h-4 w-4 shrink-0 text-rose-600" /> : <ImagePlus className="h-4 w-4 shrink-0 text-blue-600" />}{item.name}</span><button type="button" onClick={() => setEvidence((current) => current.filter((candidate) => candidate.path !== item.path))} className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100">Remove</button></div>)}</div> : null}
          <div className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-slate-500"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />Files are private, scanned for malware and visible only to you and authorised SQUASH reviewers.</div>
        </section>

        {/* Report a Bug */}
        <section className="apple-bento-card p-4">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-sm mb-3 border-b border-slate-100 pb-2"><Bug className="h-4 w-4" /><h2 className="text-slate-900">Structured Issue Report</h2></div>
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Bug title <span className="text-rose-500">*</span></label>
              <input value={bugTitle} onChange={(event) => setBugTitle(event.target.value)} placeholder="Short, clear summary of the issue" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Steps to reproduce <span className="text-rose-500">*</span></label>
              <textarea rows={2} value={steps} onChange={(event) => setSteps(event.target.value)} placeholder="List the exact steps you took in the controlled sample." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Expected result <span className="text-rose-500">*</span></label>
                <textarea rows={2} value={expected} onChange={(event) => setExpected(event.target.value)} placeholder="What should have happened?" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Actual result <span className="text-rose-500">*</span></label>
                <textarea rows={2} value={actual} onChange={(event) => setActual(event.target.value)} placeholder="What actually happened?" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Severity</label>
                <select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500">
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Reproducibility</label>
                <select value={reproducibility} onChange={(event) => setReproducibility(event.target.value as typeof reproducibility)} className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500">
                  <option value="always">Always</option>
                  <option value="often">Often</option>
                  <option value="sometimes">Sometimes</option>
                  <option value="once">Once</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Additional notes <span className="font-medium text-slate-400">(optional)</span></label>
              <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything else a reviewer should know?" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
            </div>
            <p className="text-xs leading-5 text-slate-500">A reviewer will assess clarity, reproducibility, evidence and honesty — not whether you guessed a hidden answer.</p>
            <button type="button" onClick={() => void submit()} disabled={submitting || uploading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition shadow-xs disabled:opacity-60">
              {submitting ? 'Submitting for Review...' : 'Submit Practical Sample'} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>;
}
