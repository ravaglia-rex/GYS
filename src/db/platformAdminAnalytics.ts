import axios from 'axios';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import {
  PLATFORM_ADMIN_APIS,
  PLATFORM_ADMIN_ANALYTICS_PRACTICE_EXAMS,
  PLATFORM_ADMIN_ANALYTICS_QUESTION_OF_DAY,
  PLATFORM_ADMIN_ANALYTICS_PRACTICE_DAILY,
  PLATFORM_ADMIN_ANALYTICS_PRACTICE_DAILY_BY_EXAM,
  PLATFORM_ADMIN_ANALYTICS_TOP_COINS,
  PLATFORM_ADMIN_ANALYTICS_TOP_QOD,
  PLATFORM_ADMIN_ANALYTICS_SCHOOL_ADMIN_ACTIVITY,
  PLATFORM_ADMIN_ANALYTICS_OFFICIAL_EXAMS,
  PLATFORM_ADMIN_ANALYTICS_OFFICIAL_DAILY,
} from '../constants/constants';
import { isHiddenStaffSchoolAdminEmail } from '../constants/hiddenStaffSchoolAdmins';

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

export type PracticeDailyStatRow = {
  date: string;
  total_sessions: number;
  total_questions: number;
  total_correct: number;
  accuracy_pct: number;
};

export type PracticeDailyByExamStatRow = {
  date: string;
  by_exam: Record<string, { sessions: number; questions: number; correct: number }>;
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

export type TopQodStudentRow = {
  uid: string;
  first_name: string;
  last_name: string;
  email: string;
  school_id: string | null;
  school_name: string | null;
  grade: number | null;
  qod_attempted_total: number;
  qod_correct_total: number;
  qod_accuracy_pct: number;
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

export async function getPlatformAdminPracticeDailyStats(
  days = 30,
  opts?: { refresh?: boolean }
): Promise<{
  days: PracticeDailyStatRow[];
  today: PracticeDailyStatRow | null;
  generated_at: string;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_PRACTICE_DAILY}`,
    { headers, params: { days, ...refreshParams(opts?.refresh) } }
  );
  return {
    days: Array.isArray(res.data.days) ? res.data.days : [],
    today: res.data.today ?? null,
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
  };
}

export async function getPlatformAdminPracticeDailyStatsByExam(
  days = 30,
  opts?: { refresh?: boolean }
): Promise<{
  days: PracticeDailyByExamStatRow[];
  exam_ids: string[];
  generated_at: string;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_PRACTICE_DAILY_BY_EXAM}`,
    { headers, params: { days, ...refreshParams(opts?.refresh) } }
  );
  return {
    days: Array.isArray(res.data.days) ? res.data.days : [],
    exam_ids: Array.isArray(res.data.exam_ids) ? res.data.exam_ids : [],
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

export async function getPlatformAdminTopQod(
  limit = 10,
  opts?: { refresh?: boolean }
): Promise<{
  students: TopQodStudentRow[];
  generated_at: string;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_TOP_QOD}`,
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
    admins: Array.isArray(res.data.admins)
      ? res.data.admins.filter(
          (row: SchoolAdminActivityRow) => !isHiddenStaffSchoolAdminEmail(row.email)
        )
      : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
  };
}

export type OfficialExamSummaryRow = {
  exam_id: string;
  label: string;
  completed_attempts: number;
  unique_students: number;
  avg_score_pct: number;
  avg_score_points: number;
  passed_attempts: number;
  pass_rate_pct: number;
};

export type OfficialExamLevelRow = {
  level: number;
  completed_attempts: number;
  unique_students: number;
  avg_score_pct: number;
  avg_score_points: number;
  passed_attempts: number;
};

export type OfficialExamRecentRow = {
  attempt_id: string;
  uid: string;
  first_name: string;
  last_name: string;
  email: string;
  school_id: string | null;
  school_name: string | null;
  proficiency_tier: number | null;
  score_pct: number;
  score_points: number;
  passed: boolean;
  completed_at: string | null;
};

export type OfficialTagAggRow = {
  key: string;
  label: string;
  attempts_with_data: number;
  served_sum: number;
  correct_sum: number;
  avg_served: number;
  avg_correct: number;
  accuracy_pct: number;
  avg_construct_score: number | null;
  floor_met_rate_pct: number | null;
};

export type OfficialScoreBucketRow = {
  bucket: string;
  min_points: number;
  max_points: number;
  count: number;
  pct: number;
};

export type OfficialExamDrilldown = {
  exam_id: string;
  label: string;
  level_filter: number | null;
  attempts_analyzed: number;
  attempts_with_construct_scores: number;
  attempts_with_subconstruct_scores: number;
  attempts_with_mechanic_feedback: number;
  by_family: OfficialTagAggRow[];
  by_subconstruct: OfficialTagAggRow[];
  by_mechanic: OfficialTagAggRow[];
  score_distribution: OfficialScoreBucketRow[];
  notes: string[];
  generated_at: string;
  indexes_building?: boolean;
};

export type OfficialDailyStatRow = {
  date: string;
  total_completed: number;
  by_exam: Record<string, { completed: number; score_sum: number }>;
};

export async function getPlatformAdminOfficialExamSummaries(opts?: {
  refresh?: boolean;
}): Promise<{
  exams: OfficialExamSummaryRow[];
  generated_at: string;
  indexes_building?: boolean;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_OFFICIAL_EXAMS}`,
    { headers, params: { ...refreshParams(opts?.refresh) } }
  );
  return {
    exams: Array.isArray(res.data.exams) ? res.data.exams : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
    indexes_building: res.data.indexes_building === true,
  };
}

