import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  Home,
  LockKeyhole,
  Menu,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { getAdminJobs, type AdminJobRow } from './lib/adminApi';
import { getTestTypeByKey } from './lib/testTypes';

type JobFilter = 'all' | AdminJobRow['status'];
type PackageFilter = 'all' | AdminJobRow['packageKey'];

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

function packageClass(packageKey: AdminJobRow['packageKey']) {
  if (packageKey === 'accessibility') return 'bg-violet-50 text-violet-700 ring-violet-100';
  if (packageKey === 'localization') return 'bg-pink-50 text-pink-700 ring-pink-100';
  if (packageKey === 'low-data') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (packageKey === 'usability') return 'bg-sky-50 text-sky-700 ring-sky-100';
  if (packageKey === 'onboarding') return 'bg-teal-50 text-teal-700 ring-teal-100';
  return 'bg-green-50 text-green-700 ring-green-100';
}

export default function SquashAdminJobsPage() {
  const { session } = useAuth();
  const adminName = session?.name || 'Mzwakhe Khosa';
  const [jobs, setJobs] = useState<AdminJobRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<JobFilter>('all');
  const [packageFilter, setPackageFilter] = useState<PackageFilter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      setJobs(await getAdminJobs(80));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load jobs right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const statusMatches = statusFilter === 'all' || job.status === statusFilter;
      const packageMatches = packageFilter === 'all' || job.packageKey === packageFilter;
      return statusMatches && packageMatches;
    });
  }, [jobs, packageFilter, statusFilter]);

  const totalValue = jobs.reduce((sum, job) => sum + job.totalAmountZar, 0);
  const activeJobs = jobs.filter((job) => job.status === 'active').length;
  const reviewJobs = jobs.filter((job) => job.status === 'in_review').length;
  const completedJobs = jobs.filter((job) => job.status === 'completed').length;

  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home, active: false },
    { label: 'Payout Queue', href: '/A31/payouts', icon: CreditCard, active: false },
    { label: 'Users', href: '/A31/users', icon: Users, active: false },
    { label: 'Jobs', href: '/A31/jobs', icon: FileText, active: true },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole, active: false },
  ];

  const stats = [
    { label: 'Total Jobs', value: jobs.length, note: 'All posted jobs', icon: BriefcaseBusiness, bg: 'bg-slate-50', color: 'text-slate-700' },
    { label: 'Active', value: activeJobs, note: 'Visible to testers', icon: BadgeCheck, bg: 'bg-sky-50', color: 'text-sky-700' },
    { label: 'In Review', value: reviewJobs, note: 'Awaiting report approval', icon: ShieldCheck, bg: 'bg-amber-50', color: 'text-amber-700' },
    { label: 'Completed', value: completedJobs, note: 'Finished jobs', icon: FileText, bg: 'bg-green-50', color: 'text-green-700' },
    { label: 'Job Value', value: formatRand(totalValue), note: 'Total posted value', icon: Wallet, bg: 'bg-emerald-50', color: 'text-emerald-700' },
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
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="h-5 w-5 text-green-700" />
                Job operations
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Review job volume, package mix, and status health before adding moderation controls.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <a href="/A31/dashboard" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                  <Menu className="h-5 w-5" />
                </a>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search jobs, developers, packages..." />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <button type="button" className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                    {adminName.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-bold text-slate-900">{adminName}</div>
                    <div className="text-xs text-slate-500">Owner Admin</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                  Admin job management
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Jobs</h1>
                <p className="mt-2 max-w-3xl text-slate-600">
                  Monitor every testing job posted on SQUASH, from draft through completion.
                </p>
              </div>
              <button
                type="button"
                onClick={loadJobs}
                disabled={loading}
                className="w-fit rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? 'Refreshing...' : 'Refresh Jobs'}
              </button>
            </div>

            {error ? <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {stats.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-600">{card.label}</div>
                        <div className="mt-2 text-2xl font-black text-slate-900">{card.value}</div>
                        <div className="mt-2 text-xs leading-5 text-slate-500">{card.note}</div>
                      </div>
                      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${card.bg}`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Job directory</h2>
                  <p className="mt-1 text-sm text-slate-600">Review package, developer, tester count and operational status.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as JobFilter)}
                    className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-green-500"
                  >
                    <option value="all">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="in_review">In review</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <select
                    value={packageFilter}
                    onChange={(event) => setPackageFilter(event.target.value as PackageFilter)}
                    className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-green-500"
                  >
                    <option value="all">All test types</option>
                    <option value="bug-hunting">Bug Hunting</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="usability">Usability</option>
                    <option value="low-data">Low-Data</option>
                    <option value="localization">Localization</option>
                    <option value="accessibility">Accessibility</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                      <th className="px-6 py-4 font-medium">Job</th>
                      <th className="px-6 py-4 font-medium">Developer</th>
                      <th className="px-6 py-4 font-medium">Package</th>
                      <th className="px-6 py-4 font-medium">Testers</th>
                      <th className="px-6 py-4 font-medium">Value</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Posted</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-900">{job.title}</div>
                          <div className="text-sm text-slate-500">{job.category} - {job.platform}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-900">{job.developerName}</div>
                          <div className="text-sm text-slate-500">{job.developerEmail}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${packageClass(job.packageKey)}`}>
                            {getTestTypeByKey(job.packageKey).shortLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold text-slate-700">{job.testersNeeded}</td>
                        <td className="px-6 py-5 font-bold text-slate-900">{formatRand(job.totalAmountZar)}</td>
                        <td className="px-6 py-5">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${statusClass(job.status)}`}>
                            {job.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-500">{formatDate(job.createdAt)}</td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            <a href={`/A31/jobs/${job.id}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Open</a>
                            <a href={`/A31/reports?job=${job.id}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Reports</a>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-sm leading-6 text-slate-600">
                          No jobs match these filters yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
