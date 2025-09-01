import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getSchoolAdmin, SchoolAdmin } from '../db/schoolAdminCollection';

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
}

export interface AuthState {
    user: User | null;
    role: 'student' | 'schooladmin' | null;
    schoolAdmin: SchoolAdmin | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    role: null,
    schoolAdmin: null,
    loading: false,
    error: null,
};

export const checkUserRole = createAsyncThunk(
    'auth/checkUserRole',
    async (email: string) => {
        try {
            const schoolAdmin = await getSchoolAdmin(email);
            if (schoolAdmin) {
                return { role: 'schooladmin' as const, schoolAdmin };
            }
            return { role: 'student' as const, schoolAdmin: null };
        } catch (error) {
            // Default to student if there's an error
            return { role: 'student' as const, schoolAdmin: null };
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
        setRole: (state, action: PayloadAction<'student' | 'schooladmin' | null>) => {
            state.role = action.payload;
        },
        setSchoolAdmin: (state, action: PayloadAction<SchoolAdmin | null>) => {
            state.schoolAdmin = action.payload;
        },
        clearAuth: (state) => {
            state.user = null;
            state.role = null;
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
            })
            .addCase(checkUserRole.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to check user role';
                // Default to student role on error
                state.role = 'student';
                state.schoolAdmin = null;
            });
    },
});

export const { setUser, setRole, setSchoolAdmin, clearAuth, setError } = authSlice.actions;
export default authSlice.reducer;
