import { createSlice } from "@reduxjs/toolkit";

export const loadSlice = createSlice({
    name: "loadingslice",
    initialState: {
        loading: true,
    },
    reducers: {
        setLoadState: (state, action) => {
            state.loading = action.payload.loading_state;
        },
    }
});

export const { setLoadState } = loadSlice.actions;
export default loadSlice.reducer;