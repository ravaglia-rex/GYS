/**
 * Schools that may skip WhatsApp phone on student self-signup.
 * Roster-matched emails only (school_id known from resolveRegistrationSchool).
 *
 * Prefer the Firestore-backed `registration_config.phone_optional` flag from
 * resolveRegistrationSchool / platform admin. This hardcoded set remains a
 * fallback for Elpro/JBCN until those school docs are toggled in admin.
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

/** API flag wins when true; otherwise fall back to the hardcoded school-ID set. */
export function resolvePhoneOptional(
  schoolId: string | null | undefined,
  apiFlag: boolean | undefined
): boolean {
  return apiFlag === true || isStudentSignupPhoneOptional(schoolId);
}
