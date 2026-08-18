/**
 * Canonical assessment id for Exam 1 is `analytical_reasoning`.
 */

export const ANALYTICAL_REASONING_ASSESSMENT_ID = 'analytical_reasoning';

export function canonicalAssessmentId(assessmentId: string): string {
  return assessmentId;
}

export function assessmentIdsEqual(a: string, b: string): boolean {
  return canonicalAssessmentId(a) === canonicalAssessmentId(b);
}

export function readAssessmentProgress(
  progress: Record<string, unknown> | null | undefined,
  assessmentId: string
): Record<string, unknown> {
  if (!progress) return {};
  const canonical = canonicalAssessmentId(assessmentId);
  const modern = progress[canonical];
  return modern && typeof modern === 'object' ? (modern as Record<string, unknown>) : {};
}

export function canonicalizeProgressMap(
  progress: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!progress) return {};
  return { ...progress };
}

export function canonicalizeAssessmentList<T extends { id: string }>(assessments: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const a of assessments) {
    const id = canonicalAssessmentId(a.id);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id === a.id ? a : { ...a, id });
  }
  return out;
}
