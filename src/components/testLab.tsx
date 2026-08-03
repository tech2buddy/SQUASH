import {
  AlertTriangle,
  Battery,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  SkipForward,
  Upload,
  Wifi,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React, { useState } from 'react';
import { uploadBugReportFile, type UploadFileType } from '../lib/storageApi';

export type TestType =
  | 'bug_hunt'
  | 'usability'
  | 'first_impression'
  | 'exploratory'
  | 'regression'
  | 'feature_feedback'
  | 'accessibility'
  | 'custom';

export type TaskStatus = 'not_started' | 'active' | 'completed' | 'skipped';
export type WorkspaceTab = 'task' | 'notes' | 'issue' | 'feedback';
export type NoteType = 'observation' | 'confusion' | 'suggestion' | 'positive';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueFrequency = 'once' | 'sometimes' | 'every_time';

export interface ActiveTest {
  id: string;
  productName: string;
  category: string;
  platform: string;
  testType: TestType;
  objective: string;
  productDescription: string;
  targetScenario: string;
  focusAreas: string[];
  restrictions: string[];
  requirements: string[];
  reward: number;
  estimatedMinutes: number;
  recordingRequired: boolean;
  previewUrl?: string;
  tasks: TestTask[];
}

export interface TestTask {
  id: string;
  order: number;
  title: string;
  scenario?: string;
  instructions: string;
  expectedOutcome?: string;
  estimatedMinutes?: number;
  required: boolean;
  status: TaskStatus;
  startedAt?: string;
  completedAt?: string;
  testerNotes?: string;
  difficulty?: string;
  emotion?: string;
  skipReason?: string;
}

export interface TesterNote {
  id: string;
  taskId?: string;
  type: NoteType;
  content: string;
  createdAt: string;
}

export interface IssueReport {
  id: string;
  title: string;
  issueType: string;
  severity: IssueSeverity;
  taskId?: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  frequency: IssueFrequency;
  evidence: string[];
  deviceMetadata: Record<string, string>;
  createdAt: string;
}

export interface DeviceMetadata {
  deviceCategory: string;
  operatingSystem: string;
  browser: string;
  screenSize: string;
  viewportSize: string;
  networkType: string;
  battery: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  createdAt: string;
  tone?: 'green' | 'red' | 'amber' | 'slate';
}

export interface WorkflowConfig {
  label: string;
  badgeClass: string;
  priority: string;
  finalQuestions: string[];
  issueEmphasis: boolean;
  icon: LucideIcon;
}

export const WORKFLOW_CONFIG: Record<TestType, WorkflowConfig> = {
  bug_hunt: {
    label: 'Bug Hunt',
    badgeClass: 'bg-red-50 text-red-600 ring-red-100',
    priority: 'Find reproducible bugs, severity, evidence and affected areas.',
    finalQuestions: ['Which area had the most issues?', 'Were any critical flows blocked?', 'Overall stability rating'],
    issueEmphasis: true,
    icon: AlertTriangle,
  },
  usability: {
    label: 'Usability Test',
    badgeClass: 'bg-green-50 text-green-700 ring-green-100',
    priority: 'Complete scenario-based tasks and capture confusion, hesitation and emotional response.',
    finalQuestions: ['What was easiest?', 'What was most confusing?', 'Would you use this product?', 'Overall ease-of-use rating'],
    issueEmphasis: true,
    icon: ClipboardList,
  },
  first_impression: {
    label: 'First Impression',
    badgeClass: 'bg-sky-50 text-sky-700 ring-sky-100',
    priority: 'Spend a short timed moment with the product and explain what you understand immediately.',
    finalQuestions: ['What do you think this product does?', 'Who is it for?', 'What caught your attention first?', 'Does it look trustworthy?'],
    issueEmphasis: false,
    icon: MonitorSmartphone,
  },
  exploratory: {
    label: 'Exploratory Test',
    badgeClass: 'bg-amber-50 text-amber-700 ring-amber-100',
    priority: 'Explore freely, mark coverage, save notes and report issues as you discover them.',
    finalQuestions: ['Which areas did you explore?', 'What surprised you?', 'What suggestions do you have?'],
    issueEmphasis: true,
    icon: RefreshCw,
  },
  regression: {
    label: 'Regression Test',
    badgeClass: 'bg-violet-50 text-violet-700 ring-violet-100',
    priority: 'Verify previously reported issues and confirm whether fixes work as expected.',
    finalQuestions: ['Was the issue fixed?', 'Did the fix create a new issue?', 'What evidence supports your result?'],
    issueEmphasis: true,
    icon: CheckCircle2,
  },
  feature_feedback: {
    label: 'Feature Feedback',
    badgeClass: 'bg-teal-50 text-teal-700 ring-teal-100',
    priority: 'Evaluate usefulness, discoverability, clarity and what feels missing or unnecessary.',
    finalQuestions: ['Did you understand the feature?', 'Was it useful?', 'What problem does it solve?', 'Would you use it regularly?'],
    issueEmphasis: false,
    icon: FileText,
  },
  accessibility: {
    label: 'Accessibility Review',
    badgeClass: 'bg-purple-50 text-purple-700 ring-purple-100',
    priority: 'Tester-reported accessibility checks only. Do not claim automated compliance.',
    finalQuestions: ['Keyboard navigation', 'Focus visibility', 'Text readability', 'Colour contrast', 'Touch target size'],
    issueEmphasis: true,
    icon: ShieldCheck,
  },
  custom: {
    label: 'Custom Test',
    badgeClass: 'bg-slate-50 text-slate-700 ring-slate-100',
    priority: 'Follow the developer-defined task list and custom questions for this product.',
    finalQuestions: ['Did you complete the requested scenario?', 'What should the developer know?', 'Any additional comments?'],
    issueEmphasis: true,
    icon: ClipboardList,
  },
};

export function getWorkflowConfig(testType: TestType) {
  return WORKFLOW_CONFIG[testType] || WORKFLOW_CONFIG.custom;
}

export function inferTestType(category: string, platform = ''): TestType {
  const value = `${category} ${platform}`.toLowerCase();
  if (value.includes('bug')) return 'bug_hunt';
  if (value.includes('accessibility')) return 'accessibility';
  if (value.includes('onboarding')) return 'usability';
  if (value.includes('performance')) return 'exploratory';
  if (value.includes('regression')) return 'regression';
  if (value.includes('feature')) return 'feature_feedback';
  if (value.includes('first')) return 'first_impression';
  return 'usability';
}

export function createTasksFromText(rawTasks: string | null | undefined, testType: TestType): TestTask[] {
  const parsed = (rawTasks || '')
    .split(/[\r\n,]+/)
    .map((task) => task.trim())
    .filter(Boolean);

  const fallbackByType: Record<TestType, string[]> = {
    bug_hunt: ['Explore the main flow', 'Try to break one important action', 'Capture evidence for any issue found', 'Review payment or account flow if available'],
    usability: ['Create or access an account', 'Complete the main product action', 'Find settings or profile information', 'Explain what felt confusing'],
    first_impression: ['Look at the first screen for 60 seconds', 'Explain what the product does', 'Choose what you would click first'],
    exploratory: ['Explore navigation freely', 'Mark areas tested', 'Save notes for confusing moments', 'Report issues found'],
    regression: ['Reproduce the original issue', 'Confirm expected fixed behaviour', 'Capture evidence', 'Check if the fix caused anything new'],
    feature_feedback: ['Find the target feature', 'Use the feature once', 'Explain what problem it solves', 'Rate usefulness'],
    accessibility: ['Check keyboard navigation', 'Check text readability', 'Check form labels', 'Check touch target size'],
    custom: ['Follow the developer instructions', 'Capture notes', 'Report issues', 'Submit final feedback'],
  };

  return (parsed.length ? parsed : fallbackByType[testType]).map((title, index) => ({
    id: `task-${index + 1}`,
    order: index + 1,
    title,
    scenario: index === 0 ? 'You are using this product as a real customer for the first time.' : undefined,
    instructions: title,
    expectedOutcome: 'You should be able to complete the step or clearly explain what blocked you.',
    estimatedMinutes: index === 0 ? 5 : 4,
    required: true,
    status: 'not_started',
  }));
}

export function getDeviceMetadata(): DeviceMetadata {
  const ua = navigator.userAgent;
  const os = /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Mac/i.test(ua) ? 'macOS' : 'Unknown OS';
  const browser = /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : 'Browser unknown';
  const width = window.innerWidth;
  const category = width < 640 ? 'Mobile' : width < 1024 ? 'Tablet' : 'Desktop';
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;

  return {
    deviceCategory: category,
    operatingSystem: os,
    browser,
    screenSize: `${window.screen.width} x ${window.screen.height}`,
    viewportSize: `${window.innerWidth} x ${window.innerHeight}`,
    networkType: connection?.effectiveType || 'Not available',
    battery: 'Not available',
  };
}

export function TestSessionHeader({
  test,
  workflow,
  remainingTime,
  isRecording,
  saveStatus,
  onExit,
  rewardLabel,
}: {
  test: ActiveTest;
  workflow: WorkflowConfig;
  remainingTime: string;
  isRecording: boolean;
  saveStatus: string;
  onExit: () => void;
  rewardLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{test.productName}</h1>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">{test.platform}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${workflow.badgeClass}`}>{workflow.label}</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{test.objective}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span className="rounded-2xl bg-green-50 px-4 py-2 text-green-700 ring-1 ring-green-100">{rewardLabel || `Reward R${test.reward}`}</span>
          <span className="rounded-2xl bg-slate-50 px-4 py-2 text-slate-700 ring-1 ring-slate-100">{test.estimatedMinutes} min</span>
          <span className="rounded-2xl bg-slate-50 px-4 py-2 text-slate-700 ring-1 ring-slate-100">Time left {remainingTime}</span>
          <span className={`rounded-2xl px-4 py-2 ring-1 ${isRecording ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-slate-50 text-slate-600 ring-slate-100'}`}>{isRecording ? 'REC active' : 'Recording off'}</span>
          <span className="rounded-2xl bg-green-50 px-4 py-2 text-green-700 ring-1 ring-green-100">{saveStatus}</span>
          <button type="button" onClick={onExit} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">Exit Test</button>
        </div>
      </div>
    </div>
  );
}

export function TestBriefPanel({ test, progress, device, isRecording }: { test: ActiveTest; progress: number; device: DeviceMetadata; isRecording: boolean }) {
  const rows = [
    ['Objective', test.objective],
    ['Scenario', test.targetScenario],
    ['Reward', `R${test.reward}`],
    ['Duration', `${test.estimatedMinutes} minutes`],
    ['Device', `${device.deviceCategory} · ${device.operatingSystem}`],
    ['Connection', device.networkType],
    ['Recording', isRecording ? 'Active' : test.recordingRequired ? 'Required' : 'Optional'],
  ];

  return (
    <aside className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Test Brief</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{test.productDescription}</p>
        <div className="mt-5 space-y-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="font-semibold text-slate-500">{label}</span>
              <span className="text-right font-bold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>Session progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-3 h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-green-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-5">
          <div className="text-sm font-bold text-slate-900">Focus Areas</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {test.focusAreas.map((item) => <span key={item} className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-100">{item}</span>)}
          </div>
        </div>
        <div className="mt-5">
          <div className="text-sm font-bold text-slate-900">Do not do</div>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {test.restrictions.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </div>
      </section>

      <DeviceInfoCard device={device} />
    </aside>
  );
}

export function DeviceInfoCard({ device }: { device: DeviceMetadata }) {
  const rows = [
    ['Device', device.deviceCategory, MonitorSmartphone],
    ['OS', device.operatingSystem, MonitorSmartphone],
    ['Browser', device.browser, MonitorSmartphone],
    ['Screen', device.screenSize, MonitorSmartphone],
    ['Viewport', device.viewportSize, MonitorSmartphone],
    ['Network', device.networkType, Wifi],
    ['Battery', device.battery, Battery],
  ] as const;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Device Info</h2>
      <div className="mt-4 space-y-2">
        {rows.map(([label, value, Icon]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-500"><Icon className="h-4 w-4" /> {label}</span>
            <span className="text-right font-semibold text-slate-800">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function canEmbedPreview(url: string | undefined) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}
export function ProductPreview({ test, task, onOpen, onCopy }: { test: ActiveTest; task: TestTask; onOpen: () => void; onCopy: () => void }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Product Preview</h2>
          <p className="mt-1 text-sm text-slate-600">Current task: <span className="font-semibold text-slate-900">{task.title}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onOpen} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ExternalLink className="h-4 w-4" /> Open</button>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button type="button" onClick={onCopy} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" /> Copy Link</button>
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {test.previewUrl && canEmbedPreview(test.previewUrl) ? (
            <iframe title={`${test.productName} preview`} src={test.previewUrl} className="h-[420px] w-full bg-white" />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center p-8 text-center">
              <div className="max-w-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-700 ring-1 ring-green-100"><MonitorSmartphone className="h-7 w-7" /></div>
                <h3 className="mt-4 text-xl font-black text-slate-900">Open this product in a test tab</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Many real websites block embedded previews for security. SQUASH keeps the lab controls here and opens the product in a separate tab so testers can still complete tasks safely.
                </p>
                {test.previewUrl ? (
                  <div className="mt-4 truncate rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-100">{test.previewUrl}</div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-100">No preview URL was provided for this test.</div>
                )}
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <button type="button" onClick={onOpen} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"><ExternalLink className="h-4 w-4" /> Open Test Tab</button>
                  <button type="button" onClick={onCopy} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" /> Copy Link</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function CurrentTaskCard({
  task,
  totalTasks,
  onStart,
  onComplete,
  onSkip,
  onPrevious,
  onNext,
  onUpdateTask,
}: {
  task: TestTask;
  totalTasks: number;
  onStart: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onUpdateTask: (patch: Partial<TestTask>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-100">Task {task.order} of {totalTasks}</span>
          <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold capitalize text-slate-700 ring-1 ring-slate-100">{task.status.replace('_', ' ')}</span>
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-900">{task.title}</h2>
        {task.scenario ? <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"><span className="font-bold">Scenario:</span> {task.scenario}</p> : null}
        <p className="mt-4 text-sm leading-6 text-slate-700"><span className="font-bold">Instructions:</span> {task.instructions}</p>
        {task.expectedOutcome ? <p className="mt-3 text-sm leading-6 text-slate-600"><span className="font-bold text-slate-800">Expected:</span> {task.expectedOutcome}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-100"><Clock3 className="h-3.5 w-3.5" /> {task.estimatedMinutes || 5} min</span>
          {task.required ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-100">Required</span> : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onStart} disabled={task.status === 'active'} className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300">Start Task</button>
          <button type="button" onClick={onComplete} className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-100">Complete Task</button>
          <button type="button" onClick={onSkip} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><SkipForward className="h-4 w-4" /> Skip</button>
          <button type="button" onClick={onPrevious} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Previous</button>
          <button type="button" onClick={onNext} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Next</button>
        </div>
      </div>

      {task.status === 'completed' ? (
        <TaskFeedback task={task} onUpdateTask={onUpdateTask} />
      ) : null}
    </div>
  );
}

export function TaskFeedback({ task, onUpdateTask }: { task: TestTask; onUpdateTask: (patch: Partial<TestTask>) => void }) {
  return (
    <div className="rounded-3xl border border-green-100 bg-green-50 p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-900">Task feedback</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">How easy was this task?
          <select value={task.difficulty || ''} onChange={(e) => onUpdateTask({ difficulty: e.target.value })} className="mt-2 w-full rounded-2xl border border-green-100 bg-white px-4 py-3 outline-none focus:border-green-500">
            <option value="">Select</option><option>Very easy</option><option>Easy</option><option>Neutral</option><option>Difficult</option><option>Very difficult</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">How did this task feel?
          <select value={task.emotion || ''} onChange={(e) => onUpdateTask({ emotion: e.target.value })} className="mt-2 w-full rounded-2xl border border-green-100 bg-white px-4 py-3 outline-none focus:border-green-500">
            <option value="">Select</option><option>Smooth</option><option>Clear</option><option>Neutral</option><option>Confusing</option><option>Frustrating</option>
          </select>
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold text-slate-700">What confused you? Optional note
        <textarea value={task.testerNotes || ''} onChange={(e) => onUpdateTask({ testerNotes: e.target.value })} rows={3} className="mt-2 w-full rounded-2xl border border-green-100 bg-white px-4 py-3 outline-none focus:border-green-500" />
      </label>
    </div>
  );
}

export function QuickNotes({ notes, currentTask, onAddNote, onDeleteNote }: { notes: TesterNote[]; currentTask: TestTask; onAddNote: (type: NoteType, content: string) => void; onDeleteNote: (id: string) => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Quick Notes</h2>
      <NoteComposer currentTask={currentTask} onAddNote={onAddNote} />
      <div className="mt-5 space-y-3">
        {notes.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No notes yet. Add observations as you test.</p> : null}
        {notes.map((note) => (
          <div key={note.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-slate-700 ring-1 ring-slate-100">{note.type.replace('_', ' ')}</span>
              <button type="button" onClick={() => onDeleteNote(note.id)} className="text-xs font-semibold text-red-500 hover:text-red-600">Delete</button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{note.content}</p>
            <div className="mt-2 text-xs text-slate-400">{new Date(note.createdAt).toLocaleTimeString()} · Task {currentTask.order}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoteComposer({ currentTask, onAddNote }: { currentTask: TestTask; onAddNote: (type: NoteType, content: string) => void }) {
  let content = '';
  let type: NoteType = 'observation';
  return (
    <form className="mt-4" onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); const nextContent = String(data.get('note') || '').trim(); const nextType = String(data.get('type') || 'observation') as NoteType; if (nextContent) onAddNote(nextType, nextContent); form.reset(); }}>
      <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
        <select name="type" defaultValue={type} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500">
          <option value="observation">Observation</option><option value="confusion">Confusion</option><option value="suggestion">Suggestion</option><option value="positive">Positive feedback</option>
        </select>
        <input name="note" defaultValue={content} aria-label={`Note for task ${currentTask.order}`} placeholder="Add a timestamped note..." className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Add Note</button>
        <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">Voice note placeholder</button>
      </div>
    </form>
  );
}

export function SessionTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Session Timeline</h2>
      <div className="mt-4 space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`h-3 w-3 rounded-full ${event.tone === 'red' ? 'bg-red-500' : event.tone === 'amber' ? 'bg-amber-400' : event.tone === 'slate' ? 'bg-slate-400' : 'bg-green-500'}`} />
              {index !== events.length - 1 ? <span className="mt-2 h-full w-px bg-slate-200" /> : null}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">{event.label}</div>
              <div className="mt-1 text-xs text-slate-400">{new Date(event.createdAt).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function IssueReportForm({
  currentTask,
  tasks,
  device,
  onSaveIssue,
  onRecord,
  onStopRecording,
  isRecording,
  recordingLabel,
  notice,
  testerId,
  jobId,
}: {
  currentTask: TestTask;
  tasks: TestTask[];
  device: DeviceMetadata;
  onSaveIssue: (issue: Omit<IssueReport, 'id' | 'createdAt' | 'deviceMetadata'>) => void;
  onRecord: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  recordingLabel: string;
  notice: string;
  testerId?: string;
  jobId?: string;
}) {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ path: string; url: string; type: UploadFileType; name: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!testerId || !jobId) {
      setUploadError('Missing tester ID or job ID for upload');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileType: UploadFileType = file.type.startsWith('image/') ? 'screenshot' : 'video';
        const result = await uploadBugReportFile(file, fileType, testerId, jobId);
        
        if (result.error) {
          throw new Error(result.error);
        }

        return {
          path: result.path,
          url: result.url,
          type: fileType,
          name: file.name,
        };
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...results]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        onSaveIssue({
          title: String(data.get('title') || '').trim(),
          issueType: String(data.get('issueType') || 'Functional bug'),
          severity: String(data.get('severity') || 'medium') as IssueSeverity,
          taskId: String(data.get('taskId') || currentTask.id),
          stepsToReproduce: String(data.get('steps') || '').trim(),
          expectedResult: String(data.get('expected') || '').trim(),
          actualResult: String(data.get('actual') || '').trim(),
          frequency: String(data.get('frequency') || 'sometimes') as IssueFrequency,
          evidence: uploadedFiles.map((f) => f.path),
        });
        e.currentTarget.reset();
        setUploadedFiles([]);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Report Issue</h2>
          <p className="mt-1 text-sm text-slate-600">Structured reports help developers reproduce and fix issues faster.</p>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">Task {currentTask.order}</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">Issue title
          <input name="title" required placeholder="Short issue title" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Issue type
          <select name="issueType" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500">
            <option>Functional bug</option><option>UI issue</option><option>UX issue</option><option>Performance issue</option><option>Crash</option><option>Accessibility issue</option><option>Content issue</option><option>Other</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">Severity
          <select name="severity" defaultValue="medium" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">Related task
          <select name="taskId" defaultValue={currentTask.id} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500">
            {tasks.map((task) => <option key={task.id} value={task.id}>Task {task.order}: {task.title}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="block text-sm font-semibold text-slate-700">Steps to reproduce
          <textarea name="steps" required rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">Expected result
            <textarea name="expected" rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Actual result
            <textarea name="actual" required rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" />
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-700">Frequency
          <select name="frequency" defaultValue="sometimes" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500">
            <option value="once">Once</option><option value="sometimes">Sometimes</option><option value="every_time">Every time</option>
          </select>
        </label>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
        Attached automatically: {device.deviceCategory}, {device.operatingSystem}, {device.browser}, viewport {device.viewportSize}, task {currentTask.order}, timestamp.
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="text-sm font-semibold text-slate-700">Uploaded files</div>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{file.name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{file.type}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadError && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {uploadError}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : <><Upload className="inline h-4 w-4 mr-2" /> Upload screenshot/video</>}
        </button>
        {!isRecording ? (
          <button type="button" onClick={onRecord} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100">Record clip</button>
        ) : (
          <button type="button" onClick={onStopRecording} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Stop recording</button>
        )}
        {recordingLabel ? <span className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 ring-1 ring-red-100">{recordingLabel}</span> : null}
        <button type="submit" className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-600">Save Issue</button>
      </div>
      {notice ? <p className="mt-3 text-sm font-semibold text-green-700">{notice}</p> : null}
    </form>
  );
}

export function FinalFeedbackForm({
  workflow,
  values,
  onChange,
}: {
  workflow: WorkflowConfig;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const commonQuestions = [
    ['overallExperience', 'Overall experience rating'],
    ['easeOfUse', 'Overall ease-of-use rating'],
    ['workedWell', 'What worked well?'],
    ['confusing', 'What was confusing?'],
    ['frustrating', 'Most frustrating moment'],
    ['bestPart', 'Best part of the experience'],
    ['improveFirst', 'What should be improved first?'],
    ['recommend', 'Would you recommend or use the product?'],
    ['comments', 'Additional comments'],
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Session Feedback</h2>
      <p className="mt-1 text-sm text-slate-600">Answer the questions that matter for this {workflow.label.toLowerCase()}.</p>
      <div className="mt-5 rounded-2xl bg-green-50 p-4">
        <div className="text-sm font-bold text-slate-900">Workflow-specific questions</div>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {workflow.finalQuestions.map((question) => <li key={question}>- {question}</li>)}
        </ul>
      </div>
      <div className="mt-5 space-y-4">
        {commonQuestions.map(([key, label]) => (
          <label key={key} className="block text-sm font-semibold text-slate-700">{label}
            <textarea value={values[key] || ''} onChange={(e) => onChange(key, e.target.value)} rows={key.includes('rating') ? 1 : 3} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500" />
          </label>
        ))}
      </div>
    </div>
  );
}

export function SubmissionChecklist({
  requiredTasksComplete,
  feedbackComplete,
  recordingStopped,
  issueCount,
}: {
  requiredTasksComplete: boolean;
  feedbackComplete: boolean;
  recordingStopped: boolean;
  issueCount: number;
}) {
  const items = [
    ['Required tasks completed', requiredTasksComplete],
    ['Final feedback completed', feedbackComplete],
    ['Recording stopped', recordingStopped],
    ['Evidence/issue notes ready', issueCount > 0 || feedbackComplete],
  ] as const;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Submission Readiness</h2>
      <div className="mt-4 space-y-3">
        {items.map(([label, done]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-700">{label}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${done ? 'bg-green-50 text-green-700 ring-1 ring-green-100' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'}`}>{done ? 'Done' : 'Needed'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TesterWorkspace({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  children: React.ReactNode;
}) {
  const tabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: 'task', label: 'Current Task' },
    { id: 'notes', label: 'Notes' },
    { id: 'issue', label: 'Report Issue' },
    { id: 'feedback', label: 'Session Feedback' },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab.id ? 'bg-green-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>{tab.label}</button>
          ))}
        </div>
      </div>
      {children}
    </section>
  );
}


