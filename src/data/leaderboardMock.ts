import { ASSESSMENT_ORDER, EXAM_MAX_SCORE_POINTS } from '../utils/assessmentGating';

/** Programme exams 6–7 (personality / interest) are not comparable % score leaderboards. */
const LEADERBOARD_EXCLUDED_IDS = new Set<string>([
  'comprehensive_personality',
  'career_interest_inventory',
]);

const LEADERBOARD_ASSESSMENT_ORDER = ASSESSMENT_ORDER.filter((id) => !LEADERBOARD_EXCLUDED_IDS.has(id));

/** Exam accordions expanded when the student first opens the leaderboard (Pattern and Logic + Verbal Reasoning). */
export const LEADERBOARD_DEFAULT_EXPANDED_EXAM_IDS: ReadonlySet<string> = new Set([
  'symbolic_reasoning',
  'verbal_reasoning',
]);

export const LEADERBOARD_GRADES = [6, 7, 8, 9, 10, 11, 12] as const;

export type LeaderboardGrade = (typeof LEADERBOARD_GRADES)[number];

export const LEADERBOARD_GRADE_MIN = LEADERBOARD_GRADES[0];
export const LEADERBOARD_GRADE_MAX = LEADERBOARD_GRADES[LEADERBOARD_GRADES.length - 1];

/** Single snapshot time for mock leaderboard + attempt dates (fixed at module load). */
export const MOCK_LEADERBOARD_LAST_UPDATED = new Date();

export function formatLeaderboardDateTime(d: Date | string | number): string {
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return '-';
  }
}

/** Map a profile grade to a leaderboard band; defaults to 10 if missing or invalid. */
export function clampToLeaderboardGrade(grade: unknown): LeaderboardGrade {
  if (typeof grade !== 'number' || Number.isNaN(grade)) return 10;
  const rounded = Math.round(grade);
  const c = Math.min(LEADERBOARD_GRADE_MAX, Math.max(LEADERBOARD_GRADE_MIN, rounded));
  return c as LeaderboardGrade;
}

/**
 * Score comparisons use the cohort difficulty level for the grade band:
 * grades 6–7 → Level 1, 8–9 → Level 2, 10–12 → Level 3.
 */
export function leaderboardScoreLevelForGrade(grade: number): 1 | 2 | 3 {
  const g = Math.round(grade);
  if (g <= 7) return 1;
  if (g <= 9) return 2;
  return 3;
}

/** Shown next to the “Score” column heading (updates when the grade toggle changes). */
export function leaderboardScoreLevelHeadingSuffix(grade: number): string {
  return `(Level ${leaderboardScoreLevelForGrade(grade)})`;
}

export interface LeaderboardEntry {
  rank: number;
  studentName: string;
  /** Absolute score on the programme scale (each exam out of 1000 in the UI). */
  scorePoints: number;
  /** ISO 8601 - best official attempt used for this row (that exam). */
  examTakenAtISO: string;
}

export interface ExamLeaderboardSection {
  examId: string;
  examName: string;
  entries: LeaderboardEntry[];
}

const EXAM_NAMES: Record<string, string> = {
  symbolic_reasoning: 'Pattern and Logic',
  verbal_reasoning: 'Verbal Reasoning',
  mathematical_reasoning: 'Mathematical Reasoning',
  english_proficiency: 'English Proficiency',
  ai_literacy: 'AI Proficiency',
};

const GIVEN_NAMES = [
  'Aarav',
  'Diya',
  'Vihaan',
  'Ananya',
  'Arjun',
  'Isha',
  'Rohan',
  'Meera',
  'Kabir',
  'Saanvi',
  'Aditya',
  'Priya',
  'Dev',
  'Kavya',
  'Reyansh',
  'Aanya',
  'Shaurya',
  'Navya',
  'Vivaan',
  'Riya',
  'Aryan',
  'Pari',
  'Krish',
  'Myra',
  'Ishan',
  'Zara',
  'Yash',
  'Tara',
  'Neel',
  'Ahana',
] as const;

const FAMILY_INITIALS = 'KMSRPTGHLVJBN' as const;

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Small mean shift per exam so boards do not look copy-pasted (still plausible tier-normalized scores before ×10). */
const EXAM_SCORE_BIAS: Record<string, number> = {
  symbolic_reasoning: 0.5,
  verbal_reasoning: -0.8,
  mathematical_reasoning: 1.2,
  english_proficiency: -0.4,
  ai_literacy: 0.2,
};

