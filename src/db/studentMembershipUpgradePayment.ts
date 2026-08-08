import axios from 'axios';
import {
  RAZORPAY_APIS,
  CREATE_STUDENT_UPGRADE_ORDER,
  VERIFY_STUDENT_UPGRADE_PAYMENT,
  APPLY_STUDENT_UPGRADE_WITH_CREDIT,
} from '../constants/constants';
import authTokenHandler from '../functions/auth_token/auth_token_handler';

export type CreateStudentUpgradeOrderResponse = {
  free_upgrade?: boolean;
  order_id: string | null;
  amount: number;
  currency: string;
  key_id?: string;
  from_membership_level: number;
  target_membership_level: number;
  checkout_config_id?: string;
  list_amount_paise?: number;
  credit_applied_paise?: number;
  credit_remaining_paise?: number;
  charge_paise?: number;
};

export type ApplyStudentUpgradeWithCreditResponse = {
  success: boolean;
  free_upgrade: boolean;
  from_membership_level: number;
  target_membership_level: number;
  list_amount_paise: number;
  credit_applied_paise: number;
  credit_remaining_paise: number;
  charge_paise: number;
};

export type StudentUpgradeBillingDetails = {
  contact: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipcode: string;
};

function messageFromAxios(e: unknown): string | null {
  if (axios.isAxiosError(e) && e.response?.data && typeof (e.response.data as { message?: unknown }).message === 'string') {
    return (e.response.data as { message: string }).message;
  }
  return null;
}

export async function createStudentUpgradeOrder(
  targetLevel: 1 | 2 | 3 | 4,
  billingDetails?: StudentUpgradeBillingDetails
): Promise<CreateStudentUpgradeOrderResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? '';
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.');
  }
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new Error('You are not signed in. Please sign in again.');
  }
  try {
    const response = await axios.post(
      `${base}${RAZORPAY_APIS}${CREATE_STUDENT_UPGRADE_ORDER}`,
      {
        target_membership_level: targetLevel,
        ...(billingDetails ? { billing_details: billingDetails } : {}),
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (e) {
    const m = messageFromAxios(e);
    throw new Error(m ?? 'Could not start payment. Please try again.');
  }
}

export async function applyStudentUpgradeWithCredit(
  targetLevel: 1 | 2 | 3 | 4
): Promise<ApplyStudentUpgradeWithCreditResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? '';
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.');
  }
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new Error('You are not signed in. Please sign in again.');
  }
  try {
    const response = await axios.post(
      `${base}${RAZORPAY_APIS}${APPLY_STUDENT_UPGRADE_WITH_CREDIT}`,
      { target_membership_level: targetLevel },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (e) {
    const m = messageFromAxios(e);
    throw new Error(m ?? 'Could not apply prepaid credit. Please try again.');
  }
}

export async function verifyStudentUpgradePayment(body: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ success: boolean; razorpay_payment_id: string; already_processed?: boolean }> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? '';
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.');
  }
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new Error('You are not signed in. Please sign in again.');
  }
  try {
    const response = await axios.post(`${base}${RAZORPAY_APIS}${VERIFY_STUDENT_UPGRADE_PAYMENT}`, body, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (e) {
    const m = messageFromAxios(e);
    throw new Error(m ?? 'Payment verification failed.');
  }
}
