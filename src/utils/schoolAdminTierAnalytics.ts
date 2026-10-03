import type { StudentRow } from '../db/schoolAdminCollection';
import { ASSESSMENT_NAMES } from './assessmentGating';
import {
  normalizeAchievementTierId,
  CANONICAL_ACHIEVEMENT_TIER_IDS,
} from './achievementTier';

type Progress = NonNullable<StudentRow['assessment_progress']>[string];

function normalizedStatus(p: Progress): string {
  return typeof p.status === 'string' ? p.status.toLowerCase().trim() : '';
}

/** Firestore/JSON sometimes yields string numbers; normalize before band math. */
function numericProficiencyTier(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return 1;
}

/** Bar + legend colors for proficiency levels 1–3 (high contrast when stacked). */
export const PROF_TIER_COLORS = {
  tier1: '#1d4ed8', // blue-700
  tier2: '#ea580c', // orange-600 — warm vs cool so thin L2 slices stay visible
  tier3: '#15803d', // green-700
} as const;

export function isActiveAssessmentProgress(p: Progress | undefined): p is Progress {
  if (!p || typeof p !== 'object') return false;
  const st = normalizedStatus(p);
  // Unlocked (`available`) is not an attempt - membership unlock must not inflate analytics.
  if (st === 'tier_advanced' || st === 'completed') return true;
  const attempts = Number((p as { attempts_count?: unknown }).attempts_count);
  if (Number.isFinite(attempts) && attempts > 0) return true;
  const latest = (p as { latest_attempt_score?: unknown }).latest_attempt_score;
  if (latest != null) {
    const n = typeof latest === 'number' ? latest : Number(latest);
    if (Number.isFinite(n)) return true;
  }
  const bs = (p as { best_score?: unknown }).best_score;
  if (bs != null) {
    const n = typeof bs === 'number' ? bs : Number(bs);
    if (Number.isFinite(n)) return true;
  }
  return false;
}

/**
 * Per-assessment slot: current proficiency focus band (1 / 2 / 3).
 * Uses `proficiency_tier` (next unlocked / focus level). Values above 3 (all levels
 * cleared → maxTiers+1) count as Level 3. Do not map `tier_advanced` to Level 3 -
 * that status only means a tier was cleared, often Level 1.
 */
export function slotProficiencyTierBand(p: Progress): 1 | 2 | 3 {
  const t = numericProficiencyTier(p.proficiency_tier);
  if (t <= 1) return 1;
  if (t === 2) return 2;
  return 3;
}

/**
 * Overall student proficiency: highest level among active assessment slots.
 * 0 = no started / attempted assessments yet.
 */
export function studentOverallProficiencyBand(student: StudentRow): 0 | 1 | 2 | 3 {
  const progress = student.assessment_progress ?? {};
  const entries = Object.values(progress).filter(isActiveAssessmentProgress);
  if (entries.length === 0) return 0;
  const bands = entries.map(slotProficiencyTierBand);
  return Math.max(...bands) as 1 | 2 | 3;
}

export function studentHasAnyAssessmentAttempt(student: StudentRow): boolean {
  return studentOverallProficiencyBand(student) > 0;
}

/** Share of roster who have started or completed at least one assessment. */
export function computeAttemptRatePct(students: StudentRow[]): number {
  if (students.length === 0) return 0;
  const attempted = students.filter(studentHasAnyAssessmentAttempt).length;
  return Math.round((attempted / students.length) * 100);
}

export interface Tier123Counts {
  tier1: number;
  tier2: number;
  tier3: number;
  total: number;
}

/** Bar + legend colors for national GYS performance tiers (Explorer teal - distinct from Diamond violet). */
export const NATIONAL_PERFORMANCE_TIER_COLORS: Record<
  (typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number],
  string
> = {
  explorer: '#0d9488',
  bronze: '#ea580c',
  silver: '#6b7280',
  gold: '#f59e0b',
  platinum: '#0284c7',
  diamond: '#7c3aed',
};

/**
 * Whole-number segment widths (0-100) that sum to exactly 100.
 * Uses the largest remainder method in tier order Explorer → Diamond.
 */
