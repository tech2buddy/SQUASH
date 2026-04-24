import {
  Activity,
  Bell,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Home,
  Menu,
  Search,
  UserCircle2,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import TesterBadge from './components/TesterBadge';
import { getCategoryById, type TestCategoryId } from './components/testCategories';

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
};

type DashboardJob = {
  name: string;
  type: string;
  categoryId: TestCategoryId;
  testers: string;
  status: 'In Progress' | 'Reviewing' | 'Open';
  deadline: string;
  submissions: string;
  accent: string;
};

type SubmissionItem = {
  app: string;
  tester: string;
  testsCompleted: number;
  rating: number;
  time: string;
  severity: 'Critical' | 'Medium' | 'Low';
  videoDuration?: string;
};

type ActivityItem = {
  text: string;
  time: string;
  color: string;
};

type AttachmentItem = {
  name: string;
  meta: string;
  accent: string;
  icon: string;
};

const jobs: DashboardJob[] = [
  {
    name: 'PayFlow Web App',
    type: 'Web Application',
    categoryId: 'website-testing',
    testers: '24 / 30',
    status: 'In Progress',
    deadline: '28 May 2024',
    submissions: '12 / 24',
    accent: 'bg-slate-900 text-white',
  },
  {
    name: 'FitTrack Mobile',
    type: 'Mobile App',
    categoryId: 'mobile-app-testing',
    testers: '18 / 20',
    status: 'In Progress',
    deadline: '25 May 2024',
    submissions: '8 / 18',
    accent: 'bg-slate-800 text-white',
  },
  {
    name: 'HealthApp iOS',
    type: 'iOS Application',
    categoryId: 'localization-testing',
    testers: '30 / 30',
    status: 'Reviewing',
    deadline: '23 May 2024',
    submissions: '30 / 30',
    accent: 'bg-emerald-600 text-white',
  },
  {
    name: 'EduLearn Platform',
    type: 'Web Application',
    categoryId: 'onboarding-testing',
    testers: '10 / 15',
    status: 'Open',
    deadline: '05 Jun 2024',
    submissions: '0 / 10',
    accent: 'bg-violet-500 text-white',
  },
  {
    name: 'ShopEasy Android',
    type: 'Android App',
    categoryId: 'ecommerce-testing',
    testers: '5 / 20',
    status: 'Open',
    deadline: '10 Jun 2024',
    submissions: '0 / 5',
    accent: 'bg-red-500 text-white',
  },
  {
    name: 'MoneyMap Dashboard',
    type: 'Web Application',
    categoryId: 'performance-testing',
    testers: '12 / 16',
    status: 'In Progress',
    deadline: '14 Jun 2024',
    submissions: '6 / 12',
    accent: 'bg-indigo-500 text-white',
  },
  {
    name: 'Kasi Eats',
    type: 'Android App',
    categoryId: 'low-data-testing',
    testers: '8 / 12',
    status: 'Open',
    deadline: '16 Jun 2024',
    submissions: '2 / 8',
    accent: 'bg-orange-500 text-white',
  },
];

const submissions: SubmissionItem[] = [
  { app: 'PayFlow Web App', tester: 'Thando M.', testsCompleted: 14, rating: 4.3, time: '2h ago', severity: 'Critical', videoDuration: '00:41' },
  { app: 'FitTrack Mobile', tester: 'Sipho N.', testsCompleted: 32, rating: 4.7, time: '5h ago', severity: 'Medium', videoDuration: '00:28' },
  { app: 'HealthApp iOS', tester: 'Lerato D.', testsCompleted: 64, rating: 4.9, time: '6h ago', severity: 'Low', videoDuration: '00:55' },
  { app: 'PayFlow Web App', tester: 'John K.', testsCompleted: 5, rating: 3.9, time: '1d ago', severity: 'Critical' },
  { app: 'FitTrack Mobile', tester: 'Sarah W.', testsCompleted: 11, rating: 4.1, time: '1d ago', severity: 'Medium' },
  { app: 'Kasi Eats', tester: 'Anele P.', testsCompleted: 23, rating: 4.6, time: '2d ago', severity: 'Low' },
  { app: 'MoneyMap Dashboard', tester: 'Brendon R.', testsCompleted: 55, rating: 4.8, time: '2d ago', severity: 'Critical' },
  { app: 'EduLearn Platform', tester: 'Nomsa L.', testsCompleted: 8, rating: 4.2, time: '3d ago', severity: 'Medium' },
];

const activityItems: ActivityItem[] = [
  { text: 'New job "EduLearn Platform" created', time: '2 hours ago', color: 'bg-green-100 text-green-600' },
  { text: 'Critical bug reported in PayFlow Web App', time: '3 hours ago', color: 'bg-red-100 text-red-500' },
  { text: 'Sipho N. submitted a report for FitTrack Mobile', time: '5 hours ago', color: 'bg-amber-100 text-amber-500' },
  { text: '30 reports completed for HealthApp iOS', time: 'Yesterday', color: 'bg-green-100 text-green-600' },
  { text: 'Payment of R12,450 processed', time: '2 days ago', color: 'bg-sky-100 text-sky-600' },
  { text: 'Kasi Eats job reached tester capacity', time: '2 days ago', color: 'bg-violet-100 text-violet-600' },
  { text: 'MoneyMap dashboard report marked resolved', time: '3 days ago', color: 'bg-emerald-100 text-emerald-600' },
];

