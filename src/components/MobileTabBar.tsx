import { Home, ClipboardList, PlayCircle, UserCircle2, Briefcase, BarChart3, Settings, ShieldCheck } from 'lucide-react';
import { useLocation, Link } from 'react-router';

type Tab = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  activePattern?: string;
};

const TESTER_TABS: Tab[] = [
  { label: 'Home', href: '/tester/dashboard', icon: Home },
  { label: 'Jobs', href: '/tester-jobs', icon: ClipboardList },
  { label: 'Test', href: '/active-test', icon: PlayCircle },
  { label: 'Profile', href: '/tester/profile', icon: UserCircle2 },
];

const TESTER_ACADEMY_TABS: Tab[] = [
  { label: 'Academy', href: '/tester-qualification', icon: ShieldCheck },
  { label: 'Profile', href: '/tester/profile', icon: UserCircle2 },
  { label: 'Settings', href: '/tester/settings', icon: Settings },
];

const DEVELOPER_TABS: Tab[] = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Jobs', href: '/developer/jobs', icon: Briefcase },
  { label: 'Reports', href: '/developer/reports', icon: BarChart3, activePattern: '/developer/' },
  { label: 'Billing', href: '/billing', icon: Settings, activePattern: '/billing' },
];

export default function MobileTabBar({ role, testerQualified = true }: { role: 'tester' | 'developer'; testerQualified?: boolean }) {
  const location = useLocation();
  const tabs = role === 'tester' ? (testerQualified ? TESTER_TABS : TESTER_ACADEMY_TABS) : DEVELOPER_TABS;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
      <div className="mx-auto max-w-md rounded-full border border-black/[0.08] bg-white/85 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
        <nav className="flex items-center justify-between gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.label === 'Reports'
                ? location.pathname.startsWith('/developer/reports')
                  || location.pathname.includes('/developer/submissions')
                  || location.pathname.includes('/developer/applications')
                : tab.label === 'Home'
                  ? location.pathname === '/dashboard' || location.pathname === '/tester/dashboard'
                  : location.pathname === tab.href || location.pathname.startsWith(tab.href + '/');

            return (
              <Link
                key={tab.label}
                to={tab.href}
                className={`relative flex flex-1 flex-col items-center justify-center rounded-full py-2 px-2.5 transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-[#1d1d1f] text-white shadow-2xs font-bold'
                    : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] font-medium'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                <span className="text-[10px] font-semibold tracking-tight leading-none mt-1">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}