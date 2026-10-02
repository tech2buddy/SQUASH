import {
  BadgeCheck,
  Bell,
  ClipboardCheck,
  Clock3,
  FileText,
  Home,
  LockKeyhole,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './auth';
import {
  deleteQualificationScenario,
  getQualificationScenarioTemplates,
  saveQualificationScenario,
  uploadQualificationScenarioLogo,
  type QualificationScenarioTask,
  type QualificationScenarioTemplate,
} from './lib/adminQualificationApi';

type TaskDraft = QualificationScenarioTask;

// `null` selection means "a new sample test that has not been saved yet".
const NEW_SCENARIO_KEY = '__new__';

function emptyTask(): TaskDraft {
  return { id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: '', instruction: '', expectedResult: '' };
}

export default function SquashAdminQualificationTemplatePage() {
  const { session } = useAuth();
  const [templates, setTemplates] = useState<QualificationScenarioTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [productName, setProductName] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [accessInstructions, setAccessInstructions] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [objective, setObjective] = useState('');
  const [environment, setEnvironment] = useState('');
  const [outOfScope, setOutOfScope] = useState('');
  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInput = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isNew = selectedKey === NEW_SCENARIO_KEY;

  const load = async (preferKey?: string) => {
    setLoading(true);
    setError('');
    try {
      const list = await getQualificationScenarioTemplates();
      setTemplates(list);
      setSelectedKey((current) => {
        const wanted = preferKey || current;
        return list.some((item) => item.variantKey === wanted) ? wanted : list[0]?.variantKey || null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load sample tests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const selected = useMemo(() => templates.find((item) => item.variantKey === selectedKey) || null, [templates, selectedKey]);
  const activeCount = useMemo(() => templates.filter((item) => item.isActive).length, [templates]);

  useEffect(() => {
    if (isNew) return;
    if (!selected) return;
    setTitle(selected.title);
    setProductName(selected.productName);
    setAppUrl(selected.appUrl);
    setAccessInstructions(selected.accessInstructions);
    setLogoUrl(selected.logoUrl);
    setObjective(selected.objective);
    setEnvironment(selected.environment);
    setOutOfScope(selected.outOfScope);
    setTasks(selected.tasks.length ? selected.tasks : [emptyTask()]);
    setIsActive(selected.isActive);
    setError('');
    setNotice('');
  }, [selected, isNew]);

  const startNewScenario = () => {
    setSelectedKey(NEW_SCENARIO_KEY);
    setTitle('');
    setProductName('');
    setAppUrl('');
    setAccessInstructions('');
    setLogoUrl('');
    setObjective('');
    setEnvironment('');
    setOutOfScope('');
    setTasks([emptyTask()]);
    setIsActive(true);
    setError('');
    setNotice('');
  };

  const updateTask = (index: number, patch: Partial<TaskDraft>) => {
    setTasks((current) => current.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)));
  };

  const addTask = () => setTasks((current) => [...current, emptyTask()]);
  const removeTask = (index: number) => setTasks((current) => current.filter((_, taskIndex) => taskIndex !== index));

  const save = async () => {
    if (!isNew && !selected) return;
    if (!title.trim() || !productName.trim() || !objective.trim() || !environment.trim() || !outOfScope.trim()) {
      setError('Fill in the name, product name, objective, environment and out-of-scope before saving.');
      return;
    }
    if (appUrl.trim() && !/^https:\/\/\S{3,}$/i.test(appUrl.trim())) {
      setError('The app link must be a full https:// address, or left empty.');
      return;
    }
    const cleanTasks = tasks.filter((task) => task.title.trim() && task.instruction.trim() && task.expectedResult.trim());
    if (!cleanTasks.length) {
      setError('Add at least one complete task (title, instruction and expected result).');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const savedKey = await saveQualificationScenario(isNew ? null : selected!.variantKey, {
        title: title.trim(),
        productName: productName.trim(),
        objective: objective.trim(),
        environment: environment.trim(),
        outOfScope: outOfScope.trim(),
        appUrl: appUrl.trim(),
        accessInstructions: accessInstructions.trim(),
        logoUrl: logoUrl.trim(),
        tasks: cleanTasks,
        isActive,
      });
      setNotice(isActive
        ? 'Saved. New testers reaching the sample stage will now be given this test.'
        : 'Saved as inactive. No tester will be given this test until you turn it on.');
      await load(savedKey);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this sample test.');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file || !session?.userId) return;
    setLogoUploading(true);
    setError('');
    setNotice('');
    try {
      setLogoUrl(await uploadQualificationScenarioLogo(file, session.userId));
      setNotice('Logo uploaded. Save the sample test to keep it.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload that logo.');
    } finally {
      setLogoUploading(false);
      if (logoInput.current) logoInput.current.value = '';
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!window.confirm(`Remove "${selected.title}" completely?`)) return;
    setRemoving(true);
    setError('');
    setNotice('');
    try {
      // First call only reports what is in the way, so the second confirmation
      // can state the real cost to a real tester instead of a generic warning.
      let result = await deleteQualificationScenario(selected.variantKey);

      if (result.outcome === 'in_use') {
        const otherLiveTest = templates.some((item) => item.isActive && item.variantKey !== selected.variantKey);
        const consequence = result.locked > 0
          ? `${result.locked} tester(s) have already submitted or been reviewed on this test. Their reports cannot be deleted, so this test will be switched off instead of removed.`
          : otherLiveTest
            ? `${result.inFlight} tester(s) are part-way through it. They will be moved onto another live test and keep their quiz result.`
            : `${result.inFlight} tester(s) are part-way through it, and there is no other live test to move them to. Their attempt will be deleted and they will start again from the beginning — including retaking the quiz.`;
        if (!window.confirm(`${consequence}\n\nContinue?`)) {
          setRemoving(false);
          return;
        }
        result = await deleteQualificationScenario(selected.variantKey, true);
      }

      setSelectedKey(null);
      if (result.outcome === 'retired') {
        setNotice(`Switched off instead of removed: ${result.locked} submitted or reviewed attempt(s) point at it, and deleting those would erase a tester's qualification record. No new tester will be given it.`);
      } else if (result.reassigned > 0) {
        setNotice(`Sample test removed. ${result.reassigned} tester(s) were moved onto another live test.`);
      } else if (result.reset > 0) {
        setNotice(`Sample test removed. ${result.reset} tester(s) were reset to the start of the application.`);
      } else {
        setNotice('Sample test removed.');
      }
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not remove this sample test.');
    } finally {
      setRemoving(false);
    }
  };

  const adminName = session?.name || 'Admin';

  const navItems = [
    { label: 'Overview', href: '/A31/dashboard', icon: Home },
    { label: 'Qualifications', href: '/A31/qualifications', icon: BadgeCheck },
    { label: 'Sample Test Template', href: '/A31/qualification-template', icon: ClipboardCheck, active: true },
    { label: 'Probation watch', href: '/A31/probation', icon: Clock3 },
    { label: 'Payout Queue', href: '/A31/payouts', icon: FileText },
    { label: 'Users', href: '/A31/users', icon: Users },
    { label: 'Security', href: '/A31/security', icon: LockKeyhole },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
            <img src="/squash-logo.png" alt="SQUASH logo" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover shadow-sm" />
            <a href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-green-700">SQUASH</a>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.label} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${item.active ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <Icon className="h-4 w-4" />{item.label}
                </a>
              );
            })}
          </nav>
          <div className="p-4 pt-0">
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5 text-sm leading-6 text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900"><ShieldCheck className="h-5 w-5 text-green-700" />What this controls</div>
              <p className="mt-2">The real test every new tester must pass before they can apply to paid jobs. Each one is assigned automatically once they pass the QA foundations quiz.</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700"><BadgeCheck className="h-3.5 w-3.5" /> Private administrator workspace</div>
                <h1 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">Sample test template</h1>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Bell className="h-5 w-5 text-slate-500" />
                <div className="hidden sm:block">
                  <div className="text-sm font-bold text-slate-900">{adminName}</div>
                  <div className="text-xs text-slate-500">Admin</div>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {notice ? <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{notice}</div> : null}
            {error ? <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
            {!loading && activeCount === 0 ? (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                No sample test is live. Until you turn one on, a new tester cannot start their application at all — they are told to contact support.
              </div>
            ) : null}
            {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Loading sample tests...</div> : null}

            {!loading ? (
              <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                <section className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-black text-slate-900">Sample tests</h2>
                    <p className="mt-1 text-xs text-slate-500">A new tester is given one active test at random. Inactive ones are never assigned.</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {templates.map((item) => (
                      <button
                        type="button"
                        key={item.variantKey}
                        onClick={() => setSelectedKey(item.variantKey)}
                        className={`w-full p-5 text-left transition ${selectedKey === item.variantKey ? 'bg-green-50/70' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-slate-900">{item.title}</div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${item.isActive ? 'bg-green-50 text-green-700 ring-1 ring-green-100' : 'bg-slate-100 text-slate-500'}`}>
                            {item.isActive ? 'Live' : 'Off'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{item.productName || 'Not configured yet'}</div>
                      </button>
                    ))}
                    {isNew ? (
                      <div className="bg-green-50/70 p-5 text-left">
                        <div className="font-bold text-slate-900">{title.trim() || 'New sample test'}</div>
                        <div className="mt-1 text-xs text-slate-500">Not saved yet</div>
                      </div>
                    ) : null}
                    {!templates.length && !isNew ? (
                      <p className="px-5 py-6 text-sm font-semibold text-slate-500">No sample test set up yet. Testers cannot start their application until you add one.</p>
                    ) : null}
                  </div>
                  <div className="border-t border-slate-100 p-4">
                    <button type="button" onClick={startNewScenario} className="w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700">
                      New sample test
                    </button>
                  </div>
                </section>

                {selected || isNew ? (
                  <section className="space-y-5">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-black text-slate-900">{isNew ? 'New sample test' : selected!.title}</h3>
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500" />
                          Give this to new testers
                        </label>
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-semibold text-slate-700">Sample test name
                          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sample test: signup flow" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" />
                        </label>
                        <label className="block text-sm font-semibold text-slate-700">Product name
                          <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Northstar Store" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" />
                        </label>
                        <label className="block text-sm font-semibold text-slate-700">App link
                          <input value={appUrl} onChange={(e) => setAppUrl(e.target.value)} placeholder="https://... the app testers should open" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" />
                          <span className="mt-1 block text-xs font-medium text-slate-500">Optional. Must be https. Leave empty for a written-only exercise.</span>
                        </label>
                        <label className="block text-sm font-semibold text-slate-700">Environment
                          <input value={environment} onChange={(e) => setEnvironment(e.target.value)} placeholder="e.g. Desktop or mobile browser..." className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" />
                        </label>
                      </div>
                      <div className="mt-4 block text-sm font-semibold text-slate-700">Logo
                        <div className="mt-2 flex flex-wrap items-center gap-4">
                          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xl font-black text-slate-400">{productName.trim().slice(0, 1).toUpperCase() || '?'}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              ref={logoInput}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(e) => void uploadLogo(e.target.files?.[0])}
                              className="hidden"
                            />
                            <button
                              type="button"
                              disabled={logoUploading}
                              onClick={() => logoInput.current?.click()}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {logoUploading ? 'Uploading...' : logoUrl ? 'Replace logo' : 'Upload logo'}
                            </button>
                            {logoUrl ? (
                              <button
                                type="button"
                                onClick={() => setLogoUrl('')}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Remove logo
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <span className="mt-2 block text-xs font-medium text-slate-500">
                          PNG, JPEG or WebP, under 1MB. Shown to the tester at the top of their brief. Without one they see the first letter of the product name.
                        </span>
                      </div>

                      <label className="mt-4 block text-sm font-semibold text-slate-700">Access instructions
                        <textarea value={accessInstructions} onChange={(e) => setAccessInstructions(e.target.value)} rows={2} placeholder="Test login, sample card, or anything a tester needs to get in." className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" />
                        <span className="mt-1 block text-xs font-medium text-slate-500">Shown to every tester doing this test — use throwaway test credentials only, never a real account.</span>
                      </label>
                      <label className="mt-4 block text-sm font-semibold text-slate-700">Objective
                        <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} placeholder="What should a tester verify in this scenario?" className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" />
                      </label>
                      <label className="mt-4 block text-sm font-semibold text-slate-700">Out of scope
                        <textarea value={outOfScope} onChange={(e) => setOutOfScope(e.target.value)} rows={2} placeholder="What should testers not do in this scenario?" className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" />
                      </label>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-black text-slate-900">Test tasks</h3>
                          <p className="mt-1 text-sm text-slate-500">Add each step as a separate task, just like a developer would for a real job.</p>
                        </div>
                        <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-100">{tasks.filter((task) => task.title.trim()).length} tasks</div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {tasks.map((task, index) => (
                          <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="flex gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-green-200 bg-green-50 text-sm font-bold text-green-700">{index + 1}</div>
                              <input value={task.title} onChange={(e) => updateTask(index, { title: e.target.value })} placeholder="Task title: e.g. Choose the Standard plan" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500" />
                              <button type="button" onClick={() => removeTask(index)} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Remove</button>
                            </div>
                            <input value={task.instruction} onChange={(e) => updateTask(index, { instruction: e.target.value })} placeholder="Instruction: what exactly should the tester do?" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-green-500" />
                            <input value={task.expectedResult} onChange={(e) => updateTask(index, { expectedResult: e.target.value })} placeholder="Expected result: what should happen when this task is completed?" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-green-500" />
                          </div>
                        ))}
                      </div>

                      <button type="button" onClick={addTask} className="mt-4 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700">Add Task</button>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {!isNew ? (
                        <button type="button" disabled={removing} onClick={() => void remove()} className="mr-auto rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                          {removing ? 'Removing...' : 'Remove this test'}
                        </button>
                      ) : null}
                      <button type="button" disabled={saving} onClick={() => void save()} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
                        {saving ? 'Saving...' : isNew ? 'Create sample test' : 'Save sample test'}
                      </button>
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
