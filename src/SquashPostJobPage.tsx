import {
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Home,
  Lock,
  Menu,
  RotateCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SpecializationChecklist from './components/SpecializationChecklist';
import { TEST_CATEGORIES, type TestCategoryId, getCategoryById } from './components/testCategories';
import DeveloperHeaderNav from './components/DeveloperHeaderNav';
import MobileTabBar from './components/MobileTabBar';
import { useAuth } from './auth';
import { createDeveloperJob, updateDeveloperJob, type DeveloperJobInput, type JobPackageKey } from './lib/jobApi';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const defaultTestTasks: string[] = [];

function parseTaskList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((task) => task.trim())
    .filter(Boolean);
}

export default function SquashPostJobPage() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = (searchParams.get('plan') ?? '').toLowerCase();
  const packageConfigs = {
    starter: { label: 'Starter Plan', testers: 5, total: 500 },
    growth: { label: 'Growth Plan', testers: 10, total: 1200 },
    pro: { label: 'Pro Plan', testers: 20, total: 2500 },
  } as const;
  type PackageKey = keyof typeof packageConfigs;
  type SelectedPackage = PackageKey | '';
  const initialPackage: SelectedPackage =
    plan === 'starter' || plan === 'growth' || plan === 'pro' ? (plan as PackageKey) : '';
  const [appName, setAppName] = useState('');
  const [platform, setPlatform] = useState('Android');
  const [appType, setAppType] = useState('Mobile Application');
  const [url, setUrl] = useState('');
  const [appLogoUrl, setAppLogoUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [testType, setTestType] = useState<TestCategoryId>('mobile-app-testing');
  const [selectedPackage, setSelectedPackage] = useState<SelectedPackage>(initialPackage);
  const [ratePerTester, setRatePerTester] = useState<number>(initialPackage ? packageConfigs[initialPackage].total : 0);
  const [testersNeeded, setTestersNeeded] = useState<number>(initialPackage ? packageConfigs[initialPackage].testers : 0);
  const [testTasks, setTestTasks] = useState<string[]>(defaultTestTasks);
  const [taskDraft, setTaskDraft] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [testingTypes, setTestingTypes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState('18 - 25');
  const [deviceType, setDeviceType] = useState('Android');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const draftHydratedRef = useRef(false);
  const [testerTierFilter, setTesterTierFilter] = useState<'All' | 'Verified+' | 'Pro+' | 'Elite Only'>('All');
  const [preferredSpecializations, setPreferredSpecializations] = useState<string[]>([]);
  const [liveSessionEnabled, setLiveSessionEnabled] = useState(false);
  const [liveSessionAt, setLiveSessionAt] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [draftJobId, setDraftJobId] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (!selectedPackage) {
      setRatePerTester(0);
      setTestersNeeded(0);
      return;
    }
    setRatePerTester(packageConfigs[selectedPackage].total);
    setTestersNeeded(packageConfigs[selectedPackage].testers);
  }, [selectedPackage]);
  useEffect(() => {
    const rawDraft = window.localStorage.getItem('squash_post_job_draft');
    if (!rawDraft) {
      draftHydratedRef.current = true;
      return;
    }
    try {
      const draft = JSON.parse(rawDraft) as Partial<{
        appName: string;
        platform: string;
        appType: string;
        url: string;
        shortDescription: string;
        appLogoUrl: string;
        testType: TestCategoryId;
        selectedPackage: SelectedPackage;
        ratePerTester: number;
        testersNeeded: number;
        testerTierFilter: 'All' | 'Verified+' | 'Pro+' | 'Elite Only';
        preferredSpecializations: string[];
        liveSessionEnabled: boolean;
        liveSessionAt: string;
        tasksToComplete: string;
        taskDraft: string;
        focusAreas: string;
        testingTypes: string[];
        ageRange: string;
        deviceType: string;
        experienceLevel: string;
        additionalInfo: string;
        currentStep: number;
        draftJobId: string;
      }>;
      if (
        draft.appName === 'FitTrack Mobile' &&
        draft.url === 'https://fittrack.app/download' &&
        draft.shortDescription === 'A fitness tracking app for workouts, tracking progress and goals.'
      ) {
        window.localStorage.removeItem('squash_post_job_draft');
        return;
      }
      if (draft.appName) setAppName(draft.appName);
      if (draft.platform) setPlatform(draft.platform);
      if (draft.appType) setAppType(draft.appType);
      if (draft.url) setUrl(draft.url);
      if (draft.shortDescription) setShortDescription(draft.shortDescription);
      if (draft.appLogoUrl) setAppLogoUrl(draft.appLogoUrl);
      if (draft.testType) setTestType(draft.testType);
      if (draft.selectedPackage) setSelectedPackage(draft.selectedPackage);
      if (typeof draft.ratePerTester === 'number') setRatePerTester(draft.ratePerTester);
      if (typeof draft.testersNeeded === 'number') setTestersNeeded(draft.testersNeeded);
      if (draft.testerTierFilter) setTesterTierFilter(draft.testerTierFilter);
      if (Array.isArray(draft.preferredSpecializations)) setPreferredSpecializations(draft.preferredSpecializations);
      if (typeof draft.liveSessionEnabled === 'boolean') setLiveSessionEnabled(draft.liveSessionEnabled);
      if (draft.liveSessionAt) setLiveSessionAt(draft.liveSessionAt);
      if (draft.tasksToComplete) setTestTasks(parseTaskList(draft.tasksToComplete));
      if (draft.taskDraft) setTaskDraft(draft.taskDraft);
      if (draft.focusAreas) setFocusAreas(draft.focusAreas);
      if (Array.isArray(draft.testingTypes)) setTestingTypes(draft.testingTypes);
      if (draft.ageRange) setAgeRange(draft.ageRange);
      if (draft.deviceType) setDeviceType(draft.deviceType);
      if (draft.experienceLevel) setExperienceLevel(draft.experienceLevel);
      if (draft.additionalInfo) setAdditionalInfo(draft.additionalInfo);
      if (typeof draft.currentStep === 'number') setCurrentStep(Math.min(Math.max(draft.currentStep, 0), 4));
      if (draft.draftJobId) setDraftJobId(draft.draftJobId);
      setFeedbackMessage('Draft restored. Continue editing or publish when ready.');
    } catch {
      window.localStorage.removeItem('squash_post_job_draft');
    } finally {
      draftHydratedRef.current = true;
    }
  }, []);


  const selectedPackageConfig = selectedPackage ? packageConfigs[selectedPackage] : null;
  const hasSelectedPackage = Boolean(selectedPackageConfig);
  const liveSessionAddon = liveSessionEnabled ? 2000 : 0;
  const subtotal = useMemo(() => (selectedPackage ? Math.max(0, ratePerTester) : 0), [ratePerTester, selectedPackage]);
  const platformFee = useMemo(() => 0, [subtotal]);
  const total = hasSelectedPackage ? subtotal + platformFee + liveSessionAddon : 0;
  const taskChecklistText = useMemo(() => testTasks.map((task) => task.trim()).filter(Boolean).join('\n'), [testTasks]);
  const draftPayload = useMemo(() => ({
    appName,
    platform,
    appType,
    url,
    shortDescription,
    appLogoUrl,
    testType,
    selectedPackage,
    ratePerTester,
    testersNeeded,
    testerTierFilter,
    preferredSpecializations,
    liveSessionEnabled,
    liveSessionAt,
    tasksToComplete: taskChecklistText,
    taskDraft,
    focusAreas,
    testingTypes,
    ageRange,
    deviceType,
    experienceLevel,
    additionalInfo,
    currentStep,
    draftJobId,
  }), [
    additionalInfo,
    ageRange,
    appLogoUrl,
    appName,
    appType,
    currentStep,
    deviceType,
    draftJobId,
    experienceLevel,
    focusAreas,
    liveSessionAt,
    liveSessionEnabled,
    platform,
    preferredSpecializations,
    ratePerTester,
    selectedPackage,
    shortDescription,
    taskChecklistText,
    taskDraft,
    testerTierFilter,
    testersNeeded,
    testingTypes,
    testType,
    url,
  ]);

  const hasDraftContent = useMemo(
    () =>
      Boolean(
        appName.trim() ||
          url.trim() ||
          shortDescription.trim() ||
          appLogoUrl ||
          taskChecklistText ||
          taskDraft.trim() ||
          focusAreas.trim() ||
          additionalInfo.trim() ||
          preferredSpecializations.length > 0 ||
          selectedPackage ||
          liveSessionEnabled ||
          draftJobId,
      ),
    [
      additionalInfo,
      appLogoUrl,
      appName,
      draftJobId,
      focusAreas,
      testingTypes,
      liveSessionEnabled,
      preferredSpecializations.length,
      selectedPackage,
      shortDescription,
      taskChecklistText,
      taskDraft,
      url,
    ],
  );
  const formatZar = (amount: number) => `R${amount.toLocaleString('en-ZA')}`;
  const getErrorMessage = (error: unknown, fallback: string) => {
    if (!error) return fallback;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message || fallback);
    }
    return fallback;
  };
  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      if (!appName.trim()) return 'Please add the app name before continuing.';
      if (!shortDescription.trim()) return 'Please add a short app description before continuing.';
    }
    if (stepIndex === 1) {
      if (!selectedPackage) return 'Please choose a package before continuing.';
      if (testTasks.every((task) => !task.trim())) return 'Please add the tasks testers must complete.';
      if (!focusAreas.trim()) return 'Please add what testers should focus on.';
    }
    return '';
  };

  const addTestTask = () => {
    const nextTask = taskDraft.trim();
    if (!nextTask) return;
    setTestTasks((tasks) => [...tasks, nextTask]);
    setTaskDraft('');
  };

  const updateTestTask = (index: number, value: string) => {
    setTestTasks((tasks) => tasks.map((task, taskIndex) => (taskIndex === index ? value : task)));
  };

  const removeTestTask = (index: number) => {
    setTestTasks((tasks) => tasks.filter((_, taskIndex) => taskIndex !== index));
  };

  useEffect(() => {
    if (!draftHydratedRef.current || !hasDraftContent || submitting) return;

    const timer = window.setTimeout(() => {
      window.localStorage.setItem('squash_post_job_draft', JSON.stringify(draftPayload));
      setAutoSavedAt(new Date());
    }, 800);

    return () => window.clearTimeout(timer);
  }, [draftPayload, hasDraftContent, submitting]);
  const goNext = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setFeedbackMessage('');
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage('');
    setFeedbackMessage('');
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const goBack = () => {
    setErrorMessage('');
    setFeedbackMessage('');
    setCurrentStep((step) => Math.max(step - 1, 0));
  };


  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedbackMessage('');
      setErrorMessage('Please upload an image file for the job logo.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setFeedbackMessage('');
      setErrorMessage('Please keep the logo under 1MB for now.');
      return;
    }
    if (!isSupabaseConfigured || !session?.userId || false || !session.roles.includes('developer')) {
      setFeedbackMessage('');
      setErrorMessage('Please log in with a real developer account before uploading a job logo.');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const safeName = `${Date.now()}-${appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'job-logo'}.${extension}`;
    const storagePath = `${session.userId}/${safeName}`;

    setLogoUploading(true);
    setErrorMessage('');
    setFeedbackMessage('Uploading logo...');

    try {
      const { error: uploadError } = await supabase.storage
        .from('job-logos')
        .upload(storagePath, file, {
          cacheControl: '31536000',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('job-logos').getPublicUrl(storagePath);
      setAppLogoUrl(data.publicUrl);
      setFeedbackMessage('Logo uploaded. Save as draft or continue to publish it with the job.');
    } catch (error) {
      setAppLogoUrl('');
      setFeedbackMessage('');
      setErrorMessage(
        error instanceof Error
          ? `Logo upload failed: ${error.message}. Make sure the job-logos storage bucket exists.`
          : 'Logo upload failed. Make sure the job-logos storage bucket exists.',
      );
    } finally {
      setLogoUploading(false);
    }
  };
  const buildJobInput = (status: 'draft' | 'active'): DeveloperJobInput | null => {
    if (!session?.userId) {
      setErrorMessage('Please log in with a developer account first.');
      return null;
    }
    if (!selectedPackage) {
      setErrorMessage('Please choose a package before saving or publishing this job.');
      return null;
    }

    return {
      developerId: session.userId,
      title: appName,
      appUrl: url,
      platform,
      category: testType,
      packageKey: selectedPackage as JobPackageKey,
      totalAmountZar: total,
      testersNeeded,
      description: shortDescription,
      logoUrl: appLogoUrl || null,
      tasks: taskChecklistText,
      focusAreas: [testingTypes.join(', '), focusAreas].filter(Boolean).join('\n'),
      preferredSpecializations,
      liveSessionEnabled,
      liveSessionAt: liveSessionEnabled && liveSessionAt ? liveSessionAt : null,
      status,
    };
  };

  const saveDraft = async () => {
    window.localStorage.setItem('squash_post_job_draft', JSON.stringify(draftPayload));

    if (!session?.userId || !session.roles.includes('developer') || false) {
      setErrorMessage('');
      setFeedbackMessage('Draft saved on this device. Log in with a developer account to save it online.');
      return;
    }

    const jobInput = buildJobInput('draft');
    if (!jobInput) return;

    setSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');
    try {
      const draft = draftJobId ? await updateDeveloperJob(draftJobId, jobInput) : await createDeveloperJob(jobInput);
      setDraftJobId(draft.id);
      window.localStorage.setItem('squash_post_job_draft', JSON.stringify({ ...draftPayload, draftJobId: draft.id }));
      setFeedbackMessage('Draft saved. You can return and publish it later.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to save this draft right now.'));
    } finally {
      setSubmitting(false);
    }
  };
  const submitStep = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateStep(0) || validateStep(1);
    if (validationError) {
      setFeedbackMessage('');
      setErrorMessage(validationError);
      setCurrentStep(validationError.includes('app name') ? 0 : 1);
      return;
    }

    if (currentStep < steps.length - 1) {
      goNext();
      return;
    }

    if (!session?.userId || !session.roles.includes('developer') || false) {
      setFeedbackMessage('');
      setErrorMessage('Please log in with a real developer account before publishing a job. Your draft has been saved on this device.');
      await saveDraft();
      return;
    }

    const jobInput = buildJobInput('active');
    if (!jobInput) return;

    setSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      const job = draftJobId ? await updateDeveloperJob(draftJobId, jobInput) : await createDeveloperJob(jobInput);
      window.localStorage.removeItem('squash_post_job_draft');
      setDraftJobId(null);
      setFeedbackMessage(`Job published: ${job.title}. It is now visible to matching testers.`);
      window.setTimeout(() => navigate('/dashboard'), 900);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to publish this job right now.'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSpecialization = (id: string, checked: boolean) => {
    setPreferredSpecializations((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id),
    );
  };

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Post a Job', icon: ClipboardList, href: '/post-job', active: true },
    { label: 'Reports', icon: FileText, href: '/report-details' },
    { label: 'Billing', icon: CreditCard, href: '/billing' },
  ];

  const steps = [
    'App Details',
    'Test Requirements',
    'Tester Profile',
    'Add-ons & Notes',
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
                <a href="/report-details" className="block w-full rounded-2xl border border-green-600 px-4 py-3 text-center font-semibold text-green-700 hover:bg-green-50">
                  View Reports
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

                <DeveloperHeaderNav />
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
                        index === currentStep
                          ? 'bg-green-600 text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-semibold ${
                          index === currentStep ? 'text-green-700' : 'text-slate-600'
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
                <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${currentStep === 0 ? '' : 'hidden'}`}>
                  <h2 className="text-2xl font-bold text-slate-900">1. App Details</h2>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        App / Project Name
                      </label>
                      <input
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="e.g. PayFlow Web App"
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
                        placeholder="https://your-app.com/staging"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Job Logo / App Icon</label>
                      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                          {appLogoUrl ? (
                            <img src={appLogoUrl} alt={`${appName || 'Job'} logo preview`} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900">Add the icon testers will recognize</div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Upload a square PNG, JPG, SVG, or WEBP under 1MB. We store it securely in Supabase Storage.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                              <Upload className="h-4 w-4" />
                              {logoUploading ? 'Uploading...' : 'Upload logo'}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                className="hidden"
                                disabled={logoUploading}
                                onChange={(event) => handleLogoUpload(event.target.files?.[0])}
                              />
                            </label>
                            {appLogoUrl ? (
                              <button
                                type="button"
                                onClick={() => setAppLogoUrl('')}
                                disabled={logoUploading}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                              >
                                <X className="h-4 w-4" /> Remove
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
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
                      placeholder="Briefly explain what your app does and who it is for..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                    />
                    <div className="mt-2 text-right text-xs text-slate-400">{shortDescription.length} / 300</div>
                  </div>
                </section>

                <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${currentStep === 1 ? '' : 'hidden'}`}>
                  <h2 className="text-2xl font-bold text-slate-900">2. Test Requirements</h2>

                  <div className="mt-6 grid gap-5 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Test Type</label>
                      <div className="relative">
                        <select
                          value={testType}
                          onChange={(e) => setTestType(e.target.value as TestCategoryId)}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-700 outline-none transition focus:border-green-500"
                        >
                          {TEST_CATEGORIES.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Package</label>
                      <div className="relative">
                        <select
                          value={selectedPackage}
                          onChange={(e) => setSelectedPackage(e.target.value as SelectedPackage)}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option value="">Select package</option>
                          <option value="starter">Starter (R500)</option>
                          <option value="growth">Growth (R1,200)</option>
                          <option value="pro">Pro (R2,500)</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
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

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {!selectedPackage ? (
                      <span>Choose a package to see what is included</span>
                    ) : selectedPackage === 'starter' ? (
                      <span>Screenshots only (upgrade for video reports)</span>
                    ) : (
                      <span>Video bug reports included</span>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-4 text-sm text-slate-700">
                    <span className="font-semibold text-green-700">SQUASH Protection:</span> You will
                    be charged once the job is published and testers start applying.
                  </div>
                  <div className="mt-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-4 text-sm text-slate-700">
                    Apps scoring 80+ receive a SQUASH CERTIFIED badge to use on your app store listing
                    - included free with Growth and Pro plans.
                  </div>

                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700">
                          Tester task checklist
                        </label>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Add each action as a separate task. These will become checkboxes for testers during the active test.
                        </p>
                      </div>
                      <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-100">
                        {testTasks.filter((task) => task.trim()).length} tasks
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {testTasks.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                          No tasks added yet. Add the first tester action below.
                        </div>
                      ) : null}
                      {testTasks.map((task, index) => (
                        <div key={`${index}-${task}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-green-200 bg-green-50 text-sm font-bold text-green-700">
                            {index + 1}
                          </div>
                          <input
                            value={task}
                            onChange={(e) => updateTestTask(index, e.target.value)}
                            placeholder="Example: Create an account"
                            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeTestTask(index)}
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input
                        value={taskDraft}
                        onChange={(e) => setTaskDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTestTask();
                          }
                        }}
                        placeholder="Add another task testers must complete..."
                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500"
                      />
                      <button
                        type="button"
                        onClick={addTestTask}
                        className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>

                  {/* Testing Types */}
                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Type of Testing Required <span className="text-xs font-normal text-slate-400 ml-1">(select all that apply)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Functional Testing',
                        'Usability Testing',
                        'Exploratory Testing',
                        'Regression Testing',
                        'Feature Validation Testing',
                        'First Impression Testing',
                        'Compatibility Testing',
                        'Accessibility Testing',
                      ].map((type) => {
                        const selected = testingTypes.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setTestingTypes((prev) =>
                                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                              )
                            }
                            className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                              selected
                                ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-700'
                            }`}
                          >
                            {selected ? '✓ ' : ''}{type}
                          </button>
                        );
                      })}
                    </div>
                    {testingTypes.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600 font-medium">Select at least one testing type.</p>
                    )}
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Additional Focus Areas <span className="text-xs font-normal text-slate-400 ml-1">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={focusAreas}
                      onChange={(e) => setFocusAreas(e.target.value)}
                      placeholder="Example: checkout flow, confusing screens, slow loading, crashes, broken links..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                    />
                  </div>
                </section>

                <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${currentStep === 2 ? '' : 'hidden'}`}>
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

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Tester Tier</label>
                      <div className="relative">
                        <select
                          value={testerTierFilter}
                          onChange={(e) =>
                            setTesterTierFilter(e.target.value as 'All' | 'Verified+' | 'Pro+' | 'Elite Only')
                          }
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option>All</option>
                          <option>Verified+</option>
                          <option>Pro+</option>
                          <option>Elite Only</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <div className="font-semibold text-slate-800">Tier guidance</div>
                      <div className="mt-1">
                        {testerTierFilter === 'Elite Only'
                          ? 'Elite tester jobs include premium pricing.'
                          : 'Select a tier to match report quality and speed.'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-base font-semibold text-slate-900">Preferred Tester Specializations (optional)</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Filter for testers by device, network, language and app expertise.
                    </p>
                    <div className="mt-4">
                      <SpecializationChecklist selected={preferredSpecializations} onToggle={toggleSpecialization} compact />
                    </div>
                  </div>
                </section>

                <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${currentStep === 3 ? '' : 'hidden'}`}>
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

                <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${currentStep === 3 ? '' : 'hidden'}`}>
                  <h2 className="text-2xl font-bold text-slate-900">Live Session Add-on</h2>
                  <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={liveSessionEnabled}
                      onChange={(e) => setLiveSessionEnabled(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-green-600"
                    />
                    <span className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Add Live Test Session - R2,000</span>
                      <span className="mt-1 block">
                        Watch a tester use your app in real time via video call. Ask questions and observe their natural behavior live.
                      </span>
                    </span>
                  </label>

                  {liveSessionEnabled ? (
                    <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-slate-700">
                      <div>You will receive a Zoom/Google Meet link 24 hours before your scheduled session.</div>
                      <div>1 tester - 60 minute session - Screen share included</div>
                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Preferred session time</label>
                        <input
                          type="datetime-local"
                          value={liveSessionAt}
                          onChange={(event) => setLiveSessionAt(event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                        />
                      </div>
                    </div>
                  ) : null}
                </section>

                <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${currentStep === 4 ? '' : 'hidden'}`}>
                  <h2 className="text-2xl font-bold text-slate-900">5. Review &amp; Publish</h2>
                  <p className="mt-2 text-slate-600">Check everything before your job goes live to testers.</p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-500">App</div>
                      <div className="mt-1 flex items-center gap-3 text-lg font-bold text-slate-900">{appLogoUrl ? <img src={appLogoUrl} alt="" className="h-10 w-10 rounded-2xl object-cover ring-1 ring-slate-200" /> : null}<span>{appName || 'Untitled app'}</span></div>
                      <div className="mt-1 text-sm text-slate-600">{platform} - {appType}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-500">Testing</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{getCategoryById(testType).name}</div>
                      <div className="mt-1 text-sm text-slate-600">{testersNeeded || '-'} testers - {selectedPackageConfig?.label || 'Package not selected'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-500">Tester profile</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{testerTierFilter}</div>
                      <div className="mt-1 text-sm text-slate-600">{ageRange}, {deviceType}, {experienceLevel}</div>
                    </div>
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                      <div className="text-sm font-semibold text-green-700">Total</div>
                      <div className="mt-1 text-2xl font-black text-green-700">{hasSelectedPackage ? formatZar(total) : 'Select package'}</div>
                      <div className="mt-1 text-sm text-slate-600">{liveSessionEnabled ? 'Includes live session add-on' : hasSelectedPackage ? 'Job package only' : 'Choose a package first'}</div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-slate-700">
                    Publishing makes this job visible to matching testers. Saving as draft keeps it private until you are ready.
                  </div>
                </section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={saveDraft} disabled={submitting} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
                      {submitting ? 'Saving...' : 'Save as Draft'}
                    </button>
                    {currentStep > 0 ? (
                      <button type="button" onClick={goBack} disabled={submitting} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
                        Back
                      </button>
                    ) : null}
                  </div>

                  {currentStep < steps.length - 1 ? (
                    <button type="button" onClick={goNext} className="rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-green-700">
                      Next: {steps[currentStep + 1]}
                    </button>
                  ) : (
                    <button type="submit" disabled={submitting} className="rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                      {submitting ? 'Publishing...' : 'Publish Job'}
                    </button>
                  )}
                </div>
                {errorMessage ? <p className="text-sm font-semibold text-red-600">{errorMessage}</p> : null}
                {feedbackMessage ? <p className="text-sm font-semibold text-green-700">{feedbackMessage}</p> : null}
                {autoSavedAt ? (
                  <p className="text-xs font-semibold text-slate-500">Autosaved on this device at {autoSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                ) : null}
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900">Payment Summary</h3>

                  <div className="mt-5 space-y-4 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Test Type</span>
                      <span className="font-semibold text-slate-900">{getCategoryById(testType).name}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Package</span>
                      <span className="font-semibold text-slate-900">{selectedPackageConfig?.label || 'Choose a package'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Testers</span>
                      <span className="font-semibold text-slate-900">{testersNeeded}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Tester Tier</span>
                      <span className="font-semibold text-slate-900">{testerTierFilter}</span>
                    </div>
                    {liveSessionEnabled ? (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Live Session Add-on</span>
                        <span className="font-semibold text-slate-900">R2,000</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="my-5 border-t border-dashed border-slate-200" />

                  {hasSelectedPackage ? (
                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-green-50 px-4 py-4">
                      <span className="text-lg font-bold text-slate-900">Total</span>
                      <span className="text-2xl font-black text-green-700">{formatZar(total)}</span>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
                      Choose a package to calculate the total.
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
                  <div className="text-lg font-bold text-green-800">Your money is safe</div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-700" />
                      <span>Funds held in escrow until you approve</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-700" />
                      <span>Pay only when satisfied with results</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-green-700" />
                      <span>Request revisions before releasing payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-green-700" />
                      <span>Secure payment processing</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-lg font-bold text-slate-900">Auto-calculated</div>
                  <div className="mt-4 text-sm text-slate-500">Total Amount</div>
                  <div className="mt-2 text-4xl font-black text-green-700">{hasSelectedPackage ? formatZar(total) : 'Pending'}</div>
                  {testerTierFilter === 'Elite Only' ? (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                      Premium indicator: Elite tester tier selected.
                    </div>
                  ) : null}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-lg font-bold text-slate-900">Steps</div>
                  <div className="mt-5 space-y-4">
                    {steps.map((step, index) => (
                      <div key={step} className="flex gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            index === currentStep
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
                            {index === 3 && 'Add notes and optional live session'}
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
      <MobileTabBar role="developer" />
    </div>
  );
}













