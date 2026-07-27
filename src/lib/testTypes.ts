export type TestTypeKey =
  | 'bug-hunting'
  | 'onboarding'
  | 'usability'
  | 'low-data'
  | 'localization'
  | 'accessibility';

export type TestTypeConfig = {
  key: TestTypeKey;
  label: string;
  shortLabel: string;
  description: string;
  ratePerTesterZar: number;
  minTesters: number;
  defaultTesters: number;
  estimatedMinutes: number;
};

export const TEST_TYPES: TestTypeConfig[] = [
  {
    key: 'bug-hunting',
    label: 'Bug Hunting',
    shortLabel: 'Bug Hunting',
    description: 'Exploratory bug hunting across your app or site.',
    ratePerTesterZar: 100,
    minTesters: 5,
    defaultTesters: 10,
    estimatedMinutes: 20,
  },
  {
    key: 'onboarding',
    label: 'Onboarding / First Impressions',
    shortLabel: 'Onboarding',
    description: 'Fresh-eyes first-time user reactions to your onboarding flow.',
    ratePerTesterZar: 90,
    minTesters: 3,
    defaultTesters: 5,
    estimatedMinutes: 15,
  },
  {
    key: 'usability',
    label: 'Usability Testing',
    shortLabel: 'Usability',
    description: 'Task-based usability testing with structured feedback.',
    ratePerTesterZar: 140,
    minTesters: 5,
    defaultTesters: 5,
    estimatedMinutes: 30,
  },
  {
    key: 'low-data',
    label: 'Low-Data Testing',
    shortLabel: 'Low-Data',
    description: 'Real-world testing on 2G/3G network conditions.',
    ratePerTesterZar: 150,
    minTesters: 3,
    defaultTesters: 3,
    estimatedMinutes: 30,
  },
  {
    key: 'localization',
    label: 'Localization Testing',
    shortLabel: 'Localization',
    description: 'Native-speaker testing across South African languages.',
    ratePerTesterZar: 180,
    minTesters: 3,
    defaultTesters: 3,
    estimatedMinutes: 30,
  },
  {
    key: 'accessibility',
    label: 'Accessibility Testing',
    shortLabel: 'Accessibility',
    description: 'Testing with real assistive-technology users.',
    ratePerTesterZar: 220,
    minTesters: 3,
    defaultTesters: 3,
    estimatedMinutes: 40,
  },
];

export function getTestTypeByKey(key: string): TestTypeConfig {
  return TEST_TYPES.find((testType) => testType.key === key) ?? TEST_TYPES[0];
}
