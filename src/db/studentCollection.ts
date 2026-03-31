import axios from "axios";
import { STUDENTS_APIS, FETCH_STUDENT_DATA, UPDATE_STUDENT_DATA } from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

/** Thrown from getStudent so callers can show specific UI (404 = no Firestore profile, etc.). */
export class StudentProfileError extends Error {
  readonly code: 'NO_TOKEN' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'SERVER' | 'NETWORK';

  constructor(code: StudentProfileError['code'], message: string) {
    super(message);
    this.name = 'StudentProfileError';
    this.code = code;
  }
}

export const getStudent = async (userId: string) => {
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new StudentProfileError(
      'NO_TOKEN',
      'You are not signed in. Please sign in again.'
    );
  }

  const encodedUID = encodeURIComponent(userId);
  const config = {
    method: 'get' as const,
    url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${FETCH_STUDENT_DATA}/${encodedUID}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) {
        throw new StudentProfileError(
          'NOT_FOUND',
          'No student profile found for your account. If you just registered, wait a minute and refresh. Otherwise contact talentsearch@argus.ai.'
        );
      }
      if (status === 401) {
        throw new StudentProfileError(
          'UNAUTHORIZED',
          'Your session expired or is invalid. Please sign out and sign in again.'
        );
      }
      if (status != null && status >= 500) {
        throw new StudentProfileError(
          'SERVER',
          'The server could not load your profile. Please try again in a few minutes.'
        );
      }
      if (error.code === 'ERR_NETWORK' || !error.response) {
        const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? '';
        const localApi = /127\.0\.0\.1|localhost/i.test(base);
        const hint = localApi
          ? ' Your .env points at the Functions emulator - start it from argus-backend (e.g. firebase emulators:start), or switch REACT_APP_GOOGLE_CLOUD_FUNCTIONS to your deployed https://…/api URL and restart npm run serve.'
          : '';
        throw new StudentProfileError(
          'NETWORK',
          'Could not reach Argus (network or wrong API URL). Check REACT_APP_GOOGLE_CLOUD_FUNCTIONS and your connection.' +
            hint
        );
      }
    }
    throw new StudentProfileError(
      'SERVER',
      `Could not load your profile. Please contact talentsearch@argus.ai`
    );
  }
};

export const updateStudent = async (user_id: string, student: {first_name?: string, last_name?: string, about_me?: string, parent_name?: string, parent_email?: string, parent_phone?: string, phone_number?: string, grade?: number}) => {
    try {
        const authToken = await authTokenHandler.getAuthToken();
        const config = {
            method: 'post',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${UPDATE_STUDENT_DATA}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                uid: user_id,
                student: student
            }
        };
        await axios.request(config);
        return;
    } catch (error) {
        throw new Error(`Error updating student for user ${user_id}. Please contact talentsearch@argus.ai`);
    }
}