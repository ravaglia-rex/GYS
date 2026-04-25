import type { StudentRow } from '../db/schoolAdminCollection';
import { ASSESSMENT_ORDER, ASSESSMENT_NAMES } from './assessmentGating';

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

/** Per-assessment slot: which proficiency band (1, 2, or 3+) the student is in. */
export function slotProficiencyTierBand(p: Progress): 1 | 2 | 3 {
  if (normalizedStatus(p) === 'tier_advanced') return 3;
  const t = numericProficiencyTier(p.proficiency_tier);
  if (t <= 1) return 1;
  if (t === 2) return 2;
  return 3;
}

/**
 * Overall student band: weakest active assessment (min band).
 * 0 = no unlocked / attempted assessments yet.
 */
export function studentOverallProficiencyBand(student: StudentRow): 0 | 1 | 2 | 3 {
  const progress = student.assessment_progress ?? {};
  const entries = Object.values(progress).filter(isActiveAssessmentProgress);
  if (entries.length === 0) return 0;
  const bands = entries.map(slotProficiencyTierBand);
  return Math.min(...bands) as 1 | 2 | 3;
}

export interface Tier123Counts {
  tier1: number;
  tier2: number;
  tier3: number;
  total: number;
}

/**
 * Counts students by overall proficiency band: min band across active assessment slots (see `studentOverallProficiencyBand`).
 * UI labels: Level 1 = Bronze, Level 2 = Silver, Level 3+ = Gold (difficulty / proficiency ladder, not national performance tiers).
 */
export function summarizeSchoolTier123(students: StudentRow[]): Tier123Counts {
  const list = students;
  let tier1 = 0;
  let tier2 = 0;
  let tier3 = 0;
  for (const s of list) {
    const b = studentOverallProficiencyBand(s);
    if (b <= 1) tier1 += 1;
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
    if (b <= 1) row.tier1 += 1;
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
