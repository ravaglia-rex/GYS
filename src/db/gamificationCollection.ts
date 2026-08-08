import axios from 'axios';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import {
  GAMIFICATION_APIS,
  GET_GAMIFICATION_QOD,
  GET_GAMIFICATION_QOD_LEGACY,
  POST_GAMIFICATION_QOD_ANSWER,
  POST_GAMIFICATION_QOD_ANSWER_LEGACY,
  POST_GAMIFICATION_RECORD_DAILY_LOGIN,
  GET_GAMIFICATION_REWARDS,
  POST_GAMIFICATION_REDEEM,
} from '../constants/constants';
import type { ExamQuestion } from './assessmentCollection';

export type GamificationStreak = {
  current: number;
  longest: number;
  last_active_date?: string;
  last_answered_date?: string;
  last_correct_date?: string;
};

export type GamificationState = {
  argus_coins: number;
  coins_lifetime_earned: number;
  login_streak: GamificationStreak;
  qod_streak: GamificationStreak;
  qod_attempted_total: number;
  qod_correct_total: number;
  qod_accuracy_pct: number;
  qod_last_answered_date?: string;
  qod_last_result?: {
    correct: boolean;
    coins_awarded: number;
    selected_option_index?: number | null;
  };
  practice_sessions_total: number;
  practice_questions_total: number;
  practice_correct_total: number;
  practice_accuracy_pct: number;
  practice_coins_earned_total: number;
  practice_last_awarded_week?: string;
  exam_coins_earned_total: number;
  login_streak_coins_earned_total: number;
  qod_streak_coins_earned_total: number;
  redemptions?: Record<string, RedemptionRecord>;
};

export type RedemptionRecord = {
  item_id: string;
  item_name: string;
  coins_spent: number;
  status: 'pending' | 'fulfilled' | 'rejected';
  requested_at?: { seconds?: number; _seconds?: number } | string;
  fulfilled_at?: { seconds?: number; _seconds?: number } | string | null;
  voucher_code?: string | null;
  admin_note?: string | null;
};

export type RewardCatalogItem = {
  id: string;
  name: string;
  description: string;
  coins_cost: number;
  category: 'digital' | 'voucher';
  brand?: string;
  active: boolean;
};

export type QodResponse = {
  date: string;
  exam_id: string;
  item_id: string;
  question: ExamQuestion;
  already_answered: boolean;
  last_result: {
    correct: boolean;
    coins_awarded: number;
    correct_option_index?: number | null;
    selected_option_index?: number | null;
    solution_steps?: string[] | null;
  } | null;
  argus_coins: number;
  login_streak: GamificationStreak;
  qod_streak: GamificationStreak;
  qod_attempted_total: number;
  qod_correct_total: number;
  qod_accuracy_pct: number;
};

export type QodAnswerResponse = {
  already_answered: boolean;
  coins_awarded: number;
  qod_streak: GamificationStreak;
  milestone_coins: number;
  correct: boolean;
  correct_option_index: number | null;
  selected_option_index?: number | null;
  solution_steps?: string[] | null;
  argus_coins: number;
  qod_attempted_total: number;
  qod_correct_total: number;
  qod_accuracy_pct: number;
};

export type RewardsResponse = {
  catalog: RewardCatalogItem[];
  argus_coins: number;
  coins_lifetime_earned: number;
  redemptions: Record<string, RedemptionRecord>;
};

async function authHeaders() {
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new Error('You must be signed in.');
  }
  return { Authorization: `Bearer ${authToken}` };
}

