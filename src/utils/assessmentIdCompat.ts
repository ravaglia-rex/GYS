/**
 * Canonical assessment id for Exam 1 is `analytical_reasoning`.
 * Legacy Firestore / URL id is only assembled here for redirects and dual-read.
 */

export const ANALYTICAL_REASONING_ASSESSMENT_ID = 'analytical_reasoning';

/** Legacy id still present in bookmarks and historical payloads. */
export const LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID = ['symb', 'olic_reasoning'].join('');

const LEGACY_TO_CANONICAL: Record<string, string> = {
  [LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID]: ANALYTICAL_REASONING_ASSESSMENT_ID,
};

export function canonicalAssessmentId(assessmentId: string): string {
  return LEGACY_TO_CANONICAL[assessmentId] ?? assessmentId;
}

export function assessmentIdsEqual(a: string, b: string): boolean {
  return canonicalAssessmentId(a) === canonicalAssessmentId(b);
}

/** Progress map dual-read for Exam 1 (legacy key vs canonical). */
export function readAssessmentProgress(
  progress: Record<string, unknown> | null | undefined,
  assessmentId: string
): Record<string, unknown> {
  if (!progress) return {};
  const canonical = canonicalAssessmentId(assessmentId);
  const modern = progress[canonical];
  if (canonical !== ANALYTICAL_REASONING_ASSESSMENT_ID) {
    return modern && typeof modern === 'object' ? (modern as Record<string, unknown>) : {};
  }
  const legacy = progress[LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID];
  const modernObj =
    modern && typeof modern === 'object' ? (modern as Record<string, unknown>) : null;
  const legacyObj =
    legacy && typeof legacy === 'object' ? (legacy as Record<string, unknown>) : null;
  if (!modernObj && !legacyObj) return {};
  if (!modernObj) return { ...legacyObj! };
  if (!legacyObj) return { ...modernObj };
  return { ...legacyObj, ...modernObj };
}

export function canonicalizeProgressMap(
  progress: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!progress) return {};
  const out: Record<string, unknown> = { ...progress };
  const legacy = out[LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID];
  if (legacy && typeof legacy === 'object') {
    const modern = out[ANALYTICAL_REASONING_ASSESSMENT_ID];
    const modernObj =
      modern && typeof modern === 'object' ? (modern as Record<string, unknown>) : {};
    out[ANALYTICAL_REASONING_ASSESSMENT_ID] = {
      ...(legacy as Record<string, unknown>),
      ...modernObj,
    };
    delete out[LEGACY_ANALYTICAL_REASONING_ASSESSMENT_ID];
  }
  return out;
}
