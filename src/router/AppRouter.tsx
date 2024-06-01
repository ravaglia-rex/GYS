import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CameraError from '../pages/testing_page/error_pages/CameraError';
import EntityDetectionError from '../pages/testing_page/error_pages/EntityDetectionError';
import PoseDetectionError from '../pages/testing_page/error_pages/PoseDetectionError';
import FaceLandmarksError from '../pages/testing_page/error_pages/FaceLandmarksError';

const TestingPage = React.lazy(() => import('../pages/testing_page/TestingPage'));

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
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
        {/* ------------------------------ ERROR PAGE ROUTES END HERE ---------------------- */}
        {/* ------------------------------   ANY OTHER ROUTES HERE    ---------------------- */}
        <Route path="*" element={<div>404 Not Found</div>} />
        {/* ------------------------------   ANY OTHER ROUTES END HERE    ---------------------- */}
      </Routes>
    </Router>
  );
};

export default AppRouter;