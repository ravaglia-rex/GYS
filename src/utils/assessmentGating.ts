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
};
