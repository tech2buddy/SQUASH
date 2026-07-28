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
  if (status === 'succeeded') return { label: 'Paid', className: 'bg-green-100 text-green-800' };
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/developer/jobs" className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to jobs
          </Link>
          <div className="flex items-center gap-3">
            {job.logoUrl ? <img src={job.logoUrl} alt="" className="h-14 w-14 rounded-2xl border border-slate-200 object-cover" /> : null}
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{job.title}</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">{category.name} · {job.platform} · {testType.label}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-green-700">{job.status}</span>
          {badge ? (
            <span className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide ${badge.className}`}>{badge.label}</span>
          ) : null}
          {job.status === 'draft' ? (
            <Link to={`/post-job?job=${job.id}`} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700">Continue setup</Link>
          ) : null}
        </div>
      </div>

      {job.status === 'draft' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          This draft is private and testers cannot see it. It goes live once payment is confirmed.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-600">{stat.label}</div>
                  <div className="mt-1.5 text-2xl font-black text-slate-900">{stat.value}</div>
                  <div className="mt-1 truncate text-xs text-slate-500">{stat.hint}</div>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-50 text-green-700">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900">Job overview</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{job.description || 'No description provided.'}</p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Testing tasks</h3>
            {tasks.length ? (
              <ol className="mt-3 space-y-2 text-sm text-slate-600">{tasks.map((task, index) => <li key={`${task}-${index}`}>{index + 1}. {task}</li>)}</ol>
            ) : <p className="mt-2 text-sm text-slate-500">No tasks added.</p>}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Focus areas</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{job.focusAreas || 'No focus areas added.'}</p>
          </div>
          {job.additionalInfo ? (
            <div>
              <h3 className="font-bold text-slate-900">Additional information</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{job.additionalInfo}</p>
            </div>
          ) : null}
          <div>
            <h3 className="font-bold text-slate-900">Attachments</h3>
            <p className="mt-1 text-xs text-slate-500">Only testers accepted onto this job can open these.</p>
            {attachmentError ? <p className="mt-2 text-sm font-semibold text-red-600">{attachmentError}</p> : attachments.length ? (
              <div className="mt-3 space-y-2">{attachments.map((file) => (
                <a key={file.id} href={file.downloadUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-sm hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{file.fileName}</span></span>
                  <span className="ml-3 shrink-0 text-xs text-slate-400">{formatBytes(file.fileSize)}</span>
                </a>
              ))}</div>
            ) : <p className="mt-2 text-sm text-slate-500">No attachments added.</p>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Job details</h2>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center gap-3"><Users className="h-4 w-4 shrink-0 text-green-600" /><span>{job.testersNeeded} testers · {testType.label}</span></div>
              <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 shrink-0 text-green-600" /><span>Created {new Date(job.createdAt).toLocaleDateString('en-ZA')}</span></div>
              {payment?.paidAt ? (
                <div className="flex items-center gap-3"><CreditCard className="h-4 w-4 shrink-0 text-green-600" /><span>Paid {new Date(payment.paidAt).toLocaleDateString('en-ZA')}</span></div>
              ) : null}
              {job.appUrl ? (
                <a href={job.appUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 font-semibold text-green-700 hover:underline">
                  <Globe2 className="h-4 w-4 shrink-0" /> <span className="truncate">Open the app being tested</span>
                </a>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Job total</div>
            <div className="mt-1 text-3xl font-black text-slate-900">R{job.totalAmountZar.toLocaleString('en-ZA')}</div>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Rate per tester</span>
                <span className="font-semibold text-slate-900">R{ratePerTester.toLocaleString('en-ZA')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Testers</span>
                <span className="font-semibold text-slate-900">{job.testersNeeded}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Each tester earns</span>
                <span className="font-semibold text-slate-900">R{payoutPerTester.toLocaleString('en-ZA')}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Manage</h2>
            <div className="mt-4 space-y-2">
              <Link to="/developer/applications" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Review applicants
                {activity?.pending ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{activity.pending}</span>
                ) : null}
              </Link>
              <Link to="/developer/reports" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Review reports
                {activity?.submitted ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{activity.submitted}</span>
                ) : null}
              </Link>
              <Link to="/billing" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Billing
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
