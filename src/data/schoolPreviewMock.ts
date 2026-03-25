/**
 * Static mock data for /for-schools/preview — no Firestore, no auth.
 */

export const PREVIEW_SCHOOL = {
  name: 'Delhi Public School — Sample',
  city: 'New Delhi',
  udise: '07040101234',
  subscriptionPlan: 'Standard Subscription',
  institutionalTier: 'gold',
};

export interface PreviewReportStudent {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  tier: string;
  percentile: number | null;
  assessmentsCompleted: number;
  totalAssessments: number;
}

export const PREVIEW_STUDENTS: PreviewReportStudent[] = [
  { id: 's1', firstName: 'Isha', lastName: 'Kapoor', grade: 7, tier: 'gold', percentile: 82, assessmentsCompleted: 4, totalAssessments: 5 },
  { id: 's2', firstName: 'Arjun', lastName: 'Menon', grade: 8, tier: 'platinum', percentile: 91, assessmentsCompleted: 5, totalAssessments: 5 },
  { id: 's3', firstName: 'Diya', lastName: 'Reddy', grade: 9, tier: 'silver', percentile: 64, assessmentsCompleted: 3, totalAssessments: 5 },
  { id: 's4', firstName: 'Kabir', lastName: 'Singh', grade: 10, tier: 'bronze', percentile: 48, assessmentsCompleted: 2, totalAssessments: 5 },
  { id: 's5', firstName: 'Meera', lastName: 'Nair', grade: 11, tier: 'diamond', percentile: 96, assessmentsCompleted: 5, totalAssessments: 5 },
  { id: 's6', firstName: 'Rohan', lastName: 'Iyer', grade: 12, tier: 'explorer', percentile: 35, assessmentsCompleted: 1, totalAssessments: 5 },
];

export const PREVIEW_TIER_DISTRIBUTION: { tier: string; count: number; pct: number }[] = [
  { tier: 'diamond', count: 1, pct: 8 },
  { tier: 'platinum', count: 2, pct: 17 },
  { tier: 'gold', count: 3, pct: 25 },
  { tier: 'silver', count: 2, pct: 17 },
  { tier: 'bronze', count: 2, pct: 17 },
  { tier: 'explorer', count: 2, pct: 16 },
];

export const PREVIEW_PERFORMANCE = {
  avgPercentile: 72,
  goldPlusPct: 50,
  belowBronzePct: 16,
  completionRate: 78,
  avgPercentileChange: 4,
  goldPlusChange: 6,
  belowBronzeChange: -2,
  completionChange: 5,
};

export const PREVIEW_ASSESSMENT_QUESTIONS: {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}[] = [
  {
    id: 'q1',
    prompt: 'In a right triangle, if one acute angle is 35°, what is the other acute angle?',
    options: ['45°', '55°', '65°', '90°'],
    correctIndex: 1,
  },
  {
    id: 'q2',
    prompt: 'Which sentence uses the subjunctive mood correctly?',
    options: [
      'If I was you, I would study more.',
      'If I were you, I would study more.',
      'If I am you, I would study more.',
      'If I be you, I would study more.',
    ],
    correctIndex: 1,
  },
  {
    id: 'q3',
    prompt: 'Photosynthesis primarily produces which gas as a by-product?',
    options: ['Nitrogen', 'Carbon dioxide', 'Oxygen', 'Methane'],
    correctIndex: 2,
  },
];
