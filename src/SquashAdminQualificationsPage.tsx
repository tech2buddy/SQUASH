import {
  BadgeCheck,
  Bell,
  Bug,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileImage,
  FileText,
  Home,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import {
  getAdminQualificationReviews,
  getQualificationEvidenceUrl,
  reviewTesterQualification,
  type AdminQualificationReview,
  type QualificationReviewDecision,
  type QualificationReviewRubric,
} from './lib/adminQualificationApi';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

const defaultRubric: QualificationReviewRubric = { clarity: 3, reproducibility: 3, evidence: 3, taskCoverage: 3 };

function outcomeTone(outcome: string) {
  if (outcome === 'pass') return 'bg-green-50 text-green-700 ring-green-100';
  if (outcome === 'fail') return 'bg-rose-50 text-rose-700 ring-rose-100';
  if (outcome === 'blocked') return 'bg-amber-50 text-amber-700 ring-amber-100';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default function SquashAdminQualificationsPage() {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<AdminQualificationReview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rubrics, setRubrics] = useState<Record<string, QualificationReviewRubric>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<QualificationReviewDecision | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const queue = await getAdminQualificationReviews();
      setReviews(queue);
      setSelectedId((current) => queue.some((item) => item.attemptId === current) ? current : queue[0]?.attemptId || null);
      setNotes((current) => Object.fromEntries(queue.map((item) => [item.attemptId, current[item.attemptId] || ''])));
      setRubrics((current) => Object.fromEntries(queue.map((item) => [item.attemptId, current[item.attemptId] || defaultRubric])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load qualification reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const selected = useMemo(() => reviews.find((review) => review.attemptId === selectedId) || null, [reviews, selectedId]);
  const adminName = session?.name || 'Owner Admin';
  const rubric = selected ? rubrics[selected.attemptId] || defaultRubric : defaultRubric;
  const qualityScore = Math.round(((rubric.clarity + rubric.reproducibility + rubric.evidence + rubric.taskCoverage) / 20) * 100);

  const decide = async (decision: QualificationReviewDecision) => {
    if (!selected) return;
    if (decision === 'approved' && (qualityScore < 70 || Math.min(rubric.clarity, rubric.reproducibility, rubric.evidence, rubric.taskCoverage) < 3)) {
      setError('Approval requires a 70% quality score with no rubric category below 3.');
      return;
    }
    if ((decision === 'retry_required' || decision === 'declined') && (notes[selected.attemptId] || '').trim().length < 10) {
      setError('Add a clear reviewer note before requesting a retry or declining this application.');
      return;
    }
    const action = decision === 'approved' ? 'approve' : decision === 'retry_required' ? 'request a retry for' : 'decline';
    if (!window.confirm(`Are you sure you want to ${action} ${selected.testerName}'s tester application?`)) return;
    setUpdating(decision);
    setError('');
    setNotice('');
    try {
      await reviewTesterQualification({ attemptId: selected.attemptId, decision, note: notes[selected.attemptId], rubric });
      setNotice(decision === 'approved' ? `${selected.testerName} is now an approved SQUASH tester.` : decision === 'retry_required' ? `A fresh alternate attempt is now available for ${selected.testerName}.` : `${selected.testerName}'s application was declined.`);
      await load();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not save this qualification decision.');
    } finally {
      setUpdating(null);
    }
  };

  const openEvidence = async (path: string) => {
    try {
      const url = await getQualificationEvidenceUrl(path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Could not open this evidence file.');
    }
  };

  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home },
    { label: 'Qualifications', href: '/A31/qualifications', icon: BadgeCheck, active: true },
    { label: 'Sample Test Template', href: '/A31/qualification-template', icon: BadgeCheck },
    { label: 'Probation watch', href: '/A31/probation', icon: Clock3 },
    { label: 'Payout Queue', href: '/A31/payouts', icon: FileText },
    { label: 'Users', href: '/A31/users', icon: Users },
    { label: 'Reports', href: '/A31/reports', icon: ClipboardCheck },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole },
  ];

  return <div className="min-h-screen bg-[#f8fafc] text-slate-900 lg:h-screen lg:overflow-hidden"><div className="grid min-h-screen lg:h-screen lg:grid-cols-[260px_1fr]">
    <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto"><div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6"><img src="/squash-logo.png" alt="SQUASH logo" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm" /><a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">SQUASH</a></div><nav className="flex-1 space-y-2 px-4 py-6">{navItems.map((item) => { const Icon = item.icon; return <a key={item.label} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{item.label}</a>; })}</nav><div className="p-4 pt-0"><div className="rounded-3xl border border-green-100 bg-green-50 p-5 text-sm leading-6 text-slate-700"><div className="flex items-center gap-2 font-bold text-slate-900"><ShieldCheck className="h-5 w-5 text-green-700" />Admission controls</div><p className="mt-2">Approve only clear, honest work with usable evidence. A retry receives a different quiz and sample flow.</p></div></div></aside>
    <main className="min-w-0 lg:h-screen lg:overflow-y-auto"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur"><div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"><div><div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700"><BadgeCheck className="h-3.5 w-3.5" /> Private administrator workspace</div><h1 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">Tester qualification review</h1></div><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><Bell className="h-5 w-5 text-slate-500" /><div className="hidden sm:block"><div className="text-sm font-bold text-slate-900">{adminName}</div><div className="text-xs text-slate-500">Admin</div></div></div></div></header>
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-slate-500">Awaiting review</div><div className="mt-2 text-3xl font-black text-slate-950">{reviews.length}</div><div className="mt-1 text-xs text-slate-500">Submitted practical samples</div></div><div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm"><div className="text-sm font-semibold text-green-700">Approval standard</div><div className="mt-2 font-black text-slate-950">Clear + reproducible</div><div className="mt-1 text-xs text-slate-600">Task notes, evidence and report must agree.</div></div><div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm"><div className="text-sm font-semibold text-amber-700">Retry control</div><div className="mt-2 font-black text-slate-950">Different scenario</div><div className="mt-1 text-xs text-slate-600">Only one alternate attempt is available.</div></div></div>
        {notice ? <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{notice}</div> : null}{error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
        {loading ? <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Loading secure qualification queue...</div> : null}
        {!loading && reviews.length === 0 ? <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><CheckCircle2 className="mx-auto h-10 w-10 text-green-600" /><h2 className="mt-3 text-xl font-black text-slate-950">Qualification queue is clear</h2><p className="mt-2 text-sm text-slate-600">Submitted practical samples will appear here for an administrator review.</p></div> : null}
        {!loading && selected ? <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]"><section className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-900">Review queue</h2><p className="mt-1 text-xs text-slate-500">Oldest submissions first</p></div><div className="divide-y divide-slate-100">{reviews.map((review) => <button type="button" key={review.attemptId} onClick={() => { setSelectedId(review.attemptId); setError(''); setNotice(''); }} className={`w-full p-5 text-left transition ${selectedId === review.attemptId ? 'bg-green-50/70' : 'hover:bg-slate-50'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate font-bold text-slate-900">{review.testerName}</div><div className="mt-1 truncate text-xs text-slate-500">{review.testerEmail}</div></div><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">Attempt {review.attemptNumber}</span></div><div className="mt-4 flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{review.sampleVariantTitle}</span><span className="text-slate-400">{formatDate(review.submittedAt)}</span></div></button>)}</div></section>
          <section className="min-w-0 space-y-5"><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{selected.sampleVariantTitle}</span><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Quiz {selected.quizScore ?? '—'}/{selected.quizTotal ?? '—'}</span></div><h2 className="mt-3 text-2xl font-black text-slate-950">{selected.testerName}</h2><p className="mt-1 text-sm text-slate-500">{selected.testerEmail} · submitted {formatDate(selected.submittedAt)}</p></div><div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">Practical sample submitted</div></div></div>
            <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 font-black text-slate-900"><ClipboardCheck className="h-4 w-4 text-green-700" /> Task observations</h3><div className="mt-4 space-y-3">{selected.taskOutcomes.map((task, index) => <div key={`${task.taskId}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><div className="flex items-center justify-between gap-3"><span className="font-bold text-slate-800">Task {index + 1}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${outcomeTone(task.outcome)}`}>{task.outcome.replace('_', ' ')}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{task.note}</p></div>)}</div></section><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-black text-slate-900"><Bug className="h-4 w-4 text-rose-600" /> Structured issue reports ({selected.issueReports.length})</h3>
              {selected.issueReports.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-slate-500">No task was marked Fail or Blocked — this tester reported a clean pass with no defects.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {selected.issueReports.map((issue, index) => (
                    <div key={`${issue.taskId}-${index}`} className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-rose-500">Task: {issue.taskTitle}</span>
                        <div className="flex gap-1.5">
                          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold capitalize text-rose-700 ring-1 ring-rose-100">{issue.severity}</span>
                          <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold capitalize text-sky-700 ring-1 ring-sky-100">{issue.reproducibility}</span>
                        </div>
                      </div>
                      <p className="mt-2 font-bold text-slate-900">{issue.bugTitle}</p>
                      <div className="mt-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Steps to reproduce</span><p className="mt-1 whitespace-pre-wrap leading-6 text-slate-700">{issue.stepsToReproduce}</p></div>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <div><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Expected</span><p className="mt-1 leading-6 text-slate-700">{issue.expectedResult}</p></div>
                        <div><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Actual</span><p className="mt-1 leading-6 text-slate-700">{issue.actualResult}</p></div>
                      </div>
                      {issue.evidencePaths.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {issue.evidencePaths.map((path, evidenceIndex) => (
                            <button type="button" key={path} onClick={() => void openEvidence(path)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50">
                              <FileImage className="h-3 w-3" /> Evidence {evidenceIndex + 1}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              {selected.testerNotes ? <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><strong>Tester note:</strong> {selected.testerNotes}</div> : null}
            </section></div>
            <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 font-black text-slate-900"><FileImage className="h-4 w-4 text-blue-600" /> Evidence ({selected.evidencePaths.length})</h3><p className="mt-2 text-sm text-slate-500">Private malware-clean files. Signed links expire automatically.</p><div className="mt-4 space-y-2">{selected.evidencePaths.map((path, index) => { const video = /\.(mp4|webm)$/i.test(path); return <button type="button" key={path} onClick={() => void openEvidence(path)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:border-green-300 hover:bg-green-50"><span className="flex min-w-0 items-center gap-2 truncate">{video ? <Video className="h-4 w-4 shrink-0 text-rose-600" /> : <FileImage className="h-4 w-4 shrink-0 text-blue-600" />}Evidence {index + 1}</span><ExternalLink className="h-4 w-4 shrink-0 text-slate-400" /></button>; })}</div></section><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-slate-900">Captured environment</h3><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{Object.entries(selected.environment).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-3"><div className="text-xs font-bold uppercase tracking-wide text-slate-400">{key}</div><div className="mt-1 font-semibold text-slate-700">{String(value || 'Not recorded')}</div></div>)}</div></section></div>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" /><div><h3 className="font-black text-slate-900">Make an admission decision</h3><p className="mt-1 text-sm leading-6 text-slate-500">Approving unlocks paid-job eligibility. A retry grants the tester one different quiz and a different sample scenario. Declining closes the application.</p></div></div><div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-bold text-slate-900">Quality rubric</div><p className="mt-1 text-xs text-slate-500">Score the sample based on what the tester submitted.</p></div><span className={`rounded-full px-3 py-1.5 text-sm font-black ${qualityScore >= 70 && Math.min(rubric.clarity, rubric.reproducibility, rubric.evidence, rubric.taskCoverage) >= 3 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{qualityScore}% quality</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{([{ key: 'clarity', label: 'Report clarity' }, { key: 'reproducibility', label: 'Reproducibility' }, { key: 'evidence', label: 'Evidence quality' }, { key: 'taskCoverage', label: 'Task coverage' }] as Array<{ key: keyof QualificationReviewRubric; label: string }>).map((item) => <label key={item.key} className="text-xs font-bold text-slate-700">{item.label}<select value={rubric[item.key]} onChange={(event) => setRubrics((current) => ({ ...current, [selected.attemptId]: { ...(current[selected.attemptId] || defaultRubric), [item.key]: Number(event.target.value) } }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500"><option value={1}>1 — Insufficient</option><option value={2}>2 — Weak</option><option value={3}>3 — Acceptable</option><option value={4}>4 — Strong</option><option value={5}>5 — Excellent</option></select></label>)}</div><p className="mt-3 text-xs leading-5 text-slate-500">Approval requires at least 70% overall and no category below 3.</p></div><textarea value={notes[selected.attemptId] || ''} onChange={(event) => setNotes((current) => ({ ...current, [selected.attemptId]: event.target.value }))} placeholder="Reviewer note — required for retry or decline, optional for approval" rows={3} className="mt-5 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" /><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={updating !== null} onClick={() => void decide('declined')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><XCircle className="h-4 w-4" />Decline</button><button type="button" disabled={updating !== null} onClick={() => void decide('retry_required')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"><RotateCcw className="h-4 w-4" />Request retry</button><button type="button" disabled={updating !== null} onClick={() => void decide('approved')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-green-700 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />{updating === 'approved' ? 'Approving...' : 'Approve tester'}</button></div></section>
          </section></div> : null}
      </div></main>
  </div></div>;
}
