import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface tabSwitchingState {
    tab_switch_count: number;
    timestamp: string;
}

const initialState: tabSwitchingState = {
    tab_switch_count: 0,
    timestamp: "",
};

export const tabSwitchingSlice = createSlice({
    name: "tabSwitching",
    initialState,
    reducers: {
        setTabSwitched: (state, action: PayloadAction<tabSwitchingState>) => {
            state.tab_switch_count = action.payload.tab_switch_count;
            state.timestamp = action.payload.timestamp;
        },
    },
});

export const { setTabSwitched } = tabSwitchingSlice.actions;

export default tabSwitchingSlice.reducer;