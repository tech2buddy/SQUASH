import { ArrowLeft, CalendarDays, FileText, Globe2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from './auth';
import { getCategoryById, type TestCategoryId } from './components/testCategories';
import { getDeveloperJob, type DeveloperJob } from './lib/jobApi';
import { getTestTypeByKey } from './lib/testTypes';
import { getDeveloperJobAttachments, type DeveloperJobAttachment } from './lib/jobAttachmentApi';

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SquashDeveloperJobDetailPage() {
  const { jobId = '' } = useParams();
  const { session } = useAuth();
  const [job, setJob] = useState<DeveloperJob | null>(null);
  const [attachments, setAttachments] = useState<DeveloperJobAttachment[]>([]);
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

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">Loading job...</div>;
  if (error || !job) return <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">{error || 'Job not found.'}</div>;

  const category = getCategoryById(job.category as TestCategoryId);
  const tasks = (job.tasks || '').split('\n').map((task) => task.trim()).filter(Boolean);

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
              <p className="mt-1 text-sm font-semibold text-slate-500">{category.name} · {job.platform}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-green-700">{job.status}</span>
          {job.status === 'draft' ? (
            <Link to={`/post-job?job=${job.id}`} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700">Continue setup</Link>
          ) : null}
        </div>
      </div>

      {job.status === 'draft' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          This draft is private. Complete it now; public activation remains locked until funding is enabled.
        </div>
      ) : null}

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
              <div className="flex items-center gap-3"><Users className="h-4 w-4 text-green-600" /><span>{job.testersNeeded} testers · {getTestTypeByKey(job.packageKey).label}</span></div>
              <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-green-600" /><span>Created {new Date(job.createdAt).toLocaleDateString('en-ZA')}</span></div>
              {job.appUrl ? <a href={job.appUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 font-semibold text-green-700 hover:underline"><Globe2 className="h-4 w-4" /> Open application link</a> : null}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">Job total</div>
            <div className="mt-1 text-3xl font-black text-slate-900">R{job.totalAmountZar.toLocaleString('en-ZA')}</div>
            <div className="mt-2 text-xs text-slate-500">Funding status determines whether this job can become public.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}