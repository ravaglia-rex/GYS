import axios from 'axios';
import {
  RAZORPAY_APIS,
  CREATE_STUDENT_REGISTRATION_ORDER,
  VERIFY_STUDENT_REGISTRATION_PAYMENT,
} from '../constants/constants';

export type CreateStudentRegistrationOrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  membership_level: number;
  checkout_config_id?: string;
};

export const createStudentRegistrationOrder = async (
  email: string,
  membershipLevel: 1 | 2 | 3
): Promise<CreateStudentRegistrationOrderResponse> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? '';
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.');
  }
  try {
    const response = await axios.post(
      `${base}${RAZORPAY_APIS}${CREATE_STUDENT_REGISTRATION_ORDER}`,
      {email: email.trim().toLowerCase(), membership_level: membershipLevel}
    );
    return response.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data && typeof (e.response.data as {message?: unknown}).message === 'string') {
      throw new Error((e.response.data as {message: string}).message);
    }
    throw new Error('Could not start payment. Please try again.');
  }
};

export const verifyStudentRegistrationPayment = async (body: {
  email: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{success: boolean; razorpay_payment_id: string}> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? '';
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.');
  }
  try {
    const response = await axios.post(
      `${base}${RAZORPAY_APIS}${VERIFY_STUDENT_REGISTRATION_PAYMENT}`,
      body
    );
    return response.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data && typeof (e.response.data as {message?: unknown}).message === 'string') {
      throw new Error((e.response.data as {message: string}).message);
    }
    throw new Error('Payment verification failed.');
  }
};
