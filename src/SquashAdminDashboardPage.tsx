import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Home,
  LockKeyhole,
  Menu,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import {
  getAdminActivityLogs,
  getAdminJobs,
  getAdminOverview,
  getAdminPayoutQueue,
  getAdminReports,
  getAdminUsers,
  getRecentAdminUsers,
  updateAdminPayoutStatus,
  type AdminActivityLog,
  type AdminJobRow,
  type AdminOverview,
  type AdminPayoutRow,
  type AdminReportRow,
  type AdminUserRow,
} from './lib/adminApi';
import { getTestTypeByKey } from './lib/testTypes';

type RecentUser = Awaited<ReturnType<typeof getRecentAdminUsers>>[number];
type UserFilter = 'all' | AdminUserRow['role'];
type JobFilter = 'all' | AdminJobRow['status'];
type ReportFilter = 'all' | AdminReportRow['status'];

const emptyOverview: AdminOverview = {
  totalUsers: 0,
  developers: 0,
  testers: 0,
  activeJobs: 0,
  submittedReports: 0,
  pendingPayouts: 0,
  pendingPayoutTotalZar: 0,
};

function formatRand(value: number) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function payoutStatusClass(status: AdminPayoutRow['status']) {
  if (status === 'paid') return 'bg-green-50 text-green-700 ring-green-100';
  if (status === 'processing') return 'bg-sky-50 text-sky-700 ring-sky-100';
  if (status === 'failed' || status === 'cancelled') return 'bg-red-50 text-red-600 ring-red-100';
  return 'bg-amber-50 text-amber-700 ring-amber-100';
}

function jobStatusClass(status: AdminJobRow['status']) {
  if (status === 'completed') return 'bg-green-50 text-green-700 ring-green-100';
  if (status === 'active') return 'bg-sky-50 text-sky-700 ring-sky-100';
  if (status === 'in_review') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (status === 'cancelled') return 'bg-red-50 text-red-600 ring-red-100';
  return 'bg-slate-50 text-slate-700 ring-slate-200';
}

function reportStatusClass(status: AdminReportRow['status']) {
  if (status === 'approved') return 'bg-green-50 text-green-700 ring-green-100';
  if (status === 'submitted') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (status === 'changes_requested') return 'bg-sky-50 text-sky-700 ring-sky-100';
  if (status === 'rejected') return 'bg-red-50 text-red-600 ring-red-100';
  return 'bg-slate-50 text-slate-700 ring-slate-200';
}

