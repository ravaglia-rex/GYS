import axios from 'axios';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import {
  PLATFORM_ADMIN_APIS,
  PLATFORM_ADMIN_ANALYTICS_PRACTICE_EXAMS,
  PLATFORM_ADMIN_ANALYTICS_QUESTION_OF_DAY,
  PLATFORM_ADMIN_ANALYTICS_PRACTICE_DAILY,
  PLATFORM_ADMIN_ANALYTICS_PRACTICE_DAILY_BY_EXAM,
  PLATFORM_ADMIN_ANALYTICS_PRACTICE_MONTHLY,
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

export type PracticeMonthlyStatRow = {
  month: string;
  label: string;
  total_sessions: number;
  total_questions: number;
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
  coins_lifetime_earned: number;
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

export async function getPlatformAdminPracticeMonthlyStats(
  year = new Date().getFullYear(),
  opts?: { refresh?: boolean }
): Promise<{
  year: number;
  months: PracticeMonthlyStatRow[];
  generated_at: string;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_PRACTICE_MONTHLY}`,
    { headers, params: { year, ...refreshParams(opts?.refresh) } }
  );
  return {
    year: typeof res.data.year === 'number' ? res.data.year : year,
    months: Array.isArray(res.data.months) ? res.data.months : [],
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

export type OfficialExamGradeRow = {
  grade: number | null;
  completed_attempts: number;
  unique_students: number;
  avg_score_pct: number;
  avg_score_points: number;
  passed_attempts: number;
  pass_rate_pct: number;
};

export type OfficialExamSchoolRow = {
  school_id: string | null;
  school_name: string;
  completed_attempts: number;
  unique_students: number;
  avg_score_pct: number;
  avg_score_points: number;
  passed_attempts: number;
  pass_rate_pct: number;
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
  attempts_with_strand_statuses: number;
  attempts_with_instruction_family_scores: number;
  attempts_with_band_scores: number;
  attempts_with_subconstruct_scores: number;
  attempts_with_mechanic_feedback: number;
  by_family: OfficialTagAggRow[];
  by_strand: OfficialTagAggRow[];
  by_instruction_family: OfficialTagAggRow[];
  by_band: OfficialTagAggRow[];
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
  opts?: { refresh?: boolean }
): Promise<{
  exam_id: string;
  label: string;
  summary: OfficialExamSummaryRow;
  by_level: OfficialExamLevelRow[];
  by_grade: OfficialExamGradeRow[];
  by_school: OfficialExamSchoolRow[];
  generated_at: string;
  indexes_building?: boolean;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_OFFICIAL_EXAMS}/${encodeURIComponent(examId)}`,
    {
      headers,
      params: { ...refreshParams(opts?.refresh) },
    }
  );
  return {
    exam_id: typeof res.data.exam_id === 'string' ? res.data.exam_id : examId,
    label: typeof res.data.label === 'string' ? res.data.label : examId,
    summary: res.data.summary,
    by_level: Array.isArray(res.data.by_level) ? res.data.by_level : [],
    by_grade: Array.isArray(res.data.by_grade) ? res.data.by_grade : [],
    by_school: Array.isArray(res.data.by_school) ? res.data.by_school : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
    indexes_building: res.data.indexes_building === true,
  };
}

