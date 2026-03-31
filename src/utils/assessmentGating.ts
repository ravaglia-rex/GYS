import type { AssessmentType } from '../db/assessmentCollection';
import {
  countClearedTiersFromProgress,
  graduationPrereqMetForAssessment,
} from './tierProgression';

/** Canonical assessment order for sorting and gating */
export const ASSESSMENT_ORDER = [
  'symbolic_reasoning',
  'verbal_reasoning',
  'mathematical_reasoning',
  'personality_assessment',
  'english_proficiency',
  'ai_literacy',
  'comprehensive_personality',
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

/** Level 1 = Assessment 1; Level 2 = Assessments 1–3; Level 3 = full program (1–5 + 6 + 7) */
export const MEMBERSHIP_ALLOWED: Record<number, string[]> = {
  0: [],
  1: ['symbolic_reasoning'],
  2: ['symbolic_reasoning', 'verbal_reasoning', 'mathematical_reasoning'],
  3: [...ASSESSMENT_ORDER],
};

export const MEMBERSHIP_LEVEL_LABELS: Record<number, string> = {
  1: 'Level 1 - Explore',
  2: 'Level 2 - Engage',
  3: 'Level 3 - Excel',
};

/** Shown on the dashboard chart without a numeric % (non-competitive / profile assessments). */
export const NON_COMPETITIVE_CHART_ASSESSMENT_IDS: ReadonlySet<string> = new Set([
  'personality_assessment',
  'comprehensive_personality',
]);

export const ASSESSMENT_NAMES: Record<string, string> = {
  symbolic_reasoning: 'Symbolic Reasoning',
  verbal_reasoning: 'Verbal Reasoning',
  mathematical_reasoning: 'Mathematical Reasoning',
  personality_assessment: 'Personality Assessment',
  english_proficiency: 'English Proficiency',
  ai_literacy: 'AI Literacy & Capability',
  comprehensive_personality: 'Comprehensive Personality',
};

/** Sequence gate: prerequisites must be satisfied (membership gate is checked first). */
export const COMPLETION_PREREQUISITES: Record<string, string[]> = {
  symbolic_reasoning: [],
  verbal_reasoning: ['symbolic_reasoning'],
  mathematical_reasoning: ['symbolic_reasoning'],
  personality_assessment: ['verbal_reasoning', 'mathematical_reasoning'],
  english_proficiency: ['verbal_reasoning', 'mathematical_reasoning'],
  ai_literacy: ['personality_assessment', 'english_proficiency'],
  comprehensive_personality: ['personality_assessment', 'english_proficiency', 'ai_literacy'],
};

/** New accounts and missing level default to Level 1 (Entry / Tier 1 experience). */
export function normalizeMembershipLevel(raw: number | null | undefined): number {
  if (raw == null || raw === 0) return 1;
  return Math.min(3, Math.max(1, raw));
}

export function minMembershipLevelForAssessment(assessmentId: string): number {
  for (let level = 1; level <= 3; level++) {
    if (MEMBERSHIP_ALLOWED[level]?.includes(assessmentId)) return level;
  }
  return 3;
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
