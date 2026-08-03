import { STUDENT_OFFICIAL_ASSESSMENTS_ENABLED } from '../constants/constants';

/**
 * While official exams are globally paused, only these emails can see/start them.
 * Keep in sync with backend `OFFICIAL_STUDENT_ASSESSMENT_BETA_EMAILS`.
 */
export const OFFICIAL_STUDENT_ASSESSMENT_BETA_EMAILS = new Set([
  'srishti2k1@gmail.com',
]);

export function canAccessOfficialStudentAssessments(email: unknown): boolean {
  if (STUDENT_OFFICIAL_ASSESSMENTS_ENABLED) return true;
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return Boolean(normalized) && OFFICIAL_STUDENT_ASSESSMENT_BETA_EMAILS.has(normalized);
}
