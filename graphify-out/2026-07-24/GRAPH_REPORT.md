# Graph Report - SQUASH  (2026-07-24)

## Corpus Check
- 101 files · ~325,438 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 641 nodes · 1178 edges · 45 communities (35 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2acad4e9`
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
- getTesterProfile
- SquashAdminJobsPage.tsx
- profileApi.ts
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
1. `useAuth()` - 58 edges
2. `compilerOptions` - 16 edges
3. `SquashAdminDashboardPage()` - 15 edges
4. `createNotification()` - 13 edges
5. `getDeveloperJobs()` - 12 edges
6. `getTesterProfile()` - 11 edges
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
- `SquashTesterDashboardPage()` --calls--> `getTesterProfile()`  [EXTRACTED]
  src/SquashTesterDashboardPage.tsx → src/lib/profileApi.ts

## Import Cycles
- None detected.

## Communities (45 total, 10 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.06
Nodes (70): useAuth(), getRetestPrice(), Plan, RetestRequestModal(), RetestSubmission, getCategoryById(), getCategoryByName(), TODO: Replace with Supabase query (+62 more)

### Community 1 - "auth.tsx"
Cohesion: 0.09
Nodes (33): AuthContext, AuthContextValue, AuthProvider(), AuthResult, AuthSession, defaultSessionPath(), isSafeInternalPath(), normalizeRoles() (+25 more)

### Community 2 - "testLab.tsx"
Cohesion: 0.06
Nodes (16): ActiveTest, canEmbedPreview(), DeviceMetadata, IssueFrequency, IssueReport, IssueSeverity, NoteType, ProductPreview() (+8 more)

### Community 3 - "package.json"
Cohesion: 0.06
Nodes (32): lucide-react, dependencies, lucide-react, react, react-dom, react-icons, react-router-dom, resend (+24 more)

### Community 4 - "PublicFooter.tsx"
Cohesion: 0.05
Nodes (25): NavItem, sendEmail(), getPublishedPolicyBySlug(), PublicPolicy, footerLinks, PublicPage, IconItem, SquashAboutPage() (+17 more)

### Community 5 - "schema.sql"
Cohesion: 0.16
Nodes (26): bug_reports_set_updated_at, developer_profiles_set_updated_at, job_applications_set_updated_at, jobs_set_updated_at, payout_methods_set_updated_at, payouts_set_updated_at, profiles_set_updated_at, public.bug_reports (+18 more)

### Community 6 - "SquashScore.tsx"
Cohesion: 0.19
Nodes (13): addMonths(), isCertificationExpired(), SquashCertified(), clampScore(), getMeaning(), getOverallScore(), ScoreMeaning, SquashScore() (+5 more)

### Community 7 - "adminApi.ts"
Cohesion: 0.05
Nodes (69): AdminActivityLog, AdminJobRow, AdminOverview, AdminPayoutRow, AdminPolicyRow, AdminReportRow, AdminUserDetail, AdminUserRow (+61 more)

### Community 8 - "notificationApi.ts"
Cohesion: 0.30
Nodes (16): DeveloperHeaderNav(), formatRelativeTime(), formatRelativeTime(), TesterHeaderNav(), AppNotification, backfillDeveloperNotifications(), createNotification(), getLocalNotifications() (+8 more)

### Community 9 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, ES2023, src, vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+13 more)

### Community 10 - "profileApi.ts"
Cohesion: 0.15
Nodes (15): DEVELOPER_TABS, MobileTabBar(), Tab, TESTER_TABS, Props, TesterMobileDrawer(), getTesterReferrals(), TesterReferralEntry (+7 more)

### Community 11 - "App.tsx"
Cohesion: 0.39
Nodes (8): AssignmentWithLab, formatDate(), LabTab, parseTasks(), readLabState(), SquashTesterMyTestsPage(), statusClass(), statusLabel()

### Community 12 - "SQUASH Platform: System Architecture & Dashboard Workflow Documentation"
Cohesion: 0.05
Nodes (39): 1.1 Core Platform Purpose, 1.2 Technology Stack, 1.3 Role & Access Control Model, 1. System Overview & Architecture, 2. End-to-End System Workflow Architecture, 3.1 Overview, 3.2 Key Pages & Navigation, 3.3 Detailed Developer Workflows (+31 more)

### Community 15 - "SquashDeveloperBillingPage.tsx"
Cohesion: 0.18
Nodes (14): ActivePayment, activePayments, EscrowStep, escrowSteps, formatDate(), formatRands(), history, HistoryItem (+6 more)

### Community 16 - "SquashTesterDashboardPage.tsx"
Cohesion: 0.27
Nodes (10): replaceTesterSpecializations(), Difficulty, emptyEarningsSummary, formatDate(), formatRands(), getDifficultyClasses(), getStatusClasses(), SquashTesterDashboardPage() (+2 more)

### Community 17 - "SquashOnboardingPage.tsx"
Cohesion: 0.17
Nodes (15): getDeveloperProfile(), getUserSettings(), updateDeveloperProfile(), updateTesterProfile(), updateUserSettings(), defaultSettings, SettingsState, SquashDeveloperSettingsPage() (+7 more)

### Community 18 - "testerSpecializations.ts"
Cohesion: 0.29
Nodes (9): FeaturedTesterCard(), SpecializationChecklist(), getSpecializationIds(), getSpecializationLabel(), hasSaLanguageTag(), TODO: Replace with Supabase query, SPECIALIZATION_GROUPS, SpecializationGroup (+1 more)

### Community 19 - "getTesterProfile"
Cohesion: 0.22
Nodes (12): getTesterProfile(), TesterPublicProfile, nextTierCopy(), SquashTesterLevelBenefitsPage(), TierCard, tierCards, emptyReports, formatDate() (+4 more)

### Community 20 - "SquashAdminJobsPage.tsx"
Cohesion: 0.27
Nodes (10): getTesterTier(), TesterBadge(), TesterTier, TesterTierMeta, TesterEarningsSummary, getTesterLeaderboard(), TesterLeaderboardEntry, rankIcon() (+2 more)

### Community 21 - "profileApi.ts"
Cohesion: 0.23
Nodes (10): DeveloperProfileSettings, getTesterSpecializations(), getTopTesters(), TODO: Implement actual referrals table in Supabase, TesterProfileSettings, TopTesterDisplay, UserSettings, Severity (+2 more)

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
- **190 isolated node(s):** `resend`, `name`, `private`, `version`, `type` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `useAuth` to `auth.tsx`, `PublicFooter.tsx`, `adminApi.ts`, `notificationApi.ts`, `profileApi.ts`, `SquashDeveloperBillingPage.tsx`, `SquashOnboardingPage.tsx`, `SquashAdminJobsPage.tsx`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `getTesterProfile()` connect `getTesterProfile` to `SquashTesterDashboardPage.tsx`, `SquashOnboardingPage.tsx`, `profileApi.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `SquashOnboardingPage()` connect `SquashOnboardingPage.tsx` to `useAuth`, `SquashTesterDashboardPage.tsx`, `getTesterProfile`, `profileApi.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `resend`, `name`, `private` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.05962059620596206 - nodes in this community are weakly interconnected._
- **Should `auth.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0859465737514518 - nodes in this community are weakly interconnected._
- **Should `testLab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._