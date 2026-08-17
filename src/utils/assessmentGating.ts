import type { AssessmentType } from '../db/assessmentCollection';
import {
  countClearedTiersFromProgress,
  examSequencePrereqMet,
} from './tierProgression';
import { canonicalAssessmentId } from './assessmentIdCompat';

/**
 * Canonical assessment order for sorting and gating (wired assessment ids from Firestore).
 * Rev 13 lists seven exams in the program; add exam 7 to `app_config/assessment_types` when ready.
 */
export const PROGRAM_EXAM_COUNT = 7;

export const ASSESSMENT_ORDER = [
  'analytical_reasoning',
  'verbal_reasoning',
  'mathematical_reasoning',
  'comprehensive_personality',
  'ai_literacy',
  'english_proficiency',
  'career_interest_inventory',
] as const;

export type AssessmentId = (typeof ASSESSMENT_ORDER)[number];

export interface AssessmentProgress {
  proficiency_tier?: number;
  status: 'locked' | 'available' | 'tier_advanced' | 'completed';
  best_score: number | null;
  /** Level index -> best raw score 0-1 recorded for that level. */
  best_scores_by_level?: Record<string, number | null | undefined>;
  attempts_count: number;
  /** Tier index → cleared at grade-band threshold (from backend completeExam) */
  tiers_cleared?: Record<string, boolean>;
  /** Most recently graded attempt (1-indexed level); set with latest_attempt_score on completeExam. */
  latest_attempt_level?: number | null;
  /** Raw score 0–1 for the most recent graded attempt at latest_attempt_level. */
  latest_attempt_score?: number | null;
  /** Level index -> latest finished-at timestamp; populated by backend completion/abandon. */
  last_finished_at_by_level?: Record<string, unknown>;
  /** Level index -> timestamp when the same level can be attempted again. */
  next_eligible_at_by_level?: Record<string, unknown>;
}

export type LockReason = 'membership' | 'prerequisite' | null;

export interface GateResult {
  locked: boolean;
  reason: LockReason;
  requiredMembershipLevel?: number;
  missingPrerequisite?: string;
}

/**
 * Rev 14 - Level 1 Discovery (Exam 1); Level 2 Reasoning Triad (1–3); Level 3 Stream Ready (1–5: + personality + AI);
 * Level 4 Career Ready (+ Pathways: english + career discovery).
 */
export const MEMBERSHIP_ALLOWED: Record<number, string[]> = {
  0: [],
  1: ['analytical_reasoning'],
  2: ['analytical_reasoning', 'verbal_reasoning', 'mathematical_reasoning'],
  3: [
    'analytical_reasoning',
    'verbal_reasoning',
    'mathematical_reasoning',
    'comprehensive_personality',
    'ai_literacy',
  ],
  4: [...ASSESSMENT_ORDER],
};

/** Product copy: three annual packages (API 2–4) plus Trial/Discovery entry (API 1). */
export const MEMBERSHIP_LEVEL_LABELS: Record<number, string> = {
  1: 'Trial - Discovery',
  2: 'Reasoning Triad',
  3: 'Stream Ready',
  4: 'Career Ready',
};

/** Shown on the dashboard chart without a numeric score (non-competitive / profile assessments). */
export const NON_COMPETITIVE_CHART_ASSESSMENT_IDS: ReadonlySet<string> = new Set([
  'comprehensive_personality',
  'career_interest_inventory',
]);

/**
 * Assessments schools see with numeric scores.
 * Matches institutional Premium / Stream Ready coverage: reasoning triad + AI.
 * English and Career Discovery are individual (level 4) add-ons - not school score charts.
 */
export const SCHOOL_SCORED_ASSESSMENT_IDS = [
  'analytical_reasoning',
  'verbal_reasoning',
  'mathematical_reasoning',
  'ai_literacy',
] as const;

/**
 * Profile assessments schools may see completion for only (no scores, levels, or results).
 */
export const SCHOOL_COMPLETION_ONLY_ASSESSMENT_IDS = ['comprehensive_personality'] as const;

