import { describe, expect, it } from 'vitest';
import referralsSql from '../../supabase/phase53_tester_referrals.sql?raw';

/**
 * The referrals feature shipped for months as mock data behind a literal "TODO"
 * subtitle. These assertions pin the properties that make the replacement real
 * rather than decorative.
 */
describe('referral migration', () => {
  it('credits the referral from the new account, not the referrer', () => {
    // If a referrer could claim an arbitrary user, referral fraud is a form
    // submission. The claim function is called by the signed-up account and
    // keys off auth.uid().
    const claimFn = referralsSql.slice(
      referralsSql.indexOf('function public.claim_tester_referral'),
      referralsSql.indexOf('function public.advance_referral_on_approval'),
    );
    expect(claimFn).toContain('referred_user_id = auth.uid()');
  });

  it('refuses self-referral', () => {
    expect(referralsSql).toMatch(/v_referrer is null or v_referrer = auth\.uid\(\)/);
  });

  it('does not let a second referrer re-claim an account', () => {
    expect(referralsSql).toMatch(
      /if exists \(select 1 from public\.tester_referrals where referred_user_id = auth\.uid\(\)\)/,
    );
  });

  it('rate limits invites so the form is not a spam cannon', () => {
    expect(referralsSql).toContain("invited_at > now() - interval '24 hours'");
    expect(referralsSql).toMatch(/v_recent >= 20/);
  });

  it('rewards delivered work rather than signups', () => {
    // reward_ready is reached from an approved submission, not from signup --
    // otherwise the incentive is to harvest accounts.
    const trigger = referralsSql.slice(
      referralsSql.indexOf('function public.advance_referral_on_approval'),
    );
    expect(trigger).toContain("new.status = 'approved'");
    expect(trigger).toContain("status = 'reward_ready'");
  });

  it('leaves the reward amount unset for a human to decide', () => {
    // A migration is the wrong place to invent what a referral is worth.
    expect(referralsSql).not.toMatch(/reward_zar\s+integer[^;]*default\s+[1-9]/);
  });

  it('never lets a tester write their own referral status', () => {
    expect(referralsSql).toContain('for all using (public.is_admin()) with check (public.is_admin())');
    // Only select is granted directly; every mutation goes through an RPC.
    expect(referralsSql).toContain('grant select on public.tester_referrals to authenticated');
    expect(referralsSql).not.toMatch(/grant insert[^;]*on public\.tester_referrals to authenticated/);
  });

  it('issues a referral code unrelated to the user id', () => {
    // The page used to slice the tester's uuid into a "code" and paste it into
    // a public link.
    expect(referralsSql).toContain('gen_random_bytes');
    expect(referralsSql).toContain('referral_code text unique');
  });
});
