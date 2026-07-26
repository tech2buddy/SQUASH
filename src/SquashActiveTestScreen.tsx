import {
  Bug,
  Camera,
  CheckCircle2,
  ChevronDown,
  Compass,
  ExternalLink,
  Eye,
  FlaskConical,
  Mic,
  Monitor,
  Settings,
  Shield,
  Square,
  Users,
  Video,
  Upload,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './auth';
import { getTesterAssignmentById, getTesterPrimaryAssignment, saveAssignmentBugReport, submitAssignmentReport, type TesterAssignment } from './lib/jobApi';
import { uploadBugReportFile } from './lib/storageApi';
import { getOrCreateTestLabSession, markTestLabSubmitted, saveTestLabProgress } from './lib/testLabApi';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');

  const fallbackTasks = [
    'Create an account / Sign up',
    'Set a daily step goal',
    'Navigate to the Stats page',
    'Track a workout',
    'Check how to view history',
    'Log out of the app',
  ];

  const [assignment, setAssignment] = useState<TesterAssignment | null>(null);
  const [labSessionId, setLabSessionId] = useState<string | null>(null);
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
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const recordedVideoBlobRef = useRef<Blob | null>(null);
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const completedTasks = useMemo(() => taskState.filter(Boolean).length, [taskState]);
  const progressPercent = useMemo(
    () => Math.round((completedTasks / taskState.length) * 100),
    [completedTasks, taskState.length],
  );


  useEffect(() => {
    if (!session?.userId) return;

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
        getOrCreateTestLabSession({ assignmentId: item.id, jobId: item.jobId, testerId: session.userId! })
          .then((labSession) => {
            setLabSessionId(labSession.id);
            const savedProgress = labSession.metadata as { task_state?: boolean[]; report_summary?: string };
            if (Array.isArray(savedProgress.task_state)) setTaskState(savedProgress.task_state);
            if (savedProgress.report_summary) setReportSummary(savedProgress.report_summary);
          })
          .catch(() => {});
        const parsedTasks = (item.jobTasks || '')
          .split(/[\r\n,]+/)
          .map((task) => task.trim())
          .filter(Boolean);
        const nextTasks = parsedTasks.length > 0 ? parsedTasks : fallbackTasks;
        setTasks(nextTasks);

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
  }, [assignmentId, session?.userId]);

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
      recordedVideoBlobRef.current = null;

      const recorder = new MediaRecorder(stream, {
        videoBitsPerSecond: 900_000,
        audioBitsPerSecond: 64_000,
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: 'video/webm' });
        recordedVideoBlobRef.current = blob;
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

  const selectEvidence = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setBugNotice('Choose an image or video file.');
      return;
    }
    if (evidencePreviewUrl) URL.revokeObjectURL(evidencePreviewUrl);
    setEvidenceFile(file);
    setEvidencePreviewUrl(URL.createObjectURL(file));
    setBugNotice(`${file.type.startsWith('image/') ? 'Screenshot' : 'Video'} ready to upload.`);
  };

  const captureScreenshot = async () => {
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('Screen capture is not supported on this browser.');
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not create the screenshot.');
      selectEvidence(new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' }));
    } catch (error) {
      setBugNotice(error instanceof Error ? error.message : 'Could not capture the screenshot.');
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
    }
  };
  const saveBugReport = async () => {
    const normalizedDescription = bugDescription.trim();
    if (!normalizedDescription) {
      setBugNotice('Please describe the issue before saving.');
      return;
    }
    if (/^(?:n\/?a|none|no bugs?)$/i.test(normalizedDescription)) {
      setBugNotice('Describe the actual issue. If you found no bug, do not create a bug report.');
      return;
    }
    if (!assignment || !session?.userId || !labSessionId) {
      setBugNotice('The secure Test Lab session is still loading. Please try again.');
      return;
    }

    if (assignment && session?.userId) {
      try {
        let screenshotPath: string | null = null;
        let videoPath: string | null = null;
        const recordedBlob = recordedVideoBlobRef.current;
        const uploadFile = evidenceFile
          ?? (recordedBlob ? new File([recordedBlob], `recording-${Date.now()}.webm`, { type: recordedBlob.type || 'video/webm' }) : null);
        if (uploadFile) {
          const uploadType = uploadFile.type.startsWith('image/') ? 'screenshot' : 'video';
          const upload = await uploadBugReportFile(uploadFile, uploadType, session.userId, assignment.jobId);
          if (upload.error) throw new Error(`Evidence upload failed: ${upload.error}`);
          if (uploadType === 'screenshot') screenshotPath = upload.path;
          else videoPath = upload.path;
        }
        await saveAssignmentBugReport({
          assignmentId: assignment.id,
          testerId: session.userId,
          jobId: assignment.jobId,
          sessionId: labSessionId,
          description: bugDescription,
          severity: severity as 'Low' | 'Medium' | 'High' | 'Critical',
          screenshotPath,
          videoPath,
          videoDurationSeconds: recordedVideoDuration || null,
        });
      } catch (error) {
        setBugNotice(error instanceof Error ? error.message : 'Could not save this bug report.');
        return;
      }
    }

    setBugNotice(recordedVideoUrl || evidenceFile ? 'Bug report with evidence saved.' : 'Bug report saved.');
    setBugDescription('');
    setEvidenceFile(null);
    if (evidencePreviewUrl) URL.revokeObjectURL(evidencePreviewUrl);
    setEvidencePreviewUrl('');
    recordedVideoBlobRef.current = null;
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    setRecordedVideoUrl('');
    setRecordedVideoDuration(0);
  };

  const saveProgress = async () => {
    try {
      if (!labSessionId) throw new Error('The Test Lab session is still loading. Please try again.');
      await saveTestLabProgress({ sessionId: labSessionId, tasks, taskState, reportSummary });
      setProgressNotice('Progress saved securely.');
    } catch (error) {
      setProgressNotice(error instanceof Error ? error.message : 'Could not save progress right now.');
    }
  };
  const submitTest = async () => {
    if (evidenceFile || recordedVideoBlobRef.current) {
      setProgressNotice('Evidence is attached but not uploaded yet. Click Save Bug Report before submitting the test.');
      return;
    }
    if (bugDescription.trim()) {
      setProgressNotice('You have an unsaved bug report. Save it or clear the description before submitting the test.');
      return;
    }
    if (completedTasks < taskState.length) {
      setProgressNotice(`Complete all tasks before submitting (${completedTasks}/${taskState.length}).`);
      return;
    }
    if (!assignment || !session?.userId || !labSessionId) {
      setProgressNotice('The secure Test Lab session is still loading. Please try again.');
      return;
    }
    if (assignment && session?.userId) {
      try {
        await submitAssignmentReport({
          assignmentId: assignment.id,
          testerId: session.userId,
          jobId: assignment.jobId,
          summary: reportSummary || `Completed ${completedTasks} of ${taskState.length} tasks.`,
        });
        if (labSessionId) await markTestLabSubmitted(labSessionId);
      } catch (error) {
        setProgressNotice(error instanceof Error ? error.message : 'Could not submit this test right now.');
        return;
      }
    }

    setProgressNotice('Test submitted successfully.');
    navigate('/tester/reports');
  };

  useEffect(() => {
    if (!labSessionId || !assignment) return;
    const timer = window.setTimeout(() => {
      saveTestLabProgress({ sessionId: labSessionId, tasks, taskState, reportSummary })
        .catch(() => setProgressNotice('Autosave could not sync. Please save again before leaving this test.'));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [assignment, labSessionId, reportSummary, taskState, tasks]);
  useEffect(
    () => () => {
      clearIntervals();
      stopMediaStream();
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
      if (evidencePreviewUrl) URL.revokeObjectURL(evidencePreviewUrl);
    },
    [recordedVideoUrl, evidencePreviewUrl],
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
            <div className="flex items-center justify-between gap-3 animate-fade-up">
              <div className="flex min-w-0 items-center gap-3">
                {assignment?.jobLogoUrl ? (
                  <img src={assignment.jobLogoUrl} alt={`${assignment.jobTitle} logo`} className="h-10 w-10 rounded-2xl border border-slate-200 object-cover shadow-2xs shrink-0" />
                ) : null}
                <div>
                  <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">{assignment?.jobTitle || 'Assigned test'}</h1>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 mt-1 inline-block">
                    {assignment?.jobPlatform || 'Usability Test'}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isRecording ? (
                  <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-600 shadow-2xs">
                    <Mic className="h-3.5 w-3.5" /> REC {formatDuration(60 - recordingSecondsLeft)}
                  </div>
                ) : (
                  <div className="rounded-full border border-green-200 bg-green-50 px-3.5 py-1.5 text-xs font-bold text-green-700 shadow-2xs">Test in progress</div>
                )}
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
                    <input
                      ref={evidenceInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                      className="hidden"
                      onChange={(event) => selectEvidence(event.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      onClick={() => evidenceInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      <Upload className="h-3.5 w-3.5" /> Attach file
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

                  {evidencePreviewUrl ? (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <div className="mb-1.5 text-[11px] font-semibold text-slate-600">Attached evidence</div>
                      {evidenceFile?.type.startsWith('image/') ? (
                        <img src={evidencePreviewUrl} alt="Bug evidence preview" className="max-h-40 w-full rounded-lg border border-slate-200 object-contain" />
                      ) : (
                        <video controls src={evidencePreviewUrl} className="max-h-40 w-full rounded-lg border border-slate-200 bg-black/90" />
                      )}
                    </div>
                  ) : null}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={captureScreenshot}
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
  );
}