export type SchoolScoredAssessmentId = (typeof SCHOOL_SCORED_ASSESSMENT_IDS)[number];
export type SchoolCompletionOnlyAssessmentId = (typeof SCHOOL_COMPLETION_ONLY_ASSESSMENT_IDS)[number];

export function isSchoolScoredAssessment(assessmentId: string): boolean {
  return (SCHOOL_SCORED_ASSESSMENT_IDS as readonly string[]).includes(assessmentId);
}

export function isSchoolCompletionOnlyAssessment(assessmentId: string): boolean {
  return (SCHOOL_COMPLETION_ONLY_ASSESSMENT_IDS as readonly string[]).includes(assessmentId);
}

/** School portal exam list: scored tracks + personality completion row. */
export function schoolFacingAssessmentIds(): string[] {
  return [...SCHOOL_SCORED_ASSESSMENT_IDS, ...SCHOOL_COMPLETION_ONLY_ASSESSMENT_IDS];
}
/** Exams 4 and 7 are profile/pathway instruments, not leveled skill assessments. */
export const NON_LEVEL_ASSESSMENT_IDS: ReadonlySet<string> = new Set([
  'comprehensive_personality',
  'career_interest_inventory',
]);

export function isLevelBasedAssessment(assessmentId: string): boolean {
  return !NON_LEVEL_ASSESSMENT_IDS.has(canonicalAssessmentId(assessmentId));
}

/** Skill exams always have three difficulty levels (exams 4 and 7 are non-level). */
export const LEVEL_BASED_EXAM_TIER_COUNT = 3;

/** Max levels for progress/completion UI - never trust a short Firestore `tiers[]` for skill exams. */
export function maxTiersForAssessment(assessmentId: string, configuredTierLength?: number): number {
  if (!isLevelBasedAssessment(assessmentId)) {
    return Math.max(0, configuredTierLength ?? 0);
  }
  return LEVEL_BASED_EXAM_TIER_COUNT;
}

export const ASSESSMENT_NAMES: Record<string, string> = {
  analytical_reasoning: 'Analytical Reasoning',
  verbal_reasoning: 'Verbal Reasoning',
  mathematical_reasoning: 'Mathematical Reasoning',
  comprehensive_personality: 'Personality and Interest',
  ai_literacy: 'AI Proficiency',
  english_proficiency: 'English Proficiency',
  career_interest_inventory: 'Career Discovery',
};

/** Prefer canonical titles over legacy Firestore assessment_types.name values. */
export function assessmentDisplayName(assessmentId: string, fallbackName?: string | null): string {
  const id = canonicalAssessmentId(assessmentId);
  return ASSESSMENT_NAMES[id] ?? (fallbackName?.trim() || assessmentId);
}

/** Sequence gate: prerequisites must be satisfied (membership gate is checked first). */
export const COMPLETION_PREREQUISITES: Record<string, string[]> = {
  analytical_reasoning: [],
  verbal_reasoning: ['analytical_reasoning'],
  mathematical_reasoning: ['verbal_reasoning'],
  comprehensive_personality: ['verbal_reasoning', 'mathematical_reasoning'],
  ai_literacy: ['comprehensive_personality'],
  english_proficiency: ['comprehensive_personality', 'ai_literacy'],
  career_interest_inventory: ['english_proficiency'],
};

/** New accounts and missing level default to API level 1 (Discovery entry path in product copy). */
export function normalizeMembershipLevel(raw: number | null | undefined): number {
  if (raw == null || raw === 0) return 1;
  return Math.min(4, Math.max(1, raw));
}

/**
 * Prefer `assessment_gate_membership_level` from GET /getStudentDetails when present (school
 * institutional tier may unlock Exams 4–5 for Premium campuses). Otherwise matches {@link normalizeMembershipLevel}.
 */
export function membershipLevelForAssessmentGate(student: {
  membership_level?: number | null;
  assessment_gate_membership_level?: number | null;
}): number {
  const g = student?.assessment_gate_membership_level;
  if (typeof g === 'number' && !Number.isNaN(g)) {
    return normalizeMembershipLevel(g);
  }
  return normalizeMembershipLevel(student?.membership_level);
}

