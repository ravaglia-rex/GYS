import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import Protected from '../components/route_protection/Protected';
import SchoolAdminRoute from '../components/route_protection/SchoolAdminRoute';
import PlatformAdminRoute from '../components/route_protection/PlatformAdminRoute';
import PlatformAdminSuperRoute from '../components/route_protection/PlatformAdminSuperRoute';
import NotFoundPage from '../pages/NotFoundPage';
import BigSpinner from '../components/ui/BigSpinner';
import StudentRegistrationFlowLayout from '../layouts/StudentRegistrationFlowLayout';

/*
LANDING AND PUBLIC PAGES
*/
const LandingPage = React.lazy(() => import('../pages/landing/LandingPage'));
const ForSchoolsPage = React.lazy(() => import('../pages/landing/ForSchoolsPage'));
const SchoolRegistrationPage = React.lazy(
  () => import('../pages/landing/SchoolRegistrationPage')
);
const SchoolPaymentPage = React.lazy(() => import('../pages/landing/SchoolPaymentPage'));
const SignupChoicePage = React.lazy(() => import('../pages/landing/SignupChoicePage'));
const StudentPathPage = React.lazy(() => import('../pages/landing/StudentPathPage'));
const PublicAssessmentsPage = React.lazy(() => import('../pages/landing/PublicAssessmentsPage'));

const SchoolPreviewLayout = React.lazy(() => import('../layouts/SchoolPreviewLayout'));
const SchoolPreviewHubPage = React.lazy(() => import('../pages/landing/preview/SchoolPreviewHubPage'));
const SchoolPreviewAssessmentPage = React.lazy(
  () => import('../pages/landing/preview/SchoolPreviewAssessmentPage')
);
const StudentPreviewLayout = React.lazy(() => import('../layouts/StudentPreviewLayout'));
const StudentPreviewDashboardPage = React.lazy(
  () => import('../pages/landing/preview/StudentPreviewDashboardPage')
);
const StudentPreviewLeaderboardPage = React.lazy(
  () => import('../pages/landing/preview/StudentPreviewLeaderboardPage')
);
const StudentPreviewHowItWorksPage = React.lazy(
  () => import('../pages/landing/preview/StudentPreviewHowItWorksPage')
);
const StudentPreviewPracticePage = React.lazy(
  () => import('../pages/landing/preview/StudentPreviewPracticePage')
);
const StudentPreviewAssessmentsPage = React.lazy(
  () => import('../pages/landing/preview/StudentPreviewAssessmentsPage')
);
const StudentPreviewBillingPage = React.lazy(
  () => import('../pages/landing/preview/StudentPreviewBillingPage')
);
const StudentPreviewSettingsPage = React.lazy(
  () => import('../pages/landing/preview/StudentPreviewSettingsPage')
);

/*
AUTHENTICATION PAGES: These are the pages that are used for the signup and login process
*/
const LoginPage = React.lazy(() => import('../pages/authentication_pages/LoginPage'));
const StudentRegistrationPage = React.lazy(() => import('../pages/authentication_pages/StudentRegistrationPage'));
const StudentSchoolStepPage = React.lazy(() => import('../pages/authentication_pages/StudentSchoolStepPage'));
const StudentMembershipStepPage = React.lazy(() => import('../pages/authentication_pages/StudentMembershipStepPage'));
const StudentPaymentPage = React.lazy(() => import('../pages/authentication_pages/StudentPaymentPage'));
const StudentWelcomePage = React.lazy(() => import('../pages/authentication_pages/StudentWelcomePage'));
const AuthActionPage = React.lazy(() => import('../pages/authentication_pages/AuthActionPage'));
const VerifyEmailErrorPage = React.lazy(() => import('../pages/authentication_pages/VerifyEmailErrorPage'));
const ResetPasswordPage = React.lazy(() => import('../pages/authentication_pages/ResetPasswordPage'));

