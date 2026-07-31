import { colors } from './theme';

/**
 * Single source of truth for every word and figure in the film.
 *
 * Both the 16:9 and 9:16 cuts read from here. The layouts differ completely —
 * a two-column arrangement cannot reflow into a vertical frame — but the copy
 * must not, or the two versions drift apart the first time a line changes.
 */

export const ACTS = {
  hook: 'Act 01 · The blind spot',
  cost: 'Act 02 · The cost',
  mark: 'Act 03 · The mark',
  mechanic: 'Act 04 · The mechanic',
  coverage: 'Act 05 · Coverage',
  start: 'Act 06 · Start',
} as const;

export const HOOK = {
  kicker: 'Ships green',
  headline: 'It worked\non your\nmachine.',
  error: 'Gateway timeout · 30 000 ms',
  body: 'Every test passed. Then someone tried to pay on a throttled connection, and the gateway went quiet.',
} as const;

export const COST = {
  kicker: 'The cost',
  headline: "You don't get\na second\n*first impression.*",
} as const;

/**
 * Illustrative, and deliberately not attributed to any named app store — these
 * are written for the film, not quoted from anywhere real. Ratings descend
 * 3 → 2 → 1 across days 2 → 5 so the sequence reads as a decline.
 */
export const REVIEWS = [
  { rating: 3, quote: 'Checkout took three tries before it finally worked.', meta: 'Store review · day 2', at: 46 },
  { rating: 2, quote: 'Could not finish signing up. Gave up and used the website.', meta: 'Store review · day 3', at: 62 },
  { rating: 1, quote: 'Took my money twice and showed an error. Uninstalled.', meta: 'Store review · day 5', at: 78 },
] as const;

export const MARK = {
  word: 'SQUASH',
  tagline: 'Real-user QA, before you launch.',
  meta: 'South Africa and Beyond',
} as const;

export const MECHANIC_KICKER = 'How it works';

export const STEPS = [
  {
    numeral: '01',
    title: 'Post\na job',
    // Examples avoid a hyphenated word: "e-commerce" wraps on its own hyphen
    // at these measures. It still appears in the sheet's Test type row.
    body: 'Choose the kind of testing you need: onboarding, accessibility, low data, performance. Then pick the devices and networks to cover.',
  },
  {
    numeral: '02',
    title: 'Real people\nrun it',
    body: 'Qualified testers work your flows on the phones and networks they already own, not an emulator farm.',
  },
  {
    numeral: '03',
    title: 'Read\nthe report',
    body: 'Findings ranked by severity, each with reproduction steps, evidence, and the device it surfaced on.',
  },
] as const;

/** `accent` is optional, so the rows must share one type rather than a union. */
type SheetRow = { label: string; value: string; at: number; accent?: boolean };
type Figure = { value: string; label: string; at: number; accent?: boolean };

export const BRIEF: { head: string; rows: SheetRow[] } = {
  head: 'New job · SQ-1047',
  /** Test-type values are real category names from src/components/testCategories.tsx. */
  rows: [
    { label: 'Product', value: 'ShopFast · Android + iOS', at: 20 },
    { label: 'Test type', value: 'E-commerce · Low Data', at: 30 },
    { label: 'Objective', value: 'Complete a paid checkout', at: 40 },
    { label: 'Panel', value: '12 everyday users', at: 50 },
    { label: 'Network', value: 'Throttled 4G + fibre', at: 60 },
    { label: 'Region', value: 'Gauteng · W. Cape · KZN', at: 70 },
    { label: 'Budget', value: 'R 500,00', at: 80, accent: true },
  ],
};

export const PANEL = {
  head: 'Panel · 5 of 12 reporting',
  rows: [
    { initials: 'NK', city: 'Johannesburg', device: 'Galaxy A54', net: '4G', at: 20 },
    { initials: 'KM', city: 'Cape Town', device: 'iPhone 13', net: 'Fibre', at: 32 },
    { initials: 'AV', city: 'Durban', device: 'Redmi Note 12', net: '4G', at: 44 },
    { initials: 'TS', city: 'Pretoria', device: 'Pixel 7a', net: '5G', at: 56 },
    { initials: 'LM', city: 'Gqeberha', device: 'Galaxy A14', net: '3G', at: 68 },
  ],
} as const;

export const FINDINGS = {
  head: 'Findings · 3 of 9 shown',
  rows: [
    { sev: 'S1', text: 'Checkout fails silently on throttled 4G', weight: 'Blocking', color: colors.signal, at: 20 },
    { sev: 'S2', text: 'Promo field rejects codes containing spaces', weight: 'Major', color: colors.ink, at: 36 },
    { sev: 'S3', text: 'Nav tap targets below 44 px on small screens', weight: 'Minor', color: colors.inkMuted, at: 52 },
  ],
  scoreLabel: 'Usability score',
  scoreNote: 'Screen recordings and repro steps attached',
  score: 68,
} as const;

export const COVERAGE = {
  kicker: 'Built for South Africa',
  headline: 'Real people.\nReal devices.\n*Real networks.*',
  /**
   * The first two are the claims already published on the live homepage
   * (src/SquashHomepage.tsx). The third restates the same "real hardware"
   * positioning as a figure rather than inventing a new statistic.
   */
  figures: [
    { value: '4,2 h', label: 'Median turnaround', at: 44 },
    { value: '100%', label: 'Human QA coverage', at: 56, accent: true },
    { value: '0', label: 'Emulators involved', at: 68 },
  ] as Figure[],
  cities: 'Johannesburg · Cape Town · Durban · Pretoria · Gqeberha · Bloemfontein',
};

export const CTA = {
  kicker: 'Start here',
  headline: 'Test it before\nyour users do.',
  primary: 'Post a testing job',
  secondary: 'Apply as a tester',
  mark: 'SQUASH',
  micro: 'Real-user QA',
} as const;
