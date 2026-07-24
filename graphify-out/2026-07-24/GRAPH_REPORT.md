# Graph Report - SQUASH  (2026-07-24)

## Corpus Check
- 104 files · ~328,111 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 653 nodes · 1143 edges · 43 communities (31 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `51d2880b`
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
- profileApi.ts
- App.tsx
- SQUASH Platform: System Architecture & Dashboard Workflow Documentation
- rules/graphify.md
- workflows/graphify.md
- SquashDeveloperBillingPage.tsx
- SquashTesterDashboardPage.tsx
- SquashOnboardingPage.tsx
- testerSpecializations.ts
- adminApi.ts
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

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 49 edges
2. `compilerOptions` - 16 edges
3. `SquashAdminDashboardPage()` - 15 edges
4. `formatSupabaseError()` - 11 edges
5. `getTesterProfile()` - 11 edges
6. `public.set_updated_at()` - 11 edges
7. `getDeveloperJobs()` - 10 edges
8. `getDeveloperSubmittedReports()` - 10 edges
9. `public.tester_profiles` - 10 edges
10. `mapJob()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `SquashDeveloperReportsPage()` --calls--> `getDeveloperSubmittedReports()`  [EXTRACTED]
  src/SquashDeveloperViewsPage.tsx → src/lib/jobApi.ts
- `SquashReportDetailsPage()` --calls--> `getDeveloperSubmittedReports()`  [EXTRACTED]
  src/SquashReportDetailsPage.tsx → src/lib/jobApi.ts
- `SquashTesterLeaderboardPage()` --calls--> `getTesterEarningsSummary()`  [EXTRACTED]
  src/SquashTesterLeaderboardPage.tsx → src/lib/jobApi.ts
- `SquashActiveTestScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashActiveTestScreen.tsx → src/auth.tsx
- `SquashAdminDashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminDashboardPage.tsx → src/auth.tsx

## Import Cycles
- None detected.

## Communities (43 total, 12 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.06
Nodes (60): getCategoryById(), getCategoryByName(), TODO: Replace with Supabase query, TEST_CATEGORIES, TestCategory, TestCategoryId, applyToJob(), BugReportDetail (+52 more)

### Community 1 - "auth.tsx"
Cohesion: 0.10
Nodes (32): AuthContext, AuthContextValue, AuthProvider(), AuthResult, AuthSession, defaultSessionPath(), isSafeInternalPath(), normalizeRoles() (+24 more)

### Community 2 - "testLab.tsx"
Cohesion: 0.06
Nodes (20): ActiveTest, canEmbedPreview(), DeviceMetadata, IssueFrequency, IssueReport, IssueReportForm(), IssueSeverity, NoteType (+12 more)

### Community 3 - "package.json"
Cohesion: 0.06
Nodes (32): lucide-react, dependencies, lucide-react, react, react-dom, react-icons, react-router-dom, resend (+24 more)

### Community 4 - "PublicFooter.tsx"
Cohesion: 0.06
Nodes (23): NavItem, sendEmail(), footerLinks, PublicPage, IconItem, SquashAboutPage(), checklist, emptyDraft() (+15 more)

### Community 5 - "schema.sql"
Cohesion: 0.16
Nodes (26): bug_reports_set_updated_at, developer_profiles_set_updated_at, job_applications_set_updated_at, jobs_set_updated_at, payout_methods_set_updated_at, payouts_set_updated_at, profiles_set_updated_at, public.bug_reports (+18 more)

### Community 6 - "SquashScore.tsx"
Cohesion: 0.12
Nodes (22): getRetestPrice(), Plan, RetestRequestModal(), RetestSubmission, addMonths(), isCertificationExpired(), SquashCertified(), clampScore() (+14 more)

### Community 7 - "adminApi.ts"
Cohesion: 0.05
Nodes (70): AdminActivityLog, AdminJobRow, AdminOverview, AdminPayoutRow, AdminPolicyRow, AdminReportRow, AdminUserDetail, AdminUserRow (+62 more)

### Community 8 - "notificationApi.ts"
Cohesion: 0.16
Nodes (23): DeveloperHeaderNav(), formatRelativeTime(), formatRelativeTime(), TesterHeaderNav(), AppNotification, backfillDeveloperNotifications(), createNotification(), getLocalNotifications() (+15 more)

### Community 9 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, ES2023, src, vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+13 more)

### Community 10 - "profileApi.ts"
Cohesion: 0.11
Nodes (24): DEVELOPER_TABS, MobileTabBar(), Tab, TESTER_TABS, getTesterTier(), TesterBadge(), TesterTier, TesterTierMeta (+16 more)

### Community 11 - "App.tsx"
Cohesion: 0.39
Nodes (8): AssignmentWithLab, formatDate(), LabTab, parseTasks(), readLabState(), SquashTesterMyTestsPage(), statusClass(), statusLabel()

### Community 12 - "SQUASH Platform: System Architecture & Dashboard Workflow Documentation"
Cohesion: 0.05
Nodes (39): 1.1 Core Platform Purpose, 1.2 Technology Stack, 1.3 Role & Access Control Model, 1. System Overview & Architecture, 2. End-to-End System Workflow Architecture, 3.1 Overview, 3.2 Key Pages & Navigation, 3.3 Detailed Developer Workflows (+31 more)

### Community 15 - "SquashDeveloperBillingPage.tsx"
Cohesion: 0.18
Nodes (14): ActivePayment, activePayments, EscrowStep, escrowSteps, formatDate(), formatRands(), history, HistoryItem (+6 more)

### Community 17 - "SquashOnboardingPage.tsx"
Cohesion: 0.07
Nodes (44): DeveloperProfileSettings, getDeveloperProfile(), getTesterProfile(), getTesterSpecializations(), getUserSettings(), TODO: Implement actual referrals table in Supabase, replaceTesterSpecializations(), TesterLeaderboardEntry (+36 more)

### Community 18 - "testerSpecializations.ts"
Cohesion: 0.29
Nodes (9): FeaturedTesterCard(), SpecializationChecklist(), getSpecializationIds(), getSpecializationLabel(), hasSaLanguageTag(), TODO: Replace with Supabase query, SPECIALIZATION_GROUPS, SpecializationGroup (+1 more)

### Community 22 - "SquashTesterNotificationsPage.tsx"
Cohesion: 0.53
Nodes (5): FilterType, formatRelativeTime(), SquashTesterNotificationsPage(), typeIcon(), typeTone()

### Community 23 - "phase15_user_settings.sql"
Cohesion: 0.67
Nodes (3): public.user_settings, update_user_settings_updated_at(), user_settings_updated_at

### Community 26 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, outputDirectory, rewrites, $schema

### Community 27 - "phase13_test_lab_workflows.sql"
Cohesion: 0.67
Nodes (3): public.jobs, public.test_lab_sessions, test_lab_sessions_set_updated_at

## Knowledge Gaps
- **195 isolated node(s):** `TestType`, `TaskStatus`, `WorkspaceTab`, `NoteType`, `IssueSeverity` (+190 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `auth.tsx` to `useAuth`, `SquashScore.tsx`, `adminApi.ts`, `notificationApi.ts`, `profileApi.ts`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `notificationApi.ts` to `useAuth`, `auth.tsx`, `adminApi.ts`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `supabase` connect `auth.tsx` to `notificationApi.ts`, `useAuth`, `adminApi.ts`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `TestType`, `TaskStatus`, `WorkspaceTab` to the rest of the system?**
  _195 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.06479113384484228 - nodes in this community are weakly interconnected._
- **Should `auth.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0975609756097561 - nodes in this community are weakly interconnected._
- **Should `testLab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05668016194331984 - nodes in this community are weakly interconnected._