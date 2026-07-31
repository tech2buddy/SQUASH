import { describe, expect, it } from 'vitest';
import phase12Sql from '../../supabase/phase12_tester_growth_notifications_referrals.sql?raw';
import phase53Sql from '../../supabase/phase53_tester_referrals.sql?raw';

/**
 * Referrals span two migrations: phase 12 owns the table, the `referral_status`
 * enum and per-tester codes; phase 53 adds the parts that were missing, which is
 * why the page had nothing real to show.
 *
 * An earlier draft of phase 53 created its own table in ignorance of phase 12's
 * and aborted on apply. The first assertion here exists to stop that recurring.
 */
describe('phase 53 builds on phase 12 rather than duplicating it', () => {
  it('does not create a second referrals table', () => {
    expect(phase12Sql).toMatch(/create table if not exists public\.tester_referrals/);
    expect(phase53Sql).not.toMatch(/create table[^;]*public\.tester_referrals/);
  });

  it('uses phase 12 column names', () => {
    // referred_email / reward_amount_zar / approved_work_at are phase 12's.
    // The earlier draft invented invited_email / reward_zar / qualified_at.
    expect(phase53Sql).toContain('referred_email');
    expect(phase53Sql).not.toContain('invited_email');
    expect(phase53Sql).not.toMatch(/\breward_zar\b/);
  });

  it('reuses phase 12 code generation instead of inventing its own', () => {
    expect(phase53Sql).toContain('ensure_tester_referral_code(auth.uid())');
    expect(phase53Sql).not.toContain('gen_random_bytes');
  });

  it('casts to the referral_status enum rather than treating it as text', () => {
    expect(phase12Sql).toContain('create type public.referral_status as enum');
    expect(phase53Sql).toContain("'signed_up'::public.referral_status");
    expect(phase53Sql).toContain("'reward_ready'::public.referral_status");
  });
});

describe('referral integrity', () => {
  it('credits the referral from the new account, not the referrer', () => {
    // If a referrer could name an arbitrary user, referral fraud is a form
    // submission. The claim runs as the signed-up account.
    const claimFn = phase53Sql.slice(
      phase53Sql.indexOf('function public.claim_tester_referral'),
      phase53Sql.indexOf('function public.advance_referral_on_approval'),
    );
    expect(claimFn).toContain('referred_user_id = auth.uid()');
  });

  it('refuses self-referral', () => {
    expect(phase53Sql).toMatch(/v_referrer is null or v_referrer = auth\.uid\(\)/);
  });

  it('does not let a second referrer re-claim an account', () => {
    expect(phase53Sql).toMatch(
      /if exists \(select 1 from public\.tester_referrals where referred_user_id = auth\.uid\(\)\)/,
    );
  });

  it('caps invites so the form is not a spam cannon', () => {
    expect(phase53Sql).toContain("created_at > now() - interval '24 hours'");
    expect(phase53Sql).toMatch(/v_recent >= 20/);
  });

  it('rewards delivered work rather than signups', () => {
    // reward_ready is reached from an approved submission, not from signup --
    // otherwise the incentive is to harvest accounts.
    const trigger = phase53Sql.slice(phase53Sql.indexOf('function public.advance_referral_on_approval'));
    expect(trigger).toContain("new.status = 'approved'::public.submission_status");
    expect(trigger).toContain("status = 'reward_ready'::public.referral_status");
  });

  it('leaves the reward amount for a human to decide', () => {
    // A migration is the wrong place to invent what a referral is worth, and
    // nothing here may move money.
    expect(phase53Sql).not.toMatch(/update\s+public\.payouts/i);
    expect(phase53Sql).not.toMatch(/reward_amount_zar\s*=\s*\d/);
  });

  it('keeps referral status writes away from testers', () => {
    expect(phase12Sql).toContain(
      'for update using (public.is_admin()) with check (public.is_admin())',
    );
  });
});
