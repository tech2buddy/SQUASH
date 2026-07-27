import { describe, expect, it } from 'vitest';
import {
  PLATFORM_COMMISSION_SHARE,
  TESTER_POOL_SHARE,
  jobTotalZar,
  platformCommissionZar,
  testerPayoutForJob,
} from './pricing';
import { TEST_TYPES, getTestTypeByKey } from './testTypes';

/**
 * Mirror of the payout formula enforced in
 * supabase/phase34_commission_pricing.sql:
 *
 *   floor(total_amount_zar * 0.62 / testers_needed)
 *
 * Written out independently here so the test fails if the app-side
 * implementation drifts from the SQL that actually authorises payouts.
 */
function sqlPayoutFormula(totalAmountZar: number, testersNeeded: number): number {
  return Math.floor((totalAmountZar * 0.62) / testersNeeded);
}

describe('tester payout math', () => {
  it('matches the SQL formula that authorises real payouts', () => {
    const cases: Array<[number, number]> = [
      [500, 5],
      [1200, 10],
      [2500, 20],
      [450, 3],
      [700, 5],
      [660, 3],
      [1000, 10],
      [999, 7],
      [1, 3],
    ];

    for (const [total, testers] of cases) {
      expect(testerPayoutForJob(total, testers)).toBe(sqlPayoutFormula(total, testers));
    }
  });

  it('pays each tester the documented rate for every test type', () => {
    // These are the per-tester payouts published on the For Testers page.
    // If a rate changes, this test should fail until the public copy is
    // reviewed too -- testers should never be shown a number we don't pay.
    const expected: Record<string, number> = {
      'bug-hunting': 62,
      onboarding: 55,
      usability: 86,
      'low-data': 93,
      localization: 111,
      accessibility: 136,
    };

    for (const testType of TEST_TYPES) {
      const total = jobTotalZar(testType.ratePerTesterZar, testType.defaultTesters);
      expect(testerPayoutForJob(total, testType.defaultTesters)).toBe(expected[testType.key]);
    }
  });

  it('never pays out more than the tester pool share', () => {
    for (const testType of TEST_TYPES) {
      const total = jobTotalZar(testType.ratePerTesterZar, testType.defaultTesters);
      const paidOut = testerPayoutForJob(total, testType.defaultTesters) * testType.defaultTesters;
      expect(paidOut).toBeLessThanOrEqual(total * TESTER_POOL_SHARE);
    }
  });

  it('always leaves SQUASH a positive commission', () => {
    for (const testType of TEST_TYPES) {
      for (const testers of [testType.minTesters, testType.defaultTesters, testType.defaultTesters * 3]) {
        const total = jobTotalZar(testType.ratePerTesterZar, testers);
        const commission = platformCommissionZar(total, testers);
        expect(commission).toBeGreaterThan(0);
        // Rounding down per tester can only ever favour the platform, so the
        // commission should sit at or just above the nominal 38% share.
        expect(commission).toBeGreaterThanOrEqual(Math.floor(total * PLATFORM_COMMISSION_SHARE));
      }
    }
  });

  it('returns zero rather than dividing by zero when a job has no testers', () => {
    expect(testerPayoutForJob(1000, 0)).toBe(0);
    expect(Number.isFinite(testerPayoutForJob(1000, 0))).toBe(true);
  });

  it('never returns a fractional or negative payout', () => {
    for (const testType of TEST_TYPES) {
      const total = jobTotalZar(testType.ratePerTesterZar, testType.defaultTesters);
      const payout = testerPayoutForJob(total, testType.defaultTesters);
      expect(Number.isInteger(payout)).toBe(true);
      expect(payout).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('job totals', () => {
  it('charges rate per tester times tester count', () => {
    expect(jobTotalZar(100, 10)).toBe(1000);
    expect(jobTotalZar(220, 3)).toBe(660);
    expect(jobTotalZar(90, 5)).toBe(450);
  });

  it('never produces a negative total', () => {
    expect(jobTotalZar(-100, 5)).toBe(0);
    expect(jobTotalZar(100, 0)).toBe(0);
  });
});

describe('test type configuration', () => {
  it('keeps every rate and tester count positive', () => {
    for (const testType of TEST_TYPES) {
      expect(testType.ratePerTesterZar).toBeGreaterThan(0);
      expect(testType.minTesters).toBeGreaterThan(0);
      expect(testType.estimatedMinutes).toBeGreaterThan(0);
    }
  });

  it('never defaults below its own minimum tester count', () => {
    for (const testType of TEST_TYPES) {
      expect(testType.defaultTesters).toBeGreaterThanOrEqual(testType.minTesters);
    }
  });

  it('uses unique keys', () => {
    const keys = TEST_TYPES.map((testType) => testType.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('falls back to a real test type for an unknown key', () => {
    const fallback = getTestTypeByKey('not-a-real-test-type');
    expect(TEST_TYPES).toContain(fallback);
  });

  it('resolves each known key to itself', () => {
    for (const testType of TEST_TYPES) {
      expect(getTestTypeByKey(testType.key).key).toBe(testType.key);
    }
  });
});
