import axios from "axios";
import { STUDENTS_APIS, FETCH_PAYMENTS } from "../constants/constants";

interface Payment {
  paid_on: string;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  uid: string;
  form_id: string;
  amount: number;
}

export const getPayments = async (uid: string): Promise<Payment[]> => {
  try {
    const encodedUID = encodeURIComponent(uid);
    const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${FETCH_PAYMENTS}/${encodedUID}`);
    const data = response.data;
    if(!data.payments) {
      return [];
    }
    return data.payments;
  } catch (error) {
    throw new Error(`Error fetching payments for user. Please contact support.`);
  }
};