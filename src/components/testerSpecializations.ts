export type SpecializationOption = {
  id: string;
  label: string;
  /** Shown when a tester is asked to prove this specialization. */
  evidenceHint?: string;
};

export type SpecializationGroup = {
  id: string;
  title: string;
  description?: string;
  options: SpecializationOption[];
};

/**
 * This list is a controlled vocabulary, not user data, so it stays a constant
 * rather than a Supabase query -- the same reasoning as `testTypes.ts`.
 *
 * The ids are load-bearing: `test_type_specialization_requirements` (phase 47)
 * stores them, and the job-application trigger compares against them. Renaming
 * an id here without a matching migration silently breaks the verification
 * gate, so add new ids rather than editing existing ones.
 */
export const SPECIALIZATION_GROUPS: SpecializationGroup[] = [
  {
    id: 'device',
    title: 'Device Specializations',
    options: [
      { id: 'samsung-a-series', label: 'Samsung Galaxy (A-series)' },
      { id: 'samsung-s-series', label: 'Samsung Galaxy (S-series)' },
      { id: 'iphone-6-11', label: 'iPhone (older models 6-11)' },
      { id: 'iphone-12-plus', label: 'iPhone (newer models 12+)' },
      { id: 'huawei-honor', label: 'Huawei/Honor devices' },
      { id: 'budget-android', label: 'Budget Android (under R2,000)' },
      { id: 'desktop-laptop', label: 'Desktop / Laptop' },
    ],
  },
  {
    id: 'network',
    title: 'Network Conditions',
    description: 'Low-Data jobs need a verified constrained-network specialization.',
    options: [
      {
        id: 'township-network',
        label: 'Township/informal settlement network',
        evidenceHint: 'A screen recording of a speed test taken where you normally test.',
      },
      {
        id: 'rural-network',
        label: 'Rural area network',
        evidenceHint: 'A screen recording of a speed test taken where you normally test.',
      },
      {
        id: '2g-3g-only',
        label: '2G/3G only testing',
        evidenceHint: 'A screenshot or recording showing your device on a 2G or 3G connection.',
      },
      { id: 'lte-4g-5g', label: 'LTE / 4G / 5G testing' },
      { id: 'load-shedding', label: 'Load shedding conditions testing' },
    ],
  },
  {
    id: 'language',
    title: 'Language Skills',
    description: 'Localization jobs need a verified South African language.',
    options: [
      {
        id: 'zulu',
        label: 'Zulu / isiZulu',
        evidenceHint: 'A short video describing what an app does, spoken in isiZulu.',
      },
      {
        id: 'xhosa',
        label: 'Xhosa / isiXhosa',
        evidenceHint: 'A short video describing what an app does, spoken in isiXhosa.',
      },
      {
        id: 'sotho',
        label: 'Sotho / Sesotho',
        evidenceHint: 'A short video describing what an app does, spoken in Sesotho.',
      },
      {
        id: 'afrikaans',
        label: 'Afrikaans',
        evidenceHint: 'A short video describing what an app does, spoken in Afrikaans.',
      },
      { id: 'english', label: 'English' },
      {
        id: 'venda',
        label: 'Venda / Tshivenda',
        evidenceHint: 'A short video describing what an app does, spoken in Tshivenda.',
      },
      {
        id: 'tsonga',
        label: 'Tsonga / Xitsonga',
        evidenceHint: 'A short video describing what an app does, spoken in Xitsonga.',
      },
    ],
  },
  {
    id: 'accessibility',
    title: 'Assistive Technology',
    description:
      'Accessibility jobs need a verified assistive-technology specialization. Only tick what you genuinely use day to day.',
    options: [
      {
        id: 'screen-reader',
        label: 'Screen reader (TalkBack / VoiceOver / NVDA)',
        evidenceHint: 'A screen recording with your screen reader audible as you navigate an app.',
      },
      {
        id: 'screen-magnification',
        label: 'Screen magnification / large text',
        evidenceHint: 'A screen recording showing your usual magnification settings in use.',
      },
      {
        id: 'switch-or-motor',
        label: 'Switch access or limited motor control',
        evidenceHint: 'A recording showing how you navigate an app with your usual setup.',
      },
      {
        id: 'deaf-hard-of-hearing',
        label: 'Deaf / hard of hearing (captions)',
        evidenceHint: 'A short written statement plus any assistive setup you rely on.',
      },
      {
        id: 'colour-vision',
        label: 'Colour vision deficiency',
        evidenceHint: 'A short written statement describing which colours are affected.',
      },
      {
        id: 'cognitive-support',
        label: 'Cognitive / reading support needs',
        evidenceHint: 'A short written statement describing the support you use.',
      },
    ],
  },
  {
    id: 'expertise',
    title: 'App Expertise',
    options: [
      { id: 'banking', label: 'Mobile banking apps' },
      { id: 'ecommerce', label: 'E-commerce / shopping apps' },
      { id: 'government', label: 'Government / civic apps' },
      { id: 'education', label: 'Education apps' },
      { id: 'health', label: 'Health and wellness apps' },
      { id: 'transport', label: 'Transport / taxi apps' },
    ],
  },
];

/**
 * Client mirror of `test_type_specialization_requirements`
 * (supabase/phase47_verified_specializations.sql).
 *
 * The database is authoritative -- the job-application trigger is what actually
 * refuses an application. This copy exists so the UI can explain the rule
 * *before* a tester wastes time applying. `testerSpecializations.test.ts` parses
 * the migration and fails if the two ever drift, the same guard `pricing.test.ts`
 * puts on the payout formula.
 */
export const TEST_TYPE_SPECIALIZATION_REQUIREMENTS: Record<string, string[]> = {
  localization: ['zulu', 'xhosa', 'sotho', 'afrikaans', 'venda', 'tsonga'],
  'low-data': ['2g-3g-only', 'township-network', 'rural-network'],
  accessibility: [
    'screen-reader',
    'screen-magnification',
    'switch-or-motor',
    'deaf-hard-of-hearing',
    'colour-vision',
    'cognitive-support',
  ],
};

export function getSpecializationOption(id: string): SpecializationOption | undefined {
  for (const group of SPECIALIZATION_GROUPS) {
    const found = group.options.find((option) => option.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getSpecializationLabel(id: string) {
  return getSpecializationOption(id)?.label ?? id;
}

/** True when a specialization has to be admin-verified to be worth anything. */
export function requiresVerification(id: string) {
  return Object.values(TEST_TYPE_SPECIALIZATION_REQUIREMENTS).some((keys) => keys.includes(id));
}

/**
 * The keys that satisfy a test type, narrowed by the developer's stated
 * preference when the two overlap. Mirrors `job_application_requirement_keys`.
 */
export function requiredSpecializationsForJob(packageKey: string, preferred: string[] = []): string[] {
  const required = TEST_TYPE_SPECIALIZATION_REQUIREMENTS[packageKey];
  if (!required) return [];
  const narrowed = required.filter((key) => preferred.includes(key));
  return narrowed.length > 0 ? narrowed : required;
}

export function getSpecializationIds() {
  return SPECIALIZATION_GROUPS.flatMap((group) => group.options.map((option) => option.id));
}

export function hasSaLanguageTag(selected: string[]) {
  return selected.some((id) =>
    ['zulu', 'xhosa', 'sotho', 'afrikaans', 'venda', 'tsonga'].includes(id),
  );
}

