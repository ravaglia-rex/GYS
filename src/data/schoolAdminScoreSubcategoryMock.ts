/**
 * Placeholder sectional score distribution for school analytics.
 * Replace with API / Firestore when per-substrand scores exist.
 */
export interface SubcategoryScoreBandMock {
  range: string;
  /** Share of synthetic cohort in this band (0–100, rows sum to ~100) */
  percentage: number;
}

export interface SubcategoryScoreMock {
  name: string;
  /** Illustrative mean % (0–100) */
  meanScore: number;
  bands: SubcategoryScoreBandMock[];
}

export interface ExamSubcategoryScoreDistributionMock {
  examId: string;
  subcategories: SubcategoryScoreMock[];
}

export const FAKE_SCORE_DISTRIBUTION_BY_EXAM: ExamSubcategoryScoreDistributionMock[] = [
  {
    examId: 'symbolic_reasoning',
    subcategories: [
      {
        name: 'Pattern Recognition',
        meanScore: 81,
        bands: [
          { range: '90-100', percentage: 22 },
          { range: '80-89', percentage: 38 },
          { range: '70-79', percentage: 24 },
          { range: '60-69', percentage: 10 },
          { range: '50-59', percentage: 4 },
          { range: 'Below 50', percentage: 2 },
        ],
      },
      {
        name: 'Rule Application',
        meanScore: 74,
        bands: [
          { range: '90-100', percentage: 14 },
          { range: '80-89', percentage: 28 },
          { range: '70-79', percentage: 32 },
          { range: '60-69', percentage: 16 },
          { range: '50-59', percentage: 6 },
          { range: 'Below 50', percentage: 4 },
        ],
      },
      {
        name: 'Logic Puzzles',
        meanScore: 69,
        bands: [
          { range: '90-100', percentage: 8 },
          { range: '80-89', percentage: 22 },
          { range: '70-79', percentage: 34 },
          { range: '60-69', percentage: 20 },
          { range: '50-59', percentage: 10 },
          { range: 'Below 50', percentage: 6 },
        ],
      },
      {
        name: 'Flexible Thinking',
        meanScore: 76,
        bands: [
          { range: '90-100', percentage: 16 },
          { range: '80-89', percentage: 34 },
          { range: '70-79', percentage: 28 },
          { range: '60-69', percentage: 12 },
          { range: '50-59', percentage: 6 },
          { range: 'Below 50', percentage: 4 },
        ],
      },
    ],
  },
  {
    examId: 'mathematical_reasoning',
    subcategories: [
      {
        name: 'Number Sense',
        meanScore: 77,
        bands: [
          { range: '90-100', percentage: 18 },
          { range: '80-89', percentage: 36 },
          { range: '70-79', percentage: 26 },
          { range: '60-69', percentage: 12 },
          { range: '50-59', percentage: 5 },
          { range: 'Below 50', percentage: 3 },
        ],
      },
      {
        name: 'Problem Solving',
        meanScore: 71,
        bands: [
          { range: '90-100', percentage: 12 },
          { range: '80-89', percentage: 26 },
          { range: '70-79', percentage: 32 },
          { range: '60-69', percentage: 18 },
          { range: '50-59', percentage: 8 },
          { range: 'Below 50', percentage: 4 },
        ],
      },
      {
        name: 'Mathematical Logic',
        meanScore: 73,
        bands: [
          { range: '90-100', percentage: 15 },
          { range: '80-89', percentage: 30 },
          { range: '70-79', percentage: 30 },
          { range: '60-69', percentage: 15 },
          { range: '50-59', percentage: 6 },
          { range: 'Below 50', percentage: 4 },
        ],
      },
      {
        name: 'Quantitative Thinking',
        meanScore: 79,
        bands: [
          { range: '90-100', percentage: 20 },
          { range: '80-89', percentage: 40 },
          { range: '70-79', percentage: 22 },
          { range: '60-69', percentage: 10 },
          { range: '50-59', percentage: 5 },
          { range: 'Below 50', percentage: 3 },
        ],
      },
    ],
  },
  {
    examId: 'verbal_reasoning',
    subcategories: [
      {
        name: 'Understanding Meaning',
        meanScore: 82,
        bands: [
          { range: '90-100', percentage: 24 },
          { range: '80-89', percentage: 40 },
          { range: '70-79', percentage: 22 },
          { range: '60-69', percentage: 8 },
          { range: '50-59', percentage: 4 },
          { range: 'Below 50', percentage: 2 },
        ],
      },
      {
        name: 'Reading Between the Lines',
        meanScore: 75,
        bands: [
          { range: '90-100', percentage: 14 },
          { range: '80-89', percentage: 32 },
          { range: '70-79', percentage: 30 },
          { range: '60-69', percentage: 14 },
          { range: '50-59', percentage: 6 },
          { range: 'Below 50', percentage: 4 },
        ],
      },
      {
        name: 'Evidence and Arguments',
        meanScore: 70,
        bands: [
          { range: '90-100', percentage: 10 },
          { range: '80-89', percentage: 24 },
          { range: '70-79', percentage: 34 },
          { range: '60-69', percentage: 18 },
          { range: '50-59', percentage: 8 },
          { range: 'Below 50', percentage: 6 },
        ],
      },
      {
        name: 'Reasoning with Text',
        meanScore: 78,
        bands: [
          { range: '90-100', percentage: 17 },
          { range: '80-89', percentage: 35 },
          { range: '70-79', percentage: 28 },
          { range: '60-69', percentage: 12 },
          { range: '50-59', percentage: 5 },
          { range: 'Below 50', percentage: 3 },
        ],
      },
    ],
  },
];
