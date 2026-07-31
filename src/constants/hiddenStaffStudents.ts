/**
 * Argus staff aliases that may be added as students for support/QA.
 * Hidden from school-facing rosters / invite lists; not counted in school totals.
 * Unlike every other student email (strict one school), this address alone may sit on
 * multiple schools' invite lists and pick a login school.
 * Keep in sync with backend `HIDDEN_STAFF_STUDENT_EMAILS`.
 */
export const HIDDEN_STAFF_STUDENT_EMAILS = new Set([
  'srishti+student@argus.ai',
]);

export function isHiddenStaffStudentEmail(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const email = raw.toLowerCase().trim();
  return Boolean(email) && HIDDEN_STAFF_STUDENT_EMAILS.has(email);
}
