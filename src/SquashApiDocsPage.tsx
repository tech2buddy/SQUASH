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
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader active="resources" />
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-700 shadow-[0_6px_16px_-6px_rgba(15,23,42,0.35)]">
          <Code2 className="h-7 w-7 text-white" strokeWidth={2} />
        </div>
        <div className="mt-6 inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
          Coming soon
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900">
          Resources are on the way
        </h1>
        <p className="mt-3 max-w-xl text-lg text-slate-600">
          We're building out API access, guides, and integration docs for developers. Check back soon.
        </p>
        <a
          href="/contact"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          Contact us
        </a>
      </main>
      <PublicFooter />
    </div>
  );
}
