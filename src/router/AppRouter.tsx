import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import Protected from '../components/route_protection/Protected';
import SuperProtected from '../components/route_protection/SuperProtected';
import SchoolAdminRoute from '../components/route_protection/SchoolAdminRoute';
import NotFoundPage from '../pages/NotFoundPage';
import BigSpinner from '../components/ui/BigSpinner';
import PreviewStubPage from '../pages/landing/preview/PreviewStubPage';
import StudentRegistrationFlowLayout from '../layouts/StudentRegistrationFlowLayout';

/*
LANDING AND PUBLIC PAGES
*/
const LandingPage = React.lazy(() => import('../pages/landing/LandingPage'));
const ForSchoolsPage = React.lazy(() => import('../pages/landing/ForSchoolsPage'));
const InstitutionDemoRequestPage = React.lazy(
  () => import('../pages/landing/InstitutionDemoRequestPage')
);
const SchoolRegistrationPage = React.lazy(
  () => import('../pages/landing/SchoolRegistrationPage')
);
const StudentPathPage = React.lazy(() => import('../pages/landing/StudentPathPage'));

const SchoolPreviewLayout = React.lazy(() => import('../layouts/SchoolPreviewLayout'));
const SchoolPreviewHubPage = React.lazy(() => import('../pages/landing/preview/SchoolPreviewHubPage'));
const SchoolPreviewAssessmentPage = React.lazy(
  () => import('../pages/landing/preview/SchoolPreviewAssessmentPage')
);
const StudentPreviewLayout = React.lazy(() => import('../layouts/StudentPreviewLayout'));
const StudentPreviewDashboardPage = React.lazy(
  () => import('../pages/landing/preview/StudentPreviewDashboardPage')
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
TESTING PAGES: These are the pages for serving assessments
*/
const TestingPage = React.lazy(() => import('../pages/testing_page/TestingPage'));
const TestingPhase2Page = React.lazy(() => import('../pages/testing_page/TestingPhase2Page'));
const CameraError = React.lazy(() => import('../pages/error_pages/CameraError'));
const WebcamOverlayPage = React.lazy(() => import('../pages/testing_page/WebcamOverlayPage'));
const EntityDetectionError = React.lazy(() => import('../pages/error_pages/EntityDetectionError'));
const PoseDetectionError = React.lazy(() => import('../pages/error_pages/PoseDetectionError'));
const FaceLandmarksError = React.lazy(() => import('../pages/error_pages/FaceLandmarksError'));
const SpeedTestError = React.lazy(() => import('../pages/error_pages/SpeedTestError'));
const AudioErrorPage = React.lazy(() => import('../pages/error_pages/AudioErrorPage'));
const LightingErrorPage = React.lazy(() => import('../pages/error_pages/LightingErrorPage'));
const LocalStorageErrorPage = React.lazy(() => import('../pages/error_pages/LocalStorageErrorPage'));

/*
DASHBOARD PAGES: These are the pages that are used for the dashboard
*/
const DashboardPage = React.lazy(() => import('../pages/dashboard_pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('../pages/dashboard_pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('../pages/dashboard_pages/SettingsPage'));
const AssessmentsPage = React.lazy(() => import('../pages/dashboard_pages/AssessmentsPage'));
const BillingPage = React.lazy(() => import('../pages/dashboard_pages/BillingPage'));
const ReportsPage = React.lazy(() => import('../pages/dashboard_pages/ReportsPage'));
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
const SchoolAdminSubscriptionPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminSubscriptionPage'));
const SchoolAdminStudentDetailPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminStudentDetailPage'));

/*
CAMERA AND MICROPHONE ACCESS PAGE: This page is used to check if the camera and microphone are working
*/
const CameraMicrophoneAccess = React.lazy(() => import('../components/proctoring_components/CameraMicrophoneAccess'));

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
          path="/login"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <LoginPage />
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
            path="assessments/completed"
            element={
              <PreviewStubPage
                title="Completed & Results"
                body="After you sign in, finished assessments and score history appear here. In this preview, open Dashboard to explore the sample performance chart and assessment cards."
                backPath="/students/preview/dashboard"
                backLabel="Back to Dashboard"
              />
            }
          />
          <Route
            path="reports"
            element={
              <PreviewStubPage
                title="Reports"
                body="Signed-in students can download and review official reports here. Register and log in to generate reports from your real results."
                backPath="/students/preview/dashboard"
                backLabel="Back to Dashboard"
              />
            }
          />
          <Route
            path="payments"
            element={
              <PreviewStubPage
                title="Billing & Payments"
                body="Manage membership and payment history in the live portal after you create an account."
                backPath="/students/preview/dashboard"
                backLabel="Back to Dashboard"
              />
            }
          />
          <Route
            path="settings"
            element={
              <PreviewStubPage
                title="Settings"
                body="Update your profile, password, and preferences here once you are logged in."
                backPath="/students/preview/dashboard"
                backLabel="Back to Dashboard"
              />
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
          path="/for-schools/demo-request"
          element={
            <Suspense fallback={<BigSpinner/>}>
              <InstitutionDemoRequestPage />
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
          {/* Full-screen sample exam (no admin sidebar), mirrors student Pattern and Logic take UI */}
          <Route
            path="assessment"
            element={
              <Suspense fallback={<BigSpinner/>}>
                <SchoolPreviewAssessmentPage />
              </Suspense>
            }
          />
          <Route path="exam" element={<Navigate to="/for-schools/preview/assessment" replace />} />
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
        
        {/* ------------------------------ TESTING PAGE ROUTES ------------------------------ */}
        <Route 
          path="/camera-microphone-access" 
          element={
            <SuperProtected>
              <Suspense fallback={<BigSpinner/>}>
                <CameraMicrophoneAccess />
              </Suspense>
            </SuperProtected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path="/webcam-overlay"
          element={
            <SuperProtected>
              <Suspense fallback={<BigSpinner/>}>
                <WebcamOverlayPage />
              </Suspense>
            </SuperProtected>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route 
          path="/testing" 
          element={
            <SuperProtected>
              <Suspense fallback={<BigSpinner/>}>
                <TestingPage />
              </Suspense>
            </SuperProtected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route 
          path="/testing-phase2" 
          element={
            <SuperProtected>
              <Suspense fallback={<BigSpinner/>}>
                <TestingPhase2Page />
              </Suspense>
            </SuperProtected>
          }
          errorElement={<NotFoundPage />}
        />

        {/* ------------------------------ ERROR PAGE ROUTES HERE ---------------------- */}
        <Route 
          path="/camera_error" 
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <CameraError />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        <Route 
          path="/lighting_error" 
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <LightingErrorPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        <Route 
          path="/entity_model_error" 
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <EntityDetectionError />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        <Route 
          path='/pose_model_error'
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <PoseDetectionError />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route
          path='/face_landmarks_model_error'
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <FaceLandmarksError />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        <Route
          path='/internet_speed_error'
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <SpeedTestError />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        <Route 
          path='/audio_error'
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <AudioErrorPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />

        <Route 
          path='/local-storage-error'
          element={
            <Suspense fallback={<BigSpinner/>}>
              <LocalStorageErrorPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        {/* ------------------------------ ERROR PAGE ROUTES END HERE ---------------------- */}
        
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
        
        {/* ------------------------------   ANY OTHER ROUTES HERE    ---------------------- */}
        <Route path="*" element={<NotFoundPage/>} />
        {/* ------------------------------   ANY OTHER ROUTES END HERE    ---------------------- */}
      </Routes>
    </Router>
  );
};

export default AppRouter;