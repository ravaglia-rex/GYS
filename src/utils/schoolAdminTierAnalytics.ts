import type { StudentRow } from '../db/schoolAdminCollection';
import { ASSESSMENT_ORDER, ASSESSMENT_NAMES } from './assessmentGating';
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

export const PROF_TIER_COLORS = {
  tier1: '#2563eb',
  tier2: '#7c3aed',
  tier3: '#059669',
} as const;

export function isActiveAssessmentProgress(p: Progress | undefined): p is Progress {
  if (!p || typeof p !== 'object') return false;
  const st = normalizedStatus(p);
  if (st === 'tier_advanced') return true;
  if (st === 'available') return true;
  const attempts = Number((p as { attempts_count?: unknown }).attempts_count);
  if (Number.isFinite(attempts) && attempts > 0) return true;
  const bs = (p as { best_score?: unknown }).best_score;
  if (bs != null) {
    const n = typeof bs === 'number' ? bs : Number(bs);
    if (Number.isFinite(n) && n > 0) return true;
  }
  return false;
}

/**
 * Per-assessment slot: current proficiency focus band (1 / 2 / 3).
 * Uses `proficiency_tier` (next unlocked / focus level). Values above 3 (all levels
 * cleared → maxTiers+1) count as Level 3. Do not map `tier_advanced` to Level 3 —
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

/** Alias - highest active proficiency level (1–3), or 0 if none. */
export const studentHighestProficiencyBand = studentOverallProficiencyBand;

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

export interface GradeTier123Row extends Tier123Counts {
  grade: number;
}

