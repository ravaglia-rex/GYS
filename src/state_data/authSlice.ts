import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { SchoolAdmin } from '../db/schoolAdminCollection';

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
}

export interface AuthState {
    user: User | null;
    role: 'student' | 'schooladmin' | 'platformadmin' | null;
    platformAdminRole: 'super' | 'member' | null;
    platformAdminPermissions: string[];
    schoolAdmin: SchoolAdmin | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    role: null,
    platformAdminRole: null,
    platformAdminPermissions: [],
    schoolAdmin: null,
    loading: false,
    error: null,
};

export const checkUserRole = createAsyncThunk(
    'auth/checkUserRole',
    async (email: string, { getState, rejectWithValue }) => {
        try {
            const { getPlatformAdminMe } = await import('../db/platformAdminCollection');
            // Platform admin first — must not fall through to "student" on transient /me errors.
            try {
                const me = await getPlatformAdminMe();
                if (me?.ok === true) {
                    return {
                        role: 'platformadmin' as const,
                        schoolAdmin: null,
                        platformAdminRole: me.role,
                        platformAdminPermissions: Array.isArray(me.permissions) ? me.permissions : [],
                    };
                }
            } catch (platformError) {
                const message =
                  platformError instanceof Error
                    ? platformError.message
                    : 'Failed to check platform admin role';
                return rejectWithValue(message);
            }

            const { getSchoolAdmin, checkSchoolEmail } = await import('../db/schoolAdminCollection');
            const state = getState() as { auth?: AuthState };
            const preferredSchoolId = state.auth?.schoolAdmin?.schoolId;
            let schoolAdmin = await getSchoolAdmin(email, preferredSchoolId);
            // If not in schooladmins collection, check if they're a verified school official (schools collection poc_email)
            if (!schoolAdmin) {
                const schoolCheck = await checkSchoolEmail(email);
                if (
                  schoolCheck?.verified &&
                  schoolCheck.registrationPaymentComplete === true
                ) {
                    schoolAdmin = {
                        email,
                        schoolId: preferredSchoolId || schoolCheck.schoolId,
                        role: 'schooladmin'
                    };
                }
            }
            if (schoolAdmin) {
                return {
                    role: 'schooladmin' as const,
                    schoolAdmin,
                    platformAdminRole: null as AuthState['platformAdminRole'],
                    platformAdminPermissions: [] as string[],
                };
            }
            return {
                role: 'student' as const,
                schoolAdmin: null,
                platformAdminRole: null as AuthState['platformAdminRole'],
                platformAdminPermissions: [] as string[],
            };
        } catch (error) {
            // Do not fail open to student — transient API errors must not demote school admins.
            const message =
              error instanceof Error ? error.message : 'Failed to check user role';
            return rejectWithValue(message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
        },
        setRole: (state, action: PayloadAction<'student' | 'schooladmin' | 'platformadmin' | null>) => {
            state.role = action.payload;
        },
        setPlatformAdminRole: (state, action: PayloadAction<'super' | 'member' | null>) => {
            state.platformAdminRole = action.payload;
        },
        setPlatformAdminPermissions: (state, action: PayloadAction<string[]>) => {
            state.platformAdminPermissions = Array.isArray(action.payload) ? action.payload : [];
        },
        setSchoolAdmin: (state, action: PayloadAction<SchoolAdmin | null>) => {
            state.schoolAdmin = action.payload;
        },
        clearAuth: (state) => {
            state.user = null;
            state.role = null;
            state.platformAdminRole = null;
            state.platformAdminPermissions = [];
            state.schoolAdmin = null;
            state.error = null;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkUserRole.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkUserRole.fulfilled, (state, action) => {
                state.loading = false;
                state.role = action.payload.role;
                state.schoolAdmin = action.payload.schoolAdmin;
                state.platformAdminRole = action.payload.platformAdminRole ?? null;
                state.platformAdminPermissions = action.payload.platformAdminPermissions ?? [];
            })
            .addCase(checkUserRole.rejected, (state, action) => {
                state.loading = false;
                state.error =
                  (typeof action.payload === 'string' && action.payload) ||
                  action.error.message ||
                  'Failed to check user role';
                // Leave role unknown — callers must not treat this as a confirmed student.
                state.role = null;
                state.schoolAdmin = null;
                state.platformAdminRole = null;
                state.platformAdminPermissions = [];
            });
    },
});

export const {
    setUser,
    setRole,
    setPlatformAdminRole,
    setPlatformAdminPermissions,
    setSchoolAdmin,
    clearAuth,
    setError,
} = authSlice.actions;
export default authSlice.reducer;
