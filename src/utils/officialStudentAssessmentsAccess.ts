import { STUDENT_OFFICIAL_ASSESSMENTS_ENABLED } from '../constants/constants';
import { canonicalAssessmentId } from './assessmentIdCompat';

/**
 * While official exams are globally paused, only these emails can start exams listed in
 * `OFFICIAL_BETA_STARTABLE_ASSESSMENT_IDS` (or any publicly live exam).
 * Browse UI (nav, cards, list/detail/reports) stays visible for everyone with a
 * "Official exams coming soon" lock on start CTAs for exams that are not live.
 * Keep in sync with backend `OFFICIAL_STUDENT_ASSESSMENT_BETA_EMAILS`.
 */
export const OFFICIAL_STUDENT_ASSESSMENT_BETA_EMAILS = new Set([
  'srishti2k1@gmail.com',
  'srishti+student@argus.ai',
  'michael+student@argus.ai',
  'masonfewel@gmail.com',
  'divyam.ew+1@gmail.com',
  'vv@accessmca.com',
]);

/**
 * These accounts skip the 3-month same-level cooldown in the student UI.
 * Keep in sync with backend `UNLIMITED_OFFICIAL_EXAM_RETAKE_EMAILS`.
 */
export const UNLIMITED_OFFICIAL_EXAM_RETAKE_EMAILS = new Set([
  'srishti2k1@gmail.com',
]);

/**
 * Official exams open for all students (membership / prerequisites still apply).
 * Empty = nothing live for the public.
 *
 * ONLY add assessment ids after explicit CAPS authorization from the product owner
 * (e.g. `MAKE ANALYTICAL_REASONING LIVE FOR EVERYONE`).
 * Keep in sync with backend `OFFICIAL_LIVE_ASSESSMENT_IDS`.
 */
export const OFFICIAL_LIVE_ASSESSMENT_IDS = new Set<string>([
  'analytical_reasoning',
]);

/**
 * Optional per-exam live tier allowlist. Missing key = every tier of that live exam is public.
 * Keep in sync with backend `OFFICIAL_LIVE_ASSESSMENT_TIERS`.
 */
export const OFFICIAL_LIVE_ASSESSMENT_TIERS: Record<string, ReadonlySet<number>> = {
  // Public launch: Analytical Level 1 only. L2+ stays locked even after L1 clear.
  analytical_reasoning: new Set([1]),
};

/**
 * School-scoped live exams. Does not make exams public.
 * Keep in sync with backend `OFFICIAL_SCHOOL_LIVE_ASSESSMENTS`.
 *
 * ONLY add after CAPS naming the school and exam
 * (e.g. `MAKE ANALYTICAL LVL 1 LIVE FOR KIDS IN ASPEE NUTAN ACADEMY`).
 */
export const ASPEE_NUTAN_ACADEMY_SCHOOL_ID = 't2EHIIPz3kYWu5HAaASX';

export const OFFICIAL_SCHOOL_LIVE_ASSESSMENTS: Record<
  string,
  Record<string, ReadonlySet<number>>
> = {
  [ASPEE_NUTAN_ACADEMY_SCHOOL_ID]: {
    analytical_reasoning: new Set([1]),
  },
};

/**
 * Exams beta testers may start before public live launch.
 * Same student feel otherwise (non-listed exams stay "coming soon").
 * Keep in sync with backend `OFFICIAL_BETA_STARTABLE_ASSESSMENT_IDS`.
 */
export const OFFICIAL_BETA_STARTABLE_ASSESSMENT_IDS = new Set<string>([
  'analytical_reasoning',
]);

/**
 * Per-exam email allowlists for early start (narrower than the full beta list).
 * Keep in sync with backend `OFFICIAL_RESTRICTED_STARTABLE_ASSESSMENT_EMAILS`.
 * Not a public launch.
 */
export const OFFICIAL_RESTRICTED_STARTABLE_ASSESSMENT_EMAILS: Record<
  string,
  ReadonlySet<string>
> = {
  verbal_reasoning: new Set([
    'srishti2k1@gmail.com',
    'divyam.ew+1@gmail.com',
    'vv@accessmca.com',
  ]),
};

/**
 * Optional per-exam tier allowlist for restricted starters.
 * Missing key = every tier of that restricted exam.
 * Keep in sync with backend `OFFICIAL_RESTRICTED_STARTABLE_ASSESSMENT_TIERS`.
 */
export const OFFICIAL_RESTRICTED_STARTABLE_ASSESSMENT_TIERS: Record<
  string,
  ReadonlySet<number>
> = {
  verbal_reasoning: new Set([1, 2]),
};

/**
 * Official Analytical Reasoning currently delivers only the new Level 1 bank.
 * Other AR levels must not start. Not a public-launch flag.
 */
export const OFFICIAL_ANALYTICAL_REASONING_STARTABLE_TIERS = new Set<number>([1]);

export function normalizeOfficialAssessmentEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function officialAssessmentSchoolIdFromStudent(student: unknown): string {
  if (!student || typeof student !== 'object') return '';
  const id = (student as { school_id?: unknown }).school_id;
  return typeof id === 'string' ? id.trim() : '';
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

export function isUnlimitedOfficialExamRetakeEmail(email: unknown): boolean {
  const normalized = normalizeOfficialAssessmentEmail(email);
  return Boolean(normalized) && UNLIMITED_OFFICIAL_EXAM_RETAKE_EMAILS.has(normalized);
}

/** True when at least one official exam is publicly live. */
export function hasPublicLiveOfficialAssessments(): boolean {
  return OFFICIAL_LIVE_ASSESSMENT_IDS.size > 0;
}

export function hasSchoolLiveOfficialAssessments(schoolId: unknown): boolean {
  const id = typeof schoolId === 'string' ? schoolId.trim() : '';
  const live = id ? OFFICIAL_SCHOOL_LIVE_ASSESSMENTS[id] : undefined;
  return Boolean(live && Object.keys(live).length > 0);
}

/**
 * True when the student may start/continue official exams in general
 * (global launch, school-scoped live, beta tester, or any exam publicly live).
 */
export function canAccessOfficialStudentAssessments(
  email: unknown,
  schoolId?: unknown
): boolean {
  if (STUDENT_OFFICIAL_ASSESSMENTS_ENABLED) return true;
  if (hasPublicLiveOfficialAssessments()) return true;
  if (hasSchoolLiveOfficialAssessments(schoolId)) return true;
  return isOfficialAssessmentBetaTester(email);
}

function isPubliclyLiveAssessmentTier(assessmentId: string, tierNumber?: number): boolean {
  const id = canonicalAssessmentId(assessmentId);
  if (!OFFICIAL_LIVE_ASSESSMENT_IDS.has(id)) return false;
  const liveTiers = OFFICIAL_LIVE_ASSESSMENT_TIERS[id];
  if (!liveTiers) return true;
  // Exam-level browse checks omit tier: any live tier unlocks the card/nav.
  if (tierNumber == null) return true;
  return liveTiers.has(tierNumber);
}

function isSchoolLiveAssessmentTier(
  schoolId: unknown,
  assessmentId: string,
  tierNumber?: number
): boolean {
  const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
  if (!sid) return false;
  const byExam = OFFICIAL_SCHOOL_LIVE_ASSESSMENTS[sid];
  if (!byExam) return false;
  const id = canonicalAssessmentId(assessmentId);
  const liveTiers = byExam[id];
  if (!liveTiers) return false;
  if (tierNumber == null) return true;
  return liveTiers.has(tierNumber);
}

/**
 * True when this specific assessment (and optional tier) may be started by this user.
 * Public: only live ids/tiers (or all if global full launch).
 * School-scoped: listed school + exam + tier.
 * Beta: live ids + early-access allowlist (student-identical otherwise).
 */
export function canStartOfficialAssessment(
  assessmentId: string,
  email: unknown,
  tierNumber?: number,
  schoolId?: unknown
): boolean {
  if (!assessmentId) return false;
  const id = canonicalAssessmentId(assessmentId);
  if (
    id === 'analytical_reasoning' &&
    tierNumber != null &&
    !OFFICIAL_ANALYTICAL_REASONING_STARTABLE_TIERS.has(tierNumber)
  ) {
    return false;
  }
  if (isPubliclyLiveAssessmentTier(id, tierNumber)) return true;
  if (isSchoolLiveAssessmentTier(schoolId, id, tierNumber)) return true;
  // Full launch mode: global on + empty live list means every exam is open.
  if (STUDENT_OFFICIAL_ASSESSMENTS_ENABLED && OFFICIAL_LIVE_ASSESSMENT_IDS.size === 0) {
    return true;
  }
  if (
    isOfficialAssessmentBetaTester(email) &&
    OFFICIAL_BETA_STARTABLE_ASSESSMENT_IDS.has(id)
  ) {
    return true;
  }
  if (isRestrictedOfficialAssessmentStarter(id, email, tierNumber)) {
    return true;
  }
  return false;
}

/** True when Firestore ops pause blocks this account from starting a new sit. */
export function isOfficialExamNewStartBlocked(
  newStartsPaused: boolean,
  email: unknown
): boolean {
  if (!newStartsPaused) return false;
  return !isOfficialAssessmentBetaTester(email);
}

/**
 * Live gate + ops pause. Does not affect in-progress resume (backend only).
 * Pass `newStartsPaused` from {@link getOfficialExamOps} / `useOfficialExamOps`.
 */
export function canStartOfficialAssessmentNow(
  assessmentId: string,
  email: unknown,
  tierNumber: number | undefined,
  schoolId: unknown,
  newStartsPaused: boolean
): boolean {
  if (isOfficialExamNewStartBlocked(newStartsPaused, email)) return false;
  return canStartOfficialAssessment(assessmentId, email, tierNumber, schoolId);
}

/** True when this email may start a restricted early-access exam (e.g. Verbal QA). */
export function isRestrictedOfficialAssessmentStarter(
  assessmentId: string,
  email: unknown,
  tierNumber?: number
): boolean {
  const id = canonicalAssessmentId(assessmentId);
  const restricted = OFFICIAL_RESTRICTED_STARTABLE_ASSESSMENT_EMAILS[id];
  if (!restricted) return false;
  if (!restricted.has(normalizeOfficialAssessmentEmail(email))) return false;
  const allowedTiers = OFFICIAL_RESTRICTED_STARTABLE_ASSESSMENT_TIERS[id];
  if (!allowedTiers) return true;
  if (tierNumber == null) return true;
  return allowedTiers.has(tierNumber);
}
