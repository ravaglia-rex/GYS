/**
 * Mirrors backend tierProgression.ts - grade-band clearance for GYS assessments.
 */

export type GradeBandId = '6-8' | '9-10' | '11-12';

export interface TierProgressionBand {
  tier_1_min_pct: number;
  tier_2_min_pct: number;
  tier_3_min_pct: number;
  min_cleared_tiers_for_next_exam: number;
}

export interface TierProgressionConfig {
  bands: Record<GradeBandId, TierProgressionBand>;
}

export function gradeToBand(grade: number | null | undefined): GradeBandId {
  const g = typeof grade === 'number' && !Number.isNaN(grade) ? grade : 8;
  if (g >= 6 && g <= 8) return '6-8';
  if (g >= 9 && g <= 10) return '9-10';
  return '11-12';
}

export function getBandConfig(
  progression: TierProgressionConfig | undefined,
  grade: number | null | undefined
): TierProgressionBand | null {
  if (!progression?.bands) return null;
  const band = gradeToBand(grade);
  return progression.bands[band] ?? null;
}

export function countClearedTiersFromProgress(
  progress: {
    tiers_cleared?: Record<string, boolean>;
    proficiency_tier?: number;
  },
  maxTiers: number
): number {
  const tc = progress.tiers_cleared;
  if (tc && typeof tc === 'object') {
    let n = 0;
    for (let t = 1; t <= maxTiers; t++) {
      if (tc[String(t)] === true) n++;
    }
    return n;
  }
  const pt = progress.proficiency_tier ?? 1;
  if (pt > maxTiers) return maxTiers;
  return Math.max(0, pt - 1);
}

export function canAttemptTier(
  progress: { tiers_cleared?: Record<string, boolean>; proficiency_tier?: number },
  tierNumber: number,
  maxTiers: number
): boolean {
  if (tierNumber < 1 || tierNumber > maxTiers) return false;
  if (tierNumber === 1) return true;
  if (progress.tiers_cleared?.[String(tierNumber - 1)] === true) return true;
  const tc = progress.tiers_cleared;
  if (!tc || Object.keys(tc).length === 0) {
    const pt = progress.proficiency_tier ?? 1;
    return pt >= tierNumber;
  }
  return false;
}

export function graduationPrereqMetForAssessment(
  prereqProgress: { tiers_cleared?: Record<string, boolean>; proficiency_tier?: number } | undefined,
  maxTiers: number,
  progression: TierProgressionConfig | undefined,
  studentGrade: number | null | undefined
): boolean {
  if (!prereqProgress) return false;
  if (progression) {
    const band = getBandConfig(progression, studentGrade);
    const need = band?.min_cleared_tiers_for_next_exam ?? 1;
    return countClearedTiersFromProgress(prereqProgress, maxTiers) >= need;
  }
  return (prereqProgress.proficiency_tier ?? 0) >= 2;
}
