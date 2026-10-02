import {
  Award,
  BriefcaseBusiness,
  ClipboardList,
  CreditCard,
  CircleHelp,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  UserCircle2,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

type QuickSearchItem = {
  label: string;
  description: string;
  href: string;
  keywords: string;
  icon: LucideIcon;
};

const DEVELOPER_ITEMS: QuickSearchItem[] = [
  { label: 'Dashboard', description: 'Workspace overview', href: '/dashboard', keywords: 'home overview', icon: LayoutDashboard },
  { label: 'My Test Jobs', description: 'Manage QA runs', href: '/developer/jobs', keywords: 'jobs runs apps', icon: BriefcaseBusiness },
  { label: 'Applications', description: 'Review tester applicants', href: '/developer/applications', keywords: 'testers applicants hiring', icon: UserCircle2 },
  { label: 'Test Reports', description: 'Review submitted evidence', href: '/developer/reports', keywords: 'reports submissions bugs evidence', icon: FileText },
  { label: 'Create a Test Job', description: 'Launch a new QA run', href: '/post-job', keywords: 'new create launch post', icon: Plus },
  { label: 'Billing & Payments', description: 'Budgets and transactions', href: '/billing', keywords: 'billing payments money budget', icon: CreditCard },
  { label: 'Settings', description: 'Workspace preferences', href: '/developer/settings', keywords: 'settings preferences account', icon: Settings },
  { label: 'Help & Support', description: 'Get help or open a ticket', href: '/developer/support', keywords: 'help support contact ticket', icon: CircleHelp },
];

const TESTER_ITEMS: QuickSearchItem[] = [
  { label: 'Dashboard', description: 'Assignments and opportunities', href: '/tester/dashboard', keywords: 'home overview', icon: LayoutDashboard },
  { label: 'Find Tests', description: 'Browse available QA work', href: '/tester-jobs', keywords: 'jobs opportunities browse', icon: Search },
  { label: 'Active Tests', description: 'Continue current assignments', href: '/tester/my-tests', keywords: 'active assignments lab', icon: FlaskConical },
  { label: 'Test Reports', description: 'View your submissions', href: '/tester/reports', keywords: 'reports submissions evidence', icon: FileText },
  { label: 'Earnings & Payouts', description: 'Balance and payment history', href: '/tester/earnings', keywords: 'earnings payments money balance', icon: WalletCards },
  { label: 'Level & Progress', description: 'Tier benefits and milestones', href: '/tester/level-benefits', keywords: 'level progress tier benefits', icon: Award },
  { label: 'Profile', description: 'Photo and tester details', href: '/tester/profile', keywords: 'profile photo account', icon: UserCircle2 },
  { label: 'Settings', description: 'Notifications and privacy', href: '/tester/settings', keywords: 'settings preferences account', icon: Settings },
  { label: 'Help & Support', description: 'Get help or open a ticket', href: '/tester/support', keywords: 'help support contact ticket', icon: CircleHelp },
  { label: 'Tester Academy', description: 'Qualification and training', href: '/tester-qualification', keywords: 'academy qualification training', icon: ClipboardList },
];

export default function WorkspaceQuickSearch({ role }: { role: 'developer' | 'tester' }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const items = role === 'developer' ? DEVELOPER_ITEMS : TESTER_ITEMS;

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items.slice(0, 5);
    return items.filter((item) => `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(normalized));
  }, [items, query]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const choose = (item: QuickSearchItem) => {
    setOpen(false);
    setQuery('');
    navigate(item.href);
  };

  const isDeveloper = role === 'developer';

  return (
    <div
      ref={rootRef}
      className={`relative hidden md:block ${isDeveloper ? 'developer-workspace-search min-w-[280px] max-w-md lg:min-w-[360px]' : 'w-[220px] lg:w-[280px]'}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div className={`flex items-center gap-2 border bg-white/90 transition focus-within:border-[#d95b65]/35 focus-within:ring-2 focus-within:ring-[#d95b65]/15 ${isDeveloper ? 'h-9 rounded-full border-black/[0.06] px-3.5' : 'h-8 rounded-md border-[#E7E7E5] px-2.5'}`}>
        <Search className="h-3.5 w-3.5 shrink-0 text-[#92928E]" />
        <input
          ref={inputRef}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((index) => matches.length ? (index + 1) % matches.length : 0);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => matches.length ? (index - 1 + matches.length) % matches.length : 0);
            } else if (event.key === 'Enter' && matches.length) {
              event.preventDefault();
              choose(matches[Math.min(activeIndex, matches.length - 1)]);
            } else if (event.key === 'Escape') {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          aria-label={`${role} workspace quick navigation`}
          aria-expanded={open}
          aria-controls={`${role}-workspace-search-results`}
          aria-autocomplete="list"
          className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#1d1d1f] outline-none placeholder:text-[#92928E]"
          placeholder={isDeveloper ? 'Jump to jobs, applicants, reports…' : 'Jump to tests, reports, earnings…'}
        />
        <kbd className="hidden rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#86868b] shadow-2xs lg:inline-block">Ctrl K</kbd>
      </div>

      {open ? (
        <div id={`${role}-workspace-search-results`} role="listbox" className="absolute right-0 top-[calc(100%+8px)] z-50 w-full min-w-[300px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 p-1.5 shadow-[0_20px_55px_rgba(31,28,28,0.16)] backdrop-blur-2xl">
          {matches.length ? matches.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(item)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${index === activeIndex ? 'bg-[#fff0ee] text-[#2b2020]' : 'text-[#59605c] hover:bg-[#f7f6f4]'}`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${index === activeIndex ? 'bg-[#d95b65] text-white' : 'bg-[#f0f1ef] text-[#59605c]'}`}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0"><strong className="block truncate text-xs">{item.label}</strong><span className="block truncate text-[10px] text-[#858a86]">{item.description}</span></span>
              </button>
            );
          }) : <div className="px-3 py-5 text-center text-xs text-[#858a86]">No matching workspace page.</div>}
        </div>
      ) : null}
    </div>
  );
}