export default function SquashAdminDashboardPage() {
  const { session } = useAuth();
  const adminName = session?.name || 'Mzwakhe Khosa';
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [payouts, setPayouts] = useState<AdminPayoutRow[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [adminJobs, setAdminJobs] = useState<AdminJobRow[]>([]);
  const [adminReports, setAdminReports] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [payoutFilter, setPayoutFilter] = useState<'all' | AdminPayoutRow['status']>('all');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [jobFilter, setJobFilter] = useState<JobFilter>('all');
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all');
  const [payoutNotes, setPayoutNotes] = useState<Record<string, { note: string; reference: string }>>({});
  const [confirmPayout, setConfirmPayout] = useState<AdminPayoutRow | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, payoutData, userData, activityData, adminUserData, adminJobData, adminReportData] = await Promise.all([
        getAdminOverview(),
        getAdminPayoutQueue(),
        getRecentAdminUsers(),
        getAdminActivityLogs(),
        getAdminUsers(),
        getAdminJobs(),
        getAdminReports(),
      ]);
      setOverview(overviewData);
      setPayouts(payoutData);
      setRecentUsers(userData);
      setActivityLogs(activityData);
      setAdminUsers(adminUserData);
      setAdminJobs(adminJobData);
      setAdminReports(adminReportData);
      setPayoutNotes((current) => {
        const next = { ...current };
        for (const payout of payoutData) {
          next[payout.id] = next[payout.id] || { note: payout.adminNote || '', reference: payout.payoutReference || '' };
        }
        return next;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load admin data right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handlePayoutStatus = async (payout: AdminPayoutRow, status: 'processing' | 'paid' | 'failed' | 'cancelled') => {
    if (!session?.userId) {
      setError('Admin session missing. Please log in again.');
      return;
    }

    const draft = payoutNotes[payout.id] || { note: '', reference: '' };
    if (status === 'paid' && !draft.reference.trim()) {
      setError('Add a payout reference before marking this payout as paid.');
      return;
    }

    setUpdatingId(payout.id);
    setNotice('');
    setError('');
    try {
      await updateAdminPayoutStatus({
        payoutId: payout.id,
        status,
        adminId: session.userId,
        adminNote: draft.note,
        payoutReference: draft.reference,
      });
      await loadAdminData();
      setNotice(`${payout.testerName}'s payout is now ${status}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update payout right now. Have you run supabase/phase6_admin_payout_audit.sql?');
    } finally {
      setUpdatingId(null);
      setConfirmPayout(null);
    }
  };

  const updatePayoutDraft = (payoutId: string, field: 'note' | 'reference', value: string) => {
    setPayoutNotes((current) => ({
      ...current,
      [payoutId]: {
        note: current[payoutId]?.note || '',
        reference: current[payoutId]?.reference || '',
        [field]: value,
      },
    }));
  };

  const exportPayoutCsv = () => {
    const rows = filteredPayouts.map((payout) => [
      payout.id,
      payout.testerName,
      payout.testerEmail,
      payout.method,
      payout.details,
      payout.amountZar,
      payout.status,
      payout.payoutReference || '',
      payout.adminNote || '',
      payout.createdAt,
      payout.processedAt || '',
    ]);
    const csv = [
      ['id', 'tester_name', 'tester_email', 'method', 'details', 'amount_zar', 'status', 'reference', 'admin_note', 'created_at', 'processed_at'],
      ...rows,
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `squash-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredPayouts = payoutFilter === 'all' ? payouts : payouts.filter((payout) => payout.status === payoutFilter);
  const filteredAdminUsers = userFilter === 'all' ? adminUsers : adminUsers.filter((user) => user.role === userFilter);
  const filteredAdminJobs = jobFilter === 'all' ? adminJobs : adminJobs.filter((job) => job.status === jobFilter);
  const filteredAdminReports = reportFilter === 'all' ? adminReports : adminReports.filter((report) => report.status === reportFilter);

  const stats = [
    { label: 'Total Users', value: overview.totalUsers, note: 'All registered accounts', icon: Users, bg: 'bg-slate-50', color: 'text-slate-700' },
    { label: 'Developers', value: overview.developers, note: 'Developer workspaces', icon: Home, bg: 'bg-green-50', color: 'text-green-700' },
    { label: 'Testers', value: overview.testers, note: 'Tester profiles', icon: BadgeCheck, bg: 'bg-sky-50', color: 'text-sky-700' },
    { label: 'Active Jobs', value: overview.activeJobs, note: 'Currently live', icon: ShieldCheck, bg: 'bg-emerald-50', color: 'text-emerald-700' },
    { label: 'Reports Review', value: overview.submittedReports, note: 'Awaiting developer review', icon: Clock3, bg: 'bg-amber-50', color: 'text-amber-700' },
    { label: 'Pending Payouts', value: formatRand(overview.pendingPayoutTotalZar), note: `${overview.pendingPayouts} payout requests`, icon: Wallet, bg: 'bg-violet-50', color: 'text-violet-700' },
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
            {[
              { label: 'Overview', href: '/A31/dashboard', icon: Home, active: true },
              { label: 'Qualifications', href: '/A31/qualifications', icon: BadgeCheck },
              { label: 'Probation watch', href: '/A31/probation', icon: Clock3 },
              { label: 'Payout Queue', href: '/A31/payouts', icon: CreditCard },
              { label: 'Users', href: '/A31/users', icon: Users },
              { label: 'Jobs', href: '/A31/jobs', icon: FileText },
              { label: 'Security', href: '/A31/security', icon: LockKeyhole },
              { label: 'Operations', href: '/A31/operations', icon: ShieldCheck },
            ].map((item) => {
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
                Owner access
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Admin access is controlled by Supabase profile role. No public signup path can create admins.
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
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search users, payouts, jobs..." />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <button type="button" className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                  <Bell className="h-5 w-5" />
                  {overview.pendingPayouts > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {overview.pendingPayouts}
                    </span>
                  ) : null}
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

          <div id="overview" className="scroll-mt-24 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                  SQUASH management
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Admin Dashboard</h1>
                <p className="mt-2 max-w-3xl text-slate-600">
                  Oversee users, jobs, reports and payout requests from one secure owner-only workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={loadAdminData}
                disabled={loading}
                className="w-fit rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>

            {error ? <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}
            {notice ? <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{notice}</div> : null}

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
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
                      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${card.bg}`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>


            <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-700" />
                      <h2 className="text-2xl font-bold text-slate-900">User oversight</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Newest accounts and roles across the marketplace.</p>
                  </div>
                  <select
                    value={userFilter}
                    onChange={(event) => setUserFilter(event.target.value as UserFilter)}
                    className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-green-500"
                  >
                    <option value="all">All roles</option>
                    <option value="admin">Admins</option>
                    <option value="developer">Developers</option>
                    <option value="tester">Testers</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                        <th className="px-6 py-4 font-medium">Name</th>
                        <th className="px-6 py-4 font-medium">Role</th>
                        <th className="px-6 py-4 font-medium">City</th>
                        <th className="px-6 py-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{user.name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold capitalize text-slate-700 ring-1 ring-slate-200">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{user.city || 'Not set'}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
                      {filteredAdminUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-sm text-slate-600">No users match this filter yet.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BriefcaseBusiness className="h-5 w-5 text-green-700" />
                      <h2 className="text-2xl font-bold text-slate-900">Job oversight</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Recent paid testing jobs posted by developers.</p>
                  </div>
                  <select
                    value={jobFilter}
                    onChange={(event) => setJobFilter(event.target.value as JobFilter)}
                    className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-green-500"
                  >
                    <option value="all">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="in_review">In review</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                        <th className="px-6 py-4 font-medium">Job</th>
                        <th className="px-6 py-4 font-medium">Developer</th>
                        <th className="px-6 py-4 font-medium">Package</th>
                        <th className="px-6 py-4 font-medium">Total</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminJobs.map((job) => (
                        <tr key={job.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{job.title}</div>
                            <div className="text-sm text-slate-500">{job.category} - {job.platform}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{job.developerName}</div>
                            <div className="text-sm text-slate-500">{job.developerEmail}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">{getTestTypeByKey(job.packageKey).shortLabel} - {job.testersNeeded} testers</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{formatRand(job.totalAmountZar)}</td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${jobStatusClass(job.status)}`}>
                              {job.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredAdminJobs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-sm text-slate-600">No jobs match this filter yet.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-700" />
                    <h2 className="text-2xl font-bold text-slate-900">Report oversight</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Submitted reports, scores, and evidence counts from testers.</p>
                </div>
                <select
                  value={reportFilter}
                  onChange={(event) => setReportFilter(event.target.value as ReportFilter)}
                  className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-green-500"
                >
                  <option value="all">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="changes_requested">Changes requested</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                      <th className="px-6 py-4 font-medium">Report</th>
                      <th className="px-6 py-4 font-medium">Tester</th>
                      <th className="px-6 py-4 font-medium">Score</th>
                      <th className="px-6 py-4 font-medium">Evidence</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminReports.map((report) => (
                      <tr key={report.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{report.jobTitle}</div>
                          <div className="text-sm text-slate-500">{formatDate(report.submittedAt || report.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{report.testerName}</div>
                          <div className="text-sm text-slate-500">{report.testerEmail}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 ring-1 ring-green-100">
                            {report.score === null ? 'Pending' : `${report.score}/100`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {report.bugCount} bugs - {report.videoBugCount} videos
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${reportStatusClass(report.status)}`}>
                            {report.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`/A31/reports/${report.id}`}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Open
                          </a>
                        </td>
                      </tr>
                    ))}
                    {filteredAdminReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-sm text-slate-600">No reports match this filter yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="payouts" className="scroll-mt-24 mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Payout queue</h2>
                    <p className="mt-1 text-sm text-slate-600">Process tester payout requests after verifying approved balance.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100">
                      {overview.pendingPayouts} pending
                    </span>
                    <select
                      value={payoutFilter}
                      onChange={(event) => setPayoutFilter(event.target.value as typeof payoutFilter)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-green-500"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      type="button"
                      onClick={exportPayoutCsv}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                        <th className="px-6 py-4 font-medium">Tester</th>
                        <th className="px-6 py-4 font-medium">Method</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayouts.map((payout) => {
                        const isUpdating = updatingId === payout.id;
                        return (
                          <tr key={payout.id} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-6 py-5">
                              <div className="font-semibold text-slate-900">{payout.testerName}</div>
                              <div className="text-sm text-slate-500">{payout.testerEmail}</div>
                              <div className="mt-1 text-xs text-slate-400">Requested {formatDate(payout.createdAt)}</div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="font-semibold text-slate-900">{payout.method}</div>
                              <div className="text-sm text-slate-500">{payout.details}</div>
                            </td>
                            <td className="px-6 py-5 text-lg font-black text-slate-900">{formatRand(payout.amountZar)}</td>
                            <td className="px-6 py-5">
                              <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${payoutStatusClass(payout.status)}`}>
                                {payout.status}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="mb-3 grid gap-2 sm:min-w-[260px]">
                                <input
                                  value={payoutNotes[payout.id]?.reference || ''}
                                  onChange={(event) => updatePayoutDraft(payout.id, 'reference', event.target.value)}
                                  placeholder="Payment reference"
                                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-green-500"
                                />
                                <input
                                  value={payoutNotes[payout.id]?.note || ''}
                                  onChange={(event) => updatePayoutDraft(payout.id, 'note', event.target.value)}
                                  placeholder="Admin note"
                                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-green-500"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {payout.status === 'pending' ? (
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handlePayoutStatus(payout, 'processing')}
                                    className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
                                  >
                                    Processing
                                  </button>
                                ) : null}
                                {payout.status === 'pending' || payout.status === 'processing' ? (
                                  <a
                                    href="/A31/payouts"
                                    className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Open secure payout
                                  </a>
                                ) : null}
                                {payout.status === 'pending' || payout.status === 'processing' ? (
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handlePayoutStatus(payout, 'failed')}
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                  >
                                    <XCircle className="h-3.5 w-3.5" /> Failed
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredPayouts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-sm leading-6 text-slate-600">
                            No payout requests yet. Once testers request approved earnings, they will appear here.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="security" className="scroll-mt-24 space-y-6">
                <div className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm">
                      <LockKeyhole className="h-6 w-6 text-green-700" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Security model</h2>
                      <p className="mt-1 text-sm text-slate-700">Admin is assigned manually in Supabase.</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                    <div>Only `profiles.role = admin` can access this route.</div>
                    <div>No admin signup button exists on the website.</div>
                    <div>Manager invitations can be added later with limited roles.</div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">Recent admin activity</h2>
                  <div className="mt-4 space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="text-sm font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</div>
                        <div className="mt-1 text-xs text-slate-500">{log.adminName} - {formatDate(log.createdAt)}</div>
                        {log.note ? <div className="mt-2 text-xs leading-5 text-slate-600">{log.note}</div> : null}
                      </div>
                    ))}
                    {activityLogs.length === 0 ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                        No admin activity has been recorded yet.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section id="users" className="scroll-mt-24 mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-2xl font-bold text-slate-900">Recent users</h2>
                <p className="mt-1 text-sm text-slate-600">Newest accounts created on SQUASH.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold capitalize text-slate-700 ring-1 ring-slate-200">
                        {user.role}
                      </span>
                      <span className="text-sm text-slate-500">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                ))}
                {recentUsers.length === 0 ? (
                  <div className="px-6 py-8 text-sm leading-6 text-slate-600">No users found yet.</div>
                ) : null}
              </div>
            </section>
          </div>
        </main>
      </div>

      {confirmPayout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-slate-900">Confirm payout paid</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              You are about to mark {confirmPayout.testerName}'s payout of {formatRand(confirmPayout.amountZar)} as paid.
              Make sure the bank/payment reference is correct before confirming.
            </p>
            <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-slate-700">
              Reference: <span className="font-bold text-slate-900">{payoutNotes[confirmPayout.id]?.reference || 'Missing'}</span>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmPayout(null)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePayoutStatus(confirmPayout, 'paid')}
                className="rounded-2xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}




