/**
 * Static mock learner dashboard - no Firestore, no auth.
 */
import type { AssessmentType } from '../db/assessmentCollection';
import { ASSESSMENT_ORDER, type AssessmentProgress } from '../utils/assessmentGating';

const mkTiers = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `tier-${i + 1}`,
    tier_number: i + 1,
    name: `Tier ${i + 1}`,
  }));

export const PREVIEW_STUDENT_PROFILE = {
  firstName: 'Aanya',
  grade: 10,
  schoolName: 'Navrion Future Academy',
  membershipLevelLabel: 'Level 3 - Excel',
  membershipExpiryLabel: 'Active until Mar 2027',
};

export const PREVIEW_DASHBOARD_STATS = {
  totalAssessments: 6,
  completedAssessments: 4,
  averageScore: 81,
  availableAssessments: 2,
};

export const PREVIEW_ASSESSMENT_TYPES: AssessmentType[] = [
  { id: 'symbolic_reasoning', name: 'Pattern and Logic', tiers: mkTiers(3) },
  { id: 'verbal_reasoning', name: 'Verbal Reasoning', tiers: mkTiers(3) },
  { id: 'mathematical_reasoning', name: 'Mathematical Reasoning', tiers: mkTiers(3) },
  { id: 'english_proficiency', name: 'English Proficiency', tiers: mkTiers(3) },
  { id: 'ai_literacy', name: 'AI Literacy & Capability', tiers: mkTiers(1) },
  { id: 'comprehensive_personality', name: 'Comprehensive Personality', tiers: mkTiers(3) },
];

/**
 * Level 3 membership. Reasoning triad complete; English on tier 3 (retake).
 * AI tier 1 not yet attempted - comprehensive stays prerequisite-locked until AI is finished.
 */
export const PREVIEW_ASSESSMENT_PROGRESS: Record<string, AssessmentProgress> = {
  symbolic_reasoning: {
    proficiency_tier: 4,
    status: 'tier_advanced',
    best_score: 0.82,
    attempts_count: 2,
  },
  verbal_reasoning: {
    proficiency_tier: 4,
    status: 'tier_advanced',
    best_score: 0.76,
    attempts_count: 1,
  },
  mathematical_reasoning: {
    proficiency_tier: 4,
    status: 'tier_advanced',
    best_score: 0.88,
    attempts_count: 1,
  },
  english_proficiency: {
    proficiency_tier: 3,
    status: 'tier_advanced',
    best_score: 0.72,
    attempts_count: 3,
  },
  ai_literacy: {
    proficiency_tier: 1,
    status: 'available',
    best_score: null,
    attempts_count: 0,
  },
  comprehensive_personality: {
    proficiency_tier: 1,
    status: 'locked',
    best_score: null,
    attempts_count: 0,
  },
};

export const PREVIEW_MEMBERSHIP_LEVEL = 3;

/** Chart rows for preview dashboard (assessmentId drives non-competitive labeling). */
export function getPreviewAssessmentBestTierChartData(): {
  subject: string;
  score: number;
  assessmentId: string;
}[] {
  const rows: { subject: string; score: number; assessmentId: string }[] = [];
  for (const id of ASSESSMENT_ORDER) {
    const p = PREVIEW_ASSESSMENT_PROGRESS[id];
    const a = PREVIEW_ASSESSMENT_TYPES.find((x) => x.id === id);
    if (!p || !a || p.best_score == null || p.attempts_count < 1) continue;
    rows.push({
      subject: a.name,
      score: Math.round(p.best_score * 100),
      assessmentId: id,
    });
  }
  return rows;
}
