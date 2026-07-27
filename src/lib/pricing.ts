// Money math for SQUASH jobs and tester payouts.
//
// Deliberately dependency-free (no Supabase client, no I/O) so it can be
// imported anywhere -- including public marketing pages -- and unit tested
// without mocking.
//
// IMPORTANT: testerPayoutForJob() must stay numerically identical to the
// payout formula enforced in supabase/phase34_commission_pricing.sql:
//
//   floor(total_amount_zar * 0.62 / testers_needed)
//
// request_tester_payout() in that migration is the authoritative source of
// what a tester can actually withdraw. If these two ever disagree, testers
// see one number and get paid another -- which is exactly the bug that
// existed before phase 34/35 (dashboard showed R200, payout approved R125).

export const TESTER_POOL_SHARE = 0.62;
export const PLATFORM_COMMISSION_SHARE = 1 - TESTER_POOL_SHARE;

/** What a single tester earns for one approved submission on this job. */
export function testerPayoutForJob(totalAmountZar: number, testersNeeded: number): number {
  if (!testersNeeded) return 0;
  return Math.floor((totalAmountZar * TESTER_POOL_SHARE) / testersNeeded);
}

/** What the developer pays for a job: rate per tester x number of testers. */
export function jobTotalZar(ratePerTesterZar: number, testersNeeded: number): number {
  return Math.max(0, ratePerTesterZar * testersNeeded);
}

/** SQUASH's gross commission on a job, before payment processing fees. */
export function platformCommissionZar(totalAmountZar: number, testersNeeded: number): number {
  return totalAmountZar - testerPayoutForJob(totalAmountZar, testersNeeded) * testersNeeded;
}
