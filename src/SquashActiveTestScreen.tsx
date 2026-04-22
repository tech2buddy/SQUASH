import {
  Bell,
  Bug,
  Camera,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Home,
  Menu,
  Mic,
  PlayCircle,
  Search,
  Settings,
  Upload,
  UserCircle2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SquashActiveTestScreen() {
  const navigate = useNavigate();
  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: ClipboardList, href: '/tester-jobs' },
    { label: 'My Tests', icon: PlayCircle, href: '/active-test', active: true },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const tasks = [
    'Create an account / Sign up',
    'Set a daily step goal',
    'Navigate to the Stats page',
    'Track a workout',
    'Check how to view history',
    'Log out of the app',
  ];

  const bottomNav = ['Home', 'Stats', 'Progress', 'Profile'];
  const [taskState, setTaskState] = useState(tasks.map((_, index) => index < 2));
  const [bugDescription, setBugDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [bugNotice, setBugNotice] = useState('');
  const [progressNotice, setProgressNotice] = useState('');
  const completedTasks = useMemo(() => taskState.filter(Boolean).length, [taskState]);
  const progressPercent = useMemo(
    () => Math.round((completedTasks / taskState.length) * 100),
    [completedTasks, taskState.length],
  );

  const toggleTask = (index: number, checked: boolean) => {
    setTaskState((prev) => prev.map((item, idx) => (idx === index ? checked : item)));
  };

  const saveBugReport = () => {
    if (!bugDescription.trim()) {
      setBugNotice('Please describe the issue before saving.');
      return;
    }
    const existingReports = JSON.parse(
      window.localStorage.getItem('squash_bug_reports') ?? '[]',
    ) as Array<{ description: string; severity: string; createdAt: string }>;
    existingReports.unshift({
      description: bugDescription.trim(),
      severity,
      createdAt: new Date().toISOString(),
    });
    window.localStorage.setItem('squash_bug_reports', JSON.stringify(existingReports));
    setBugNotice('Bug report saved.');
    setBugDescription('');
  };

  const saveProgress = () => {
    window.localStorage.setItem(
      'squash_active_test_progress',
      JSON.stringify({
        taskState,
        updatedAt: new Date().toISOString(),
      }),
    );
    setProgressNotice('Progress saved.');
  };

  const submitTest = () => {
    if (completedTasks < taskState.length) {
      setProgressNotice(`Complete all tasks before submitting (${completedTasks}/${taskState.length}).`);
      return;
    }
    window.localStorage.setItem(
      'squash_active_test_submission',
      JSON.stringify({
        submittedAt: new Date().toISOString(),
        completedTasks,
      }),
    );
    setProgressNotice('Test submitted successfully.');
    navigate('/tester-jobs');
  };

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
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    item.active
                      ? 'bg-green-50 text-green-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="space-y-4 p-4 pt-0">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Active Test</div>
              <div className="mt-4 rounded-2xl bg-green-50 p-4">
                <div className="text-sm font-semibold text-green-700">FitTrack Mobile</div>
                <div className="mt-1 text-sm text-slate-600">
                  {completedTasks} / {taskState.length} tasks done
                </div>
              </div>
              <a href="#task-list" className="mt-4 inline-block text-sm font-semibold text-green-700">Continue Test -&gt;</a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Your Rating</div>
              <div className="mt-3 text-3xl font-black text-slate-900">4.7 *</div>
              <div className="mt-1 text-sm text-slate-500">From 28 reviews</div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <a href="/tester/menu" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 lg:hidden">
                    <Menu className="h-5 w-5" />
                  </a>
                  <div className="hidden max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex md:min-w-[320px] lg:min-w-[420px]">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      placeholder="Search jobs, tests, reports..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <a href="/tester/notifications" className="relative rounded-full border border-slate-200 p-2.5 text-slate-600">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      2
                    </span>
                  </a>
                  <a href="/tester/profile" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserCircle2 className="h-7 w-7" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-bold text-slate-900">Thando M.</div>
                      <div className="text-xs text-slate-500">Tester</div>
                    </div>
                  </a>
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">FitTrack Mobile</h1>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Usability Test
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                  Time Left: <span className="text-slate-900">18:24</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm">
                  <Mic className="h-4 w-4" /> LIVE Recording
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">App Preview</h2>
                    <p className="mt-1 text-slate-600">Live app view or simulated test environment.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open('https://fittrack.app/download', '_blank', 'noopener,noreferrer')}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Open in New Tab
                  </button>
                </div>

                <div className="mt-6 flex justify-center">
                  <div className="w-full max-w-sm rounded-[40px] border-[10px] border-slate-900 bg-slate-900 p-2 shadow-xl">
                    <div className="rounded-[32px] bg-white px-4 pb-4 pt-5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-slate-900">Dashboard</div>
                        <div className="h-8 w-8 rounded-full bg-slate-100" />
                      </div>

                      <div className="mt-5 rounded-3xl bg-slate-50 p-5 text-center">
                        <div className="text-sm text-slate-500">Good morning, Thando</div>
                        <div className="mt-4 text-sm font-semibold text-slate-600">Today&apos;s Progress</div>
                        <div className="mt-3 text-4xl font-black text-slate-900">7,842</div>
                        <div className="text-sm text-slate-500">/ 10,000 steps</div>

                        <div className="mt-6 flex h-28 items-end justify-between gap-2 rounded-2xl bg-white px-3 pb-3 pt-5 shadow-sm">
                          {[28, 50, 42, 60, 72, 64, 82].map((height, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                              <div
                                className={`w-full rounded-t-xl ${index === 6 ? 'bg-green-600' : 'bg-green-400/80'}`}
                                style={{ height: `${height}px` }}
                              />
                              <span className="text-[10px] text-slate-400">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 rounded-3xl border border-slate-200 p-4">
                        <div className="text-sm font-bold text-slate-900">Today&apos;s Goals</div>
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Steps</span>
                            <span className="font-semibold text-slate-900">7,842 / 10,000</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 w-[78%] rounded-full bg-green-600" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Calories</span>
                            <span className="font-semibold text-slate-900">430 / 600</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 w-[72%] rounded-full bg-green-500" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-slate-50 p-3 text-center text-[11px] text-slate-500">
                        {bottomNav.map((item, index) => (
                          <div
                            key={item}
                            className={`rounded-xl px-2 py-2 ${index === 0 ? 'bg-white font-semibold text-green-700 shadow-sm' : ''}`}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div id="task-list" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Your Tasks</h2>
                      <p className="mt-1 text-slate-600">Complete each step before submitting your report.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      {completedTasks} / {taskState.length} Done
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {tasks.map((task, index) => (
                      <label key={task} className="flex items-start gap-3 rounded-2xl border border-slate-100 px-4 py-4 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={taskState[index]}
                          onChange={(e) => toggleTask(index, e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <span className={`text-sm ${taskState[index] ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                          {task}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-red-500" />
                    <h2 className="text-2xl font-bold text-slate-900">Report a Bug</h2>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                    <textarea
                      rows={4}
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      placeholder="Describe the issue you found..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                    />
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Severity</label>
                      <div className="relative">
                        <select
                          value={severity}
                          onChange={(e) => setSeverity(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-600 outline-none transition focus:border-green-500"
                        >
                          <option>Critical</option>
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Screenshot</label>
                      <button
                        type="button"
                        onClick={() => setBugNotice('Screenshot attached.')}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        <Upload className="h-4 w-4" /> Upload Image
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setBugNotice('Screenshot captured.')}
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Camera className="h-4 w-4" /> Capture Screenshot
                    </button>
                    <button
                      type="button"
                      onClick={saveBugReport}
                      className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
                    >
                      Save Bug Report
                    </button>
                  </div>
                  {bugNotice ? <p className="mt-3 text-sm font-semibold text-green-700">{bugNotice}</p> : null}
                </div>

                <div className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
                  <div className="text-lg font-bold text-slate-900">Testing Notes</div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Test the signup, goals, stats, and workout flow carefully. Focus on confusing steps, broken interactions, and anything that feels slow.
                  </p>
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="w-full max-w-xl">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Progress</span>
                    <span className="font-semibold text-slate-900">
                      {completedTasks} / {taskState.length} Tasks Completed
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-green-600 transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={saveProgress}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Save Progress
                  </button>
                  <button
                    type="button"
                    onClick={submitTest}
                    className="rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    Submit Test
                  </button>
                </div>
              </div>
              {progressNotice ? <p className="mt-3 text-sm font-semibold text-green-700">{progressNotice}</p> : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
