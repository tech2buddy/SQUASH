# Graph Report - SQUASH  (2026-07-26)

## Corpus Check
- 133 files · ~341,833 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 798 nodes · 1400 edges · 70 communities (56 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7383f5d0`
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

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 82 edges
2. `compilerOptions` - 16 edges
3. `SquashAdminDashboardPage()` - 15 edges
4. `SquashAdminPayoutsPage()` - 15 edges
5. `SquashAdminSecurityPage()` - 14 edges
6. `getDeveloperJobs()` - 12 edges
7. `formatSupabaseError()` - 11 edges
8. `getDeveloperSubmittedReports()` - 11 edges
9. `getTesterEarningsSummary()` - 11 edges
10. `createNotification()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `SquashResetPasswordPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashResetPasswordPage.tsx → src/auth.tsx
- `SquashSignupPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashSignupPage.tsx → src/auth.tsx
- `SquashUtilityPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashUtilityPage.tsx → src/auth.tsx
- `ProtectedRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/auth.tsx
- `LogoutRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/auth.tsx

## Import Cycles
- None detected.

## Communities (70 total, 14 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.05
Nodes (78): TableName, useSupabaseRealtime(), sendTransactionalEmail(), TransactionalEmailRequest, applyToJob(), BugReportDetail, createDeveloperJob(), DeveloperApplication (+70 more)

### Community 1 - "auth.tsx"
Cohesion: 0.24
Nodes (10): AuthContext, AuthContextValue, AuthProvider(), AuthResult, AuthSession, normalizeRoles(), ProfileRow, readAccountRoles() (+2 more)

### Community 2 - "testLab.tsx"
Cohesion: 0.06
Nodes (20): ActiveTest, canEmbedPreview(), DeviceMetadata, IssueFrequency, IssueReport, IssueReportForm(), IssueSeverity, NoteType (+12 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (27): lucide-react, dependencies, lucide-react, react, react-dom, react-icons, react-router-dom, resend (+19 more)

### Community 4 - "PublicFooter.tsx"
Cohesion: 0.13
Nodes (9): UserRole, IconItem, SquashAboutPage(), Setup, ItemWithIcon, isOnboardingRole(), SquashOnboardingPage(), TrustItem (+1 more)

### Community 5 - "schema.sql"
Cohesion: 0.16
Nodes (26): bug_reports_set_updated_at, developer_profiles_set_updated_at, job_applications_set_updated_at, jobs_set_updated_at, payout_methods_set_updated_at, payouts_set_updated_at, profiles_set_updated_at, public.bug_reports (+18 more)

### Community 6 - "SquashScore.tsx"
Cohesion: 0.50
Nodes (4): getRetestPrice(), Plan, RetestRequestModal(), RetestSubmission

### Community 7 - "adminApi.ts"
Cohesion: 0.06
Nodes (61): AdminActivityLog, AdminJobRow, AdminOverview, AdminPayoutRow, AdminPolicyRow, AdminReportRow, AdminUserDetail, AdminUserRow (+53 more)

### Community 8 - "notificationApi.ts"
Cohesion: 0.05
Nodes (35): addMonths(), isCertificationExpired(), SquashCertified(), clampScore(), getMeaning(), getOverallScore(), ScoreMeaning, SquashScore() (+27 more)

### Community 9 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, ES2023, src, vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+13 more)

### Community 10 - "SquashTesterLeaderboardPage.tsx"
Cohesion: 0.29
Nodes (14): DeveloperHeaderNav(), formatRelativeTime(), formatRelativeTime(), TesterHeaderNav(), AppNotification, backfillDeveloperNotifications(), backfilledDevelopers, getUnreadNotificationCount() (+6 more)

### Community 11 - "App.tsx"
Cohesion: 0.39
Nodes (8): AssignmentWithLab, formatDate(), LabTab, parseTasks(), readLabState(), SquashTesterMyTestsPage(), statusClass(), statusLabel()

### Community 12 - "SQUASH Platform: System Architecture & Dashboard Workflow Documentation"
Cohesion: 0.05
Nodes (39): 1.1 Core Platform Purpose, 1.2 Technology Stack, 1.3 Role & Access Control Model, 1. System Overview & Architecture, 2. End-to-End System Workflow Architecture, 3.1 Overview, 3.2 Key Pages & Navigation, 3.3 Detailed Developer Workflows (+31 more)

### Community 15 - "SquashDeveloperBillingPage.tsx"
Cohesion: 0.33
Nodes (8): DeveloperJobPayment, getDeveloperJobPayments(), formatDate(), formatRands(), jobStatusLabel(), paymentStatusClasses(), paymentStatusLabel(), SquashDeveloperBillingPage()

### Community 17 - "SquashOnboardingPage.tsx"
Cohesion: 0.06
Nodes (42): FeaturedTesterCard(), DEVELOPER_TABS, MobileTabBar(), Tab, TESTER_TABS, SpecializationChecklist(), getTesterTier(), TesterBadge() (+34 more)

### Community 21 - "SquashAdminPayoutsPage.tsx"
Cohesion: 0.12
Nodes (29): AdminPayoutBatch, getAdminPayoutBatches(), mapPayoutBatch(), prepareFridayPayoutBatch(), updatePayoutBatchStatus(), AdminBankingSubmission, BankAccountType, BankingRow (+21 more)

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
Cohesion: 0.18
Nodes (11): LogoutRoute(), isSafeInternalPath(), useAuth(), SquashAdminLoginPage(), SquashNotFoundPage(), SquashPrivateAdminAccessPage(), SquashTesterProfilePage(), defaultSettings (+3 more)

### Community 45 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+19 more)

### Community 46 - "supportApi.ts"
Cohesion: 0.21
Nodes (19): createModerationCase(), createOperationalIncident(), createSupportTicket(), getAdminSupportTickets(), getMySupportTickets(), getOperationalReadiness(), mapTicket(), ModerationCase (+11 more)

### Community 47 - "resolvePostLoginPath"
Cohesion: 0.24
Nodes (10): ProtectedRoute(), routeBelongsToRole(), defaultSessionPath(), resolvePostLoginPath(), roleHomePath(), routeRole(), WorkspaceRole, SquashAuthCallbackPage() (+2 more)

### Community 48 - "SquashTesterReportsPage.tsx"
Cohesion: 0.36
Nodes (7): TesterReportSubmission, emptyReports, formatDate(), formatRands(), ReportStatus, SquashTesterReportsPage(), toReportStatus()

### Community 49 - "testCategories.tsx"
Cohesion: 0.38
Nodes (6): getCategoryById(), getCategoryByName(), TODO: Replace with Supabase query, TEST_CATEGORIES, TestCategory, TestCategoryId

### Community 50 - "testLabApi.ts"
Cohesion: 0.38
Nodes (4): getOrCreateTestLabSession(), getTesterTestLabSessions(), mapSession(), TestLabSession

### Community 51 - "payment-webhook.ts"
Cohesion: 0.53
Nodes (5): config, handler(), headerValue(), rawRequestBody(), verifySignature()

### Community 52 - "SQUASH security deployment checklist"
Cohesion: 0.33
Nodes (5): Current automated verification, External control still required, Required before the next production deployment, Security testing before public launch, SQUASH security deployment checklist

### Community 53 - "SquashAdminJobDetailPage.tsx"
Cohesion: 0.60
Nodes (5): getAdminJobDetail(), formatDate(), formatRand(), SquashAdminJobDetailPage(), statusClass()

### Community 54 - "SquashUtilityPage.tsx"
Cohesion: 0.33
Nodes (5): roleNav, SquashUtilityPage(), SquashUtilityPageProps, UtilityAction, utilityIcons

### Community 56 - "phase23_payout_batches.sql"
Cohesion: 0.33
Nodes (3): payout_batches_set_updated_at, public.payout_batches, public.payouts

### Community 57 - "phase24_operational_readiness.sql"
Cohesion: 0.47
Nodes (3): public.create_support_ticket(), public.support_ticket_messages, public.support_tickets

### Community 59 - "SquashSignupPage.tsx"
Cohesion: 0.60
Nodes (3): GitHubIcon(), GoogleIcon(), SquashSignupPage()

### Community 60 - "SquashTesterLevelBenefitsPage.tsx"
Cohesion: 0.50
Nodes (4): nextTierCopy(), SquashTesterLevelBenefitsPage(), TierCard, tierCards

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
- **229 isolated node(s):** `Setup`, `Required before the next production deployment`, `External control still required`, `Security testing before public launch`, `Current automated verification` (+224 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `SquashTesterProfilePage.tsx` to `useAuth`, `auth.tsx`, `PublicFooter.tsx`, `adminApi.ts`, `notificationApi.ts`, `SquashTesterLeaderboardPage.tsx`, `App.tsx`, `supportApi.ts`, `resolvePostLoginPath`, `SquashDeveloperBillingPage.tsx`, `SquashOnboardingPage.tsx`, `SquashTesterReportsPage.tsx`, `SquashAdminJobDetailPage.tsx`, `SquashAdminPayoutsPage.tsx`, `SquashUtilityPage.tsx`, `SquashSignupPage.tsx`, `SquashTesterLevelBenefitsPage.tsx`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `uploadBugReportFile()` connect `testLab.tsx` to `useAuth`, `SquashAdminPayoutsPage.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `Setup`, `Required before the next production deployment`, `External control still required` to the rest of the system?**
  _229 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.05112279025322503 - nodes in this community are weakly interconnected._
- **Should `testLab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05668016194331984 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `PublicFooter.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12631578947368421 - nodes in this community are weakly interconnected._