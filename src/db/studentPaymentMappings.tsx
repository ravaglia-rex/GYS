import axios from "axios";
import { STUDENTS_APIS, FETCH_PAYMENTS } from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

export interface StudentPaymentHistoryItem {
  id: string;
  payment_id: string;
  order_id: string | null;
  kind: "student_registration_signup" | "student_membership_upgrade" | "student_membership_renewal" | "failed";
  payment_status: "captured" | "failed" | "pending";
  paid_at: string | null;
  amount_paise: number | null;
  membership_level: number | null;
  from_membership_level: number | null;
  target_membership_level: number | null;
  payment_method: string;
  invoice_number: string | null;
  description: string;
  error_code: string | null;
  error_description: string | null;
}

export const getPayments = async (uid: string): Promise<StudentPaymentHistoryItem[]> => {
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
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(`Error fetching payments for user. Please contact support.`);
  }
};