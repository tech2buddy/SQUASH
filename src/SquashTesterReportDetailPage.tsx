import { ArrowLeft, CalendarDays, Camera, CheckCircle2, Clock3, ExternalLink, FileWarning, UploadCloud, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { useAuth } from './auth';
import { attachEvidenceToBugReport, getTesterSubmissionDetails, type DeveloperSubmissionDetails } from './lib/jobApi';
import { getSignedUrl, listTesterJobEvidence, uploadBugReportFile, type TesterJobEvidence } from './lib/storageApi';

type EvidenceLinks = Record<string, { screenshot?: string; video?: string }>;

function formatDate(value: string | null) {
  if (!value) return 'Not submitted yet';
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

function statusStyles(status: DeveloperSubmissionDetails['status']) {
  if (status === 'approved') return 'border-green-200 bg-green-50 text-green-700';
  if (status === 'changes_requested') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (status === 'rejected') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function statusLabel(status: DeveloperSubmissionDetails['status']) {
  if (status === 'changes_requested') return 'Changes requested';
  if (status === 'submitted') return 'Pending review';
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export default function SquashTesterReportDetailPage() {
  const { submissionId } = useParams();
  const { session } = useAuth();
  const [report, setReport] = useState<DeveloperSubmissionDetails | null>(null);
  const [evidence, setEvidence] = useState<EvidenceLinks>({});
  const [galleryEvidence, setGalleryEvidence] = useState<TesterJobEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingBugId, setUploadingBugId] = useState('');
  const [uploadNotice, setUploadNotice] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<TesterJobEvidence | null>(null);

  useEffect(() => {
    if (!submissionId || !session?.userId) return;
    const selectedSubmissionId = submissionId;
    const testerId = session.userId;
    let mounted = true;

    const loadReport = async () => {
      setLoading(true);
      setError('');
      try {
        const details = await getTesterSubmissionDetails(selectedSubmissionId, testerId);
        if (!mounted) return;
        if (!details) {
          setError('This report could not be found or does not belong to your account.');
          return;
        }
        setReport(details);
        const entries = await Promise.all(details.bugs.map(async (bug) => {
          const links: { screenshot?: string; video?: string } = {};
          if (bug.screenshotPath) {
            const result = await getSignedUrl(bug.screenshotPath, 'screenshot');
            if (result.url) links.screenshot = result.url;
          }
          if (bug.videoPath) {
            const result = await getSignedUrl(bug.videoPath, 'video');
            if (result.url) links.video = result.url;
          }
          return [bug.id, links] as const;
        }));
        const storedEvidence = await listTesterJobEvidence(details.testerId, details.jobId);
        if (mounted) {
          setEvidence(Object.fromEntries(entries));
          setGalleryEvidence(storedEvidence);
        }
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Could not load this report.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadReport();
    return () => { mounted = false; };
  }, [session?.userId, submissionId]);

  const handleAttachEvidence = async (bugId: string, file: File) => {
    if (!report || !session?.userId) return;
    const type = file.type.startsWith('image/') ? 'screenshot' : file.type.startsWith('video/') ? 'video' : null;
    if (!type) {
      setUploadNotice('Choose a PNG, JPEG, WebP, MP4, or WebM file.');
      return;
    }

    setUploadingBugId(bugId);
    setUploadNotice('');
    try {
      const upload = await uploadBugReportFile(file, type, session.userId, report.jobId);
      if (upload.error || !upload.path) throw new Error(upload.error || 'Evidence upload did not return a file path.');
      await attachEvidenceToBugReport({ bugId, testerId: session.userId, type, path: upload.path });

      setReport((current) => current ? {
        ...current,
        bugs: current.bugs.map((bug) => bug.id === bugId
          ? { ...bug, ...(type === 'screenshot' ? { screenshotPath: upload.path } : { videoPath: upload.path }) }
          : bug),
      } : current);
      const refreshedEvidence = await listTesterJobEvidence(session.userId, report.jobId);
      setGalleryEvidence(refreshedEvidence);
      setUploadNotice(`${type === 'screenshot' ? 'Screenshot' : 'Video'} attached to the report successfully.`);
    } catch (uploadError) {
      setUploadNotice(uploadError instanceof Error ? uploadError.message : 'Could not attach this evidence.');
    } finally {
      setUploadingBugId('');
    }
  };

  if (loading) {
    return <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white text-sm font-semibold text-slate-500">Loading report details...</div>;
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <FileWarning className="mx-auto h-10 w-10 text-slate-400" />
        <h1 className="mt-4 text-xl font-black text-slate-900">Report unavailable</h1>
        <p className="mt-2 text-sm text-slate-600">{error || 'This report is unavailable.'}</p>
        <Link to="/tester/reports" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Back to reports</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/tester/reports" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to reports
      </Link>

      <section className="apple-bento-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{report.jobPlatform}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusStyles(report.status)}`}>{statusLabel(report.status)}</span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{report.jobTitle}</h1>
            <p className="mt-2 text-sm text-slate-500">Your submitted test report and supporting evidence.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
            <CalendarDays className="mr-2 inline h-4 w-4" /> {formatDate(report.submittedAt || report.createdAt)}
          </div>
        </div>
      </section>

      {uploadNotice ? (
        <section className={`rounded-2xl border p-4 text-sm font-semibold ${uploadNotice.includes('successfully') ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          {uploadNotice}
        </section>
      ) : null}

      {report.status === 'changes_requested' ? (
        <section className="rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900">
          <strong>Changes were requested.</strong> Open the active test to update the requested details and resubmit.
          <Link to="/active-test" className="ml-2 font-extrabold underline">Continue test</Link>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="apple-bento-card p-6">
            <h2 className="text-lg font-bold text-slate-900">Final testing notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{report.summary || 'No final summary was provided.'}</p>
          </section>

          <section className="apple-bento-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Uploaded evidence</h2>
                <p className="mt-1 text-xs text-slate-500">Screenshots and videos submitted for this test.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">{galleryEvidence.length}</span>
            </div>
            {galleryEvidence.length > 0 ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {galleryEvidence.map((item) => (
                  <figure key={`${item.type}-${item.path}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                    {item.type === 'screenshot' ? (
                      <button type="button" onClick={() => setSelectedEvidence(item)} className="block w-full" aria-label="Open screenshot viewer">
                        <img src={item.url} alt="Uploaded bug evidence" className="h-64 w-full object-contain" />
                      </button>
                    ) : (
                      <video controls preload="metadata" src={item.url} className="h-64 w-full bg-black object-contain">
                        Your browser does not support video playback.
                      </video>
                    )}
                    <figcaption className="flex items-center justify-between gap-3 bg-white px-4 py-3 text-xs font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-2">{item.type === 'screenshot' ? <Camera className="h-4 w-4" /> : <Video className="h-4 w-4" />}{item.type === 'screenshot' ? 'Screenshot' : 'Video evidence'}</span>
                      <button type="button" onClick={() => setSelectedEvidence(item)} className="inline-flex items-center gap-1 font-extrabold text-slate-900 hover:text-green-700">Open <ExternalLink className="h-3 w-3" /></button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                No screenshot or video file is currently linked to this test report.
              </div>
            )}
          </section>

          <section className="apple-bento-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Reported bugs</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">{report.bugs.length}</span>
            </div>
            {report.bugs.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No individual bugs were attached to this submission.</div>
            ) : (
              <div className="mt-5 space-y-4">
                {report.bugs.map((bug, index) => (
                  <article key={bug.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><div className="text-xs font-bold text-slate-400">BUG {index + 1}</div><h3 className="mt-1 font-bold text-slate-900">{bug.title}</h3></div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">{bug.severity}</span>
                    </div>
                    {bug.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{bug.description}</p> : null}
                    {bug.reproductionSteps.length > 0 ? (
                      <div className="mt-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Steps to reproduce</h4>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                          {bug.reproductionSteps.map((step, stepIndex) => <li key={`${bug.id}-${stepIndex}`}>{step}</li>)}
                        </ol>
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {evidence[bug.id]?.screenshot && !galleryEvidence.some((item) => item.path === bug.screenshotPath) ? <a href={evidence[bug.id].screenshot} target="_blank" rel="noreferrer" className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950"><img src={evidence[bug.id].screenshot} alt="Bug screenshot" className="max-h-72 w-full object-contain" /></a> : null}
                      {evidence[bug.id]?.video && !galleryEvidence.some((item) => item.path === bug.videoPath) ? <video controls preload="metadata" src={evidence[bug.id].video} className="max-h-72 w-full rounded-xl border border-slate-200 bg-black">Your browser does not support video playback.</video> : null}
                    </div>
                    {report.status === 'submitted' || report.status === 'changes_requested' || report.status === 'draft' ? (
                      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100">
                        <UploadCloud className="h-4 w-4" />
                        {uploadingBugId === bug.id ? 'Uploading evidence...' : 'Attach screenshot or video'}
                        <input
                          type="file"
                          className="hidden"
                          disabled={Boolean(uploadingBugId)}
                          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0];
                            if (file) void handleAttachEvidence(bug.id, file);
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="apple-bento-card p-5">
            <h2 className="text-sm font-bold text-slate-900">Review status</h2>
            <div className="mt-4 flex items-start gap-3">
              {report.status === 'approved' ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" /> : <Clock3 className="mt-0.5 h-5 w-5 text-amber-500" />}
              <div>
                <div className="text-sm font-extrabold text-slate-900">{statusLabel(report.status)}</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{report.status === 'approved' ? 'This report has been reviewed and approved.' : 'The status will update after the developer reviews your submission.'}</p>
              </div>
            </div>
          </section>
          <section className="apple-bento-card p-5">
            <h2 className="text-sm font-bold text-slate-900">Evidence summary</h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Bugs</dt><dd className="font-extrabold text-slate-900">{report.bugs.length}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Screenshots</dt><dd className="font-extrabold text-slate-900">{Math.max(galleryEvidence.filter((item) => item.type === 'screenshot').length, report.bugs.filter((bug) => bug.screenshotPath).length)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Videos</dt><dd className="font-extrabold text-slate-900">{Math.max(galleryEvidence.filter((item) => item.type === 'video').length, report.bugs.filter((bug) => bug.videoPath).length)}</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      {selectedEvidence ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Evidence viewer"
          onClick={() => setSelectedEvidence(null)}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-black shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950 px-5 py-4 text-white">
              <div className="inline-flex items-center gap-2 text-sm font-bold">
                {selectedEvidence.type === 'screenshot' ? <Camera className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                {selectedEvidence.type === 'screenshot' ? 'Screenshot evidence' : 'Video evidence'}
              </div>
              <button type="button" onClick={() => setSelectedEvidence(null)} className="rounded-full bg-white/10 p-2 transition hover:bg-white/20" aria-label="Close evidence viewer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 sm:p-6">
              {selectedEvidence.type === 'screenshot' ? (
                <img src={selectedEvidence.url} alt="Full-size bug evidence" className="max-h-[78vh] max-w-full object-contain" />
              ) : (
                <video controls autoPlay preload="metadata" src={selectedEvidence.url} className="max-h-[78vh] max-w-full bg-black">
                  Your browser does not support video playback.
                </video>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}