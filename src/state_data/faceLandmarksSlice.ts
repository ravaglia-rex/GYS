import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FaceLandmarksState {
    eye_state: string[];
    mouth_state: string[];
    timestamp: string[];
}

interface FaceLandmarksPayload {
    eye_state: string;
    mouth_state: string;
    timestamp: string;
}

const initialState: FaceLandmarksState = {
    eye_state: [],
    mouth_state: [],
    timestamp: [],
};

export const faceLandmarksSlice = createSlice({
    name: "faceLandmarks",
    initialState,
    reducers: {
        setFaceLandmarks: (state, action: PayloadAction<FaceLandmarksPayload>) => {
            if (state.eye_state.length > 15) {
                state.eye_state.shift();
                state.mouth_state.shift();
                state.timestamp.shift();
            }
            state.eye_state.push(action.payload.eye_state);
            state.mouth_state.push(action.payload.mouth_state);
            state.timestamp.push(action.payload.timestamp);
        },
    },
});

export const { setFaceLandmarks } = faceLandmarksSlice.actions;

export default faceLandmarksSlice.reducer;