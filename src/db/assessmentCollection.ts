import axios from 'axios';
import type { TierProgressionConfig } from '../utils/tierProgression';
import {
  ASSESSMENTS_APIS,
  GET_ASSESSMENT_CONFIG,
  GET_OFFICIAL_EXAM_OPS,
  GET_STUDENT_ASSESSMENTS,
  INITIALIZE_EXAM,
  PREFETCH_NEXT_QUESTION,
  RECORD_ANSWER,
  RECORD_ANSWERS_BATCH,
  COMPLETE_EXAM,
  ABANDON_EXAM,
  REPORT_QUESTION_PROBLEM,
} from '../constants/constants';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import { canonicalizeAssessmentList } from '../utils/assessmentIdCompat';

export interface AssessmentTier {
  id: string;
  tier_number: number;
  name: string;
  description?: string;
  pass_threshold?: number;
  pass_threshold_points?: number;
  question_count?: number;
  time_limit_minutes?: number;
}

export interface ProctoringConfig {
  enabled: boolean;
  min_face_checks?: number;
  snapshot_on_violation?: boolean;
  check_interval_sec?: number;
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
  proctoring?: ProctoringConfig;
}

export interface AssessmentRecord {
  assessment_id: string;
  latest_attempt_id: string;
  latest_score: number;
  proficiency_tier: number;
  passed_current_tier: boolean;
  updated_at: any;
}

export interface AbandonExamResponse {
  ok: boolean;
  strikes: number;
  scored_from_abandon?: boolean;
  scored_zero?: boolean;
  next_attempt_available_at_ms?: number | null;
  suspended: boolean;
  suspended_until_ms: number | null;
}

export interface AttemptRecord {
  attempt_id: string;
  assessment_id: string;
  proficiency_tier: number;
  /** Legacy docs may still have `abandoned`; new exits use `failed`. */
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';
  score: number | null;
  passed: boolean | null;
  started_at: any;
  completed_at: any | null;
  failed_at?: any | null;
  abandoned_at?: any | null;
  /** Argus Coins granted when this attempt was scored (official exams). */
  coins_awarded?: number | null;
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
  /** Analytical Reasoning markdown items: body already contains stem, diagrams, and A–D labels. */
  format?: string;
  body_markdown?: string;
  option_ids?: string[];
  assets?: Array<{path?: string; alt?: string}>;
  option_figure?: {src: string; alt?: string} | null;
  /**
   * Explicit AR display hints from the bank (preferred over heuristics).
   * display_mode: figure_tiles | letter_buttons | text_options
   */
  display_mode?: 'figure_tiles' | 'letter_buttons' | 'text_options';
  stem_display_size?: 'small' | 'medium' | 'large' | 'normal';
  option_display_size?: 'small' | 'medium' | 'large' | 'normal';
  /** Per stem SVG filename → size (shrink one figure without changing others). */
  stem_image_display_sizes?: Record<string, 'small' | 'medium' | 'large'> | null;
  option_crops?: {
    layout: 'row' | 'stack' | 'grid';
    naturalWidth: number;
    naturalHeight: number;
    slices: Array<{xPct: number; yPct: number; wPct: number; hPct: number; kind: 'grid' | 'wide'}>;
    stemSlice: {xPct: number; yPct: number; wPct: number; hPct: number; kind: 'grid' | 'wide'} | null;
  } | null;
  /** Extra stem line from canonical `presentation.instruction`. */
  instruction?: string;
  /** Canonical pattern-logic payload for richer renderers (optional). */
  stimulus?: unknown;
  stimulus_type?: string;
  option_layout?: string;
  image_url?: string;
  difficulty?: number;
  passage?: string;
  passage_id?: string;
  audio_url?: string;
  question_type?: QuestionInteractionType;
  /** Original nested presentation when present (answer fields stripped server-side). */
  presentation?: Record<string, unknown>;
  /** Practice bank only: 0–3 correct MCQ index (never sent for official timed exams). */
  correct_option_index?: number;
  /** Practice bank only: step-by-step explanation from authoring / `scoring.solution_steps`. */
  solution_steps?: string[];
}

export interface VerbalPassageGroupQuestion extends ExamQuestion {
  /** Absolute index in the attempt question_queue. */
  queue_index?: number;
}

export interface VerbalPassageGroup {
  group_start_index: number;
  group_size: number;
  passage_markdown: string;
  questions: VerbalPassageGroupQuestion[];
}

export interface InitializedExam {
  attempt_id: string;
  total_questions: number;
  current_index: number;
  question: ExamQuestion | null;
  /** Verbal multi-item passage: show all sibling questions on one screen. */
  passage_group?: VerbalPassageGroup | null;
  /** Server-computed; null if this assessment has no time limit */
  seconds_remaining?: number | null;
  resumed?: boolean;
  proctoring?: ProctoringConfig;
  proctoring_enabled?: boolean;
  /** Timed sit already ended; scores may be present after auto-finalize. */
  time_expired?: boolean;
  score_percent?: number;
  score_points?: number;
  correct?: number;
  total?: number;
  passed?: boolean;
  next_tier?: number | null;
  coins_awarded?: number;
}

export interface RecordAnswerResponse {
  done: boolean;
  current_index?: number;
  total_questions?: number;
  next_question: ExamQuestion | null;
  next_item_id?: string | null;
  prefetch_accepted?: boolean;
  already_recorded?: boolean;
  passage_group?: VerbalPassageGroup | null;
}

