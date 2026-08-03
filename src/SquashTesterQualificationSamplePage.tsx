import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  CircleDot,
  FileVideo,
  ImagePlus,
  LockKeyhole,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from './auth';
import TesterApplicationProgress from './components/TesterApplicationProgress';
import { getDeviceMetadata, getWorkflowConfig, TestBriefPanel, TestSessionHeader, type ActiveTest, type DeviceMetadata } from './components/testLab';
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

const outcomeLabels: Array<{ value: Outcome; label: string; tone: string }> = [
  { value: 'pass', label: 'Pass', tone: 'border-green-300 bg-green-50 text-green-700' },
  { value: 'fail', label: 'Fail', tone: 'border-rose-300 bg-rose-50 text-rose-700' },
  { value: 'blocked', label: 'Blocked', tone: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'not_applicable', label: 'N/A', tone: 'border-slate-300 bg-slate-50 text-slate-700' },
];

function scenarioAsActiveTest(sample: QualificationSample): ActiveTest {
  return {
    id: sample.attempt.id,
    productName: sample.scenario.productName,
    category: 'Tester Academy',
    platform: 'Web',
    testType: 'custom',
    objective: sample.scenario.objective,
    productDescription: sample.scenario.objective,
    targetScenario: sample.scenario.environment,
    focusAreas: ['Structured bug reports', 'Clear reproduction steps'],
    restrictions: [sample.scenario.outOfScope],
    requirements: [],
    reward: 0,
    estimatedMinutes: 20,
    recordingRequired: false,
    tasks: sample.scenario.tasks.map((task, index) => ({
      id: task.id,
      order: index + 1,
      title: task.title,
      instructions: task.instruction,
      expectedOutcome: task.expectedResult,
      required: true,
      status: 'not_started',
    })),
  };
}

export default function SquashTesterQualificationSamplePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [sample, setSample] = useState<QualificationSample | null>(null);
  const [taskEntries, setTaskEntries] = useState<Record<string, TaskEntry>>({});
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
  const device: DeviceMetadata = useMemo(() => getDeviceMetadata(), []);

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

  const activeTest = scenarioAsActiveTest(sample);
  const workflow = getWorkflowConfig('custom');

  return <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6"><TesterApplicationProgress current={3} />
    <div className="flex items-start gap-4"><Link to="/tester-qualification" className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300"><ArrowLeft className="h-4 w-4" /></Link>
      <div className="min-w-0 flex-1">
        <TestSessionHeader
          test={activeTest}
          workflow={workflow}
          remainingTime="No time limit"
          isRecording={false}
          saveStatus={`Attempt ${sample.attempt.attemptNumber} of 2`}
          onExit={() => navigate('/tester-qualification')}
          rewardLabel="Training scenario"
        />
      </div>
    </div>

    {message ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{message}</div> : null}

    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900">Test tasks</h2>
              <p className="mt-1 text-sm text-slate-500">Record what you actually observed for every task.</p>
            </div>
            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{Object.values(taskEntries).filter((entry) => entry.note.trim()).length}/{sample.scenario.tasks.length} noted</span>
          </div>
          <div className="mt-5 space-y-3">
            {sample.scenario.tasks.map((task, index) => {
              const entry = taskEntries[task.id];
              return <article key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-green-700 shadow-sm">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900">{task.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{task.instruction}</p>
                    <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs leading-5 text-slate-700"><strong>Expected:</strong> {task.expectedResult}</div>
                    <div className="mt-3 flex flex-wrap gap-2">{outcomeLabels.map((option) => <button key={option.value} type="button" onClick={() => updateTask(task.id, { outcome: option.value })} className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold ${entry?.outcome === option.value ? option.tone : 'border-slate-200 bg-white text-slate-500'}`}>{option.label}</button>)}</div>
                    <textarea value={entry?.note || ''} onChange={(event) => updateTask(task.id, { note: event.target.value })} placeholder="What did you observe? Be specific." rows={2} className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-green-500" />
                  </div>
                </div>
              </article>;
            })}
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <TestBriefPanel test={activeTest} progress={Math.round((Object.values(taskEntries).filter((entry) => entry.note.trim()).length / sample.scenario.tasks.length) * 100)} device={device} isRecording={false} />

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2 font-black text-slate-900"><Upload className="h-4 w-4 text-blue-600" /> Evidence</div><span className="text-xs font-bold text-slate-500">{evidence.length}/3 uploaded</span></div>
          <p className="mt-2 text-sm text-slate-500">Attach at least one screenshot or short video that supports the issue you report.</p>
          <input ref={fileInput} onChange={(event) => void addEvidence(event.target.files)} accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" multiple type="file" className="hidden" />
          <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading || evidence.length >= 3} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-700 hover:border-green-400 hover:bg-green-50 disabled:opacity-60">{uploading ? 'Uploading and scanning evidence...' : <><ImagePlus className="h-4 w-4" /> Add screenshot, video or file</>}</button>
          {evidence.length ? <div className="mt-3 space-y-2">{evidence.map((item) => <div key={item.path} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><span className="flex min-w-0 items-center gap-2 truncate font-semibold text-slate-700">{item.type === 'video' ? <FileVideo className="h-4 w-4 shrink-0 text-rose-600" /> : <ImagePlus className="h-4 w-4 shrink-0 text-blue-600" />}{item.name}</span><button type="button" onClick={() => setEvidence((current) => current.filter((candidate) => candidate.path !== item.path))} className="text-xs font-bold text-rose-600">Remove</button></div>)}</div> : null}
          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700" />Files are private, scanned for malware and visible only to you and authorised SQUASH reviewers.</div>
        </section>
      </div>
    </div>

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2"><CircleDot className="h-4 w-4 text-rose-600" /><div><h2 className="font-black text-slate-900">Structured issue report</h2><p className="mt-1 text-sm text-slate-500">A reviewer will assess clarity, reproducibility, evidence and honesty—not whether you guessed a hidden answer.</p></div></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-xs font-bold text-slate-700 md:col-span-2">Bug title <span className="text-rose-600">*</span><input value={bugTitle} onChange={(event) => setBugTitle(event.target.value)} placeholder="Short, clear summary of the issue" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-500" /></label>
        <label className="text-xs font-bold text-slate-700 md:col-span-2">Steps to reproduce <span className="text-rose-600">*</span><textarea value={steps} onChange={(event) => setSteps(event.target.value)} placeholder="List the exact steps you took in the controlled sample." rows={4} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-500" /></label>
        <label className="text-xs font-bold text-slate-700">Expected result <span className="text-rose-600">*</span><textarea value={expected} onChange={(event) => setExpected(event.target.value)} placeholder="What should have happened?" rows={3} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-500" /></label>
        <label className="text-xs font-bold text-slate-700">Actual result <span className="text-rose-600">*</span><textarea value={actual} onChange={(event) => setActual(event.target.value)} placeholder="What actually happened?" rows={3} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-500" /></label>
        <label className="text-xs font-bold text-slate-700">Severity<select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
        <label className="text-xs font-bold text-slate-700">Reproducibility<select value={reproducibility} onChange={(event) => setReproducibility(event.target.value as typeof reproducibility)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500"><option value="always">Always</option><option value="often">Often</option><option value="sometimes">Sometimes</option><option value="once">Once</option></select></label>
        <label className="text-xs font-bold text-slate-700 md:col-span-2">Additional notes <span className="font-medium text-slate-400">(optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything else a reviewer should know?" rows={3} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-500" /></label>
      </div>
      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-5 text-slate-500">Submit only after you have actually tested the sample and reviewed your evidence.</p>
        <button type="button" onClick={() => void submit()} disabled={submitting || uploading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-60 transition-all">{submitting ? 'Submitting for Review...' : 'Submit Practical Sample'} <ChevronRight className="h-4 w-4" /></button>
      </div>
    </section>
  </div>;
}
