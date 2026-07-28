import {
  ArrowRight,
  BriefcaseBusiness,
  CircleHelp,
  Clock3,
  CreditCard,
  Receipt,
  ShieldCheck,
  Wallet,
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
  if (status === 'succeeded') return 'bg-green-50 text-green-700';
  if (status === 'creating' || status === 'pending') return 'bg-amber-50 text-amber-700';
  if (status === 'refunded') return 'bg-sky-50 text-sky-700';
  return 'bg-red-50 text-red-700';
}

function jobStatusLabel(status: DeveloperJob['status']) {
  return status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
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

  // Yoco redirects back here with ?payment=success|cancelled|failed&job=<id>.
  // The webhook (not this redirect) is what actually confirms and activates
  // the job, so on "success" we briefly poll job_payments in case the
  // webhook hasn't landed yet rather than assuming the redirect alone means paid.
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
          // keep polling; a transient read failure shouldn't block the retry loop
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
    Promise.all([
      getDeveloperJobs(session.userId),
      getDeveloperJobPayments(session.userId),
    ])
      .then(([nextJobs, nextPayments]) => {
        if (!mounted) return;
        setJobs(nextJobs);
        setPayments(nextPayments);
        setBillingError('');
      })
      .catch(() => {
        if (!mounted) return;
        setBillingError('Could not load billing records right now.');
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
      <div className="flex min-h-[420px] items-center justify-center px-4 text-center text-sm font-semibold text-slate-600">
        Loading billing records...
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold tracking-wide text-green-700">
            <ShieldCheck className="h-4 w-4" />
            PAYMENT RECORDS
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Billing</h1>
          <p className="mt-2 text-slate-600">Review job budgets and verified payment records.</p>
        </div>
        <div className="hidden text-sm font-medium text-slate-500 md:block">Dashboard &gt; Billing</div>
      </div>

      {billingError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {billingError}
        </div>
      ) : null}

      {redirectBanner ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            redirectBanner.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : redirectBanner.type === 'pending'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {redirectBanner.type === 'success' && 'Payment confirmed — your job is now live.'}
          {redirectBanner.type === 'pending' && 'Payment received. Your job will go live within a few minutes once confirmed.'}
          {redirectBanner.type === 'cancelled' && (
            <span>
              Payment was cancelled.{' '}
              <button type="button" onClick={() => handleCompletePayment(redirectBanner.jobId)} className="underline hover:no-underline">
                Try again
              </button>
            </span>
          )}
          {redirectBanner.type === 'failed' && (
            <span>
              Payment failed.{' '}
              <button type="button" onClick={() => handleCompletePayment(redirectBanner.jobId)} className="underline hover:no-underline">
                Try again
              </button>
            </span>
          )}
        </div>
      ) : null}

      {retryError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {retryError}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          { title: 'Posted job budget', value: formatRands(summary.postedBudget), note: `${jobs.length} job${jobs.length === 1 ? '' : 's'} recorded`, icon: Wallet },
          { title: 'Verified payments', value: formatRands(summary.recordedPaid), note: `${summary.paidCount} confirmed payment${summary.paidCount === 1 ? '' : 's'}`, icon: Receipt },
          { title: 'Private drafts', value: String(summary.draftCount), note: 'Not visible to testers', icon: Clock3 },
          { title: 'Awaiting review', value: String(summary.reviewCount), note: 'Submission review required', icon: CircleHelp },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-600 sm:text-sm">{card.title}</div>
                  <div className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{card.value}</div>
                  <div className="mt-2 text-xs text-slate-500">{card.note}</div>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-green-50 text-green-700">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-2xl font-bold text-slate-900">Payment history</h2>
              <p className="mt-2 text-sm text-slate-600">Only payment attempts stored by the secure payment service appear here.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Job</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length ? payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-6 py-4 text-slate-700">{formatDate(payment.paidAt || payment.createdAt)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{jobNames.get(payment.jobId) || 'Job payment'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{formatRands(payment.amountZar)}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusClasses(payment.status)}`}>
                          {paymentStatusLabel(payment.status)}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">No verified payment records yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-2xl font-bold text-slate-900">Job budgets</h2>
              <p className="mt-2 text-sm text-slate-600">Package values are budgets, not proof that payment occurred.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {jobs.length ? jobs.map((job) => (
                <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <div className="font-semibold text-slate-900">{job.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{job.category}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{jobStatusLabel(job.status)}</span>
                    <span className="font-bold text-slate-900">{formatRands(job.totalAmountZar)}</span>
                    {paymentsEnabled && job.status === 'draft' ? (
                      <button
                        type="button"
                        disabled={retryingJobId === job.id}
                        onClick={() => handleCompletePayment(job.id)}
                        className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        {retryingJobId === job.id ? 'Starting...' : 'Complete payment'}
                      </button>
                    ) : null}
                  </div>
                </div>
              )) : (
                <div className="px-6 py-12 text-center text-sm text-slate-500">No job budgets yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-green-50 text-green-700">
                <CreditCard className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{paymentsEnabled ? 'Online funding' : 'Beta funding setup'}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {paymentsEnabled
                    ? 'A job remains private until its payment is confirmed by the secure payment service.'
                    : 'Online funding is not enabled in this environment. New jobs are saved privately as drafts and no payment is requested.'}
                </p>
              </div>
            </div>
            <Link to="/post-job" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700">
              Prepare a job {paymentsEnabled ? 'for funding' : 'draft'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Operational summary</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span className="inline-flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" />Active jobs</span>
                <span className="font-semibold text-slate-900">{summary.activeCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />Private drafts</span>
                <span className="font-semibold text-slate-900">{summary.draftCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Confirmed payment records</span>
                <span className="font-semibold text-slate-900">{summary.paidCount}</span>
              </div>
            </div>
          </div>

          {summary.reviewCount > 0 ? (
            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Submission review required</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {summary.reviewCount} job{summary.reviewCount === 1 ? '' : 's'} currently require submission review.
              </p>
              <Link to="/developer/reports" className="mt-5 block rounded-2xl bg-white px-5 py-3 text-center font-semibold text-slate-800 ring-1 ring-sky-200 hover:bg-slate-50">
                Review reports
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}