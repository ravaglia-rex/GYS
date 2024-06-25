import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Protected from '../components/route_protection/Protected';
import NotFoundPage from '../pages/NotFoundPage';
import BigSpinner from '../components/BigSpinner';

/* 
AUTHENTICATION PAGES: These are the pages that are used for the signup and login process
*/
const AuthenticationPage = React.lazy(() => import('../pages/authentication_pages/AuthenticationPage'));
const VerifyEmailPage = React.lazy(() => import('../pages/authentication_pages/VerifyEmailPage'));
const VerifyEmailErrorPage = React.lazy(() => import('../pages/authentication_pages/VerifyEmailErrorPage'));

/*
TESTING PAGES: These are the pages for serving the exam
*/
const TestingPage = React.lazy(() => import('../pages/testing_page/TestingPage'));
const CameraError = React.lazy(() => import('../pages/error_pages/CameraError'));
const EntityDetectionError = React.lazy(() => import('../pages/error_pages/EntityDetectionError'));
const PoseDetectionError = React.lazy(() => import('../pages/error_pages/PoseDetectionError'));
const FaceLandmarksError = React.lazy(() => import('../pages/error_pages/FaceLandmarksError'));
const SpeedTestError = React.lazy(() => import('../pages/error_pages/SpeedTestError'));
const AudioErrorPage = React.lazy(() => import('../pages/error_pages/AudioErrorPage'));
const LightingErrorPage = React.lazy(() => import('../pages/error_pages/LightingErrorPage'));

/*
DASHBOARD PAGES: These are the pages that are used for the dashboard
*/
const DashboardPage = React.lazy(() => import('../pages/dashboard_pages/DashboardPage'));
const PaymentHistory = React.lazy(() => import('../pages/dashboard_pages/PaymentHistory'));


/*
CAMERA AND MICROPHONE ACCESS PAGE: This page is used to check if the camera and microphone are working
*/
const CameraMicrophoneAccess = React.lazy(() => import('../components/CameraMicrophoneAccess'));

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
          path='/auth/action'
          element={
            <Suspense fallback={<BigSpinner/>}>
              <VerifyEmailPage />
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
          path="/payment-history"
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <PaymentHistory />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        {/* ------------------------------ TESTING PAGE ROUTES ------------------------------ */}
        <Route 
          path="/camera-microphone-access" 
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <CameraMicrophoneAccess />
              </Suspense>
            </Protected>
          }
          errorElement={<NotFoundPage />}
        />
        
        <Route 
          path="/testing" 
          element={
            <Protected>
              <Suspense fallback={<BigSpinner/>}>
                <TestingPage />
              </Suspense>
            </Protected>
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
        {/* ------------------------------ ERROR PAGE ROUTES END HERE ---------------------- */}
        {/* ------------------------------   ANY OTHER ROUTES HERE    ---------------------- */}
        <Route path="*" element={<NotFoundPage/>} />
        {/* ------------------------------   ANY OTHER ROUTES END HERE    ---------------------- */}
      </Routes>
    </Router>
  );
};

export default AppRouter;