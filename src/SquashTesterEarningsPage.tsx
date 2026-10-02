import {
  BadgeCheck,
  Banknote,
  Clock3,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';



import { useAuth } from './auth';
import { getTesterEarningsSummary, requestTesterPayout, type TesterEarningsSummary } from './lib/jobApi';
import { sendTransactionalEmail } from './lib/emailApi';

export default function SquashTesterEarningsPage() {
  const { session } = useAuth();
  
  const isRealAccount = true;
  const [earningsSummary, setEarningsSummary] = useState<TesterEarningsSummary | null>(null);
  const [earningsError, setEarningsError] = useState('');
  const [payoutNotice, setPayoutNotice] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!session?.userId) return;

    let mounted = true;
    setEarningsError('');
    getTesterEarningsSummary(session.userId)
      .then((summary) => {
        if (mounted) setEarningsSummary(summary);
      })
      .catch((error: Error) => {
        if (mounted) setEarningsError(error.message || 'Could not load earnings right now.');
      })
      .finally(() => {
        if (mounted) setIsLoadingData(false);
      });

    return () => {
      mounted = false;
    };
  }, [("supabase"), session?.userId]);

  const formatRand = (amount: number) => `R${amount.toLocaleString('en-ZA')}`;
  const liveTransactions = useMemo(() => {
    if (!earningsSummary) return null;
    return [
      ...earningsSummary.earnings.filter((item) => item.status === 'approved' || item.status === 'paid').map((item) => ({
        date: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending date',
        type: 'Test earning',
        description: item.jobTitle,
        amount: formatRand(item.amountZar),
        status:
          item.status === 'pending'
            ? 'Pending'
            : item.status === 'approved'
              ? 'Approved'
              : item.status === 'paid'
                ? 'Paid'
                : item.status === 'changes_requested'
                  ? 'Action Needed'
                  : 'Rejected',
      })),
      ...earningsSummary.payouts.map((item) => ({
        date: new Date(item.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
        type: 'Payout request',
        description: 'Manual payout request',
        amount: `-${formatRand(item.amountZar)}`,
        status: item.status === 'paid' ? 'Paid' : item.status === 'processing' ? 'Approved' : 'Pending',
      })),
    ].slice(0, 8);
  }, [earningsSummary]);

  const handleRequestPayout = async () => {
    if (!session?.userId) {
      setPayoutNotice('Please log in with a real tester account to request payout.');
      return;
    }
    const amount = earningsSummary?.availableBalanceZar || 0;
    if (amount <= 0) {
      setPayoutNotice('No approved balance available for payout yet.');
      return;
    }

    setRequestingPayout(true);
    setPayoutNotice('');
    try {
      const payout = await requestTesterPayout(session.userId, amount);
      const refreshed = await getTesterEarningsSummary(session.userId);
      setEarningsSummary(refreshed);
      setPayoutNotice(`Payout request created for ${formatRand(amount)}. Admin processing comes next.`);
      
      // Delivery is server-authorized and derived from the payout record.
      if (payout?.id) {
        sendTransactionalEmail({ type: 'payout_requested', payoutId: payout.id })
          .catch(err => console.error('Failed to send payout notification email:', err));
      }
      
    } catch (error) {
      setPayoutNotice(error instanceof Error ? error.message : 'Could not request payout right now.');
    } finally {
      setRequestingPayout(false);
    }
  };


  

  const approvedThisMonthZar = earningsSummary?.earnings
    .filter((item) => {
      if (item.status !== 'approved' && item.status !== 'paid') return false;
      if (!item.submittedAt) return false;
      const submitted = new Date(item.submittedAt);
      const now = new Date();
      return submitted.getFullYear() === now.getFullYear() && submitted.getMonth() === now.getMonth();
    })
    .reduce((total, item) => total + item.amountZar, 0) || 0;

  const summaryCards = [
    {
      title: 'Available Balance',
      value: earningsSummary ? formatRand(earningsSummary.availableBalanceZar) : isRealAccount ? 'R0' : 'R3,250',
      note: 'Eligible for Friday EFT after review',
      icon: Wallet,
      iconBg: 'bg-[#1d1d1f]',
      iconColor: 'text-white',
    },
    {
      title: 'Pending Payout',
      value: earningsSummary ? formatRand(earningsSummary.pendingPayoutZar) : isRealAccount ? 'R0' : 'R620',
      note: 'Requested and awaiting admin processing',
      icon: Clock3,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
    },
    {
      title: 'Approved This Month',
      value: earningsSummary ? formatRand(approvedThisMonthZar) : isRealAccount ? 'R0' : 'R1,120',
      note: 'Developer-approved test earnings only',
      icon: Banknote,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-700',
    },
    {
      title: 'Lifetime Earned',
      value: earningsSummary ? formatRand(earningsSummary.lifetimeApprovedZar) : isRealAccount ? 'R0' : 'R8,740',
      note: isRealAccount ? 'Approved work over time' : 'Since May 2025',
      icon: BadgeCheck,
      iconBg: 'bg-[#1d1d1f]',
      iconColor: 'text-white',
    },
  ];

  const transactions = [
    { date: '22 May 2025', type: 'Test earning', description: 'FoodOrder Web Platform', amount: 'R400', status: 'Approved' },
    { date: '20 May 2025', type: 'Test earning', description: 'FitTrack Mobile App', amount: 'R250', status: 'Pending' },
    { date: '18 May 2025', type: 'Test earning', description: 'HealthHub Web', amount: 'R370', status: 'Pending' },
    { date: '10 May 2025', type: 'Payout', description: 'Bank Transfer (EFT)', amount: '-R450', status: 'Paid' },
    { date: '05 May 2025', type: 'Test earning', description: 'ShopEase iOS App', amount: 'R350', status: 'Paid' },
  ];

  if (isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading earnings data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Quiet Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#E7E7E5]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#181817]">Earnings & Payouts</h1>
          <p className="mt-0.5 text-xs text-[#666663]">
            Track approved test earnings, pending approvals, and payout history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRequestPayout}
            disabled={requestingPayout}
            className="squash-btn-primary"
          >
            {requestingPayout ? 'Processing...' : 'Request Payout'}
          </button>
          <a href="/tester-jobs" className="squash-btn-secondary">
            Find Tests
          </a>
        </div>
      </div>

      {earningsError ? (
        <div className="p-3 rounded-md bg-[#FDECEC] border border-[#C95050]/20 text-xs text-[#C95050] font-medium">
          {earningsError}
        </div>
      ) : null}
      {payoutNotice ? (
        <div className="p-3 rounded-md bg-[#EAF7EF] border border-[#238554]/20 text-xs text-[#238554] font-medium">
          {payoutNotice}
        </div>
      ) : null}

      {/* Summary Cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="squash-panel p-3.5 h-[88px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#666663]">{card.title}</span>
                <Icon className="h-3.5 w-3.5 text-[#92928E]" />
              </div>
              <div>
                <div className="text-xl font-semibold text-[#181817] leading-none">{card.value}</div>
                <div className="mt-1 text-[11px] text-[#92928E]">{card.note}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Transactions & Details */}
      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="squash-panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E7E5] bg-[#FAFAF9]">
            <h2 className="text-sm font-semibold text-[#181817]">Transaction History</h2>
            <span className="text-xs text-[#666663]">Recent activity</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="squash-table-header">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(liveTransactions || transactions).map((item, idx) => (
                  <tr key={`${item.date}-${idx}`} className="squash-table-row">
                    <td className="px-4 py-2.5 text-[#666663] text-xs">{item.date}</td>
                    <td className="px-4 py-2.5 text-[#181817] text-xs font-medium">{item.type}</td>
                    <td className="px-4 py-2.5 text-[#181817] text-xs font-medium max-w-[200px] truncate">{item.description}</td>
                    <td className={`px-4 py-2.5 text-xs font-semibold ${item.amount.startsWith('-') ? 'text-[#C95050]' : 'text-[#181817]'}`}>
                      {item.amount}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`squash-status-pill ${
                        item.status === 'Approved' || item.status === 'Paid'
                          ? 'squash-status-success'
                          : item.status === 'Pending' || item.status === 'Awaiting review'
                          ? 'squash-status-warning'
                          : 'squash-status-error'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="squash-panel p-4 space-y-3">
            <h2 className="text-xs font-semibold text-[#181817] uppercase tracking-wider">Payout Method</h2>
            <div className="p-3 rounded-md bg-[#F7F7F6] border border-[#E7E7E5] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#181817]">Bank Transfer (EFT)</span>
                <span className="squash-status-pill squash-status-success !text-[9px] !h-4">Verified</span>
              </div>
              <p className="text-[11px] text-[#666663]">Friday weekly EFT payouts directly to South African banks.</p>
            </div>
            <a href="/tester/payout-method" className="block text-xs font-medium text-[#666663] hover:text-[#181817]">
              Manage Banking Details →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
