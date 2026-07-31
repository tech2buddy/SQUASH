import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';

/**
 * Route-level code splitting.
 *
 * The whole app used to ship as one 1.3 MB chunk, which is a bad look for a
 * product whose pitch is testing on 2G and 3G: a first-time visitor on a slow
 * connection downloaded every admin screen before seeing the homepage.
 *
 * Eager below the fold of this comment: the landing page and the two auth
 * screens. They are the entry points, and a loading flash on the first thing
 * someone sees is worse than the bytes. Everything else -- every dashboard,
 * every admin screen, every policy page -- loads on demand.
 */
import SquashHomepage from './SquashHomepage';
import SquashLoginPage from './SquashLoginPage';
import SquashSignupPage from './SquashSignupPage';
import SquashNotFoundPage from './SquashNotFoundPage';
import DeveloperLayout from './components/DeveloperLayout';
import TesterLayout from './components/TesterLayout';
// Eager: it wraps the tester routes, so every one of them waits on it anyway.
import TesterQualificationGate from './components/TesterQualificationGate';
import SquashUtilityPage, { utilityIcons } from './SquashUtilityPage';
import { defaultSessionPath, routeRole, useAuth, type UserRole } from './auth';
import { supabase } from './lib/supabase';

const SquashActiveTestScreen = lazy(() => import('./SquashActiveTestScreen'));
const SquashAboutPage = lazy(() => import('./SquashAboutPage'));
const SquashDeveloperDashboard = lazy(() => import('./SquashDeveloperDashboard'));
const SquashDeveloperBillingPage = lazy(() => import('./SquashDeveloperBillingPage'));
const SquashDeveloperSettingsPage = lazy(() => import('./SquashDeveloperSettingsPage'));
const SquashForDevelopersPage = lazy(() => import('./SquashForDevelopersPage'));
const SquashForTestersPage = lazy(() => import('./SquashForTestersPage'));
const SquashPostJobPage = lazy(() => import('./SquashPostJobPage'));
const SquashPricingPage = lazy(() => import('./SquashPricingPage'));
const SquashReportDetailsPage = lazy(() => import('./SquashReportDetailsPage'));
const SquashResetPasswordPage = lazy(() => import('./SquashResetPasswordPage'));
const SquashAuthCallbackPage = lazy(() => import('./SquashAuthCallbackPage'));
const SquashTesterDashboardPage = lazy(() => import('./SquashTesterDashboardPage'));
const SquashTesterMyTestsPage = lazy(() => import('./SquashTesterMyTestsPage'));
const SquashTesterJobBoard = lazy(() => import('./SquashTesterJobBoard'));
const SquashTesterJobDetailPage = lazy(() => import('./SquashTesterJobDetailPage'));
const SquashTesterProfilePage = lazy(() => import('./SquashTesterProfilePage'));
const SquashTesterEarningsPage = lazy(() => import('./SquashTesterEarningsPage'));
const SquashTesterReportsPage = lazy(() => import('./SquashTesterReportsPage'));
const SquashTesterReportDetailPage = lazy(() => import('./SquashTesterReportDetailPage'));
const SquashTesterSettingsPage = lazy(() => import('./SquashTesterSettingsPage'));
const SquashTesterNotificationsPage = lazy(() => import('./SquashTesterNotificationsPage'));
const SquashTesterBankingPage = lazy(() => import('./SquashTesterBankingPage'));
const SquashTesterLevelBenefitsPage = lazy(() => import('./SquashTesterLevelBenefitsPage'));
const SquashTesterLeaderboardPage = lazy(() => import('./SquashTesterLeaderboardPage'));
const SquashTesterQualificationPage = lazy(() => import('./SquashTesterQualificationPage'));
const SquashTesterQualificationSamplePage = lazy(() => import('./SquashTesterQualificationSamplePage'));
const SquashInfoPage = lazy(() => import('./SquashInfoPage'));
const SquashApiDocsPage = lazy(() => import('./SquashApiDocsPage'));
const SquashLiveSessionPage = lazy(() => import('./SquashLiveSessionPage'));
const SquashChooseWorkspacePage = lazy(() => import('./SquashChooseWorkspacePage'));
const SquashOnboardingPage = lazy(() => import('./SquashOnboardingPage'));
const SquashAdminDashboardPage = lazy(() => import('./SquashAdminDashboardPage'));
const SquashAdminPayoutsPage = lazy(() => import('./SquashAdminPayoutsPage'));
const SquashAdminQualificationsPage = lazy(() => import('./SquashAdminQualificationsPage'));
const SquashAdminSpecializationsPage = lazy(() => import('./SquashAdminSpecializationsPage'));
const SquashAdminProbationPage = lazy(() => import('./SquashAdminProbationPage'));
const SquashAdminUsersPage = lazy(() => import('./SquashAdminUsersPage'));
const SquashAdminUserProfilePage = lazy(() => import('./SquashAdminUserProfilePage'));
const SquashAdminJobsPage = lazy(() => import('./SquashAdminJobsPage'));
const SquashAdminJobDetailPage = lazy(() => import('./SquashAdminJobDetailPage'));
const SquashDeveloperJobDetailPage = lazy(() => import('./SquashDeveloperJobDetailPage'));
const SquashAdminReportsPage = lazy(() => import('./SquashAdminReportsPage'));
const SquashAdminReportDetailPage = lazy(() => import('./SquashAdminReportDetailPage'));
const SquashAdminSecurityPage = lazy(() => import('./SquashAdminSecurityPage'));
const SquashAdminOperationsPage = lazy(() => import('./SquashAdminOperationsPage'));
const SquashPrivateAdminMagicPage = lazy(() => import('./SquashPrivateAdminMagicPage'));
const SquashAdminMfaPage = lazy(() => import('./SquashAdminMfaPage'));
const SquashSupportPage = lazy(() => import('./SquashSupportPage'));

