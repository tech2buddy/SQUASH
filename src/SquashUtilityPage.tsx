import {
  Bell,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Home,
  Menu,
  Settings,
  Trophy,
  UserCircle2,
} from 'lucide-react';
import { useAuth, type UserRole } from './auth';
import type { LucideIcon } from 'lucide-react';

type UtilityAction = {
  label: string;
  href: string;
  primary?: boolean;
};

type SquashUtilityPageProps = {
  role: Extract<UserRole, 'developer' | 'tester'>;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions: UtilityAction[];
  details?: string[];
};

const roleNav: Record<'developer' | 'tester', Array<{ label: string; href: string; icon: LucideIcon }>> = {
  developer: [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Post a Job', href: '/post-job', icon: ClipboardList },
    { label: 'Reports', href: '/report-details', icon: ClipboardList },
    { label: 'Billing', href: '/billing', icon: CreditCard },
  ],
  tester: [
    { label: 'Dashboard', href: '/tester/dashboard', icon: Home },
    { label: 'Available Jobs', href: '/tester-jobs', icon: BriefcaseBusiness },
    { label: 'My Tests', href: '/active-test', icon: ClipboardList },
    { label: 'Reports', href: '/tester/reports', icon: ClipboardList },
    { label: 'Earnings', href: '/tester/earnings', icon: CircleDollarSign },
    { label: 'Profile', href: '/tester/profile', icon: UserCircle2 },
    { label: 'Settings', href: '/tester/settings', icon: Settings },
  ],
};

export default function SquashUtilityPage({ role, eyebrow, title, description, icon: Icon, actions, details = [] }: SquashUtilityPageProps) {
  const { session } = useAuth();
  const name = session?.name || (role === 'developer' ? 'Developer' : 'Tester');
  const navItems = roleNav[role];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <img src="/squash-logo.png" alt="SQUASH logo" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm" />
            <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">SQUASH</a>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const NavIcon = item.icon;
              return (
                <a key={item.href} href={item.href} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <NavIcon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <a href={role === 'developer' ? '/dashboard' : '/tester/dashboard'} className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                <Menu className="h-5 w-5" />
              </a>
              <a href={role === 'developer' ? '/dashboard' : '/tester/profile'} className="ml-auto flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                  {name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-bold text-slate-900">{name}</div>
                  <div className="text-xs text-slate-500 capitalize">{role}</div>
                </div>
              </a>
            </div>
          </header>

          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
                    <Icon className="h-4 w-4" />
                    {eyebrow}
                  </div>
                  <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
                  <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
                </div>
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-green-50 text-green-700 ring-1 ring-green-100">
                  <Icon className="h-11 w-11" />
                </div>
              </div>

              {details.length > 0 ? (
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {details.map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                {actions.map((action) => (
                  <a
                    key={action.href}
                    href={action.href}
                    className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                      action.primary
                        ? 'bg-green-600 text-white shadow-sm hover:bg-green-700'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export const utilityIcons = {
  Bell,
  CreditCard,
  Menu,
  Trophy,
  UserCircle2,
};
