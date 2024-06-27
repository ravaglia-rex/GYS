import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Payment {
  paidOn: Date;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  uid: string;
  formId: string;
  amount: number;
}

interface PaymentsState {
  payments: Payment[];
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
    setPayments: (state, action: PayloadAction<Payment[]>) => {
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