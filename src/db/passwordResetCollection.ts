import axios from 'axios';
import { PASSWORD_RESET_APIS } from '../constants/constants';

const base = () =>
  `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${PASSWORD_RESET_APIS}`;

/** Public: request a SendGrid password setup/reset email (Argus token, not Firebase OOB). */
export async function requestPasswordResetEmail(email: string): Promise<void> {
  await axios.post(`${base()}/request`, { email: email.trim().toLowerCase() });
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
