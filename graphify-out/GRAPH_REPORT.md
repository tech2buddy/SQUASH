# Graph Report - SQUASH  (2026-07-24)

## Corpus Check
- 97 files · ~323,199 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 628 nodes · 1170 edges · 37 communities (29 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `04ff71cb`
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
- testerSpecializations.ts
- SquashAdminJobsPage.tsx
- vercel.json
- phase13_test_lab_workflows.sql
- phase12_tester_growth_notifications_referrals.sql
- phase2_auth.sql
- phase6_admin_payout_audit.sql
- phase8_policy_center.sql
- phase7_admin_user_controls.sql
- phase9_job_logos.sql

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 62 edges
2. `compilerOptions` - 16 edges
3. `SquashAdminDashboardPage()` - 15 edges
4. `SquashAdminSecurityPage()` - 13 edges
5. `createNotification()` - 13 edges
6. `getDeveloperJobs()` - 12 edges
7. `getCategoryById()` - 11 edges
8. `formatSupabaseError()` - 11 edges
9. `public.set_updated_at()` - 11 edges
10. `getDeveloperSubmittedReports()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `SquashDeveloperApplicationsPage()` --indirect_call--> `getSpecializationLabel()`  [INFERRED]
  src/SquashDeveloperViewsPage.tsx → src/components/testerSpecializations.ts
- `SquashResetPasswordPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashResetPasswordPage.tsx → src/auth.tsx
- `SquashSignupPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashSignupPage.tsx → src/auth.tsx
- `SquashUtilityPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashUtilityPage.tsx → src/auth.tsx
- `SquashAdminDashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/SquashAdminDashboardPage.tsx → src/auth.tsx

## Import Cycles
- None detected.

## Communities (37 total, 8 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.07
Nodes (66): useAuth(), getRetestPrice(), Plan, RetestRequestModal(), RetestSubmission, getCategoryById(), TestCategoryId, applyToJob() (+58 more)

### Community 1 - "auth.tsx"
Cohesion: 0.08
Nodes (37): AuthContext, AuthContextValue, AuthProvider(), AuthResult, AuthSession, defaultSessionPath(), isSafeInternalPath(), normalizeRoles() (+29 more)

### Community 2 - "testLab.tsx"
Cohesion: 0.06
Nodes (16): ActiveTest, canEmbedPreview(), DeviceMetadata, IssueFrequency, IssueReport, IssueSeverity, NoteType, ProductPreview() (+8 more)

### Community 3 - "package.json"
Cohesion: 0.06
Nodes (30): lucide-react, dependencies, lucide-react, react, react-dom, react-icons, react-router-dom, @supabase/supabase-js (+22 more)

### Community 4 - "PublicFooter.tsx"
Cohesion: 0.08
Nodes (15): getCategoryByName(), TODO: Replace with Supabase query, TEST_CATEGORIES, TestCategory, footerLinks, PublicPage, IconItem, ItemWithIcon (+7 more)

### Community 5 - "schema.sql"
Cohesion: 0.16
Nodes (26): bug_reports_set_updated_at, developer_profiles_set_updated_at, job_applications_set_updated_at, jobs_set_updated_at, payout_methods_set_updated_at, payouts_set_updated_at, profiles_set_updated_at, public.bug_reports (+18 more)

### Community 6 - "SquashScore.tsx"
Cohesion: 0.19
Nodes (13): addMonths(), isCertificationExpired(), SquashCertified(), clampScore(), getMeaning(), getOverallScore(), ScoreMeaning, SquashScore() (+5 more)

### Community 7 - "adminApi.ts"
Cohesion: 0.06
Nodes (64): AdminActivityLog, AdminOverview, AdminPayoutRow, AdminPolicyRow, AdminReportRow, AdminUserDetail, AdminUserRow, countTable() (+56 more)

### Community 8 - "notificationApi.ts"
Cohesion: 0.24
Nodes (16): DeveloperHeaderNav(), formatRelativeTime(), NavItem, formatRelativeTime(), TesterHeaderNav(), AppNotification, backfillDeveloperNotifications(), getLocalNotifications() (+8 more)

### Community 9 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, ES2023, src, vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+13 more)

### Community 10 - "profileApi.ts"
Cohesion: 0.08
Nodes (41): DEVELOPER_TABS, MobileTabBar(), Tab, TESTER_TABS, getTesterTier(), TesterBadge(), TesterTier, TesterTierMeta (+33 more)

### Community 11 - "App.tsx"
Cohesion: 0.06
Nodes (27): NavItem, Severity, TesterJobCard, AssignmentWithLab, formatDate(), LabTab, parseTasks(), readLabState() (+19 more)

### Community 12 - "SQUASH Platform: System Architecture & Dashboard Workflow Documentation"
Cohesion: 0.05
Nodes (39): 1.1 Core Platform Purpose, 1.2 Technology Stack, 1.3 Role & Access Control Model, 1. System Overview & Architecture, 2. End-to-End System Workflow Architecture, 3.1 Overview, 3.2 Key Pages & Navigation, 3.3 Detailed Developer Workflows (+31 more)

### Community 15 - "SquashDeveloperBillingPage.tsx"
Cohesion: 0.18
Nodes (14): ActivePayment, activePayments, EscrowStep, escrowSteps, formatDate(), formatRands(), history, HistoryItem (+6 more)

### Community 16 - "SquashTesterDashboardPage.tsx"
Cohesion: 0.19
Nodes (13): Difficulty, earningsMax, earningsPoints, emptyEarningsSummary, formatDate(), formatRands(), getDifficultyClasses(), getStatusClasses() (+5 more)

### Community 18 - "testerSpecializations.ts"
Cohesion: 0.29
Nodes (9): FeaturedTesterCard(), SpecializationChecklist(), getSpecializationIds(), getSpecializationLabel(), hasSaLanguageTag(), TODO: Replace with Supabase query, SPECIALIZATION_GROUPS, SpecializationGroup (+1 more)

### Community 20 - "SquashAdminJobsPage.tsx"
Cohesion: 0.20
Nodes (14): AdminJobRow, getAdminJobDetail(), getAdminJobs(), formatDate(), formatRand(), SquashAdminJobDetailPage(), statusClass(), formatDate() (+6 more)

### Community 26 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, outputDirectory, rewrites, $schema

### Community 27 - "phase13_test_lab_workflows.sql"
Cohesion: 0.67
Nodes (3): public.jobs, public.test_lab_sessions, test_lab_sessions_set_updated_at

## Knowledge Gaps
- **186 isolated node(s):** `graphify`, `Workflow: graphify`, `1.1 Core Platform Purpose`, `1.2 Technology Stack`, `1.3 Role & Access Control Model` (+181 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `auth.tsx`, `PublicFooter.tsx`, `adminApi.ts`, `notificationApi.ts`, `profileApi.ts`, `SquashDeveloperBillingPage.tsx`, `SquashAdminJobsPage.tsx`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `isSupabaseConfigured` connect `auth.tsx` to `useAuth`, `notificationApi.ts`, `profileApi.ts`, `adminApi.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `supabase` connect `auth.tsx` to `useAuth`, `notificationApi.ts`, `profileApi.ts`, `adminApi.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `graphify`, `Workflow: graphify`, `1.1 Core Platform Purpose` to the rest of the system?**
  _186 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.06527682843472317 - nodes in this community are weakly interconnected._
- **Should `auth.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07535460992907801 - nodes in this community are weakly interconnected._
- **Should `testLab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._