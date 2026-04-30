import type { AssessmentType } from '../db/assessmentCollection';
import {
  countClearedTiersFromProgress,
  graduationPrereqMetForAssessment,
} from './tierProgression';

/**
 * Canonical assessment order for sorting and gating (wired assessment ids from Firestore).
 * Rev 13 lists seven exams in the program; add exam 7 to `app_config/assessment_types` when ready.
 */
export const PROGRAM_EXAM_COUNT = 7;

export const ASSESSMENT_ORDER = [
  'symbolic_reasoning',
  'verbal_reasoning',
  'mathematical_reasoning',
  'english_proficiency',
  'ai_literacy',
  'comprehensive_personality',
  'career_interest_inventory',
] as const;

export type AssessmentId = (typeof ASSESSMENT_ORDER)[number];

export interface AssessmentProgress {
  proficiency_tier: number;
  status: 'locked' | 'available' | 'tier_advanced';
  best_score: number | null;
  attempts_count: number;
  /** Tier index → cleared at grade-band threshold (from backend completeExam) */
  tiers_cleared?: Record<string, boolean>;
  /** Most recently graded attempt (1-indexed level); set with latest_attempt_score on completeExam. */
  latest_attempt_level?: number | null;
  /** Raw score 0–1 for the most recent graded attempt at latest_attempt_level. */
  latest_attempt_score?: number | null;
}

export type LockReason = 'membership' | 'prerequisite' | null;

export interface GateResult {
  locked: boolean;
  reason: LockReason;
  requiredMembershipLevel?: number;
  missingPrerequisite?: string;
}

/**
 * Rev 13 — Level 1 Discovery (Exam 1); Level 2 Reasoning Triad (1–3); Level 3 Reasoning + Skills (1–5);
 * Level 4 Guided Decision (+ Insight: personality + career discovery).
 */
export const MEMBERSHIP_ALLOWED: Record<number, string[]> = {
  0: [],
  1: ['symbolic_reasoning'],
  2: ['symbolic_reasoning', 'verbal_reasoning', 'mathematical_reasoning'],
  3: [
    'symbolic_reasoning',
    'verbal_reasoning',
    'mathematical_reasoning',
    'english_proficiency',
    'ai_literacy',
  ],
  4: [...ASSESSMENT_ORDER],
};

/** Product copy: three annual packages (API membership levels 2–4) plus Discovery as Early offer (API level 1). */
export const MEMBERSHIP_LEVEL_LABELS: Record<number, string> = {
  1: 'Discovery (Early offer)',
  2: 'Membership 1 • Reasoning Triad',
  3: 'Membership 2 • Reasoning + Skills',
  4: 'Membership 3 • Guided Decision',
};

/** Shown on the dashboard chart without a numeric % (non-competitive / profile assessments). */
export const NON_COMPETITIVE_CHART_ASSESSMENT_IDS: ReadonlySet<string> = new Set([
  'comprehensive_personality',
  'career_interest_inventory',
]);

export const ASSESSMENT_NAMES: Record<string, string> = {
  symbolic_reasoning: 'Pattern and Logic',
  verbal_reasoning: 'Verbal Reasoning',
  mathematical_reasoning: 'Mathematical Reasoning',
  english_proficiency: 'English Proficiency',
  ai_literacy: 'AI Proficiency',
  comprehensive_personality: 'Comprehensive Personality',
  career_interest_inventory: 'Interest & Career Discovery',
};

/** Sequence gate: prerequisites must be satisfied (membership gate is checked first). */
export const COMPLETION_PREREQUISITES: Record<string, string[]> = {
  symbolic_reasoning: [],
  verbal_reasoning: ['symbolic_reasoning'],
  mathematical_reasoning: ['verbal_reasoning'],
  english_proficiency: ['verbal_reasoning', 'mathematical_reasoning'],
  ai_literacy: ['english_proficiency'],
  comprehensive_personality: ['english_proficiency', 'ai_literacy'],
  career_interest_inventory: ['comprehensive_personality'],
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
  const level = normalizeMembershipLevel(membershipLevel);
  const allowedByMembership = MEMBERSHIP_ALLOWED[level] ?? [];
  if (!allowedByMembership.includes(assessmentId)) {
    return {
      locked: true,
      reason: 'membership',
      requiredMembershipLevel: minMembershipLevelForAssessment(assessmentId),
    };
  }

  const byId = new Map(assessments.map((a) => [a.id, a]));
  const prereqs = COMPLETION_PREREQUISITES[assessmentId] ?? [];
  for (const prereq of prereqs) {
    const prereqProgress = progress[prereq];
    const prereqAss = byId.get(prereq);
    const prereqMaxTiers = prereqAss?.tiers?.length ?? 1;
    const comprehensiveAiGate =
      assessmentId === 'comprehensive_personality' && prereq === 'ai_literacy';
    const passed =
      prereqProgress != null &&
      (comprehensiveAiGate
        ? (prereqProgress.proficiency_tier ?? 0) > prereqMaxTiers
        : graduationPrereqMetForAssessment(
            prereqProgress,
            prereqMaxTiers,
            prereqAss?.tier_progression ?? undefined,
            grade
          ));
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
  const totalTiers = assessment.tiers.length;
  if (totalTiers <= 0) return false;
  if (progress.tiers_cleared && Object.keys(progress.tiers_cleared).length > 0) {
    return countClearedTiersFromProgress(progress, totalTiers) >= totalTiers;
  }
  return progress.proficiency_tier > totalTiers;
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

/** Competitive exams are shown in the UI as points out of this total (tier % maps linearly). */
export const EXAM_MAX_SCORE_POINTS = 1000;

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
  /** Level (1-indexed) for the displayed score — last graded attempt when backend fields exist. */
  chartLevel?: number | null;
  /** True when the bar uses legacy best_score (no latest attempt snapshot yet). */
  chartScoreIsBestFallback?: boolean;
};

function chartExamDisplayName(
  assessmentId: string,
  assessment: AssessmentType | undefined
): string {
  const fromConfig = assessment?.name?.trim();
  if (fromConfig) return fromConfig;
  return ASSESSMENT_NAMES[assessmentId] ?? assessmentId;
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

/**
 * Builds exactly five rows for the landing chart (first five program assessments).
 * Uses latest attempt score/level when present; otherwise best_score for legacy profiles.
 * X-axis labels use each assessment’s configured name (fallback: {@link ASSESSMENT_NAMES}).
 */
export function buildDashboardExamChartRows(
  assessments: AssessmentType[],
  progress: Record<string, AssessmentProgress>,
  membershipLevel: number,
  studentGrade: number
): AssessmentChartRow[] {
  const sorted = [...assessments].sort((a, b) => {
    const ia = ASSESSMENT_ORDER.indexOf(a.id as AssessmentId);
    const ib = ASSESSMENT_ORDER.indexOf(b.id as AssessmentId);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return DASHBOARD_CHART_EXAM_IDS.map((id) => {
    const a = sorted.find((x) => x.id === id);
    const subject = chartExamDisplayName(id, a);
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
