import { isHiddenStaffStudentEmail } from '../../constants/hiddenStaffStudents';

/**
 * The only student treated as a test account. Keep in sync with backend
 * `PLATFORM_ADMIN_TEST_STUDENT_EMAILS`.
 */
export const PLATFORM_ADMIN_TEST_STUDENT_EMAILS = new Set([
  'srishti2k1@gmail.com',
]);

/** Greenfield seed cohort emails (hidden from the platform admin student list). */
export function isGreenfieldSeedStudentEmail(email: string | null | undefined): boolean {
  const cleaned = (email ?? '').trim().toLowerCase();
  if (!cleaned.endsWith('@seed.argus.test')) return false;
  const local = cleaned.slice(0, cleaned.indexOf('@'));
  return local.startsWith('greenfield_seed_');
}

/** True only for the single test student email. */
export function isPlatformAdminTestStudent(student: {
  email?: string | null;
}): boolean {
  const email = (student.email ?? '').trim().toLowerCase();
  return PLATFORM_ADMIN_TEST_STUDENT_EMAILS.has(email);
}

/** Hidden from platform admin student list entirely (not just uncounted). */
export function isHiddenFromPlatformAdminStudentList(student: {
  email?: string | null;
}): boolean {
  const email = (student.email ?? '').trim().toLowerCase();
  return isGreenfieldSeedStudentEmail(email) || isHiddenStaffStudentEmail(email);
}
