import { ClipboardList, CreditCard, FileText, Home, Menu, Search, UserCircle2, X } from 'lucide-react';
import { type ComponentType, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import DeveloperHeaderNav from './DeveloperHeaderNav';
import MobileTabBar from './MobileTabBar';

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  key: 'dashboard' | 'jobs' | 'applications' | 'reports' | 'billing' | 'settings';
};

export default function DeveloperLayout() {
  const location = useLocation();
  const path = location.pathname;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  let activeKey: 'dashboard' | 'jobs' | 'applications' | 'reports' | 'billing' | 'settings' = 'dashboard';
  if (path.startsWith('/developer/jobs') || path === '/post-job') {
    activeKey = 'jobs';
  } else if (path.startsWith('/developer/applications')) {
    activeKey = 'applications';
  } else if (path.startsWith('/developer/reports') || path.startsWith('/report-details')) {
    activeKey = 'reports';
  } else if (path.startsWith('/billing')) {
    activeKey = 'billing';
  } else if (path.startsWith('/developer/settings')) {
    activeKey = 'settings';
  } else if (path.startsWith('/dashboard')) {
    activeKey = 'dashboard';
  }

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home, key: 'dashboard' },
    { label: 'Jobs', href: '/developer/jobs', icon: ClipboardList, key: 'jobs' },
    { label: 'Applications', href: '/developer/applications', icon: UserCircle2, key: 'applications' },
    { label: 'Reports', href: '/developer/reports', icon: FileText, key: 'reports' },
    { label: 'Billing', href: '/billing', icon: CreditCard, key: 'billing' },
    { label: 'Settings', href: '/developer/settings', icon: UserCircle2, key: 'settings' },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f5f5f7] text-slate-900">
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-col bg-white/95 backdrop-blur-2xl p-6 shadow-2xl border-r border-slate-200 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-6">
              <div className="flex items-center gap-3">
                <img
                  src="/squash-logo.png"
                  alt="SQUASH logo"
                  className="h-10 w-10 rounded-2xl border border-slate-200 object-cover shadow-sm"
                />
                <span className="text-xl font-black tracking-tight text-slate-900">SQUASH</span>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-2 py-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeKey === item.key;
                return (
                  <Link
                    to={item.href}
                    key={item.label}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all ${
                      isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Apple Glassmorphism Sidebar - Fixed 100vh */}
      <aside className="hidden w-[260px] shrink-0 border-r border-slate-200/60 bg-white/70 backdrop-blur-xl lg:flex lg:h-screen lg:flex-col overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-slate-200/60 px-6 py-6">
          <img
            src="/squash-logo.png"
            alt="SQUASH logo"
            className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm"
          />
          <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">
            SQUASH
          </a>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            return (
              <Link
                to={item.href}
                key={item.label}
                className={`apple-press-effect flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
                  isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:bg-black/[0.04]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Column: Fixed Top Header + Isolated Scroll Content */}
      <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden">
        {/* Header - Fixed to Top */}
        <header className="shrink-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="rounded-xl border border-slate-200/80 bg-white p-2 text-slate-600 lg:hidden hover:bg-slate-50 transition shadow-sm"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden md:flex max-w-md items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-100/60 px-4 py-2 min-w-[280px] lg:min-w-[360px]">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Search jobs, testers, reports..."
                />
              </div>
            </div>
            <DeveloperHeaderNav />
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <MobileTabBar role="developer" />
    </div>
  );
}
