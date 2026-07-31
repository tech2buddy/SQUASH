import { describe, expect, it } from 'vitest';
import revocationSql from '../../supabase/phase51_specialization_revocation.sql?raw';
import challengeSql from '../../supabase/phase52_verification_challenges.sql?raw';
import { isSpecializationActive, usesChallenge, type TesterSpecialization } from './specializationApi';
import { TEST_TYPE_SPECIALIZATION_REQUIREMENTS } from '../components/testerSpecializations';

function specialization(overrides: Partial<TesterSpecialization> = {}): TesterSpecialization {
  return {
    id: 'spec-1',
    testerId: 'tester-1',
    key: 'zulu',
    status: 'approved',
    note: null,
    evidencePath: 'tester-1/zulu/evidence.mp4',
    evidenceName: 'evidence.mp4',
    submittedAt: '2026-07-01T09:00:00Z',
    verifiedAt: '2026-07-02T09:00:00Z',
    expiresAt: null,
    revokedReason: null,
    challengeExpiresAt: null,
    ...overrides,
  };
}

const hour = 60 * 60 * 1000;

describe('isSpecializationActive', () => {
  it('accepts an approved verification with no expiry', () => {
    expect(isSpecializationActive(specialization())).toBe(true);
  });

  it('accepts an approved verification that has not lapsed yet', () => {
    expect(
      isSpecializationActive(specialization({ expiresAt: new Date(Date.now() + hour).toISOString() })),
    ).toBe(true);
  });

  it('rejects an approved verification that has lapsed', () => {
    // The database gate applies the same predicate. If this drifted, the UI
    // would promise a tester access the trigger then refuses.
    expect(
      isSpecializationActive(specialization({ expiresAt: new Date(Date.now() - hour).toISOString() })),
    ).toBe(false);
  });

  it('rejects every non-approved state', () => {
    for (const status of ['declared', 'pending', 'rejected', 'revoked'] as const) {
      expect(isSpecializationActive(specialization({ status }))).toBe(false);
    }
  });

  it('rejects a revoked verification even when it has not expired', () => {
    expect(
      isSpecializationActive(
        specialization({ status: 'revoked', expiresAt: new Date(Date.now() + hour).toISOString() }),
      ),
    ).toBe(false);
  });
});

describe('challenge coverage', () => {
  it('challenges every language that satisfies localization', () => {
    // A language provable by an uploaded-at-leisure recording is the weak spot
    // phase 52 exists to close, so the two lists must not drift apart.
    for (const key of TEST_TYPE_SPECIALIZATION_REQUIREMENTS.localization) {
      expect(usesChallenge(key), `${key} should require a live challenge`).toBe(true);
    }
  });

  it('does not challenge network or assistive-technology claims', () => {
    for (const key of [
      ...TEST_TYPE_SPECIALIZATION_REQUIREMENTS['low-data'],
      ...TEST_TYPE_SPECIALIZATION_REQUIREMENTS.accessibility,
    ]) {
      expect(usesChallenge(key)).toBe(false);
    }
  });

  it('seeds a prompt pool for every challenged language', () => {
    const seeded = challengeSql.slice(
      challengeSql.indexOf('insert into public.specialization_challenge_prompts'),
    );
    for (const key of TEST_TYPE_SPECIALIZATION_REQUIREMENTS.localization) {
      expect(seeded, `no prompts seeded for ${key}`).toContain(`('${key}')`);
    }
  });

  it('keeps the prompt pool unreadable by testers', () => {
    // If a tester could list the prompts they could pre-record all of them and
    // the just-in-time property is gone.
    expect(challengeSql).toContain('for all using (public.is_admin()) with check (public.is_admin())');
  });
});

describe('revocation migration', () => {
  it('requires a written reason', () => {
    expect(revocationSql).toMatch(/char_length\(v_reason\), 0\) < 20/);
  });

  it('never moves money as a side effect', () => {
    // Revocation reports affected submissions; it must not update payouts,
    // balances or submission statuses. A financial reversal has to be its own
    // audited decision.
    const revokeFn = revocationSql.slice(
      revocationSql.indexOf('function public.revoke_tester_specialization'),
      revocationSql.indexOf('function public.get_expiring_specializations'),
    );
    expect(revokeFn).not.toMatch(/update\s+public\.payouts/i);
    expect(revokeFn).not.toMatch(/update\s+public\.test_submissions/i);
    expect(revokeFn).not.toMatch(/available_balance_zar/i);
  });

  it('makes the application gate honour expiry', () => {
    expect(revocationSql).toMatch(/ts\.expires_at is null or ts\.expires_at > now\(\)/);
  });

  it('stops counting expired verifications as available capacity', () => {
    const capacityFn = revocationSql.slice(
      revocationSql.indexOf('function public.get_test_type_capacity'),
    );
    expect(capacityFn).toMatch(/expires_at is null or ts\.expires_at > now\(\)/);
  });
});
