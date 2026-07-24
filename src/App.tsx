import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SquashActiveTestScreen from './SquashActiveTestScreen';
import SquashAboutPage from './SquashAboutPage';
import SquashDeveloperDashboard from './SquashDeveloperDashboard';
import SquashDeveloperBillingPage from './SquashDeveloperBillingPage';
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
import SquashTesterProfilePage from './SquashTesterProfilePage';
import SquashTesterEarningsPage from './SquashTesterEarningsPage';
import SquashTesterReportsPage from './SquashTesterReportsPage';
import SquashTesterSettingsPage from './SquashTesterSettingsPage';
import SquashTesterNotificationsPage from './SquashTesterNotificationsPage';
import SquashTesterPayoutMethodPage from './SquashTesterPayoutMethodPage';
import SquashTesterLevelBenefitsPage from './SquashTesterLevelBenefitsPage';
import SquashTesterReferralsPage from './SquashTesterReferralsPage';
import SquashTesterLeaderboardPage from './SquashTesterLeaderboardPage';
import SquashInfoPage from './SquashInfoPage';
import SquashNotFoundPage from './SquashNotFoundPage';
import SquashApiDocsPage from './SquashApiDocsPage';
import SquashCertificatePage from './SquashCertificatePage';
import SquashLiveSessionPage from './SquashLiveSessionPage';
import SquashChooseWorkspacePage from './SquashChooseWorkspacePage';
import SquashOnboardingPage from './SquashOnboardingPage';
import SquashAdminDashboardPage from './SquashAdminDashboardPage';
import SquashAdminPayoutsPage from './SquashAdminPayoutsPage';
import SquashAdminUsersPage from './SquashAdminUsersPage';
import SquashAdminUserProfilePage from './SquashAdminUserProfilePage';
import SquashAdminJobsPage from './SquashAdminJobsPage';
import SquashAdminJobDetailPage from './SquashAdminJobDetailPage';
import SquashAdminReportsPage from './SquashAdminReportsPage';
import SquashAdminSecurityPage from './SquashAdminSecurityPage';
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

function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: React.ReactElement;
  allowedRole: UserRole;
}) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 text-center text-sm font-semibold text-slate-600">
        Loading your SQUASH session...
      </div>
    );
  }

  if (!session) {
    const next = encodeURIComponent(location.pathname);
    const roleParam = allowedRole === 'admin' ? '' : `role=${allowedRole}&`;
    return <Navigate to={`/login?${roleParam}next=${next}`} replace />;
  }

  const canAccessRoute = session.roles.includes(allowedRole) || (allowedRole !== 'admin' && session.roles.includes('admin'));

  if (!canAccessRoute) {
    return <Navigate to={defaultSessionPath(session)} replace />;
  }

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
      <Route path="/certificate/:jobId" element={<SquashCertificatePage />} />
      <Route path="/login" element={<SquashLoginPage />} />
      <Route path="/signup" element={<SquashSignupPage />} />
      <Route path="/forgot-password" element={<SquashResetPasswordPage mode="request" />} />
      <Route path="/reset-password" element={<SquashResetPasswordPage mode="update" />} />
      <Route path="/auth/callback" element={<SquashAuthCallbackPage />} />
      <Route path="/logout" element={<LogoutRoute />} />
      <Route path="/choose-workspace" element={<SquashChooseWorkspacePage />} />
      <Route path="/onboarding/:role" element={<SquashOnboardingPage />} />
      <Route path="/about" element={<SquashAboutPage />} />
      <Route
        path="/contact"
        element={
          <SquashInfoPage
            title="Contact"
            description="Reach our team for support, partnerships, and sales questions."
          />
        }
      />
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
      <Route
        path="/help-center"
        element={
          <SquashInfoPage
            title="Help Center"
            description="Find answers to common questions and get support for your SQUASH account and workflows."
          />
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/payouts"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminPayoutsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminUsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/:userId"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminUserProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/jobs"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminJobsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/jobs/:jobId"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminJobDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/security"
        element={
          <ProtectedRoute allowedRole="admin">
            <SquashAdminSecurityPage />
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
        <Route path="/developer/applications" element={<SquashDeveloperApplicationsPage />} />
        <Route path="/developer/submissions" element={<SquashDeveloperSubmissionsPage />} />
        <Route path="/developer/reports" element={<SquashDeveloperReportsPage />} />
        <Route path="/developer/activity" element={<SquashDeveloperActivityPage />} />
        <Route path="/report-details/attachments" element={<SquashReportAttachmentsPage />} />
        <Route
          path="/billing/payment-methods"
          element={
            <SquashUtilityPage
              role="developer"
              eyebrow="Billing setup"
              title="Payment methods"
              description="Add and manage payment methods for funding SQUASH testing jobs. Checkout storage is intentionally not active until the payment provider is connected."
              icon={utilityIcons.CreditCard}
              details={[
                'Cards and EFT options will connect through the payment provider, not through local browser storage.',
                'Only protected job totals are shown here. No tester payout or platform margin information is exposed.',
                'Invoices and receipts will attach to completed payment records once checkout goes live.',
              ]}
              actions={[
                { label: 'Back to Billing', href: '/billing', primary: true },
                { label: 'Post a Job', href: '/post-job' },
              ]}
            />
          }
        />
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
        <Route path="/job-board" element={<SquashTesterJobBoard />} />
        <Route path="/active-test" element={<SquashTesterMyTestsPage />} />
        <Route path="/tester/my-tests" element={<SquashTesterMyTestsPage />} />
        <Route path="/test-lab" element={<SquashActiveTestScreen />} />
        <Route path="/tester/profile" element={<SquashTesterProfilePage />} />
        <Route path="/tester/earnings" element={<SquashTesterEarningsPage />} />
        <Route path="/tester/payments" element={<SquashTesterEarningsPage />} />
        <Route path="/tester/reports" element={<SquashTesterReportsPage />} />
        <Route path="/tester/submissions" element={<SquashTesterReportsPage />} />
        <Route path="/tester/settings" element={<SquashTesterSettingsPage />} />
        <Route path="/tester/notifications" element={<SquashTesterNotificationsPage />} />
        <Route path="/tester/payout-method" element={<SquashTesterPayoutMethodPage />} />
        <Route path="/tester/leaderboard" element={<SquashTesterLeaderboardPage />} />
        <Route path="/tester/level-benefits" element={<SquashTesterLevelBenefitsPage />} />
        <Route path="/tester/referrals" element={<SquashTesterReferralsPage />} />
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
