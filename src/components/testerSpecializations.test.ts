import { describe, expect, it } from 'vitest';
// Loaded as text so the assertions below read the real migration rather than a
// copy of it. `?raw` is declared by vite/client, already in tsconfig types.
import migrationSql from '../../supabase/phase47_verified_specializations.sql?raw';
import {
  SPECIALIZATION_GROUPS,
  TEST_TYPE_SPECIALIZATION_REQUIREMENTS,
  getSpecializationIds,
  getSpecializationLabel,
  hasSaLanguageTag,
  requiredSpecializationsForJob,
  requiresVerification,
} from './testerSpecializations';
import { TEST_TYPES } from '../lib/testTypes';

/**
 * Reads the (package_key, specialization_key) pairs actually seeded into
 * test_type_specialization_requirements.
 *
 * The database is what refuses an application, so the client mirror in
 * TEST_TYPE_SPECIALIZATION_REQUIREMENTS is only useful while the two agree.
 * Same guard pricing.test.ts puts on the payout formula.
 */
function seededRequirements(): Record<string, string[]> {
  const insertStart = migrationSql.indexOf(
    'insert into public.test_type_specialization_requirements',
  );
  expect(insertStart, 'requirements seed not found in phase 47').toBeGreaterThan(-1);

  const insertEnd = migrationSql.indexOf('on conflict', insertStart);
  const values = migrationSql.slice(insertStart, insertEnd);

  const parsed: Record<string, string[]> = {};
  for (const match of values.matchAll(/\('([a-z0-9-]+)',\s*'([a-z0-9-]+)'\)/g)) {
    const [, packageKey, specializationKey] = match;
    (parsed[packageKey] ||= []).push(specializationKey);
  }
  return parsed;
}

describe('specialization catalogue', () => {
  it('uses unique ids across every group', () => {
    const ids = getSpecializationIds();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves every id to a human label', () => {
    for (const id of getSpecializationIds()) {
      expect(getSpecializationLabel(id)).not.toBe(id);
    }
  });

  it('falls back to the raw id for an unknown specialization', () => {
    expect(getSpecializationLabel('not-a-real-specialization')).toBe('not-a-real-specialization');
  });

  it('still recognises South African language tags', () => {
    expect(hasSaLanguageTag(['zulu'])).toBe(true);
    expect(hasSaLanguageTag(['english'])).toBe(false);
    expect(hasSaLanguageTag([])).toBe(false);
  });

  it('gives every verifiable specialization an evidence hint', () => {
    // A tester asked to prove something must be told what proof looks like.
    for (const group of SPECIALIZATION_GROUPS) {
      for (const option of group.options) {
        if (requiresVerification(option.id)) {
          expect(option.evidenceHint, `${option.id} needs an evidenceHint`).toBeTruthy();
        }
      }
    }
  });
});

describe('verification requirements mirror the database', () => {
  it('matches the rows seeded by phase 47 exactly', () => {
    const seeded = seededRequirements();

    expect(Object.keys(seeded).sort()).toEqual(
      Object.keys(TEST_TYPE_SPECIALIZATION_REQUIREMENTS).sort(),
    );

    for (const [packageKey, keys] of Object.entries(seeded)) {
      expect(
        [...(TEST_TYPE_SPECIALIZATION_REQUIREMENTS[packageKey] ?? [])].sort(),
        `client mirror drifted from SQL for ${packageKey}`,
      ).toEqual([...keys].sort());
    }
  });

  it('only requires specializations that exist in the catalogue', () => {
    const known = new Set(getSpecializationIds());
    for (const keys of Object.values(TEST_TYPE_SPECIALIZATION_REQUIREMENTS)) {
      for (const key of keys) {
        expect(known.has(key), `${key} is required but not offered to testers`).toBe(true);
      }
    }
  });

  it('only gates real test types', () => {
    const testTypeKeys = new Set(TEST_TYPES.map((testType) => testType.key));
    for (const packageKey of Object.keys(TEST_TYPE_SPECIALIZATION_REQUIREMENTS)) {
      expect(testTypeKeys.has(packageKey as never), `${packageKey} is not a test type`).toBe(true);
    }
  });

  it('leaves the general-audience test types open', () => {
    // Bug hunting, onboarding and usability are sold as "ordinary South
    // Africans on their own phones". Gating them would break the product.
    for (const packageKey of ['bug-hunting', 'onboarding', 'usability']) {
      expect(requiredSpecializationsForJob(packageKey)).toEqual([]);
    }
  });

  it('never treats English alone as localization capability', () => {
    expect(TEST_TYPE_SPECIALIZATION_REQUIREMENTS.localization).not.toContain('english');
  });

  it('gates all three premium test types', () => {
    for (const packageKey of ['localization', 'low-data', 'accessibility']) {
      expect(requiredSpecializationsForJob(packageKey).length).toBeGreaterThan(0);
    }
  });
});

describe('requiredSpecializationsForJob', () => {
  it('narrows to the developer stated preference when it overlaps', () => {
    expect(requiredSpecializationsForJob('localization', ['zulu'])).toEqual(['zulu']);
    expect(requiredSpecializationsForJob('localization', ['zulu', 'xhosa'])).toEqual([
      'zulu',
      'xhosa',
    ]);
  });

  it('falls back to the full set when preferences do not overlap', () => {
    // A developer asking only for "Samsung A-series" has said nothing about
    // language, so any verified SA language should still satisfy the job.
    expect(requiredSpecializationsForJob('localization', ['samsung-a-series'])).toEqual(
      TEST_TYPE_SPECIALIZATION_REQUIREMENTS.localization,
    );
    expect(requiredSpecializationsForJob('localization', [])).toEqual(
      TEST_TYPE_SPECIALIZATION_REQUIREMENTS.localization,
    );
  });

  it('returns nothing for an unknown package key', () => {
    expect(requiredSpecializationsForJob('not-a-package')).toEqual([]);
  });
});