// Named exports, so the module is unwrapped to a default for lazy().
const SquashDeveloperActivityPage = lazy(() =>
  import('./SquashDeveloperViewsPage').then((m) => ({ default: m.SquashDeveloperActivityPage })),
);
const SquashDeveloperJobsPage = lazy(() =>
  import('./SquashDeveloperViewsPage').then((m) => ({ default: m.SquashDeveloperJobsPage })),
);
const SquashDeveloperApplicationsPage = lazy(() =>
  import('./SquashDeveloperViewsPage').then((m) => ({ default: m.SquashDeveloperApplicationsPage })),
);
const SquashDeveloperReportsPage = lazy(() =>
  import('./SquashDeveloperViewsPage').then((m) => ({ default: m.SquashDeveloperReportsPage })),
);
const SquashDeveloperSubmissionsPage = lazy(() =>
  import('./SquashDeveloperViewsPage').then((m) => ({ default: m.SquashDeveloperSubmissionsPage })),
);
const SquashReportAttachmentsPage = lazy(() =>
  import('./SquashDeveloperViewsPage').then((m) => ({ default: m.SquashReportAttachmentsPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-slate-500">
      Loading...
    </div>
  );
}

function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: React.ReactElement;
  allowedRole: UserRole;
}) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [adminAal, setAdminAal] = useState<'checking' | 'aal1' | 'aal2'>('checking');

  useEffect(() => {
    let active = true;
    if (allowedRole !== 'admin' || !session?.roles.includes('admin')) {
      return () => { active = false; };
    }
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data, error }) => {
      if (active) setAdminAal(!error && data.currentLevel === 'aal2' ? 'aal2' : 'aal1');
    });
    return () => { active = false; };
  }, [allowedRole, session?.userId, session?.roles]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading your SQUASH session...
      </div>
    );
  }

  if (!session) {
    const next = encodeURIComponent(location.pathname);
    if (allowedRole === 'admin') return <Navigate to={`/A31?next=${next}`} replace />;
    return <Navigate to={`/login?role=${allowedRole}&next=${next}`} replace />;
  }

  const canAccessRoute = session.roles.includes(allowedRole) || (allowedRole !== 'admin' && session.roles.includes('admin'));

  if (allowedRole !== 'admin' && session.roles.includes(allowedRole) && session.onboardingCompleted === false) {
    return <Navigate to={`/onboarding/${allowedRole}`} replace />;
  }

  if (!canAccessRoute) {
    return <Navigate to={defaultSessionPath(session)} replace />;
  }

  if (allowedRole === 'admin' && adminAal === 'checking') {
    return <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-sm font-semibold text-slate-600">Verifying administrator security…</div>;
  }
  if (allowedRole === 'admin' && adminAal !== 'aal2') return <Navigate to="/A31/mfa" replace />;

  return children;
}

import CookieConsentBanner from './components/CookieConsentBanner';

