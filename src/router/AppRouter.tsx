import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate, useLocation, useParams } from 'react-router-dom';
import Protected from '../components/route_protection/Protected';
import SchoolAdminRoute from '../components/route_protection/SchoolAdminRoute';
import PlatformAdminRoute from '../components/route_protection/PlatformAdminRoute';
import PlatformAdminSuperRoute from '../components/route_protection/PlatformAdminSuperRoute';
import PlatformAdminAnalyticsRoute from '../components/route_protection/PlatformAdminAnalyticsRoute';
import NotFoundPage from '../pages/NotFoundPage';
import BigSpinner from '../components/ui/BigSpinner';
import StudentRegistrationFlowLayout from '../layouts/StudentRegistrationFlowLayout';
import { lazyWithRetry as lazy } from '../utils/lazyWithRetry';
import {
  ANALYTICAL_REASONING_ASSESSMENT_ID,
  LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID,
} from '../utils/assessmentIdCompat';

/** Old Exam 1 bookmarks used the legacy assessment id in the path. */
function LegacyAnalyticalExamRedirect({ rest }: { rest: 'detail' | 'take' }) {
  const { tierNumber } = useParams<{ tierNumber: string }>();
  const tier = tierNumber && /^\d+$/.test(tierNumber) ? tierNumber : '1';
  return (
    <Navigate
      to={`/assessments/${ANALYTICAL_REASONING_ASSESSMENT_ID}/tier/${tier}/${rest}`}
      replace
    />
  );
}

function PlatformAdminLegacyItemBankRedirect() {
  const location = useLocation();
  return <Navigate to={`/platform-admin/item-bank${location.search}`} replace />;
}

function StudentProtectedShell() {
  return (
    <Protected>
      <Suspense fallback={<BigSpinner />}>
        <Outlet />
      </Suspense>
    </Protected>
  );
}

function SchoolAdminShell() {
  return (
    <SchoolAdminRoute>
      <Suspense fallback={<BigSpinner />}>
        <SchoolAdminPageWrapper>
          <Outlet />
        </SchoolAdminPageWrapper>
      </Suspense>
    </SchoolAdminRoute>
  );
}

function PlatformAdminShell() {
  return (
    <PlatformAdminRoute>
      <Suspense fallback={<BigSpinner />}>
        <PlatformAdminLayout>
          <Outlet />
        </PlatformAdminLayout>
      </Suspense>
    </PlatformAdminRoute>
  );
}

/*
LANDING AND PUBLIC PAGES
*/
const LandingPage = lazy(() => import('../pages/landing/LandingPage'));
const ForSchoolsPage = lazy(() => import('../pages/landing/ForSchoolsPage'));
const SchoolRegistrationPage = lazy(
  () => import('../pages/landing/SchoolRegistrationPage')
);
const SchoolLegalDocumentPage = lazy(
  () => import('../pages/landing/SchoolLegalDocumentPage')
);
const SchoolPaymentPage = lazy(() => import('../pages/landing/SchoolPaymentPage'));
const SignupChoicePage = lazy(() => import('../pages/landing/SignupChoicePage'));
const StudentPathPage = lazy(() => import('../pages/landing/StudentPathPage'));
const PublicAssessmentsPage = lazy(() => import('../pages/landing/PublicAssessmentsPage'));

const SchoolPreviewLayout = lazy(() => import('../layouts/SchoolPreviewLayout'));
const SchoolPreviewHubPage = lazy(() => import('../pages/landing/preview/SchoolPreviewHubPage'));
const SchoolPreviewAssessmentPage = lazy(
  () => import('../pages/landing/preview/SchoolPreviewAssessmentPage')
);
const StudentPreviewLayout = lazy(() => import('../layouts/StudentPreviewLayout'));
const StudentPreviewDashboardPage = lazy(
  () => import('../pages/landing/preview/StudentPreviewDashboardPage')
);
const StudentPreviewLeaderboardPage = lazy(
  () => import('../pages/landing/preview/StudentPreviewLeaderboardPage')
);
const StudentPreviewHowItWorksPage = lazy(
  () => import('../pages/landing/preview/StudentPreviewHowItWorksPage')
);
const StudentPreviewPracticePage = lazy(
  () => import('../pages/landing/preview/StudentPreviewPracticePage')
);
const StudentPreviewAssessmentsPage = lazy(
  () => import('../pages/landing/preview/StudentPreviewAssessmentsPage')
);
const StudentPreviewBillingPage = lazy(
  () => import('../pages/landing/preview/StudentPreviewBillingPage')
);
const StudentPreviewSettingsPage = lazy(
  () => import('../pages/landing/preview/StudentPreviewSettingsPage')
);

