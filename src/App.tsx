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
import SquashTesterDashboardPage from './SquashTesterDashboardPage';
import SquashTesterJobBoard from './SquashTesterJobBoard';
import SquashTesterProfilePage from './SquashTesterProfilePage';
import SquashTesterEarningsPage from './SquashTesterEarningsPage';
import SquashTesterReportsPage from './SquashTesterReportsPage';
import SquashTesterSettingsPage from './SquashTesterSettingsPage';
import SquashInfoPage from './SquashInfoPage';
import SquashNotFoundPage from './SquashNotFoundPage';
import SquashApiDocsPage from './SquashApiDocsPage';
import SquashCertificatePage from './SquashCertificatePage';
import SquashLiveSessionPage from './SquashLiveSessionPage';
import {
  SquashDeveloperActivityPage,
  SquashDeveloperJobsPage,
  SquashDeveloperSubmissionsPage,
  SquashReportAttachmentsPage,
} from './SquashDeveloperViewsPage';
import { roleHomePath, routeRole, useAuth, type UserRole } from './auth';

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
    return <Navigate to={`/login?role=${allowedRole}&next=${next}`} replace />;
  }

  if (session.role !== allowedRole) {
    return <Navigate to={roleHomePath(session.role)} replace />;
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
      <Route path="/logout" element={<LogoutRoute />} />
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
          />
        }
      />
      <Route
        path="/terms"
        element={
          <SquashInfoPage
            title="Terms of Service"
            description="Review SQUASH terms, responsibilities, and usage guidelines for developers and testers."
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
        path="/dashboard"
        element={
          <ProtectedRoute allowedRole="developer">
            <SquashDeveloperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/post-job"
        element={
          <ProtectedRoute allowedRole="developer">
            <SquashPostJobPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report-details"
        element={
          <ProtectedRoute allowedRole="developer">
            <SquashReportDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute allowedRole="developer">
            <SquashDeveloperBillingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/jobs"
        element={
          <ProtectedRoute allowedRole="developer">
            <SquashDeveloperJobsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/submissions"
        element={
          <ProtectedRoute allowedRole="developer">
            <SquashDeveloperSubmissionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/activity"
        element={
          <ProtectedRoute allowedRole="developer">
            <SquashDeveloperActivityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report-details/attachments"
        element={
          <ProtectedRoute allowedRole="developer">
            <SquashReportAttachmentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tester/dashboard"
        element={
          <ProtectedRoute allowedRole="tester">
            <SquashTesterDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tester-jobs"
        element={
          <ProtectedRoute allowedRole="tester">
            <SquashTesterJobBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/active-test"
        element={
          <ProtectedRoute allowedRole="tester">
            <SquashActiveTestScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tester/profile"
        element={
          <ProtectedRoute allowedRole="tester">
            <SquashTesterProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tester/earnings"
        element={
          <ProtectedRoute allowedRole="tester">
            <SquashTesterEarningsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tester/payments"
        element={
          <ProtectedRoute allowedRole="tester">
            <SquashTesterEarningsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tester/reports"
        element={
          <ProtectedRoute allowedRole="tester">
            <SquashTesterReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tester/submissions"
        element={
          <ProtectedRoute allowedRole="tester">
            <SquashTesterReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tester/settings"
        element={
          <ProtectedRoute allowedRole="tester">
            <SquashTesterSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<SquashNotFoundPage />} />
    </Routes>
  );
}

export function routeBelongsToRole(pathname: string, role: UserRole): boolean {
  const target = routeRole(pathname);
  return target === 'public' || target === role;
}
