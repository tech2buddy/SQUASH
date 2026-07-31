# Graph Report - SQUASH  (2026-07-29)

## Corpus Check
- 201 files · ~397,234 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1082 nodes · 1450 edges · 141 communities (104 shown, 37 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- useAuth
- auth.tsx
- testLab.tsx
- package.json
- PublicFooter.tsx
- schema.sql
- SquashScore.tsx
- storageApi.ts
- notificationApi.ts
- compilerOptions
- SquashTesterLeaderboardPage.tsx
- SquashTesterMyTestsPage.tsx
- SQUASH Platform: System Architecture & Dashboard Workflow Documentation
- rules/graphify.md
- workflows/graphify.md
- SquashDeveloperBillingPage.tsx
- SquashTesterDashboardPage.tsx
- SquashOnboardingPage.tsx
- SquashDeveloperBillingPage.tsx
- SquashAdminPayoutsPage.tsx
- SquashTesterNotificationsPage.tsx
- phase15_user_settings.sql
- send-email.ts
- vercel.json
- phase13_test_lab_workflows.sql
- phase12_tester_growth_notifications_referrals.sql
- phase2_auth.sql
- phase6_admin_payout_audit.sql
- phase8_policy_center.sql
- phase7_admin_user_controls.sql
- phase9_job_logos.sql
- TesterLayout.tsx
- SquashTesterProfilePage.tsx
- devDependencies
- supportApi.ts
- resolvePostLoginPath
- SquashScore.tsx
- testCategories.tsx
- testLabApi.ts
- payment-webhook.ts
- SQUASH security deployment checklist
- SquashAdminJobDetailPage.tsx
- SquashUtilityPage.tsx
- phase20_payments_operations.sql
- phase23_payout_batches.sql
- phase24_operational_readiness.sql
- SquashSignupPage.tsx
- SquashTesterLevelBenefitsPage.tsx
- phase26_payment_operations_hardening.sql
- create-checkout.ts
- phase18_realtime.sql
- phase22_developer_payments.sql
- DeveloperLayout.tsx
- phase21_weekly_eft_controls.sql
- paymentApi.ts
- useSupabaseRealtime.ts
- eslint-plugin-react-refresh
- @tailwindcss/vite
- @types/node
- @types/react-dom
- typescript
- phase35_test_type_pricing.sql
- phase35b_backfill_legacy_package_keys.sql
- usePageMeta
- jobApi.ts
- SquashDeveloperSettingsPage.tsx
- SquashTesterSettingsPage.tsx
- SquashAdminReportsPage.tsx
- scan-upload.ts
- TrustedLogosRow.tsx
- phase38_file_scanning.sql
- SquashAdminUserProfilePage.tsx
- package.json
- SquashDeveloperJobDetailPage.tsx
- SquashTesterJobBoard.tsx
- supabase.ts
- SquashDeveloperDashboard.tsx
- SquashOnboardingPage.tsx
- eslint-plugin-react-hooks
- SquashTesterJobDetailPage.tsx
- SquashAdminPayoutsPage.tsx
- SquashSignupPage.tsx
- phase40_structured_test_results.sql
- bankingApi.ts
- eslint-plugin-react-refresh
- @tailwindcss/vite
- @types/node
- SquashPricingPage.tsx
- SquashAboutPage.tsx
- SquashForDevelopersPage.tsx
- SquashForTestersPage.tsx
- @types/react-dom
- SquashOnboardingPage.tsx
- phase42_tester_qualification_sample_test.sql
- phase44_tester_qualification_gate_notifications.sql
- phase45_tester_qualification_quality_rubric.sql

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 23 edges
2. `SQUASH Supabase Backend Notes` - 20 edges
3. `compilerOptions` - 16 edges
4. `formatSupabaseError()` - 14 edges
5. `SquashAdminSecurityPage()` - 12 edges
6. `mapJob()` - 11 edges
7. `SQUASH — System Handoff` - 11 edges
8. `SquashTesterDashboardPage()` - 11 edges
9. `SquashAdminPayoutsPage()` - 11 edges
10. `public.set_updated_at()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `SquashTesterJobBoard()` --calls--> `getTesterQualificationStatus()`  [EXTRACTED]
  src/SquashTesterJobBoard.tsx → src/lib/testerQualificationApi.ts
- `SquashTesterJobDetailPage()` --calls--> `getTesterQualificationStatus()`  [EXTRACTED]
  src/SquashTesterJobDetailPage.tsx → src/lib/testerQualificationApi.ts
- `SquashResetPasswordPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashResetPasswordPage.tsx → src/auth.tsx
- `DeveloperHeaderNav()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/DeveloperHeaderNav.tsx → src/auth.tsx
- `SquashAdminOperationsPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminOperationsPage.tsx → src/auth.tsx

## Import Cycles
- None detected.

## Communities (141 total, 37 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.05
Nodes (45): NavItem, authHeaders(), beginTesterQualification(), getQualificationQuiz(), getQualificationSample(), getTesterQualificationProfile(), getTesterQualificationStatus(), QualificationAttempt (+37 more)

### Community 1 - "auth.tsx"
Cohesion: 0.09
Nodes (22): Next phase, Phase 1 setup, Phase 2 auth setup, Phase 34: Platform commission pricing, Phase 35: Test-type-based pricing, Phase 35b: Backfill legacy package_key values, Phase 36: Notification and privacy preferences actually do something, Phase 37: service_role table grants for the payment/email serverless functions (+14 more)

### Community 2 - "testLab.tsx"
Cohesion: 0.06
Nodes (16): ActiveTest, canEmbedPreview(), DeviceMetadata, IssueFrequency, IssueReport, IssueSeverity, NoteType, ProductPreview() (+8 more)

### Community 3 - "package.json"
Cohesion: 0.13
Nodes (15): lucide-react, dependencies, lucide-react, react, react-dom, react-icons, react-router, resend (+7 more)

### Community 4 - "PublicFooter.tsx"
Cohesion: 0.24
Nodes (5): allowedAttachmentTypes, DeveloperJobAttachment, uploadDeveloperJobAttachments(), InfectedFileError, scanUploadedFile()

### Community 5 - "schema.sql"
Cohesion: 0.16
Nodes (26): bug_reports_set_updated_at, developer_profiles_set_updated_at, job_applications_set_updated_at, jobs_set_updated_at, payout_methods_set_updated_at, payouts_set_updated_at, profiles_set_updated_at, public.bug_reports (+18 more)

### Community 6 - "SquashScore.tsx"
Cohesion: 0.50
Nodes (4): getRetestPrice(), Plan, RetestRequestModal(), RetestSubmission

### Community 7 - "storageApi.ts"
Cohesion: 0.22
Nodes (5): IssueReportForm(), TesterJobEvidence, uploadBugReportFile(), UploadFileType, UploadResult

### Community 8 - "notificationApi.ts"
Cohesion: 0.06
Nodes (49): AuthContext, AuthContextValue, AuthProvider(), AuthResult, AuthSession, clearStoredWorkspace(), defaultSessionPath(), isSafeInternalPath() (+41 more)

### Community 9 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, ES2023, src, vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+13 more)

### Community 10 - "SquashTesterLeaderboardPage.tsx"
Cohesion: 0.06
Nodes (55): AdminActivityLog, AdminOverview, AdminPayoutBatch, AdminPayoutRow, AdminPolicyRow, AdminReportRow, AdminUserDetail, AdminUserRow (+47 more)

### Community 11 - "SquashTesterMyTestsPage.tsx"
Cohesion: 0.39
Nodes (8): AssignmentWithLab, formatDate(), LabTab, parseTasks(), readLabState(), SquashTesterMyTestsPage(), statusClass(), statusLabel()

### Community 12 - "SQUASH Platform: System Architecture & Dashboard Workflow Documentation"
Cohesion: 0.05
Nodes (39): 1.1 Core Platform Purpose, 1.2 Technology Stack, 1.3 Role & Access Control Model, 1. System Overview & Architecture, 2. End-to-End System Workflow Architecture, 3.1 Overview, 3.2 Key Pages & Navigation, 3.3 Detailed Developer Workflows (+31 more)

### Community 15 - "SquashDeveloperBillingPage.tsx"
Cohesion: 0.14
Nodes (6): footerLinks, PublicPage, CertificateRecord, CERTIFICATES, TODO: Replace with Supabase query, SquashCertificatePage()

### Community 17 - "SquashOnboardingPage.tsx"
Cohesion: 0.29
Nodes (7): SpecializationChecklist(), getSpecializationIds(), getSpecializationLabel(), TODO: Replace with Supabase query, SPECIALIZATION_GROUPS, SpecializationGroup, SpecializationOption

### Community 18 - "SquashDeveloperBillingPage.tsx"
Cohesion: 0.43
Nodes (7): formatDate(), formatRands(), jobStatusLabel(), paymentStatusClasses(), paymentStatusLabel(), RedirectBanner, SquashDeveloperBillingPage()

### Community 22 - "SquashTesterNotificationsPage.tsx"
Cohesion: 0.53
Nodes (5): FilterType, formatRelativeTime(), SquashTesterNotificationsPage(), typeIcon(), typeTone()

### Community 23 - "phase15_user_settings.sql"
Cohesion: 0.67
Nodes (3): public.user_settings, update_user_settings_updated_at(), user_settings_updated_at

### Community 24 - "send-email.ts"
Cohesion: 0.53
Nodes (5): EmailRequest, escapeHtml(), handler(), isUuid(), parseRequest()

### Community 26 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, headers, outputDirectory, rewrites, $schema

### Community 27 - "phase13_test_lab_workflows.sql"
Cohesion: 0.67
Nodes (3): public.jobs, public.test_lab_sessions, test_lab_sessions_set_updated_at

### Community 43 - "TesterLayout.tsx"
Cohesion: 0.13
Nodes (16): DeveloperHeaderNav(), formatRelativeTime(), NavItem, DEVELOPER_TABS, MobileTabBar(), Tab, TESTER_TABS, Props (+8 more)

### Community 44 - "SquashTesterProfilePage.tsx"
Cohesion: 0.40
Nodes (5): BankingForm, BankingView, emptyForm, SquashTesterBankingPage(), verificationMessage()

### Community 45 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, @eslint/js, devDependencies, eslint, @eslint/js, tailwindcss, @types/react, typescript (+9 more)

### Community 46 - "supportApi.ts"
Cohesion: 0.17
Nodes (22): createModerationCase(), createOperationalIncident(), createSupportTicket(), getAdminSupportTickets(), getMySupportTickets(), getOperationalReadiness(), mapTicket(), ModerationCase (+14 more)

### Community 47 - "resolvePostLoginPath"
Cohesion: 0.60
Nodes (4): bug_reports_link_submission, public.link_bug_report_to_submission(), public.link_submission_bug_reports(), submissions_link_bug_reports

### Community 48 - "SquashScore.tsx"
Cohesion: 0.48
Nodes (6): clampScore(), getMeaning(), getOverallScore(), ScoreMeaning, SquashScore(), SquashScoreBreakdown

### Community 49 - "testCategories.tsx"
Cohesion: 0.38
Nodes (6): getCategoryById(), getCategoryByName(), TODO: Replace with Supabase query, TEST_CATEGORIES, TestCategory, TestCategoryId

### Community 50 - "testLabApi.ts"
Cohesion: 0.50
Nodes (4): getTesterTier(), TesterBadge(), TesterTier, TesterTierMeta

### Community 51 - "payment-webhook.ts"
Cohesion: 0.53
Nodes (5): config, handler(), headerValue(), rawRequestBody(), verifySignature()

### Community 52 - "SQUASH security deployment checklist"
Cohesion: 0.33
Nodes (5): Current automated verification, Required before the next production deployment, Security testing before public launch, SQUASH security deployment checklist, Upload malware scanning

### Community 56 - "phase23_payout_batches.sql"
Cohesion: 0.33
Nodes (3): payout_batches_set_updated_at, public.payout_batches, public.payouts

### Community 57 - "phase24_operational_readiness.sql"
Cohesion: 0.47
Nodes (3): public.create_support_ticket(), public.support_ticket_messages, public.support_tickets

### Community 62 - "create-checkout.ts"
Cohesion: 0.83
Nodes (3): appUrl(), bearerToken(), handler()

### Community 63 - "phase18_realtime.sql"
Cohesion: 0.50
Nodes (3): bug_reports, jobs, test_assignments

### Community 64 - "phase22_developer_payments.sql"
Cohesion: 0.67
Nodes (3): job_payments_set_updated_at, public.job_payments, public.payment_webhook_events

### Community 65 - "DeveloperLayout.tsx"
Cohesion: 0.27
Nodes (12): AdminQualificationReview, getAdminQualificationReviews(), getQualificationEvidenceUrl(), QualificationReviewDecision, QualificationReviewRubric, QualificationTaskOutcome, reviewTesterQualification(), defaultRubric (+4 more)

### Community 80 - "eslint-plugin-react-refresh"
Cohesion: 0.22
Nodes (10): public.guard_tester_qualification_fields(), public.is_tester_qualified(), public.tester_profiles, public.tester_qualification_attempts, public.tester_qualification_consents, public.tester_qualification_rollout, public.tester_qualification_variants, tester_profiles_guard_qualification_fields (+2 more)

### Community 81 - "@tailwindcss/vite"
Cohesion: 0.70
Nodes (4): formatDate(), formatRand(), SquashAdminJobDetailPage(), statusClass()

### Community 82 - "@types/node"
Cohesion: 0.25
Nodes (8): scripts, build, check, dev, lint, preview, test, typecheck

### Community 83 - "@types/react-dom"
Cohesion: 0.83
Nodes (3): addMonths(), isCertificationExpired(), SquashCertified()

### Community 84 - "typescript"
Cohesion: 0.83
Nodes (3): formatDate(), SquashAdminReportDetailPage(), statusTone()

### Community 90 - "usePageMeta"
Cohesion: 0.60
Nodes (4): setLinkTag(), setMetaTag(), usePageMeta(), SquashApiDocsPage()

### Community 91 - "jobApi.ts"
Cohesion: 0.11
Nodes (17): 10. Conventions, 1. What SQUASH is, 2. Stack, 3. Roles and routing, 4. Test types and pricing, 5. Money flow — read this carefully, 6. Database, 7. Serverless functions (`/api`) (+9 more)

### Community 92 - "SquashDeveloperSettingsPage.tsx"
Cohesion: 0.07
Nodes (41): getTesterBankingDetails(), TesterAssignment, TesterEarningsSummary, DeveloperProfileSettings, getDeveloperProfile(), getTesterProfile(), getTesterReferrals(), getTesterSpecializations() (+33 more)

### Community 93 - "SquashTesterSettingsPage.tsx"
Cohesion: 0.48
Nodes (4): jobTotalZar(), platformCommissionZar(), IMPORTANT: testerPayoutForJob() must stay numerically identical to the, testerPayoutForJob()

### Community 94 - "SquashAdminReportsPage.tsx"
Cohesion: 0.83
Nodes (3): formatDate(), SquashAdminReportsPage(), statusClass()

### Community 96 - "scan-upload.ts"
Cohesion: 0.60
Nodes (5): bearerToken(), FAIL_CLOSED_BUCKETS, handler(), recordScan(), SCANNABLE_BUCKETS

### Community 101 - "SquashAdminUserProfilePage.tsx"
Cohesion: 0.83
Nodes (3): formatDate(), SquashAdminUserProfilePage(), statusClass()

### Community 103 - "package.json"
Cohesion: 0.29
Nodes (6): engines, node, name, private, type, version

### Community 104 - "SquashDeveloperJobDetailPage.tsx"
Cohesion: 0.47
Nodes (5): formatBytes(), JobActivity, paymentBadge(), PaymentState, SquashDeveloperJobDetailPage()

### Community 105 - "SquashTesterJobBoard.tsx"
Cohesion: 0.05
Nodes (66): applyToJob(), attachEvidenceToBugReport(), BugReportDetail, createDeveloperJob(), DeveloperApplication, DeveloperAttachment, DeveloperDashboardSummary, DeveloperJob (+58 more)

### Community 106 - "supabase.ts"
Cohesion: 0.11
Nodes (15): captureSessionEnvironment(), DIFFICULTY_RATINGS, DifficultyRating, EMOTION_RATINGS, EmotionRating, getOrCreateTestLabSession(), getTaskResultsForAssignment(), getTesterTestLabSessions() (+7 more)

### Community 107 - "SquashDeveloperDashboard.tsx"
Cohesion: 0.21
Nodes (11): AppNotification, backfillDeveloperNotifications(), backfilledDevelopers, createNotification(), getUnreadNotificationCount(), getUserNotifications(), NotificationPreferenceKey, NotificationType (+3 more)

### Community 108 - "SquashOnboardingPage.tsx"
Cohesion: 0.24
Nodes (9): bearerToken(), handler(), isText(), outcomes, reproducibilities, SampleScenario, SampleTask, scenarios (+1 more)

### Community 110 - "SquashTesterJobDetailPage.tsx"
Cohesion: 0.38
Nodes (8): AdminProbationTester, getAdminProbationTesters(), ProbationDecision, ProbationStatus, reviewTesterProbation(), daysRemaining(), formatDate(), SquashAdminProbationPage()

### Community 115 - "SquashAdminPayoutsPage.tsx"
Cohesion: 0.47
Nodes (5): bearerToken(), handler(), publicQuestion(), QuizQuestion, quizzes

### Community 116 - "SquashSignupPage.tsx"
Cohesion: 0.47
Nodes (4): public.is_tester_qualified(), public.sync_tester_probation_status(), public.tester_profiles, tester_profiles_sync_qualification_probation

### Community 118 - "bankingApi.ts"
Cohesion: 0.24
Nodes (9): AdminBankingSubmission, BankAccountType, BankingRow, BankingVerificationStatus, getAdminBankingQueue(), mapBankingDetails(), reviewTesterBanking(), saveTesterBankingDetails() (+1 more)

## Knowledge Gaps
- **327 isolated node(s):** `QuizQuestion`, `quizzes`, `SampleTask`, `SampleScenario`, `scenarios` (+322 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `notificationApi.ts` to `TesterLayout.tsx`, `SquashDeveloperSettingsPage.tsx`, `supportApi.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `scanUploadedFile()` connect `PublicFooter.tsx` to `bankingApi.ts`, `storageApi.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `uploadBugReportFile()` connect `storageApi.ts` to `testLab.tsx`, `PublicFooter.tsx`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `QuizQuestion`, `quizzes`, `SampleTask` to the rest of the system?**
  _327 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.05427547363031234 - nodes in this community are weakly interconnected._
- **Should `auth.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `testLab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._