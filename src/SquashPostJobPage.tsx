import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  Menu,
  Search,
  Settings,
  SlidersHorizontal,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SquashPostJobPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = (searchParams.get('plan') ?? '').toLowerCase();
  const initialRate = plan === 'basic' ? 60 : plan === 'premium' ? 120 : 90;
  const [appName, setAppName] = useState('FitTrack Mobile');
  const [platform, setPlatform] = useState('Android');
  const [appType, setAppType] = useState('Mobile Application');
  const [url, setUrl] = useState('https://fittrack.app/download');
  const [shortDescription, setShortDescription] = useState(
    'A fitness tracking app for workouts, tracking progress and goals.',
  );
  const [testType, setTestType] = useState('Usability Test');
  const [ratePerTester, setRatePerTester] = useState(initialRate);
  const [testersNeeded, setTestersNeeded] = useState(25);
  const [tasksToComplete, setTasksToComplete] = useState(
    'Create an account, start a workout, track a goal, and review weekly progress.',
  );
  const [focusAreas, setFocusAreas] = useState(
    'Bugs, UX issues, slow loading, confusing flows, and broken interactions.',
  );
  const [ageRange, setAgeRange] = useState('18 - 25');
  const [deviceType, setDeviceType] = useState('Android');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const subtotal = useMemo(
    () => Math.max(0, ratePerTester) * Math.max(0, testersNeeded),
    [ratePerTester, testersNeeded],
  );
  const platformFee = useMemo(() => Math.round(subtotal * 0.1), [subtotal]);
  const total = subtotal + platformFee;

  const formatZar = (amount: number) => `R${amount.toLocaleString('en-ZA')}`;

  const saveDraft = () => {
    const payload = {
      appName,
      platform,
      appType,
      url,
      shortDescription,
      testType,
      ratePerTester,
      testersNeeded,
      tasksToComplete,
      focusAreas,
      ageRange,
      deviceType,
      experienceLevel,
      additionalInfo,
    };
    window.localStorage.setItem('squash_post_job_draft', JSON.stringify(payload));
    setErrorMessage('');
    setFeedbackMessage('Draft saved successfully.');
  };

  const submitStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !url.trim() || !shortDescription.trim()) {
      setFeedbackMessage('');
      setErrorMessage('Please complete app name, URL, and short description.');
      return;
    }
    saveDraft();
    setErrorMessage('');
    setFeedbackMessage('Details saved. Continue to Review & Publish.');
    navigate('/post-job', { replace: true });
  };

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'My Jobs', icon: BriefcaseBusiness, href: '/dashboard' },
    { label: 'Post a Job', icon: ClipboardList, href: '/post-job', active: true },
    { label: 'Reports', icon: FileText, href: '/report-details' },
    { label: 'Testers', icon: Users, href: '/dashboard' },
    { label: 'Billing', icon: CreditCard, href: '/pricing' },
    { label: 'Settings', icon: Settings, href: '/dashboard' },
  ];

  const steps = [
    'App Details',
    'Test Requirements',
    'Tester Profile',
    'Testers Needed',
    'Review & Publish',
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
                  href={item.href}
                  key={item.label}
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
                  <div className="text-sm text-slate-500">Visit our Help Center for support.</div>
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
                      placeholder="Search jobs, testers, reports..."
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
                    placeholder="Search jobs, testers, reports..."
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Post a Test Job</h1>
              <p className="text-slate-600">Tell us about your app and what you need tested.</p>
            </div>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-5">
                {steps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0
                          ? 'bg-green-600 text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-semibold ${
                          index === 0 ? 'text-green-700' : 'text-slate-600'
                        }`}
                      >
                        {step}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <form onSubmit={submitStep} className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_0.7fr]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">1. App Details</h2>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        App / Project Name
                      </label>
                      <input
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Platform</label>
                      <div className="relative">
                        <select
                          value={platform}
                          onChange={(e) => setPlatform(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option>Android</option>
                          <option>iOS</option>
                          <option>Web</option>
                          <option>Cross Platform</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">App Type</label>
                      <div className="relative">
                        <select
                          value={appType}
                          onChange={(e) => setAppType(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option>Mobile Application</option>
                          <option>Web Application</option>
                          <option>API</option>
                          <option>Desktop Application</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        URL / Download Link
                      </label>
                      <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Short Description
                    </label>
                    <textarea
                      rows={4}
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                    />
                    <div className="mt-2 text-right text-xs text-slate-400">{shortDescription.length} / 300</div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">2. Test Requirements</h2>

                  <div className="mt-6 grid gap-5 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Test Type</label>
                      <div className="relative">
                        <select
                          value={testType}
                          onChange={(e) => setTestType(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option>Usability Test</option>
                          <option>Bug Hunt</option>
                          <option>Exploratory Test</option>
                          <option>Regression Test</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Rate per Tester (ZAR)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={ratePerTester}
                        onChange={(e) => setRatePerTester(Number(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Testers</label>
                      <input
                        type="number"
                        min={1}
                        value={testersNeeded}
                        onChange={(e) => setTestersNeeded(Number(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-4 text-sm text-slate-700">
                    <span className="font-semibold text-green-700">SQUASH Protection:</span> You will
                    be charged once the job is published and testers start applying.
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Specific Tasks to Complete
                    </label>
                    <textarea
                      rows={4}
                      value={tasksToComplete}
                      onChange={(e) => setTasksToComplete(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                    />
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      What should testers look for?
                    </label>
                    <textarea
                      rows={4}
                      value={focusAreas}
                      onChange={(e) => setFocusAreas(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                    />
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">3. Tester Profile</h2>

                  <div className="mt-6 grid gap-5 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Age Range</label>
                      <div className="relative">
                        <select
                          value={ageRange}
                          onChange={(e) => setAgeRange(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option>18 - 25</option>
                          <option>26 - 35</option>
                          <option>36 - 45</option>
                          <option>46+</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Device Type
                      </label>
                      <div className="relative">
                        <select
                          value={deviceType}
                          onChange={(e) => setDeviceType(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option>Android</option>
                          <option>iOS</option>
                          <option>Desktop</option>
                          <option>Any</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Experience Level
                      </label>
                      <div className="relative">
                        <select
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">4. Additional Information</h2>
                  <p className="mt-2 text-slate-600">
                    Add extra details about your app or testing goals.
                  </p>

                  <div className="mt-5">
                    <textarea
                      rows={5}
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Specific features to focus on, areas of concern, items to avoid..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                    />
                    <div className="mt-2 text-right text-xs text-slate-400">{additionalInfo.length} / 500</div>
                  </div>

                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Attachments (Optional)
                    </label>
                    <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                        <SlidersHorizontal className="h-6 w-6 text-slate-500" />
                      </div>
                      <div className="mt-4 text-base font-semibold text-slate-800">
                        Drag &amp; drop files here or click to browse
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        PDF, DOC, PNG, JPG up to 10MB each
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={saveDraft} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                    Save as Draft
                  </button>
                  <button type="submit" className="rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-green-700">
                    Next: Test Requirements -&gt;
                  </button>
                </div>
                {errorMessage ? <p className="text-sm font-semibold text-red-600">{errorMessage}</p> : null}
                {feedbackMessage ? <p className="text-sm font-semibold text-green-700">{feedbackMessage}</p> : null}
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900">Payment Summary</h3>

                  <div className="mt-5 space-y-4 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Test Type</span>
                      <span className="font-semibold text-slate-900">{testType}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Platform</span>
                      <span className="font-semibold text-slate-900">{platform}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Testers</span>
                      <span className="font-semibold text-slate-900">{testersNeeded}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Rate per Tester</span>
                      <span className="font-semibold text-slate-900">{formatZar(ratePerTester)}</span>
                    </div>
                  </div>

                  <div className="my-5 border-t border-dashed border-slate-200" />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900">{formatZar(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Platform Fee (10%)</span>
                      <span className="font-semibold text-slate-900">{formatZar(platformFee)}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl bg-green-50 px-4 py-4">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-black text-green-700">{formatZar(total)}</span>
                  </div>
                </section>

                <section className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
                  <div className="text-lg font-bold text-green-800">SQUASH Protection</div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    We hold payments securely and release only when you&apos;re happy with the reports.
                  </p>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-lg font-bold text-slate-900">Auto-calculated</div>
                  <div className="mt-4 text-sm text-slate-500">Total Amount</div>
                  <div className="mt-2 text-4xl font-black text-green-700">{formatZar(total)}</div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-lg font-bold text-slate-900">Steps</div>
                  <div className="mt-5 space-y-4">
                    {steps.map((step, index) => (
                      <div key={step} className="flex gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? 'bg-green-600 text-white'
                              : 'border border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{step}</div>
                          <div className="text-sm text-slate-500">
                            {index === 0 && 'Tell us about your app'}
                            {index === 1 && 'What to test and what to look for'}
                            {index === 2 && 'Who should test your app'}
                            {index === 3 && 'How many testers do you need'}
                            {index === 4 && 'Review and publish your job'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
