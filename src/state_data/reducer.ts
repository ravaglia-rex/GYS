import { combineReducers, configureStore } from '@reduxjs/toolkit';
import studentPaymentsReducer from './studentPaymentsSlice';
import authReducer from './authSlice';
import {
    persistReducer,
    persistStore,
} from 'redux-persist';
import persistConfig from './persistConfig';

const rootReducer = combineReducers({
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
