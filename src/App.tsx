import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import SquashActiveTestScreen from './SquashActiveTestScreen';
import SquashAboutPage from './SquashAboutPage';
import SquashDeveloperDashboard from './SquashDeveloperDashboard';
import SquashDeveloperBillingPage from './SquashDeveloperBillingPage';
import SquashDeveloperSettingsPage from './SquashDeveloperSettingsPage';
import SquashForDevelopersPage from './SquashForDevelopersPage';
import SquashForTestersPage from './SquashForTestersPage';
import SquashHomepage from './SquashHomepage';
import SquashLoginPage from './SquashLoginPage';
import SquashPostJobPage from './SquashPostJobPage';
import SquashPricingPage from './SquashPricingPage';
import SquashReportDetailsPage from './SquashReportDetailsPage';
import SquashSignupPage from './SquashSignupPage';
import SquashResetPasswordPage from './SquashResetPasswordPage';
import SquashAuthCallbackPage from './SquashAuthCallbackPage';
import SquashTesterDashboardPage from './SquashTesterDashboardPage';
import SquashTesterMyTestsPage from './SquashTesterMyTestsPage';
import SquashTesterJobBoard from './SquashTesterJobBoard';
import SquashTesterJobDetailPage from './SquashTesterJobDetailPage';
import SquashTesterProfilePage from './SquashTesterProfilePage';
import SquashTesterEarningsPage from './SquashTesterEarningsPage';
import SquashTesterReportsPage from './SquashTesterReportsPage';
import SquashTesterReportDetailPage from './SquashTesterReportDetailPage';
import SquashTesterSettingsPage from './SquashTesterSettingsPage';
import SquashTesterNotificationsPage from './SquashTesterNotificationsPage';
import SquashTesterBankingPage from './SquashTesterBankingPage';
import SquashTesterLevelBenefitsPage from './SquashTesterLevelBenefitsPage';
import SquashTesterLeaderboardPage from './SquashTesterLeaderboardPage';
import SquashInfoPage from './SquashInfoPage';
import SquashNotFoundPage from './SquashNotFoundPage';
import SquashApiDocsPage from './SquashApiDocsPage';
import SquashLiveSessionPage from './SquashLiveSessionPage';
import SquashChooseWorkspacePage from './SquashChooseWorkspacePage';
import SquashOnboardingPage from './SquashOnboardingPage';
import SquashAdminDashboardPage from './SquashAdminDashboardPage';
import SquashAdminPayoutsPage from './SquashAdminPayoutsPage';
import SquashAdminUsersPage from './SquashAdminUsersPage';
import SquashAdminUserProfilePage from './SquashAdminUserProfilePage';
import SquashAdminJobsPage from './SquashAdminJobsPage';
import SquashAdminJobDetailPage from './SquashAdminJobDetailPage';
import SquashDeveloperJobDetailPage from './SquashDeveloperJobDetailPage';
import SquashAdminReportsPage from './SquashAdminReportsPage';
import SquashAdminReportDetailPage from './SquashAdminReportDetailPage';
import SquashAdminSecurityPage from './SquashAdminSecurityPage';
import SquashAdminOperationsPage from './SquashAdminOperationsPage';
import SquashPrivateAdminMagicPage from './SquashPrivateAdminMagicPage';
import SquashAdminMfaPage from './SquashAdminMfaPage';
import SquashSupportPage from './SquashSupportPage';
import SquashUtilityPage, { utilityIcons } from './SquashUtilityPage';
import {
  SquashDeveloperActivityPage,
  SquashDeveloperJobsPage,
  SquashDeveloperApplicationsPage,
  SquashDeveloperReportsPage,
  SquashDeveloperSubmissionsPage,
  SquashReportAttachmentsPage,
} from './SquashDeveloperViewsPage';
import DeveloperLayout from './components/DeveloperLayout';
import TesterLayout from './components/TesterLayout';
import { defaultSessionPath, routeRole, useAuth, type UserRole } from './auth';
import { supabase } from './lib/supabase';

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

  if (!canAccessRoute) {
    return <Navigate to={defaultSessionPath(session)} replace />;
  }

  if (allowedRole === 'admin' && adminAal === 'checking') {
    return <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-sm font-semibold text-slate-600">Verifying administrator security…</div>;
  }
  if (allowedRole === 'admin' && adminAal !== 'aal2') return <Navigate to="/A31/mfa" replace />;

  return children;
}

function LogoutRoute() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
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
        <Route path="/tester/dashboard" element={<SquashTesterDashboardPage />} />
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

      <Route path="*" element={<SquashNotFoundPage />} />
    </Routes>
  );
}

export function routeBelongsToRole(pathname: string, role: UserRole): boolean {
  const target = routeRole(pathname);
  return target === 'public' || target === role;
}
