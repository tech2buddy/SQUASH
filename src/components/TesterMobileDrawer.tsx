import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Home,
  LogOut,
  Settings,
  Trophy,
  UserCircle2,
  X,
} from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../auth';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activePath?: string;
};

export default function TesterMobileDrawer({ isOpen, onClose, activePath }: Props) {
  const { logout } = useAuth();

  if (!isOpen) return null;

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: BriefcaseBusiness, href: '/tester-jobs' },
    { label: 'My Tests', icon: ClipboardList, href: '/active-test' },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
    { label: 'Level Benefits', icon: Trophy, href: '/tester/level-benefits' },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out drawer content */}
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-left duration-200">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/squash-logo.png"
                alt="SQUASH logo"
                className="h-10 w-10 rounded-2xl border border-slate-200 object-cover"
              />
              <span className="text-xl font-black tracking-tight text-slate-900">SQUASH</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-6 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath ? activePath.includes(item.href) : false;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive ? 'bg-[#e63946] text-white' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#e63946]">
              <CheckCircle2 className="h-4 w-4 text-[#e63946]" />
              Tester Account Active
            </div>
            <div className="mt-1 text-xs text-slate-600">Complete tests to level up!</div>
          </div>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
