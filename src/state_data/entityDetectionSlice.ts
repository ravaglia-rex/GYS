import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EntityDetectionState {
    person_count: number[];
    cell_phone: boolean[];
    laptop: boolean[];
    timestamp: string[];
    additional_info: any[];
}

interface EntityDetectionPayload {
    person_count: number;
    cell_phone: boolean;
    laptop: boolean;
    timestamp: string;
    additional_info: any;
}

const initialState: EntityDetectionState = {
    person_count: [],
    cell_phone: [],
    laptop: [],
    timestamp: [],
    additional_info: [],
};

export const entityDetectionSlice = createSlice({
    name: "entityDetection",
    initialState,
    reducers: {
        setEntityDetection: (state, action: PayloadAction<EntityDetectionPayload>) => {
            if (state.person_count.length > 15) {
                state.person_count.shift();
                state.cell_phone.shift();
                state.laptop.shift();
                state.timestamp.shift();
                state.additional_info.shift();
            }
            state.person_count.push(action.payload.person_count);
            state.cell_phone.push(action.payload.cell_phone);
            state.laptop.push(action.payload.laptop);
            state.timestamp.push(action.payload.timestamp);
            state.additional_info.push(action.payload.additional_info);
        },
    },
});

export const { setEntityDetection } = entityDetectionSlice.actions;

export default entityDetectionSlice.reducer;