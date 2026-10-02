import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  Clock3,
  CreditCard,
  FileText,
  Plus,
  Receipt,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from './auth';
import { getDeveloperJobs, type DeveloperJob } from './lib/jobApi';
import { getDeveloperJobPayments, getJobPaymentStatus, startJobCheckout, type DeveloperJobPayment } from './lib/paymentApi';

const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';

function formatRands(value: number) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function paymentStatusLabel(status: DeveloperJobPayment['status']) {
  if (status === 'succeeded') return 'Paid';
  if (status === 'creating' || status === 'pending') return 'Pending';
  if (status === 'refunded') return 'Refunded';
  if (status === 'cancelled') return 'Cancelled';
  return 'Failed';
}

function paymentStatusClasses(status: DeveloperJobPayment['status']) {
  if (status === 'succeeded') return 'border-[#b9e6d0] bg-[#e8f8ef] text-[#167049]';
  if (status === 'creating' || status === 'pending') return 'border-[#ecd6a6] bg-[#fff7e5] text-[#956018]';
  if (status === 'refunded') return 'border-[#cbdde9] bg-[#edf6fb] text-[#356a87]';
  return 'border-[#ecc9c7] bg-[#fff0ef] text-[#a4423d]';
}

function jobStatusLabel(status: DeveloperJob['status']) {
  return status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function jobStatusClasses(status: DeveloperJob['status']) {
  if (status === 'active') return 'bg-[#e8f8ef] text-[#167049]';
  if (status === 'draft') return 'bg-[#fff7e5] text-[#956018]';
  if (status === 'completed') return 'bg-[#f0edfa] text-[#66549b]';
  return 'bg-[#edf6fb] text-[#356a87]';
}

type RedirectBanner = { type: 'success' | 'pending' | 'cancelled' | 'failed'; jobId: string };

export default function SquashDeveloperBillingPage() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DeveloperJob[]>([]);
  const [payments, setPayments] = useState<DeveloperJobPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingError, setBillingError] = useState('');
  const [redirectBanner, setRedirectBanner] = useState<RedirectBanner | null>(null);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCompletePayment = async (jobId: string) => {
    setRetryingJobId(jobId);
    setRetryError('');
    try {
      const checkoutUrl = await startJobCheckout(jobId);
      window.location.assign(checkoutUrl);
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : 'Unable to start payment right now.');
      setRetryingJobId(null);
    }
  };

  useEffect(() => {
    const paymentParam = searchParams.get('payment');
    const jobId = searchParams.get('job');
    if (!paymentParam || !jobId) return;

    if (paymentParam === 'success') {
      setRedirectBanner({ type: 'pending', jobId });
      let attempts = 0;
      let cancelled = false;
      const poll = async () => {
        attempts += 1;
        try {
          const status = await getJobPaymentStatus(jobId);
          if (status?.status === 'succeeded') {
            if (!cancelled) {
              setRedirectBanner({ type: 'success', jobId });
              setRefreshKey((key) => key + 1);
            }
            return;
          }
        } catch {
          // A transient read failure should not stop payment confirmation polling.
        }
        if (!cancelled && attempts < 6) window.setTimeout(poll, 2000);
      };
      poll();
      navigate('/billing', { replace: true });
      return () => {
        cancelled = true;
      };
    }

    if (paymentParam === 'cancelled' || paymentParam === 'failed') {
      setRedirectBanner({ type: paymentParam, jobId });
      navigate('/billing', { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    let mounted = true;
    if (!session?.userId) {
      setJobs([]);
      setPayments([]);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    Promise.all([getDeveloperJobs(session.userId), getDeveloperJobPayments(session.userId)])
      .then(([nextJobs, nextPayments]) => {
        if (!mounted) return;
        setJobs(nextJobs);
        setPayments(nextPayments);
        setBillingError('');
      })
      .catch(() => {
        if (mounted) setBillingError('Could not load billing records right now.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.userId, refreshKey]);

  const summary = useMemo(() => {
    const paidPayments = payments.filter((payment) => payment.status === 'succeeded');
    return {
      postedBudget: jobs.reduce((sum, job) => sum + Number(job.totalAmountZar || 0), 0),
      recordedPaid: paidPayments.reduce((sum, payment) => sum + payment.amountZar, 0),
      paidCount: paidPayments.length,
      draftCount: jobs.filter((job) => job.status === 'draft').length,
      activeCount: jobs.filter((job) => job.status === 'active').length,
      reviewCount: jobs.filter((job) => job.status === 'in_review').length,
    };
  }, [jobs, payments]);

  const jobNames = useMemo(() => new Map(jobs.map((job) => [job.id, job.title])), [jobs]);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-[1500px] gap-4 pb-10">
        <div className="h-56 animate-pulse rounded-[28px] bg-white/60" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-[22px] bg-white/60" />)}
        </div>
      </div>
    );
  }

  const bannerIcon = redirectBanner?.type === 'success' ? CheckCircle2 : redirectBanner?.type === 'pending' ? Clock3 : XCircle;
  const BannerIcon = bannerIcon;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
      <section className="developer-ambient-hero relative overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(112deg,#e4f0e9_0%,#fffaf6_43%,#f5e9dc_70%,#eac5a8_100%)] px-6 py-7 shadow-[0_24px_70px_rgba(49,43,35,0.11)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#b9773e]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-[#21664c]/15 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="developer-ambient-glass developer-ambient-eyebrow mb-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#4f6258] shadow-sm backdrop-blur-xl">
              <span className="developer-ambient-eyebrow-icon flex h-6 w-6 items-center justify-center rounded-full bg-[#1b533e] text-white"><ShieldCheck className="h-3.5 w-3.5" /></span>
              Secure funding ledger
            </div>
            <h1 className="max-w-2xl text-3xl font-black tracking-[-0.045em] text-[#1d211e] sm:text-4xl">
              Every QA budget,
              <span className="block text-[#286349]">clear and accountable.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5d6660]">Track funded jobs, private drafts and verified payment records without mixing planned budgets with completed transactions.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="developer-ambient-glass developer-ambient-status-card rounded-2xl border border-white/80 bg-white/65 px-5 py-3.5 text-right shadow-sm backdrop-blur-xl">
              <div className="developer-ambient-status-label text-[10px] font-bold uppercase tracking-[0.18em] text-[#77736f]">Verified funding</div>
              <div className="developer-ambient-status-value mt-1 text-lg font-black text-[#173f2f]">{formatRands(summary.recordedPaid)}</div>
            </div>
            <Link to="/post-job" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#173f2f] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(23,63,47,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0f3224]">
              <Plus className="h-4 w-4" /> Create a test job
            </Link>
          </div>
        </div>
      </section>

      {billingError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#f0c5c2] bg-[#fff0ef] px-4 py-3 text-xs font-semibold text-[#9d3935]"><XCircle className="h-4 w-4" />{billingError}</div>
      ) : null}

      {redirectBanner ? (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold ${redirectBanner.type === 'success' ? 'border-[#b9dfca] bg-[#edf8f1] text-[#276348]' : redirectBanner.type === 'pending' ? 'border-[#ecd6a6] bg-[#fff7e5] text-[#956018]' : 'border-[#f0c5c2] bg-[#fff0ef] text-[#9d3935]'}`}>
          <BannerIcon className="h-4 w-4 shrink-0" />
          <span>
            {redirectBanner.type === 'success' ? 'Payment confirmed — your job is now live.' : null}
            {redirectBanner.type === 'pending' ? 'Payment received. Your job will go live once confirmation is complete.' : null}
            {redirectBanner.type === 'cancelled' ? 'Payment was cancelled. ' : null}
            {redirectBanner.type === 'failed' ? 'Payment failed. ' : null}
            {redirectBanner.type === 'cancelled' || redirectBanner.type === 'failed' ? (
              <button type="button" onClick={() => handleCompletePayment(redirectBanner.jobId)} className="font-bold underline underline-offset-2">Try again</button>
            ) : null}
          </span>
        </div>
      ) : null}

      {retryError ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#f0c5c2] bg-[#fff0ef] px-4 py-3 text-xs font-semibold text-[#9d3935]"><XCircle className="h-4 w-4" />{retryError}</div>
      ) : null}

      <section aria-label="Billing summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Committed budget', value: formatRands(summary.postedBudget), note: `${jobs.length} jobs recorded`, icon: Wallet, tint: 'bg-[#e5f2e9] text-[#1d6547]' },
          { title: 'Verified payments', value: formatRands(summary.recordedPaid), note: `${summary.paidCount} confirmed records`, icon: Receipt, tint: 'bg-[#ece9f7] text-[#62508c]' },
          { title: 'Private drafts', value: String(summary.draftCount), note: 'Not visible to testers', icon: Clock3, tint: 'bg-[#fff1dc] text-[#9e621d]' },
          { title: 'Awaiting review', value: String(summary.reviewCount), note: 'Submission action needed', icon: CircleHelp, tint: 'bg-[#f9e8e5] text-[#a24c43]' },
        ].map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <article key={metric.title} className="rounded-[22px] border border-white/90 bg-white/75 p-4 shadow-[0_14px_36px_rgba(39,52,44,0.07)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d8680]">{metric.title}</p><p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#1c221e]">{metric.value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${metric.tint}`}><MetricIcon className="h-4.5 w-4.5" /></span></div>
              <p className="mt-2 text-xs text-[#7a837e]">{metric.note}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[26px] border border-white/90 bg-white/70 shadow-[0_22px_60px_rgba(41,53,46,0.09)] backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-[#dde5df] px-5 py-5 sm:px-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173f2f] text-white"><Receipt className="h-4 w-4" /></span>
              <div><h2 className="text-lg font-black tracking-[-0.025em] text-[#1d241f]">Verified transactions</h2><p className="text-xs text-[#7a837e]">Only records confirmed by the secure payment service appear here.</p></div>
            </div>
            <div className="p-4 sm:p-5">
              {payments.length ? (
                <div className="space-y-2.5">
                  {payments.map((payment) => (
                    <article key={payment.id} className="flex flex-col gap-3 rounded-[18px] border border-[#e0e6e2] bg-white/85 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ef] text-[#245640]"><CreditCard className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-black text-[#202722]">{jobNames.get(payment.jobId) || 'Job payment'}</p><p className="mt-0.5 text-[10px] text-[#858e89]">{formatDate(payment.paidAt || payment.createdAt)}</p></div></div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end"><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${paymentStatusClasses(payment.status)}`}>{paymentStatusLabel(payment.status)}</span><strong className="text-sm text-[#202722]">{formatRands(payment.amountZar)}</strong></div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-[20px] border border-dashed border-[#cfd9d2] bg-[#f7f9f7] text-center"><Receipt className="h-6 w-6 text-[#769083]" /><h3 className="mt-3 text-sm font-black text-[#273029]">No verified payments yet</h3><p className="mt-1 text-xs text-[#7a837e]">Confirmed transactions will appear here.</p></div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-white/90 bg-white/70 shadow-[0_22px_60px_rgba(41,53,46,0.09)] backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-[#dde5df] px-5 py-5 sm:px-6"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9a6331] text-white"><BriefcaseBusiness className="h-4 w-4" /></span><div><h2 className="text-lg font-black text-[#1d241f]">Job funding</h2><p className="text-xs text-[#7a837e]">Planned package values and their current operational status.</p></div></div>
            <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
              {jobs.length ? jobs.map((job) => (
                <article key={job.id} className="rounded-[20px] border border-[#e0e6e2] bg-white/85 p-4">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-black text-[#202722]">{job.title}</h3><p className="mt-1 truncate text-[10px] text-[#838c87]">{job.category}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${jobStatusClasses(job.status)}`}>{jobStatusLabel(job.status)}</span></div>
                  <div className="mt-4 flex items-end justify-between border-t border-[#e4e9e6] pt-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a928d]">Package budget</p><p className="mt-1 text-lg font-black text-[#223129]">{formatRands(job.totalAmountZar)}</p></div>{paymentsEnabled && job.status === 'draft' ? <button type="button" disabled={retryingJobId === job.id} onClick={() => handleCompletePayment(job.id)} className="squash-hover-action rounded-xl bg-[#173f2f] px-3 py-2 text-[10px] font-bold text-white disabled:opacity-60">{retryingJobId === job.id ? 'Starting…' : 'Fund job'}</button> : null}</div>
                </article>
              )) : <div className="col-span-full py-10 text-center text-xs text-[#7a837e]">No job budgets yet.</div>}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[26px] border border-white/90 bg-[linear-gradient(150deg,#173f2f,#245e46)] p-6 text-white shadow-[0_20px_48px_rgba(23,63,47,0.2)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12"><CreditCard className="h-5 w-5" /></span>
            <h2 className="mt-5 text-xl font-black">{paymentsEnabled ? 'Secure online funding' : 'Beta funding setup'}</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">{paymentsEnabled ? 'Jobs remain private until the payment provider confirms funding.' : 'Online funding is disabled here. New jobs stay private and no payment is requested.'}</p>
            <Link to="/post-job" className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-bold text-[#173f2f] transition hover:bg-[#edf5f0]">Prepare a job <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="rounded-[24px] border border-white/90 bg-white/75 p-5 shadow-[0_16px_40px_rgba(41,53,46,0.08)] backdrop-blur-xl">
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#2b6b50]" /><h2 className="text-sm font-black text-[#202722]">Operational snapshot</h2></div>
            <div className="mt-4 space-y-3">
              {[['Active jobs', summary.activeCount], ['Private drafts', summary.draftCount], ['Payment records', summary.paidCount]].map(([label, value]) => <div key={String(label)} className="flex items-center justify-between rounded-xl bg-[#f4f7f5] px-3.5 py-3 text-xs text-[#626d66]"><span>{label}</span><strong className="text-[#202722]">{value}</strong></div>)}
            </div>
          </div>

          {summary.reviewCount > 0 ? (
            <div className="rounded-[24px] border border-[#efd7ba] bg-[#fff7e9] p-5"><h2 className="text-sm font-black text-[#553c25]">Reports need attention</h2><p className="mt-2 text-xs leading-5 text-[#7b624c]">{summary.reviewCount} job{summary.reviewCount === 1 ? '' : 's'} currently require submission review.</p><Link to="/developer/reports" className="mt-4 flex min-h-10 items-center justify-center rounded-xl bg-[#9a6331] text-[11px] font-bold text-white">Review reports</Link></div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