/*
AUTHENTICATION PAGES: These are the pages that are used for the signup and login process
*/
const LoginPage = lazy(() => import('../pages/authentication_pages/LoginPage'));
const StudentRegistrationPage = lazy(() => import('../pages/authentication_pages/StudentRegistrationPage'));
const StudentSchoolStepPage = lazy(() => import('../pages/authentication_pages/StudentSchoolStepPage'));
const StudentMembershipStepPage = lazy(() => import('../pages/authentication_pages/StudentMembershipStepPage'));
const StudentPaymentPage = lazy(() => import('../pages/authentication_pages/StudentPaymentPage'));
const StudentWelcomePage = lazy(() => import('../pages/authentication_pages/StudentWelcomePage'));
const AuthActionPage = lazy(() => import('../pages/authentication_pages/AuthActionPage'));
const VerifyEmailErrorPage = lazy(() => import('../pages/authentication_pages/VerifyEmailErrorPage'));
const ResetPasswordPage = lazy(() => import('../pages/authentication_pages/ResetPasswordPage'));

/*
DASHBOARD PAGES: These are the pages that are used for the dashboard
*/
const DashboardPage = lazy(() => import('../pages/dashboard_pages/DashboardPage'));
const ProfilePage = lazy(() => import('../pages/dashboard_pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/dashboard_pages/SettingsPage'));
const AssessmentsPage = lazy(() => import('../pages/dashboard_pages/AssessmentsPage'));
const BillingPage = lazy(() => import('../pages/dashboard_pages/BillingPage'));
const ReportsPage = lazy(() => import('../pages/dashboard_pages/ReportsPage'));
const LeaderboardPage = lazy(() => import('../pages/dashboard_pages/LeaderboardPage'));
const HowItWorksPage = lazy(() => import('../pages/dashboard_pages/HowItWorksPage'));
const PracticeTestPage = lazy(() => import('../pages/dashboard_pages/PracticeTestPage'));
const PracticeTakePage = lazy(() => import('../pages/dashboard_pages/PracticeTakePage'));
const QuestionOfTheDayPage = lazy(() => import('../pages/dashboard_pages/QuestionOfTheDayPage'));
const RewardsShopPage = lazy(() => import('../pages/dashboard_pages/RewardsShopPage'));
const AssessmentTakePage = lazy(() => import('../pages/dashboard_pages/AssessmentTakePage'));
const AssessmentResultPage = lazy(() => import('../pages/dashboard_pages/AssessmentResultPage'));
const AssessmentDetailPage = lazy(() => import('../pages/dashboard_pages/AssessmentDetailPage'));
const AssessmentResultDetailPage = lazy(() => import('../pages/dashboard_pages/AssessmentResultDetailPage'));

/*
SCHOOL ADMIN PAGES: These are the pages for school administrators
*/
const SchoolAdminPageWrapper = lazy(() => import('../components/school_admin/SchoolAdminPageWrapper'));
const SchoolAdminDashboardPage = lazy(() => import('../pages/school_admin_pages/SchoolAdminDashboardPage'));
const SchoolAdminStudentsPage = lazy(() => import('../pages/school_admin_pages/SchoolAdminStudentsPage'));
const SchoolAdminAnalyticsPage = lazy(() => import('../pages/school_admin_pages/SchoolAdminAnalyticsPage'));
const SchoolAdminSettingsPage = lazy(() => import('../pages/school_admin_pages/SchoolAdminSettingsPage'));
const SchoolAdminReportsPage = lazy(() => import('../pages/school_admin_pages/SchoolAdminReportsPage'));
const SchoolAdminAlertsPage = lazy(() => import('../pages/school_admin_pages/SchoolAdminAlertsPage'));
const SchoolAdminSubscriptionPage = lazy(() =>
  import('../pages/school_admin_pages/SchoolAdminSubscriptionPage').then((m) => ({
    default: m.SchoolAdminSubscriptionPage,
  }))
);
const SchoolAdminStudentDetailPage = lazy(() => import('../pages/school_admin_pages/SchoolAdminStudentDetailPage'));