export interface PrefetchNextQuestionResponse {
  next_question: ExamQuestion | null;
  next_item_id: string | null;
  next_index: number | null;
  prefetchable: boolean;
  passage_group?: VerbalPassageGroup | null;
}

export interface CompleteExamResponse {
  attempt_id: string;
  /** Present only when student score reveal is enabled on the server. */
  score_percent?: number;
  score_points?: number;
  correct?: number;
  total?: number;
  passed?: boolean;
  next_tier?: number | null;
  coins_awarded?: number;
  already_completed?: boolean;
  results_pending?: boolean;
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
  // Exam 1 is expected to already be stored as analytical_reasoning.
  return canonicalizeAssessmentList(data as AssessmentType[]);
};

export type OfficialExamOps = {
  new_starts_paused: boolean;
};

/** Public ops flag — short cache; toggled in Firestore app_config/official_exam_ops. */
export const getOfficialExamOps = async (): Promise<OfficialExamOps> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    return { new_starts_paused: false };
  }
  const response = await axios.get(`${base}${ASSESSMENTS_APIS}${GET_OFFICIAL_EXAM_OPS}`);
  return {
    new_starts_paused: response.data?.new_starts_paused === true,
  };
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

/** Section-boundary Next can assemble the next block; fail loudly instead of spinning forever. */
const EXAM_MUTATION_TIMEOUT_MS = 60_000;

export const initializeExam = async (
  uid: string,
  assessment_id: string,
  tier_number: number,
  language?: string,
  device_fingerprint?: string
): Promise<InitializedExam> => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${INITIALIZE_EXAM}`,
    {
      uid,
      assessment_id,
      tier_number,
      language,
      ...(device_fingerprint ? { device_fingerprint } : {}),
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: EXAM_MUTATION_TIMEOUT_MS,
    }
  );
  return response.data;
};

export const prefetchNextQuestion = async (
  uid: string,
  attempt_id: string
): Promise<PrefetchNextQuestionResponse> => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${PREFETCH_NEXT_QUESTION}`,
    { uid, attempt_id },
    {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: EXAM_MUTATION_TIMEOUT_MS,
    }
  );
  return {
    next_question: response.data?.next_question ?? null,
    next_item_id:
      typeof response.data?.next_item_id === 'string' ? response.data.next_item_id : null,
    next_index:
      typeof response.data?.next_index === 'number' ? response.data.next_index : null,
    prefetchable: response.data?.prefetchable === true,
  };
};

export const recordAnswer = async (
  uid: string,
  attempt_id: string,
  item_id: string,
  selected_option: number,
  time_spent_ms?: number,
  device_fingerprint?: string,
  prefetch_item_id?: string,
  opts?: { includePassageGroup?: boolean }
): Promise<RecordAnswerResponse> => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${RECORD_ANSWER}`,
    {
      uid,
      attempt_id,
      item_id,
      selected_option,
      time_spent_ms,
      ...(device_fingerprint ? { device_fingerprint } : {}),
      ...(prefetch_item_id ? { prefetch_item_id } : {}),
      ...(opts?.includePassageGroup === false ? { include_passage_group: false } : {}),
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: EXAM_MUTATION_TIMEOUT_MS,
    }
  );
  return response.data;
};

/** One round-trip for Verbal multi-item passage screens (contiguous queue answers). */
export const recordAnswersBatch = async (
  uid: string,
  attempt_id: string,
  answers: Array<{ item_id: string; selected_option: number }>,
  time_spent_ms?: number,
  device_fingerprint?: string,
  opts?: { includePassageGroup?: boolean }
): Promise<RecordAnswerResponse> => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${RECORD_ANSWERS_BATCH}`,
    {
      uid,
      attempt_id,
      answers,
      time_spent_ms,
      ...(device_fingerprint ? { device_fingerprint } : {}),
      ...(opts?.includePassageGroup === false ? { include_passage_group: false } : {}),
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: EXAM_MUTATION_TIMEOUT_MS,
    }
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

export type AbandonExamReason =
  | 'user_confirmed_exit'
  | 'extended_background'
  | 'tab_unload';

export const abandonExam = async (
  uid: string,
  attempt_id: string,
  abandon_reason?: AbandonExamReason
): Promise<AbandonExamResponse> => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${ABANDON_EXAM}`,
    { uid, attempt_id, ...(abandon_reason ? { abandon_reason } : {}) },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};

/**
 * Fire-and-forget abandon when the tab/window is closing. Uses fetch({ keepalive: true })
 * so the request can finish after unload; requires a cached ID token in AuthTokenHandler.
 */
export function abandonExamOnTabUnload(uid: string, attempt_id: string): void {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) return;
  const token = authTokenHandler.getState().authToken;
  if (!token) return;
  const url = `${base}${ASSESSMENTS_APIS}${ABANDON_EXAM}`;
  const body = JSON.stringify({
    uid,
    attempt_id,
    abandon_reason: 'tab_unload',
  });
  try {
    void fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

/** Backend persists `problem_report_count` + `problem_report_texts[]` on the item document. */
export type QuestionReportPayload =
  | { source: 'official'; uid: string; attempt_id: string; item_id: string; text: string }
  | { source: 'practice'; uid: string; exam_id: string; level: number; item_id: string; text: string };

export const reportQuestionProblem = async (payload: QuestionReportPayload): Promise<{ ok: boolean }> => {
  const authToken = await authTokenHandler.getAuthToken();
  const response = await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${ASSESSMENTS_APIS}${REPORT_QUESTION_PROBLEM}`,
    payload,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};