const attachments: AttachmentItem[] = [
  {
    name: 'Screenshot_2024-05-26_10-42.png',
    meta: 'PNG - 1.2 MB',
    accent: 'bg-red-50 text-red-500',
    icon: 'IMG',
  },
  {
    name: 'Screen_Recording_2024-05-26.mp4',
    meta: 'MP4 - 12.4 MB',
    accent: 'bg-violet-50 text-violet-500',
    icon: 'VID',
  },
  {
    name: 'Repro_Steps_FitTrack.pdf',
    meta: 'PDF - 690 KB',
    accent: 'bg-sky-50 text-sky-600',
    icon: 'PDF',
  },
];

function getStatusClasses(status: DashboardJob['status']) {
  if (status === 'In Progress') return 'bg-green-100 text-green-700';
  if (status === 'Reviewing') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

function getSeverityClasses(severity: SubmissionItem['severity']) {
  if (severity === 'Critical') return 'bg-red-50 text-red-600';
  if (severity === 'Medium') return 'bg-amber-50 text-amber-600';
  return 'bg-green-50 text-green-600';
}

function DeveloperShell({
  title,
  subtitle,
  active,
  children,
}: {
  title: string;
  subtitle: string;
  active: 'dashboard' | 'post-job' | 'reports' | 'billing';
  children: ReactNode;
}) {
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home, active: active === 'dashboard' },
    { label: 'Post a Job', href: '/post-job', icon: ClipboardList, active: active === 'post-job' },
    { label: 'Reports', href: '/report-details', icon: FileText, active: active === 'reports' },
    { label: 'Billing', href: '/billing', icon: CreditCard, active: active === 'billing' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <img
              src="/squash-logo.png"
              alt="SQUASH logo"
              className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
            <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">
              SQUASH
            </a>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <a href="/dashboard" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                    <Menu className="h-5 w-5" />
                  </a>
                  <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[320px] lg:min-w-[420px]">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="Search jobs, testers, reports..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <a href="/report-details" className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      3
                    </span>
                  </a>
                  <a href="/dashboard" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserCircle2 className="h-7 w-7" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-bold text-slate-900">Alex Developer</div>
                      <div className="text-xs text-slate-500">Developer</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-slate-600">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function SquashDeveloperJobsPage() {
  return (
    <DeveloperShell
      title="All Active Jobs"
      subtitle="Complete list of jobs posted by your team."
      active="dashboard"
    >
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
                      <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                        <th className="px-5 py-3 font-medium">App / Job</th>
                        <th className="px-5 py-3 font-medium">Category</th>
                        <th className="px-5 py-3 font-medium">Testers</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Deadline</th>
                <th className="px-5 py-3 font-medium">Submissions</th>
                <th className="px-5 py-3 font-medium">Open</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.name} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold ${job.accent}`}>
                        {job.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{job.name}</div>
                        <div className="text-sm text-slate-500">{job.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {(() => {
                      const category = getCategoryById(job.categoryId);
                      const CategoryIcon = category.icon;
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                          <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                          {category.name}
                          {category.saExclusive ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">SA 🇿🇦</span>
                          ) : null}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{job.testers}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{job.deadline}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{job.submissions}</td>
                  <td className="px-5 py-3">
                    <a
                      href="/report-details"
                      className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DeveloperShell>
  );
}

export function SquashDeveloperSubmissionsPage() {
  return (
    <DeveloperShell
      title="All Recent Submissions"
      subtitle="Every tester submission across your active jobs."
      active="reports"
    >
      <div className="space-y-3">
        {submissions.map((item) => (
          <div
            key={`${item.app}-${item.tester}-${item.time}`}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">{item.app}</div>
              <div className="text-sm text-slate-500">Submitted by {item.tester}</div>
              <div className="mt-1 text-xs text-slate-400">{item.time}</div>
              <div className="mt-2">
                <TesterBadge testsCompleted={item.testsCompleted} rating={item.rating} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {item.videoDuration ? (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                  Screen Recording — {item.videoDuration}
                </span>
              ) : null}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityClasses(item.severity)}`}>
                {item.severity}
              </span>
              <a
                href="/report-details"
                className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open report
              </a>
            </div>
          </div>
        ))}
      </div>
    </DeveloperShell>
  );
}

export function SquashDeveloperActivityPage() {
  return (
    <DeveloperShell
      title="All Activity"
      subtitle="Timeline of actions and updates from your workspace."
      active="reports"
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-5">
          {activityItems.map((item, index) => (
            <div key={`${item.text}-${index}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.color}`}>
                  <Activity className="h-4 w-4" />
                </div>
                {index !== activityItems.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
              </div>
              <div className="pb-2">
                <div className="font-medium text-slate-800">{item.text}</div>
                <div className="mt-1 text-sm text-slate-500">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DeveloperShell>
  );
}

export function SquashReportAttachmentsPage() {
  return (
    <DeveloperShell
      title="All Attachments"
      subtitle="Files uploaded for this report and related updates."
      active="reports"
    >
      <div className="space-y-4">
        {attachments.map((file) => (
          <div key={file.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xs font-bold ${file.accent}`}>
                  {file.icon}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">{file.name}</div>
                  <div className="text-sm text-slate-500">{file.meta}</div>
                </div>
              </div>
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(file.name)}`}
                download={file.name}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
            {file.meta.includes('MP4') ? (
              <div className="mt-3">
                <div className="mb-2 text-xs font-semibold text-slate-600">
                  Screen Recording — 00:41
                </div>
                <video
                  controls
                  className="w-full rounded-xl border border-slate-200 bg-black"
                  src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                />
              </div>
            ) : null}
          </div>
        ))}

        <a
          href="/report-details"
          className="mt-4 inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to report details
        </a>
      </div>
    </DeveloperShell>
  );
}
