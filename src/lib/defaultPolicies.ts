export const DEFAULT_POLICIES: Record<string, { title: string; version: string; updatedAt: string; content: string }> = {
  terms: {
    title: 'Terms of Service',
    version: 'v1.2',
    updatedAt: '2026-07-01T00:00:00Z',
    content: `Welcome to SQUASH ("Platform", "we", "us", or "our"), operated in South Africa. By creating an account or accessing our services at squashqa.co.za, you ("User", "Developer", or "Tester") agree to be bound by these Terms of Service.

1. PLATFORM OVERVIEW
SQUASH is a software quality assurance marketplace connecting application developers ("Developers") with independent quality assurance testers ("Testers") to perform real-device testing, bug identification, and user experience feedback.

2. ELIGIBILITY AND ACCOUNT SECURITY
- You must be at least 18 years old (or legal age of majority in your jurisdiction) to use SQUASH.
- You are responsible for maintaining the security of your account credentials. Any action performed through your account is deemed authorized by you.
- SQUASH reserves the right to suspend or terminate accounts that provide fraudulent information or violate these terms.

3. INDEPENDENT CONTRACTOR STATUS
Testers use SQUASH as independent contractors and are not employees, partners, or agents of SQUASH or Developers. Testers are solely responsible for reporting and paying any applicable taxes on earnings.

4. INTELLECTUAL PROPERTY & CONFIDENTIALITY
- All application binaries, source code, designs, and pre-release materials provided by Developers remain the exclusive intellectual property of the Developer.
- Testers strictly agree not to copy, reverse-engineer, decompile, distribute, or disclose any Developer application or test data to third parties.
- Testers grant Developers full ownership of all bug reports, logs, and feedback submitted through SQUASH.

5. PAYMENT AND FEES
- Developers agree to fund job budgets prior to publishing test jobs.
- Payouts to Testers are disbursed upon Developer approval or automatic admin sign-off according to our Payout Policy.
- Platform service fees are non-refundable once testing activity has commenced.

6. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, SQUASH AND ITS OFFICERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, LOSS OF DATA, REVENUE, OR APP STORE DELAYS ARISING OUT OF YOUR USE OF THE PLATFORM. OUR TOTAL LIABILITY SHALL NOT EXCEED THE TOTAL FEES PAID BY YOU IN THE 3 MONTHS PRECEDING THE CLAIM.

7. INDEMNIFICATION
You agree to indemnify and hold harmless SQUASH, its founders, and affiliates from any claims, losses, or legal fees resulting from your breach of these Terms or unauthorized use of third-party software.

8. GOVERNING LAW
These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa. Any legal disputes shall be subject to the jurisdiction of the courts of South Africa.`,
  },
  privacy: {
    title: 'Privacy Policy',
    version: 'v1.2',
    updatedAt: '2026-07-01T00:00:00Z',
    content: `SQUASH ("we", "us") is committed to protecting your privacy and personal information in accordance with the Protection of Personal Information Act (POPIA) of South Africa and international data protection laws.

1. INFORMATION WE COLLECT
- Account Data: Name, email address, phone number, role (Developer/Tester), and password hash.
- Profile & Device Data: Tester device specifications (OS, device model, language, screen size), geographic location, and specializations.
- Financial Data: Banking details, payout account numbers, and billing transactions processed securely via authorized payment gateways.
- Platform Usage: IP addresses, access logs, cookies, and activity logs.

2. HOW WE USE YOUR INFORMATION
- To operate and maintain the SQUASH marketplace.
- To match Developers with relevant Testers based on device specifications and demographics.
- To process payouts, prevent fraud, and verify identity.
- To send transactional notifications (job invites, report updates, account alerts).

3. DATA SHARING & PROTECTION
- We do not sell or rent your personal data to third parties.
- Tester names and device details are shared with Developers solely for verifying test report authenticity.
- We utilize industry-standard TLS encryption, strict database row-level security (RLS), and secure cloud infrastructure.

4. YOUR RIGHTS
You have the right to request access to your personal data, request correction of inaccurate data, or request account deletion by emailing support@squashqa.co.za.`,
  },
  'popia-data-protection': {
    title: 'POPIA Data Protection Policy',
    version: 'v1.1',
    updatedAt: '2026-07-01T00:00:00Z',
    content: `SQUASH complies fully with the Protection of Personal Information Act 4 of 2013 ("POPIA") of the Republic of South Africa.

1. RESPONSIBLE PARTY
SQUASH acts as the Responsible Party regarding the collection, storage, and processing of personal information provided by South African users.

2. CONDITIONS FOR LAWFUL PROCESSING
- Accountability: SQUASH ensures all processing complies with POPIA requirements.
- Processing Limitation: Personal information is collected lawfully, minimally, and directly from data subjects with consent.
- Purpose Specification: Information is collected strictly for platform operations, identity verification, QA job management, and legally required financial records.
- Further Processing Limitation: Information will not be processed for incompatible secondary purposes.
- Information Quality: We maintain accurate, updated user records.
- Openness: Users are notified of data collection practices via this policy and our Privacy Policy.
- Security Safeguards: Technical safeguards (data encryption, restricted access controls) protect against unauthorized access or data breach.
- Data Subject Participation: Users may request access, correction, or destruction of their personal data.

3. INFORMATION OFFICER CONTACT
For any POPIA inquiries or data requests, contact our Information Protection Team at support@squashqa.co.za.`,
  },
  'developer-terms': {
    title: 'Developer Terms of Service',
    version: 'v1.1',
    updatedAt: '2026-07-01T00:00:00Z',
    content: `These Developer Terms govern your use of SQUASH as a software developer, founder, or agency publishing test jobs.

1. JOB POSTING REQUIREMENTS
- Developers must provide clear test instructions, target device specifications, and valid app download links or web URLs.
- Applications submitted for testing must not contain malware, spyware, malicious code, or illegal content.

2. REPORT REVIEWS AND APPROVALS
- Developers agree to review submitted bug reports promptly within 72 hours of submission.
- Reports meeting the job criteria must be approved. If a report is rejected, the Developer must provide clear, constructive justification.
- Unreviewed reports automatically approve after 7 days to protect Tester payout timelines.

3. PAYMENT AND BUDGET ALLOCATION
- Job budgets must be fully funded prior to publishing jobs.
- All payments are handled securely in South African Rand (ZAR) or supported currencies.`,
  },
  'tester-code-of-conduct': {
    title: 'Tester Code of Conduct',
    version: 'v1.1',
    updatedAt: '2026-07-01T00:00:00Z',
    content: `SQUASH maintains strict quality standards to protect Developers and ensure Testers are rewarded fairly for genuine work.

1. HONEST REPORTING
- Testers must perform tests personally on real physical or specified web devices.
- Submitting fake, AI-generated, copied, or false bug reports is strictly prohibited and results in immediate permanent account termination and forfeiture of pending balance.

2. STRICT CONFIDENTIALITY (NDA)
- Testers must treat all pre-release applications, screenshots, and test instructions as strictly confidential.
- Publicly sharing, leaking, or posting Developer app details on social media or external sites is illegal and subject to civil prosecution.

3. PROFESSIONAL COMMUNICATION
- All communication with Developers and SQUASH support must remain professional, respectful, and constructive.`,
  },
  'payout-policy': {
    title: 'Payout Policy',
    version: 'v1.1',
    updatedAt: '2026-07-01T00:00:00Z',
    content: `This Payout Policy governs how independent Testers earn and disburse funds on SQUASH.

1. EARNING ELIGIBILITY
- Earnings are credited to a Tester's available balance upon Developer approval of a submitted test report.

2. PAYOUT DISBURSEMENT
- Payouts are processed in South African Rand (ZAR) via verified local bank EFT, PayFast, or supported payout channels.
- Payout requests are processed weekly after security verification.
- Minimum payout threshold is R50 ZAR.

3. ANTI-FRAUD VERIFICATION
- SQUASH reserves the right to hold payouts pending identity verification or investigation of flagged suspicious report activity.`,
  },
  'refund-policy': {
    title: 'Refund Policy',
    version: 'v1.1',
    updatedAt: '2026-07-01T00:00:00Z',
    content: `This policy outlines terms for Developer job budget refunds on SQUASH.

1. UNUSED JOB BUDGETS
- Developers may cancel a draft or active job at any time. Unspent job funds allocated to unfulfilled tester slots will be credited back to the Developer's account balance immediately.

2. COMPLETED TEST SLOTS
- Funds paid for approved test reports are non-refundable once approved by the Developer or automatically finalized by the system.

3. REFUND REQUESTS
- To request a withdrawal of unspent account balance back to your original payment method, contact support@squashqa.co.za. Requests are processed within 3-5 business days.`,
  },
  'dispute-resolution': {
    title: 'Dispute Resolution Policy',
    version: 'v1.1',
    updatedAt: '2026-07-01T00:00:00Z',
    content: `SQUASH provides a fair, impartial dispute resolution mechanism for Developers and Testers.

1. DISPUTE INITIATION
- If a Developer rejects a bug report that a Tester believes meets all job requirements, the Tester may open a Dispute within 48 hours.

2. EVIDENCE REVIEW
- SQUASH Quality Assurance administrators will inspect submitted screen recordings, device logs, job brief instructions, and chat history.

3. FINAL ARBITRATION
- SQUASH admin decisions regarding dispute resolution are final and binding to maintain platform integrity. If a dispute is resolved in favor of the Tester, funds are released from the job budget to the Tester. If resolved in favor of the Developer, the slot is restored or refunded.`,
  },
};
