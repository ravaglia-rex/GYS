import axios from 'axios';
import type { TierProgressionConfig } from '../utils/tierProgression';
import {
  ASSESSMENTS_APIS,
  GET_ASSESSMENT_CONFIG,
  GET_STUDENT_ASSESSMENTS,
  INITIALIZE_EXAM,
  RECORD_ANSWER,
  COMPLETE_EXAM,
} from '../constants/constants';
import authTokenHandler from '../functions/auth_token/auth_token_handler';

export interface AssessmentTier {
  id: string;
  tier_number: number;
  name: string;
  description?: string;
  pass_threshold?: number;
  question_count?: number;
  time_limit_minutes?: number;
}

export interface AssessmentType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  is_adaptive?: boolean;
  tiers: AssessmentTier[];
  tier_progression?: TierProgressionConfig | null;
}

export interface AssessmentRecord {
  assessment_id: string;
  latest_attempt_id: string;
  latest_score: number;
  proficiency_tier: number;
  passed_current_tier: boolean;
  updated_at: any;
}

export interface AttemptRecord {
  attempt_id: string;
  assessment_id: string;
  proficiency_tier: number;
  status: 'in_progress' | 'completed';
  score: number | null;
  passed: boolean | null;
  started_at: any;
  completed_at: any | null;
}

export interface InitializedExam {
  attempt_id: string;
  total_questions: number;
  current_index: number;
  question: ExamQuestion | null;
}

/** Firestore / API may set question_type on items; otherwise UI infers from assessment + fields */
export type QuestionInteractionType =
  | 'visual_mcq'
  | 'passage_mcq'
  | 'likert'
  | 'listening_mcq'
  | 'spoken_response';

export interface ExamQuestion {
  id: string;
  prompt: string;
  options: string[];
  image_url?: string;
  difficulty?: number;
  passage?: string;
  audio_url?: string;
  question_type?: QuestionInteractionType;
}

export interface RecordAnswerResponse {
  done: boolean;
  current_index?: number;
  total_questions?: number;
  next_question: ExamQuestion | null;
}

export interface CompleteExamResponse {
  attempt_id: string;
  score_percent: number;
  correct: number;
  total: number;
  passed: boolean;
  next_tier: number | null;
}

// ─── Public (no auth) ────────────────────────────────────────────────────────

export const getAssessmentConfig = async (): Promise<AssessmentType[]> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error(
      'REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set. Add it to .env (Firebase function URL, e.g. https://asia-south1-PROJECT.cloudfunctions.net/api).'
    );
  }
  const response = await axios.get(`${base}${ASSESSMENTS_APIS}${GET_ASSESSMENT_CONFIG}`);
  const data = response.data;
  if (!Array.isArray(data)) {
    throw new Error(
      'Assessment config response was not a list. Ensure Firestore app_config/assessment_types exists and the API is deployed.'
    );
  }
  return data;
};

// ─── Auth-required ────────────────────────────────────────────────────────────

export const getStudentAssessments = async (uid: string): Promise<{ assessments: AssessmentRecord[]; attempts: AttemptRecord[] }> => {
  const authToken = await authTokenHandler.getAuthToken();
  const encodedUID = encodeURIComponent(uid);
  const response = await axios.get(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${GET_STUDENT_ASSESSMENTS}/${encodedUID}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};

export const initializeExam = async (
  uid: string,
  assessment_id: string,
  tier_number: number,
  language?: string
): Promise<InitializedExam> => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${INITIALIZE_EXAM}`,
    { uid, assessment_id, tier_number, language },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};

export const recordAnswer = async (
  uid: string,
  attempt_id: string,
  item_id: string,
  selected_option: number,
  time_spent_ms?: number
): Promise<RecordAnswerResponse> => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${RECORD_ANSWER}`,
    { uid, attempt_id, item_id, selected_option, time_spent_ms },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};

export const completeExam = async (uid: string, attempt_id: string): Promise<CompleteExamResponse> => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${COMPLETE_EXAM}`,
    { uid, attempt_id },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};
