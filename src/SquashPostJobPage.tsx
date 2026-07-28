import {
  CheckCircle2,
  ChevronDown,
  Image as ImageIcon,
  Lock,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import { type DragEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import SpecializationChecklist from './components/SpecializationChecklist';
import { TEST_CATEGORIES, type TestCategoryId, getCategoryById } from './components/testCategories';
import { TEST_TYPES, getTestTypeByKey, type TestTypeKey } from './lib/testTypes';
import { useAuth } from './auth';
import { createDeveloperJob, getDeveloperJob, updateDeveloperJob, type DeveloperJobInput, type JobPackageKey } from './lib/jobApi';
import { startJobCheckout } from './lib/paymentApi';
import { hasExpectedFileSignature, type SafeFileKind } from './lib/fileValidation';
import { uploadDeveloperJobAttachments, validateJobAttachment } from './lib/jobAttachmentApi';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { briefCompletionIssues, type TestBrief } from './lib/testBrief';

const defaultTestTasks: string[] = [];
const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';
function getErrorMessage(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || fallback);
  }
  return fallback;
}


export default function SquashPostJobPage() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = (searchParams.get('plan') ?? '').toLowerCase();
  const editingJobId = searchParams.get('job');
  type SelectedTestType = TestTypeKey | '';
  const initialTestType: SelectedTestType = TEST_TYPES.some((testTypeOption) => testTypeOption.key === plan)
    ? (plan as TestTypeKey)
    : '';
  const [appName, setAppName] = useState('');
  const [platform, setPlatform] = useState('Android');
  const [appType, setAppType] = useState('Mobile Application');
  const [url, setUrl] = useState('');
  const [appLogoUrl, setAppLogoUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [testType, setTestType] = useState<TestCategoryId>('mobile-app-testing');
  const [selectedTestType, setSelectedTestType] = useState<SelectedTestType>(initialTestType);
  const [ratePerTester, setRatePerTester] = useState<number>(initialTestType ? getTestTypeByKey(initialTestType).ratePerTesterZar : 0);
  const [testersNeeded, setTestersNeeded] = useState<number>(initialTestType ? getTestTypeByKey(initialTestType).defaultTesters : 0);
  const [testTasks, setTestTasks] = useState<string[]>(defaultTestTasks);
  const [taskDraft, setTaskDraft] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [testObjective, setTestObjective] = useState('');
  const [accessInstructions, setAccessInstructions] = useState('');
  const [requiredEnvironment, setRequiredEnvironment] = useState('');
  const [outOfScope, setOutOfScope] = useState('');
  const [evidenceRules, setEvidenceRules] = useState('');
  const [taskExpectedOutcomes, setTaskExpectedOutcomes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState('18 - 25');
  const [deviceType, setDeviceType] = useState('Android');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [additionalInfo, setAdditionalInfo] = useState('');
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
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  useEffect(() => {
    if (!selectedTestType) {
      setRatePerTester(0);
      setTestersNeeded(0);
      return;
    }
    const config = getTestTypeByKey(selectedTestType);
    setRatePerTester(config.ratePerTesterZar);
    setTestersNeeded(config.defaultTesters);
  }, [selectedTestType]);


  useEffect(() => {
    if (!editingJobId || !session?.userId || !session.roles.includes('developer')) return;
    let active = true;
    getDeveloperJob(editingJobId, session.userId)
      .then((job) => {
        if (!active) return;
        if (!job) throw new Error('This job was not found or does not belong to your developer account.');
        if (job.status !== 'draft') throw new Error('Only draft jobs can be edited.');
        setDraftJobId(job.id);
        setAppName(job.title);
        setPlatform(job.platform);
        setUrl(job.appUrl || '');
        setAppLogoUrl(job.logoUrl || '');
        setShortDescription(job.description || '');
        setTestType(job.category as TestCategoryId);
        if (TEST_TYPES.some((testTypeOption) => testTypeOption.key === job.packageKey)) {
          setSelectedTestType(job.packageKey as TestTypeKey);
        }
        setTestTasks((job.tasks || '').split('\n').map((task) => task.trim()).filter(Boolean));
        setFocusAreas(job.focusAreas || '');
        setTestObjective(job.testBrief.objective || '');
        setAccessInstructions(job.testBrief.accessInstructions || '');
        setRequiredEnvironment(job.testBrief.requiredEnvironment || '');
        setOutOfScope(job.testBrief.outOfScope || '');
        setEvidenceRules(job.testBrief.evidenceRules || '');
        setTaskExpectedOutcomes(job.testBrief.tasks.map((task) => task.expectedOutcome));
        setPreferredSpecializations(job.preferredSpecializations || []);
        setLiveSessionEnabled(job.liveSessionEnabled);
        setLiveSessionAt(job.liveSessionAt ? job.liveSessionAt.slice(0, 16) : '');
        setAdditionalInfo(job.additionalInfo || '');
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error, 'Unable to load this draft.'));
      });
    return () => {
      active = false;
    };
  }, [editingJobId, session?.roles, session?.userId]);
  const selectedTestTypeConfig = selectedTestType ? getTestTypeByKey(selectedTestType) : null;
  const hasSelectedTestType = Boolean(selectedTestTypeConfig);
  const liveSessionAddon = liveSessionEnabled ? 2000 : 0;
  const subtotal = useMemo(
    () => (selectedTestType ? Math.max(0, ratePerTester * testersNeeded) : 0),
    [ratePerTester, testersNeeded, selectedTestType],
  );
  const platformFee = 0;
  const total = hasSelectedTestType ? subtotal + platformFee + liveSessionAddon : 0;
  const taskChecklistText = useMemo(() => testTasks.map((task) => task.trim()).filter(Boolean).join('\n'), [testTasks]);
  const testBrief = useMemo<TestBrief>(() => ({
    objective: testObjective.trim(),
    accessInstructions: accessInstructions.trim(),
    requiredEnvironment: requiredEnvironment.trim(),
    outOfScope: outOfScope.trim(),
    evidenceRules: evidenceRules.trim(),
    customQuestions: [],
    tasks: testTasks.map((title, index) => ({
      id: `task-${index + 1}`,      title: title.trim(),
      instructions: title.trim(),
      expectedOutcome: (taskExpectedOutcomes[index] || '').trim(),
    })).filter((task) => task.title),
  }), [accessInstructions, evidenceRules, outOfScope, requiredEnvironment, taskExpectedOutcomes, testObjective, testTasks]);
  const formatZar = (amount: number) => `R${amount.toLocaleString('en-ZA')}`;

  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      if (!appName.trim()) return 'Please add the app name before continuing.';
      if (!shortDescription.trim()) return 'Please add a short app description before continuing.';
    }
    if (stepIndex === 1) {
      if (!selectedTestType) return 'Please choose a test type before continuing.';
      const config = getTestTypeByKey(selectedTestType);
      if (testersNeeded < config.minTesters) return `${config.label} requires at least ${config.minTesters} testers.`;
      if (testTasks.every((task) => !task.trim())) return 'Please add the tasks testers must complete.';
      const briefIssues = briefCompletionIssues(testBrief);
      if (briefIssues.length) return briefIssues[0];
      if (!focusAreas.trim()) return 'Please add what testers should focus on.';
    }
    return '';
  };

  const addTestTask = () => {
    const nextTask = taskDraft.trim();
    if (!nextTask) return;
    setTestTasks((tasks) => [...tasks, nextTask]);
    setTaskExpectedOutcomes((outcomes) => [...outcomes, '']);
    setTaskDraft('');
  };

  const updateTestTask = (index: number, value: string) => {
    setTestTasks((tasks) => tasks.map((task, taskIndex) => (taskIndex === index ? value : task)));
  };

  const removeTestTask = (index: number) => {
    setTestTasks((tasks) => tasks.filter((_, taskIndex) => taskIndex !== index));
    setTaskExpectedOutcomes((outcomes) => outcomes.filter((_, taskIndex) => taskIndex !== index));
  };

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
    const allowedLogoTypes: Record<string, SafeFileKind> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    };
    const safeKind = allowedLogoTypes[file.type];
    if (!safeKind || !(await hasExpectedFileSignature(file, safeKind))) {
      setFeedbackMessage('');
      setErrorMessage('Upload a valid PNG, JPEG or WebP logo.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setFeedbackMessage('');
      setErrorMessage('Please keep the logo under 1MB for now.');
      return;
    }
    if (!isSupabaseConfigured || !session?.userId || !session.roles.includes('developer')) {
      setFeedbackMessage('');
      setErrorMessage('Please log in with a real developer account before uploading a job logo.');
      return;
    }

    const extension = safeKind;
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
  const addAttachmentFiles = async (files: FileList | File[]) => {
    const candidates = Array.from(files);
    if (!candidates.length) return;
    if (attachmentFiles.length + candidates.length > 5) {
      setFeedbackMessage('');
      setErrorMessage('You can attach up to 5 files to a job.');
      return;
    }
    for (const file of candidates) {
      const validationError = await validateJobAttachment(file);
      if (validationError) {
        setFeedbackMessage('');
        setErrorMessage(validationError);
        return;
      }
    }
    setErrorMessage('');
    setAttachmentFiles((current) => [...current, ...candidates]);
  };
  const handleAttachmentDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    void addAttachmentFiles(event.dataTransfer.files);
  };
  const buildJobInput = (status: 'draft' | 'active'): DeveloperJobInput | null => {
    if (!session?.userId) {
      setErrorMessage('Please log in with a developer account first.');
      return null;
    }
    if (!selectedTestType) {
      setErrorMessage('Please choose a test type before saving this job.');
      return null;
    }

    return {
      developerId: session.userId,
      title: appName,
      appUrl: url,
      platform,
      category: testType,
      packageKey: selectedTestType as JobPackageKey,
      totalAmountZar: total,
      testersNeeded,
      description: shortDescription,
      additionalInfo,
      logoUrl: appLogoUrl || null,
      tasks: taskChecklistText,
      focusAreas,
      preferredSpecializations,
      liveSessionEnabled,
      liveSessionAt: liveSessionEnabled && liveSessionAt ? liveSessionAt : null,
      testBrief,
      status,
    };
  };

  const saveDraft = async () => {

    if (!session?.userId || !session.roles.includes('developer')) {
      setFeedbackMessage('');
      setErrorMessage('Please log in with a developer account before saving a draft.');
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
      if (attachmentFiles.length) {
        setAttachmentUploading(true);
        await uploadDeveloperJobAttachments(draft.id, session.userId, attachmentFiles);
        setAttachmentFiles([]);
      }
      navigate('/developer/jobs?saved=draft');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to save this draft right now.'));
    } finally {
      setAttachmentUploading(false);
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

    if (!session?.userId || !session.roles.includes('developer')) {
      setFeedbackMessage('');
      setErrorMessage('Please log in with a developer account before saving this job.');
      return;
    }

    const jobInput = buildJobInput('draft');
    if (!jobInput) return;

    setSubmitting(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      const job = draftJobId ? await updateDeveloperJob(draftJobId, jobInput) : await createDeveloperJob(jobInput);
      setDraftJobId(job.id);
      if (attachmentFiles.length) {
        setAttachmentUploading(true);
        await uploadDeveloperJobAttachments(job.id, session.userId, attachmentFiles);
        setAttachmentFiles([]);
      }
      if (paymentsEnabled) {
        setFeedbackMessage('Preparing secure payment...');
        const checkoutUrl = await startJobCheckout(job.id);
        window.location.assign(checkoutUrl);
      } else {
        navigate('/developer/jobs?saved=draft');
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to save this job right now.'));
    } finally {
      setAttachmentUploading(false);
      setSubmitting(false);
    }
  };

  const toggleSpecialization = (id: string, checked: boolean) => {
    setPreferredSpecializations((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id),
    );
  };

  const steps = [
    'App Details',
    'Test Requirements',
    'Tester Profile',
    'Add-ons & Notes',
    paymentsEnabled ? 'Review & Payment' : 'Review & Save',
  ];

  return (
    <div>
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{editingJobId ? 'Continue Job Draft' : 'Post a Test Job'}</h1>
              <p className="text-slate-600">{editingJobId ? 'Review and complete the saved job before funding.' : 'Tell us about your app and what you need tested.'}</p>
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
                                accept="image/png,image/jpeg,image/webp"
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
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Platform Category</label>
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
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Test Type</label>
                      <div className="relative">
                        <select
                          value={selectedTestType}
                          onChange={(e) => setSelectedTestType(e.target.value as SelectedTestType)}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-700 outline-none transition focus:border-green-500"
                        >
                          <option value="">Select test type</option>
                          {TEST_TYPES.map((testTypeOption) => (
                            <option key={testTypeOption.key} value={testTypeOption.key}>
                              {testTypeOption.label} (R{testTypeOption.ratePerTesterZar}/tester)
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Testers</label>
                      <input
                        type="number"
                        min={selectedTestTypeConfig?.minTesters || 1}
                        value={testersNeeded}
                        onChange={(e) => setTestersNeeded(Number(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-green-500"
                      />
                      {selectedTestTypeConfig ? (
                        <div className="mt-1 text-xs text-slate-500">Minimum {selectedTestTypeConfig.minTesters} testers</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {!selectedTestTypeConfig ? (
                      <span>Choose a test type to see what is included</span>
                    ) : (
                      <span>{selectedTestTypeConfig.description} Typically about {selectedTestTypeConfig.estimatedMinutes} minutes per tester.</span>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-4 text-sm text-slate-700">
                    <span className="font-semibold text-green-700">Job budget:</span>{' '}
                    {paymentsEnabled
                      ? 'Your draft remains private until payment is confirmed.'
                      : 'This amount is an estimate only. No payment is requested while beta funding is disabled.'}
                  </div>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    Certification badges are not issued during beta.
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
                        <div key={`${index}-${task}`} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-green-200 bg-green-50 text-sm font-bold text-green-700">{index + 1}</div>
                            <input value={task} onChange={(e) => updateTestTask(index, e.target.value)} placeholder="Task: e.g. Create an account" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500" />
                            <button type="button" onClick={() => removeTestTask(index)} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Remove</button>
                          </div>
                          <input value={taskExpectedOutcomes[index] || ''} onChange={(e) => setTaskExpectedOutcomes((outcomes) => outcomes.map((outcome, outcomeIndex) => outcomeIndex === index ? e.target.value : outcome))} placeholder="Expected result: what should happen when this task is completed?" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-green-500" />
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


                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700">Main testing objective
                      <textarea rows={3} value={testObjective} onChange={(e) => setTestObjective(e.target.value)} placeholder="What decision should this test help you make?" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none transition focus:border-green-500" />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">Required environment
                      <textarea rows={3} value={requiredEnvironment} onChange={(e) => setRequiredEnvironment(e.target.value)} placeholder="Device, OS, browser, network or build requirements" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none transition focus:border-green-500" />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">Access instructions <span className="font-normal text-slate-400">(optional)</span>
                      <textarea rows={3} value={accessInstructions} onChange={(e) => setAccessInstructions(e.target.value)} placeholder="Test account, onboarding route, or safe access instructions" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none transition focus:border-green-500" />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">Evidence rules <span className="font-normal text-slate-400">(optional)</span>
                      <textarea rows={3} value={evidenceRules} onChange={(e) => setEvidenceRules(e.target.value)} placeholder="Example: attach a screenshot for every failure; record critical issues" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none transition focus:border-green-500" />
                    </label>
                  </div>
                  <label className="mt-5 block text-sm font-semibold text-slate-700">Out of scope <span className="font-normal text-slate-400">(optional)</span>
                    <textarea rows={2} value={outOfScope} onChange={(e) => setOutOfScope(e.target.value)} placeholder="What testers must not test or change" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none transition focus:border-green-500" />
                  </label>                  <div className="mt-5">
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
                      maxLength={500}
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
                    <label
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleAttachmentDrop}
                      className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-green-400 hover:bg-green-50/40"
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                        <SlidersHorizontal className="h-6 w-6 text-slate-500" />
                      </div>
                      <div className="mt-4 text-base font-semibold text-slate-800">
                        Drag &amp; drop files here or click to browse
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        PDF, PNG, JPG or WEBP up to 10MB each (maximum 5 files)
                      </div>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                        className="sr-only"
                        disabled={attachmentUploading}
                        onChange={(event) => {
                          if (event.target.files) void addAttachmentFiles(event.target.files);
                          event.target.value = '';
                        }}
                      />
                    </label>
                    {attachmentFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attachmentFiles.map((file, index) => (
                          <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                            <span className="min-w-0 truncate text-slate-700">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setAttachmentFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))}
                              className="ml-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <p className="text-xs text-slate-500">Files upload securely when you save the job draft.</p>
                      </div>
                    )}
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
                  <h2 className="text-2xl font-bold text-slate-900">5. {paymentsEnabled ? 'Review & Payment' : 'Review & Save'}</h2>
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
                      <div className="mt-1 text-sm text-slate-600">{testersNeeded || '-'} testers - {selectedTestTypeConfig?.label || 'Test type not selected'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-500">Tester profile</div>
                      <div className="mt-1 text-lg font-bold text-slate-900">{testerTierFilter}</div>
                      <div className="mt-1 text-sm text-slate-600">{ageRange}, {deviceType}, {experienceLevel}</div>
                    </div>
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                      <div className="text-sm font-semibold text-green-700">Total</div>
                      <div className="mt-1 text-2xl font-black text-green-700">{hasSelectedTestType ? formatZar(total) : 'Select test type'}</div>
                      <div className="mt-1 text-sm text-slate-600">{liveSessionEnabled ? 'Includes live session add-on' : hasSelectedTestType ? 'Job total only' : 'Choose a test type first'}</div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-slate-700">
                    {paymentsEnabled
                      ? 'After payment is confirmed, this job becomes visible to matching testers. Saving as draft keeps it private.'
                      : 'This job will be saved privately as a draft. Online funding will be enabled before launch.'}
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
                      {submitting ? 'Saving...' : paymentsEnabled ? 'Continue to Payment' : 'Save Job Draft'}
                    </button>
                  )}
                </div>
                {errorMessage ? <p className="text-sm font-semibold text-red-600">{errorMessage}</p> : null}
                {feedbackMessage ? <p className="text-sm font-semibold text-green-700">{feedbackMessage}</p> : null}
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900">Payment Summary</h3>

                  <div className="mt-5 space-y-4 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Platform Category</span>
                      <span className="font-semibold text-slate-900">{getCategoryById(testType).name}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Test Type</span>
                      <span className="font-semibold text-slate-900">{selectedTestTypeConfig?.label || 'Choose a test type'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Rate per Tester</span>
                      <span className="font-semibold text-slate-900">{selectedTestTypeConfig ? formatZar(selectedTestTypeConfig.ratePerTesterZar) : '-'}</span>
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

                  {hasSelectedTestType ? (
                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-green-50 px-4 py-4">
                      <span className="text-lg font-bold text-slate-900">Total</span>
                      <span className="text-2xl font-black text-green-700">{formatZar(total)}</span>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
                      Choose a test type to calculate the total.
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm">
                  <div className="text-lg font-bold text-green-800">{paymentsEnabled ? 'Payment and review' : 'Beta job setup'}</div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-700" />
                      <span>{paymentsEnabled ? 'Payment confirmation is required before the job becomes visible' : 'Jobs remain private drafts until funding is enabled'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-700" />
                      <span>Review tester submissions before approving them</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-green-700" />
                      <span>Request revisions during submission review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-green-700" />
                      <span>{paymentsEnabled ? 'Card details are entered on a hosted checkout page' : 'No payment will be requested in this beta environment'}</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-lg font-bold text-slate-900">Auto-calculated</div>
                  <div className="mt-4 text-sm text-slate-500">Total Amount</div>
                  <div className="mt-2 text-4xl font-black text-green-700">{hasSelectedTestType ? formatZar(total) : 'Pending'}</div>
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
                            {index === 4 && (paymentsEnabled ? 'Review and continue to payment' : 'Review and save your private draft')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </form>
          </div>
    </div>
  );
}













