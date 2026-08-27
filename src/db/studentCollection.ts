import axios from "axios";
import {
  STUDENTS_APIS,
  FETCH_STUDENT_DATA,
  UPDATE_STUDENT_DATA,
  MARK_STUDENT_PASSWORD_SETUP_COMPLETE,
  LIST_STUDENT_REPORTS,
  STUDENT_REPORT_DOWNLOAD_URL,
  SEND_NOTIFICATION_EMAILS,
  SCHOOLS_FOR_STUDENT_EMAIL,
  SET_STUDENT_ACTIVE_SCHOOL,
} from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";
import { downloadPdfFromUrl } from "./schoolAdminCollection";
import type { CompletedAssessmentNotificationSource } from "../utils/dashboardNotifications";

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
          'No student profile found for your account. If you just registered, wait a minute and refresh. Otherwise contact globalyoungscholar@argus.ai.'
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
      `Could not load your profile. Please contact globalyoungscholar@argus.ai`
    );
  }
};

export type HowGysWorksUiPreferences = {
    visited?: boolean;
    acknowledged?: boolean;
};

export type StudentTutorialUiPreferences = {
    tutorials?: {
        dismissed?: Record<string, boolean>;
    };
    how_gys_works?: HowGysWorksUiPreferences;
};

export type UpdateStudentPayload = {
    first_name?: string;
    last_name?: string;
    about_me?: string;
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
    phone_number?: string;
    grade?: number;
    date_of_birth?: string;
    city_state?: string;
    home_language?: string;
    aspiration?: string;
    heard_from?: string;
    ui_preferences?: StudentTutorialUiPreferences;
};

export type UpdateStudentResult = {
  profile_completion?: {
    percent: number;
    filled: number;
    total: number;
    complete: boolean;
    reward_coins: number;
  };
  profile_completion_coins_awarded?: number;
};

export const updateStudent = async (
  user_id: string,
  student: UpdateStudentPayload
): Promise<UpdateStudentResult> => {
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
        const response = await axios.request(config);
        const data = (response?.data ?? {}) as UpdateStudentResult;
        return {
          profile_completion: data.profile_completion,
          profile_completion_coins_awarded:
            typeof data.profile_completion_coins_awarded === 'number'
              ? data.profile_completion_coins_awarded
              : 0,
        };
    } catch (error) {
        throw new Error(`Error updating student for user ${user_id}. Please contact globalyoungscholar@argus.ai`);
    }
}

/** After password setup, cache password_setup_complete on the student doc (no-ops if not a student). */
export const markStudentPasswordSetupComplete = async (): Promise<void> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    if (!authToken) return;
    await axios.post(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${MARK_STUDENT_PASSWORD_SETUP_COMPLETE}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
  } catch (error) {
    console.warn('markStudentPasswordSetupComplete failed:', error);
  }
};

export type StudentSchoolOption = {
  schoolId: string;
  schoolName: string;
  city?: string;
};

/** Hidden staff student only: schools this email may enter (invite list + current school). */
export const listSchoolsForStudentEmail = async (): Promise<StudentSchoolOption[]> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${SCHOOLS_FOR_STUDENT_EMAIL}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return Array.isArray(response.data?.schools) ? response.data.schools : [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(String(error.response.data.message));
    }
    throw new Error('Could not load schools for this student email.');
  }
};

/** Hidden staff student only: switch active school_id among invite-list schools. */
export const setStudentActiveSchool = async (
  schoolId: string
): Promise<StudentSchoolOption> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.post(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${SET_STUDENT_ACTIVE_SCHOOL}`,
      { schoolId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return {
      schoolId: String(response.data?.schoolId ?? schoolId),
      schoolName: typeof response.data?.schoolName === 'string' ? response.data.schoolName : '',
      city: typeof response.data?.city === 'string' ? response.data.city : undefined,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(String(error.response.data.message));
    }
    throw new Error('Could not switch school.');
  }
};

export const sendNotificationEmails = async (params: {
  notificationIds: string[];
  availableAssessmentsCount: number;
  completedAssessments: CompletedAssessmentNotificationSource[];
}): Promise<void> => {
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    return;
  }
  await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${SEND_NOTIFICATION_EMAILS}`,
    params,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
};

export interface StudentReportListItem {
  reportId: string;
  reportType?: string | null;
  milestone: number | null;
  generatedAt: string | null;
  pdfFilename: string | null;
  hasPdf: boolean;
  completedAssessmentCount: number | null;
}

export interface StudentReportsResponse {
  reports: StudentReportListItem[];
  s3Configured: boolean;
}

export const getStudentReports = async (uid: string): Promise<StudentReportsResponse> => {
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new Error('You are not signed in. Please sign in again.');
  }
  const encodedUID = encodeURIComponent(uid);
  const response = await axios.get(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${LIST_STUDENT_REPORTS}/${encodedUID}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data as StudentReportsResponse;
};

const STUDENT_REPORT_URL_CACHE_TTL_MS = 540_000;
const studentReportUrlCache = new Map<string, { url: string; filename: string; expiresAt: number }>();

export const getStudentReportDownloadUrl = async (
  uid: string,
  reportId: string
): Promise<{ url: string; filename: string; reportId: string }> => {
  const cacheKey = `student-report:${uid}:${reportId}`;
  const cached = studentReportUrlCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return { url: cached.url, filename: cached.filename, reportId };
  }
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new Error('You are not signed in. Please sign in again.');
  }
  const encodedUID = encodeURIComponent(uid);
  const encodedReportId = encodeURIComponent(reportId);
  const response = await axios.get(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${STUDENT_REPORT_DOWNLOAD_URL}/${encodedUID}/${encodedReportId}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const data = response.data as { url: string; filename: string; reportId: string };
  studentReportUrlCache.set(cacheKey, {
    url: data.url,
    filename: data.filename,
    expiresAt: Date.now() + STUDENT_REPORT_URL_CACHE_TTL_MS,
  });
  return data;
};

export const downloadStudentReport = async (uid: string, reportId: string): Promise<void> => {
  const { url, filename } = await getStudentReportDownloadUrl(uid, reportId);
  await downloadPdfFromUrl(url, filename || `${reportId}.pdf`);
};