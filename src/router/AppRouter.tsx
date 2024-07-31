import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Protected from '../components/route_protection/Protected';
import SuperProtected from '../components/route_protection/SuperProtected';
import NotFoundPage from '../pages/NotFoundPage';
import BigSpinner from '../components/ui/BigSpinner';
import analytics from '../segment/segment';

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
const PaymentHistory = React.lazy(() => import('../pages/dashboard_pages/PaymentHistory'));
const ProfilePage = React.lazy(() => import('../pages/dashboard_pages/ProfilePage'));

/*
CAMERA AND MICROPHONE ACCESS PAGE: This page is used to check if the camera and microphone are working
*/
const CameraMicrophoneAccess = React.lazy(() => import('../components/proctoring_components/CameraMicrophoneAccess'));

const RouteChangeTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.page(location.pathname);
  }, [location]);

  return null;
}

const AppRouter: React.FC = () => {
  return (
    <Router>
      {/* ------------------------- RUNS ANALYTICS FOR ROUTE CHANGES -------------------------- */}
      <RouteChangeTracker />
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
        <Route
          path="/payments"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <PaymentHistory />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
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
        {/* ------------------------------   ANY OTHER ROUTES HERE    ---------------------- */}
        <Route path="*" element={<NotFoundPage/>} />
        {/* ------------------------------   ANY OTHER ROUTES END HERE    ---------------------- */}
      </Routes>
    </Router>
  );
};

export default AppRouter;