/*
DASHBOARD PAGES: These are the pages that are used for the dashboard
*/
const DashboardPage = React.lazy(() => import('../pages/dashboard_pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('../pages/dashboard_pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('../pages/dashboard_pages/SettingsPage'));
const AssessmentsPage = React.lazy(() => import('../pages/dashboard_pages/AssessmentsPage'));
const BillingPage = React.lazy(() => import('../pages/dashboard_pages/BillingPage'));
const ReportsPage = React.lazy(() => import('../pages/dashboard_pages/ReportsPage'));
const LeaderboardPage = React.lazy(() => import('../pages/dashboard_pages/LeaderboardPage'));
const HowItWorksPage = React.lazy(() => import('../pages/dashboard_pages/HowItWorksPage'));
const PracticeTestPage = React.lazy(() => import('../pages/dashboard_pages/PracticeTestPage'));
const PracticeTakePage = React.lazy(() => import('../pages/dashboard_pages/PracticeTakePage'));
const QuestionOfTheDayPage = React.lazy(() => import('../pages/dashboard_pages/QuestionOfTheDayPage'));
const RewardsShopPage = React.lazy(() => import('../pages/dashboard_pages/RewardsShopPage'));
const AssessmentTakePage = React.lazy(() => import('../pages/dashboard_pages/AssessmentTakePage'));
const AssessmentResultPage = React.lazy(() => import('../pages/dashboard_pages/AssessmentResultPage'));
const AssessmentDetailPage = React.lazy(() => import('../pages/dashboard_pages/AssessmentDetailPage'));
const AssessmentResultDetailPage = React.lazy(() => import('../pages/dashboard_pages/AssessmentResultDetailPage'));

/*
SCHOOL ADMIN PAGES: These are the pages for school administrators
*/
const SchoolAdminPageWrapper = React.lazy(() => import('../components/school_admin/SchoolAdminPageWrapper'));
const SchoolAdminDashboardPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminDashboardPage'));
const SchoolAdminStudentsPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminStudentsPage'));
const SchoolAdminAnalyticsPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminAnalyticsPage'));
const SchoolAdminSettingsPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminSettingsPage'));
const SchoolAdminReportsPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminReportsPage'));
const SchoolAdminAlertsPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminAlertsPage'));
const SchoolAdminSubscriptionPage = React.lazy(() =>
  import('../pages/school_admin_pages/SchoolAdminSubscriptionPage').then((m) => ({
    default: m.SchoolAdminSubscriptionPage,
  }))
);
const SchoolAdminStudentDetailPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminStudentDetailPage'));

/*
PLATFORM ADMIN PAGES: Internal ops dashboard for Argus team
*/
const PlatformAdminLayout = React.lazy(() => import('../layouts/PlatformAdminLayout'));
const PlatformAdminDashboardPage = React.lazy(() => import('../pages/platform_admin_pages/PlatformAdminDashboardPage'));
const PlatformAdminSchoolsPage = React.lazy(() => import('../pages/platform_admin_pages/PlatformAdminSchoolsPage'));
const PlatformAdminSchoolDetailPage = React.lazy(() => import('../pages/platform_admin_pages/PlatformAdminSchoolDetailPage'));
const PlatformAdminRewardsPage = React.lazy(() => import('../pages/platform_admin_pages/PlatformAdminRewardsPage'));
const PlatformAdminStudentsPage = React.lazy(() => import('../pages/platform_admin_pages/PlatformAdminStudentsPage'));
const PlatformAdminStudentDetailPage = React.lazy(() => import('../pages/platform_admin_pages/PlatformAdminStudentDetailPage'));
const PlatformAdminPipelinePage = React.lazy(() => import('../pages/platform_admin_pages/PlatformAdminPipelinePage'));
const PlatformAdminAdminsPage = React.lazy(() => import('../pages/platform_admin_pages/PlatformAdminAdminsPage'));

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
            element={<Navigate to="/for-schools/preview/assessment/symbolic_reasoning" replace />}
          />
          <Route
            path="assessment/:examId"
            element={
              <Suspense fallback={<BigSpinner/>}>
                <SchoolPreviewAssessmentPage />
              </Suspense>
            }
          />
          <Route path="exam" element={<Navigate to="/for-schools/preview/assessment/symbolic_reasoning" replace />} />
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
        <Route 
          path="/dashboard" 
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <DashboardPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/leaderboard"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner />}>
                <LeaderboardPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/how-it-works"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner />}>
                <HowItWorksPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/practice-test/session/:examId/:level"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner />}>
                <PracticeTakePage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/practice-test"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner />}>
                <PracticeTestPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/question-of-the-day"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner />}>
                <QuestionOfTheDayPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/rewards"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner />}>
                <RewardsShopPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        
        {/* Assessment list routes */}
        <Route
          path="/assessments"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <AssessmentsPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route
          path="/assessments/available"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <AssessmentsPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route
          path="/assessments/completed"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <AssessmentsPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/assessments/reports"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <ReportsPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        <Route path="/exams" element={<Navigate to="/assessments/available" replace />} />
        <Route path="/exams/available" element={<Navigate to="/assessments/available" replace />} />
        <Route path="/exams/completed" element={<Navigate to="/assessments/completed" replace />} />
        
        {/* Assessment Routes */}
        <Route
          path="/assessments/:assessmentId/tier/:tierNumber/detail"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <AssessmentDetailPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/assessments/:assessmentId/tier/:tierNumber/take"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <AssessmentTakePage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/assessments/:assessmentId/result"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <AssessmentResultPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/assessments/:assessmentId/result/details"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <AssessmentResultDetailPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        {/* Reports Route */}
        <Route
          path="/reports"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <ReportsPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        {/* Payment Routes */}
        <Route
          path="/payments"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <BillingPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        
        {/* Profile and Settings Routes */}
        <Route
          path="/profile"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <ProfilePage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route
          path="/settings"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <SettingsPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        
        {/* ------------------------------ SCHOOL ADMIN ROUTES HERE ---------------------- */}
        <Route 
          path="/school-admin/dashboard" 
          element={
            <SchoolAdminRoute>
              <Suspense fallback={<BigSpinner/>}>
                <SchoolAdminPageWrapper>
                  <SchoolAdminDashboardPage />
                </SchoolAdminPageWrapper>
              </Suspense>
            </SchoolAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route 
          path="/school-admin/students" 
          element={
            <SchoolAdminRoute>
              <Suspense fallback={<BigSpinner/>}>
                <SchoolAdminPageWrapper>
                  <SchoolAdminStudentsPage />
                </SchoolAdminPageWrapper>
              </Suspense>
            </SchoolAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/school-admin/students/:studentId"
          element={
            <SchoolAdminRoute>
              <Suspense fallback={<BigSpinner />}>
                <SchoolAdminPageWrapper>
                  <SchoolAdminStudentDetailPage />
                </SchoolAdminPageWrapper>
              </Suspense>
            </SchoolAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route 
          path="/school-admin/analytics" 
          element={
            <SchoolAdminRoute>
              <Suspense fallback={<BigSpinner/>}>
                <SchoolAdminPageWrapper>
                  <SchoolAdminAnalyticsPage />
                </SchoolAdminPageWrapper>
              </Suspense>
            </SchoolAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/school-admin/invitations"
          element={<Navigate to="/school-admin/students" replace />}
        />

        <Route
          path="/school-admin/student-emails"
          element={<Navigate to="/school-admin/students" replace />}
        />
        
        <Route 
          path="/school-admin/settings" 
          element={
            <SchoolAdminRoute>
              <Suspense fallback={<BigSpinner/>}>
                <SchoolAdminPageWrapper>
                  <SchoolAdminSettingsPage />
                </SchoolAdminPageWrapper>
              </Suspense>
            </SchoolAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />

        <Route 
          path="/school-admin/reports" 
          element={
            <SchoolAdminRoute>
              <Suspense fallback={<BigSpinner/>}>
                <SchoolAdminPageWrapper>
                  <SchoolAdminReportsPage />
                </SchoolAdminPageWrapper>
              </Suspense>
            </SchoolAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />

        <Route 
          path="/school-admin/alerts" 
          element={
            <SchoolAdminRoute>
              <Suspense fallback={<BigSpinner/>}>
                <SchoolAdminPageWrapper>
                  <SchoolAdminAlertsPage />
                </SchoolAdminPageWrapper>
              </Suspense>
            </SchoolAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />

        <Route 
          path="/school-admin/subscription" 
          element={
            <SchoolAdminRoute>
              <Suspense fallback={<BigSpinner/>}>
                <SchoolAdminPageWrapper>
                  <SchoolAdminSubscriptionPage />
                </SchoolAdminPageWrapper>
              </Suspense>
            </SchoolAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />
        {/* ------------------------------ SCHOOL ADMIN ROUTES END HERE ---------------------- */}

        {/* ------------------------------ PLATFORM ADMIN ROUTES ---------------------- */}
        <Route
          path="/platform-admin/dashboard"
          element={
            <PlatformAdminRoute>
              <Suspense fallback={<BigSpinner />}>
                <PlatformAdminLayout>
                  <PlatformAdminDashboardPage />
                </PlatformAdminLayout>
              </Suspense>
            </PlatformAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/platform-admin/schools"
          element={
            <PlatformAdminRoute>
              <Suspense fallback={<BigSpinner />}>
                <PlatformAdminLayout>
                  <PlatformAdminSchoolsPage />
                </PlatformAdminLayout>
              </Suspense>
            </PlatformAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/platform-admin/schools/:schoolId"
          element={
            <PlatformAdminRoute>
              <Suspense fallback={<BigSpinner />}>
                <PlatformAdminLayout>
                  <PlatformAdminSchoolDetailPage />
                </PlatformAdminLayout>
              </Suspense>
            </PlatformAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/platform-admin/rewards"
          element={
            <PlatformAdminRoute>
              <Suspense fallback={<BigSpinner />}>
                <PlatformAdminLayout>
                  <PlatformAdminRewardsPage />
                </PlatformAdminLayout>
              </Suspense>
            </PlatformAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/platform-admin/students"
          element={
            <PlatformAdminRoute>
              <Suspense fallback={<BigSpinner />}>
                <PlatformAdminLayout>
                  <PlatformAdminStudentsPage />
                </PlatformAdminLayout>
              </Suspense>
            </PlatformAdminRoute>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/platform-admin/students/:studentId"
          element={
            <PlatformAdminSuperRoute>
              <Suspense fallback={<BigSpinner />}>
                <PlatformAdminLayout>
                  <PlatformAdminStudentDetailPage />
                </PlatformAdminLayout>
              </Suspense>
            </PlatformAdminSuperRoute>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/platform-admin/pipelines"
          element={
            <PlatformAdminSuperRoute>
              <Suspense fallback={<BigSpinner />}>
                <PlatformAdminLayout>
                  <PlatformAdminPipelinePage />
                </PlatformAdminLayout>
              </Suspense>
            </PlatformAdminSuperRoute>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path="/platform-admin/admins"
          element={
            <PlatformAdminSuperRoute>
              <Suspense fallback={<BigSpinner />}>
                <PlatformAdminLayout>
                  <PlatformAdminAdminsPage />
                </PlatformAdminLayout>
              </Suspense>
            </PlatformAdminSuperRoute>
          }
          errorElement={<NotFoundPage />}
        />
        <Route path="/platform-admin" element={<Navigate to="/platform-admin/dashboard" replace />} />
        {/* ------------------------------ PLATFORM ADMIN ROUTES END ---------------------- */}
        
        {/* ------------------------------   ANY OTHER ROUTES HERE    ---------------------- */}
        <Route path="*" element={<NotFoundPage/>} />
        {/* ------------------------------   ANY OTHER ROUTES END HERE    ---------------------- */}
      </Routes>
    </Router>
  );
};

export default AppRouter;