/*
PLATFORM ADMIN PAGES: Internal ops dashboard for Argus team
*/
const PlatformAdminLayout = lazy(() => import('../layouts/PlatformAdminLayout'));
const PlatformAdminSchoolsPage = lazy(() => import('../pages/platform_admin_pages/PlatformAdminSchoolsPage'));
const PlatformAdminSchoolDetailPage = lazy(() => import('../pages/platform_admin_pages/PlatformAdminSchoolDetailPage'));
const PlatformAdminRewardsPage = lazy(() => import('../pages/platform_admin_pages/PlatformAdminRewardsPage'));
const PlatformAdminStudentsPage = lazy(() => import('../pages/platform_admin_pages/PlatformAdminStudentsPage'));
const PlatformAdminStudentDetailPage = lazy(() => import('../pages/platform_admin_pages/PlatformAdminStudentDetailPage'));
const PlatformAdminPipelinePage = lazy(() => import('../pages/platform_admin_pages/PlatformAdminPipelinePage'));
const PlatformAdminAdminsPage = lazy(() => import('../pages/platform_admin_pages/PlatformAdminAdminsPage'));
const PlatformAdminAnalyticsPage = lazy(() => import('../pages/platform_admin_pages/PlatformAdminAnalyticsPage'));
const PlatformAdminItemBankPage = lazy(() => import('../pages/platform_admin_pages/PlatformAdminItemBankPage'));
const PlatformAdminQuestionReportsPage = lazy(
  () => import('../pages/platform_admin_pages/PlatformAdminQuestionReportsPage')
);

