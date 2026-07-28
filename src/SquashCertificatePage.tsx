import { CheckCircle2, Copy, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import SquashCertified from './components/SquashCertified';
import SquashScore, { type SquashScoreBreakdown } from './components/SquashScore';

type CertificateRecord = {
  jobId: string;
  appName: string;
  appLogo?: string;
  testers: number;
  testDate: string;
  certifiedAt: string;
  scores: SquashScoreBreakdown;
};

// TODO: Replace with Supabase query
const CERTIFICATES: CertificateRecord[] = [
  {
    jobId: 'BUG-1247',
    appName: 'FitTrack Mobile',
    testers: 24,
    testDate: '2026-04-10',
    certifiedAt: '2026-04-12',
    appLogo: '/squash-logo.png',
    scores: {
      usability: 84,
      performance: 82,
      onboarding: 79,
      bugSeverity: 85,
      deviceCompatibility: 88,
    },
  },
  {
    jobId: 'PAY-3401',
    appName: 'PayFlow Web App',
    testers: 18,
    testDate: '2026-03-18',
    certifiedAt: '2026-03-20',
    appLogo: '/squash-logo.png',
    scores: {
      usability: 89,
      performance: 86,
      onboarding: 84,
      bugSeverity: 90,
      deviceCompatibility: 88,
    },
  },
];

export default function SquashCertificatePage() {
  const { jobId } = useParams();
  const [copyNotice, setCopyNotice] = useState('');

  const record = useMemo(
    () =>
      CERTIFICATES.find((item) => item.jobId.toLowerCase() === (jobId ?? '').toLowerCase()) ??
      CERTIFICATES[0],
    [jobId],
  );

  const shareUrl = `${window.location.origin}/certificate/${record.jobId}`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="developers" />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={record.appLogo ?? '/squash-logo.png'}
                alt={`${record.appName} logo`}
                className="h-14 w-14 rounded-2xl border border-slate-200 object-cover"
              />
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{record.appName}</h1>
                <p className="text-sm text-slate-500">Certificate ID: {record.jobId}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              Verified by SQUASH - South Africa&apos;s #1 App Testing Platform
            </div>
          </div>

          <div className="mt-6">
            <SquashCertified
              score={Math.round(
                (record.scores.usability +
                  record.scores.performance +
                  record.scores.onboarding +
                  record.scores.bugSeverity +
                  record.scores.deviceCompatibility) /
                  5,
              )}
              testers={record.testers}
              certifiedAt={record.certifiedAt}
            />
          </div>

          <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
            <div>
              <div className="text-slate-500">Number of testers</div>
              <div className="mt-1 text-xl font-black text-slate-900">{record.testers}</div>
            </div>
            <div>
              <div className="text-slate-500">Test date</div>
              <div className="mt-1 text-xl font-black text-slate-900">{record.testDate}</div>
            </div>
            <div>
              <div className="text-slate-500">Shareable URL</div>
              <div className="mt-1 truncate text-sm font-semibold text-slate-700">{shareUrl}</div>
            </div>
          </div>

          <div className="mt-6">
            <SquashScore scores={record.scores} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setCopyNotice('Shareable URL copied.');
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" /> Copy URL
            </button>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              <Share2 className="h-4 w-4" /> Share Certificate
            </a>
          </div>
          {copyNotice ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              {copyNotice}
            </p>
          ) : null}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

