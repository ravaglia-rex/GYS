import axios from 'axios';
import {
  CREATE_SCHOOL_UPGRADE_ORDER,
  RAZORPAY_APIS,
  VERIFY_SCHOOL_UPGRADE_PAYMENT,
} from '../constants/constants';
import authTokenHandler from '../functions/auth_token/auth_token_handler';

export type CreateSchoolUpgradeOrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  customer_id?: string;
  from_plan_id: string;
  target_plan_id: string;
  from_plan_name: string;
  target_plan_name: string;
  checkout_config_id?: string;
};

function messageFromAxios(e: unknown): string | null {
  if (!axios.isAxiosError(e) || !e.response?.data) {
    return null;
  }
  const data = e.response.data as { message?: unknown; error?: unknown };
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  return null;
}

async function getRequiredAuthToken(): Promise<string> {
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new Error('You are not signed in. Please sign in again.');
  }
  return authToken;
}

export async function createSchoolUpgradeOrder(
  schoolId: string,
  targetPlanId: string
): Promise<CreateSchoolUpgradeOrderResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? '';
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.');
  }
  const authToken = await getRequiredAuthToken();
  try {
    const response = await axios.post(
      `${base}${RAZORPAY_APIS}${CREATE_SCHOOL_UPGRADE_ORDER}`,
      {
        school_id: schoolId,
        target_plan_id: targetPlanId,
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (e) {
    throw new Error(messageFromAxios(e) ?? 'Could not start payment. Please try again.');
  }
}

export async function verifySchoolUpgradePayment(body: {
  school_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ success: boolean; razorpay_payment_id: string }> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? '';
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.');
  }
  const authToken = await getRequiredAuthToken();
  try {
    const response = await axios.post(`${base}${RAZORPAY_APIS}${VERIFY_SCHOOL_UPGRADE_PAYMENT}`, body, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (e) {
    throw new Error(messageFromAxios(e) ?? 'Payment verification failed.');
  }
}