export function nationalTierPercentDistribution(
  counts: Record<(typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number], number>,
  total: number
): Record<(typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number], number> {
  const order = CANONICAL_ACHIEVEMENT_TIER_IDS as readonly string[];
  if (total <= 0) {
    return Object.fromEntries(order.map((id) => [id, 0])) as Record<
      (typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number],
      number
    >;
  }
  const exact = CANONICAL_ACHIEVEMENT_TIER_IDS.map((id) => (counts[id] / total) * 100);
  const floors = exact.map((e) => Math.floor(e));
  let rem = 100 - floors.reduce((a, b) => a + b, 0);
  const frac = exact.map((e, i) => ({ i, f: e - floors[i]! }));
  frac.sort((a, b) => b.f - a.f);
  const addOne = new Set<number>();
  for (let k = 0; k < rem; k++) {
    addOne.add(frac[k]!.i);
  }
  const out = {} as Record<(typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number], number>;
  CANONICAL_ACHIEVEMENT_TIER_IDS.forEach((id, idx) => {
    out[id] = floors[idx]! + (addOne.has(idx) ? 1 : 0);
  });
  return out;
}

/** Counts roster students by normalized `achievement_tier` (nationwide GYS tier, distinct from proficiency L1–3). */
export function summarizeNationalPerformanceTiers(
  students: StudentRow[]
): { counts: Record<(typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number], number>; total: number } {
  const counts = {
    explorer: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
    diamond: 0,
  } satisfies Record<(typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number], number>;
  for (const s of students) {
    const id = normalizeAchievementTierId(s.achievement_tier) as (typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number];
    counts[id] += 1;
  }
  return { counts, total: students.length };
}

/**
 * Counts students by highest proficiency level across active assessments.
 * Students with no attempts are omitted from L1/L2/L3 counts; `total` is full roster size.
 */
export function summarizeSchoolTier123(students: StudentRow[]): Tier123Counts {
  const list = students;
  let tier1 = 0;
  let tier2 = 0;
  let tier3 = 0;
  for (const s of list) {
    const b = studentOverallProficiencyBand(s);
    if (b === 0) continue;
    if (b === 1) tier1 += 1;
    else if (b === 2) tier2 += 1;
    else tier3 += 1;
  }
  return { tier1, tier2, tier3, total: list.length };
}

export interface ExamProficiencySummary extends Tier123Counts {
  examId: string;
}

/** Per exam: how many students with activity on that exam sit in Level 1 / 2 / 3. */
export function summarizeProficiencyByExam(
  students: StudentRow[],
  examIds: readonly string[]
): ExamProficiencySummary[] {
  return examIds.map(examId => {
    let tier1 = 0;
    let tier2 = 0;
    let tier3 = 0;
    let total = 0;
    for (const s of students) {
      const p = s.assessment_progress?.[examId];
      if (!isActiveAssessmentProgress(p)) continue;
      total += 1;
      const band = slotProficiencyTierBand(p);
      if (band === 1) tier1 += 1;
      else if (band === 2) tier2 += 1;
      else tier3 += 1;
    }
    return { examId, tier1, tier2, tier3, total };
  });
}

export interface ExamGradeTierRow {
  grade: number;
  tier1: number;
  tier2: number;
  tier3: number;
  total: number;
}

export function summarizeExamGradeTier123(students: StudentRow[], assessmentId: string): ExamGradeTierRow[] {
  const list = students;
  const byGrade: Record<number, ExamGradeTierRow> = {};

  for (const s of list) {
    const g = typeof s.grade === 'number' && s.grade > 0 ? s.grade : 0;
    if (g <= 0) continue;
    const p = s.assessment_progress?.[assessmentId];
    if (!isActiveAssessmentProgress(p)) continue;
    if (!byGrade[g]) byGrade[g] = { grade: g, tier1: 0, tier2: 0, tier3: 0, total: 0 };
    const row = byGrade[g]!;
    const band = slotProficiencyTierBand(p);
    row.total += 1;
    if (band === 1) row.tier1 += 1;
    else if (band === 2) row.tier2 += 1;
    else row.tier3 += 1;
  }

  return Object.values(byGrade).sort((a, b) => a.grade - b.grade);
}

export function assessmentDisplayName(id: string): string {
  return ASSESSMENT_NAMES[id] ?? id.replace(/_/g, ' ');
}
