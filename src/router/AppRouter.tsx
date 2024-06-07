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
import { LoadingSpinner } from '../components/ui/spinner';

const TestingPage = React.lazy(() => import('../pages/testing_page/TestingPage'));

// CHANGE THIS TO MULTIPLE COMPONENTS INSTEAD OF THE CURRENT VERSION
const SignInPage = React.lazy(() => import('../components/auth/SignInForm'));
const SignUpPage = React.lazy(() => import('../components/auth/SignUpForm'));
const AccountCreationSuccessPage = React.lazy(() => import('../pages/authentication_pages/AccountCreationSuccess'));
const AccountCreationFailurePage = React.lazy(() => import('../pages/authentication_pages/AccountCreationFailure'));

const AppRouter: React.FC = () => {
  return (
    <Router>
      {/* ------------------------------ SIGNUP AND LOGIN ROUTES ------------------------------ */}
      <Routes>
        <Route 
          path='/signup'
          element={
            <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
              <SignUpPage />
            </Suspense>
          }
        />
        <Route 
          path='/login'
          element={
            <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
              <SignInPage />
            </Suspense>
          }
        />
        <Route 
          path='/account-creation-success'
          element={
            <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
              <AccountCreationSuccessPage />
            </Suspense>
          }
        />
        <Route 
          path='/account-creation-failure'
          element={
            <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
              <AccountCreationFailurePage />
            </Suspense>
          }
        />
        {/* ------------------------------ SIGNUP AND LOGIN ROUTES END ------------------------------ */}
        {/* ------------------------------ TESTING PAGE ROUTES ------------------------------ */}
        <Route 
          path="/" 
          element={
            <Protected>
              <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
                <TestingPage />
              </Suspense>
            </Protected>
          }
          errorElement={<div>There was an error loading the page.</div>}
        />

        {/* ------------------------------ ERROR PAGE ROUTES HERE ---------------------- */}
        <Route 
          path="/camera_error" 
          element={
            <Protected>
              <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
                <CameraError />
              </Suspense>
            </Protected>
          }
        />
        <Route 
          path="/entity_model_error" 
          element={
            <Protected>
              <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
                <EntityDetectionError />
              </Suspense>
            </Protected>
          }
        />
        <Route 
          path='/pose_model_error'
          element={
            <Protected>
              <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
                <PoseDetectionError />
              </Suspense>
            </Protected>
          }
        />

        <Route
          path='/face_landmarks_model_error'
          element={
            <Protected>
              <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
                <FaceLandmarksError />
              </Suspense>
            </Protected>
          }
        />
        <Route
          path='/internet_speed_error'
          element={
            <Protected>
              <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
                <SpeedTestErrorPage />
              </Suspense>
            </Protected>
          }
        />
        <Route 
          path='/audio_error'
          element={
            <Protected>
              <Suspense fallback={<div><LoadingSpinner className='loading-spinner'/></div>}>
                <AudioErrorPage />
              </Suspense>
            </Protected>
          }
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