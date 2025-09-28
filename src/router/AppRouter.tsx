import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Protected from '../components/route_protection/Protected';
import SuperProtected from '../components/route_protection/SuperProtected';
import SchoolAdminRoute from '../components/route_protection/SchoolAdminRoute';
import NotFoundPage from '../pages/NotFoundPage';
import BigSpinner from '../components/ui/BigSpinner';

/* 
AUTHENTICATION PAGES: These are the pages that are used for the signup and login process
*/
const AuthenticationPage = React.lazy(() => import('../pages/authentication_pages/AuthenticationPage'));
const AuthActionPage = React.lazy(() => import('../pages/authentication_pages/AuthActionPage'));
const VerifyEmailErrorPage = React.lazy(() => import('../pages/authentication_pages/VerifyEmailErrorPage'));
const ResetPasswordPage = React.lazy(() => import('../pages/authentication_pages/ResetPasswordPage'));

/*
TESTING PAGES: These are the pages for serving the exam
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
const ExamsPage = React.lazy(() => import('../pages/dashboard_pages/ExamsPage'));
const BillingPage = React.lazy(() => import('../pages/dashboard_pages/BillingPage'));

/*
SCHOOL ADMIN PAGES: These are the pages for school administrators
*/
const SchoolAdminPageWrapper = React.lazy(() => import('../components/school_admin/SchoolAdminPageWrapper'));
const SchoolAdminDashboardPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminDashboardPage'));
const SchoolAdminStudentsPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminStudentsPage'));
const SchoolAdminAnalyticsPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminAnalyticsPage'));
const SchoolAdminSettingsPage = React.lazy(() => import('../pages/school_admin_pages/SchoolAdminSettingsPage'));

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
              <AuthenticationPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />

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
        
        {/* Exam Routes */}
        <Route
          path="/exams"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <ExamsPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route
          path="/exams/available"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <ExamsPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route
          path="/exams/completed"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <ExamsPage />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route
          path="/exams/analysis"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <ExamsPage />
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
        {/* ------------------------------ SCHOOL ADMIN ROUTES END HERE ---------------------- */}
        
        {/* ------------------------------   ANY OTHER ROUTES HERE    ---------------------- */}
        <Route path="*" element={<NotFoundPage/>} />
        {/* ------------------------------   ANY OTHER ROUTES END HERE    ---------------------- */}
      </Routes>
    </Router>
  );
};

export default AppRouter;