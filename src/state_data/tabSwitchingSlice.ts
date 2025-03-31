import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface tabSwitchingState {
    tab_switch_count: number;
    full_screen_switch_count: number;
    timestamp: string;
}

const initialState: tabSwitchingState = {
    tab_switch_count: 0,
    full_screen_switch_count: 0,
    timestamp: "",
};

interface SwitchPayload {
    count: number;
    timestamp: string;
}

export const tabSwitchingSlice = createSlice({
    name: "tabSwitching",
    initialState,
    reducers: {
        setTabSwitched: (state, action: PayloadAction<SwitchPayload>) => {
            state.tab_switch_count = action.payload.count;
            state.timestamp = action.payload.timestamp;
        },
        setFullScreenSwitched: (state, action: PayloadAction<SwitchPayload>) => {
            state.full_screen_switch_count = action.payload.count;
            state.timestamp = action.payload.timestamp;
        },
        resetTabSwitching: (state) => {
            state.tab_switch_count = 0;
            state.full_screen_switch_count = 0;
            state.timestamp = "";
        }
    },
});

export const { setTabSwitched, setFullScreenSwitched, resetTabSwitching } = tabSwitchingSlice.actions;

export default tabSwitchingSlice.reducer;