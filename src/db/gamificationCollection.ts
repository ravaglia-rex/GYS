import axios from 'axios';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import {
  GAMIFICATION_APIS,
  GET_GAMIFICATION_QOTD,
  POST_GAMIFICATION_QOTD_ANSWER,
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
  qotd_streak: GamificationStreak;
  qotd_last_answered_date?: string;
  qotd_last_result?: { correct: boolean; coins_awarded: number };
  practice_last_awarded_week?: string;
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

export type QotdResponse = {
  date: string;
  exam_id: string;
  item_id: string;
  question: ExamQuestion;
  already_answered: boolean;
  last_result: {
    correct: boolean;
    coins_awarded: number;
    correct_option_index?: number | null;
    solution_steps?: string[] | null;
  } | null;
  argus_coins: number;
  login_streak: GamificationStreak;
  qotd_streak: GamificationStreak;
};

export type QotdAnswerResponse = {
  already_answered: boolean;
  coins_awarded: number;
  qotd_streak: GamificationStreak;
  milestone_coins: number;
  correct: boolean;
  correct_option_index: number | null;
  solution_steps?: string[] | null;
  argus_coins: number;
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

export async function fetchQotd(): Promise<QotdResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  const headers = await authHeaders();
  const response = await axios.get(`${base}${GAMIFICATION_APIS}${GET_GAMIFICATION_QOTD}`, { headers });
  return response.data;
}

export async function submitQotdAnswer(selectedOption: number): Promise<QotdAnswerResponse> {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  const headers = await authHeaders();
  const response = await axios.post(
    `${base}${GAMIFICATION_APIS}${POST_GAMIFICATION_QOTD_ANSWER}`,
    { selected_option: selectedOption },
    { headers }
  );
  return response.data;
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
