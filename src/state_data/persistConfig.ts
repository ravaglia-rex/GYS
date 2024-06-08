import storage from 'redux-persist/lib/storage';

const persistConfig = {
    key: 'root',
    storage,
    blacklist: ['load', 'audioCapture', 'frameCapture', 'internetSpeed'],
};

export default persistConfig;