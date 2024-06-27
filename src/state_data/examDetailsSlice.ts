import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ExamDetailsPayload {
    formId: string;
    additionalInstructions: string[];
    examDetails: string[];
    duration: number;
    cardTitle: string;
    paymentNeeded: boolean;
    cardDescription: string;
    completed: boolean;
    cost: number;
    currency: string;
    isProctored: boolean;
}

interface ExamDetailsGroup {
    examDetails: ExamDetailsPayload[];
    examDetailsLoaded: boolean;
}

const initialState: ExamDetailsGroup = {
    examDetails: [],
    examDetailsLoaded: false,
}

export const examDetailsSlice = createSlice({
    name: "examDetails",
    initialState,
    reducers: {
        setExamDetails: (state, action: PayloadAction<ExamDetailsGroup>) => {
            state.examDetails = action.payload.examDetails;
            state.examDetailsLoaded = true;
        },
    },
});

export const { setExamDetails } = examDetailsSlice.actions;

export default examDetailsSlice.reducer;