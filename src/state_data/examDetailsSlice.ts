import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ExamDetailsPayload {
    formId: string;
    additionalInstructions: string[];
    examDetails: string[];
    cardTitle: string;
    paymentNeeded: boolean;
    cardDescription: string;
    completed: boolean;
    cost: number;
    currency: string;
    isProctored: boolean;
    eligibility_at: string;
    result?: boolean | null;
    type_questions?: Record<string, number>;
    duration?: number;
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
        resetExamDetails: (state) => {
            state.examDetails = [];
            state.examDetailsLoaded = false;
        }
    },
});

export const { setExamDetails, resetExamDetails } = examDetailsSlice.actions;

export default examDetailsSlice.reducer;