import axios from 'axios';
import { EMAIL_CHECK_APIS, CHECK_EMAIL_EXISTS } from '../constants/constants';

// Checks both students and school admins via the backend endpoint.
// Returns { exists: boolean, type: 'student' | 'schooladmin' | null }.
export const checkEmailExists = async (email: string): Promise<{ exists: boolean; type: string | null }> => {
  try {
    const encodedEmail = encodeURIComponent(email);
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${EMAIL_CHECK_APIS}${CHECK_EMAIL_EXISTS}/${encodedEmail}`
    );
    return response.data;
  } catch (error) {
    console.error('checkEmailExists failed:', error);
    return { exists: false, type: null };
  }
};

// Kept as a no-op — email is now stored directly on the student document
// during runSignUpTransaction. No separate email mapping collection exists.
export const addEmailMapping = async (_uid: string, _email: string): Promise<void> => {
  // No-op: email is stored on students/{uid}.email_normalized
};
