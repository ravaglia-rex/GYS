import axios from 'axios';
import {
  ASSESSMENTS_APIS,
  GET_ATTEMPT_PROCTORING,
  GET_PROCTORING_UPLOAD_URL,
  RECORD_PROCTORING_EVENT,
  SCHOOL_ADMINS_APIS,
} from '../../constants/constants';
import authTokenHandler from '../../functions/auth_token/auth_token_handler';
import type { FlaggedProctoringAttempt, ProctoringEventSeverity, ProctoringEventType } from './types';

export async function recordProctoringEvent(params: {
  uid: string;
  attempt_id: string;
  event_type: ProctoringEventType;
  severity: ProctoringEventSeverity;
  client_timestamp?: number;
  snapshot_s3_key?: string | null;
}): Promise<{ ok: boolean; event_id: string }> {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${RECORD_PROCTORING_EVENT}`,
    {
      ...params,
      client_timestamp: params.client_timestamp ?? Date.now(),
    },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
}

export async function getProctoringUploadUrl(params: {
  uid: string;
  attempt_id: string;
  event_id: string;
}): Promise<{ upload_url: string; object_key: string }> {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${GET_PROCTORING_UPLOAD_URL}`,
    params,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
}

export async function getAttemptProctoring(uid: string, attemptId: string) {
  const authToken = await authTokenHandler.getAuthToken();
  const encodedUID = encodeURIComponent(uid);
  const encodedAttempt = encodeURIComponent(attemptId);
  const response = await axios.get(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${GET_ATTEMPT_PROCTORING}/${encodedUID}/${encodedAttempt}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
}

export async function getSchoolStudentProctoringFlags(
  studentId: string
): Promise<{ student_id: string; flagged_attempts: FlaggedProctoringAttempt[]; s3_configured: boolean }> {
  const authToken = await authTokenHandler.getAuthToken();
  const encodedStudentId = encodeURIComponent(studentId);
  const response = await axios.get(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}/students/${encodedStudentId}/proctoringFlags`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
}

/** Presign a single proctoring snapshot on click (avoids N eager signs on flags list load). */
export async function getSchoolStudentProctoringSnapshotUrl(
  studentId: string,
  objectKey: string
): Promise<{ url: string; expires_in: number }> {
  const authToken = await authTokenHandler.getAuthToken();
  const encodedStudentId = encodeURIComponent(studentId);
  const response = await axios.get(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}/students/${encodedStudentId}/proctoringSnapshotUrl`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { key: objectKey },
    }
  );
  return response.data;
}
