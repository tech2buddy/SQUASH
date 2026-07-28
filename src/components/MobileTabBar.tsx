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
    <div className="fixed bottom-3 left-3 right-3 z-50 lg:hidden">
      <div className="mx-auto max-w-sm overflow-hidden rounded-full border border-slate-200/90 bg-white/90 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
        <nav className="flex items-center justify-around gap-1 px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            // Reports and Home each cover several routes, so they can't just
            // compare against tab.href like the rest.
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
                className={`relative flex flex-1 flex-col items-center justify-center rounded-full py-1.5 px-2 transition-all duration-200 apple-press-effect ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 font-semibold'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : ''}`} />
                <span className="text-[10px] tracking-tight leading-tight mt-0.5">
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

