import axios from 'axios';
import {
  FETCH_STUDENT_COINS_LEADERBOARD,
  FETCH_STUDENT_SCHOOL_LEADERBOARD,
  STUDENTS_APIS,
} from '../constants/constants';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import { LEADERBOARD_GRADES, type ExamLeaderboardSection, type LeaderboardGrade } from '../utils/leaderboard';

export interface StudentSchoolLeaderboardResponse {
  schoolId: string;
  grade: LeaderboardGrade;
  sections: ExamLeaderboardSection[];
  /** Per-class boards for the whole school. Class toggle reads this. */
  sectionsByGrade?: Partial<Record<LeaderboardGrade, ExamLeaderboardSection[]>>;
  lastUpdatedISO: string | null;
}

function normalizeSectionsByGrade(
  raw: unknown
): Partial<Record<LeaderboardGrade, ExamLeaderboardSection[]>> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const source = raw as Record<string, unknown>;
  const out: Partial<Record<LeaderboardGrade, ExamLeaderboardSection[]>> = {};
  for (const g of LEADERBOARD_GRADES) {
    const sections = source[String(g)];
    if (Array.isArray(sections)) out[g] = sections as ExamLeaderboardSection[];
  }
  return out;
}

export const getStudentSchoolLeaderboard = async (): Promise<StudentSchoolLeaderboardResponse> => {
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new Error('You are not signed in. Please sign in again.');
  }

  const response = await axios.get(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${FETCH_STUDENT_SCHOOL_LEADERBOARD}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const data = response.data as StudentSchoolLeaderboardResponse;
  return {
    ...data,
    sectionsByGrade: normalizeSectionsByGrade(data.sectionsByGrade),
  };
};

export interface CoinsLeaderboardEntry {
  uid: string;
  first_name: string;
  last_initial: string;
  grade: number | null;
  coins_lifetime_earned: number;
  school_id: string | null;
  school_name: string | null;
}

export interface StudentCoinsLeaderboardResponse {
  global: CoinsLeaderboardEntry[];
  school: CoinsLeaderboardEntry[];
  schoolId: string;
  schoolName: string | null;
  generatedAt: string | null;
  notEnoughSchoolData: boolean;
  viewerUid: string;
}

export const getStudentCoinsLeaderboard = async (
  schoolId?: string | null
): Promise<StudentCoinsLeaderboardResponse> => {
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new Error('You are not signed in. Please sign in again.');
  }

  const params =
    typeof schoolId === 'string' && schoolId.trim() && schoolId !== 'not-listed' ?
      { school_id: schoolId.trim() } :
      undefined;

  const response = await axios.get(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${FETCH_STUDENT_COINS_LEADERBOARD}`,
    { headers: { Authorization: `Bearer ${authToken}` }, params }
  );
  return response.data;
};
