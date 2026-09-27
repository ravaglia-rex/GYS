import axios from 'axios';
import { PASSWORD_RESET_APIS } from '../constants/constants';

const base = () =>
  `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${PASSWORD_RESET_APIS}`;

export type PasswordResetRequestResult = {
  success: true;
  message: string;
  /** True when a new email was actually sent. */
  sent?: boolean;
  /** True when a recent send cooldown suppressed a duplicate email. */
  cooldown?: boolean;
};

function describePasswordResetRequestError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const bodyError =
      typeof error.response?.data?.error === 'string' ? error.response.data.error : undefined;
    if (bodyError) return bodyError;
    if (status === 429) {
      return 'Too many password-link requests. Please wait a minute and try again.';
    }
    if (status === 400) {
      return 'Could not request a password link. Check the email address and try again.';
    }
    if (status === 500) {
      return 'Could not send the password link. Please try again in a moment.';
    }
    if (error.message?.trim()) return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Could not send the password link. Please try again.';
}

/** Public: request a SendGrid password setup/reset email (Argus token, not Firebase OOB). */
export async function requestPasswordResetEmail(
  email: string
): Promise<PasswordResetRequestResult> {
  try {
    const res = await axios.post(`${base()}/request`, { email: email.trim().toLowerCase() });
    return res.data as PasswordResetRequestResult;
  } catch (error: unknown) {
    throw new Error(describePasswordResetRequestError(error));
  }
}

export async function validatePasswordResetToken(
  token: string
): Promise<{ valid: true; email: string; purpose: string } | { valid: false; error?: string }> {
  const res = await axios.post(`${base()}/validate`, { token });
  return res.data;
}

export async function completePasswordResetWithToken(
  token: string,
  password: string
): Promise<{ success: true; email: string }> {
  const res = await axios.post(`${base()}/complete`, { token, password });
  return res.data;
}
