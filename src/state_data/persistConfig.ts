import storage from 'redux-persist/lib/storage';

const persistConfig = {
    key: 'root',
    storage,
    blacklist: ['load', 'audioCapture', 'frameCapture', 'internetSpeed', 'examDetails', 'studentPayments'],
};

export default persistConfig;