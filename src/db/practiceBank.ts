import axios from 'axios';
import type { ExamQuestion } from './assessmentCollection';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import {
  GET_PRACTICE_POOL_COUNTS,
  GET_PRACTICE_QUESTIONS,
  PRACTICE_APIS,
} from '../constants/constants';

export interface PracticePoolCountsResponse {
  exam_id: string;
  counts: Record<string, number>;
}

export interface PracticeQuestionsResponse {
  exam_id: string;
  level: number;
  total_in_level: number;
  returned: number;
  questions: ExamQuestion[];
}

/** Live pool sizes per official difficulty level (1–3) from Firestore practice_bank summary. */
export async function fetchPracticePoolCounts(examId: string): Promise<PracticePoolCountsResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set.');
  }
  const authToken = await authTokenHandler.getAuthToken();
  const encoded = encodeURIComponent(examId);
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await axios.get(`${base}${PRACTICE_APIS}${GET_PRACTICE_POOL_COUNTS}/${encoded}`, {
    headers,
  });
  return response.data;
}

/** Random sample of normalized practice questions (no answer keys). */
export async function fetchPracticeQuestions(
  examId: string,
  level: 1 | 2 | 3,
  limit = 15
): Promise<PracticeQuestionsResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set.');
  }
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.get(`${base}${PRACTICE_APIS}${GET_PRACTICE_QUESTIONS}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    params: { exam_id: examId, level: String(level), limit },
  });
  return response.data;
}