export function minMembershipLevelForAssessment(assessmentId: string): number {
  for (let level = 1; level <= 4; level++) {
    if (MEMBERSHIP_ALLOWED[level]?.includes(assessmentId)) return level;
  }
  return 4;
}

export function computeGate(
  assessmentId: string,
  membershipLevel: number,
  progress: Record<string, AssessmentProgress>,
  grade: number,
  assessments: AssessmentType[]
): GateResult {
  const id = canonicalAssessmentId(assessmentId);
  const level = normalizeMembershipLevel(membershipLevel);
  const allowedByMembership = MEMBERSHIP_ALLOWED[level] ?? [];
  if (!allowedByMembership.includes(id)) {
    return {
      locked: true,
      reason: 'membership',
      requiredMembershipLevel: minMembershipLevelForAssessment(id),
    };
  }

  const byId = new Map(assessments.map((a) => [canonicalAssessmentId(a.id), a]));
  const prereqs = COMPLETION_PREREQUISITES[id] ?? [];
  for (const prereq of prereqs) {
    const prereqProgress =
      progress[prereq] ??
      progress[canonicalAssessmentId(prereq)];
    const prereqAss = byId.get(prereq);
    const prereqMaxTiers = maxTiersForAssessment(prereq, prereqAss?.tiers?.length);
    const passed = examSequencePrereqMet(
      id,
      prereq,
      prereqProgress,
      prereqMaxTiers,
      prereqAss?.tier_progression ?? undefined,
      grade
    );
    if (!passed) {
      return { locked: true, reason: 'prerequisite', missingPrerequisite: prereq };
    }
  }

  return { locked: false, reason: null };
}

export function isAssessmentFullyComplete(
  assessment: AssessmentType,
  progress: AssessmentProgress
): boolean {
  if (!isLevelBasedAssessment(assessment.id)) {
    return progress.status === 'completed' || progress.attempts_count > 0;
  }
  const totalTiers = maxTiersForAssessment(assessment.id, assessment.tiers.length);
  if (totalTiers <= 0) return false;
  if (progress.tiers_cleared && Object.keys(progress.tiers_cleared).length > 0) {
    return countClearedTiersFromProgress(progress, totalTiers) >= totalTiers;
  }
  return (progress.proficiency_tier ?? 0) > totalTiers;
}

export const defaultAssessmentProgress: AssessmentProgress = {
  proficiency_tier: 1,
  status: 'locked',
  best_score: null,
  attempts_count: 0,
  latest_attempt_level: null,
  latest_attempt_score: null,
};

/** Landing dashboard chart always shows Exam 1–5 (first five program assessments). */
export const DASHBOARD_CHART_EXAM_IDS = ASSESSMENT_ORDER.slice(0, 5);

/** Competitive exams are shown in the UI as points out of this total (normalized score maps linearly). */
export const EXAM_MAX_SCORE_POINTS = 1000;
export const LEVEL_CLEAR_THRESHOLD_PERCENT = 80;
export const LEVEL_CLEAR_THRESHOLD_POINTS = 800;
export const LEVEL_CLEAR_THRESHOLD_LABEL = `${LEVEL_CLEAR_THRESHOLD_POINTS} on ${EXAM_MAX_SCORE_POINTS}`;

/** Chart rows use best-tier as 0–100; map to the display scale for labels and bars. */
export function tierPercentToExamPoints(percent0to100: number): number {
  const p = Math.max(0, Math.min(100, percent0to100));
  return Math.round((p / 100) * EXAM_MAX_SCORE_POINTS);
}

/** One slot per exam bar on the student dashboard overview chart. */
export type AssessmentChartRow = {
  subject: string;
  score: number;
  assessmentId: string;
  locked: boolean;
  /** Level (1-indexed) for the displayed score - last graded attempt when backend fields exist. */
  chartLevel?: number | null;
  /** True when the bar uses legacy best_score (no latest attempt snapshot yet). */
  chartScoreIsBestFallback?: boolean;
};

function chartExamDisplayName(assessmentId: string): string {
  return assessmentDisplayName(assessmentId);
}

