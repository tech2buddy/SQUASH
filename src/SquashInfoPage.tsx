import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import { getPublishedPolicyBySlug, type PublicPolicy } from './lib/policyApi';
import { usePageMeta } from './hooks/usePageMeta';

export default function SquashInfoPage({
  title,
  description,
  policySlug,
}: {
  title: string;
  description: string;
  policySlug?: string;
}) {
  const location = useLocation();
  usePageMeta({ title, description, path: location.pathname });

  const [policy, setPolicy] = useState<PublicPolicy | null>(null);

  useEffect(() => {
    let alive = true;

    if (!policySlug) return undefined;

    getPublishedPolicyBySlug(policySlug)
      .then((publishedPolicy) => {
        if (alive) setPolicy(publishedPolicy);
      })
      .catch(() => {
        if (alive) setPolicy(null);
      });

    return () => {
      alive = false;
    };
  }, [policySlug]);

  const pageTitle = policy?.title || title;
  const content = policy?.content || description;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
            {policySlug ? 'SQUASH Policy' : 'SQUASH'}
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900">{pageTitle}</h1>
          {policy ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">{policy.version}</span>
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                Updated {new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(policy.updatedAt))}
              </span>
              {policy.effectiveDate ? (
                <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                  Effective {new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(policy.effectiveDate))}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="mt-6 whitespace-pre-line text-lg leading-8 text-slate-600">{content}</div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
