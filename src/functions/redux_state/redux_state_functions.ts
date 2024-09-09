import { resetExamDetails } from '../../state_data/examDetailsSlice';
import { resetPayments } from '../../state_data/studentPaymentsSlice';
import { resetEntityDetection } from '../../state_data/entityDetectionSlice';
import { resetPoseDetection } from '../../state_data/poseDetectionSlice';
import { resetFaceLandmarks } from '../../state_data/faceLandmarksSlice';
import { resetInternetSpeed } from '../../state_data/internetSpeedSlice';
import { resetTabSwitching } from '../../state_data/tabSwitchingSlice';
import { Dispatch } from '@reduxjs/toolkit';

export const clearReduxState = (dispatch: Dispatch) => {
    dispatch(resetExamDetails());
    dispatch(resetPayments());
    dispatch(resetEntityDetection());
    dispatch(resetPoseDetection());
    dispatch(resetFaceLandmarks());
    dispatch(resetInternetSpeed());
    dispatch(resetTabSwitching());
};