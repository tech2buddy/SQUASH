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
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import {
  getQualificationScenarioTemplates,
  updateQualificationScenarioTemplate,
  type QualificationScenarioTask,
  type QualificationScenarioTemplate,
} from './lib/adminQualificationApi';

type TaskDraft = QualificationScenarioTask;

function emptyTask(): TaskDraft {
  return { id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: '', instruction: '', expectedResult: '' };
}

export default function SquashAdminQualificationTemplatePage() {
  const { session } = useAuth();
  const [templates, setTemplates] = useState<QualificationScenarioTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [objective, setObjective] = useState('');
  const [environment, setEnvironment] = useState('');
  const [outOfScope, setOutOfScope] = useState('');
  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getQualificationScenarioTemplates();
      setTemplates(list);
      setSelectedKey((current) => (list.some((item) => item.variantKey === current) ? current : list[0]?.variantKey || null));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load sample test templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const selected = useMemo(() => templates.find((item) => item.variantKey === selectedKey) || null, [templates, selectedKey]);

  useEffect(() => {
    if (!selected) return;
    setProductName(selected.productName);
    setObjective(selected.objective);
    setEnvironment(selected.environment);
    setOutOfScope(selected.outOfScope);
    setTasks(selected.tasks.length ? selected.tasks : [emptyTask()]);
    setError('');
    setNotice('');
  }, [selected]);

  const updateTask = (index: number, patch: Partial<TaskDraft>) => {
    setTasks((current) => current.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)));
  };

  const addTask = () => setTasks((current) => [...current, emptyTask()]);
  const removeTask = (index: number) => setTasks((current) => current.filter((_, taskIndex) => taskIndex !== index));

  const save = async () => {
    if (!selected) return;
    if (!productName.trim() || !objective.trim() || !environment.trim() || !outOfScope.trim()) {
      setError('Fill in product name, objective, environment and out-of-scope before saving.');
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
      await updateQualificationScenarioTemplate(selected.variantKey, {
        productName: productName.trim(),
        objective: objective.trim(),
        environment: environment.trim(),
        outOfScope: outOfScope.trim(),
        tasks: cleanTasks,
      });
      setNotice('Saved. Testers starting the sample test will now see this content.');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this template.');
    } finally {
      setSaving(false);
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
              <p className="mt-2">This is the content every tester sees in the practical sample stage of Tester Academy — a controlled training scenario, not a real job.</p>
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
            {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Loading templates...</div> : null}

            {!loading ? (
              <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                <section className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-black text-slate-900">Scenarios</h2>
                    <p className="mt-1 text-xs text-slate-500">Testers get one of these at random.</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {templates.map((item) => (
                      <button
                        type="button"
                        key={item.variantKey}
                        onClick={() => setSelectedKey(item.variantKey)}
                        className={`w-full p-5 text-left transition ${selectedKey === item.variantKey ? 'bg-green-50/70' : 'hover:bg-slate-50'}`}
                      >
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.productName || 'Not configured yet'}</div>
                      </button>
                    ))}
                  </div>
                </section>

                {selected ? (
                  <section className="space-y-5">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <h3 className="font-black text-slate-900">{selected.title}</h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-semibold text-slate-700">Product name
                          <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Northstar Store" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" />
                        </label>
                        <label className="block text-sm font-semibold text-slate-700">Environment
                          <input value={environment} onChange={(e) => setEnvironment(e.target.value)} placeholder="e.g. Desktop or mobile browser..." className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-green-500" />
                        </label>
                      </div>
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

                    <div className="flex justify-end">
                      <button type="button" disabled={saving} onClick={() => void save()} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
                        {saving ? 'Saving...' : 'Save template'}
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
