import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Phone,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';



import { useAuth } from './auth';
import { getTesterEarningsSummary, requestTesterPayout, type TesterEarningsSummary } from './lib/jobApi';
import { sendEmail } from './lib/emailApi';

export default function SquashTesterEarningsPage() {
  const { session } = useAuth();
  
  const isRealAccount = true;
  const [earningsSummary, setEarningsSummary] = useState<TesterEarningsSummary | null>(null);
  const [earningsError, setEarningsError] = useState('');
  const [payoutNotice, setPayoutNotice] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!session?.userId || false) return;

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
      ...earningsSummary.earnings.map((item) => ({
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
    if (!session?.userId || false) {
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
      await requestTesterPayout(session.userId, amount);
      const refreshed = await getTesterEarningsSummary(session.userId);
      setEarningsSummary(refreshed);
      setPayoutNotice(`Payout request created for ${formatRand(amount)}. Admin processing comes next.`);
      
      // Fire-and-forget email notification (don't block the UI if it fails)
      sendEmail({
        to: session.email || 'admin@squashqa.com', // fallback or use the user's email
        subject: `SQUASH Payout Requested: ${formatRand(amount)}`,
        html: `<h2>Payout Requested</h2><p>Your request for <strong>${formatRand(amount)}</strong> has been received and is pending admin approval. It will be processed shortly.</p>`,
      }).catch(err => console.error('Failed to send payout notification email:', err));
      
    } catch (error) {
      setPayoutNotice(error instanceof Error ? error.message : 'Could not request payout right now.');
    } finally {
      setRequestingPayout(false);
    }
  };


  

  const summaryCards = [
    {
      title: 'Available Balance',
      value: earningsSummary ? formatRand(earningsSummary.availableBalanceZar) : isRealAccount ? 'R0' : 'R3,250',
      note: 'Paid to bank within 24hrs of approval',
      icon: Wallet,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-700',
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
      title: 'This Month',
      value: earningsSummary ? formatRand(earningsSummary.pendingApprovalZar) : isRealAccount ? 'R0' : 'R1,120',
      note: 'Waiting for developer approval',
      icon: Banknote,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-700',
    },
    {
      title: 'Lifetime Earned',
      value: earningsSummary ? formatRand(earningsSummary.lifetimeApprovedZar) : isRealAccount ? 'R0' : 'R8,740',
      note: isRealAccount ? 'Approved work over time' : 'Since May 2025',
      icon: BadgeCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
    },
  ];

  const payoutMethods = [
    {
      title: 'Bank Transfer (EFT)',
      detail: isRealAccount ? 'Add your bank details in profile settings' : 'FNB account ending 1234',
      status: isRealAccount ? 'Setup needed' : 'Primary',
      icon: CreditCard,
      active: !isRealAccount,
    },
    {
      title: 'SnapScan',
      detail: isRealAccount ? 'Connect SnapScan when payouts go live' : 'Connected to +27 72 000 1234',
      status: isRealAccount ? 'Available soon' : 'Ready',
      icon: Smartphone,
      active: false,
    },
    {
      title: 'Airtime top-up',
      detail: isRealAccount ? 'Add a prepaid number in profile settings' : 'Vodacom prepaid number saved',
      status: isRealAccount ? 'Setup needed' : 'Ready',
      icon: Phone,
      active: false,
    },
  ];

  const pendingApprovals = earningsSummary
    ? earningsSummary.earnings
        .filter((item) => item.status === 'pending')
        .map((item) => ({
          app: item.jobTitle,
          submitted: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
          amount: formatRand(item.amountZar),
          status: 'Pending',
        }))
    : isRealAccount
      ? []
      : [
          { app: 'FitTrack Mobile App', submitted: '20 May 2025', amount: 'R250', status: 'Pending' },
          { app: 'HealthHub Web', submitted: '18 May 2025', amount: 'R370', status: 'Pending' },
        ];

  const actionNeededReports = earningsSummary?.earnings
    .filter((item) => item.status === 'changes_requested')
    .map((item) => ({
      app: item.jobTitle,
      submitted: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
      amount: formatRand(item.amountZar),
      status: 'Action needed',
    })) || [];

  const transactions = [
    { date: '22 May 2025', type: 'Test earning', description: 'FoodOrder Web Platform', amount: 'R400', status: 'Approved' },
    { date: '20 May 2025', type: 'Test earning', description: 'FitTrack Mobile App', amount: 'R250', status: 'Pending' },
    { date: '18 May 2025', type: 'Test earning', description: 'HealthHub Web', amount: 'R370', status: 'Pending' },
    { date: '10 May 2025', type: 'Payout', description: 'Bank Transfer (EFT)', amount: '-R450', status: 'Paid' },
    { date: '05 May 2025', type: 'Test earning', description: 'ShopEase iOS App', amount: 'R350', status: 'Paid' },
  ];

  const earningsGraphData = useMemo(() => {
    if (!earningsSummary?.earnings || earningsSummary.earnings.length === 0) {
      return {
        monthlyEarnings: [0, 0, 0, 0, 0, 0, 0],
        monthlyLabels: ['-', '-', '-', '-', '-', '-', '-'],
        earningsMax: 100,
        earningsPoints: '0,100 16.6,100 33.3,100 50,100 66.6,100 83.3,100 100,100',
        earningsArea: '0,100 0,100 16.6,100 33.3,100 50,100 66.6,100 83.3,100 100,100 100,100'
      };
    }

    const sorted = [...earningsSummary.earnings].filter(e => e.submittedAt).sort((a, b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime());
    
    let chartData = sorted.slice(-7);
    while (chartData.length < 7) {
      chartData.unshift({ amountZar: 0, submittedAt: chartData[0]?.submittedAt || new Date().toISOString() } as any);
    }
    
    const monthlyEarnings = chartData.map(e => e.amountZar);
    const monthlyLabels = chartData.map(e => new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' }).format(new Date(e.submittedAt!)));
    
    const earningsMax = Math.max(...monthlyEarnings, 100);
    const earningsPoints = monthlyEarnings
      .map((value, index) => {
        const x = (index / (monthlyEarnings.length - 1)) * 100;
        const y = 100 - (value / earningsMax) * 100;
        return `${x},${y}`;
      })
      .join(' ');
    const earningsArea = `0,100 ${earningsPoints} 100,100`;

    return { monthlyEarnings, monthlyLabels, earningsMax, earningsPoints, earningsArea };
  }, [earningsSummary]);

  if (true && isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading earnings data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between animate-fade-up">
              <div>
                <span className="inline-flex rounded-full bg-green-100/80 px-3.5 py-1 text-xs font-extrabold text-green-800">
                  Tester Earnings
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">Earnings & Payouts</h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm font-medium">
                  Track approved test earnings, pending approvals, and payout methods.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href="/tester-jobs"
                  className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition apple-press-effect"
                >
                  Find More Tests
                </a>
                <button
                  type="button"
                  onClick={handleRequestPayout}
                  disabled={requestingPayout}
                  className="rounded-full border border-slate-200/80 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition apple-press-effect disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {requestingPayout ? 'Requesting...' : 'Request Payout'}
                </button>
              </div>
            </div>

            {earningsError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs font-bold text-red-700">
                {earningsError}
              </div>
            ) : null}
            {payoutNotice ? (
              <div className="rounded-2xl border border-green-200 bg-green-50/60 px-4 py-3 text-xs font-bold text-green-800">
                {payoutNotice}
              </div>
            ) : null}

            {/* Apple Bento Box Cards */}
            <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4 animate-fade-up-delayed">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="apple-bento-card p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-slate-500">{card.title}</div>
                        <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{card.value}</div>
                        <div className="mt-1.5 text-xs font-medium text-slate-400">{card.note}</div>
                      </div>
                      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${card.iconBg}`}>
                        <Icon className={`h-4.5 w-4.5 ${card.iconColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Graph + Payout Methods */}
            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="apple-bento-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Earnings Trend</h2>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">Approved and pending tester earnings this month.</p>
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition apple-press-effect">
                    This Month <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <svg viewBox="0 0 100 100" className="h-52 w-full overflow-visible">
                    <defs>
                      <linearGradient id="earningsFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#34c759" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#34c759" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={earningsGraphData.earningsArea} fill="url(#earningsFill)" />
                    <polyline points={earningsGraphData.earningsPoints} fill="none" stroke="#34c759" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                    {earningsGraphData.monthlyEarnings.map((value, index) => {
                      const x = (index / (earningsGraphData.monthlyEarnings.length - 1)) * 100;
                      const y = 100 - (value / earningsGraphData.earningsMax) * 100;
                      return (
                        <circle key={`dot-${index}`} cx={x} cy={y} r="2" fill="#34c759" stroke="#ffffff" strokeWidth="1" />
                      );
                    })}
                  </svg>
                  <div className="mt-3 grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400">
                    {earningsGraphData.monthlyLabels.map((label, i) => (
                      <span key={`label-${i}`}>{label}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="apple-bento-card p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Payout Methods</h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Choose how approved earnings reach you.</p>
                  <div className="mt-4 space-y-3">
                    {payoutMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div
                          key={method.title}
                          className={`rounded-2xl border p-3.5 transition-all ${
                            method.active ? 'border-green-300/80 bg-green-50/60' : 'border-slate-200/80 bg-slate-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-2xs">
                                <Icon className="h-4.5 w-4.5 text-green-700" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{method.title}</div>
                                <div className="text-[11px] text-slate-500 font-medium">{method.detail}</div>
                              </div>
                            </div>
                            <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-green-700 border border-green-200">
                              {method.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <a href="/tester/profile" className="mt-4 block text-xs font-bold text-slate-900 hover:underline">
                  Update Payout Details →
                </a>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-1 h-6 w-6 text-amber-700" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Approval status</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      See what is waiting for developer approval and what needs your update before payout.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {actionNeededReports.map((item) => (
                    <div key={`action-${item.app}`} className="rounded-2xl border border-sky-100 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{item.app}</div>
                          <div className="mt-1 text-sm text-slate-500">Submitted {item.submitted}</div>
                          <a href="/tester/reports" className="mt-2 inline-flex text-sm font-semibold text-sky-700">Update report</a>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900">{item.amount}</div>
                          <div className="mt-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                            {item.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingApprovals.map((item) => (
                    <div key={item.app} className="rounded-2xl border border-amber-100 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{item.app}</div>
                          <div className="mt-1 text-sm text-slate-500">Submitted {item.submitted}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900">{item.amount}</div>
                          <div className="mt-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            {item.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {actionNeededReports.length === 0 && pendingApprovals.length === 0 ? (
                    <div className="rounded-2xl border border-amber-100 bg-white p-4 text-sm leading-6 text-slate-600">
                      Nothing is waiting for approval right now.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Transaction history</h2>
                    <p className="mt-1 text-sm text-slate-600">Recent earnings and payouts.</p>
                  </div>
                  <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    Export
                  </button>
                </div>

                {/* Mobile Cards List */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {(liveTransactions || (isRealAccount ? [] : transactions)).length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      No earnings or payout transactions yet.
                    </div>
                  ) : null}
                  {(liveTransactions || (isRealAccount ? [] : transactions)).map((item) => (
                    <div key={`${item.date}-${item.description}`} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{item.description}</div>
                          <div className="text-xs text-slate-500">{item.date} • {item.type}</div>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === 'Paid'
                              ? 'bg-green-50 text-green-700'
                              : item.status === 'Approved'
                                ? 'bg-sky-50 text-sky-700'
                                : item.status === 'Action Needed'
                                  ? 'bg-sky-50 text-sky-700'
                                  : item.status === 'Rejected'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status === 'Paid' ? <CheckCircle2 className="h-3 w-3" /> : null}
                          {item.status}
                        </span>
                      </div>
                      <div className="flex justify-end pt-1">
                        <span className={`font-black text-sm ${item.amount.startsWith('-') ? 'text-red-600' : 'text-slate-900'}`}>
                          {item.amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Description</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(liveTransactions || (isRealAccount ? [] : transactions)).map((item) => (
                        <tr key={`${item.date}-${item.description}`} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-6 py-4 text-slate-700">{item.date}</td>
                          <td className="px-6 py-4 text-slate-700">{item.type}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">{item.description}</td>
                          <td className={`px-6 py-4 font-semibold ${item.amount.startsWith('-') ? 'text-red-600' : 'text-slate-900'}`}>
                            {item.amount}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status === 'Paid'
                                  ? 'bg-green-50 text-green-700'
                                  : item.status === 'Approved'
                                    ? 'bg-sky-50 text-sky-700'
                                    : item.status === 'Action Needed'
                                      ? 'bg-sky-50 text-sky-700'
                                      : item.status === 'Rejected'
                                        ? 'bg-red-50 text-red-600'
                                        : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {item.status === 'Paid' ? <CheckCircle2 className="h-3 w-3" /> : null}
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(liveTransactions || (isRealAccount ? [] : transactions)).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                            No earnings or payout transactions yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
                    <ShieldCheck className="h-6 w-6 text-green-700" />
                    Your money is handled securely
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                    Approved earnings are sent to your selected payout method within 24 hours. You only see what you earn as a tester.
                  </p>
                </div>
                <a
                  href="/help-center"
                  className="inline-flex justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 font-semibold text-green-700 hover:bg-green-50"
                >
                  Payout Help
                </a>
              </div>
            </section>
    </div>
  );
}