export async function getPlatformAdminOfficialExamDetail(
  examId: string,
  opts?: { limit?: number; refresh?: boolean }
): Promise<{
  exam_id: string;
  label: string;
  summary: OfficialExamSummaryRow;
  by_level: OfficialExamLevelRow[];
  recent: OfficialExamRecentRow[];
  generated_at: string;
  indexes_building?: boolean;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_OFFICIAL_EXAMS}/${encodeURIComponent(examId)}`,
    {
      headers,
      params: { limit: opts?.limit ?? 25, ...refreshParams(opts?.refresh) },
    }
  );
  return {
    exam_id: typeof res.data.exam_id === 'string' ? res.data.exam_id : examId,
    label: typeof res.data.label === 'string' ? res.data.label : examId,
    summary: res.data.summary,
    by_level: Array.isArray(res.data.by_level) ? res.data.by_level : [],
    recent: Array.isArray(res.data.recent) ? res.data.recent : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
    indexes_building: res.data.indexes_building === true,
  };
}

export async function getPlatformAdminOfficialExamDrilldown(
  examId: string,
  opts?: { level?: number | null; refresh?: boolean }
): Promise<OfficialExamDrilldown> {
  const headers = await authHeaders();
  const params: Record<string, string | number> = { ...refreshParams(opts?.refresh) };
  if (typeof opts?.level === 'number' && opts.level > 0) params.level = opts.level;
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_OFFICIAL_EXAMS}/${encodeURIComponent(examId)}/drilldown`,
    { headers, params }
  );
  return {
    exam_id: typeof res.data.exam_id === 'string' ? res.data.exam_id : examId,
    label: typeof res.data.label === 'string' ? res.data.label : examId,
    level_filter: typeof res.data.level_filter === 'number' ? res.data.level_filter : null,
    attempts_analyzed: Number(res.data.attempts_analyzed) || 0,
    attempts_with_construct_scores: Number(res.data.attempts_with_construct_scores) || 0,
    attempts_with_subconstruct_scores: Number(res.data.attempts_with_subconstruct_scores) || 0,
    attempts_with_mechanic_feedback: Number(res.data.attempts_with_mechanic_feedback) || 0,
    by_family: Array.isArray(res.data.by_family) ? res.data.by_family : [],
    by_subconstruct: Array.isArray(res.data.by_subconstruct) ? res.data.by_subconstruct : [],
    by_mechanic: Array.isArray(res.data.by_mechanic) ? res.data.by_mechanic : [],
    score_distribution: Array.isArray(res.data.score_distribution) ? res.data.score_distribution : [],
    notes: Array.isArray(res.data.notes) ? res.data.notes : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
    indexes_building: res.data.indexes_building === true,
  };
}

export async function getPlatformAdminOfficialDailyStats(
  days = 30,
  opts?: { refresh?: boolean }
): Promise<{
  days: OfficialDailyStatRow[];
  today: OfficialDailyStatRow | null;
  exam_ids: string[];
  generated_at: string;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_OFFICIAL_DAILY}`,
    { headers, params: { days, ...refreshParams(opts?.refresh) } }
  );
  return {
    days: Array.isArray(res.data.days) ? res.data.days : [],
    today: res.data.today ?? null,
    exam_ids: Array.isArray(res.data.exam_ids) ? res.data.exam_ids : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
  };
}
