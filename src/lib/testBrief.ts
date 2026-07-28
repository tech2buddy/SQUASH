export type TaskOutcome = 'pass' | 'fail' | 'blocked' | 'not_applicable';

export type TestBriefTask = {
  id: string;
  title: string;
  instructions: string;
  expectedOutcome: string;
  evidenceRequired?: boolean;
};

export type TestBrief = {
  objective: string;
  accessInstructions: string;
  requiredEnvironment: string;
  outOfScope: string;
  evidenceRules: string;
  customQuestions: string[];
  tasks: TestBriefTask[];
};

export const EMPTY_TEST_BRIEF: TestBrief = {
  objective: '',
  accessInstructions: '',
  requiredEnvironment: '',
  outOfScope: '',
  evidenceRules: '',
  customQuestions: [],
  tasks: [],
};

function asText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

/** Safely reads the additive jobs.lab_config shape while keeping legacy jobs usable. */
export function parseTestBrief(value: unknown, legacyTasks = ''): TestBrief {
  const config = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const rawTasks = Array.isArray(config.tasks) ? config.tasks : [];
  const tasks = rawTasks
    .map((task, index): TestBriefTask | null => {
      if (!task || typeof task !== 'object') return null;
      const item = task as Record<string, unknown>;
      const title = asText(item.title).trim();
      if (!title) return null;
      return {
        id: asText(item.id).trim() || `task-${index + 1}`,
        title,
        instructions: asText(item.instructions).trim() || title,
        expectedOutcome: asText(item.expectedOutcome).trim(),
        evidenceRequired: item.evidenceRequired === true,
      };
    })
    .filter((task): task is TestBriefTask => task !== null);

  if (!tasks.length && legacyTasks.trim()) {
    legacyTasks.split(/\r?\n|,/).map((title) => title.trim()).filter(Boolean).forEach((title, index) => {
      tasks.push({ id: `task-${index + 1}`, title, instructions: title, expectedOutcome: '' });
    });
  }

  return {
    objective: asText(config.objective).trim(),
    accessInstructions: asText(config.accessInstructions).trim(),
    requiredEnvironment: asText(config.requiredEnvironment).trim(),
    outOfScope: asText(config.outOfScope).trim(),
    evidenceRules: asText(config.evidenceRules).trim(),
    customQuestions: Array.isArray(config.customQuestions)
      ? config.customQuestions.map((question) => asText(question).trim()).filter(Boolean)
      : [],
    tasks,
  };
}

export function briefCompletionIssues(brief: TestBrief) {
  const issues: string[] = [];
  if (!brief.objective.trim()) issues.push('Add the main testing objective.');
  if (!brief.tasks.length) issues.push('Add at least one task.');
  brief.tasks.forEach((task, index) => {
    if (task.title.trim().length < 4) issues.push(`Task ${index + 1} needs a clearer title.`);
    if (!task.instructions.trim()) issues.push(`Add instructions for task ${index + 1}.`);
    if (!task.expectedOutcome.trim()) issues.push(`Add the expected result for task ${index + 1}.`);
  });
  return issues;
}
