/**
 * Schools / emails blocked from signing in / using the student app.
 * Keep in sync with backend `studentLoginSchoolBlocks.ts`.
 */

/** Sir Padampat Singhania Education Centre Kanpur */
export const PADAMPAT_SINGHANIA_SCHOOL_ID = 'zgreySFOG71i6tp1qeqT';

export const STUDENT_LOGIN_BLOCKED_SCHOOL_IDS = new Set<string>([
  PADAMPAT_SINGHANIA_SCHOOL_ID,
]);

/** Extra emails blocked for QA / demo of the school lockdown message. */
export const STUDENT_LOGIN_BLOCKED_EMAILS = new Set<string>([]);

export const STUDENT_LOGIN_BLOCKED_CODE = 'school_access_suspended';

export const STUDENT_LOGIN_BLOCKED_TITLE = 'Access suspended';

export const STUDENT_LOGIN_BLOCKED_BODY =
  "Your school’s GYS accounts have been suspended due to anomalous exam activity. Access will not be restored until the investigation is complete. Contact your school administration.";

export function schoolIdFromStudentRecord(
  data: Record<string, unknown> | null | undefined
): string | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data.school_id;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

export function emailFromStudentRecord(
  data: Record<string, unknown> | null | undefined
): string | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data.email;
  if (typeof raw === 'string' && raw.trim()) return raw.trim().toLowerCase();
  return null;
}

export function isStudentLoginBlockedSchool(
  schoolId: string | null | undefined
): boolean {
  if (!schoolId || typeof schoolId !== 'string') return false;
  const id = schoolId.trim();
  if (!id) return false;
  return STUDENT_LOGIN_BLOCKED_SCHOOL_IDS.has(id);
}

export function isStudentLoginBlockedEmail(
  email: string | null | undefined
): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return STUDENT_LOGIN_BLOCKED_EMAILS.has(normalized);
}

export function isStudentLoginBlockedStudent(
  data: Record<string, unknown> | null | undefined
): boolean {
  return (
    isStudentLoginBlockedSchool(schoolIdFromStudentRecord(data)) ||
    isStudentLoginBlockedEmail(emailFromStudentRecord(data))
  );
}
