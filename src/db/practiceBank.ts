import axios from 'axios';
import type { ExamQuestion } from './assessmentCollection';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import { auth } from '../firebase/firebase';
import {
  GET_PRACTICE_POOL_COUNTS,
  GET_PRACTICE_QUESTIONS,
  PRACTICE_APIS,
  RECORD_PRACTICE_OUTCOME,
  RECORD_PRACTICE_SESSION_OUTCOMES,
  RESET_PRACTICE_PROGRESS,
  REVEAL_PRACTICE_SOLUTIONS,
} from '../constants/constants';

/** Matches backend default batch size for one practice start. */
export const PRACTICE_SESSION_BATCH_SIZE = 10;

export interface PracticePoolCountsResponse {
  exam_id: string;
  counts: Record<string, number>;
}

export interface PracticeQuestionsResponse {
  exam_id: string;
  level: number;
  total_in_level: number;
  returned: number;
  draw_seen_count?: number;
  draw_remaining_after_returned?: number;
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

/** Random sample of practice questions (stem/options only; solutions via {@link revealPracticeSolutions}). */
export async function fetchPracticeQuestions(
  examId: string,
  level: 1 | 2 | 3,
  limit = PRACTICE_SESSION_BATCH_SIZE
): Promise<PracticeQuestionsResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to load practice questions.');
  }
  const authToken = await user.getIdToken();
  authTokenHandler.setAuthToken(authToken);
  const response = await axios.get(`${base}${PRACTICE_APIS}${GET_PRACTICE_QUESTIONS}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    params: { exam_id: examId, level: String(level), limit },
  });
  return response.data;
}

export type PracticeSolutionReveal = {
  correct_option_index: number | null;
  solution_steps: string[] | null;
};

/** Fetch answer keys + solution steps for the current page when the student checks answers. */
export async function revealPracticeSolutions(params: {
  examId: string;
  level: 1 | 2 | 3;
  itemIds: string[];
}): Promise<Record<string, PracticeSolutionReveal>> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to reveal practice solutions.');
  }
  const authToken = await user.getIdToken();
  authTokenHandler.setAuthToken(authToken);
  const response = await axios.post(
    `${base}${PRACTICE_APIS}${REVEAL_PRACTICE_SOLUTIONS}`,
    {
      exam_id: params.examId,
      level: String(params.level),
      item_ids: params.itemIds,
    },
    { headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' } }
  );
  const data = response.data as { ok?: boolean; solutions?: Record<string, PracticeSolutionReveal> };
  return data.solutions ?? {};
}

export interface RecordPracticeOutcomeResponse {
  ok: boolean;
  outcome_id?: string;
  correct?: boolean;
}

/** Persist one practice attempt to the student profile (server writes Firestore). */
export async function recordPracticeItemOutcome(params: {
  examId: string;
  level: 1 | 2 | 3;
  itemId: string;
  selectedOptionIndex: number;
  timeToFirstCheckMs: number;
}): Promise<RecordPracticeOutcomeResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to record practice outcomes.');
  }
  const authToken = await user.getIdToken();
  authTokenHandler.setAuthToken(authToken);
  const response = await axios.post(
    `${base}${PRACTICE_APIS}${RECORD_PRACTICE_OUTCOME}`,
    {
      exam_id: params.examId,
      level: String(params.level),
      item_id: params.itemId,
      selected_option_index: params.selectedOptionIndex,
      time_to_first_check_ms: params.timeToFirstCheckMs,
    },
    { headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
}

export interface PracticeSessionResultRow {
  item_id: string;
  selected_option_index: number;
  time_to_first_check_ms: number;
}

export interface RecordPracticeSessionOutcomesResponse {
  ok: boolean;
  recorded?: number;
  correct_count?: number;
  coins_awarded?: number;
  coins_reason?: 'weekly_cap' | 'honesty' | 'insufficient_questions' | null;
}

/** Persist a full practice session in one request (student outcomes + bank analytics). */
export async function recordPracticeSessionOutcomes(params: {
  examId: string;
  level: 1 | 2 | 3;
  results: PracticeSessionResultRow[];
  sessionId: string;
}): Promise<RecordPracticeSessionOutcomesResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to record practice outcomes.');
  }
  const authToken = await user.getIdToken();
  authTokenHandler.setAuthToken(authToken);
  const response = await axios.post(
    `${base}${PRACTICE_APIS}${RECORD_PRACTICE_SESSION_OUTCOMES}`,
    {
      exam_id: params.examId,
      level: String(params.level),
      results: params.results,
      session_id: params.sessionId,
    },
    { headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
}

export interface ResetPracticeProgressResponse {
  ok: boolean;
  exam_id: string;
  level: number;
  draw_seen_count?: number;
  historical_seen_count?: number;
}

/** Clear seen items for this exam level (server updates seen_item_ids_by_level on practice_outcomes/{examId}). */
export async function resetPracticeProgress(params: {
  examId: string;
  level: 1 | 2 | 3;
}): Promise<ResetPracticeProgressResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set.');
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to reset practice progress.');
  }
  const authToken = await user.getIdToken();
  authTokenHandler.setAuthToken(authToken);
  const response = await axios.post(
    `${base}${PRACTICE_APIS}${RESET_PRACTICE_PROGRESS}`,
    {
      exam_id: params.examId,
      level: String(params.level),
    },
    { headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' } }
  );
  return response.data;
}