export function summarizeTier123ByGrade(students: StudentRow[]): GradeTier123Row[] {
  const list = students;
  const byGrade: Record<number, Tier123Counts> = {};

  for (const s of list) {
    const raw = typeof s.grade === 'number' ? s.grade : 0;
    const g = raw > 0 ? raw : 0;
    if (!byGrade[g]) byGrade[g] = { tier1: 0, tier2: 0, tier3: 0, total: 0 };
    const row = byGrade[g]!;
    row.total += 1;
    const b = studentOverallProficiencyBand(s);
    if (b === 0) continue;
    if (b === 1) row.tier1 += 1;
    else if (b === 2) row.tier2 += 1;
    else row.tier3 += 1;
  }

  return Object.entries(byGrade)
    .map(([grade, c]) => ({ grade: parseInt(grade, 10), ...c }))
    .sort((a, b) => {
      if (a.grade === 0) return 1;
      if (b.grade === 0) return -1;
      return a.grade - b.grade;
    });
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

export function allExamsWithAnyActivity(students: StudentRow[]): string[] {
  const list = students;
  const ids = new Set<string>();
  for (const s of list) {
    const prog = s.assessment_progress ?? {};
    for (const [aid, p] of Object.entries(prog)) {
      if (isActiveAssessmentProgress(p as Progress)) ids.add(aid);
    }
  }
  const order = [...ASSESSMENT_ORDER];
  return Array.from(ids).sort((a, b) => {
    const ia = order.indexOf(a as (typeof ASSESSMENT_ORDER)[number]);
    const ib = order.indexOf(b as (typeof ASSESSMENT_ORDER)[number]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

export function assessmentDisplayName(id: string): string {
  return ASSESSMENT_NAMES[id] ?? id.replace(/_/g, ' ');
}

export const SCORE_BAND_ORDER = [
  '900-1000',
  '800-899',
  '700-799',
  '600-699',
  '500-599',
  'Below 500',
] as const;

export type ScoreBandId = (typeof SCORE_BAND_ORDER)[number];

export function scorePointsToBand(points: number): ScoreBandId {
  if (points >= 900) return '900-1000';
  if (points >= 800) return '800-899';
  if (points >= 700) return '700-799';
  if (points >= 600) return '600-699';
  if (points >= 500) return '500-599';
  return 'Below 500';
}

function emptyBandCounts(): Record<ScoreBandId, number> {
  return {
    '900-1000': 0,
    '800-899': 0,
    '700-799': 0,
    '600-699': 0,
    '500-599': 0,
    'Below 500': 0,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Prefer latest attempt level when it has sectional data; else highest level key with data. */
function pickSectionalLevelKey(p: Progress): string | null {
  const subByLevel = p.best_subconstruct_scores_by_level;
  const constructByLevel = p.best_construct_scores_by_level;
  const hasLevel = (key: string) => {
    const sub = subByLevel?.[key];
    const con = constructByLevel?.[key];
    return (
      (sub != null && typeof sub === 'object' && Object.keys(sub).length > 0) ||
      (con != null && typeof con === 'object' && Object.keys(con).length > 0)
    );
  };

  const latest = p.latest_attempt_level;
  if (typeof latest === 'number' && Number.isFinite(latest) && latest > 0) {
    const key = String(Math.floor(latest));
    if (hasLevel(key)) return key;
  }

  const keys = new Set<string>();
  if (subByLevel && typeof subByLevel === 'object') {
    for (const k of Object.keys(subByLevel)) keys.add(k);
  }
  if (constructByLevel && typeof constructByLevel === 'object') {
    for (const k of Object.keys(constructByLevel)) keys.add(k);
  }
  const numeric = Array.from(keys)
    .map(k => Number(k))
    .filter(n => Number.isFinite(n) && n > 0)
    .sort((a, b) => b - a);
  for (const n of numeric) {
    const key = String(n);
    if (hasLevel(key)) return key;
  }
  return null;
}

/**
 * Sub-strand fractions (0–1) for one progress slot.
 * Prefers `best_subconstruct_scores_by_level`; else maps construct rows via `subconstruct`.
 */
export function subStrandFractionsFromProgress(p: Progress | undefined): Record<string, number> {
  if (!p) return {};
  const levelKey = pickSectionalLevelKey(p);
  if (!levelKey) return {};

  const out: Record<string, number> = {};
  const subMap = p.best_subconstruct_scores_by_level?.[levelKey];
  if (subMap && typeof subMap === 'object') {
    for (const [name, row] of Object.entries(subMap)) {
      if (!row || typeof row !== 'object') continue;
      const frac =
        typeof row.score_fraction === 'number' && Number.isFinite(row.score_fraction)
          ? row.score_fraction
          : typeof row.percentile === 'number' && Number.isFinite(row.percentile)
            ? row.percentile / 100
            : null;
      if (frac == null) continue;
      const label = name.trim();
      if (!label) continue;
      out[label] = clamp01(frac);
    }
    if (Object.keys(out).length > 0) return out;
  }

  const constructs = p.best_construct_scores_by_level?.[levelKey];
  if (!constructs || typeof constructs !== 'object') return {};
  for (const row of Object.values(constructs)) {
    if (!row || typeof row !== 'object') continue;
    const name = typeof row.subconstruct === 'string' ? row.subconstruct.trim() : '';
    const rate = typeof row.rate === 'number' && Number.isFinite(row.rate) ? row.rate : null;
    if (!name || rate == null) continue;
    out[name] = clamp01(rate);
  }
  return out;
}

export interface SubstrandScoreDistributionRow {
  name: string;
  n: number;
  meanPoints: number | null;
  bands: Record<ScoreBandId, number>;
}

export interface ExamScoreDistribution {
  examId: string;
  subcategories: SubstrandScoreDistributionRow[];
  hasAnyScores: boolean;
}

/** Per reasoning exam: student counts in /1000 score bands for each named sub-strand. */
export function summarizeScoreDistributionByExam(
  students: StudentRow[],
  examBlocks: ReadonlyArray<{ examId: string; subcategories: readonly string[] }>,
  maxPoints = 1000
): ExamScoreDistribution[] {
  return examBlocks.map(({ examId, subcategories }) => {
    const acc = new Map<string, { sum: number; n: number; bands: Record<ScoreBandId, number> }>();
    for (const name of subcategories) {
      acc.set(name, { sum: 0, n: 0, bands: emptyBandCounts() });
    }

    for (const s of students) {
      const fractions = subStrandFractionsFromProgress(s.assessment_progress?.[examId]);
      for (const name of subcategories) {
        const frac = fractions[name];
        if (typeof frac !== 'number') continue;
        const points = Math.round(frac * maxPoints);
        const row = acc.get(name)!;
        row.sum += points;
        row.n += 1;
        row.bands[scorePointsToBand(points)] += 1;
      }
    }

    const rows: SubstrandScoreDistributionRow[] = subcategories.map(name => {
      const a = acc.get(name)!;
      return {
        name,
        n: a.n,
        meanPoints: a.n > 0 ? Math.round(a.sum / a.n) : null,
        bands: a.bands,
      };
    });
    return {
      examId,
      subcategories: rows,
      hasAnyScores: rows.some(r => r.n > 0),
    };
  });
}
