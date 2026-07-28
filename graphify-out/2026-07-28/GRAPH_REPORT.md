# Graph Report - SQUASH  (2026-07-28)

## Corpus Check
- 164 files · ~361,713 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 948 nodes · 1300 edges · 114 communities (87 shown, 27 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3d62075a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- SquashPrivateAdminMagicPage.tsx
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
- SquashPostJobPage.tsx
- SquashTesterJobBoard.tsx
- SquashDeveloperJobDetailPage.tsx
- SquashTesterJobBoard.tsx
- supabase.ts
- SquashDeveloperDashboard.tsx
- SquashOnboardingPage.tsx
- SquashReportDetailsPage.tsx
- SquashTesterJobDetailPage.tsx

## God Nodes (most connected - your core abstractions)
1. `SquashAdminDashboardPage()` - 16 edges
2. `compilerOptions` - 16 edges
3. `useAuth()` - 15 edges
4. `formatSupabaseError()` - 14 edges
5. `SQUASH Supabase Backend Notes` - 13 edges
6. `usePageMeta()` - 13 edges
7. `SquashAdminSecurityPage()` - 12 edges
8. `mapJob()` - 11 edges
9. `SQUASH — System Handoff` - 11 edges
10. `SquashTesterDashboardPage()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `SquashAdminDashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminDashboardPage.tsx → src/auth.tsx
- `SquashAdminJobsPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminJobsPage.tsx → src/auth.tsx
- `SquashAdminOperationsPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminOperationsPage.tsx → src/auth.tsx
- `SquashUtilityPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashUtilityPage.tsx → src/auth.tsx
- `SquashTesterDashboardPage()` --calls--> `getTesterAssignments()`  [EXTRACTED]
  src/SquashTesterDashboardPage.tsx → src/lib/jobApi.ts

## Import Cycles
- None detected.

## Communities (114 total, 27 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.06
Nodes (67): AdminActivityLog, AdminJobRow, AdminOverview, AdminPayoutBatch, AdminPayoutRow, AdminPolicyRow, AdminReportRow, AdminUserDetail (+59 more)

### Community 1 - "auth.tsx"
Cohesion: 0.12
Nodes (15): Next phase, Phase 1 setup, Phase 2 auth setup, Phase 34: Platform commission pricing, Phase 35: Test-type-based pricing, Phase 35b: Backfill legacy package_key values, Phase 36: Notification and privacy preferences actually do something, Phase 37: service_role table grants for the payment/email serverless functions (+7 more)

### Community 2 - "testLab.tsx"
Cohesion: 0.06
Nodes (16): ActiveTest, canEmbedPreview(), DeviceMetadata, IssueFrequency, IssueReport, IssueSeverity, NoteType, ProductPreview() (+8 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (29): lucide-react, dependencies, lucide-react, react, react-dom, react-icons, react-router, resend (+21 more)

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
Cohesion: 0.17
Nodes (19): AuthContext, AuthContextValue, AuthProvider(), AuthResult, AuthSession, clearStoredWorkspace(), defaultSessionPath(), isSafeInternalPath() (+11 more)

### Community 9 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, ES2023, src, vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+13 more)

### Community 10 - "SquashTesterLeaderboardPage.tsx"
Cohesion: 0.09
Nodes (25): AppNotification, backfillDeveloperNotifications(), backfilledDevelopers, createNotification(), getUnreadNotificationCount(), getUserNotifications(), NotificationPreferenceKey, NotificationType (+17 more)

### Community 11 - "SquashTesterMyTestsPage.tsx"
Cohesion: 0.39
Nodes (8): AssignmentWithLab, formatDate(), LabTab, parseTasks(), readLabState(), SquashTesterMyTestsPage(), statusClass(), statusLabel()

### Community 12 - "SQUASH Platform: System Architecture & Dashboard Workflow Documentation"
Cohesion: 0.05
Nodes (39): 1.1 Core Platform Purpose, 1.2 Technology Stack, 1.3 Role & Access Control Model, 1. System Overview & Architecture, 2. End-to-End System Workflow Architecture, 3.1 Overview, 3.2 Key Pages & Navigation, 3.3 Detailed Developer Workflows (+31 more)

### Community 15 - "SquashDeveloperBillingPage.tsx"
Cohesion: 0.12
Nodes (3): footerLinks, PublicPage, categories

### Community 17 - "SquashOnboardingPage.tsx"
Cohesion: 0.19
Nodes (13): FeaturedTesterCard(), SpecializationChecklist(), getTesterTier(), TesterBadge(), TesterTier, TesterTierMeta, getSpecializationIds(), getSpecializationLabel() (+5 more)

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
Cohesion: 0.10
Nodes (19): DeveloperHeaderNav(), formatRelativeTime(), NavItem, DEVELOPER_TABS, MobileTabBar(), Tab, TESTER_TABS, formatRelativeTime() (+11 more)

### Community 44 - "SquashTesterProfilePage.tsx"
Cohesion: 0.40
Nodes (5): BankingForm, BankingView, emptyForm, SquashTesterBankingPage(), verificationMessage()

### Community 45 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+19 more)

### Community 46 - "supportApi.ts"
Cohesion: 0.23
Nodes (17): createModerationCase(), createOperationalIncident(), createSupportTicket(), getAdminSupportTickets(), getMySupportTickets(), getOperationalReadiness(), mapTicket(), ModerationCase (+9 more)

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
Cohesion: 0.23
Nodes (10): AdminBankingSubmission, BankAccountType, BankingRow, BankingVerificationStatus, getAdminBankingQueue(), getTesterBankingDetails(), mapBankingDetails(), reviewTesterBanking() (+2 more)

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

### Community 59 - "SquashSignupPage.tsx"
Cohesion: 0.43
Nodes (6): emptyReports, formatDate(), formatRands(), ReportStatus, SquashTesterReportsPage(), toReportStatus()

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
Cohesion: 0.33
Nodes (4): DEFAULT_TYPE_CONFIG, fallbackTasks, TESTING_TYPE_CONFIG, TestingTypeConfig

### Community 72 - "SquashPrivateAdminMagicPage.tsx"
Cohesion: 0.10
Nodes (8): SquashDeveloperActivityPage(), SquashDeveloperApplicationsPage(), SquashDeveloperJobsPage(), SquashDeveloperReportsPage(), SquashDeveloperSubmissionsPage(), SquashReportAttachmentsPage(), SquashNotFoundPage(), SquashPrivateAdminMagicPage()

### Community 80 - "eslint-plugin-react-refresh"
Cohesion: 0.53
Nodes (5): EvidenceLinks, formatDate(), SquashTesterReportDetailPage(), statusLabel(), statusStyles()

### Community 81 - "@tailwindcss/vite"
Cohesion: 0.70
Nodes (4): formatDate(), formatRand(), SquashAdminJobDetailPage(), statusClass()

### Community 82 - "@types/node"
Cohesion: 0.50
Nodes (4): CertificateRecord, CERTIFICATES, TODO: Replace with Supabase query, SquashCertificatePage()

### Community 83 - "@types/react-dom"
Cohesion: 0.83
Nodes (3): addMonths(), isCertificationExpired(), SquashCertified()

### Community 84 - "typescript"
Cohesion: 0.83
Nodes (3): formatDate(), SquashAdminReportDetailPage(), statusTone()

### Community 90 - "usePageMeta"
Cohesion: 0.19
Nodes (12): setLinkTag(), setMetaTag(), usePageMeta(), IconItem, SquashAboutPage(), SquashApiDocsPage(), ItemWithIcon, SquashForDevelopersPage() (+4 more)

### Community 91 - "jobApi.ts"
Cohesion: 0.11
Nodes (17): 10. Conventions, 1. What SQUASH is, 2. Stack, 3. Roles and routing, 4. Test types and pricing, 5. Money flow — read this carefully, 6. Database, 7. Serverless functions (`/api`) (+9 more)

### Community 92 - "SquashDeveloperSettingsPage.tsx"
Cohesion: 0.06
Nodes (47): useAuth(), UserRole, getTesterEarningsSummary(), TesterAssignment, DeveloperProfileSettings, getDeveloperProfile(), getTesterProfile(), getTesterReferrals() (+39 more)

### Community 93 - "SquashTesterSettingsPage.tsx"
Cohesion: 0.29
Nodes (5): jobTotalZar(), platformCommissionZar(), IMPORTANT: testerPayoutForJob() must stay numerically identical to the, testerPayoutForJob(), ItemWithIcon

### Community 94 - "SquashAdminReportsPage.tsx"
Cohesion: 0.83
Nodes (3): formatDate(), SquashAdminReportsPage(), statusClass()

### Community 96 - "scan-upload.ts"
Cohesion: 0.70
Nodes (4): bearerToken(), handler(), recordScan(), SCANNABLE_BUCKETS

### Community 101 - "SquashAdminUserProfilePage.tsx"
Cohesion: 0.83
Nodes (3): formatDate(), SquashAdminUserProfilePage(), statusClass()

### Community 102 - "SquashPostJobPage.tsx"
Cohesion: 0.67
Nodes (3): defaultTestTasks, getErrorMessage(), SquashPostJobPage()

### Community 104 - "SquashDeveloperJobDetailPage.tsx"
Cohesion: 0.47
Nodes (5): formatBytes(), JobActivity, paymentBadge(), PaymentState, SquashDeveloperJobDetailPage()

### Community 105 - "SquashTesterJobBoard.tsx"
Cohesion: 0.07
Nodes (46): applyToJob(), attachEvidenceToBugReport(), BugReportDetail, createDeveloperJob(), DeveloperApplication, DeveloperAttachment, DeveloperDashboardSummary, DeveloperJob (+38 more)

### Community 106 - "supabase.ts"
Cohesion: 0.14
Nodes (11): DIFFICULTY_RATINGS, DifficultyRating, EMOTION_RATINGS, EmotionRating, getOrCreateTestLabSession(), getTesterTestLabSessions(), getTestLabTaskResults(), mapSession() (+3 more)

## Knowledge Gaps
- **291 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+286 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `SquashDeveloperSettingsPage.tsx` to `notificationApi.ts`, `useAuth`, `supportApi.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `scanUploadedFile()` connect `PublicFooter.tsx` to `testLabApi.ts`, `storageApi.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `uploadBugReportFile()` connect `storageApi.ts` to `testLab.tsx`, `PublicFooter.tsx`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _291 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.05727605727605728 - nodes in this community are weakly interconnected._
- **Should `auth.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `testLab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._