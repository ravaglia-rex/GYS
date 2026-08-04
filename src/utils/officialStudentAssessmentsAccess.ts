import { STUDENT_OFFICIAL_ASSESSMENTS_ENABLED } from '../constants/constants';

/**
 * While official exams are globally paused, only these emails can start exams listed in
 * `OFFICIAL_BETA_STARTABLE_ASSESSMENT_IDS` (or any publicly live exam).
 * Browse UI (nav, cards, list/detail/reports) stays visible for everyone with a
 * "Official exams coming soon" lock on start CTAs for exams that are not live.
 * Keep in sync with backend `OFFICIAL_STUDENT_ASSESSMENT_BETA_EMAILS`.
 */
export const OFFICIAL_STUDENT_ASSESSMENT_BETA_EMAILS = new Set([
  'srishti2k1@gmail.com',
  'michael+student@argus.ai',
]);

/**
 * Official exams open for all students (membership / prerequisites still apply).
 * Empty = nothing live for the public.
 *
 * ONLY add assessment ids after explicit CAPS authorization from the product owner
 * (e.g. `MAKE SYMBOLIC_REASONING LIVE FOR EVERYONE`).
 * Keep in sync with backend `OFFICIAL_LIVE_ASSESSMENT_IDS`.
 */
export const OFFICIAL_LIVE_ASSESSMENT_IDS = new Set<string>([
]);

/**
 * Optional per-exam live tier allowlist. Missing key = every tier of that live exam is public.
 * Keep in sync with backend `OFFICIAL_LIVE_ASSESSMENT_TIERS`.
 */
export const OFFICIAL_LIVE_ASSESSMENT_TIERS: Record<string, ReadonlySet<number>> = {
};

/**
 * Exams beta testers may start before public live launch.
 * Same student feel otherwise (non-listed exams stay "coming soon").
 * Keep in sync with backend `OFFICIAL_BETA_STARTABLE_ASSESSMENT_IDS`.
 */
export const OFFICIAL_BETA_STARTABLE_ASSESSMENT_IDS = new Set<string>([
  'symbolic_reasoning',
]);

export function normalizeOfficialAssessmentEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

/**
 * Prefer the live Firebase session email over persisted Redux auth.
 * Stale Redux `user.email` (e.g. a prior school-admin login) must not win.
 */
export function resolveOfficialAssessmentViewerEmail(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const normalized = normalizeOfficialAssessmentEmail(candidate);
    if (normalized) return normalized;
  }
  return '';
}

export function isOfficialAssessmentBetaTester(email: unknown): boolean {
  const normalized = normalizeOfficialAssessmentEmail(email);
  return Boolean(normalized) && OFFICIAL_STUDENT_ASSESSMENT_BETA_EMAILS.has(normalized);
}

/** True when at least one official exam is publicly live. */
export function hasPublicLiveOfficialAssessments(): boolean {
  return OFFICIAL_LIVE_ASSESSMENT_IDS.size > 0;
}

/**
 * True when the student may start/continue official exams in general
 * (global launch, beta tester, or any exam publicly live).
 */
export function canAccessOfficialStudentAssessments(email: unknown): boolean {
  if (STUDENT_OFFICIAL_ASSESSMENTS_ENABLED) return true;
  if (hasPublicLiveOfficialAssessments()) return true;
  return isOfficialAssessmentBetaTester(email);
}

function isPubliclyLiveAssessmentTier(assessmentId: string, tierNumber?: number): boolean {
  if (!OFFICIAL_LIVE_ASSESSMENT_IDS.has(assessmentId)) return false;
  const liveTiers = OFFICIAL_LIVE_ASSESSMENT_TIERS[assessmentId];
  if (!liveTiers) return true;
  // Exam-level browse checks omit tier: any live tier unlocks the card/nav.
  if (tierNumber == null) return true;
  return liveTiers.has(tierNumber);
}

/**
 * True when this specific assessment (and optional tier) may be started by this user.
 * Public: only live ids/tiers (or all if global full launch).
 * Beta: live ids + early-access allowlist (student-identical otherwise).
 */
export function canStartOfficialAssessment(
  assessmentId: string,
  email: unknown,
  tierNumber?: number
): boolean {
  if (!assessmentId) return false;
  if (isPubliclyLiveAssessmentTier(assessmentId, tierNumber)) return true;
  // Full launch mode: global on + empty live list means every exam is open.
  if (STUDENT_OFFICIAL_ASSESSMENTS_ENABLED && OFFICIAL_LIVE_ASSESSMENT_IDS.size === 0) {
    return true;
  }
  if (
    isOfficialAssessmentBetaTester(email) &&
    OFFICIAL_BETA_STARTABLE_ASSESSMENT_IDS.has(assessmentId)
  ) {
    return true;
  }
  return false;
}
