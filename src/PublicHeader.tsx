import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

type PublicPage = 'home' | 'developers' | 'testers' | 'pricing' | 'about' | 'resources';

export default function PublicHeader({ active }: { active?: PublicPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItem = (href: string, label: string, page: PublicPage) => (
    <Link
      to={href}
      className={`relative py-1 text-xs font-semibold tracking-tight transition-all duration-200 ${
        active === page ? 'text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'
      }`}
    >
      {label}
      {active === page && (
        <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#1d1d1f]" />
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/80 backdrop-blur-2xl transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/squash-logo.png"
            alt="SQUASH logo"
            className="h-9 w-9 rounded-2xl border border-black/10 object-cover shadow-sm transition group-hover:scale-105"
          />
          <div>
            <div className="text-base font-extrabold tracking-apple-tight text-[#1d1d1f]">
              SQUASH
            </div>
            <div className="text-[11px] text-[#86868b] tracking-tight">Quality Assurance</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItem('/#how-it-works', 'Overview', 'home')}
          {navItem('/for-developers', 'For Developers', 'developers')}
          {navItem('/for-testers', 'For Testers', 'testers')}
          {navItem('/pricing', 'Pricing & Specs', 'pricing')}
          {navItem('/about', 'Story', 'about')}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/login"
            className="text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] transition"
          >
            Log in
          </Link>
          <Link
            to="/signup?role=developer&next=%2Fpost-job"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-4.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black active:scale-95"
          >
            Post a Job
            <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label="Open menu"
          className="rounded-full border border-black/10 p-2 text-[#1d1d1f] transition hover:bg-black/5 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-black/[0.06] bg-white px-5 py-5 backdrop-blur-2xl md:hidden">
          <nav className="grid gap-3 text-sm font-medium">
            <Link to="/#how-it-works" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2 text-slate-800 hover:bg-black/5">
              Overview
            </Link>
            <Link to="/for-developers" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2 text-slate-800 hover:bg-black/5">
              For Developers
            </Link>
            <Link to="/for-testers" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2 text-slate-800 hover:bg-black/5">
              For Testers
            </Link>
            <Link to="/pricing" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2 text-slate-800 hover:bg-black/5">
              Pricing & Specs
            </Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2 text-slate-800 hover:bg-black/5">
              Story
            </Link>
          </nav>

          <div className="mt-5 grid gap-2.5">
            <Link
              to="/signup?role=developer&next=%2Fpost-job"
              onClick={() => setMobileOpen(false)}
              className="rounded-full bg-[#1d1d1f] px-4 py-2.5 text-center text-xs font-bold text-white"
            >
              Post a Job
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-full border border-black/15 px-4 py-2 text-center text-xs font-semibold text-slate-800 hover:bg-black/5"
            >
              Log in
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}



