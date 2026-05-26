import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { StudentPaymentHistoryItem } from '../db/studentPaymentMappings';

interface PaymentsState {
  payments: StudentPaymentHistoryItem[];
  paymentsLoaded: boolean;
}

const initialState: PaymentsState = {
  payments: [],
  paymentsLoaded: false,
};

const studentPaymentsSlice = createSlice({
  name: 'studentPayments',
  initialState,
  reducers: {
    setPayments: (state, action: PayloadAction<StudentPaymentHistoryItem[]>) => {
      state.payments = action.payload;
      state.paymentsLoaded = true;
    },
    resetPayments: (state) => {
      state.payments = [];
      state.paymentsLoaded = false;
    }
  },
});

export const { setPayments, resetPayments } = studentPaymentsSlice.actions;
export default studentPaymentsSlice.reducer;