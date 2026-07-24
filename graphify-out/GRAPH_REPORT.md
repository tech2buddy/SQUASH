# Graph Report - SQUASH  (2026-07-24)

## Corpus Check
- 102 files · ~326,095 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 643 nodes · 1128 edges · 51 communities (40 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d5627f3`
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
- SquashAdminPayoutsPage.tsx
- supabase.ts
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
- SquashAdminJobsPage.tsx
- SquashAdminUserProfilePage.tsx
- SquashAdminJobDetailPage.tsx
- SquashAdminUsersPage.tsx
- SquashAdminReportsPage.tsx

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 49 edges
2. `compilerOptions` - 16 edges
3. `SquashAdminDashboardPage()` - 15 edges
4. `createNotification()` - 13 edges
5. `getTesterProfile()` - 11 edges
6. `formatSupabaseError()` - 11 edges
7. `public.set_updated_at()` - 11 edges
8. `public.tester_profiles` - 10 edges
9. `SQUASH Platform: System Architecture & Dashboard Workflow Documentation` - 9 edges
10. `mapJob()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `SquashActiveTestScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashActiveTestScreen.tsx → src/auth.tsx
- `SquashAdminDashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminDashboardPage.tsx → src/auth.tsx
- `SquashAdminDashboardPage()` --calls--> `getAdminJobs()`  [EXTRACTED]
  src/SquashAdminDashboardPage.tsx → src/lib/adminApi.ts
- `SquashAdminDashboardPage()` --calls--> `getAdminOverview()`  [EXTRACTED]
  src/SquashAdminDashboardPage.tsx → src/lib/adminApi.ts
- `SquashAdminDashboardPage()` --calls--> `getAdminPayoutQueue()`  [EXTRACTED]
  src/SquashAdminDashboardPage.tsx → src/lib/adminApi.ts

## Import Cycles
- None detected.

## Communities (51 total, 11 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.07
Nodes (56): getCategoryById(), getCategoryByName(), TODO: Replace with Supabase query, TEST_CATEGORIES, TestCategory, TestCategoryId, applyToJob(), BugReportDetail (+48 more)

### Community 1 - "auth.tsx"
Cohesion: 0.10
Nodes (32): AuthContext, AuthContextValue, AuthProvider(), AuthResult, AuthSession, defaultSessionPath(), isSafeInternalPath(), normalizeRoles() (+24 more)

### Community 2 - "testLab.tsx"
Cohesion: 0.06
Nodes (16): ActiveTest, canEmbedPreview(), DeviceMetadata, IssueFrequency, IssueReport, IssueSeverity, NoteType, ProductPreview() (+8 more)

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
Cohesion: 0.20
Nodes (14): AdminActivityLog, getAdminActivityLogs(), getRecentAdminUsers(), emptyOverview, formatDate(), formatRand(), JobFilter, jobStatusClass() (+6 more)

### Community 8 - "notificationApi.ts"
Cohesion: 0.30
Nodes (16): DeveloperHeaderNav(), formatRelativeTime(), formatRelativeTime(), TesterHeaderNav(), AppNotification, backfillDeveloperNotifications(), createNotification(), getLocalNotifications() (+8 more)

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

### Community 19 - "adminApi.ts"
Cohesion: 0.26
Nodes (11): AdminPolicyRow, getAdminPolicies(), isMissingTableError(), saveAdminPolicy(), writeAdminActivity(), JobStatus, Json, PayoutStatus (+3 more)

### Community 20 - "SquashAdminPayoutsPage.tsx"
Cohesion: 0.26
Nodes (11): AdminOverview, AdminPayoutRow, countTable(), getAdminOverview(), getAdminPayoutQueue(), updateAdminPayoutStatus(), emptyOverview, formatDate() (+3 more)

### Community 21 - "supabase.ts"
Cohesion: 0.29
Nodes (7): getPublishedPolicyBySlug(), PublicPolicy, supabase, supabaseAnonKey, supabaseUrl, Database, SquashInfoPage()

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

### Community 45 - "SquashAdminJobsPage.tsx"
Cohesion: 0.36
Nodes (8): getAdminJobs(), formatDate(), formatRand(), JobFilter, packageClass(), PackageFilter, SquashAdminJobsPage(), statusClass()

### Community 46 - "SquashAdminUserProfilePage.tsx"
Cohesion: 0.43
Nodes (7): AdminUserDetail, getAdminUserDetail(), sendAdminUserNotification(), updateAdminUserAccountStatus(), formatDate(), SquashAdminUserProfilePage(), statusClass()

### Community 48 - "SquashAdminJobDetailPage.tsx"
Cohesion: 0.48
Nodes (6): AdminJobRow, getAdminJobDetail(), formatDate(), formatRand(), SquashAdminJobDetailPage(), statusClass()

### Community 49 - "SquashAdminUsersPage.tsx"
Cohesion: 0.43
Nodes (6): AdminUserRow, getAdminUsers(), formatDate(), roleClass(), SquashAdminUsersPage(), UserFilter

### Community 50 - "SquashAdminReportsPage.tsx"
Cohesion: 0.53
Nodes (5): AdminReportRow, getAdminReports(), formatDate(), SquashAdminReportsPage(), statusClass()

## Knowledge Gaps
- **191 isolated node(s):** `Severity`, `TesterJobCard`, `SummaryCard`, `ActivePayment`, `HistoryItem` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `auth.tsx` to `useAuth`, `SquashScore.tsx`, `adminApi.ts`, `notificationApi.ts`, `profileApi.ts`, `SquashAdminJobsPage.tsx`, `SquashAdminUserProfilePage.tsx`, `SquashAdminJobDetailPage.tsx`, `SquashAdminUsersPage.tsx`, `SquashAdminReportsPage.tsx`, `SquashAdminPayoutsPage.tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `auth.tsx` to `useAuth`, `notificationApi.ts`, `adminApi.ts`, `supabase.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `supabase` connect `supabase.ts` to `useAuth`, `auth.tsx`, `adminApi.ts`, `notificationApi.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `Severity`, `TesterJobCard`, `SummaryCard` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.06939890710382514 - nodes in this community are weakly interconnected._
- **Should `auth.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0975609756097561 - nodes in this community are weakly interconnected._
- **Should `testLab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._