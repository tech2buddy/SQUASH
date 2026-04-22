import PublicHeader from './PublicHeader';

export default function SquashInfoPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">{title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
          <p className="mt-8 text-sm text-slate-500">
            This page is now wired and reachable. We can replace this with full production content
            next.
          </p>
        </div>
      </main>
    </div>
  );
}
