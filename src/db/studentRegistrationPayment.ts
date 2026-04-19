import axios from 'axios';
import {
  RAZORPAY_APIS,
  CREATE_STUDENT_REGISTRATION_ORDER,
  DEV_BYPASS_STUDENT_SIGNUP_CLAIM,
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

/**
 * Dev bypass: creates `razorpay_signup` on the API without Razorpay.
 * Requires `DEV_BYPASS_RAZORPAY_STUDENT_SIGNUP=true` on functions; otherwise 404.
 */
export const devBypassStudentSignupPaymentClaim = async (
  email: string,
  membershipLevel: 1 | 2 | 3
): Promise<{ success: boolean; razorpay_payment_id: string; dev_bypass?: boolean }> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? '';
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.');
  }
  try {
    const response = await axios.post(`${base}${RAZORPAY_APIS}${DEV_BYPASS_STUDENT_SIGNUP_CLAIM}`, {
      email: email.trim().toLowerCase(),
      membership_level: membershipLevel,
    });
    return response.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      throw new Error(
        'Dev bypass is off on the API. Set DEV_BYPASS_RAZORPAY_STUDENT_SIGNUP=true in argus-backend/functions/.env and restart emulators.'
      );
    }
    if (axios.isAxiosError(e) && e.response?.data && typeof (e.response.data as {message?: unknown}).message === 'string') {
      throw new Error((e.response.data as {message: string}).message);
    }
    throw new Error('Dev bypass request failed.');
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