function LogoutRoute() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path="/" element={<SquashHomepage />} />
      <Route path="/for-developers" element={<SquashForDevelopersPage />} />
      <Route path="/for-testers" element={<SquashForTestersPage />} />
      <Route path="/pricing" element={<SquashPricingPage />} />
      <Route path="/api-docs" element={<SquashApiDocsPage />} />
      <Route path="/live-session" element={<SquashLiveSessionPage />} />
      <Route path="/login" element={<SquashLoginPage />} />
      <Route path="/signup" element={<SquashSignupPage />} />
      <Route path="/forgot-password" element={<SquashResetPasswordPage mode="request" />} />
      <Route path="/reset-password" element={<SquashResetPasswordPage mode="update" />} />
      <Route path="/auth/callback" element={<SquashAuthCallbackPage />} />
      <Route path="/logout" element={<LogoutRoute />} />
      <Route path="/choose-workspace" element={<SquashChooseWorkspacePage />} />
      <Route path="/onboarding/:role" element={<SquashOnboardingPage />} />
      <Route path="/about" element={<SquashAboutPage />} />
      <Route caseSensitive path="/A31" element={<SquashPrivateAdminMagicPage />} />
      <Route caseSensitive path="/A31/mfa" element={<SquashAdminMfaPage />} />
      <Route path="/contact" element={<SquashSupportPage />} />

      <Route
        path="/privacy"
        element={
          <SquashInfoPage
            title="Privacy Policy"
            description="Learn how SQUASH handles your data, protects your privacy, and secures your information."
            policySlug="privacy"
          />
        }
      />
      <Route
        path="/terms"
        element={
          <SquashInfoPage
            title="Terms of Service"
            description="Review SQUASH terms, responsibilities, and usage guidelines for developers and testers."
            policySlug="terms"
          />
        }
      />
      <Route
        path="/tester-code-of-conduct"
        element={
          <SquashInfoPage
            title="Tester Code of Conduct"
            description="Standards for honest reporting, confidentiality, professionalism, and safe testing on SQUASH."
            policySlug="tester-code-of-conduct"
          />
        }
      />
      <Route
        path="/developer-terms"
        element={
          <SquashInfoPage
            title="Developer Terms"
            description="Responsibilities for developers posting jobs, reviewing submissions, and working with testers on SQUASH."
            policySlug="developer-terms"
          />
        }
      />
      <Route
        path="/payout-policy"
        element={
          <SquashInfoPage
            title="Payout Policy"
            description="How tester payouts are requested, reviewed, approved, and paid through SQUASH."
            policySlug="payout-policy"
          />
        }
      />
      <Route
        path="/refund-policy"
        element={
          <SquashInfoPage
            title="Refund Policy"
            description="How refund requests are reviewed fairly when testing jobs need attention."
            policySlug="refund-policy"
          />
        }
      />
      <Route
        path="/dispute-resolution-policy"
        element={
          <SquashInfoPage
            title="Dispute Resolution Policy"
            description="How SQUASH reviews disputes between developers and testers using job evidence and communication."
            policySlug="dispute-resolution"
          />
        }
      />
      <Route
        path="/popia-data-protection-policy"
        element={
          <SquashInfoPage
            title="POPIA Data Protection Policy"
            description="How SQUASH handles personal information responsibly for South African users."
            policySlug="popia-data-protection"
          />
        }
      />
      <Route
        path="/careers"
        element={
          <SquashInfoPage
            title="Careers"
            description="Join us to help shape the future of product quality and real-world testing."
          />
        }
      />
      <Route
        path="/resources"
        element={
          <SquashInfoPage
            title="Resources"
            description="Explore tutorials, tips, and practical resources to improve your testing workflows."
          />
        }
      />
      <Route
        path="/blog"
        element={
          <SquashInfoPage
            title="Blog"
            description="Read product updates, testing best practices, and stories from the SQUASH community."
          />
        }
      />
      <Route
        path="/guides"
        element={
          <SquashInfoPage
            title="Guides"
            description="Step-by-step guides for posting jobs, writing quality reports, and getting better outcomes."
          />
        }
      />
      <Route path="/help-center" element={<SquashSupportPage />} />


      <Route
        path="/A31/dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/A31/qualifications"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminQualificationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/A31/specializations"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminSpecializationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/A31/probation"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminProbationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/A31/payouts"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminPayoutsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/A31/users"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminUsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/A31/users/:userId"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminUserProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/A31/jobs"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminJobsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/A31/jobs/:jobId"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminJobDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/A31/reports"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/A31/reports/:submissionId"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminReportDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/A31/security"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminSecurityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/A31/operations"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminOperationsPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Developer Routes wrapped in Master DeveloperLayout */}
      <Route
        element={
          <ProtectedRoute allowedRole="developer">
            <DeveloperLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<SquashDeveloperDashboard />} />
        <Route path="/post-job" element={<SquashPostJobPage />} />
        <Route path="/report-details" element={<SquashReportDetailsPage />} />
        <Route path="/billing" element={<SquashDeveloperBillingPage />} />
        <Route path="/developer/jobs" element={<SquashDeveloperJobsPage />} />
        <Route path="/developer/jobs/:jobId" element={<SquashDeveloperJobDetailPage />} />
        <Route path="/developer/applications" element={<SquashDeveloperApplicationsPage />} />
        <Route path="/developer/submissions" element={<SquashDeveloperSubmissionsPage />} />
        <Route path="/developer/reports" element={<SquashDeveloperReportsPage />} />
        <Route path="/developer/activity" element={<SquashDeveloperActivityPage />} />
        <Route path="/developer/settings" element={<SquashDeveloperSettingsPage />} />
        <Route path="/report-details/attachments" element={<SquashReportAttachmentsPage />} />
        <Route path="/billing/payment-methods" element={<Navigate to="/billing" replace />} />
      </Route>

      {/* Protected Tester Routes wrapped in Master TesterLayout */}
      <Route
        element={
          <ProtectedRoute allowedRole="tester">
            <TesterLayout />
          </ProtectedRoute>
        }
      >
        <Route element={<TesterQualificationGate />}>
        <Route path="/tester/dashboard" element={<SquashTesterDashboardPage />} />
        <Route path="/tester-qualification" element={<SquashTesterQualificationPage />} />
        <Route path="/tester-qualification/sample" element={<SquashTesterQualificationSamplePage />} />
        <Route path="/tester-jobs" element={<SquashTesterJobBoard />} />
        <Route path="/tester-jobs/:jobId" element={<SquashTesterJobDetailPage />} />
        <Route path="/job-board" element={<SquashTesterJobBoard />} />
        <Route path="/active-test" element={<SquashTesterMyTestsPage />} />
        <Route path="/tester/my-tests" element={<SquashTesterMyTestsPage />} />
        <Route path="/test-lab" element={<SquashActiveTestScreen />} />
        <Route path="/tester/profile" element={<SquashTesterProfilePage />} />
        <Route path="/tester/earnings" element={<SquashTesterEarningsPage />} />
        <Route path="/tester/payments" element={<SquashTesterEarningsPage />} />
        <Route path="/tester/reports" element={<SquashTesterReportsPage />} />
        <Route path="/tester/reports/:submissionId" element={<SquashTesterReportDetailPage />} />
        <Route path="/tester/submissions" element={<SquashTesterReportsPage />} />
        <Route path="/tester/settings" element={<SquashTesterSettingsPage />} />
        <Route path="/tester/notifications" element={<SquashTesterNotificationsPage />} />
        <Route path="/tester/payout-method" element={<SquashTesterBankingPage />} />
        <Route path="/tester/leaderboard" element={<SquashTesterLeaderboardPage />} />
        <Route path="/tester/level-benefits" element={<SquashTesterLevelBenefitsPage />} />
        <Route
          path="/tester/menu"
          element={
            <SquashUtilityPage
              role="tester"
              eyebrow="Mobile navigation"
              title="Tester menu"
              description="Quick access to the main tester areas. This keeps the mobile menu useful while we build the full slide-out navigation."
              icon={utilityIcons.Menu}
              actions={[
                { label: 'Dashboard', href: '/tester/dashboard', primary: true },
                { label: 'Available Jobs', href: '/tester-jobs' },
                { label: 'My Tests', href: '/active-test' },
                { label: 'Reports', href: '/tester/reports' },
                { label: 'Earnings', href: '/tester/earnings' },
                { label: 'Profile', href: '/tester/profile' },
                { label: 'Settings', href: '/tester/settings' },
              ]}
            />
          }
        />
        </Route>
      </Route>

      <Route path="*" element={<SquashNotFoundPage />} />
    </Routes>
    </Suspense>
    <CookieConsentBanner />
    </>
  );
}

export function routeBelongsToRole(pathname: string, role: UserRole): boolean {
  const target = routeRole(pathname);
  return target === 'public' || target === role;
}
