import { isHiddenStaffStudentEmail } from '../../constants/hiddenStaffStudents';

/** Greenfield seed cohort emails (hidden from the platform admin student list). */
export function isGreenfieldSeedStudentEmail(email: string | null | undefined): boolean {
  const cleaned = (email ?? '').trim().toLowerCase();
  if (!cleaned.endsWith('@seed.argus.test')) return false;
  const local = cleaned.slice(0, cleaned.indexOf('@'));
  return local.startsWith('greenfield_seed_');
}

/** Student is an internal / demo / staff-shadow account excluded from platform admin totals. */
export function isPlatformAdminTestStudent(student: {
  is_test?: boolean | null;
  email?: string | null;
}): boolean {
  if (student.is_test === true) return true;
  const email = (student.email ?? '').trim().toLowerCase();
  if (isHiddenStaffStudentEmail(email)) return true;
  return email.endsWith('@seed.argus.test');
}

/** Hidden from platform admin student list entirely (not just uncounted). */
export function isHiddenFromPlatformAdminStudentList(student: {
  email?: string | null;
}): boolean {
  const email = (student.email ?? '').trim().toLowerCase();
  return isGreenfieldSeedStudentEmail(email) || isHiddenStaffStudentEmail(email);
}
