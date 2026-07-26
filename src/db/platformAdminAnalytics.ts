import axios from 'axios';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import {
  PLATFORM_ADMIN_APIS,
  PLATFORM_ADMIN_ANALYTICS_PRACTICE_EXAMS,
  PLATFORM_ADMIN_ANALYTICS_QUESTION_OF_DAY,
  PLATFORM_ADMIN_ANALYTICS_TOP_COINS,
  PLATFORM_ADMIN_ANALYTICS_SCHOOL_ADMIN_ACTIVITY,
} from '../constants/constants';

function apiBase(): string {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set.');
  }
  return base;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await authTokenHandler.getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  return { Authorization: `Bearer ${token}` };
}

/** When true, backend bypasses Redis and re-runs Firestore queries, then rewrites the cache. */
function refreshParams(refresh?: boolean): { refresh?: '1' } {
  return refresh ? { refresh: '1' } : {};
}

export type PracticeExamSummaryRow = {
  exam_id: string;
  label: string;
  unique_students: number;
  total_attempts: number;
  total_sessions: number;
  total_correct: number;
  accuracy_pct: number;
  active_students_30d: number;
};

export type PracticeGradeBreakdownRow = {
  grade: number;
  unique_students: number;
  total_attempts: number;
  total_sessions: number;
  total_correct: number;
  accuracy_pct: number;
};

export type PracticeLeaderboardRow = {
  uid: string;
  first_name: string;
  last_name: string;
  email: string;
  school_id: string | null;
  school_name: string | null;
  grade: number | null;
  total_attempts: number;
  total_sessions: number;
  total_correct: number;
  accuracy_pct: number;
  updated_at: string | null;
};

export type QodDailyStatRow = {
  date: string;
  total_answered: number;
  total_correct: number;
  accuracy_pct: number;
};

export type TopCoinsStudentRow = {
  uid: string;
  first_name: string;
  last_name: string;
  email: string;
  school_id: string | null;
  school_name: string | null;
  grade: number | null;
  argus_coins: number;
};

export type SchoolAdminActivityRow = {
  email: string;
  school_id: string | null;
  school_name: string | null;
  last_active_at: string | null;
};

export async function getPlatformAdminPracticeExamSummaries(opts?: {
  refresh?: boolean;
}): Promise<{
  exams: PracticeExamSummaryRow[];
  generated_at: string;
  indexes_building?: boolean;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_PRACTICE_EXAMS}`,
    { headers, params: refreshParams(opts?.refresh) }
  );
  return {
    exams: Array.isArray(res.data.exams)
      ? res.data.exams.map((exam: PracticeExamSummaryRow) => ({
          ...exam,
          total_sessions: typeof exam.total_sessions === 'number' ? exam.total_sessions : 0,
        }))
      : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
    indexes_building: res.data.indexes_building === true,
  };
}

export async function getPlatformAdminPracticeExamDetail(
  examId: string,
  params?: { limit?: number; sortBy?: 'total_correct' | 'total_attempts' | 'total_sessions'; refresh?: boolean }
): Promise<{
  exam_id: string;
  label: string;
  summary: PracticeExamSummaryRow;
  by_grade: PracticeGradeBreakdownRow[];
  top_students: PracticeLeaderboardRow[];
  generated_at: string;
  indexes_building?: boolean;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_PRACTICE_EXAMS}/${encodeURIComponent(examId)}`,
    {
      headers,
      params: {
        limit: params?.limit ?? 10,
        sortBy: params?.sortBy ?? 'total_correct',
        ...refreshParams(params?.refresh),
      },
    }
  );
  return {
    exam_id: res.data.exam_id,
    label: res.data.label,
    summary: {
      ...res.data.summary,
      total_sessions:
        typeof res.data.summary?.total_sessions === 'number' ? res.data.summary.total_sessions : 0,
    },
    by_grade: Array.isArray(res.data.by_grade)
      ? res.data.by_grade.map((row: PracticeGradeBreakdownRow) => ({
          ...row,
          total_sessions: typeof row.total_sessions === 'number' ? row.total_sessions : 0,
        }))
      : [],
    top_students: Array.isArray(res.data.top_students)
      ? res.data.top_students.map((row: PracticeLeaderboardRow) => ({
          ...row,
          total_sessions: typeof row.total_sessions === 'number' ? row.total_sessions : 0,
        }))
      : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
    indexes_building: res.data.indexes_building === true,
  };
}

export async function getPlatformAdminQodStats(
  days = 30,
  opts?: { refresh?: boolean }
): Promise<{
  days: QodDailyStatRow[];
  today: QodDailyStatRow | null;
  generated_at: string;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_QUESTION_OF_DAY}`,
    { headers, params: { days, ...refreshParams(opts?.refresh) } }
  );
  return {
    days: Array.isArray(res.data.days) ? res.data.days : [],
    today: res.data.today ?? null,
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
  };
}

export async function getPlatformAdminTopCoins(
  limit = 10,
  opts?: { refresh?: boolean }
): Promise<{
  students: TopCoinsStudentRow[];
  generated_at: string;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_TOP_COINS}`,
    { headers, params: { limit, ...refreshParams(opts?.refresh) } }
  );
  return {
    students: Array.isArray(res.data.students) ? res.data.students : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
  };
}

export async function getPlatformAdminSchoolAdminActivity(
  limit = 20,
  opts?: { refresh?: boolean }
): Promise<{
  admins: SchoolAdminActivityRow[];
  generated_at: string;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_SCHOOL_ADMIN_ACTIVITY}`,
    { headers, params: { limit, ...refreshParams(opts?.refresh) } }
  );
  return {
    admins: Array.isArray(res.data.admins) ? res.data.admins : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
  };
}
