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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    2: (state: any) => {
        if (!state) return state;
        const next = { ...state };
        delete next.entityDetection;
        delete next.faceLandmarks;
        delete next.poseDetection;
        delete next.internetSpeed;
        delete next.tabSwitching;
        delete next.load;
        delete next.frameCapture;
        delete next.audioCapture;
        delete next.examDetails;
        delete next.audio;
        if (next.auth) {
            next.auth = {
                ...next.auth,
                schoolAdmin: null,
                role: null,
            };
        }
        return next;
    },
};

const persistConfig = {
    key: 'root',
    version: 2,
    storage,
    migrate: createMigrate(migrations, { debug: false }),
    blacklist: ['studentPayments'],
};

export default persistConfig;
