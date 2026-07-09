/** Student is an internal / demo account excluded from platform admin totals. */
export function isPlatformAdminTestStudent(student: {
  is_test?: boolean | null;
  email?: string | null;
}): boolean {
  if (student.is_test === true) return true;
  const email = (student.email ?? '').trim().toLowerCase();
  return email.endsWith('@seed.argus.test');
}