/**
 * Builds a strictly descending top 10: tight cluster at the top, wider gaps toward #10,
 * per-grade lift and per-exam bias so sample leaderboards read like real cohorts.
 */
function buildTopTenForExam(grade: LeaderboardGrade, examIndex: number, examId: string): LeaderboardEntry[] {
  const rand = mulberry32(grade * 10007 + examIndex * 30011 + 17);
  const usedNames = new Set<string>();

  const gradeLift = (grade - LEADERBOARD_GRADE_MIN) * 0.35;
  const examBias = EXAM_SCORE_BIAS[examId] ?? 0;

  // #10 anchor - still a solid score; older grades nudge slightly higher
  let tenth = Math.round(76 + rand() * 8 + gradeLift + examBias);
  tenth = Math.min(88, Math.max(70, tenth));

  const scores: number[] = new Array(10);
  scores[9] = tenth;

  for (let i = 8; i >= 0; i--) {
    // scores[i] is rank (i + 1); smaller i => higher rank => small gap to next rank down
    const rank = i + 1;
    let bump: number;
    if (rank <= 3) {
      bump = 0.9 + rand() * 1.6 + (rank === 1 ? rand() * 0.8 : 0);
    } else if (rank <= 6) {
      bump = 1.2 + rand() * 2.2;
    } else {
      bump = 1.5 + rand() * 2.9;
    }
    scores[i] = Math.round(scores[i + 1] + bump);
  }

  if (scores[0] > 99) {
    const trim = scores[0] - 99;
    for (let j = 0; j < 10; j++) scores[j] -= trim;
  }
  if (scores[0] < 88) {
    const lift = 90 - scores[0];
    for (let j = 0; j < 10; j++) scores[j] += lift;
  }

  for (let j = 0; j < 10; j++) {
    scores[j] = Math.min(100, Math.max(62, Math.round(scores[j])));
  }

  for (let i = 1; i < 10; i++) {
    if (scores[i] >= scores[i - 1]) scores[i] = scores[i - 1] - 1;
  }
  if (scores[9] < 65) {
    const pad = 65 - scores[9];
    for (let j = 0; j < 10; j++) scores[j] += pad;
    for (let i = 1; i < 10; i++) {
      if (scores[i] >= scores[i - 1]) scores[i] = scores[i - 1] - 1;
    }
  }
  if (scores[0] > 99) scores[0] = 99;
  for (let i = 1; i < 10; i++) {
    if (scores[i] >= scores[i - 1]) scores[i] = scores[i - 1] - 1;
  }

  const snapMs = MOCK_LEADERBOARD_LAST_UPDATED.getTime();

  const entries: LeaderboardEntry[] = [];
  for (let r = 0; r < 10; r++) {
    let name: string;
    let guard = 0;
    do {
      const gi = Math.floor(rand() * GIVEN_NAMES.length);
      const fi = Math.floor(rand() * FAMILY_INITIALS.length);
      name = `${GIVEN_NAMES[gi]} ${FAMILY_INITIALS[fi]}.`;
      guard++;
    } while (usedNames.has(name) && guard < 50);
    usedNames.add(name);

    const rank = r + 1;
    const baseDays = 12 + rank * 2 + examIndex * 4;
    const dayJitter = Math.floor(rand() * 18);
    const intraMs = Math.floor(rand() * 20 * 60 * 60 * 1000);
    const daysMs = (baseDays + dayJitter) * 86400000;
    const takenMs = Math.max(snapMs - daysMs - intraMs, snapMs - 200 * 86400000);
    const examTakenAtISO = new Date(takenMs).toISOString();

    entries.push({
      rank,
      studentName: name,
      scorePoints: Math.min(EXAM_MAX_SCORE_POINTS, Math.max(0, scores[r] * 10)),
      examTakenAtISO,
    });
  }

  return entries;
}

function buildGradeBoard(grade: LeaderboardGrade): ExamLeaderboardSection[] {
  return LEADERBOARD_ASSESSMENT_ORDER.map((examId, examIndex) => ({
    examId,
    examName: EXAM_NAMES[examId] ?? examId,
    entries: buildTopTenForExam(grade, examIndex, examId),
  }));
}

export const MOCK_LEADERBOARD_BY_GRADE: Record<LeaderboardGrade, ExamLeaderboardSection[]> =
  LEADERBOARD_GRADES.reduce(
    (acc, g) => {
      acc[g] = buildGradeBoard(g);
      return acc;
    },
    {} as Record<LeaderboardGrade, ExamLeaderboardSection[]>
  );
