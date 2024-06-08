import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PoseDetectionState {
    pose: any[];
    action: string[];
    timestamp: string[];
}

interface PoseDetectionPayload {
    pose: any;
    action: string;
    timestamp: string;
}

const initialState: PoseDetectionState = {
    pose: [],
    action: [],
    timestamp: []
};

export const poseDetectionSlice = createSlice({
    name: "poseDetection",
    initialState,
    reducers: {
        setPoseDetection: (state, action: PayloadAction<PoseDetectionPayload>) => {
            if (state.timestamp.length > 15) {
                state.pose.shift();
                state.action.shift();
                state.timestamp.shift();
            }
            state.pose.push(action.payload.pose);
            state.action.push(action.payload.action);
            state.timestamp.push(action.payload.timestamp);
        },
    },
});

export const { setPoseDetection } = poseDetectionSlice.actions;

export default poseDetectionSlice.reducer;
