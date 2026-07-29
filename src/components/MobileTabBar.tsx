import { Home, ClipboardList, PlayCircle, UserCircle2, Briefcase, BarChart3, Settings } from 'lucide-react';
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

const DEVELOPER_TABS: Tab[] = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Jobs', href: '/developer/jobs', icon: Briefcase },
  { label: 'Reports', href: '/developer/reports', icon: BarChart3, activePattern: '/developer/' },
  { label: 'Billing', href: '/billing', icon: Settings, activePattern: '/billing' },
];

export default function MobileTabBar({ role }: { role: 'tester' | 'developer' }) {
  const location = useLocation();
  const tabs = role === 'tester' ? TESTER_TABS : DEVELOPER_TABS;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
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
                className={`relative flex flex-1 flex-col items-center justify-center rounded-2xl py-2 px-2.5 transition-all duration-200 apple-press-effect ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 font-semibold'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                <span className="text-[11px] font-bold tracking-tight leading-none mt-1">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

