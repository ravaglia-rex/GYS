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

/**
 * Single fictional learner for all `/students/preview/*` pages (dashboard, settings, billing copy).
 * `membershipExpiryLabel` is the date/month phrase only - dashboard UI adds “Active until ”.
 */
export const PREVIEW_STUDENT_PROFILE = {
  firstName: 'Aanya',
  /** Full name on preview settings (same student as `firstName`). */
  displayName: 'Aanya Sharma',
  email: 'aanya.preview@example.com',
  phoneNumber: '+91 98765 43210',
  grade: 10,
  /** Matches `grade` for settings dropdowns */
  gradeLabel: '10th Grade' as const,
  schoolName: 'Navrion Future Academy',
  membershipLevelLabel: 'Reasoning + Skills',
  membershipExpiryLabel: 'Mar 2027',
  parentName: 'Neha Sharma',
  parentEmail: 'neha.sharma@example.com',
  parentPhone: '+91 91234 56780',
  about:
    'Grade 10 learner at Navrion Future Academy - same sample profile as the preview dashboard.',
};

/** Profile form defaults for preview settings - derived from {@link PREVIEW_STUDENT_PROFILE}. */
export const PREVIEW_SETTINGS_FORM_INITIAL = {
  displayName: PREVIEW_STUDENT_PROFILE.displayName,
  email: PREVIEW_STUDENT_PROFILE.email,
  phoneNumber: PREVIEW_STUDENT_PROFILE.phoneNumber,
  schoolName: PREVIEW_STUDENT_PROFILE.schoolName,
  grade: PREVIEW_STUDENT_PROFILE.gradeLabel,
  parentName: PREVIEW_STUDENT_PROFILE.parentName,
  parentEmail: PREVIEW_STUDENT_PROFILE.parentEmail,
  parentPhone: PREVIEW_STUDENT_PROFILE.parentPhone,
  about: PREVIEW_STUDENT_PROFILE.about,
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
 * (latest graded attempt was still L2 - clears “2/3 levels” vs “Level” under score).
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

/** Chart rows for preview dashboard - same Exam 1–5 slots as the live dashboard. */
export function getPreviewAssessmentBestTierChartData(): AssessmentChartRow[] {
  return buildDashboardExamChartRows(
    PREVIEW_ASSESSMENT_TYPES,
    PREVIEW_ASSESSMENT_PROGRESS,
    PREVIEW_MEMBERSHIP_LEVEL,
    PREVIEW_STUDENT_PROFILE.grade
  );
}
