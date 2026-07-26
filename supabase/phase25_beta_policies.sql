-- SQUASH Phase 25: beta policies aligned with the implemented payment and payout controls.
-- These operational drafts should still receive South African legal review before a broad public launch.

update public.policies
set status = 'archived', updated_at = now()
where slug in ('privacy', 'developer-terms', 'payout-policy', 'refund-policy', 'dispute-resolution')
  and status = 'published';

insert into public.policies (
  slug, title, content, status, version, effective_date, published_at
) values
(
  'payout-policy',
  'Tester Payout Policy',
  '1. Eligibility

Tester earnings become eligible for withdrawal only after the related work has been approved and any review period has ended. SQUASH may hold or reverse amounts connected to duplicate work, fraud, abuse, charge disputes, policy breaches or unresolved moderation cases.

2. Minimum request

The minimum tester payout request is R100. A tester cannot request more than the available approved balance shown in the account.

3. Verified banking details

Tester payouts are made by electronic funds transfer (EFT). Before requesting a payout, a tester must submit the account holder name, bank name, account number, account type and branch code, together with a current proof of banking or bank statement. The banking submission must be approved before it can be used for a payout.

The tester is responsible for submitting accurate banking details for an account they are authorised to use. SQUASH may request a replacement document or additional verification when details do not match, are incomplete, appear altered or present a safety risk.

4. Friday payout schedule

Approved payout requests are grouped into weekly Friday payout runs. A request made on a Friday or later may be scheduled for the following Friday. Public holidays, banking interruptions, compliance reviews or incorrect banking information may delay receipt.

5. Review and evidence

Every payout is reviewed by an administrator. SQUASH records the scheduled payout date, the banking details used for that request, the EFT reference and proof of payment. A payout is marked paid only after the EFT has been executed and proof has been recorded.

6. Failed or returned payments

If a payment is rejected or returned, SQUASH may ask the tester to correct and re-verify banking details before another payout attempt. Bank processing times are outside SQUASH control.

7. Questions and disputes

Testers can submit a tracked support request through the Help Center. Payout and payment requests receive an elevated operational priority.',
  'published',
  'v1.1',
  current_date,
  now()
),
(
  'privacy',
  'Privacy Policy',
  'SQUASH collects and uses personal information needed to operate accounts, testing jobs, support, safety reviews, payments and tester payouts.

For tester payouts, this may include account holder and banking details, proof of banking or a bank statement, payout records, payment references and verification notes. These records are restricted to the tester and authorised administrators, except where a service provider or legal obligation requires limited disclosure.

Developer payment information is handled through a third-party payment service. SQUASH stores the transaction identifiers, status and amount needed to activate jobs, provide support, reconcile payments and prevent fraud. SQUASH does not intentionally store full card numbers.

SQUASH applies access controls and keeps operational and financial evidence for legitimate business, accounting, dispute, safety and legal purposes. Users may contact SQUASH through the Help Center for privacy questions or requests. Some information cannot be deleted immediately where retention is required for security, financial records, disputes or law.',
  'published',
  'v1.1',
  current_date,
  now()
),
(
  'developer-terms',
  'Developer Terms',
  'Developers must provide lawful test access, clear instructions, safe URLs and accurate job information. Payment is required before a job becomes available to testers.

Payment is processed using an external payment service. A job is activated only after SQUASH receives verified confirmation of a successful payment. A checkout screen or browser return does not by itself prove that payment succeeded.

Developers must review tester submissions fairly and may not request unlawful, dangerous, deceptive or unrelated activity. Reviews, disputes and refunds are assessed using the job instructions, tester work completed, submitted evidence, communications and transaction records.',
  'published',
  'v1.1',
  current_date,
  now()
),
(
  'refund-policy',
  'Refund Policy',
  'Refund requests are reviewed individually against the job status, testing work already assigned or completed, submitted evidence, platform costs, transaction records and any suspected abuse.

Submitting a request does not guarantee a refund. Where a refund is approved, the destination and timing may depend on the original payment method and the external payment service. SQUASH will not refund amounts already earned for valid completed tester work unless required by law or the result of fraud or error.',
  'published',
  'v1.1',
  current_date,
  now()
),
(
  'dispute-resolution',
  'Dispute Resolution Policy',
  'SQUASH reviews disputes using the original job instructions, status history, tester submission evidence, communications, payment and payout records, and relevant moderation findings.

SQUASH may temporarily hold a job, account, payment decision or tester payout while preserving and reviewing evidence. The affected user may be asked for more information and will be given the outcome through the account or support process. Safety, privacy, suspected fraud and material payment mismatches are escalated for priority review.',
  'published',
  'v1.1',
  current_date,
  now()
)
on conflict (slug, version) do update set
  title = excluded.title,
  content = excluded.content,
  status = excluded.status,
  effective_date = excluded.effective_date,
  published_at = excluded.published_at,
  updated_at = now();
