/**
 * Mirrors backend `gamification/profileCompletion.ts`.
 * Counts all profile fields shown on Personal Information (except Argus Coins).
 */

import {isValidIndiaMobile} from './indiaMobile';
import {GAMIFICATION_CONFIG_PROFILE_COMPLETION_COINS} from './gamification';

export const PROFILE_COMPLETION_FIELD_KEYS = [
  'first_name',
  'email',
  'phone_number',
  'date_of_birth',
  'city_state',
  'school_id',
  'grade',
  'section',
  'home_language',
  'aspiration',
  'heard_from',
  'parent_name',
  'parent_email',
  'parent_phone',
  'about_me',
] as const;

export type ProfileCompletionFieldKey = (typeof PROFILE_COMPLETION_FIELD_KEYS)[number];

export type ProfileCompletionSnapshot = {
  percent: number;
  filled: number;
  total: number;
  complete: boolean;
  reward_coins: number;
};

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFilledEmail(value: unknown): boolean {
  if (!isNonEmptyString(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value as string).trim());
}

function isFilledGrade(value: unknown): boolean {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 6 && value <= 12;
  }
  if (typeof value === 'string') {
    const n = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n >= 6 && n <= 12;
  }
  return false;
}

function isFilledSchool(student: Record<string, unknown>): boolean {
  const schoolId = student.school_id;
  if (isNonEmptyString(schoolId) && (schoolId as string).trim() !== 'not-listed') {
    return true;
  }
  return isNonEmptyString(student.signup_school_name);
}

function isFilledFullName(student: Record<string, unknown>): boolean {
  const first = typeof student.first_name === 'string' ? student.first_name.trim() : '';
  const last = typeof student.last_name === 'string' ? student.last_name.trim() : '';
  return `${first} ${last}`.trim().length > 0;
}

export function isProfileCompletionFieldFilled(
  key: ProfileCompletionFieldKey,
  student: Record<string, unknown> | null | undefined
): boolean {
  if (!student) return false;
  if (key === 'first_name') return isFilledFullName(student);
  if (key === 'email') return isFilledEmail(student.email);
  if (key === 'phone_number') return isValidIndiaMobile(String(student.phone_number ?? ''));
  if (key === 'parent_email') return isFilledEmail(student.parent_email);
  if (key === 'parent_phone') return isValidIndiaMobile(String(student.parent_phone ?? ''));
  if (key === 'grade') return isFilledGrade(student.grade);
  if (key === 'school_id') return isFilledSchool(student);
  return isNonEmptyString(student[key]);
}

export function computeProfileCompletion(
  student: Record<string, unknown> | null | undefined
): ProfileCompletionSnapshot {
  const total = PROFILE_COMPLETION_FIELD_KEYS.length;
  let filled = 0;
  for (const key of PROFILE_COMPLETION_FIELD_KEYS) {
    if (isProfileCompletionFieldFilled(key, student)) filled += 1;
  }
  const percent = Math.round((100 * filled) / total);
  return {
    percent,
    filled,
    total,
    complete: filled >= total,
    reward_coins: GAMIFICATION_CONFIG_PROFILE_COMPLETION_COINS,
  };
}

/** Live form fields → same shape as student doc keys for % preview while editing. */
export function profileCompletionFromForm(form: {
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  cityState?: string;
  school?: string;
  signupSchoolName?: string;
  grade?: string | number;
  section?: string;
  homeLanguage?: string;
  aspiration?: string;
  heardFrom?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  about?: string;
}): ProfileCompletionSnapshot {
  const nameParts = (form.displayName ?? '').trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ');
  return computeProfileCompletion({
    first_name: firstName,
    last_name: lastName,
    email: form.email ?? '',
    phone_number: form.phoneNumber ?? '',
    date_of_birth: form.dateOfBirth ?? '',
    city_state: form.cityState ?? '',
    school_id: form.school ?? '',
    signup_school_name: form.signupSchoolName ?? '',
    grade: form.grade ?? '',
    section: form.section ?? '',
    home_language: form.homeLanguage ?? '',
    aspiration: form.aspiration ?? '',
    heard_from: form.heardFrom ?? '',
    parent_name: form.parentName ?? '',
    parent_email: form.parentEmail ?? '',
    parent_phone: form.parentPhone ?? '',
    about_me: form.about ?? '',
  });
}
