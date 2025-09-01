import { combineReducers, configureStore } from '@reduxjs/toolkit';

import entityDetectionReducer from './entityDetectionSlice';
import faceLandmarksReducer from './faceLandmarksSlice';
import poseDetectionReducer from './poseDetectionSlice';

import audioReducer from './audioSlice';

import internetSpeedReducer from './internetSpeedSlice';

import tabSwitchingReducer from './tabSwitchingSlice';

import loadReducer from './loadSlice';

import frameCaptureReducer from './frameCaptureSlice';
import audioCaptureReducer from './audioCaptureSlice';
import examDetailsReducer from './examDetailsSlice';
import studentPaymentsReducer from './studentPaymentsSlice';
import authReducer from './authSlice';

import {
    persistReducer,
    persistStore,
} from 'redux-persist';
import persistConfig from './persistConfig';

const rootReducer = combineReducers({
    entityDetection: entityDetectionReducer,
    faceLandmarks: faceLandmarksReducer,
    audio: audioReducer,
    poseDetection: poseDetectionReducer,
    internetSpeed: internetSpeedReducer,
    tabSwitching: tabSwitchingReducer,
    load: loadReducer,
    frameCapture: frameCaptureReducer,
    audioCapture: audioCaptureReducer,
    examDetails: examDetailsReducer,
    studentPayments: studentPaymentsReducer,
    auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});

const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { store, persistor };