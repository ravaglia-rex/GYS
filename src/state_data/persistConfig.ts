import storage from 'redux-persist/lib/storage';
import { createMigrate } from 'redux-persist';

/**
 * One-time migration: clear cached school admin binding so the next session resolves
 * schoolId from the API again (fixes stale school after seeding / admin subdoc changes).
 */
const migrations = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    1: (state: any) => {
        if (!state?.auth) return state;
        return {
            ...state,
            auth: {
                ...state.auth,
                schoolAdmin: null,
                role: null,
            },
        };
    },
};

const persistConfig = {
    key: 'root',
    version: 1,
    storage,
    migrate: createMigrate(migrations, { debug: false }),
    blacklist: ['load', 'audioCapture', 'frameCapture', 'internetSpeed', 'examDetails', 'studentPayments'],
};

export default persistConfig;