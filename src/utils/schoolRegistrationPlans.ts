/**
 * School self-registration plan amounts for UI.
 * Keep in sync with argus-backend/functions/src/utils/schoolRegistrationPlans.ts
 */

export const REGISTER_PLAN_IDS = ['entry', 'standard', 'premium'] as const;
export type RegisterPlanId = (typeof REGISTER_PLAN_IDS)[number];

/** Production annual fee (INR), excl. GST — same as REGISTER_PLAN_META.price_inr on the API */
const PRODUCTION_INR: Record<RegisterPlanId, number> = {
  entry: 200_000,
  standard: 300_000,
  premium: 500_000,
};

/** When API SCHOOL_RAZORPAY_TEST_AMOUNTS=true and SCHOOL_RAZORPAY_MICRO_TEST=false (10000/20000/30000 paise) */
const TEST_NORMAL_INR: Record<RegisterPlanId, number> = {
  entry: 100,
  standard: 200,
  premium: 300,
};

/** When API SCHOOL_RAZORPAY_TEST_AMOUNTS=true and SCHOOL_RAZORPAY_MICRO_TEST=true (100/200/300 paise) */
const TEST_MICRO_INR: Record<RegisterPlanId, number> = {
  entry: 1,
  standard: 2,
  premium: 3,
};

function parseEnvBool(v: string | undefined): boolean {
  return ['true', '1', 'yes'].includes((v ?? '').trim().toLowerCase());
}

/** Pair with API SCHOOL_RAZORPAY_TEST_AMOUNTS */
export function readSchoolRazorpayTestAmountsEnv(): boolean {
  return parseEnvBool(process.env.REACT_APP_SCHOOL_RAZORPAY_TEST_AMOUNTS);
}

/** Pair with API SCHOOL_RAZORPAY_MICRO_TEST (only affects amounts when test flag is on) */
export function readSchoolRazorpayMicroTestEnv(): boolean {
  return parseEnvBool(process.env.REACT_APP_SCHOOL_RAZORPAY_MICRO_TEST);
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export type SchoolPlanDisplay = {
  id: RegisterPlanId;
  name: string;
  price: string;
  /** INR (or rupee test charge) for display parity with API; not paise */
  priceNum: number;
  /** e.g. "/yr", or "" for micro-test where "₹1/yr" would be misleading */
  period: string;
  tagline: string;
  features: string[];
  recommended: boolean;
};

const PLAN_COPY: Pick<SchoolPlanDisplay, 'id' | 'name' | 'tagline' | 'features' | 'recommended'>[] = [
  {
    id: 'entry',
    name: 'Entry',
    tagline: 'Core benchmarking for one assessment',
    features: [
      'Assessment 1 (Pattern and Logic)',
      'Headline performance report',
      'Tier distribution analysis',
      'Path to next tier',
    ],
    recommended: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Full reasoning triad & deep analytics',
    features: [
      'Assessments 1–3 (full reasoning triad)',
      'Full analytics & subscore breakdowns',
      'Grade-level analysis',
      'Comparative benchmarks (national, regional)',
      'Quarterly growth tracking',
      'Prioritised recommendations',
    ],
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Everything in Standard, plus consulting',
    features: [
      'Everything in Standard',
      'All grades & custom cohorts',
      'Cohort analysis & cluster insights',
      'Consulting-style action plans',
      'Dedicated account manager',
      'Marketing toolkit (tier badges, parent comms)',
    ],
    recommended: false,
  },
];

const SCHOOL_PAY_TEST = readSchoolRazorpayTestAmountsEnv();
const SCHOOL_PAY_MICRO = SCHOOL_PAY_TEST && readSchoolRazorpayMicroTestEnv();

function inrForPlan(id: RegisterPlanId): number {
  if (!SCHOOL_PAY_TEST) return PRODUCTION_INR[id];
  return SCHOOL_PAY_MICRO ? TEST_MICRO_INR[id] : TEST_NORMAL_INR[id];
}

function buildPlans(): SchoolPlanDisplay[] {
  const period = !SCHOOL_PAY_TEST ? '/yr' : SCHOOL_PAY_MICRO ? '' : '/yr';
  return PLAN_COPY.map((row) => {
    const n = inrForPlan(row.id);
    return {
      ...row,
      price: formatInr(n),
      priceNum: n,
      period,
    };
  });
}

/** Resolved once at load from REACT_APP_* (same pattern as other CRA env). */
export const SCHOOL_REGISTRATION_PLANS: SchoolPlanDisplay[] = buildPlans();

export { SCHOOL_PAY_TEST, SCHOOL_PAY_MICRO };

/** Single line for order summary / headers: price + period without duplicating "/yr" */
export function schoolPlanAnnualLabel(plan: SchoolPlanDisplay): string {
  return `${plan.price}${plan.period}`;
}

/**
 * Text after the rupee figure in confirmation copy, e.g. "₹2,00,000/yr" vs "₹100 sandbox test amount".
 */
export function schoolPlanPriceQualifierAfterAmount(): string {
  if (!SCHOOL_PAY_TEST) return '/yr';
  if (SCHOOL_PAY_MICRO) return ' micro test checkout amount';
  return ' sandbox test amount';
}

/** Sandbox banner: amounts shown when SCHOOL_PAY_TEST is true (matches API test / micro tables). */
export function schoolSandboxPlanAmountsSummary(): string {
  if (SCHOOL_PAY_MICRO) return 'Entry ₹1, Standard ₹2, Premium ₹3';
  return 'Entry ₹100, Standard ₹200, Premium ₹300';
}

/** Institutional landing page — production annual fees only */
export const SCHOOL_INSTITUTIONAL_PRICE_LANDING: Record<RegisterPlanId, string> = {
  entry: `${formatInr(PRODUCTION_INR.entry)}/yr`,
  standard: `${formatInr(PRODUCTION_INR.standard)}/yr`,
  premium: `${formatInr(PRODUCTION_INR.premium)}/yr`,
};
