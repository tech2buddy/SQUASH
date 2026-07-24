# Graph Report - SQUASH  (2026-07-24)

## Corpus Check
- 102 files · ~325,821 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 643 nodes · 1167 edges · 42 communities (31 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aa4f43ac`
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
1. `useAuth()` - 54 edges
2. `compilerOptions` - 16 edges
3. `SquashAdminDashboardPage()` - 15 edges
4. `createNotification()` - 13 edges
5. `getTesterProfile()` - 11 edges
6. `getCategoryById()` - 11 edges
7. `formatSupabaseError()` - 11 edges
8. `public.set_updated_at()` - 11 edges
9. `getDeveloperJobs()` - 10 edges
10. `getDeveloperSubmittedReports()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `SquashDeveloperApplicationsPage()` --indirect_call--> `getSpecializationLabel()`  [INFERRED]
  src/SquashDeveloperViewsPage.tsx → src/components/testerSpecializations.ts
- `SquashActiveTestScreen()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashActiveTestScreen.tsx → src/auth.tsx
- `SquashAdminDashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminDashboardPage.tsx → src/auth.tsx
- `SquashAdminJobDetailPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminJobDetailPage.tsx → src/auth.tsx
- `SquashAdminJobsPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminJobsPage.tsx → src/auth.tsx

## Import Cycles
- None detected.

## Communities (42 total, 11 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.07
Nodes (60): getCategoryById(), getCategoryByName(), TODO: Replace with Supabase query, TEST_CATEGORIES, TestCategory, TestCategoryId, applyToJob(), BugReportDetail (+52 more)

### Community 1 - "auth.tsx"
Cohesion: 0.08
Nodes (39): AuthContext, AuthContextValue, AuthProvider(), AuthResult, AuthSession, defaultSessionPath(), isSafeInternalPath(), normalizeRoles() (+31 more)

### Community 2 - "testLab.tsx"
Cohesion: 0.06
Nodes (16): ActiveTest, canEmbedPreview(), DeviceMetadata, IssueFrequency, IssueReport, IssueSeverity, NoteType, ProductPreview() (+8 more)

### Community 3 - "package.json"
Cohesion: 0.06
Nodes (32): lucide-react, dependencies, lucide-react, react, react-dom, react-icons, react-router-dom, resend (+24 more)

### Community 4 - "PublicFooter.tsx"
Cohesion: 0.06
Nodes (21): NavItem, sendEmail(), footerLinks, PublicPage, IconItem, SquashAboutPage(), checklist, emptyDraft() (+13 more)

### Community 5 - "schema.sql"
Cohesion: 0.16
Nodes (26): bug_reports_set_updated_at, developer_profiles_set_updated_at, job_applications_set_updated_at, jobs_set_updated_at, payout_methods_set_updated_at, payouts_set_updated_at, profiles_set_updated_at, public.bug_reports (+18 more)

### Community 6 - "SquashScore.tsx"
Cohesion: 0.12
Nodes (22): getRetestPrice(), Plan, RetestRequestModal(), RetestSubmission, addMonths(), isCertificationExpired(), SquashCertified(), clampScore() (+14 more)

### Community 7 - "adminApi.ts"
Cohesion: 0.05
Nodes (68): AdminActivityLog, AdminJobRow, AdminOverview, AdminPayoutRow, AdminPolicyRow, AdminReportRow, AdminUserDetail, AdminUserRow (+60 more)

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
Nodes (48): DeveloperProfileSettings, getDeveloperProfile(), getTesterProfile(), getTesterSpecializations(), getTopTesters(), getUserSettings(), TODO: Implement actual referrals table in Supabase, replaceTesterSpecializations() (+40 more)

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
- **191 isolated node(s):** `SummaryCard`, `ActivePayment`, `HistoryItem`, `EscrowStep`, `summaryCards` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `auth.tsx` to `useAuth`, `SquashScore.tsx`, `adminApi.ts`, `notificationApi.ts`, `profileApi.ts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `auth.tsx` to `useAuth`, `notificationApi.ts`, `adminApi.ts`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `supabase` connect `auth.tsx` to `useAuth`, `notificationApi.ts`, `adminApi.ts`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `SummaryCard`, `ActivePayment`, `HistoryItem` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.06692242114236999 - nodes in this community are weakly interconnected._
- **Should `auth.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07767722473604827 - nodes in this community are weakly interconnected._
- **Should `testLab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._