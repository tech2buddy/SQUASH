import { Code2 } from 'lucide-react';
import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import { usePageMeta } from './hooks/usePageMeta';

export default function SquashApiDocsPage() {
  usePageMeta({
    title: 'Resources',
    description: 'API access, guides, and integration docs for SQUASH developers — coming soon.',
    path: '/api-docs',
    noindex: true,
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(230,57,70,0.04),rgba(245,245,247,1))] bg-[#f5f5f7] text-[#1d1d1f]">
      <PublicHeader active="resources" />
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white shadow-2xs">
          <Code2 className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="mt-5 inline-flex rounded-full border border-rose-100 bg-rose-50 px-3.5 py-1 text-xs font-bold text-[#e63946]">
          Coming soon
        </div>
        <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-apple-tight text-[#1d1d1f]">
          Developer Resources & API Specs
        </h1>
        <p className="mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-[#86868b] font-medium">
          We're building out webhook triggers, CI/CD integration plugins, and REST API access for engineering teams.
        </p>
        <a
          href="/for-developers"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e63946] px-6 py-3 text-xs font-semibold text-white shadow-2xs hover:bg-[#d62828] active:scale-98 transition"
        >
          View Developer Overview
        </a>
      </main>
      <PublicFooter />
    </div>
  );
}
