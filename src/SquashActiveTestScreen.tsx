import {
  Bell,
  Bug,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Compass,
  ExternalLink,
  Eye,
  FlaskConical,
  Home,
  Menu,
  Mic,
  Monitor,
  PlayCircle,
  Search,
  Settings,
  Shield,
  Square,
  Users,
  Video,
  Upload,
  UserCircle2,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './auth';
import MobileTabBar from './components/MobileTabBar';
import TesterMobileDrawer from './components/TesterMobileDrawer';
import { getTesterAssignmentById, getTesterPrimaryAssignment, saveAssignmentBugReport, submitAssignmentReport, type TesterAssignment } from './lib/jobApi';

type TestingTypeConfig = {
  bg: string; border: string; text: string; dot: string;
  Icon: React.ComponentType<{ className?: string }>;
  mission: string;
  tips: string[];
};

const TESTING_TYPE_CONFIG: Record<string, TestingTypeConfig> = {
  'Functional Testing': {
    bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500',
    Icon: Settings,
    mission: 'Verify every feature works exactly as intended.',
    tips: ['Follow each user flow step by step', 'Test edge cases and error states', 'Check that every button and link responds correctly', 'Document anything that fails or behaves unexpectedly'],
  },
  'Usability Testing': {
    bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500',
    Icon: Users,
    mission: 'Is this app intuitive for a real person?',
    tips: ['Think out loud as you navigate', 'Note your first moment of confusion', 'Does the flow feel natural and logical?', 'Would a first-time user figure this out alone?'],
  },
  'Exploratory Testing': {
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500',
    Icon: Compass,
    mission: 'Go off-script. Break assumptions.',
    tips: ['Try things the developer didn\'t expect', 'Enter unexpected or extreme inputs', 'Use the app in the wrong order', 'Look for hidden or broken states'],
  },
  'Regression Testing': {
    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500',
    Icon: FlaskConical,
    mission: 'Make sure nothing that worked before is now broken.',
    tips: ['Test all core user flows thoroughly', 'Check previously known working features', 'Look for anything that feels "off" vs before', 'Pay close attention to recent changes'],
  },
  'Feature Validation Testing': {
    bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500',
    Icon: CheckCircle2,
    mission: 'Does this new feature do exactly what it promises?',
    tips: ['Test the happy path first', 'Then deliberately test edge cases', 'Compare behaviour to what was described', 'Note any gap between expectation and reality'],
  },
  'First Impression Testing': {
    bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', dot: 'bg-pink-500',
    Icon: Eye,
    mission: 'You have 5 minutes of fresh eyes. Use them.',
    tips: ['Note your very first reaction — good or bad', 'Is the purpose of the app immediately clear?', 'What\'s confusing or unexpected in the first screen?', 'Would you continue using this app?'],
  },
  'Compatibility Testing': {
    bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500',
    Icon: Monitor,
    mission: 'Does it work consistently on your device?',
    tips: ['Note your exact device and OS version', 'Look for layout or rendering issues', 'Test on your screen size and resolution', 'Check performance on your connection type'],
  },
  'Accessibility Testing': {
    bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500',
    Icon: Shield,
    mission: 'Can someone with different abilities use this comfortably?',
    tips: ['Are tap targets large enough to use easily?', 'Is all text readable at default size?', 'Are error messages clear and helpful?', 'Can the app be navigated without precise tapping?'],
  },
};

const DEFAULT_TYPE_CONFIG: TestingTypeConfig = {
  bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400',
  Icon: Zap,
  mission: 'Test thoroughly and report everything you find.',
  tips: ['Follow the task checklist carefully', 'Note any bugs or unexpected behaviour', 'Screenshot or record any issues', 'Write a clear summary for the developer'],
};

export default function SquashActiveTestScreen() {
  const { session } = useAuth();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const testerName = session?.name || 'Thando M.';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');
  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/tester/dashboard' },
    { label: 'Available Jobs', icon: ClipboardList, href: '/tester-jobs' },
    { label: 'My Tests', icon: PlayCircle, href: '/active-test', active: true },
    { label: 'Reports', icon: ClipboardList, href: '/tester/reports' },
    { label: 'Earnings', icon: CircleDollarSign, href: '/tester/earnings' },
    { label: 'Profile', icon: UserCircle2, href: '/tester/profile' },
    { label: 'Settings', icon: Settings, href: '/tester/settings' },
  ];

  const fallbackTasks = [
    'Create an account / Sign up',
    'Set a daily step goal',
    'Navigate to the Stats page',
    'Track a workout',
    'Check how to view history',
    'Log out of the app',
  ];

  const [assignment, setAssignment] = useState<TesterAssignment | null>(null);
  const [assignmentError, setAssignmentError] = useState('');
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [tasks, setTasks] = useState(fallbackTasks);
  const [taskState, setTaskState] = useState(fallbackTasks.map((_, index) => index < 2));
  const [bugDescription, setBugDescription] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [bugNotice, setBugNotice] = useState('');
  const [progressNotice, setProgressNotice] = useState('');
  const [recordCountdown, setRecordCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(60);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState('');
  const [recordedVideoDuration, setRecordedVideoDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const completedTasks = useMemo(() => taskState.filter(Boolean).length, [taskState]);
  const progressPercent = useMemo(
    () => Math.round((completedTasks / taskState.length) * 100),
    [completedTasks, taskState.length],
  );


  useEffect(() => {
    if (!session?.userId || false) return;

    let mounted = true;
    setLoadingAssignment(true);
    setAssignmentError('');

    const loadAssignment = assignmentId
      ? getTesterAssignmentById(assignmentId, session.userId)
      : getTesterPrimaryAssignment(session.userId);

    loadAssignment
      .then((item) => {
        if (!mounted) return;
        if (!item) {
          setAssignmentError('No accepted test assignment found yet.');
          return;
        }

        setAssignment(item);
        const parsedTasks = (item.jobTasks || '')
          .split(/[\r\n,]+/)
          .map((task) => task.trim())
          .filter(Boolean);
        const nextTasks = parsedTasks.length > 0 ? parsedTasks : fallbackTasks;
        setTasks(nextTasks);

        const saved = window.localStorage.getItem(`squash_active_test_progress_${item.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as { taskState?: boolean[]; reportSummary?: string };
            if (Array.isArray(parsed.taskState) && parsed.taskState.length === nextTasks.length) {
              setTaskState(parsed.taskState);
            } else {
              setTaskState(nextTasks.map(() => false));
            }
            if (parsed.reportSummary) setReportSummary(parsed.reportSummary);
            return;
          } catch {
            // Fall through to a fresh state.
          }
        }
        setTaskState(nextTasks.map(() => false));
      })
      .catch((error: Error) => {
        if (mounted) setAssignmentError(error.message || 'Could not load this accepted test.');
      })
      .finally(() => {
        if (mounted) setLoadingAssignment(false);
      });

    return () => {
      mounted = false;
    };
  }, [assignmentId, ("supabase"), session?.userId]);

  const toggleTask = (index: number, checked: boolean) => {
    setTaskState((prev) => prev.map((item, idx) => (idx === index ? checked : item)));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const clearIntervals = () => {
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const stopRecording = (autoStopped = false) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearIntervals();
    setIsRecording(false);
    recordingStartedAtRef.current = null;
    if (autoStopped) {
      setBugNotice('Recording stopped automatically after 60 seconds.');
    }
  };

  const startMediaRecording = async () => {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getDisplayMedia ||
        typeof MediaRecorder === 'undefined'
      ) {
        setBugNotice('Screen recording is not supported on this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: 'video/webm' });
        if (recordedVideoUrl) {
          URL.revokeObjectURL(recordedVideoUrl);
        }
        const previewUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(previewUrl);
        const elapsed = recordingStartedAtRef.current
          ? Math.min(60, Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000)))
          : Math.max(1, 60 - recordingSecondsLeft);
        setRecordedVideoDuration(Math.max(1, elapsed));
        recordingStartedAtRef.current = null;

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = String(reader.result ?? '');
          window.localStorage.setItem(
            'squash_latest_bug_video',
            JSON.stringify({
              dataUrl: base64,
              duration: Math.max(1, elapsed),
              createdAt: new Date().toISOString(),
            }),
          );
        };
        reader.readAsDataURL(blob);
        stopMediaStream();
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSecondsLeft(60);
      setBugNotice('');
      recordingStartedAtRef.current = Date.now();

      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingSecondsLeft((prev) => {
          if (prev <= 1) {
            stopRecording(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setBugNotice('Could not start recording. Please allow screen recording permissions.');
      setRecordCountdown(null);
      stopMediaStream();
    }
  };

  const startRecordingWithCountdown = () => {
    if (isRecording) return;
    setBugNotice('');
    setRecordCountdown(3);
    countdownIntervalRef.current = window.setInterval(() => {
      setRecordCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearIntervals();
          startMediaRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const saveBugReport = async () => {
    if (!bugDescription.trim()) {
      setBugNotice('Please describe the issue before saving.');
      return;
    }
    const existingReports = JSON.parse(
      window.localStorage.getItem('squash_bug_reports') ?? '[]',
    ) as Array<{
      description: string;
      severity: string;
      createdAt: string;
      videoDuration?: number;
      hasVideo?: boolean;
    }>;
    existingReports.unshift({
      description: bugDescription.trim(),
      severity,
      createdAt: new Date().toISOString(),
      hasVideo: Boolean(recordedVideoUrl),
      videoDuration: recordedVideoDuration || undefined,
    });
    window.localStorage.setItem('squash_bug_reports', JSON.stringify(existingReports));

    if (assignment && session?.userId && true) {
      try {
        await saveAssignmentBugReport({
          assignmentId: assignment.id,
          testerId: session.userId,
          jobId: assignment.jobId,
          description: bugDescription,
          severity: severity as 'Low' | 'Medium' | 'High' | 'Critical',
          videoDurationSeconds: recordedVideoDuration || null,
        });
      } catch (error) {
        setBugNotice(error instanceof Error ? error.message : 'Bug saved locally, but not synced yet.');
        return;
      }
    }

    setBugNotice(recordedVideoUrl ? 'Bug report with video saved.' : 'Bug report saved.');
    setBugDescription('');
  };

  const saveProgress = () => {
    window.localStorage.setItem(
      `squash_active_test_progress_${assignment?.id || 'demo'}`,
      JSON.stringify({
        taskState,
        reportSummary,
        updatedAt: new Date().toISOString(),
      }),
    );
    setProgressNotice('Progress saved.');
  };

  const submitTest = async () => {
    if (completedTasks < taskState.length) {
      setProgressNotice(`Complete all tasks before submitting (${completedTasks}/${taskState.length}).`);
      return;
    }
    if (assignment && session?.userId && true) {
      try {
        await submitAssignmentReport({
          assignmentId: assignment.id,
          testerId: session.userId,
          jobId: assignment.jobId,
          summary: reportSummary || `Completed ${completedTasks} of ${taskState.length} tasks.`,
        });
      } catch (error) {
        setProgressNotice(error instanceof Error ? error.message : 'Could not submit this test right now.');
        return;
      }
    } else {
      window.localStorage.setItem(
        'squash_active_test_submission',
        JSON.stringify({
          submittedAt: new Date().toISOString(),
          completedTasks,
        }),
      );
    }

    setProgressNotice('Test submitted successfully.');
    navigate('/tester/reports');
  };

  useEffect(
    () => () => {
      clearIntervals();
stopMediaStream();
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    },
    [recordedVideoUrl],
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900 selection:bg-green-100">
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />

      <div className="grid min-h-screen lg:grid-cols-[270px_1fr]">
        {/* Apple Translucent Left Sidebar */}
        <aside className="hidden border-r border-slate-200/60 bg-white/70 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200/50 px-6 py-5">
            <img
              src="/squash-logo.png"
              alt="SQUASH logo"
              className="h-10 w-10 rounded-2xl border border-white/60 object-cover shadow-sm"
            />
            <a href="/" className="text-xl font-bold tracking-tight text-slate-900 hover:text-green-700">
              SQUASH
            </a>
          </div>

          <nav className="flex-1 space-y-1.5 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 apple-press-effect ${
                    item.active
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${item.active ? 'text-white' : 'text-slate-500'}`} />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="space-y-4 p-4 pt-0">
            <div className="apple-bento-card p-5">
              <div className="text-base font-bold text-slate-900">Active Test</div>
              <div className="mt-3 rounded-2xl bg-green-50/70 p-3.5 border border-green-200/60">
                <div className="text-xs font-bold text-green-800">{assignment?.jobTitle || 'FitTrack Mobile'}</div>
                <div className="mt-1 text-[11px] font-semibold text-slate-600">
                  {completedTasks} / {taskState.length} tasks done
                </div>
              </div>
              <a href="#task-list" className="mt-3 block text-center text-xs font-bold text-green-700 hover:underline">
                Continue Test →
              </a>
            </div>

            <div className="apple-bento-card p-5">
              <div className="text-base font-bold text-slate-900">Your Rating</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">4.7 ★</div>
              <div className="mt-0.5 text-xs text-slate-500 font-medium">From 28 reviews</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 pb-36 lg:pb-12">
          {/* Apple Translucent Top Header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/75 backdrop-blur-xl">
            <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-700 lg:hidden hover:bg-slate-100 transition apple-press-effect"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="hidden max-w-xl flex-1 items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-100/60 px-4 py-2 md:flex md:min-w-[320px] lg:min-w-[420px] focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-slate-400 text-slate-900"
                      placeholder="Search jobs, tests, reports..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <a href="/tester/notifications" className="relative rounded-full border border-slate-200/80 bg-white p-2.5 text-slate-700 hover:bg-slate-50 transition apple-press-effect">
                    <Bell className="h-4.5 w-4.5" />
                    <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      2
                    </span>
                  </a>
                  <a href="/tester/profile" className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/80 p-1.5 pr-4 shadow-2xs hover:bg-white transition apple-press-effect">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs">
                      {testerName.charAt(0)}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-bold text-slate-900 leading-tight">{testerName}</div>
                      <div className="text-[10px] font-semibold text-slate-500">Tester</div>
                    </div>
                  </a>
                </div>
              </div>

              <div className="md:hidden">
                <div className="flex w-full items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-100/60 px-4 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-slate-400 text-slate-900"
                    placeholder="Search jobs, tests, reports..."
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8 space-y-6">
            <div className="flex items-center justify-between gap-3 animate-fade-up">
              <div className="flex min-w-0 items-center gap-3">
                {assignment?.jobLogoUrl ? (
                  <img src={assignment.jobLogoUrl} alt={`${assignment.jobTitle} logo`} className="h-10 w-10 rounded-2xl border border-slate-200 object-cover shadow-2xs shrink-0" />
                ) : null}
                <div>
                  <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">{assignment?.jobTitle || 'FitTrack Mobile'}</h1>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 mt-1 inline-block">
                    {assignment?.jobPlatform || 'Usability Test'}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
                  ⏱ 18:24
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/80 px-3.5 py-1.5 text-xs font-bold text-red-600 shadow-2xs">
                  <Mic className="h-3.5 w-3.5" /> REC
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="apple-bento-card overflow-hidden">
                {(() => {
                  // Derive testing type from platform label, with fuzzy matching
                  const platform = assignment?.jobPlatform || '';
                  const matchedKey = Object.keys(TESTING_TYPE_CONFIG).find(k =>
                    platform.toLowerCase().includes(k.toLowerCase().split(' ')[0])
                  ) || '';
                  const cfg = TESTING_TYPE_CONFIG[matchedKey] || DEFAULT_TYPE_CONFIG;
                  const PrimaryIcon = cfg.Icon;
                  const typeLabel = matchedKey || platform || 'Active Test';
                  const focusText = assignment?.jobFocusAreas || assignment?.jobDescription || '';

                  return (
                    <>
                      {/* Coloured banner */}
                      <div className={`${cfg.bg} border-b ${cfg.border} px-5 pt-4 pb-3.5`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 border ${cfg.border} shadow-2xs`}>
                            <PrimaryIcon className={`h-5 w-5 ${cfg.text}`} />
                          </div>
                          <div>
                            <div className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${cfg.text} opacity-70`}>Testing Brief</div>
                            <div className={`text-base font-extrabold ${cfg.text}`}>{typeLabel}</div>
                          </div>
                        </div>
                        <p className={`mt-2 text-xs font-semibold italic ${cfg.text} opacity-80 leading-relaxed`}>
                          "{cfg.mission}"
                        </p>
                      </div>

                      {/* Progress + Launch */}
                      <div className="px-5 py-3.5 flex items-center gap-3 border-b border-slate-100">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                          <svg className="h-11 w-11 -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="9" />
                            <circle
                              cx="40" cy="40" r="32" fill="none"
                              stroke="#34c759" strokeWidth="9"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={`${2 * Math.PI * 32 * (1 - progressPercent / 100)}`}
                              className="transition-all duration-500"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-extrabold text-slate-900">{progressPercent}%</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-700">{completedTasks}/{taskState.length} tasks done</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100">
                            <div className="h-1.5 rounded-full bg-green-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.open(assignment?.jobAppUrl || '#', '_blank', 'noopener,noreferrer')}
                          disabled={!assignment?.jobAppUrl}
                          className="shrink-0 flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition apple-press-effect"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Launch
                        </button>
                      </div>

                      {/* What to look for */}
                      {focusText ? (
                        <div className={`mx-4 mt-4 rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}>
                          <div className={`text-[10px] font-extrabold uppercase tracking-[0.1em] ${cfg.text} mb-1.5`}>What to look for</div>
                          <p className="text-xs leading-relaxed text-slate-700 font-medium whitespace-pre-line">{focusText}</p>
                        </div>
                      ) : null}

                      {/* Tips */}
                      <div className="px-5 pt-4 pb-5">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400 mb-2.5">Testing Tips</div>
                        <div className="space-y-2">
                          {cfg.tips.slice(0, 3).map((tip, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                              <span className="text-xs leading-relaxed text-slate-600 font-medium">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </section>

              <section className="space-y-4">
                <div id="task-list" className="apple-bento-card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Your Tasks</h2>
                      {loadingAssignment ? <p className="mt-1 text-xs font-semibold text-slate-500">Loading assignment...</p> : null}
                      {assignmentError ? <p className="mt-1 text-xs font-semibold text-red-600">{assignmentError}</p> : null}
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {completedTasks} / {taskState.length} Done
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-2">
                    {tasks.map((task, index) => (
                      <label key={task} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-3.5 py-3 hover:bg-slate-100/60 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskState[index]}
                          onChange={(e) => toggleTask(index, e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span className={`text-xs ${taskState[index] ? 'font-bold text-slate-900 line-through opacity-60' : 'font-medium text-slate-700'}`}>
                          {task}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="apple-bento-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Bug className="h-4.5 w-4.5 text-red-500" />
                    <h2 className="text-base font-bold text-slate-900">Report a Bug</h2>
                  </div>

                  <textarea
                    rows={3}
                    value={bugDescription}
                    onChange={(e) => setBugDescription(e.target.value)}
                    placeholder="Describe the issue you found..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-green-500"
                  />

                  <div className="mt-3 flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-xs text-slate-600 outline-none transition focus:border-green-500"
                      >
                        <option>Critical</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setBugNotice('Screenshot attached.')}
                      className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload
                    </button>
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecordingWithCountdown}
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        <Video className="h-3.5 w-3.5" /> Record
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => stopRecording(false)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Square className="h-3.5 w-3.5" /> Stop
                      </button>
                    )}
                  </div>

                  {recordCountdown !== null ? (
                    <p className="mt-2 text-xs font-semibold text-amber-700">Starting in {recordCountdown}...</p>
                  ) : null}
                  {isRecording ? (
                    <p className="mt-2 text-xs font-semibold text-red-600">● REC {formatDuration(recordingSecondsLeft)}</p>
                  ) : null}

                  {recordedVideoUrl ? (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <div className="mb-1.5 text-[11px] font-semibold text-slate-600">Recording — {formatDuration(recordedVideoDuration)}</div>
                      <video controls src={recordedVideoUrl} className="max-h-32 w-full rounded-lg border border-slate-200 bg-black/90" />
                    </div>
                  ) : null}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBugNotice('Screenshot captured.')}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Camera className="h-3.5 w-3.5" /> Screenshot
                    </button>
                    <button
                      type="button"
                      onClick={saveBugReport}
                      className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-600"
                    >
                      Save Bug Report
                    </button>
                  </div>
                  {bugNotice ? <p className="mt-2 text-xs font-semibold text-green-700">{bugNotice}</p> : null}
                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm">
                  <div className="text-sm font-bold text-slate-900 mb-1">Testing Notes</div>
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-700">Final report summary</span>
                    <textarea
                      rows={3}
                      value={reportSummary}
                      onChange={(e) => setReportSummary(e.target.value)}
                      placeholder="Summarize what worked, what felt confusing, and any important notes for the developer..."
                      className="w-full rounded-xl border border-green-100 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-green-500"
                    />
                  </label>
                </div>
              </section>
            </div>

            <section className="fixed bottom-[64px] inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] lg:static lg:mt-4 lg:rounded-2xl lg:bg-white lg:px-5 lg:py-4 lg:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Progress</span>
                    <span className="font-semibold text-slate-700">{completedTasks}/{taskState.length} done</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-green-600 transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={saveProgress}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={submitTest}
                    className="rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                  >
                    Submit Test
                  </button>
                </div>
              </div>
              {progressNotice ? <p className="mt-1.5 text-xs font-semibold text-green-700">{progressNotice}</p> : null}
            </section>
          </div>
        </main>
      </div>
      <MobileTabBar role="tester" />
      <TesterMobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} activePath="/active-test" />
    </div>
  );
}