export async function searchPlatformAdminOfficialExamCompletions(
  examId: string,
  opts?: {
    q?: string;
    from?: string;
    to?: string;
    level?: number | null;
    limit?: number;
  }
): Promise<{
  exam_id: string;
  results: OfficialExamRecentRow[];
  matched: number;
  limit: number;
  generated_at: string;
}> {
  const headers = await authHeaders();
  const params: Record<string, string | number> = {
    limit: opts?.limit ?? 25,
  };
  if (opts?.q?.trim()) params.q = opts.q.trim();
  if (opts?.from) params.from = opts.from;
  if (opts?.to) params.to = opts.to;
  if (typeof opts?.level === 'number' && opts.level > 0) params.level = opts.level;
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_OFFICIAL_EXAMS}/${encodeURIComponent(examId)}/completions`,
    { headers, params }
  );
  return {
    exam_id: typeof res.data.exam_id === 'string' ? res.data.exam_id : examId,
    results: Array.isArray(res.data.results) ? res.data.results : [],
    matched: Number(res.data.matched) || 0,
    limit: Number(res.data.limit) || opts?.limit || 25,
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
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
    attempts_with_strand_statuses: Number(res.data.attempts_with_strand_statuses) || 0,
    attempts_with_instruction_family_scores:
      Number(res.data.attempts_with_instruction_family_scores) || 0,
    attempts_with_band_scores: Number(res.data.attempts_with_band_scores) || 0,
    attempts_with_subconstruct_scores: Number(res.data.attempts_with_subconstruct_scores) || 0,
    attempts_with_mechanic_feedback: Number(res.data.attempts_with_mechanic_feedback) || 0,
    by_family: Array.isArray(res.data.by_family) ? res.data.by_family : [],
    by_strand: Array.isArray(res.data.by_strand) ? res.data.by_strand : [],
    by_instruction_family: Array.isArray(res.data.by_instruction_family)
      ? res.data.by_instruction_family
      : [],
    by_band: Array.isArray(res.data.by_band) ? res.data.by_band : [],
    by_subconstruct: Array.isArray(res.data.by_subconstruct) ? res.data.by_subconstruct : [],
    by_mechanic: Array.isArray(res.data.by_mechanic) ? res.data.by_mechanic : [],
    score_distribution: Array.isArray(res.data.score_distribution) ? res.data.score_distribution : [],
    notes: Array.isArray(res.data.notes) ? res.data.notes : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
    indexes_building: res.data.indexes_building === true,
  };
}

export type OfficialQuestionTagType =
  | 'family'
  | 'mechanic'
  | 'subconstruct'
  | 'strand'
  | 'instruction_family'
  | 'band';

export type OfficialQuestionOptionStat = {
  index: number;
  letter: string;
  text: string;
  pick_count: number;
  pick_pct: number;
  is_correct: boolean;
};

export type OfficialQuestionStatRow = {
  item_id: string;
  prompt: string;
  prompt_preview: string;
  stimulus: unknown;
  stimulus_type: string | null;
  options: OfficialQuestionOptionStat[];
  correct_index: number | null;
  family: string | null;
  mechanic: string | null;
  subconstruct: string | null;
  strand?: string | null;
  instruction_family?: string | null;
  band?: string | null;
  times_seen: number;
  times_correct: number;
  times_incorrect: number;
  times_ungraded: number;
  accuracy_pct: number | null;
  avg_time_ms: number | null;
  avg_time_sec: number | null;
};

export type OfficialExamQuestionStats = {
  exam_id: string;
  label: string;
  tag_type: OfficialQuestionTagType;
  tag: string;
  tag_label: string;
  level_filter: number | null;
  grade_filter: string | null;
  source: 'item_bank_stats' | string;
  attempts_analyzed: number;
  questions: OfficialQuestionStatRow[];
  generated_at: string;
  indexes_building?: boolean;
};

export async function getPlatformAdminOfficialExamQuestionStats(
  examId: string,
  opts: {
    tagType: OfficialQuestionTagType;
    tag: string;
    level?: number | null;
    grade?: number | string | null;
    refresh?: boolean;
  }
): Promise<OfficialExamQuestionStats> {
  const headers = await authHeaders();
  const params: Record<string, string | number> = {
    ...refreshParams(opts.refresh),
    tag_type: opts.tagType,
    tag: opts.tag,
  };
  if (typeof opts.level === 'number' && opts.level > 0) params.level = opts.level;
  if (opts.grade === 'unknown') params.grade = 'unknown';
  else if (typeof opts.grade === 'number' && opts.grade > 0) params.grade = opts.grade;
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_OFFICIAL_EXAMS}/${encodeURIComponent(examId)}/questions`,
    { headers, params }
  );
  return {
    exam_id: typeof res.data.exam_id === 'string' ? res.data.exam_id : examId,
    label: typeof res.data.label === 'string' ? res.data.label : examId,
    tag_type:
      res.data.tag_type === 'mechanic' ||
      res.data.tag_type === 'subconstruct' ||
      res.data.tag_type === 'strand' ||
      res.data.tag_type === 'instruction_family' ||
      res.data.tag_type === 'band'
        ? res.data.tag_type
        : 'family',
    tag: typeof res.data.tag === 'string' ? res.data.tag : opts.tag,
    tag_label: typeof res.data.tag_label === 'string' ? res.data.tag_label : opts.tag,
    level_filter: typeof res.data.level_filter === 'number' ? res.data.level_filter : null,
    grade_filter: typeof res.data.grade_filter === 'string' ? res.data.grade_filter : null,
    source: typeof res.data.source === 'string' ? res.data.source : 'item_bank_stats',
    attempts_analyzed: Number(res.data.attempts_analyzed) || 0,
    questions: Array.isArray(res.data.questions)
      ? res.data.questions.map((q: OfficialQuestionStatRow) => ({
          ...q,
          prompt: typeof q.prompt === 'string' ? q.prompt : q.prompt_preview || '',
          prompt_preview: typeof q.prompt_preview === 'string' ? q.prompt_preview : '',
          stimulus: q.stimulus ?? null,
          stimulus_type: typeof q.stimulus_type === 'string' ? q.stimulus_type : null,
          options: Array.isArray(q.options) ? q.options : [],
          correct_index: typeof q.correct_index === 'number' ? q.correct_index : null,
        }))
      : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
    indexes_building: res.data.indexes_building === true,
  };
}

