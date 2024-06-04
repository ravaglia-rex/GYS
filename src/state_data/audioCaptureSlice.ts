import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface audioCaptureState {
    audioWorker: Worker | undefined | null;
    audioStream: MediaStream | null;
}

const initialState: audioCaptureState = {
    audioWorker: null,
    audioStream: null,
};

export const audioCaptureSlice = createSlice({
    name: "audioCapture",
    initialState,
    reducers: {
        setAudioCaptureSlice(state, action: PayloadAction<audioCaptureState>) {
            state.audioWorker = action.payload.audioWorker;
            state.audioStream = action.payload.audioStream;
        },
        cleanupAudioCaptureResources(state) {
            if (state.audioWorker) {
                state.audioWorker.removeEventListener("message", (e) => {});
                state.audioWorker.terminate();
            }
            if (state.audioStream) {
                state.audioStream.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        },
    },
});

export const { 
    setAudioCaptureSlice,
    cleanupAudioCaptureResources,
 } = audioCaptureSlice.actions;

export default audioCaptureSlice.reducer;