import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import { getPublishedPolicyBySlug, type PublicPolicy } from './lib/policyApi';
import { DEFAULT_POLICIES } from './lib/defaultPolicies';
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

  const defaultPolicy = policySlug ? DEFAULT_POLICIES[policySlug] : null;
  const pageTitle = policy?.title || defaultPolicy?.title || title;
  const content = policy?.content || defaultPolicy?.content || description;
  const version = policy?.version || defaultPolicy?.version || 'v1.0';
  const updatedAt = policy?.updatedAt || defaultPolicy?.updatedAt || null;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
          <div className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 ring-1 ring-green-100">
            {policySlug ? 'SQUASH Official Policy' : 'SQUASH'}
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">{pageTitle}</h1>
          
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">{version}</span>
            {updatedAt ? (
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                Updated {new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(updatedAt))}
              </span>
            ) : null}
            {policy?.effectiveDate ? (
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                Effective {new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(policy.effectiveDate))}
              </span>
            ) : null}
          </div>

          <div className="mt-8 whitespace-pre-line text-base sm:text-lg leading-7 sm:leading-8 text-slate-700 font-normal">
            {content}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