function normalizeQodResponse(data: Record<string, unknown>): QodResponse {
  const qodStreak = (data.qod_streak ?? data.qotd_streak) as GamificationStreak | undefined;
  const attempted =
    typeof data.qod_attempted_total === 'number' && data.qod_attempted_total > 0
      ? Math.floor(data.qod_attempted_total)
      : 0;
  const correct =
    typeof data.qod_correct_total === 'number' && data.qod_correct_total > 0
      ? Math.floor(data.qod_correct_total)
      : 0;
  const accuracy =
    typeof data.qod_accuracy_pct === 'number' && Number.isFinite(data.qod_accuracy_pct)
      ? data.qod_accuracy_pct
      : attempted > 0
        ? Math.round((1000 * correct) / attempted) / 10
        : 0;
  return {
    ...(data as unknown as QodResponse),
    qod_streak: qodStreak ?? { current: 0, longest: 0 },
    qod_attempted_total: attempted,
    qod_correct_total: correct,
    qod_accuracy_pct: accuracy,
  };
}

function normalizeQodAnswerResponse(data: Record<string, unknown>): QodAnswerResponse {
  const qodStreak = (data.qod_streak ?? data.qotd_streak) as GamificationStreak | undefined;
  const attempted =
    typeof data.qod_attempted_total === 'number' && data.qod_attempted_total > 0
      ? Math.floor(data.qod_attempted_total)
      : 0;
  const correct =
    typeof data.qod_correct_total === 'number' && data.qod_correct_total > 0
      ? Math.floor(data.qod_correct_total)
      : 0;
  const accuracy =
    typeof data.qod_accuracy_pct === 'number' && Number.isFinite(data.qod_accuracy_pct)
      ? data.qod_accuracy_pct
      : attempted > 0
        ? Math.round((1000 * correct) / attempted) / 10
        : 0;
  return {
    ...(data as unknown as QodAnswerResponse),
    qod_streak: qodStreak ?? { current: 0, longest: 0 },
    qod_attempted_total: attempted,
    qod_correct_total: correct,
    qod_accuracy_pct: accuracy,
  };
}

async function requestWithQodLegacyFallback<T>(
  request: (path: string) => Promise<{ data: Record<string, unknown> }>,
  primaryPath: string,
  legacyPath: string,
  normalize: (data: Record<string, unknown>) => T,
): Promise<T> {
  try {
    const response = await request(primaryPath);
    return normalize(response.data);
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      throw error;
    }
    const response = await request(legacyPath);
    return normalize(response.data);
  }
}

export async function fetchQod(): Promise<QodResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  const headers = await authHeaders();
  return requestWithQodLegacyFallback(
    (path) => axios.get(`${base}${GAMIFICATION_APIS}${path}`, { headers }),
    GET_GAMIFICATION_QOD,
    GET_GAMIFICATION_QOD_LEGACY,
    normalizeQodResponse,
  );
}

export async function submitQodAnswer(selectedOption: number): Promise<QodAnswerResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  const headers = await authHeaders();
  return requestWithQodLegacyFallback(
    (path) =>
      axios.post(
        `${base}${GAMIFICATION_APIS}${path}`,
        { selected_option: selectedOption },
        { headers },
      ),
    POST_GAMIFICATION_QOD_ANSWER,
    POST_GAMIFICATION_QOD_ANSWER_LEGACY,
    normalizeQodAnswerResponse,
  );
}

export async function recordDailyLogin(): Promise<{
  login_streak: GamificationStreak;
  milestone_coins: number;
  argus_coins: number;
}> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  const headers = await authHeaders();
  const response = await axios.post(
    `${base}${GAMIFICATION_APIS}${POST_GAMIFICATION_RECORD_DAILY_LOGIN}`,
    {},
    { headers }
  );
  return response.data;
}

export async function fetchRewards(): Promise<RewardsResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  const headers = await authHeaders();
  const response = await axios.get(`${base}${GAMIFICATION_APIS}${GET_GAMIFICATION_REWARDS}`, { headers });
  return response.data;
}

export async function redeemReward(itemId: string): Promise<{
  ok: boolean;
  redemption_id: string;
  status: string;
  argus_coins: number;
  redemptions: Record<string, RedemptionRecord>;
}> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  const headers = await authHeaders();
  const response = await axios.post(
    `${base}${GAMIFICATION_APIS}${POST_GAMIFICATION_REDEEM}`,
    { item_id: itemId },
    { headers }
  );
  return response.data;
}
