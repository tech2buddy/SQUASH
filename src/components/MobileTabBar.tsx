import { Home, ClipboardList, PlayCircle, UserCircle2, Briefcase, BarChart3, Settings } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

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
  { label: 'Reports', href: '/developer/reports', icon: BarChart3, activePattern: '/developer/(submissions|applications)' },
  { label: 'Billing', href: '/developer/billing', icon: Settings, activePattern: '/developer/billing' },
];

export default function MobileTabBar({ role }: { role: 'tester' | 'developer' }) {
  const location = useLocation();
  const tabs = role === 'tester' ? TESTER_TABS : DEVELOPER_TABS;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
      <div className="mx-auto max-w-md rounded-full border border-white/40 bg-white/80 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
        <nav className="flex items-center justify-between px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.activePattern
              ? location.pathname.includes(tab.activePattern)
              : location.pathname === tab.href || location.pathname.startsWith(tab.href + '/');

            return (
              <Link
                key={tab.label}
                to={tab.href}
                className={`relative flex flex-col items-center justify-center rounded-full px-4 py-2 transition-all duration-200 apple-press-effect ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-white font-bold' : ''}`}>
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

