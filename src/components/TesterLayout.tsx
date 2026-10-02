import {
  Award,
  ChevronDown,
  CircleHelp,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { type ComponentType, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth';
import { getTesterQualificationStatus, type QualificationStatus } from '../lib/testerQualificationApi';
import TesterHeaderNav from './TesterHeaderNav';
import MobileTabBar from './MobileTabBar';
import TesterAvatar from './TesterAvatar';
import WorkspaceQuickSearch from './WorkspaceQuickSearch';
import { useTesterAvatarUrl } from '../hooks/useTesterAvatarUrl';

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  key: string;
  locked?: boolean;
};

type NavGroup = {
  groupName: string;
  items: NavItem[];
};

export default function TesterLayout() {
  const location = useLocation();
  const { session } = useAuth();
  const path = location.pathname;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [qualificationStatus, setQualificationStatus] = useState<QualificationStatus | null>(null);
  const testerAvatarUrl = useTesterAvatarUrl(session?.userId);

  useEffect(() => {
    if (!session?.userId) return;
    let active = true;
    const refreshQualificationStatus = async () => {
      try {
        const nextStatus = await getTesterQualificationStatus(session.userId!);
        if (active) setQualificationStatus(nextStatus);
      } catch {
        if (active) setQualificationStatus('not_started');
      }
    };
    void refreshQualificationStatus();
    const interval = window.setInterval(() => { void refreshQualificationStatus(); }, 30_000);
    window.addEventListener('focus', refreshQualificationStatus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshQualificationStatus);
    };
  }, [session?.userId]);

  let activeKey = 'dashboard';
  let pageTitle = 'Dashboard';

  if (path.startsWith('/tester-jobs') || path === '/job-board') {
    activeKey = 'jobs';
    pageTitle = 'Available Tests';
  } else if (path.startsWith('/tester-qualification')) {
    activeKey = 'qualification';
    pageTitle = 'Tester Academy';
  } else if (path.startsWith('/tester/my-tests') || path === '/active-test') {
    activeKey = 'tests';
    pageTitle = 'Active Tests';
  } else if (path === '/test-lab') {
    activeKey = 'tests';
    pageTitle = 'QA Test Lab';
  } else if (path.startsWith('/tester/reports') || path.startsWith('/tester/submissions')) {
    activeKey = 'reports';
    pageTitle = 'Test Reports';
  } else if (path.startsWith('/tester/earnings') || path.startsWith('/tester/payments') || path.startsWith('/tester/payout-method')) {
    activeKey = 'earnings';
    pageTitle = 'Earnings & Payouts';
  } else if (path.startsWith('/tester/profile') || path.startsWith('/tester/referrals')) {
    activeKey = 'profile';
    pageTitle = 'Tester Profile';
  } else if (path.startsWith('/tester/leaderboard') || path.startsWith('/tester/level-benefits')) {
    activeKey = 'progress';
    pageTitle = 'Tester Progress';
  } else if (path.startsWith('/tester/settings')) {
    activeKey = 'settings';
    pageTitle = 'Settings';
  } else if (path.startsWith('/tester/support')) {
    activeKey = 'help';
    pageTitle = 'Help & Support';
  } else if (path.startsWith('/tester/dashboard')) {
    activeKey = 'dashboard';
    pageTitle = 'Dashboard';
  }

  const qualificationPending = qualificationStatus !== 'approved';

  const navGroups: NavGroup[] = [
    {
      groupName: 'MAIN',
      items: [
        { label: 'Dashboard', href: '/tester/dashboard', icon: LayoutDashboard, key: 'dashboard' },
        ...(qualificationStatus !== 'approved'
          ? [{ label: 'Tester Academy', href: '/tester-qualification', icon: ShieldCheck, key: 'qualification' }]
          : []),
        { label: 'Find Tests', href: '/tester-jobs', icon: Search, key: 'jobs', locked: qualificationPending },
        { label: 'Active Tests', href: '/tester/my-tests', icon: FlaskConical, key: 'tests', locked: qualificationPending },
        { label: 'Test Reports', href: '/tester/reports', icon: FileText, key: 'reports', locked: qualificationPending },
      ],
    },
    {
      groupName: 'FINANCE & PROGRESS',
      items: [
        { label: 'Earnings & Payouts', href: '/tester/earnings', icon: WalletCards, key: 'earnings', locked: qualificationPending },
        { label: 'Level & Progress', href: '/tester/level-benefits', icon: Award, key: 'progress' },
      ],
    },
    {
      groupName: 'ACCOUNT',
      items: [
        { label: 'Profile', href: '/tester/profile', icon: UserRound, key: 'profile' },
        { label: 'Settings', href: '/tester/settings', icon: Settings, key: 'settings' },
        { label: 'Help & Support', href: '/tester/support', icon: CircleHelp, key: 'help' },
      ],
    },
  ];

  const testerName = session?.name || 'Tester Workspace';
  const testerSubtext = qualificationStatus === 'approved' ? 'Verified Tester' : 'Academy Candidate';

  return (
    <div className="flex min-h-screen w-full lg:h-screen lg:overflow-hidden bg-[radial-gradient(circle_at_78%_10%,#f5e9e7_0%,transparent_32%),radial-gradient(circle_at_16%_86%,#e4e6ec_0%,transparent_34%),#e9e9e7] text-[#181817] font-sans antialiased selection:bg-[#1D1D1B] selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex w-[260px] max-w-full flex-col bg-[#FAFAF9] border-r border-[#E7E7E5] shadow-xl">
            <div className="flex h-[56px] items-center justify-between px-4 border-b border-[#E7E7E5]">
              <div className="flex items-center gap-2.5">
                <img src="/squash-logo.png" alt="SQUASH" className="h-6 w-6 rounded" />
                <span className="text-sm font-semibold tracking-tight text-[#181817]">SQUASH</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#EEEEEC] text-[#666663]">QA</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="rounded p-1 text-[#666663] hover:bg-[#EEEEEC] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-5 px-3 py-4 overflow-y-auto">
              {navGroups.map((group) => (
                <div key={group.groupName}>
                  <div className="px-2.5 mb-1.5 text-[10px] font-medium text-[#92928E] tracking-wider uppercase">
                    {group.groupName}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeKey === item.key;
                      if (item.locked) {
                        return (
                          <div
                            key={item.label}
                            aria-disabled="true"
                            className="flex cursor-not-allowed items-center gap-2.5 h-[34px] rounded-md px-2.5 text-xs text-[#B8B8B3]"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-[#B8B8B3]" />
                            <span className="truncate">{item.label}</span>
                            <LockKeyhole className="ml-auto h-3 w-3 shrink-0" />
                          </div>
                        );
                      }
                      return (
                        <Link
                          to={item.href}
                          key={item.label}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className={`flex items-center gap-2.5 h-[34px] rounded-md px-2.5 text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-[#EEEEEC] text-[#181817]'
                              : 'text-[#666663] hover:bg-[#F3F3F2] hover:text-[#181817]'
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#181817]' : 'text-[#92928E]'}`} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-3 border-t border-[#E7E7E5] flex items-center gap-2.5">
              <TesterAvatar name={testerName} avatarUrl={testerAvatarUrl} className="h-7 w-7 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-[#181817] truncate">{testerName}</div>
                <div className="text-[10px] text-[#666663] truncate">{testerSubtext}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiet Linear-Style Monochromatic Left Sidebar (Desktop 230px) */}
      <aside className="tester-sidebar hidden w-[246px] shrink-0 border border-white/70 bg-white/55 shadow-[0_18px_50px_rgba(61,54,53,0.10)] backdrop-blur-2xl lg:my-3 lg:ml-3 lg:flex lg:h-[calc(100vh-24px)] lg:flex-col lg:rounded-[22px] select-none">
        {/* Brand Header */}
        <div className="flex h-[56px] items-center justify-between px-4 border-b border-[#E7E7E5]">
          <Link to="/tester/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition">
            <img src="/squash-logo.png" alt="SQUASH" className="h-6 w-6 rounded object-cover" />
            <span className="text-sm font-semibold tracking-tight text-[#181817]">SQUASH</span>
          </Link>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#EEEEEC] text-[#666663] border border-[#E7E7E5]">
            Tester
          </span>
        </div>

        {/* Quiet Navigation Groups */}
        <nav className="flex-1 space-y-5 px-3 py-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.groupName}>
              <div className="px-2.5 mb-1.5 text-[10px] font-medium text-[#92928E] tracking-wider uppercase">
                {group.groupName}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeKey === item.key;
                  if (item.locked) {
                    return (
                      <div
                        key={item.label}
                        aria-disabled="true"
                        title="Complete Academy qualification to unlock"
                        className="flex cursor-not-allowed items-center gap-2.5 h-[34px] rounded-md px-2.5 text-xs text-[#B8B8B3]"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[#B8B8B3]" />
                        <span className="truncate">{item.label}</span>
                        <LockKeyhole className="ml-auto h-3 w-3 shrink-0 text-[#B8B8B3]" />
                      </div>
                    );
                  }
                  return (
                    <Link
                      to={item.href}
                      key={item.label}
                      className={`relative flex items-center gap-2.5 h-[34px] rounded-md px-2.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#EEEEEC] text-[#181817]'
                          : 'text-[#666663] hover:bg-[#F3F3F2] hover:text-[#181817]'
                      }`}
                    >
                      {isActive ? (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[#16A34A]" />
                      ) : null}
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#181817]' : 'text-[#92928E]'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Tester Profile Anchor */}
        <div className="h-[52px] border-t border-[#E7E7E5] px-3.5 flex items-center justify-between bg-[#FAFAF9]">
          <Link to="/tester/profile" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition">
            <TesterAvatar name={testerName} avatarUrl={testerAvatarUrl} className="h-7 w-7 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#181817] truncate leading-none">{testerName}</div>
              <div className="text-[10px] text-[#666663] truncate leading-none mt-1">{testerSubtext}</div>
            </div>
          </Link>
          <ChevronDown className="h-3.5 w-3.5 text-[#92928E] shrink-0" />
        </div>
      </aside>

      {/* Main Column Layout */}
      <div className="flex flex-1 flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        {/* Quiet Top Application Bar (56px) */}
        <header className="tester-topbar h-[56px] shrink-0 z-20 border-b border-white/70 bg-white/45 px-4 sm:px-6 flex items-center justify-between backdrop-blur-xl lg:mt-3 lg:mr-3 lg:rounded-t-[22px]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="rounded-md border border-[#E7E7E5] bg-[#FFFFFF] p-1.5 text-[#181817] lg:hidden hover:bg-[#F7F7F6] transition"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="text-xs font-semibold text-[#181817] tracking-tight flex items-center gap-2">
              <span className="text-[#92928E] font-normal">SQUASH</span>
              <span className="text-[#DADAD7]">/</span>
              <span>{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <WorkspaceQuickSearch role="tester" />
            <TesterHeaderNav />
          </div>
        </header>

        {/* Operational Workspace Body Canvas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-6 pb-24 lg:pb-6 lg:overflow-y-auto bg-transparent">
          <Outlet />
        </main>
      </div>

      <MobileTabBar role="tester" testerQualified={qualificationStatus === 'approved'} />
    </div>
  );
}
