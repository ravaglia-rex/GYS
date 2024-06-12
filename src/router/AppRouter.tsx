import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CameraError from '../pages/error_pages/CameraError';
import EntityDetectionError from '../pages/error_pages/EntityDetectionError';
import PoseDetectionError from '../pages/error_pages/PoseDetectionError';
import FaceLandmarksError from '../pages/error_pages/FaceLandmarksError';
import SpeedTestErrorPage from '../pages/error_pages/SpeedTestError';
import AudioErrorPage from '../pages/error_pages/AudioErrorPage';
import Protected from '../components/route_protection/Protected';
import NotFoundPage from '../pages/NotFoundPage';
import LightingErrorPage from '../pages/error_pages/LightingErrorPage';
import BigSpinner from '../components/BigSpinner';

const TestingPage = React.lazy(() => import('../pages/testing_page/TestingPage'));

// CHANGE THIS TO MULTIPLE COMPONENTS INSTEAD OF THE CURRENT VERSION
const SignInPage = React.lazy(() => import('../components/auth/SignInForm'));
const StepperForm = React.lazy(() => import('../components/auth/StepperForm'));
const AccountCreationSuccessPage = React.lazy(() => import('../pages/authentication_pages/AccountCreationSuccess'));
const AccountCreationFailurePage = React.lazy(() => import('../pages/authentication_pages/AccountCreationFailure'));
const WaitlistCreationSuccessPage = React.lazy(() => import('../pages/authentication_pages/WaitlistCreationSuccess'));

const AppRouter: React.FC = () => {
  return (
    <Router>
      {/* ------------------------------ SIGNUP AND LOGIN ROUTES ------------------------------ */}
      <Routes>
        <Route 
          path='/signup'
          element={
            <Suspense fallback={<BigSpinner/>}>
              <StepperForm />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route 
          path='/login'
          element={
            <Suspense fallback={<BigSpinner/>}>
              <SignInPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route 
          path='/account-creation-success'
          element={
            <Suspense fallback={<BigSpinner/>}>
              <AccountCreationSuccessPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route 
          path='/waitlist-success'
          element={
            <Suspense fallback={<BigSpinner/>}>
              <WaitlistCreationSuccessPage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        <Route 
          path='/account-creation-failure'
          element={
            <Suspense fallback={<BigSpinner/>}>
              <AccountCreationFailurePage />
            </Suspense>
          }
          errorElement={<NotFoundPage />}
        />
        {/* ------------------------------ SIGNUP AND LOGIN ROUTES END ------------------------------ */}
        {/* ------------------------------ TESTING PAGE ROUTES ------------------------------ */}
        <Route 
          path="/" 
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
                <SpeedTestErrorPage />
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