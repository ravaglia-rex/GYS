import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface frameCaptureState {
    entityDetectionWorker: Worker | null;
    poseDetectionWorker: Worker | null;
    faceLandmarkDetectionWorker: Worker | null;
    frameIntervalId: number | null;
    videoStream: MediaStream | null;
}

const initialState: frameCaptureState = {
    entityDetectionWorker: null,
    poseDetectionWorker: null,
    faceLandmarkDetectionWorker: null,
    frameIntervalId: null,
    videoStream: null,
};

export const frameCaptureSlice = createSlice({
    name: "frameCapture",
    initialState,
    reducers: {
        setEntityDetectionWorker: (state, action: PayloadAction<Worker>) => {
            state.entityDetectionWorker = action.payload;
        },
        setPoseDetectionWorker: (state, action: PayloadAction<Worker>) => {
            state.poseDetectionWorker = action.payload;
        },
        setFaceLandmarkDetectionWorker: (state, action: PayloadAction<Worker>) => {
            state.faceLandmarkDetectionWorker = action.payload;
        },
        setFrameIntervalId: (state, action: PayloadAction<number>) => {
            state.frameIntervalId = action.payload;
        },
        setVideoStream: (state, action: PayloadAction<MediaStream>) => {
            state.videoStream = action.payload;
        },
        cleanupInterval: (state) => {
            if (state.frameIntervalId) {
                clearInterval(state.frameIntervalId);
            }
        },
        cleanupFrameResources: (state) => {
            if (state.entityDetectionWorker) {
                state.entityDetectionWorker.removeEventListener("message", (e) => {});
                state.entityDetectionWorker.terminate();
            }
            if (state.poseDetectionWorker) {
                state.poseDetectionWorker.removeEventListener("message", (e) => {});
                state.poseDetectionWorker.terminate();
            }
            if (state.faceLandmarkDetectionWorker) {
                state.faceLandmarkDetectionWorker.removeEventListener("message", (e) => {});
                state.faceLandmarkDetectionWorker.terminate();
            }
            if (state.frameIntervalId) {
                clearInterval(state.frameIntervalId);
            }
            if (state.videoStream) {
                state.videoStream.getTracks().forEach((track) => {
                    track.stop();
                });
                state.videoStream.removeTrack(state.videoStream.getVideoTracks()[0]);
            }
            // Reset the state
            state.entityDetectionWorker = null;
            state.poseDetectionWorker = null;
            state.faceLandmarkDetectionWorker = null;
            state.frameIntervalId = null;
            state.videoStream = null;
        }
    },
});

export const { 
    setEntityDetectionWorker, 
    setPoseDetectionWorker, 
    setFaceLandmarkDetectionWorker, 
    setFrameIntervalId, 
    setVideoStream,
    cleanupInterval,
    cleanupFrameResources
 } = frameCaptureSlice.actions;

export default frameCaptureSlice.reducer;