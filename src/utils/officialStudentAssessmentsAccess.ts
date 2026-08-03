import { STUDENT_OFFICIAL_ASSESSMENTS_ENABLED } from '../constants/constants';

/**
 * While official exams are globally paused, only these emails can start/mutate any exam.
 * Browse UI (nav, cards, list/detail/reports) stays visible for everyone with a
 * "Official exams coming soon" lock on start CTAs for exams that are not live.
 * Keep in sync with backend `OFFICIAL_STUDENT_ASSESSMENT_BETA_EMAILS`.
 */
export const OFFICIAL_STUDENT_ASSESSMENT_BETA_EMAILS = new Set([
  'srishti2k1@gmail.com',
]);

/**
 * Official exams open for all students (membership / prerequisites still apply).
 * Empty = nothing live for the public. Beta emails bypass this and can start any exam.
 *
 * ONLY add assessment ids after explicit CAPS authorization from the product owner
 * (e.g. `MAKE SYMBOLIC_REASONING LIVE FOR EVERYONE`).
 * Keep in sync with backend `OFFICIAL_LIVE_ASSESSMENT_IDS`.
 */
export const OFFICIAL_LIVE_ASSESSMENT_IDS = new Set<string>([
  // Intentionally empty until CAPS-authorized public launch per exam.
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

/**
 * True when this specific assessment may be started by this user.
 * Beta testers can start any exam; everyone else only live (or all if global full launch).
 */
export function canStartOfficialAssessment(assessmentId: string, email: unknown): boolean {
  if (!assessmentId) return false;
  if (isOfficialAssessmentBetaTester(email)) return true;
  if (OFFICIAL_LIVE_ASSESSMENT_IDS.has(assessmentId)) return true;
  // Full launch mode: global on + empty live list means every exam is open.
  if (STUDENT_OFFICIAL_ASSESSMENTS_ENABLED && OFFICIAL_LIVE_ASSESSMENT_IDS.size === 0) {
    return true;
  }
  return false;
}
