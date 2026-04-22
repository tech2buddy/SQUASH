import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

type PublicPage = 'home' | 'developers' | 'testers' | 'pricing';

export default function PublicHeader({ active }: { active?: PublicPage }) {
  const navItem = (href: string, label: string, page: PublicPage) => (
    <Link
      to={href}
      className={`relative pb-1 text-sm font-semibold transition ${
        active === page ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {label}
      <span
        className={`absolute -bottom-0.5 left-0 h-0.5 rounded-full bg-green-600 transition-all ${
          active === page ? 'w-full opacity-100' : 'w-0 opacity-0'
        }`}
      />
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/squash-logo.png"
            alt="SQUASH logo"
            className="h-10 w-10 rounded-2xl border border-slate-200 object-cover shadow-sm"
          />
          <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900">SQUASH</div>
            <div className="text-xs text-slate-500">Source Quality User Assurance Solutions Here</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItem('/#how-it-works', 'How It Works', 'home')}
          {navItem('/for-developers', 'For Developers', 'developers')}
          {navItem('/for-testers', 'For Testers', 'testers')}
          {navItem('/pricing', 'Pricing', 'pricing')}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Log in
          </Link>
          <Link
            to="/post-job"
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-600"
          >
            Post a Job
          </Link>
          <Link
            to="/tester-jobs"
            className="rounded-xl border border-green-500 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
          >
            Become a Tester
          </Link>
        </div>

        <button
          type="button"
          aria-label="Open menu"
          className="rounded-xl border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-50 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
