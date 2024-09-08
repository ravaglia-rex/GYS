import React from 'react';
import { signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { useDispatch } from 'react-redux';
import { resetExamDetails } from '../../state_data/examDetailsSlice';
import { resetPayments } from '../../state_data/studentPaymentsSlice';
import { resetEntityDetection } from '../../state_data/entityDetectionSlice';
import { resetPoseDetection } from '../../state_data/poseDetectionSlice';
import { resetFaceLandmarks } from '../../state_data/faceLandmarksSlice';
import { resetInternetSpeed } from '../../state_data/internetSpeedSlice';
import { resetTabSwitching } from '../../state_data/tabSwitchingSlice';
import * as Sentry from '@sentry/react';

const SignOutButton: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const signOutUser = () => {
    signOut(auth).then(() => {
      dispatch(resetExamDetails());
      dispatch(resetPayments());
      dispatch(resetEntityDetection());
      dispatch(resetPoseDetection());
      dispatch(resetFaceLandmarks());
      dispatch(resetInternetSpeed());
      dispatch(resetTabSwitching());

      localStorage.removeItem('currentFormId');
      localStorage.removeItem('isProctored');

      navigate('/');
    }).catch((error) => {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'SignOutButton.signOutUser');
        Sentry.captureException(error);
      });
      console.log(error);
    });
  };

  return (
    <button onClick={signOutUser}>Sign Out</button>
  );
};

export default SignOutButton;