/**
 * Static mock learner dashboard - no Firestore, no auth.
 */
import type { AssessmentType } from '../db/assessmentCollection';
import {
  buildDashboardExamChartRows,
  type AssessmentChartRow,
  type AssessmentProgress,
} from '../utils/assessmentGating';

const mkTiers = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `tier-${i + 1}`,
    tier_number: i + 1,
    name: `Level ${i + 1}`,
  }));

export const PREVIEW_STUDENT_PROFILE = {
  firstName: 'Aanya',
  grade: 10,
  schoolName: 'Navrion Future Academy',
  membershipLevelLabel: 'Membership 2 • Reasoning + Skills',
  membershipExpiryLabel: 'Active until Mar 2027',
};

export const PREVIEW_DASHBOARD_STATS = {
  totalAssessments: 7,
  completedAssessments: 3,
  averageScore: 810,
  availableAssessments: 1,
};

export const PREVIEW_ASSESSMENT_TYPES: AssessmentType[] = [
  { id: 'symbolic_reasoning', name: 'Pattern and Logic', tiers: mkTiers(3) },
  { id: 'verbal_reasoning', name: 'Verbal Reasoning', tiers: mkTiers(3) },
  { id: 'mathematical_reasoning', name: 'Mathematical Reasoning', tiers: mkTiers(3) },
  { id: 'english_proficiency', name: 'English Proficiency', tiers: mkTiers(3) },
  { id: 'ai_literacy', name: 'AI Proficiency', tiers: mkTiers(3) },
  { id: 'comprehensive_personality', name: 'Comprehensive Personality', tiers: mkTiers(3) },
  { id: 'career_interest_inventory', name: 'Interest & Career Discovery', tiers: mkTiers(1) },
];

/**
 * Reasoning + Skills package. Reasoning triad complete; English passed L1–L2, focused on L3
 * (latest graded attempt was still L2 — clears “2/3 levels” vs “Level” under score).
 * AI level 1 not yet attempted - comprehensive stays prerequisite-locked until AI is finished.
 */
export const PREVIEW_ASSESSMENT_PROGRESS: Record<string, AssessmentProgress> = {
  symbolic_reasoning: {
    proficiency_tier: 4,
    status: 'tier_advanced',
    best_score: 0.82,
    attempts_count: 2,
    latest_attempt_level: 3,
    latest_attempt_score: 0.79,
  },
  verbal_reasoning: {
    proficiency_tier: 4,
    status: 'tier_advanced',
    best_score: 0.76,
    attempts_count: 1,
    latest_attempt_level: 3,
    latest_attempt_score: 0.76,
  },
  mathematical_reasoning: {
    proficiency_tier: 4,
    status: 'tier_advanced',
    best_score: 0.88,
    attempts_count: 1,
    latest_attempt_level: 3,
    latest_attempt_score: 0.88,
  },
  english_proficiency: {
    proficiency_tier: 3,
    status: 'tier_advanced',
    best_score: 0.72,
    attempts_count: 3,
    tiers_cleared: { '1': true, '2': true },
    latest_attempt_level: 2,
    latest_attempt_score: 0.72,
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
  career_interest_inventory: {
    proficiency_tier: 1,
    status: 'locked',
    best_score: null,
    attempts_count: 0,
  },
};

export const PREVIEW_MEMBERSHIP_LEVEL = 3;

/** Chart rows for preview dashboard — same Exam 1–5 slots as the live dashboard. */
export function getPreviewAssessmentBestTierChartData(): AssessmentChartRow[] {
  return buildDashboardExamChartRows(
    PREVIEW_ASSESSMENT_TYPES,
    PREVIEW_ASSESSMENT_PROGRESS,
    PREVIEW_MEMBERSHIP_LEVEL,
    PREVIEW_STUDENT_PROFILE.grade
  );
}
