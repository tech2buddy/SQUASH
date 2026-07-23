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
  { label: 'Reports', href: '/developer/submissions', icon: BarChart3, activePattern: '/developer/submissions' },
  { label: 'Billing', href: '/developer/billing', icon: Settings, activePattern: '/developer/billing' },
];

export default function MobileTabBar({ role }: { role: 'tester' | 'developer' }) {
  const location = useLocation();
  const tabs = role === 'tester' ? TESTER_TABS : DEVELOPER_TABS;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md pb-safe pt-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.activePattern 
          ? location.pathname.includes(tab.activePattern)
          : location.pathname === tab.href || location.pathname.startsWith(tab.href + '/');

        return (
          <Link
            key={tab.label}
            to={tab.href}
            className={`flex flex-col items-center gap-1 rounded-2xl p-2 min-w-[64px] transition ${
              isActive ? 'text-green-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className={`h-6 w-6 ${isActive ? 'fill-green-100 text-green-600' : ''}`} />
            <span className="text-[10px] font-bold">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
