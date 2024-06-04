import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface internetSpeedState {
    upload_speed: number;
    download_speed: number;
    violation_count: number;
    timestamp: string;
}

const initialState: internetSpeedState = {
    upload_speed: -1,
    download_speed: -1,
    violation_count: 0,
    timestamp: "",
};

export const internetSpeedSlice = createSlice({
    name: "internetSpeed",
    initialState,
    reducers: {
        setInternetSpeed: (state, action: PayloadAction<internetSpeedState>) => {
            state.upload_speed = action.payload.upload_speed;
            state.download_speed = action.payload.download_speed;
            state.timestamp = action.payload.timestamp;
            state.violation_count = action.payload.violation_count;
        },
        incrementViolationCount: (state) => {
            state.violation_count += 1;
        }
    },
});

export const { setInternetSpeed, incrementViolationCount } = internetSpeedSlice.actions;

export default internetSpeedSlice.reducer;