/**
 * Latest graded attempt when {@link AssessmentProgress.latest_attempt_score} is set;
 * otherwise legacy {@link AssessmentProgress.best_score} for older profiles.
 */
export function pickLatestOrBestAssessmentScore(p: AssessmentProgress): {
  score0to100: number;
  chartLevel: number | null;
  chartScoreIsBestFallback: boolean;
} | null {
  const ls = p.latest_attempt_score;
  const ll = p.latest_attempt_level;
  const hasLatest =
    typeof ls === 'number' &&
    !Number.isNaN(ls) &&
    typeof ll === 'number' &&
    !Number.isNaN(ll) &&
    ll >= 1;

  if (hasLatest) {
    return {
      score0to100: Math.max(0, Math.min(100, Math.round(ls * 100))),
      chartLevel: ll,
      chartScoreIsBestFallback: false,
    };
  }
  if (p.best_score != null && p.attempts_count > 0) {
    return {
      score0to100: Math.max(0, Math.min(100, Math.round(p.best_score * 100))),
      chartLevel: null,
      chartScoreIsBestFallback: true,
    };
  }
  return null;
}

export type AssessmentLevelScoreBreakdownRow = {
  level: number;
  score0to100: number | null;
  source: 'levelBest' | 'latestAttempt' | 'missing';
};

function normalizeRawScoreToPercent(raw: unknown): number | null {
  if (typeof raw !== 'number' || Number.isNaN(raw)) return null;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export function buildAssessmentLevelScoreBreakdown(
  progress: AssessmentProgress,
  totalLevels: number
): AssessmentLevelScoreBreakdownRow[] {
  if (totalLevels <= 0) return [];
  const scoresByLevel = progress.best_scores_by_level ?? {};
  const latestLevel =
    typeof progress.latest_attempt_level === 'number' && !Number.isNaN(progress.latest_attempt_level)
      ? progress.latest_attempt_level
      : null;

  return Array.from({ length: totalLevels }, (_, index) => {
    const level = index + 1;
    const levelBestScore = normalizeRawScoreToPercent(scoresByLevel[String(level)]);
    if (levelBestScore != null) {
      return { level, score0to100: levelBestScore, source: 'levelBest' as const };
    }

    if (latestLevel === level) {
      const latestScore = normalizeRawScoreToPercent(progress.latest_attempt_score);
      if (latestScore != null) {
        return { level, score0to100: latestScore, source: 'latestAttempt' as const };
      }
    }

    return { level, score0to100: null, source: 'missing' as const };
  });
}

/**
 * Builds exactly five rows for the landing chart (first five program assessments).
 * Uses latest attempt score/level when present; otherwise best_score for legacy profiles.
 * X-axis labels use canonical {@link ASSESSMENT_NAMES} (current programme sequence titles).
 */
export function buildDashboardExamChartRows(
  assessments: AssessmentType[],
  progress: Record<string, AssessmentProgress>,
  membershipLevel: number,
  studentGrade: number
): AssessmentChartRow[] {
  const sorted = [...assessments].sort((a, b) => {
    const ia = ASSESSMENT_ORDER.indexOf(canonicalAssessmentId(a.id) as AssessmentId);
    const ib = ASSESSMENT_ORDER.indexOf(canonicalAssessmentId(b.id) as AssessmentId);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return DASHBOARD_CHART_EXAM_IDS.map((id) => {
    const a = sorted.find((x) => canonicalAssessmentId(x.id) === id);
    const subject = chartExamDisplayName(id);
    const p = progress[id] ?? defaultAssessmentProgress;
    const gate = a ? computeGate(id, membershipLevel, progress, studentGrade, sorted) : { locked: true as const };
    const picked = pickLatestOrBestAssessmentScore(p);
    const showBar = !!a && !gate.locked && picked != null;

    if (showBar && picked) {
      return {
        subject,
        score: picked.score0to100,
        assessmentId: id,
        locked: false,
        chartLevel: picked.chartLevel,
        chartScoreIsBestFallback: picked.chartScoreIsBestFallback,
      };
    }
    return {
      subject,
      score: 0,
      assessmentId: id,
      locked: true,
    };
  });
}
