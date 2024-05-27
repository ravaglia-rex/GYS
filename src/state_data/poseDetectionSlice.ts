import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PoseDetectionState {
    pose: any[];
    timestamp: string[];
}

interface PoseDetectionPayload {
    pose: any;
    timestamp: string;
}

const initialState: PoseDetectionState = {
    pose: [],
    timestamp: [],
};

export const poseDetectionSlice = createSlice({
    name: "poseDetection",
    initialState,
    reducers: {
        setPoseDetection: (state, action: PayloadAction<PoseDetectionPayload>) => {
            if (state.pose.length > 15) {
                state.pose.shift();
                state.timestamp.shift();
            }
            state.pose.push(action.payload.pose);
            state.timestamp.push(action.payload.timestamp);
        },
    },
});

export const { setPoseDetection } = poseDetectionSlice.actions;

export default poseDetectionSlice.reducer;
