/**
 * School self-registration plan amounts for UI.
 * Keep in sync with argus-backend/functions/src/utils/schoolRegistrationPlans.ts
 * and INSTITUTIONAL_PLAN_ASSESSMENT_GATE_MIN_LEVEL (backend) for assessment floors.
 */

export const REGISTER_PLAN_IDS = ['entry', 'standard', 'premium'] as const;
export type RegisterPlanId = (typeof REGISTER_PLAN_IDS)[number];

/** Production annual fee (INR), excl. GST - same as REGISTER_PLAN_META.price_inr on the API */
const PRODUCTION_INR: Record<RegisterPlanId, number> = {
  entry: 200_000,
  standard: 300_000,
  premium: 500_000,
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export type SchoolPlanDisplay = {
  id: RegisterPlanId;
  name: string;
  price: string;
  /** INR for display parity with API; not paise */
  priceNum: number;
  period: string;
  tagline: string;
  features: string[];
  popular: boolean;
};

const PLAN_COPY: Pick<SchoolPlanDisplay, 'id' | 'name' | 'tagline' | 'features' | 'popular'>[] = [
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
    popular: false,
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
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Standard plus Exams 4–5 (English & AI) and consulting',
    features: [
      'Everything in Standard',
      'Assessments 4–5 (English proficiency & AI proficiency)',

      'Cohort analysis & cluster insights',
      'Consulting-style action plans',
      'Dedicated account manager',
      'Marketing toolkit (tier badges, parent comms)',
    ],
    popular: false,
  },
];

function buildPlans(): SchoolPlanDisplay[] {
  return PLAN_COPY.map((row) => {
    const n = PRODUCTION_INR[row.id];
    return {
      ...row,
      price: formatInr(n),
      priceNum: n,
      period: '/yr',
    };
  });
}

/** Plan cards for the school registration flow (list prices match API order amounts). */
export const SCHOOL_REGISTRATION_PLANS: SchoolPlanDisplay[] = buildPlans();

/** Single line for order summary / headers: price + period without duplicating "/yr" */
export function schoolPlanAnnualLabel(plan: SchoolPlanDisplay): string {
  return `${plan.price}${plan.period}`;
}

/** Institutional landing page - production annual fees only */
export const SCHOOL_INSTITUTIONAL_PRICE_LANDING: Record<RegisterPlanId, string> = {
  entry: `${formatInr(PRODUCTION_INR.entry)}/yr`,
  standard: `${formatInr(PRODUCTION_INR.standard)}/yr`,
  premium: `${formatInr(PRODUCTION_INR.premium)}/yr`,
};

/** Student roster guidance per tier (marketing; align with school FAQ). */
export const INSTITUTIONAL_PLAN_STUDENT_LIMIT: Record<RegisterPlanId, string> = {
  entry: 'Up to ~200 students',
  standard: 'Up to ~500 students',
  premium: 'No student cap (per campus)',
};

/** Production annual fee as card headline only (no "/yr") - same INR as {@link PRODUCTION_INR}. */
export function institutionalAnnualPriceRupeesOnly(planId: RegisterPlanId): string {
  return formatInr(PRODUCTION_INR[planId]);
}

export type InstitutionalPlanMatrixRow = {
  id: RegisterPlanId;
  name: string;
  tagline: string;
  /** Feature bullets - same source as school registration / admin plan cards */
  features: readonly string[];
  annualPriceRupeeDisplay: string;
  rosterGuidance: string;
  popular: boolean;
};

/**
 * Single source for institutional pricing cards, FAQ, and admin "Available plans".
 * Prices use production list amounts.
 */
export const SCHOOL_INSTITUTIONAL_PLAN_MATRIX: readonly InstitutionalPlanMatrixRow[] =
  REGISTER_PLAN_IDS.map((id) => {
    const row = PLAN_COPY.find((p) => p.id === id)!;
    return {
      id,
      name: row.name,
      tagline: row.tagline,
      features: row.features as readonly string[],
      annualPriceRupeeDisplay: institutionalAnnualPriceRupeesOnly(id),
      rosterGuidance: INSTITUTIONAL_PLAN_STUDENT_LIMIT[id],
      popular: row.popular,
    };
  });

/** Short paragraphs on the For Schools "Plans & pricing" strip - aligned with {@link PLAN_COPY}. */
export const INSTITUTIONAL_LANDING_PLAN_CARD_BLURBS: Record<RegisterPlanId, string> = {
  entry:
    'Core benchmarking with Assessment 1, headline reports, tier distribution, and path to the next tier.',
  standard:
    'Full reasoning triad (Assessments 1–3), deep analytics, benchmarks, quarterly growth, and prioritized recommendations.',
  premium:
    'Everything in Standard plus Assessments 4–5 (English & AI), flexible cohorts, cluster insights, consulting-style plans, a dedicated contact, and marketing toolkit.',
};
