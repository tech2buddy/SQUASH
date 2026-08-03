import { ArrowLeft, Bell, CreditCard, FileText, Home, LockKeyhole, Menu, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from './auth';
import { getAdminJobDetail, type AdminJobRow } from './lib/adminApi';
import { getTestTypeByKey } from './lib/testTypes';

function formatRand(value: number) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function statusClass(status: AdminJobRow['status']) {
  if (status === 'completed') return 'bg-green-50 text-green-700 ring-green-100';
  if (status === 'active') return 'bg-sky-50 text-sky-700 ring-sky-100';
  if (status === 'in_review') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (status === 'cancelled') return 'bg-red-50 text-red-600 ring-red-100';
  return 'bg-slate-50 text-slate-700 ring-slate-200';
}

export default function SquashAdminJobDetailPage() {
  const { jobId = '' } = useParams();
  const { session } = useAuth();
  const adminName = session?.name || 'Mzwakhe Khosa';
  const [job, setJob] = useState<AdminJobRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadJob = async () => {
      setLoading(true);
      setError('');
      try {
        setJob(await getAdminJobDetail(jobId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load this job right now.');
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [jobId]);

  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home, active: false },
    { label: 'Payout Queue', href: '/A31/payouts', icon: CreditCard, active: false },
    { label: 'Users', href: '/A31/users', icon: Users, active: false },
    { label: 'Jobs', href: '/A31/jobs', icon: FileText, active: true },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole, active: false },
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
              return <a key={item.label} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{item.label}</a>;
            })}
          </nav>
        </aside>

        <main className="min-w-0 lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <a href="/A31/jobs" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden"><Menu className="h-5 w-5" /></a>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]"><Search className="h-4 w-4 text-slate-400" /><input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search job details..." /></div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><Bell className="h-5 w-5 text-slate-500" /><div className="hidden sm:block"><div className="text-sm font-bold text-slate-900">{adminName}</div><div className="text-xs text-slate-500">Admin</div></div></div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <a href="/A31/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to jobs</a>
            {error ? <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}
            {loading ? <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm">Loading job...</div> : null}
            {!loading && !job ? <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm">Job not found.</div> : null}
            {job ? (
              <>
                <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">Admin job detail</div>
                      <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">{job.title}</h1>
                      <p className="mt-2 text-slate-600">{job.category} - {job.platform}</p>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${statusClass(job.status)}`}>{job.status.replace(/_/g, ' ')}</span>
                  </div>
                </section>
                <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Developer', job.developerName, job.developerEmail],
                    ['Test Type', getTestTypeByKey(job.packageKey).label, `${job.testersNeeded} testers`],
                    ['Job Value', formatRand(job.totalAmountZar), 'Total developer cost'],
                    ['Posted', formatDate(job.createdAt), 'Created date'],
                  ].map(([label, value, note]) => (
                    <div key={label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="text-sm font-semibold text-slate-500">{label}</div><div className="mt-3 text-2xl font-black capitalize text-slate-900">{value}</div><div className="mt-2 text-sm text-slate-500">{note}</div></div>
                  ))}
                </section>
                <section className="mt-8 rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div><h2 className="text-2xl font-bold text-slate-900">Reports and submissions</h2><p className="mt-2 text-slate-700">Open the admin report list filtered to this job.</p></div>
                    <a href={`/A31/reports?job=${job.id}`} className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700">View Job Reports</a>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
