/**
 * Mirrors argus-backend/functions/src/utils/studentSignupPlans.ts for UI copy only.
 * List prices below are base prices; applicable charges are applied when the backend creates the Razorpay order.
 * Charged totals always come from the server order response.
 * GYS Consumer Pricing Rev 13 (April 22, 2026).
 */

export const STUDENT_SIGNUP_BASE_INR: Record<1 | 2 | 3 | 4, number> = {
  1: 299,
  2: 899,
  3: 1799,
  4: 2699,
};

export function normalizeStudentMembershipLevel(value: unknown): 0 | 1 | 2 | 3 | 4 {
  const n = typeof value === 'number' ? value : Number(value);
  if (n === 1 || n === 2 || n === 3 || n === 4) {
    return n;
  }
  return 0;
}

/** Upgrade delta in paise (₹ × 100), list price only - same basis as `STUDENT_SIGNUP_BASE_INR`. */
export function studentMembershipUpgradeAmountPaise(
  currentLevel: unknown,
  targetLevel: 1 | 2 | 3 | 4
): number | null {
  const current = normalizeStudentMembershipLevel(currentLevel);
  if (current >= targetLevel) {
    return null;
  }
  const fromBase = current >= 1 ? STUDENT_SIGNUP_BASE_INR[current as 1 | 2 | 3 | 4] : 0;
  const deltaBase = STUDENT_SIGNUP_BASE_INR[targetLevel] - fromBase;
  if (deltaBase <= 0) {
    return null;
  }
  return Math.round(deltaBase * 100);
}

/**
 * Tax-inclusive upgrade charge in paise (matches backend `studentMembershipUpgradeAmountPaise`).
 * Prepaid credit is subtracted from this final amount at checkout.
 */
export function studentMembershipUpgradeChargePaise(
  currentLevel: unknown,
  targetLevel: 1 | 2 | 3 | 4,
  prepaidCreditPaise = 0
): number | null {
  const current = normalizeStudentMembershipLevel(currentLevel);
  if (current >= targetLevel) {
    return null;
  }
  const fromBase = current >= 1 ? STUDENT_SIGNUP_BASE_INR[current as 1 | 2 | 3 | 4] : 0;
  const deltaBase = STUDENT_SIGNUP_BASE_INR[targetLevel] - fromBase;
  if (deltaBase <= 0) {
    return null;
  }
  const listTaxInclusive = Math.round(deltaBase * 1.18 * 100);
  const credit = Math.max(0, Math.round(Number(prepaidCreditPaise) || 0));
  return Math.max(0, listTaxInclusive - credit);
}

export function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

/** User-facing package names (API still uses numeric levels 1–4). */
export const MEMBERSHIP_LEVEL_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: 'Trial - Discovery',
  2: 'Reasoning Triad',
  3: 'Stream Ready',
  4: 'Career Ready',
};

export type StudentMembershipLevelCode = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';

const MEMBERSHIP_LEVEL_CODE: Record<1 | 2 | 3 | 4, StudentMembershipLevelCode> = {
  1: 'LEVEL_1',
  2: 'LEVEL_2',
  3: 'LEVEL_3',
  4: 'LEVEL_4',
};

/** Short package names used in student signup flow review / draft state. */
export const MEMBERSHIP_LEVEL_SHORT_NAME: Record<1 | 2 | 3 | 4, string> = {
  1: 'Discovery',
  2: 'Reasoning Triad',
  3: 'Stream Ready',
  4: 'Career Ready',
};

const MEMBERSHIP_LEVEL_PRICE_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: '₹299',
  2: '₹899',
  3: '₹1,799',
  4: '₹2,699',
};

/** Signup draft fields for a covered package (school or complimentary invite - no student package picker). */
export function schoolIncludedMembershipDraftFields(
  level: 1 | 2 | 3 | 4,
  options?: { source?: 'school' | 'complimentary' }
) {
  const source = options?.source ?? 'school';
  return {
    membershipLevel: MEMBERSHIP_LEVEL_CODE[level],
    membershipName: MEMBERSHIP_LEVEL_SHORT_NAME[level],
    membershipPrice: MEMBERSHIP_LEVEL_PRICE_LABEL[level],
    schoolCoveredMembershipLevel: source === 'school' ? level : 0,
    complimentaryCoveredMembershipLevel: source === 'complimentary' ? level : 0,
    membershipCoveredBySchool: source === 'school',
    membershipCoveredByComplimentary: source === 'complimentary',
    membershipUpgradeAmountPaise: null,
  };
}

/** Draft fields when both school and complimentary coverage may apply (uses max as effective covered). */
export function coveredMembershipDraftFields(params: {
  schoolCoveredLevel: 0 | 1 | 2 | 3 | 4;
  complimentaryCoveredLevel: 0 | 1 | 2 | 3 | 4;
}) {
  const schoolLevel = params.schoolCoveredLevel;
  const complimentaryLevel = params.complimentaryCoveredLevel;
  const effective = Math.max(schoolLevel, complimentaryLevel) as 0 | 1 | 2 | 3 | 4;
  if (effective < 1) {
    return {
      schoolCoveredMembershipLevel: schoolLevel,
      complimentaryCoveredMembershipLevel: complimentaryLevel,
      membershipCoveredBySchool: false,
      membershipCoveredByComplimentary: false,
      membershipUpgradeAmountPaise: null as number | null,
    };
  }
  const level = effective as 1 | 2 | 3 | 4;
  const schoolWins = schoolLevel >= complimentaryLevel && schoolLevel >= 1;
  return {
    membershipLevel: MEMBERSHIP_LEVEL_CODE[level],
    membershipName: MEMBERSHIP_LEVEL_SHORT_NAME[level],
    membershipPrice: MEMBERSHIP_LEVEL_PRICE_LABEL[level],
    schoolCoveredMembershipLevel: schoolLevel,
    complimentaryCoveredMembershipLevel: complimentaryLevel,
    membershipCoveredBySchool: schoolWins,
    membershipCoveredByComplimentary: !schoolWins && complimentaryLevel >= 1,
    membershipUpgradeAmountPaise: null as number | null,
  };
}
