/**
 * Schools that may skip WhatsApp phone on student self-signup.
 * Roster-matched emails only (school_id known from resolveRegistrationSchool).
 */
export const ELPRO_INTERNATIONAL_SCHOOL_PUNE_ID = '3QRvtuBD1LWAhHXcANIC';
export const JBCN_INTERNATIONAL_SCHOOL_PAREL_ID = 'gEKVASG70jARtjaALBht';

const STUDENT_SIGNUP_PHONE_OPTIONAL_SCHOOL_IDS = new Set<string>([
  ELPRO_INTERNATIONAL_SCHOOL_PUNE_ID,
  JBCN_INTERNATIONAL_SCHOOL_PAREL_ID,
]);

export function isStudentSignupPhoneOptional(schoolId: string | null | undefined): boolean {
  const id = typeof schoolId === 'string' ? schoolId.trim() : '';
  return Boolean(id) && STUDENT_SIGNUP_PHONE_OPTIONAL_SCHOOL_IDS.has(id);
}
