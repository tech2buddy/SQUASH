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
  getAdminPayoutBatches,
  getAdminPayoutQueue,
  prepareFridayPayoutBatch,
  updateAdminPayoutStatus,
  updatePayoutBatchStatus,
  type AdminOverview,
  type AdminPayoutBatch,
  type AdminPayoutRow,
} from './lib/adminApi';
import {
  getAdminBankingQueue,
  getBankingDocumentUrl,
  reviewTesterBanking,
  type AdminBankingSubmission,
  type BankingVerificationStatus,
} from './lib/bankingApi';

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

function nextFridayDate() {
  const date = new Date();
  const days = (5 - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  const [bankingQueue, setBankingQueue] = useState<AdminBankingSubmission[]>([]);
  const [bankingNotes, setBankingNotes] = useState<Record<string, string>>({});
  const [reviewingTesterId, setReviewingTesterId] = useState<string | null>(null);
  const [revealedBanking, setRevealedBanking] = useState<Record<string, boolean>>({});
  const [revealedPayoutBanking, setRevealedPayoutBanking] = useState<Record<string, boolean>>({});
  const [payoutProofs, setPayoutProofs] = useState<Record<string, File | null>>({});
  const [payoutBatches, setPayoutBatches] = useState<AdminPayoutBatch[]>([]);
  const [batchDate, setBatchDate] = useState(nextFridayDate);
  const [updatingBatchId, setUpdatingBatchId] = useState<string | null>(null);

  const loadPayoutData = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, payoutData, bankingData, batchData] = await Promise.all([getAdminOverview(), getAdminPayoutQueue(), getAdminBankingQueue(), getAdminPayoutBatches()]);
      setOverview(overviewData);
      setPayouts(payoutData);
      setBankingQueue(bankingData);
      setPayoutBatches(batchData);
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

  const prepareBatch = async () => {
    setUpdatingBatchId('prepare');
    setError('');
    setNotice('');
    try {
      const batch = await prepareFridayPayoutBatch(batchDate);
      await loadPayoutData();
      setNotice(`Friday batch prepared with ${batch.payoutCount} payout${batch.payoutCount === 1 ? '' : 's'} totalling ${formatRand(batch.totalAmountZar)}.`);
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : 'Could not prepare the Friday payout batch.');
    } finally {
      setUpdatingBatchId(null);
    }
  };

  const changeBatchStatus = async (batch: AdminPayoutBatch, status: Exclude<AdminPayoutBatch['status'], 'open'>) => {
    setUpdatingBatchId(batch.id);
    setError('');
    setNotice('');
    try {
      await updatePayoutBatchStatus(batch.id, status);
      await loadPayoutData();
      setNotice(`The ${formatDate(batch.scheduledFor)} payout batch is now ${status}.`);
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : 'Could not update this payout batch.');
    } finally {
      setUpdatingBatchId(null);
    }
  };
  const openBankingProof = async (submission: AdminBankingSubmission) => {
    const preview = window.open('', '_blank', 'noopener,noreferrer');
    try {
      const url = await getBankingDocumentUrl(submission.proofDocumentPath);
      if (preview) preview.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    } catch (viewError) {
      preview?.close();
      setError(viewError instanceof Error ? viewError.message : 'Could not open the banking document.');
    }
  };

  const handleBankingReview = async (
    submission: AdminBankingSubmission,
    status: Exclude<BankingVerificationStatus, 'pending'>,
  ) => {
    const note = bankingNotes[submission.testerId] || '';
    if (status !== 'approved' && !note.trim()) {
      setError('Add a review note before requesting changes or rejecting banking details.');
      return;
    }
    setReviewingTesterId(submission.testerId);
    setError('');
    setNotice('');
    try {
      await reviewTesterBanking({ testerId: submission.testerId, status, note });
      await loadPayoutData();
      setNotice(`${submission.testerName}'s banking details are now ${status.replace('_', ' ')}.`);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not review banking details.');
    } finally {
      setReviewingTesterId(null);
    }
  };

  const maskedAccount = (accountNumber: string) => `Ending ${accountNumber.slice(-4)}`;
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
      setError('Add an EFT reference before marking this payout as paid.');
      return;
    }
    if (status === 'paid' && !payoutProofs[payout.id]) {
      setError('Upload proof of EFT payment before marking this payout as paid.');
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
        payoutProof: payoutProofs[payout.id] || undefined,
      });
      await loadPayoutData();
      setPayoutProofs((current) => ({ ...current, [payout.id]: null }));
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
      payout.bankingDetails?.accountHolderName || '',
      payout.bankingDetails?.bankName || '',
      payout.bankingDetails?.accountNumber || '',
      payout.bankingDetails?.accountType || '',
      payout.bankingDetails?.branchCode || '',
      payout.amountZar,
      payout.status,
      payout.payoutReference || '',
      payout.scheduledFor || '',
      payout.proofDocumentName || '',
      payout.adminNote || '',
      payout.createdAt,
      payout.processedAt || '',
    ]);
    const csv = [
      ['id', 'tester_name', 'tester_email', 'method', 'details', 'account_holder_name', 'bank_name', 'account_number', 'account_type', 'branch_code', 'amount_zar', 'status', 'reference', 'scheduled_for', 'proof_document', 'admin_note', 'created_at', 'processed_at'],
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
    { label: 'Overview', href: '/A31/dashboard', icon: Home, active: false },
    { label: 'Payout Queue', href: '/A31/payouts', icon: CreditCard, active: true },
    { label: 'Users', href: '/A31/users', icon: Users, active: false },
    { label: 'Jobs', href: '/A31/jobs', icon: FileText, active: false },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole, active: false },
    { label: 'Operations', href: '/A31/operations', icon: ShieldCheck, active: false },
  ];

  const payoutStats = [
    { label: 'Pending Requests', value: overview.pendingPayouts, note: 'Needs admin action', icon: Wallet, bg: 'bg-amber-50', color: 'text-amber-700' },
    { label: 'Pending Total', value: formatRand(overview.pendingPayoutTotalZar), note: 'Waiting to be processed', icon: CreditCard, bg: 'bg-green-50', color: 'text-green-700' },
    { label: 'All Payout Rows', value: payouts.length, note: 'Current queue records', icon: ShieldCheck, bg: 'bg-slate-50', color: 'text-slate-700' },
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
                Money workflow
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Always verify approved tester balance and external payment reference before marking payouts as paid.
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
              <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Friday payout batches</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Group approved tester requests for the Friday EFT run, then lock, process and complete the batch.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="text-xs font-semibold text-slate-600">
                    Payout Friday
                    <input
                      type="date"
                      value={batchDate}
                      onChange={(event) => setBatchDate(event.target.value)}
                      className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-green-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={prepareBatch}
                    disabled={updatingBatchId === 'prepare'}
                    className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {updatingBatchId === 'prepare' ? 'Preparing...' : 'Prepare batch'}
                  </button>
                </div>
              </div>
              <div className="grid gap-4 p-5 xl:grid-cols-2">
                {payoutBatches.map((batch) => {
                  const updating = updatingBatchId === batch.id;
                  return (
                    <article key={batch.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Friday EFT run</div>
                          <div className="mt-1 text-xl font-black text-slate-900">{formatDate(batch.scheduledFor)}</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${batch.status === 'completed' ? 'bg-green-50 text-green-700' : batch.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                          {batch.status}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4">
                        <div>
                          <div className="text-xs text-slate-500">Payouts</div>
                          <div className="mt-1 text-lg font-black text-slate-900">{batch.payoutCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Total</div>
                          <div className="mt-1 text-lg font-black text-slate-900">{formatRand(batch.totalAmountZar)}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {batch.status === 'open' ? (
                          <>
                            <button type="button" disabled={updating || batch.payoutCount === 0} onClick={() => changeBatchStatus(batch, 'locked')} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Lock batch</button>
                            <button type="button" disabled={updating} onClick={() => changeBatchStatus(batch, 'cancelled')} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Cancel</button>
                          </>
                        ) : null}
                        {batch.status === 'locked' ? (
                          <button type="button" disabled={updating} onClick={() => changeBatchStatus(batch, 'processing')} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Start EFT processing</button>
                        ) : null}
                        {batch.status === 'processing' ? (
                          <button type="button" disabled={updating} onClick={() => changeBatchStatus(batch, 'completed')} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Complete batch</button>
                        ) : null}
                        {updating ? <span className="self-center text-xs font-semibold text-slate-500">Updating...</span> : null}
                      </div>
                    </article>
                  );
                })}
                {payoutBatches.length === 0 ? <p className="p-3 text-sm text-slate-600">No Friday payout batches have been prepared yet.</p> : null}
              </div>
            </section>
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-2xl font-bold text-slate-900">Banking verification</h2>
                <p className="mt-1 text-sm text-slate-600">Review EFT details and the supporting document before approving a tester for payouts.</p>
              </div>
              <div className="grid gap-4 p-5 xl:grid-cols-2">
                {bankingQueue.map((submission) => {
                  const reviewing = reviewingTesterId === submission.testerId;
                  const revealed = Boolean(revealedBanking[submission.testerId]);
                  const pendingReview = submission.verificationStatus === 'pending';
                  return (
                    <article key={submission.testerId} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{submission.testerName}</div>
                          <div className="text-sm text-slate-500">{submission.testerEmail}</div>
                          <div className="mt-1 text-xs text-slate-400">Submitted {formatDate(submission.submittedAt)}</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${submission.verificationStatus === 'approved' ? 'bg-green-50 text-green-700' : pendingReview ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {submission.verificationStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <dl className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                        <div><dt className="text-xs text-slate-500">Account holder</dt><dd className="mt-1 font-semibold">{submission.accountHolderName}</dd></div>
                        <div><dt className="text-xs text-slate-500">Bank</dt><dd className="mt-1 font-semibold">{submission.bankName}</dd></div>
                        <div><dt className="text-xs text-slate-500">Account</dt><dd className="mt-1 font-mono font-semibold">{revealed ? submission.accountNumber : maskedAccount(submission.accountNumber)}</dd></div>
                        <div><dt className="text-xs text-slate-500">Account type</dt><dd className="mt-1 font-semibold capitalize">{submission.accountType}</dd></div>
                        <div><dt className="text-xs text-slate-500">Branch code</dt><dd className="mt-1 font-mono font-semibold">{submission.branchCode}</dd></div>
                        <div><dt className="text-xs text-slate-500">Document</dt><dd className="mt-1 truncate font-semibold">{submission.proofDocumentName}</dd></div>
                      </dl>
                      {submission.verificationNote ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Previous note: {submission.verificationNote}</p> : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setRevealedBanking((current) => ({ ...current, [submission.testerId]: !revealed }))} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          {revealed ? 'Hide account' : 'Reveal account'}
                        </button>
                        <button type="button" onClick={() => openBankingProof(submission)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">View proof</button>
                      </div>
                      {pendingReview ? (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <textarea value={bankingNotes[submission.testerId] || ''} onChange={(event) => setBankingNotes((current) => ({ ...current, [submission.testerId]: event.target.value }))} rows={2} placeholder="Review note (required for rejection or changes)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-green-500" />
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" disabled={reviewing} onClick={() => handleBankingReview(submission, 'approved')} className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">Approve</button>
                            <button type="button" disabled={reviewing} onClick={() => handleBankingReview(submission, 'changes_required')} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50">Request changes</button>
                            <button type="button" disabled={reviewing} onClick={() => handleBankingReview(submission, 'rejected')} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Reject</button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
                {bankingQueue.length === 0 ? <p className="p-3 text-sm text-slate-600">No banking submissions yet.</p> : null}
              </div>
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
                              {payout.scheduledFor ? <div className="mt-1 text-xs font-semibold text-green-700">Scheduled Friday: {formatDate(payout.scheduledFor)}</div> : null}
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-semibold text-slate-900">{payout.method}</div>
                            {payout.bankingDetails ? (
                              <div className="mt-1 space-y-1 text-xs text-slate-600">
                                <div>{payout.bankingDetails.accountHolderName} - {payout.bankingDetails.bankName}</div>
                                <div className="font-mono font-semibold text-slate-800">
                                  {revealedPayoutBanking[payout.id] ? payout.bankingDetails.accountNumber : maskedAccount(payout.bankingDetails.accountNumber)}
                                </div>
                                <div>{payout.bankingDetails.accountType} - branch {payout.bankingDetails.branchCode}</div>
                                <button type="button" onClick={() => setRevealedPayoutBanking((current) => ({ ...current, [payout.id]: !current[payout.id] }))} className="font-bold text-green-700 hover:text-green-800">
                                  {revealedPayoutBanking[payout.id] ? 'Hide account' : 'Reveal account'}
                                </button>
                              </div>
                            ) : <div className="text-sm text-slate-500">{payout.details}</div>}
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
                              {payout.status === 'pending' || payout.status === 'processing' ? (
                                <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                                  {payoutProofs[payout.id]?.name || 'Upload EFT proof (PDF, PNG or JPEG)'}
                                  <input type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={(event) => setPayoutProofs((current) => ({ ...current, [payout.id]: event.target.files?.[0] || null }))} />
                                </label>
                              ) : payout.proofDocumentName ? <div className="text-xs font-semibold text-green-700">Proof: {payout.proofDocumentName}</div> : null}
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
              Reference: <span className="font-bold text-slate-900">{payoutNotes[confirmPayout.id]?.reference || 'Missing'}</span><br />
              Proof: <span className="font-bold text-slate-900">{payoutProofs[confirmPayout.id]?.name || 'Missing'}</span>
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
