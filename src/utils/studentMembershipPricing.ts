/**
 * Mirrors argus-backend/functions/src/utils/studentSignupPlans.ts for UI copy only.
 * Charged amounts always come from the server order.
 */

export const STUDENT_SIGNUP_BASE_INR: Record<1 | 2 | 3, number> = {
  1: 499,
  2: 1299,
  3: 2499,
};

export function normalizeStudentMembershipLevel(value: unknown): 0 | 1 | 2 | 3 {
  const n = typeof value === 'number' ? value : Number(value);
  if (n === 1 || n === 2 || n === 3) {
    return n;
  }
  return 0;
}

export function studentMembershipUpgradeAmountPaise(
  currentLevel: unknown,
  targetLevel: 1 | 2 | 3
): number | null {
  const current = normalizeStudentMembershipLevel(currentLevel);
  if (current >= targetLevel) {
    return null;
  }
  const fromBase = current >= 1 ? STUDENT_SIGNUP_BASE_INR[current as 1 | 2 | 3] : 0;
  const deltaBase = STUDENT_SIGNUP_BASE_INR[targetLevel] - fromBase;
  if (deltaBase <= 0) {
    return null;
  }
  return Math.round(deltaBase * 1.18 * 100);
}

export function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export const MEMBERSHIP_LEVEL_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Level 1 - Explore',
  2: 'Level 2 - Engage',
  3: 'Level 3 - Excel',
};
