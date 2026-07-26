import {
  ArrowLeft,
  Bell,
  Camera,
  CreditCard,
  FileText,
  Home,
  LockKeyhole,
  ShieldCheck,
  Users,
  Video,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from './auth';
import { getSubmissionDetails, type DeveloperSubmissionDetails } from './lib/jobApi';
import { listTesterJobEvidence, type TesterJobEvidence } from './lib/storageApi';

function formatDate(value: string | null) {
  if (!value) return 'Not submitted yet';
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

function statusTone(status: DeveloperSubmissionDetails['status']) {
  if (status === 'approved') return 'bg-green-50 text-green-700 ring-green-100';
  if (status === 'submitted') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (status === 'changes_requested') return 'bg-sky-50 text-sky-700 ring-sky-100';
  if (status === 'rejected') return 'bg-red-50 text-red-700 ring-red-100';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default function SquashAdminReportDetailPage() {
  const { submissionId } = useParams();
  const { session } = useAuth();
  const [report, setReport] = useState<DeveloperSubmissionDetails | null>(null);
  const [evidence, setEvidence] = useState<TesterJobEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Could not load this report.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [submissionId]);

  const score = useMemo(() => {
    if (!report) return null;
    const values = Object.values(report.scores).filter((value) => value > 0);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  }, [report]);

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
              return <a key={item.label} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{item.label}</a>;
            })}
          </nav>
        </aside>

        <main className="min-w-0 lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <a href="/A31/reports" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />Back to reports</a>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><Bell className="h-5 w-5 text-slate-500" /><div className="hidden sm:block"><div className="text-sm font-bold">{adminName}</div><div className="text-xs text-slate-500">Owner Admin</div></div></div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-600 shadow-sm">Loading report oversight...</div> : null}
            {error ? <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm font-semibold text-red-700">{error}</div> : null}
            {!loading && !error && report ? (
              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-100">Admin report oversight</div>
                      <h1 className="mt-4 text-3xl font-black tracking-tight">{report.jobTitle}</h1>
                      <p className="mt-2 text-sm text-slate-600">Submitted by <strong>{report.testerName}</strong> ({report.testerEmail})</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(report.submittedAt || report.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${statusTone(report.status)}`}>{report.status.replace(/_/g, ' ')}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{score === null ? 'Score pending' : `${score}/100`}</span>
                    </div>
                  </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
                  <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-xl font-bold">Tester summary</h2>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{report.summary || 'No final summary was provided.'}</p>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Evidence</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{evidence.length}</span></div>
                      {evidence.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{evidence.map((item) => <figure key={item.path} className="overflow-hidden rounded-2xl border border-slate-200 bg-black">{item.type === 'screenshot' ? <a href={item.url} target="_blank" rel="noreferrer"><img src={item.url} alt="Report evidence" className="h-64 w-full object-contain" /></a> : <video controls preload="metadata" src={item.url} className="h-64 w-full object-contain" />}<figcaption className="flex items-center gap-2 bg-white px-4 py-3 text-xs font-semibold text-slate-700">{item.type === 'screenshot' ? <Camera className="h-4 w-4" /> : <Video className="h-4 w-4" />}{item.type === 'screenshot' ? 'Screenshot' : 'Video evidence'}</figcaption></figure>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">No stored screenshot or video is linked to this report.</p>}
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-xl font-bold">Reported bugs ({report.bugs.length})</h2>
                      <div className="mt-5 space-y-4">{report.bugs.map((bug, index) => <article key={bug.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold text-slate-400">BUG {index + 1}</div><h3 className="mt-1 font-bold">{bug.title}</h3></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold ring-1 ring-slate-200">{bug.severity}</span></div>{bug.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{bug.description}</p> : null}{bug.reproductionSteps.length ? <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-600">{bug.reproductionSteps.map((step, stepIndex) => <li key={`${bug.id}-${stepIndex}`}>{step}</li>)}</ol> : null}</article>)}{report.bugs.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">No bugs were logged.</p> : null}</div>
                    </section>
                  </div>

                  <aside className="space-y-5">
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold">Tester</h2><div className="mt-4 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-600 font-black text-white">{report.testerName.charAt(0).toUpperCase()}</div><div><div className="font-bold">{report.testerName}</div><div className="text-xs text-slate-500">{report.testerEmail}</div></div></div><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Tests completed</dt><dd className="font-bold">{report.testerTestsCompleted || 0}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Platform</dt><dd className="font-bold">{report.jobPlatform}</dd></div></dl></section>
                    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-900"><strong>Oversight only.</strong><p className="mt-2">The developer reviews and approves this report. Admin access is for moderation, evidence review, and dispute handling.</p></section>
                  </aside>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}