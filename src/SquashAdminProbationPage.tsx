import { Bell, CheckCircle2, Clock3, Home, LockKeyhole, RotateCcw, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { getAdminProbationTesters, reviewTesterProbation, type AdminProbationTester, type ProbationDecision } from './lib/adminProbationApi';

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Not recorded';
}

function daysRemaining(value: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
}

export default function SquashAdminProbationPage() {
  const { session } = useAuth();
  const [testers, setTesters] = useState<AdminProbationTester[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [extensionDays, setExtensionDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<ProbationDecision | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getAdminProbationTesters();
      setTesters(list);
      setSelectedId((current) => list.some((tester) => tester.testerId === current) ? current : list[0]?.testerId || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load probation monitoring.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  const selected = useMemo(() => testers.find((tester) => tester.testerId === selectedId) || null, [selectedId, testers]);
  const adminName = session?.name || 'Owner Admin';

  const decide = async (decision: ProbationDecision) => {
    if (!selected) return;
    if (note.trim().length < 10) {
      setError('Add a clear probation review note before saving this decision.');
      return;
    }
    const action = decision === 'cleared' ? 'clear probation for' : decision === 'extended' ? 'extend probation for' : 'restrict new applications for';
    if (!window.confirm(`Are you sure you want to ${action} ${selected.name}?`)) return;
    setUpdating(decision);
    setError('');
    setNotice('');
    try {
      await reviewTesterProbation({ testerId: selected.testerId, decision, note, extensionDays });
      setNotice(decision === 'cleared' ? `${selected.name} completed probation.` : decision === 'extended' ? `${selected.name}'s probation was extended.` : `${selected.name}'s new paid-job applications are now paused for review.`);
      setNote('');
      await load();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Could not save the probation decision.');
    } finally {
      setUpdating(null);
    }
  };

  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home },
    { label: 'Qualifications', href: '/A31/qualifications', icon: ShieldCheck },
    { label: 'Probation watch', href: '/A31/probation', icon: Clock3, active: true },
    { label: 'Payout Queue', href: '/A31/payouts', icon: ShieldAlert },
    { label: 'Users', href: '/A31/users', icon: Users },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole },
  ];

  return <div className="min-h-screen bg-[#f8fafc] text-slate-900 lg:h-screen lg:overflow-hidden"><div className="grid min-h-screen lg:h-screen lg:grid-cols-[260px_1fr]">
    <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto"><div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6"><img src="/squash-logo.png" alt="SQUASH logo" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm" /><a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">SQUASH</a></div><nav className="flex-1 space-y-2 px-4 py-6">{navItems.map((item) => { const Icon = item.icon; return <a key={item.label} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{item.label}</a>; })}</nav></aside>
    <main className="min-w-0 lg:h-screen lg:overflow-y-auto"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur"><div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"><div><div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700"><Clock3 className="h-3.5 w-3.5" /> Private quality monitoring</div><h1 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">New tester probation watch</h1></div><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><Bell className="h-5 w-5 text-slate-500" /><div className="hidden sm:block"><div className="text-sm font-bold text-slate-900">{adminName}</div><div className="text-xs text-slate-500">Admin</div></div></div></div></header>
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><section className="rounded-3xl border border-sky-100 bg-sky-50 p-5 shadow-sm"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><div><h2 className="font-black text-slate-900">What probation does</h2><p className="mt-1 text-sm leading-6 text-slate-700">Approved testers can apply to paid work during their first 30 days. Use this workspace to clear reliable testers, extend observation where quality needs attention, or restrict new applications while a safety or quality issue is reviewed.</p></div></div></section>{notice ? <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{notice}</div> : null}{error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}{loading ? <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Loading probation watch...</div> : null}{!loading && testers.length === 0 ? <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><CheckCircle2 className="mx-auto h-10 w-10 text-green-600" /><h2 className="mt-3 text-xl font-black text-slate-950">No active probation testers</h2><p className="mt-2 text-sm text-slate-600">Newly approved testers will appear here for their first 30 days.</p></div> : null}{!loading && selected ? <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]"><section className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-900">Active watch</h2><p className="mt-1 text-xs text-slate-500">Soonest expiry first</p></div><div className="divide-y divide-slate-100">{testers.map((tester) => <button type="button" key={tester.testerId} onClick={() => { setSelectedId(tester.testerId); setNote(''); setError(''); setNotice(''); }} className={`w-full p-5 text-left ${selectedId === tester.testerId ? 'bg-sky-50/70' : 'hover:bg-slate-50'}`}><div className="font-bold text-slate-900">{tester.name}</div><div className="mt-1 truncate text-xs text-slate-500">{tester.email}</div><div className="mt-3 flex items-center justify-between text-xs"><span className="rounded-full bg-sky-50 px-2 py-1 font-bold text-sky-700 capitalize">{tester.status}</span><span className="font-semibold text-slate-500">{daysRemaining(tester.endsAt)} days left</span></div></button>)}</div></section><section className="space-y-5"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-black text-slate-950">{selected.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.email}</p></div><span className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-bold capitalize text-sky-700">{selected.status} probation</span></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-400">Ends</div><div className="mt-2 font-black text-slate-900">{formatDate(selected.endsAt)}</div><div className="mt-1 text-xs text-slate-500">{daysRemaining(selected.endsAt)} days remaining</div></div><div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-400">Tests completed</div><div className="mt-2 text-2xl font-black text-slate-900">{selected.testsCompleted}</div></div><div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-400">Tester rating</div><div className="mt-2 text-2xl font-black text-slate-900">{selected.rating.toFixed(1)}</div></div></div></section><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="font-black text-slate-900">Probation decision</h3><p className="mt-1 text-sm leading-6 text-slate-500">Record the reason for every decision. Restricting pauses only future paid-job applications; it preserves history for review.</p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Review note — required for every probation decision" rows={4} className="mt-5 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" /><label className="mt-4 block max-w-xs text-xs font-bold text-slate-700">Extension length<select value={extensionDays} onChange={(event) => setExtensionDays(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"><option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option></select></label><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={updating !== null} onClick={() => void decide('restricted')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><ShieldAlert className="h-4 w-4" />Restrict new applications</button><button type="button" disabled={updating !== null} onClick={() => void decide('extended')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"><RotateCcw className="h-4 w-4" />Extend probation</button><button type="button" disabled={updating !== null} onClick={() => void decide('cleared')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />{updating === 'cleared' ? 'Clearing...' : 'Clear probation'}</button></div></section></section></div> : null}</div></main>
  </div></div>;
}