const AppRouter: React.FC = () => {
  return (
    <Router>
      {/* ------------------------------ SIGNUP AND LOGIN ROUTES ------------------------------ */}
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <LandingPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/students"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <StudentPathPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/about/assessments"
          element={
            <Suspense fallback={<BigSpinner />}>
              <PublicAssessmentsPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route path="/about" element={<Navigate to="/" replace />} errorElement={<NotFoundPage />} />
        <Route
          path="/login"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <LoginPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/signup"
          element={
            <Suspense fallback={<BigSpinner />}>
              <SignupChoicePage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/students/register"
          element={<StudentRegistrationFlowLayout />}
          errorElement={<NotFoundPage />}
        >
          <Route
            index
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentRegistrationPage />
              </Suspense>
            }
          />
          <Route
            path="school"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentSchoolStepPage />
              </Suspense>
            }
          />
          <Route
            path="membership"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentMembershipStepPage />
              </Suspense>
            }
          />
          <Route
            path="payment"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentPaymentPage />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/students/register/welcome"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <StudentWelcomePage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/students/preview"
          element={
            <Suspense fallback={<BigSpinner />}>
              <StudentPreviewLayout />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        >
          <Route index element={<Navigate to="/students/preview/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentPreviewDashboardPage />
              </Suspense>
            }
          />
          <Route
            path="leaderboard"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentPreviewLeaderboardPage />
              </Suspense>
            }
          />
          <Route
            path="how-it-works"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentPreviewHowItWorksPage />
              </Suspense>
            }
          />
          <Route
            path="practice"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentPreviewPracticePage />
              </Suspense>
            }
          />
          <Route
            path="assessments/available"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentPreviewAssessmentsPage />
              </Suspense>
            }
          />
          <Route
            path="assessments/completed"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentPreviewAssessmentsPage />
              </Suspense>
            }
          />
          <Route
            path="reports"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentPreviewAssessmentsPage />
              </Suspense>
            }
          />
          <Route
            path="payments"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentPreviewBillingPage />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<BigSpinner />}>
                <StudentPreviewSettingsPage />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/for-schools"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <ForSchoolsPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/for-schools/register"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <SchoolRegistrationPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/in/privacy/schools"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <SchoolLegalDocumentPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/in/terms/schools"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <SchoolLegalDocumentPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/in/data-processing/schools"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <SchoolLegalDocumentPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/for-schools/payment"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <SchoolPaymentPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />

        {/* Hub has no sidebar; workspace routes use SchoolPreviewLayout */}
        <Route path="/for-schools/preview" element={<Outlet />} errorElement={<NotFoundPage />}>
          <Route
            index
            element={
              <Suspense fallback={<BigSpinner/>}>
                <SchoolPreviewHubPage />
              </Suspense>
            }
          />
          {/* Full-screen sample exam (no admin sidebar), mirrors student take UI */}
          <Route
            path="assessment"
            element={<Navigate to="/for-schools/preview/assessment/analytical_reasoning" replace />}
          />
          <Route
            path="assessment/:examId"
            element={
              <Suspense fallback={<BigSpinner/>}>
                <SchoolPreviewAssessmentPage />
              </Suspense>
            }
          />
          <Route path="exam" element={<Navigate to="/for-schools/preview/assessment/analytical_reasoning" replace />} />
          <Route
            element={
              <Suspense fallback={<BigSpinner/>}>
                <SchoolPreviewLayout />
              </Suspense>
            }
          >
            <Route
              path="dashboard"
              element={
                <Suspense fallback={<BigSpinner/>}>
                  <SchoolAdminDashboardPage />
                </Suspense>
              }
            />
            <Route
              path="students"
              element={
                <Suspense fallback={<BigSpinner/>}>
                  <SchoolAdminStudentsPage />
                </Suspense>
              }
            />
            <Route
              path="students/:studentId"
              element={
                <Suspense fallback={<BigSpinner/>}>
                  <SchoolAdminStudentDetailPage />
                </Suspense>
              }
            />
            <Route
              path="reports"
              element={
                <Suspense fallback={<BigSpinner/>}>
                  <SchoolAdminReportsPage />
                </Suspense>
              }
            />
            <Route
              path="analytics"
              element={
                <Suspense fallback={<BigSpinner/>}>
                  <SchoolAdminAnalyticsPage />
                </Suspense>
              }
            />
            <Route path="student-emails" element={<Navigate to="/for-schools/preview/students" replace />} />
            <Route
              path="alerts"
              element={
                <Suspense fallback={<BigSpinner />}>
                  <SchoolAdminAlertsPage />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<BigSpinner />}>
                  <SchoolAdminSettingsPage />
                </Suspense>
              }
            />
            <Route
              path="subscription"
              element={
                <Suspense fallback={<BigSpinner />}>
                  <SchoolAdminSubscriptionPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route 
          path='/reset-password'
          element={
            <Suspense fallback={<BigSpinner/>}>
              <ResetPasswordPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />

        <Route 
          path='/auth/action'
          element={
            <Suspense fallback={<BigSpinner/>}>
              <AuthActionPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route 
          path='/auth/verify-email-error'
          element={
            <Suspense fallback={<BigSpinner/>}>
              <VerifyEmailErrorPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />

        {/* ------------------------------ SIGNUP AND LOGIN ROUTES END ------------------------------ */}
        {/* DASHBOARD ROUTES */}
        <Route element={<StudentProtectedShell />} errorElement={<NotFoundPage />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/practice-test/session/:examId/:level" element={<PracticeTakePage />} />
          <Route path="/practice-test" element={<PracticeTestPage />} />
          <Route path="/question-of-the-day" element={<QuestionOfTheDayPage />} />
          <Route path="/rewards" element={<RewardsShopPage />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/assessments/available" element={<AssessmentsPage />} />
          <Route path="/assessments/completed" element={<AssessmentsPage />} />
          <Route path="/assessments/reports" element={<ReportsPage />} />
          <Route path="/assessments/:assessmentId/tier/:tierNumber/detail" element={<AssessmentDetailPage />} />
          <Route path="/assessments/:assessmentId/tier/:tierNumber/take" element={<AssessmentTakePage />} />
          <Route path="/assessments/:assessmentId/result" element={<AssessmentResultPage />} />
          <Route path="/assessments/:assessmentId/result/details" element={<AssessmentResultDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/payments" element={<BillingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/exams" element={<Navigate to="/assessments/available" replace />} />
        <Route path="/exams/available" element={<Navigate to="/assessments/available" replace />} />
        <Route path="/exams/completed" element={<Navigate to="/assessments/completed" replace />} />

        {/* Legacy Exam 1 id redirects → analytical_reasoning */}
        <Route
          path={`/assessments/${LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID}/tier/:tierNumber/detail`}
          element={<LegacyAnalyticalExamRedirect rest="detail" />}
        />
        <Route
          path={`/assessments/${LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID}/tier/:tierNumber/take`}
          element={<LegacyAnalyticalExamRedirect rest="take" />}
        />
        <Route
          path={`/assessments/${LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID}/result`}
          element={<Navigate to={`/assessments/${ANALYTICAL_REASONING_ASSESSMENT_ID}/result`} replace />}
        />
        <Route
          path={`/assessments/${LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID}/result/details`}
          element={
            <Navigate to={`/assessments/${ANALYTICAL_REASONING_ASSESSMENT_ID}/result/details`} replace />
          }
        />
        <Route
          path={`/for-schools/preview/assessment/${LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID}`}
          element={
            <Navigate to={`/for-schools/preview/assessment/${ANALYTICAL_REASONING_ASSESSMENT_ID}`} replace />
          }
        />

        {/* ------------------------------ SCHOOL ADMIN ROUTES HERE ---------------------- */}
        <Route element={<SchoolAdminShell />} errorElement={<NotFoundPage />}>
          <Route path="/school-admin/dashboard" element={<SchoolAdminDashboardPage />} />
          <Route path="/school-admin/students" element={<SchoolAdminStudentsPage />} />
          <Route path="/school-admin/students/:studentId" element={<SchoolAdminStudentDetailPage />} />
          <Route path="/school-admin/analytics" element={<SchoolAdminAnalyticsPage />} />
          <Route path="/school-admin/settings" element={<SchoolAdminSettingsPage />} />
          <Route path="/school-admin/reports" element={<SchoolAdminReportsPage />} />
          <Route path="/school-admin/alerts" element={<SchoolAdminAlertsPage />} />
          <Route path="/school-admin/subscription" element={<SchoolAdminSubscriptionPage />} />
        </Route>
        <Route path="/school-admin/invitations" element={<Navigate to="/school-admin/students" replace />} />
        <Route path="/school-admin/student-emails" element={<Navigate to="/school-admin/students" replace />} />
        {/* ------------------------------ SCHOOL ADMIN ROUTES END HERE ---------------------- */}

        {/* ------------------------------ PLATFORM ADMIN ROUTES ---------------------- */}
        <Route path="/platform-admin/dashboard" element={<Navigate to="/platform-admin/schools" replace />} />
        <Route element={<PlatformAdminShell />} errorElement={<NotFoundPage />}>
          <Route path="/platform-admin/schools" element={<PlatformAdminSchoolsPage />} />
          <Route path="/platform-admin/schools/:schoolId" element={<PlatformAdminSchoolDetailPage />} />
          <Route path="/platform-admin/rewards" element={<PlatformAdminRewardsPage />} />
          <Route path="/platform-admin/students" element={<PlatformAdminStudentsPage />} />
          <Route
            path="/platform-admin/analytics/:section"
            element={
              <PlatformAdminAnalyticsRoute nested>
                <PlatformAdminAnalyticsPage />
              </PlatformAdminAnalyticsRoute>
            }
          />
          <Route
            path="/platform-admin/item-bank"
            element={
              <PlatformAdminAnalyticsRoute nested>
                <PlatformAdminItemBankPage />
              </PlatformAdminAnalyticsRoute>
            }
          />
          <Route
            path="/platform-admin/question-reports"
            element={
              <PlatformAdminAnalyticsRoute nested>
                <PlatformAdminQuestionReportsPage />
              </PlatformAdminAnalyticsRoute>
            }
          />
          <Route
            path="/platform-admin/students/:studentId"
            element={
              <PlatformAdminSuperRoute nested>
                <PlatformAdminStudentDetailPage />
              </PlatformAdminSuperRoute>
            }
          />
          <Route
            path="/platform-admin/pipelines"
            element={
              <PlatformAdminSuperRoute nested>
                <PlatformAdminPipelinePage />
              </PlatformAdminSuperRoute>
            }
          />
          <Route
            path="/platform-admin/admins"
            element={
              <PlatformAdminSuperRoute nested>
                <PlatformAdminAdminsPage />
              </PlatformAdminSuperRoute>
            }
          />
        </Route>
        <Route path="/platform-admin/analytics" element={<Navigate to="/platform-admin/analytics/official" replace />} />
        <Route
          path="/platform-admin/analytics/item-bank"
          element={<PlatformAdminLegacyItemBankRedirect />}
        />
        <Route path="/platform-admin" element={<Navigate to="/platform-admin/schools" replace />} />
        {/* ------------------------------ PLATFORM ADMIN ROUTES END ---------------------- */}
        
        {/* ------------------------------   ANY OTHER ROUTES HERE    ---------------------- */}
        <Route path="*" element={<NotFoundPage/>} />
        {/* ------------------------------   ANY OTHER ROUTES END HERE    ---------------------- */}
      </Routes>
    </Router>
  );
};

export default AppRouter;