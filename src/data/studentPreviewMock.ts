/**
 * Static mock learner dashboard - no Firestore, no auth.
 */
import type { AssessmentType } from '../db/assessmentCollection';
import type { AttemptRecord } from '../db/assessmentCollection';
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
  gradeLabel: 'Class 10' as const,
  schoolName: 'Navrion Future Academy',
  membershipLevelLabel: 'Stream Ready',
  membershipExpiryLabel: 'Mar 2027',
  parentName: 'Neha Sharma',
  parentEmail: 'neha.sharma@example.com',
  parentPhone: '+91 91234 56780',
  about:
    'Class 10 learner at Navrion Future Academy - same sample profile as the preview dashboard.',
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
  completedAssessments: 4,
  averageScore: 840,
  availableAssessments: 1,
};

export const PREVIEW_ASSESSMENT_TYPES: AssessmentType[] = [
  { id: 'symbolic_reasoning', name: 'Pattern and Logic', tiers: mkTiers(3) },
  { id: 'verbal_reasoning', name: 'Verbal Reasoning', tiers: mkTiers(3) },
  { id: 'mathematical_reasoning', name: 'Mathematical Reasoning', tiers: mkTiers(3) },
  { id: 'comprehensive_personality', name: 'Personality and Interest', tiers: [] },
  { id: 'ai_literacy', name: 'AI Proficiency', tiers: mkTiers(3) },
  { id: 'english_proficiency', name: 'English Proficiency', tiers: mkTiers(3) },
  { id: 'career_interest_inventory', name: 'Career Discovery', tiers: [] },
];

/**
 * Stream Ready package. Reasoning triad complete; Personality complete; AI level 1 not yet attempted.
 * English and Career Discovery stay locked until Career Ready.
 */
export const PREVIEW_ASSESSMENT_PROGRESS: Record<string, AssessmentProgress> = {
  symbolic_reasoning: {
    proficiency_tier: 4,
    status: 'tier_advanced',
    best_score: 0.82,
    best_scores_by_level: { '1': 0.84, '2': 0.81, '3': 0.82 },
    attempts_count: 3,
    latest_attempt_level: 3,
    latest_attempt_score: 0.82,
  },
  verbal_reasoning: {
    proficiency_tier: 4,
    status: 'tier_advanced',
    best_score: 0.84,
    best_scores_by_level: { '1': 0.82, '2': 0.83, '3': 0.84 },
    attempts_count: 3,
    latest_attempt_level: 3,
    latest_attempt_score: 0.84,
  },
  mathematical_reasoning: {
    proficiency_tier: 4,
    status: 'tier_advanced',
    best_score: 0.88,
    best_scores_by_level: { '1': 0.86, '2': 0.88, '3': 0.88 },
    attempts_count: 3,
    latest_attempt_level: 3,
    latest_attempt_score: 0.88,
  },
  comprehensive_personality: {
    status: 'completed',
    best_score: null,
    attempts_count: 1,
  },
  ai_literacy: {
    proficiency_tier: 1,
    status: 'available',
    best_score: null,
    attempts_count: 0,
  },
  english_proficiency: {
    status: 'locked',
    best_score: null,
    attempts_count: 0,
  },
  career_interest_inventory: {
    status: 'locked',
    best_score: null,
    attempts_count: 0,
  },
};

export const PREVIEW_MEMBERSHIP_LEVEL = 3;

export const PREVIEW_ASSESSMENT_ATTEMPTS: AttemptRecord[] = [
  {
    attempt_id: 'preview-personality-complete',
    assessment_id: 'comprehensive_personality',
    proficiency_tier: 1,
    status: 'completed',
    score: 1,
    passed: true,
    started_at: '2026-04-23T09:30:00.000Z',
    completed_at: '2026-04-23T10:15:00.000Z',
  },
  {
    attempt_id: 'preview-math-l3-pass',
    assessment_id: 'mathematical_reasoning',
    proficiency_tier: 3,
    status: 'completed',
    score: 0.88,
    passed: true,
    started_at: '2026-04-02T09:00:00.000Z',
    completed_at: '2026-04-02T09:45:00.000Z',
  },
  {
    attempt_id: 'preview-math-l2-pass',
    assessment_id: 'mathematical_reasoning',
    proficiency_tier: 2,
    status: 'completed',
    score: 0.88,
    passed: true,
    started_at: '2026-03-28T09:00:00.000Z',
    completed_at: '2026-03-28T09:45:00.000Z',
  },
  {
    attempt_id: 'preview-math-l1-pass',
    assessment_id: 'mathematical_reasoning',
    proficiency_tier: 1,
    status: 'completed',
    score: 0.86,
    passed: true,
    started_at: '2026-03-22T09:00:00.000Z',
    completed_at: '2026-03-22T09:45:00.000Z',
  },
  {
    attempt_id: 'preview-verbal-l3-pass',
    assessment_id: 'verbal_reasoning',
    proficiency_tier: 3,
    status: 'completed',
    score: 0.84,
    passed: true,
    started_at: '2026-03-16T08:30:00.000Z',
    completed_at: '2026-03-16T09:15:00.000Z',
  },
  {
    attempt_id: 'preview-verbal-l2-pass',
    assessment_id: 'verbal_reasoning',
    proficiency_tier: 2,
    status: 'completed',
    score: 0.83,
    passed: true,
    started_at: '2026-03-11T08:30:00.000Z',
    completed_at: '2026-03-11T09:15:00.000Z',
  },
  {
    attempt_id: 'preview-verbal-l1-pass',
    assessment_id: 'verbal_reasoning',
    proficiency_tier: 1,
    status: 'completed',
    score: 0.82,
    passed: true,
    started_at: '2026-03-06T08:30:00.000Z',
    completed_at: '2026-03-06T09:15:00.000Z',
  },
  {
    attempt_id: 'preview-symbolic-l3-pass',
    assessment_id: 'symbolic_reasoning',
    proficiency_tier: 3,
    status: 'completed',
    score: 0.82,
    passed: true,
    started_at: '2026-02-27T08:30:00.000Z',
    completed_at: '2026-02-27T09:15:00.000Z',
  },
  {
    attempt_id: 'preview-symbolic-l2-pass',
    assessment_id: 'symbolic_reasoning',
    proficiency_tier: 2,
    status: 'completed',
    score: 0.81,
    passed: true,
    started_at: '2026-02-21T08:30:00.000Z',
    completed_at: '2026-02-21T09:15:00.000Z',
  },
  {
    attempt_id: 'preview-symbolic-l1-pass',
    assessment_id: 'symbolic_reasoning',
    proficiency_tier: 1,
    status: 'completed',
    score: 0.84,
    passed: true,
    started_at: '2026-02-16T08:30:00.000Z',
    completed_at: '2026-02-16T09:15:00.000Z',
  },
];

/** Chart rows for preview dashboard - same Exam 1–5 slots as the live dashboard. */
export function getPreviewAssessmentBestTierChartData(): AssessmentChartRow[] {
  return buildDashboardExamChartRows(
    PREVIEW_ASSESSMENT_TYPES,
    PREVIEW_ASSESSMENT_PROGRESS,
    PREVIEW_MEMBERSHIP_LEVEL,
    PREVIEW_STUDENT_PROFILE.grade
  );
}
