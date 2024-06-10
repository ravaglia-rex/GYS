import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ExamDetailsPayload {
    examId: string;
}

const initialState: ExamDetailsPayload = {
    examId: "",
};

export const examDetailsSlice = createSlice({
    name: "examDetails",
    initialState,
    reducers: {
        setExamID: (state, action: PayloadAction<{examId: string}>) => {
            state.examId = action.payload.examId;
        },
    },
});

export const { setExamID } = examDetailsSlice.actions;

export default examDetailsSlice.reducer;