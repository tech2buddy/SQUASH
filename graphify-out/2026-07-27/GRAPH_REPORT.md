# Graph Report - SQUASH  (2026-07-27)

## Corpus Check
- 152 files · ~351,729 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 874 nodes · 1532 edges · 90 communities (62 shown, 28 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7d8a7293`
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
- adminApi.ts
- notificationApi.ts
- compilerOptions
- SquashTesterLeaderboardPage.tsx
- App.tsx
- SQUASH Platform: System Architecture & Dashboard Workflow Documentation
- rules/graphify.md
- workflows/graphify.md
- SquashDeveloperBillingPage.tsx
- SquashTesterDashboardPage.tsx
- SquashOnboardingPage.tsx
- testerSpecializations.ts
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
- SquashTesterReportsPage.tsx
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

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 65 edges
2. `getTestTypeByKey()` - 18 edges
3. `SquashAdminDashboardPage()` - 16 edges
4. `compilerOptions` - 16 edges
5. `formatSupabaseError()` - 13 edges
6. `SquashAdminSecurityPage()` - 13 edges
7. `SQUASH Supabase Backend Notes` - 12 edges
8. `getDeveloperJobs()` - 12 edges
9. `createNotification()` - 12 edges
10. `isSupabaseConfigured` - 12 edges

## Surprising Connections (you probably didn't know these)
- `SquashSignupPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashSignupPage.tsx → src/auth.tsx
- `SquashResetPasswordPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashResetPasswordPage.tsx → src/auth.tsx
- `SquashUtilityPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashUtilityPage.tsx → src/auth.tsx
- `SquashAdminDashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminDashboardPage.tsx → src/auth.tsx
- `SquashAdminDashboardPage()` --calls--> `getAdminJobs()`  [EXTRACTED]
  src/SquashAdminDashboardPage.tsx → src/lib/adminApi.ts

## Import Cycles
- None detected.

## Communities (90 total, 28 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.05
Nodes (80): useAuth(), applyToJob(), BugReportDetail, createDeveloperJob(), DeveloperApplication, DeveloperAttachment, DeveloperDashboardSummary, DeveloperJob (+72 more)

### Community 1 - "auth.tsx"
Cohesion: 0.14
Nodes (13): Next phase, Phase 1 setup, Phase 2 auth setup, Phase 34: Platform commission pricing, Phase 35: Test-type-based pricing, Phase 35b: Backfill legacy package_key values, Phase 36: Notification and privacy preferences actually do something, Phase 37: service_role table grants for the payment/email serverless functions (+5 more)

### Community 2 - "testLab.tsx"
Cohesion: 0.05
Nodes (37): ActiveTest, canEmbedPreview(), DeviceMetadata, IssueFrequency, IssueReport, IssueReportForm(), IssueSeverity, NoteType (+29 more)

### Community 3 - "package.json"
Cohesion: 0.13
Nodes (15): lucide-react, dependencies, lucide-react, react, react-dom, react-icons, react-router-dom, resend (+7 more)

### Community 4 - "PublicFooter.tsx"
Cohesion: 0.25
Nodes (8): scripts, build, check, dev, lint, preview, test, typecheck

### Community 5 - "schema.sql"
Cohesion: 0.16
Nodes (26): bug_reports_set_updated_at, developer_profiles_set_updated_at, job_applications_set_updated_at, jobs_set_updated_at, payout_methods_set_updated_at, payouts_set_updated_at, profiles_set_updated_at, public.bug_reports (+18 more)

### Community 6 - "SquashScore.tsx"
Cohesion: 0.50
Nodes (4): getRetestPrice(), Plan, RetestRequestModal(), RetestSubmission

### Community 7 - "adminApi.ts"
Cohesion: 0.05
Nodes (74): AdminActivityLog, AdminOverview, AdminPayoutBatch, AdminPayoutRow, AdminPolicyRow, AdminReportRow, AdminUserDetail, AdminUserRow (+66 more)

### Community 8 - "notificationApi.ts"
Cohesion: 0.12
Nodes (24): DeveloperHeaderNav(), formatRelativeTime(), formatRelativeTime(), TesterHeaderNav(), AppNotification, backfillDeveloperNotifications(), backfilledDevelopers, getUnreadNotificationCount() (+16 more)

### Community 9 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, ES2023, src, vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+13 more)

### Community 10 - "SquashTesterLeaderboardPage.tsx"
Cohesion: 0.07
Nodes (39): AuthContext, AuthContextValue, AuthProvider(), AuthResult, AuthSession, defaultSessionPath(), isSafeInternalPath(), normalizeRoles() (+31 more)

### Community 11 - "App.tsx"
Cohesion: 0.20
Nodes (14): AdminJobRow, getAdminJobDetail(), getAdminJobs(), formatDate(), formatRand(), SquashAdminJobDetailPage(), statusClass(), formatDate() (+6 more)

### Community 12 - "SQUASH Platform: System Architecture & Dashboard Workflow Documentation"
Cohesion: 0.05
Nodes (39): 1.1 Core Platform Purpose, 1.2 Technology Stack, 1.3 Role & Access Control Model, 1. System Overview & Architecture, 2. End-to-End System Workflow Architecture, 3.1 Overview, 3.2 Key Pages & Navigation, 3.3 Detailed Developer Workflows (+31 more)

### Community 15 - "SquashDeveloperBillingPage.tsx"
Cohesion: 0.07
Nodes (20): addMonths(), isCertificationExpired(), SquashCertified(), clampScore(), getMeaning(), getOverallScore(), ScoreMeaning, SquashScore() (+12 more)

### Community 17 - "SquashOnboardingPage.tsx"
Cohesion: 0.10
Nodes (24): FeaturedTesterCard(), DEVELOPER_TABS, MobileTabBar(), Tab, TESTER_TABS, SpecializationChecklist(), getTesterTier(), TesterBadge() (+16 more)

### Community 18 - "testerSpecializations.ts"
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

### Community 44 - "SquashTesterProfilePage.tsx"
Cohesion: 0.40
Nodes (5): BankingForm, BankingView, emptyForm, SquashTesterBankingPage(), verificationMessage()

### Community 45 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, @eslint/js, eslint-plugin-react-hooks, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, tailwindcss (+9 more)

### Community 46 - "supportApi.ts"
Cohesion: 0.21
Nodes (19): createModerationCase(), createOperationalIncident(), createSupportTicket(), getAdminSupportTickets(), getMySupportTickets(), getOperationalReadiness(), mapTicket(), ModerationCase (+11 more)

### Community 47 - "resolvePostLoginPath"
Cohesion: 0.60
Nodes (4): bug_reports_link_submission, public.link_bug_report_to_submission(), public.link_submission_bug_reports(), submissions_link_bug_reports

### Community 48 - "SquashTesterReportsPage.tsx"
Cohesion: 0.06
Nodes (54): AdminBankingSubmission, BankAccountType, BankingRow, BankingVerificationStatus, getAdminBankingQueue(), getTesterBankingDetails(), mapBankingDetails(), reviewTesterBanking() (+46 more)

### Community 49 - "testCategories.tsx"
Cohesion: 0.38
Nodes (6): getCategoryById(), getCategoryByName(), TODO: Replace with Supabase query, TEST_CATEGORIES, TestCategory, TestCategoryId

### Community 51 - "payment-webhook.ts"
Cohesion: 0.53
Nodes (5): config, handler(), headerValue(), rawRequestBody(), verifySignature()

### Community 52 - "SQUASH security deployment checklist"
Cohesion: 0.33
Nodes (5): Current automated verification, External control still required, Required before the next production deployment, Security testing before public launch, SQUASH security deployment checklist

### Community 56 - "phase23_payout_batches.sql"
Cohesion: 0.33
Nodes (3): payout_batches_set_updated_at, public.payout_batches, public.payouts

### Community 57 - "phase24_operational_readiness.sql"
Cohesion: 0.47
Nodes (3): public.create_support_ticket(), public.support_ticket_messages, public.support_tickets

### Community 59 - "SquashSignupPage.tsx"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 62 - "create-checkout.ts"
Cohesion: 0.83
Nodes (3): appUrl(), bearerToken(), handler()

### Community 63 - "phase18_realtime.sql"
Cohesion: 0.50
Nodes (3): bug_reports, jobs, test_assignments

### Community 64 - "phase22_developer_payments.sql"
Cohesion: 0.67
Nodes (3): job_payments_set_updated_at, public.job_payments, public.payment_webhook_events

## Knowledge Gaps
- **247 isolated node(s):** `Security rules`, `Phase 1 setup`, `Phase 2 auth setup`, `Next phase`, `Phase 3: Multi-role accounts` (+242 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `adminApi.ts`, `notificationApi.ts`, `SquashTesterLeaderboardPage.tsx`, `App.tsx`, `supportApi.ts`, `SquashDeveloperBillingPage.tsx`, `SquashTesterReportsPage.tsx`, `SquashOnboardingPage.tsx`, `testerSpecializations.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `SquashTesterLeaderboardPage.tsx` to `useAuth`, `testLab.tsx`, `adminApi.ts`, `notificationApi.ts`, `SquashTesterReportsPage.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `supabase` connect `notificationApi.ts` to `useAuth`, `testLab.tsx`, `adminApi.ts`, `SquashTesterLeaderboardPage.tsx`, `SquashTesterReportsPage.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `Security rules`, `Phase 1 setup`, `Phase 2 auth setup` to the rest of the system?**
  _247 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.052525252525252523 - nodes in this community are weakly interconnected._
- **Should `auth.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `testLab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05323653962492438 - nodes in this community are weakly interconnected._