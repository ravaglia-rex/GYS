import { EXAM_MAX_SCORE_POINTS } from './assessmentGating';

export const LEADERBOARD_DEFAULT_EXPANDED_EXAM_IDS: ReadonlySet<string> = new Set([
  'analytical_reasoning',
]);

export const LEADERBOARD_GRADES = [6, 7, 8, 9, 10, 11, 12] as const;

export type LeaderboardGrade = (typeof LEADERBOARD_GRADES)[number];

export const LEADERBOARD_GRADE_MIN = LEADERBOARD_GRADES[0];
export const LEADERBOARD_GRADE_MAX = LEADERBOARD_GRADES[LEADERBOARD_GRADES.length - 1];

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

export function clampToLeaderboardGrade(grade: unknown): LeaderboardGrade {
  if (typeof grade !== 'number' || Number.isNaN(grade)) return 10;
  const rounded = Math.round(grade);
  const c = Math.min(LEADERBOARD_GRADE_MAX, Math.max(LEADERBOARD_GRADE_MIN, rounded));
  return c as LeaderboardGrade;
}

export function leaderboardScoreLevelForGrade(grade: number): 1 | 2 | 3 {
  const g = Math.round(grade);
  if (g <= 7) return 1;
  if (g <= 9) return 2;
  return 3;
}

export function leaderboardScoreLevelHeadingSuffix(grade: number): string {
  return `(Level ${leaderboardScoreLevelForGrade(grade)})`;
}

export interface LeaderboardEntry {
  rank: number;
  studentName: string;
  scorePoints: number;
  examTakenAtISO?: string;
}

export interface ExamLeaderboardSection {
  examId: string;
  examName: string;
  entries: LeaderboardEntry[];
}

export const leaderboardScoreScaleLabel = `out of ${EXAM_MAX_SCORE_POINTS}`;
