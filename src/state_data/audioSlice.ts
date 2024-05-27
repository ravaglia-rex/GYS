import { createSlice } from "@reduxjs/toolkit";

export const audioSlice = createSlice({
    name: "audio",
    initialState: {
        audio: {},
        timestamp: 0,
    },
    reducers: {
        setAudio: (state, action) => {
            state.audio = action.payload.audio;
            state.timestamp = action.payload.timestamp;
        },
    }
});

export const { setAudio } = audioSlice.actions;
export default audioSlice.reducer;