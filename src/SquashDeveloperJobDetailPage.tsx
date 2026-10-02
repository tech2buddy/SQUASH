import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardList, CreditCard, FileText, Globe2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from './auth';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import {
  getDeveloperApplications,
  getDeveloperJob,
  getDeveloperSubmittedReports,
  type DeveloperJob,
} from './lib/jobApi';
import { getJobPaymentStatus } from './lib/paymentApi';
import { testerPayoutForJob } from './lib/pricing';
import { getTestTypeByKey } from './lib/testTypes';
import { getDeveloperJobAttachments, type DeveloperJobAttachment } from './lib/jobAttachmentApi';

type JobActivity = {
  applicationsTotal: number;
  pending: number;
  accepted: number;
  submitted: number;
  approved: number;
};

type PaymentState = { status: string; paidAt: string | null } | null;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function paymentBadge(status: string) {
  if (status === 'succeeded') return { label: 'Paid', className: 'bg-[#f5f5f7] text-[#1d1d1f] border border-black/10' };
  if (status === 'pending' || status === 'creating') return { label: 'Awaiting payment', className: 'bg-amber-100 text-amber-800' };
  if (status === 'refunded') return { label: 'Refunded', className: 'bg-sky-100 text-sky-800' };
  return { label: 'Payment failed', className: 'bg-red-100 text-red-700' };
}

