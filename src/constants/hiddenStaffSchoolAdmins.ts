/**
 * Argus staff aliases that may be added as school admins for support/QA.
 * Hidden from school Settings contact lists and contact/POC stats; still valid for
 * school-admin login and receive the same school emails as real admins.
 * Keep in sync with backend `HIDDEN_STAFF_SCHOOL_ADMIN_EMAILS`.
 */
export const HIDDEN_STAFF_SCHOOL_ADMIN_EMAILS = new Set([
  'srishti+school@argus.ai',
]);

export function isHiddenStaffSchoolAdminEmail(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const email = raw.toLowerCase().trim();
  return Boolean(email) && HIDDEN_STAFF_SCHOOL_ADMIN_EMAILS.has(email);
}

export function filterHiddenStaffSchoolAdminEmails(emails: string[]): string[] {
  return emails.filter((email) => !isHiddenStaffSchoolAdminEmail(email));
}
