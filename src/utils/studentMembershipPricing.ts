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
