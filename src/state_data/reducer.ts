import { combineReducers, configureStore } from '@reduxjs/toolkit';
import entityDetectionReducer from './entityDetectionSlice';
import faceLandmarksReducer from './faceLandmarksSlice';
import audioReducer from './audioSlice';
import poseDetectionReducer from './poseDetectionSlice';
import loadReducer from './loadSlice';

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
    load: loadReducer,
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