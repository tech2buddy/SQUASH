import { describe, expect, it } from 'vitest';
import jobHardeningSql from '../../supabase/phase54_job_write_hardening.sql?raw';
import profileHardeningSql from '../../supabase/phase55_tester_profile_hardening.sql?raw';
import readMinimisationSql from '../../supabase/phase56_public_read_minimisation.sql?raw';
import jobApiSource from './jobApi.ts?raw';

/**
 * Regression tests for the findings in the security review.
 *
 * These assert against migration text rather than a live database, which is a
 * real limitation -- they prove the statement is present, not that Postgres
 * enforces it. They exist because each of these holes is invisible in normal
 * use and easy to reintroduce with one well-meaning `grant` in a later phase.
 */

describe('paywall bypass (phase 54)', () => {
  it('revokes the blanket UPDATE that made payment optional', () => {
    // With blanket UPDATE a developer could set status='active' from the
    // browser and take a job live having paid nothing.
    expect(jobHardeningSql).toContain('revoke update on public.jobs from authenticated');
  });

  it('never re-grants status or developer_id', () => {
    const grant = jobHardeningSql.slice(
      jobHardeningSql.indexOf('grant update ('),
      jobHardeningSql.indexOf(') on public.jobs to authenticated'),
    );
    expect(grant).not.toMatch(/\bstatus\b/);
    expect(grant).not.toMatch(/\bdeveloper_id\b/);
  });

  it('backs the grant with a trigger, so a later grant cannot silently reopen it', () => {
    expect(jobHardeningSql).toContain('guard_job_commercial_fields');
    expect(jobHardeningSql).toMatch(/new\.status is distinct from old\.status/);
  });

  it('refuses a job that is created already active', () => {
    expect(jobHardeningSql).toContain('guard_job_insert_status');
    expect(jobHardeningSql).toMatch(/new\.status is distinct from 'draft'::public\.job_status/);
  });

  it('locks the price once a payment exists, not merely once the job is live', () => {
    // Otherwise a developer opens checkout at R2 200, drops the total to R100
    // while the Yoco page is open, and relies on the amount already captured.
    expect(jobHardeningSql).toMatch(/job_payments[\s\S]{0,120}'creating', 'pending', 'succeeded'/);
  });

  it('still allows editing an unpaid draft', () => {
    // Blocking this would break the post-job form for no security benefit.
    expect(jobHardeningSql).toMatch(/old\.status is distinct from 'draft'::public\.job_status/);
  });

  it('stops the client naming status in a job update', () => {
    // Column privileges are checked against the columns named in the statement,
    // not against which values changed -- so sending an unchanged status would
    // fail the whole update.
    const updateFn = jobApiSource.slice(
      jobApiSource.indexOf('export async function updateDeveloperJob'),
      jobApiSource.indexOf('export async function createDeveloperJob'),
    );
    expect(updateFn).not.toMatch(/^\s*status:/m);
  });

  it('creates jobs as drafts unconditionally', () => {
    const createFn = jobApiSource.slice(jobApiSource.indexOf('export async function createDeveloperJob'));
    expect(createFn).toMatch(/status: 'draft'/);
    // The old `input.status || 'active'` default would have made a job live
    // without payment if a caller ever omitted the status.
    expect(createFn).not.toMatch(/status: input\.status \|\| 'active'/);
  });
});

describe('tester self-scoring (phase 55)', () => {
  it('revokes blanket UPDATE on tester_profiles', () => {
    expect(profileHardeningSql).toContain('revoke update on public.tester_profiles from authenticated');
  });

  it('leaves only genuinely self-owned fields writable', () => {
    const grant = profileHardeningSql.slice(
      profileHardeningSql.indexOf('grant update ('),
      profileHardeningSql.indexOf(') on public.tester_profiles to authenticated'),
    );
    for (const column of [
      'rating',
      'tests_completed',
      'approval_rate',
      'available_balance_zar',
      'verification_strikes',
      'premium_types_blocked_until',
    ]) {
      expect(grant, `${column} must not be writable by a tester`).not.toMatch(
        new RegExp(`\\b${column}\\b`),
      );
    }
  });

  it('blocks reputation forgery in the trigger too', () => {
    // rating/tests_completed/approval_rate are what a developer reads when
    // choosing testers, so forging them wins paid work.
    expect(profileHardeningSql).toMatch(/new\.rating is distinct from old\.rating/);
    expect(profileHardeningSql).toMatch(/new\.approval_rate is distinct from old\.approval_rate/);
  });

  it('stops a struck tester clearing their own ban', () => {
    // Without this, phase 51's revocation system is one UPDATE from decorative.
    expect(profileHardeningSql).toMatch(
      /new\.verification_strikes is distinct from old\.verification_strikes/,
    );
    expect(profileHardeningSql).toMatch(
      /new\.premium_types_blocked_until is distinct from old\.premium_types_blocked_until/,
    );
  });

  it('keeps the phase 46 qualification guard intact while extending it', () => {
    expect(profileHardeningSql).toMatch(/new\.qualification_status is distinct from old\.qualification_status/);
    expect(profileHardeningSql).toMatch(/new\.probation_status is distinct from old\.probation_status/);
  });

  it('pins account role against privilege escalation', () => {
    expect(profileHardeningSql).toMatch(/new\.role is distinct from old\.role/);
  });
});

describe('public read minimisation (phase 56)', () => {
  it('stops anon reading reviewer notes and evidence paths', () => {
    const grant = readMinimisationSql.slice(
      readMinimisationSql.indexOf('grant select ('),
      readMinimisationSql.indexOf(') on public.tester_specializations to anon'),
    );
    // revoked_reason is a mandatory 20+ character written accusation about a
    // named person. It was world-readable.
    for (const column of ['verification_note', 'revoked_reason', 'evidence_path', 'evidence_name']) {
      expect(grant, `${column} must not be readable by anon`).not.toMatch(
        new RegExp(`\\b${column}\\b`),
      );
    }
  });

  it('stops anon reading tester balances and payout preferences', () => {
    const grant = readMinimisationSql.slice(
      readMinimisationSql.indexOf('grant select (\n  user_id,\n  bio'),
      readMinimisationSql.indexOf(') on public.tester_profiles to anon'),
    );
    for (const column of [
      'available_balance_zar',
      'preferred_payout_method',
      'verification_strikes',
      'premium_types_blocked_until',
    ]) {
      expect(grant, `${column} must not be readable by anon`).not.toMatch(
        new RegExp(`\\b${column}\\b`),
      );
    }
  });

  it("stops anon enumerating customers' unreleased staging URLs", () => {
    const grant = readMinimisationSql.slice(
      readMinimisationSql.indexOf('grant select (\n  id,\n  title'),
      readMinimisationSql.indexOf(') on public.jobs to anon'),
    );
    for (const column of ['app_url', 'description', 'tasks', 'lab_config', 'test_restrictions']) {
      expect(grant, `${column} must not be readable by anon`).not.toMatch(
        new RegExp(`\\b${column}\\b`),
      );
    }
  });

  it('revokes the old blanket anon grants first', () => {
    for (const table of ['tester_specializations', 'tester_profiles', 'jobs']) {
      expect(readMinimisationSql).toContain(`revoke select on public.${table} from anon`);
    }
  });

  it('closes the one table that had no RLS', () => {
    expect(readMinimisationSql).toContain(
      'alter table public.tester_qualification_rollout enable row level security',
    );
  });
});