export type OfficialAttemptQuestionRow = {
  index: number;
  item_id: string;
  strand: string | null;
  strand_label: string | null;
  instruction_family: string | null;
  instruction_family_label: string | null;
  band: string | null;
  prompt: string;
  prompt_preview: string;
  stimulus: unknown;
  stimulus_type: string | null;
  options: Array<{ letter: string; text: string }>;
  selected_index: number | null;
  selected_letter: string;
  correct_index: number | null;
  correct_letter: string | null;
  is_correct: boolean | null;
  time_spent_sec: number | null;
};

export type OfficialExamAttemptDetail = {
  exam_id: string;
  uid: string;
  attempt_id: string;
  proficiency_tier: number | null;
  score_pct: number | null;
  score_points: number | null;
  passed: boolean | null;
  completed_at: string | null;
  scoring_mode: string | null;
  strand_statuses: unknown;
  instruction_family_scores: unknown;
  band_scores: unknown;
  questions: OfficialAttemptQuestionRow[];
  generated_at: string;
};

export async function getPlatformAdminOfficialExamAttemptDetail(
  examId: string,
  opts: { uid: string; attemptId: string }
): Promise<OfficialExamAttemptDetail> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ANALYTICS_OFFICIAL_EXAMS}/${encodeURIComponent(examId)}/completions/${encodeURIComponent(opts.attemptId)}`,
    { headers, params: { uid: opts.uid } }
  );
  return {
    exam_id: typeof res.data.exam_id === 'string' ? res.data.exam_id : examId,
    uid: typeof res.data.uid === 'string' ? res.data.uid : opts.uid,
    attempt_id: typeof res.data.attempt_id === 'string' ? res.data.attempt_id : opts.attemptId,
    proficiency_tier:
      typeof res.data.proficiency_tier === 'number' ? res.data.proficiency_tier : null,
    score_pct: typeof res.data.score_pct === 'number' ? res.data.score_pct : null,
    score_points: typeof res.data.score_points === 'number' ? res.data.score_points : null,
    passed: typeof res.data.passed === 'boolean' ? res.data.passed : null,
    completed_at: typeof res.data.completed_at === 'string' ? res.data.completed_at : null,
    scoring_mode: typeof res.data.scoring_mode === 'string' ? res.data.scoring_mode : null,
    strand_statuses: res.data.strand_statuses ?? null,
    instruction_family_scores: res.data.instruction_family_scores ?? null,
    band_scores: res.data.band_scores ?? null,
    questions: Array.isArray(res.data.questions) ? res.data.questions : [],
    generated_at: typeof res.data.generated_at === 'string' ? res.data.generated_at : '',
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