export default function SquashDeveloperJobDetailPage() {
  const { jobId = '' } = useParams();
  const { session } = useAuth();
  const [job, setJob] = useState<DeveloperJob | null>(null);
  const [attachments, setAttachments] = useState<DeveloperJobAttachment[]>([]);
  const [activity, setActivity] = useState<JobActivity | null>(null);
  const [payment, setPayment] = useState<PaymentState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attachmentError, setAttachmentError] = useState('');

  useEffect(() => {
    if (!jobId || !session?.userId) return;
    let active = true;
    setLoading(true);
    getDeveloperJob(jobId, session.userId)
      .then((item) => {
        if (!active) return;
        if (!item) throw new Error('Job not found or access denied.');
        setJob(item);
        return getDeveloperJobAttachments(item.id)
          .then((files) => {
            if (active) setAttachments(files);
          })
          .catch((attachmentLoadError: Error) => {
            if (active) setAttachmentError(attachmentLoadError.message || 'Attachments could not be loaded.');
          });
      })
      .catch((loadError: Error) => {
        if (active) setError(loadError.message || 'This job could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [jobId, session?.userId]);

  // Activity and payment are secondary: a failure here should leave the job
  // detail readable rather than blanking the whole page.
  useEffect(() => {
    if (!jobId || !session?.userId) return;
    let active = true;

    Promise.all([
      getDeveloperApplications(session.userId),
      getDeveloperSubmittedReports(session.userId),
    ])
      .then(([applications, reports]) => {
        if (!active) return;
        const jobApplications = applications.filter((application) => application.jobId === jobId);
        const jobReports = reports.filter((report) => report.jobId === jobId);
        setActivity({
          applicationsTotal: jobApplications.length,
          pending: jobApplications.filter((application) => application.status === 'pending').length,
          accepted: jobApplications.filter((application) => application.status === 'accepted').length,
          submitted: jobReports.filter((report) => report.status === 'submitted').length,
          approved: jobReports.filter((report) => report.status === 'approved').length,
        });
      })
      .catch(() => {
        if (active) setActivity(null);
      });

    getJobPaymentStatus(jobId)
      .then((result) => {
        if (active && result) setPayment({ status: result.status, paidAt: result.paid_at });
      })
      .catch(() => {
        if (active) setPayment(null);
      });

    return () => {
      active = false;
    };
  }, [jobId, session?.userId]);

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">Loading job...</div>;
  if (error || !job) return <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">{error || 'Job not found.'}</div>;

  const category = getCategoryById(job.category as TestCategoryId);
  const testType = getTestTypeByKey(job.packageKey);
  const tasks = (job.tasks || '').split('\n').map((task) => task.trim()).filter(Boolean);
  const ratePerTester = job.testersNeeded ? Math.round(job.totalAmountZar / job.testersNeeded) : 0;
  const payoutPerTester = testerPayoutForJob(job.totalAmountZar, job.testersNeeded);
  const badge = payment ? paymentBadge(payment.status) : null;

  const stats = [
    { label: 'Applicants', value: activity?.applicationsTotal ?? 0, hint: `${activity?.pending ?? 0} awaiting review`, icon: Users },
    { label: 'Accepted', value: activity?.accepted ?? 0, hint: `of ${job.testersNeeded} slots`, icon: CheckCircle2 },
    { label: 'Reports in', value: activity?.submitted ?? 0, hint: 'awaiting your review', icon: ClipboardList },
    { label: 'Approved', value: activity?.approved ?? 0, hint: 'testers paid for these', icon: FileText },
  ];

  return (
    <div className="developer-page-shell space-y-6">
      <section className="developer-ambient-hero developer-job-detail-hero relative flex flex-col gap-7 overflow-hidden rounded-[28px] border px-6 py-6 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link to="/developer/jobs" className="developer-ambient-eyebrow mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-transform duration-200 hover:-translate-y-0.5">
            <span className="developer-ambient-eyebrow-icon grid h-6 w-6 place-items-center rounded-full">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            Job portfolio
          </Link>
          <div className="flex min-w-0 items-center gap-4">
            {job.logoUrl ? (
              <span className="developer-job-hero-logo shrink-0">
                <img src={job.logoUrl} alt="" className="h-full w-full rounded-[inherit] object-cover" />
              </span>
            ) : (
              <span className="developer-job-hero-logo grid shrink-0 place-items-center text-xl font-extrabold">
                {job.title.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ffc8c3]">Testing workspace</div>
              <h1 className="truncate text-3xl font-extrabold tracking-apple-tight sm:text-4xl">{job.title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold sm:text-sm">
                <span>{category.name}</span>
                <span aria-hidden="true">·</span>
                <span>{job.platform}</span>
                <span aria-hidden="true">·</span>
                <span>{testType.label}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-stretch gap-3 lg:justify-end">
          <div className="developer-ambient-status-card rounded-2xl border px-4 py-3">
            <div className="developer-ambient-status-label text-[9px] font-extrabold uppercase tracking-[0.15em]">Job status</div>
            <div className="developer-ambient-status-value mt-1.5 flex items-center gap-2 text-sm font-extrabold capitalize">
              <span className="h-2 w-2 rounded-full bg-[#5de6ab] shadow-[0_0_12px_rgba(93,230,171,0.7)]" />
              {job.status}
            </div>
          </div>
          {badge ? (
            <div className="developer-ambient-status-card rounded-2xl border px-4 py-3">
              <div className="developer-ambient-status-label text-[9px] font-extrabold uppercase tracking-[0.15em]">Payment</div>
              <div className="developer-ambient-status-value mt-1.5 text-sm font-extrabold">{badge.label}</div>
            </div>
          ) : null}
          {job.status === 'draft' ? (
            <Link to={`/post-job?job=${job.id}`} className="squash-btn-primary self-center">Continue setup</Link>
          ) : null}
        </div>
      </section>

      {job.status === 'draft' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs font-semibold text-amber-900">
          This draft is private and testers cannot see it. It goes live once payment is confirmed.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="apple-interactive-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#86868b]">{stat.label}</div>
                  <div className="mt-1.5 text-2xl font-extrabold text-[#1d1d1f] tracking-tight">{stat.value}</div>
                  <div className="mt-1 truncate text-[11px] text-[#86868b] font-medium">{stat.hint}</div>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#1d1d1f] text-white shadow-2xs">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-5 apple-interactive-card p-6">
          <div>
            <h2 className="text-base font-extrabold text-[#1d1d1f] tracking-tight">Job overview</h2>
            <p className="mt-2 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-[#86868b]">{job.description || 'No description provided.'}</p>
          </div>
          <div className="border-t border-black/[0.06] pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1d1d1f]">Testing tasks</h3>
            {tasks.length ? (
              <ol className="mt-2.5 space-y-2 text-xs sm:text-sm text-[#1d1d1f] font-medium">{tasks.map((task, index) => <li key={`${task}-${index}`}>{index + 1}. {task}</li>)}</ol>
            ) : <p className="mt-2 text-xs text-[#86868b]">No tasks added.</p>}
          </div>
          <div className="border-t border-black/[0.06] pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1d1d1f]">Focus areas</h3>
            <p className="mt-2 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-[#86868b]">{job.focusAreas || 'No focus areas added.'}</p>
          </div>
          {job.additionalInfo ? (
            <div className="border-t border-black/[0.06] pt-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1d1d1f]">Additional information</h3>
              <p className="mt-2 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-[#86868b]">{job.additionalInfo}</p>
            </div>
          ) : null}
          <div className="border-t border-black/[0.06] pt-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1d1d1f]">Attachments</h3>
            <p className="mt-1 text-[11px] text-[#86868b]">Only testers accepted onto this job can open these.</p>
            {attachmentError ? <p className="mt-2 text-xs font-bold text-red-600">{attachmentError}</p> : attachments.length ? (
              <div className="mt-3 space-y-2">{attachments.map((file) => (
                <a key={file.id} href={file.downloadUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 px-3.5 py-3 text-xs font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition">
                  <span className="flex min-w-0 items-center gap-2.5"><FileText className="h-4 w-4 shrink-0 text-[#e63946]" /><span className="truncate">{file.fileName}</span></span>
                  <span className="ml-3 shrink-0 text-[11px] text-[#86868b] font-normal">{formatBytes(file.fileSize)}</span>
                </a>
              ))}</div>
            ) : <p className="mt-2 text-xs text-[#86868b]">No attachments added.</p>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="apple-interactive-card p-6">
            <h2 className="text-base font-extrabold text-[#1d1d1f] tracking-tight">Job details</h2>
            <div className="mt-4 space-y-3.5 text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-3 text-[#1d1d1f]"><Users className="h-4 w-4 shrink-0 text-[#e63946]" /><span>{job.testersNeeded} testers · {testType.label}</span></div>
              <div className="flex items-center gap-3 text-[#1d1d1f]"><CalendarDays className="h-4 w-4 shrink-0 text-[#e63946]" /><span>Created {new Date(job.createdAt).toLocaleDateString('en-ZA')}</span></div>
              {payment?.paidAt ? (
                <div className="flex items-center gap-3 text-[#1d1d1f]"><CreditCard className="h-4 w-4 shrink-0 text-[#e63946]" /><span>Paid {new Date(payment.paidAt).toLocaleDateString('en-ZA')}</span></div>
              ) : null}
              {job.appUrl ? (
                <a href={job.appUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 font-bold text-[#e63946] hover:underline pt-1">
                  <Globe2 className="h-4 w-4 shrink-0" /> <span className="truncate">Open the app being tested</span>
                </a>
              ) : null}
            </div>
          </div>

          <div className="apple-interactive-card p-6">
            <div className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Job total</div>
            <div className="mt-1 text-3xl font-extrabold text-[#1d1d1f] tracking-tight">R{job.totalAmountZar.toLocaleString('en-ZA')}</div>
            <div className="mt-4 space-y-2 border-t border-black/[0.06] pt-4 text-xs font-medium">
              <div className="flex items-center justify-between text-[#86868b]">
                <span>Rate per tester</span>
                <span className="font-bold text-[#1d1d1f]">R{ratePerTester.toLocaleString('en-ZA')}</span>
              </div>
              <div className="flex items-center justify-between text-[#86868b]">
                <span>Testers</span>
                <span className="font-bold text-[#1d1d1f]">{job.testersNeeded}</span>
              </div>
              <div className="flex items-center justify-between text-[#86868b]">
                <span>Each tester earns</span>
                <span className="font-bold text-[#1d1d1f]">R{payoutPerTester.toLocaleString('en-ZA')}</span>
              </div>
            </div>
          </div>

          <div className="apple-interactive-card p-6">
            <h2 className="text-base font-extrabold text-[#1d1d1f] tracking-tight">Manage</h2>
            <div className="mt-3.5 space-y-2 text-xs font-semibold">
              <Link to="/developer/applications" className="flex items-center justify-between rounded-full border border-black/10 bg-[#f5f5f7] px-4 py-2.5 text-[#1d1d1f] hover:bg-slate-200 transition">
                Review applicants
                {activity?.pending ? (
                  <span className="rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-[#e63946]">{activity.pending}</span>
                ) : null}
              </Link>
              <Link to="/developer/reports" className="flex items-center justify-between rounded-full border border-black/10 bg-[#f5f5f7] px-4 py-2.5 text-[#1d1d1f] hover:bg-slate-200 transition">
                Review reports
                {activity?.submitted ? (
                  <span className="rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-[#e63946]">{activity.submitted}</span>
                ) : null}
              </Link>
              <Link to="/billing" className="flex items-center justify-between rounded-full border border-black/10 bg-[#f5f5f7] px-4 py-2.5 text-[#1d1d1f] hover:bg-slate-200 transition">
                Billing
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
