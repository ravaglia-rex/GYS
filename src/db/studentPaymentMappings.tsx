import axios from "axios";
import { STUDENTS_APIS, FETCH_PAYMENTS } from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

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
    const authToken = await authTokenHandler.getAuthToken();
    const encodedUID = encodeURIComponent(uid);
    const config = {
      method: 'get',
      url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${FETCH_PAYMENTS}/${encodedUID}`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };
    const response = await axios.request(config);
    const data = response.data;
    if(!data) {
      return [];
    }
    return data;
  } catch (error) {
    throw new Error(`Error fetching payments for user. Please contact support.`);
  }
};