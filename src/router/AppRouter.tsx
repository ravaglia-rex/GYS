import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CameraError from '../pages/testing_page/error_pages/CameraError';
import EntityDetectionError from '../pages/testing_page/error_pages/EntityDetectionError';
import PoseDetectionError from '../pages/testing_page/error_pages/PoseDetectionError';
import FaceLandmarksError from '../pages/testing_page/error_pages/FaceLandmarksError';
import SpeedTestErrorPage from '../pages/testing_page/error_pages/SpeedTestError';
import AudioErrorPage from '../pages/testing_page/error_pages/AudioErrorPage';

const TestingPage = React.lazy(() => import('../pages/testing_page/TestingPage'));

// CHANGE THIS TO MULTIPLE COMPONENTS INSTEAD OF THE CURRENT VERSION
const SignInPage = React.lazy(() => import('../components/auth/SignIn'));
const SignUpPage = React.lazy(() => import('../components/auth/SignUp'));
const AccountCreationSuccessPage = React.lazy(() => import('../pages/testing_page/authentication_pages/AccountCreationSuccess'));
const AccountCreationFailurePage = React.lazy(() => import('../pages/testing_page/authentication_pages/AccountCreationFailure'));

const AppRouter: React.FC = () => {
  return (
    <Router>
      {/* ------------------------------ SIGNUP AND LOGIN ROUTES ------------------------------ */}
      <Routes>
        <Route 
          path='/signup'
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <SignUpPage />
            </Suspense>
          }
        />
        <Route 
          path='/login'
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <SignInPage />
            </Suspense>
          }
        />
        <Route 
          path='/account-creation-success'
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <AccountCreationSuccessPage />
            </Suspense>
          }
        />
        <Route 
          path='/account-creation-failure'
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <AccountCreationFailurePage />
            </Suspense>
          }
        />
        {/* ------------------------------ SIGNUP AND LOGIN ROUTES END ------------------------------ */}
        {/* ------------------------------ TESTING PAGE ROUTES ------------------------------ */}
        <Route 
          path="/" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <TestingPage />
            </Suspense>
          }
          errorElement={<div>There was an error loading the page.</div>}
        />

        {/* ------------------------------ ERROR PAGE ROUTES HERE ---------------------- */}
        <Route 
          path="/camera_error" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <CameraError />
            </Suspense>
          }
        />
        <Route 
          path="/entity_model_error" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <EntityDetectionError />
            </Suspense>
          }
        />
        <Route 
          path='/pose_model_error'
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <PoseDetectionError />
            </Suspense>
          }
        />

        <Route
          path='/face_landmarks_model_error'
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <FaceLandmarksError />
            </Suspense>
          }
        />
        <Route
          path='/internet_speed_error'
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <SpeedTestErrorPage />
            </Suspense>
          }
        />
        <Route 
          path='/audio_error'
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <AudioErrorPage />
            </Suspense>
          }
        />
        {/* ------------------------------ ERROR PAGE ROUTES END HERE ---------------------- */}
        {/* ------------------------------   ANY OTHER ROUTES HERE    ---------------------- */}
        <Route path="*" element={<div>404 Not Found</div>} />
        {/* ------------------------------   ANY OTHER ROUTES END HERE    ---------------------- */}
      </Routes>
    </Router>
  );
};

export default AppRouter;