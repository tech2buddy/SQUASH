import {
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  CreditCard,
  FileText,
  Home,
  Menu,
  Settings,
  UserCircle2,
  X,
} from 'lucide-react';
import { type ComponentType, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import DeveloperHeaderNav from './DeveloperHeaderNav';
import MobileTabBar from './MobileTabBar';
import WorkspaceQuickSearch from './WorkspaceQuickSearch';

type NavGroup = {
  groupName: string;
  items: Array<{
    label: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    key: 'dashboard' | 'jobs' | 'applications' | 'reports' | 'billing' | 'settings' | 'help';
  }>;
};

export default function DeveloperLayout() {
  const location = useLocation();
  const path = location.pathname;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  let activeKey: 'dashboard' | 'jobs' | 'applications' | 'reports' | 'billing' | 'settings' | 'help' = 'dashboard';
  let pageTitle = 'Dashboard';
  if (path.startsWith('/developer/jobs') || path === '/post-job') {
    activeKey = 'jobs';
    pageTitle = 'My Test Jobs';
  } else if (path.startsWith('/developer/applications')) {
    activeKey = 'applications';
    pageTitle = 'Applications';
  } else if (path.startsWith('/developer/reports') || path.startsWith('/report-details')) {
    activeKey = 'reports';
    pageTitle = 'Test Reports';
  } else if (path.startsWith('/billing')) {
    activeKey = 'billing';
    pageTitle = 'Billing & Payments';
  } else if (path.startsWith('/developer/settings')) {
    activeKey = 'settings';
    pageTitle = 'Settings';
  } else if (path.startsWith('/developer/support')) {
    activeKey = 'help';
    pageTitle = 'Help & Support';
  } else if (path.startsWith('/dashboard')) {
    activeKey = 'dashboard';
  }

  const navGroups: NavGroup[] = [
    {
      groupName: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: Home, key: 'dashboard' },
      ],
    },
    {
      groupName: 'QA & TEST JOBS',
      items: [
        { label: 'My Test Jobs', href: '/developer/jobs', icon: BriefcaseBusiness, key: 'jobs' },
        { label: 'Applications', href: '/developer/applications', icon: UserCircle2, key: 'applications' },
        { label: 'Test Reports', href: '/developer/reports', icon: FileText, key: 'reports' },
      ],
    },
    {
      groupName: 'FINANCIALS & TEAM',
      items: [
        { label: 'Billing & Payments', href: '/billing', icon: CreditCard, key: 'billing' },
        { label: 'Settings', href: '/developer/settings', icon: Settings, key: 'settings' },
        { label: 'Help & Support', href: '/developer/support', icon: CircleHelp, key: 'help' },
      ],
    },
  ];

  return (
    <div className="developer-workspace flex min-h-screen min-h-dvh w-full lg:h-screen lg:overflow-hidden text-[#1d1d1f] selection:bg-[#1d1d1f] selection:text-white font-sans">
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-col bg-white/95 backdrop-blur-2xl p-6 shadow-2xl border-r border-black/[0.08] animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-5">
              <div className="flex items-center gap-3">
                <img
                  src="/squash-logo.png"
                  alt="SQUASH logo"
                  className="h-9 w-9 rounded-xl border border-black/10 object-cover shadow-2xs"
                />
                <span className="text-xl font-extrabold tracking-apple-tight text-[#1d1d1f]">SQUASH</span>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="rounded-xl p-2 text-[#86868b] hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-6 py-6 overflow-y-auto">
              {navGroups.map((group) => (
                <div key={group.groupName}>
                  <div className="px-3 mb-2 text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
                    {group.groupName}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeKey === item.key;
                      return (
                        <Link
                          to={item.href}
                          key={item.label}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-[#1d1d1f] text-white shadow-xs'
                              : 'text-slate-700 hover:bg-black/[0.04]'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Apple App Store Connect Style Translucent Sidebar */}
      <aside className="developer-workspace-sidebar hidden w-[230px] shrink-0 border border-white/75 bg-white/58 backdrop-blur-2xl lg:my-3 lg:ml-3 lg:flex lg:h-[calc(100vh-24px)] lg:flex-col lg:overflow-y-auto lg:rounded-[22px] select-none">
        {/* Brand Header */}
        <div className="flex h-[56px] items-center gap-2.5 px-4">
          <img
            src="/squash-logo.png"
            alt="SQUASH logo"
            className="h-6 w-6 rounded object-cover"
          />
          <Link to="/" className="text-sm font-semibold tracking-tight text-[#181817] hover:text-black">
            SQUASH
          </Link>
        </div>

        {/* App Store Connect Workspace Switcher Pill */}
        <Link to="/choose-workspace" aria-label="Switch workspace" className="developer-workspace-switcher mx-4 my-2 px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] flex items-center justify-between hover:bg-slate-200/60 transition focus:outline-none focus:ring-2 focus:ring-[#d95b65]/25">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center text-xs font-extrabold shrink-0">
              DEV
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-[#1d1d1f] truncate">Developer Workspace</div>
              <div className="text-[10px] text-[#238554] font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                Active Team
              </div>
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[#86868b] shrink-0" />
        </Link>

        {/* macOS Style Categorized Navigation */}
        <nav className="flex-1 space-y-5 px-3 py-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.groupName}>
              <div className="px-2.5 mb-1.5 text-[10px] font-medium text-[#92928E] uppercase tracking-wider">
                {group.groupName}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeKey === item.key;
                  return (
                    <Link
                      to={item.href}
                      key={item.label}
                      className={`relative active:scale-98 flex h-[34px] items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-[#eef0ed] text-[#181817] shadow-none font-semibold'
                          : 'text-[#666663] hover:bg-white/60 hover:text-[#181817]'
                      }`}
                    >
                      {isActive ? <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[#16A34A]" /> : null}
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* System Telemetry Footer */}
        <div className="mt-auto p-4 border-t border-black/[0.06]">
          <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.06] text-[11px] text-[#86868b] flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[#1d1d1f]">
              <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
              SQUASH Engine
            </div>
            <span className="font-mono text-[10px] text-[#238554] font-semibold">24ms</span>
          </div>
        </div>
      </aside>

      {/* Main Column: Fixed Top Header + Isolated Scroll Content */}
      <div className="flex flex-1 flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        {/* Header - Fixed to Top */}
        <header className="developer-workspace-topbar shrink-0 z-20 border-b border-white/75 bg-white/52 backdrop-blur-2xl px-4 py-3.5 sm:px-6 lg:px-8 lg:mt-3 lg:mr-3 lg:rounded-t-[22px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="rounded-xl border border-black/10 bg-white p-2 text-[#1d1d1f] lg:hidden hover:bg-[#f5f5f7] transition shadow-2xs"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden lg:flex items-center gap-2 text-xs font-semibold tracking-tight text-[#181817]">
                <span className="text-[#92928E] font-normal">SQUASH</span>
                <span className="text-[#DADAD7]">/</span>
                <span>{pageTitle}</span>
              </div>
              <WorkspaceQuickSearch role="developer" />
            </div>
            <DeveloperHeaderNav />
          </div>
        </header>

        {/* Content Container with Apple Studio Translucent Canvas */}
        <main className="developer-workspace-main flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8 lg:overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <MobileTabBar role="developer" />
    </div>
  );
}
