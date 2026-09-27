import axios from 'axios';
import { EMAIL_CHECK_APIS, CHECK_EMAIL_EXISTS } from '../constants/constants';

// Checks both students and school admins via the backend endpoint.
export type EmailExistsResult = {
  exists: boolean;
  type: string | null;
  /** True only for unfinished paid student signup (resume checkout). */
  pendingPaymentResume?: boolean;
  /** Present when type is platformadmin - personal password already created. */
  passwordSetupComplete?: boolean;
};

function describeEmailCheckError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const bodyError =
      typeof error.response?.data?.error === 'string' ? error.response.data.error : undefined;
    if (bodyError) return bodyError;
    if (status === 429) {
      return 'Too many email checks. Please wait a moment and try again.';
    }
    if (status && status >= 500) {
      return 'Could not check your email right now. Please try again later.';
    }
    if (error.message?.trim()) return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'There was an issue checking your email. Please try again later.';
}

// Returns { exists: boolean, type: 'student' | 'schooladmin' | 'platformadmin' | null }.
export const checkEmailExists = async (email: string): Promise<EmailExistsResult> => {
  try {
    const encodedEmail = encodeURIComponent(email);
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${EMAIL_CHECK_APIS}${CHECK_EMAIL_EXISTS}/${encodedEmail}`
    );
    return response.data;
  } catch (error: unknown) {
    // 404 means "no account" — keep returning exists:false for that case only.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { exists: false, type: null };
    }
    console.error('checkEmailExists failed:', error);
    throw new Error(describeEmailCheckError(error));
  }
};

// Kept as a no-op - email is now stored directly on the student document
// during runSignUpTransaction. No separate email mapping collection exists.
export const addEmailMapping = async (_uid: string, _email: string): Promise<void> => {
  // No-op: email is stored on students/{uid}.email (normalized)
};
