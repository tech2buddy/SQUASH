import {
  Bell,
  CheckCircle2,
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
  getAdminOverview,
  getAdminPayoutQueue,
  updateAdminPayoutStatus,
  type AdminOverview,
  type AdminPayoutRow,
} from './lib/adminApi';

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

export default function SquashAdminPayoutsPage() {
  const { session } = useAuth();
  const adminName = session?.name || 'Mzwakhe Khosa';
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [payouts, setPayouts] = useState<AdminPayoutRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [payoutFilter, setPayoutFilter] = useState<'all' | AdminPayoutRow['status']>('all');
  const [payoutNotes, setPayoutNotes] = useState<Record<string, { note: string; reference: string }>>({});
  const [confirmPayout, setConfirmPayout] = useState<AdminPayoutRow | null>(null);

  const loadPayoutData = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, payoutData] = await Promise.all([getAdminOverview(), getAdminPayoutQueue()]);
      setOverview(overviewData);
      setPayouts(payoutData);
      setPayoutNotes((current) => {
        const next = { ...current };
        for (const payout of payoutData) {
          next[payout.id] = next[payout.id] || { note: payout.adminNote || '', reference: payout.payoutReference || '' };
        }
        return next;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load payout data right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayoutData();
  }, []);

  const filteredPayouts = payoutFilter === 'all' ? payouts : payouts.filter((payout) => payout.status === payoutFilter);

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
      await loadPayoutData();
      setNotice(`${payout.testerName}'s payout is now ${status}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update payout right now. Have you run supabase/phase6_admin_payout_audit.sql?');
    } finally {
      setUpdatingId(null);
      setConfirmPayout(null);
    }
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

  const navItems = [
    { label: 'Overview', href: '/admin', icon: Home, active: false },
    { label: 'Payout Queue', href: '/admin/payouts', icon: CreditCard, active: true },
    { label: 'Users', href: '/admin/users', icon: Users, active: false },
    { label: 'Jobs', href: '/admin/jobs', icon: FileText, active: false },
    { label: 'Security', href: '/admin/security', icon: LockKeyhole, active: false },
  ];

  const payoutStats = [
    { label: 'Pending Requests', value: overview.pendingPayouts, note: 'Needs admin action', icon: Wallet, bg: 'bg-amber-50', color: 'text-amber-700' },
    { label: 'Pending Total', value: formatRand(overview.pendingPayoutTotalZar), note: 'Waiting to be processed', icon: CreditCard, bg: 'bg-green-50', color: 'text-green-700' },
    { label: 'All Payout Rows', value: payouts.length, note: 'Current queue records', icon: ShieldCheck, bg: 'bg-slate-50', color: 'text-slate-700' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
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
                Money workflow
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Always verify approved tester balance and external payment reference before marking payouts as paid.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <a href="/admin" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                  <Menu className="h-5 w-5" />
                </a>
                <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[340px] lg:min-w-[460px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search payouts, testers, references..." />
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

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                  Admin finance control
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Payout Queue</h1>
                <p className="mt-2 max-w-3xl text-slate-600">
                  Review, process and export tester payout requests from one money-safe workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={loadPayoutData}
                disabled={loading}
                className="w-fit rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? 'Refreshing...' : 'Refresh Payouts'}
              </button>
            </div>

            {error ? <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}
            {notice ? <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{notice}</div> : null}

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              {payoutStats.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-600">{card.label}</div>
                        <div className="mt-2 text-3xl font-black text-slate-900">{card.value}</div>
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
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Payout requests</h2>
                  <p className="mt-1 text-sm text-slate-600">Filter requests, add references, then update status.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => setConfirmPayout(payout)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                                </button>
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
                          No payout requests match this filter yet.
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
