/**
 * Mirrors backend `gamification/profileCompletion.ts`.
 * Counts post-signup profile fields. Signup-required fields are excluded.
 * Section is optional at signup but required here for 100%.
 */

import {isValidIndiaMobile} from './indiaMobile';
import {GAMIFICATION_CONFIG_PROFILE_COMPLETION_COINS} from './gamification';

export const PROFILE_COMPLETION_FIELD_KEYS = [
  'date_of_birth',
  'city_state',
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

export function isProfileCompletionFieldFilled(
  key: ProfileCompletionFieldKey,
  student: Record<string, unknown> | null | undefined
): boolean {
  if (!student) return false;
  const value = student[key];
  if (key === 'parent_email') return isFilledEmail(value);
  if (key === 'parent_phone') return isValidIndiaMobile(String(value ?? ''));
  return isNonEmptyString(value);
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
  dateOfBirth?: string;
  cityState?: string;
  section?: string;
  homeLanguage?: string;
  aspiration?: string;
  heardFrom?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  about?: string;
}): ProfileCompletionSnapshot {
  return computeProfileCompletion({
    date_of_birth: form.dateOfBirth ?? '',
    city_state: form.cityState ?? '',
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
