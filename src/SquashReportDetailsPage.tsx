import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Download,
  FileText,
  Home,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useState } from 'react';

export default function SquashReportDetailsPage() {
  const [status, setStatus] = useState('Open');
  const [category, setCategory] = useState('Crash / Stability');
  const [reproducibility, setReproducibility] = useState('Always');
  const [actionNotice, setActionNotice] = useState('');

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'My Jobs', icon: BriefcaseBusiness, href: '/dashboard' },
    { label: 'Reports', icon: FileText, href: '/report-details', active: true },
    { label: 'Testers', icon: Users, href: '/tester-jobs' },
    { label: 'Messages', icon: MessageSquare, href: '/report-details', badge: '2' },
    { label: 'Billing', icon: CreditCard, href: '/pricing' },
    { label: 'Settings', icon: Settings, href: '/dashboard' },
  ];

  const tabs = [
    { label: 'Report Details', active: true },
    { label: 'Comments (3)' },
    { label: 'Attachments (2)' },
    { label: 'Activity' },
  ];

  const steps = [
    'Open the FitTrack Mobile app.',
    'Tap on "Workouts" from the bottom navigation.',
    'Tap "Add Workout".',
    'Add more than 5 exercises.',
    'Tap "Save Workout".',
    'App crashes and returns to home screen.',
  ];

  const attachments = [
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
  ];

  const activity = [
    {
      title: 'Report submitted',
      author: 'by Sipho N.',
      detail: '',
      time: '26 May 2024, 10:45 AM',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Developer comment',
      author: 'by Alex Developer',
      detail: 'Please provide steps to reproduce.',
      time: '26 May 2024, 11:15 AM',
      color: 'bg-sky-100 text-sky-600',
    },
    {
      title: 'Tester reply',
      author: 'by Sipho N.',
      detail: 'Steps added in the report.',
      time: '26 May 2024, 11:32 AM',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Status changed to Open',
      author: 'by Alex Developer',
      detail: '',
      time: '26 May 2024, 11:35 AM',
      color: 'bg-amber-100 text-amber-600',
    },
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
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active
                      ? 'bg-green-50 text-green-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </a>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Quick Actions</div>
              <div className="mt-4 space-y-3">
                <a
                  href="/post-job"
                  className="block w-full rounded-2xl bg-green-600 px-4 py-3 text-center font-semibold text-white hover:bg-green-700"
                >
                  Post a New Job
                </a>
                <a href="/tester-jobs" className="block w-full rounded-2xl border border-green-600 px-4 py-3 text-center font-semibold text-green-700 hover:bg-green-50">
                  Invite Testers
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <CircleHelp className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Need Help?</div>
                  <div className="text-sm text-slate-500">
                    Visit our Help Center for guides and support.
                  </div>
                </div>
              </div>
              <a href="/help-center" className="mt-4 inline-block text-sm font-semibold text-green-700">Go to Help Center -&gt;</a>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[320px] lg:min-w-[420px]">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="Search jobs, tests, reports..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <button className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      3
                    </span>
                  </button>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserCircle2 className="h-7 w-7" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-bold text-slate-900">Alex Developer</div>
                      <div className="text-xs text-slate-500">Developer</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:hidden">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Search jobs, tests, reports..."
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <a
                  href="/dashboard"
                  className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Reports
                </a>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900">
                    FitTrack Mobile - Usability Test
                  </h1>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    Critical
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span>
                    Reported by <span className="font-semibold text-slate-700">Sipho N.</span>
                  </span>
                  <span>-</span>
                  <span>26 May 2024, 10:45 AM</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a href="/report-details" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </a>
                <a href="/report-details" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                  Next <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  className={`border-b-2 px-2 pb-4 text-sm font-semibold transition ${
                    tab.active
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Bug Details</h2>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-500">Bug Title</div>
                      <div className="mt-2 text-2xl font-bold text-slate-900">
                        App crashes when adding workout
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-500">Bug ID</div>
                      <div className="mt-2 text-2xl font-bold text-slate-900">#BUG-1247</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-500">Severity</div>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-500">Status</div>
                      <div className="relative md:max-w-[170px]">
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="mt-3 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-left text-sm font-semibold text-red-500 outline-none transition focus:border-green-500"
                        >
                          <option>Open</option>
                          <option>In Review</option>
                          <option>Resolved</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-500">Category</div>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="mt-3 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-left text-sm font-semibold text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option>Crash / Stability</option>
                          <option>UI / UX</option>
                          <option>Performance</option>
                          <option>Functional Bug</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-500">Found in Version</div>
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        v2.3.1 (Build 45)
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-500">Device &amp; OS</div>
                      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        <Smartphone className="h-4 w-4 text-slate-400" /> Samsung Galaxy S23 -
                        Android 14
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-500">Reproducibility</div>
                      <div className="relative md:max-w-[170px]">
                        <select
                          value={reproducibility}
                          onChange={(e) => setReproducibility(e.target.value)}
                          className="mt-3 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-left text-sm font-semibold text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option>Always</option>
                          <option>Sometimes</option>
                          <option>Rarely</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-sm font-semibold text-slate-500">Summary</div>
                    <p className="mt-3 text-base leading-7 text-slate-700">
                      The app crashes every time I try to add a new workout with more than 5
                      exercises.
                    </p>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Steps to Reproduce</h2>
                  <div className="mt-6 space-y-4">
                    {steps.map((step, index) => (
                      <div key={step} className="flex items-start gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-green-700 ring-1 ring-green-100">
                          {index + 1}
                        </div>
                        <div className="pt-1 text-slate-700">{step}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 p-6">
                    <h2 className="text-2xl font-bold text-slate-900">Expected Result</h2>
                    <div className="mt-4 flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-100">
                        OK
                      </div>
                      <p className="pt-0.5 text-slate-700">
                        Workout should be saved successfully without crashing.
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-slate-900">Actual Result</h2>
                    <div className="mt-4 flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
                        X
                      </div>
                      <p className="pt-0.5 text-slate-700">
                        App crashes and returns to the home screen.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Report Summary</h2>

                  <div className="mt-5 space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-3 text-slate-600">
                      <span>Job</span>
                      <span className="text-right font-semibold text-slate-900">
                        FitTrack Mobile - Usability Test
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-slate-600">
                      <span>Test Type</span>
                      <span className="font-semibold text-slate-900">Usability Test</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-slate-600">
                      <span>Tester</span>
                      <span className="font-semibold text-green-700">Sipho N.</span>
                    </div>
                  </div>

                  <div className="my-5 border-t border-slate-200" />

                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Time Spent</span>
                      <span className="font-semibold text-slate-900">18m 24s</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Submitted</span>
                      <span className="font-semibold text-slate-900">26 May 2024, 10:45 AM</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Attachments (2)</h2>
                    <a href="/report-details" className="text-sm font-semibold text-green-700">View all</a>
                  </div>

                  <div className="mt-5 space-y-4">
                    {attachments.map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                      >
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
                          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Activity</h2>

                  <div className="mt-6 space-y-5">
                    {activity.map((item, index) => (
                      <div key={`${item.title}-${index}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.color}`}>
                            <span className="text-base font-bold">.</span>
                          </div>
                          {index !== activity.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
                        </div>
                        <div className="pb-3">
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="mt-1 text-sm text-slate-500">{item.author}</div>
                          {item.detail ? <div className="mt-1 text-sm text-slate-700">{item.detail}</div> : null}
                          <div className="mt-2 text-xs text-slate-400">{item.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700">
                  Status: {status}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActionNotice('More information requested from tester.')}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Request More Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionNotice('Report assigned to developer queue.')}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Assign to Developer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('Resolved');
                      setActionNotice('Report marked as resolved.');
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    <ShieldCheck className="h-4 w-4" /> Mark as Resolved
                  </button>
                </div>
              </div>
              {actionNotice ? <p className="mt-3 text-sm font-semibold text-green-700">{actionNotice}</p> : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
