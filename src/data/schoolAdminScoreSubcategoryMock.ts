/**
 * Placeholder sectional score distribution for school analytics.
 * Replace with API / Firestore when per-substrand scores exist.
 */
export interface SubcategoryScoreBandMock {
  range: string;
  /** Synthetic cohort count out of 100 students; rows sum to ~100. */
  percentage: number;
}

export interface SubcategoryScoreMock {
  name: string;
  /** Illustrative mean score on the 0 - 100 normalized scale; UI renders it as points out of 1000. */
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
          { range: '900-1000', percentage: 22 },
          { range: '800-899', percentage: 38 },
          { range: '700-799', percentage: 24 },
          { range: '600-699', percentage: 10 },
          { range: '500-599', percentage: 4 },
          { range: 'Below 500', percentage: 2 },
        ],
      },
      {
        name: 'Rule Application',
        meanScore: 74,
        bands: [
          { range: '900-1000', percentage: 14 },
          { range: '800-899', percentage: 28 },
          { range: '700-799', percentage: 32 },
          { range: '600-699', percentage: 16 },
          { range: '500-599', percentage: 6 },
          { range: 'Below 500', percentage: 4 },
        ],
      },
      {
        name: 'Logic Puzzles',
        meanScore: 69,
        bands: [
          { range: '900-1000', percentage: 8 },
          { range: '800-899', percentage: 22 },
          { range: '700-799', percentage: 34 },
          { range: '600-699', percentage: 20 },
          { range: '500-599', percentage: 10 },
          { range: 'Below 500', percentage: 6 },
        ],
      },
      {
        name: 'Flexible Thinking',
        meanScore: 76,
        bands: [
          { range: '900-1000', percentage: 16 },
          { range: '800-899', percentage: 34 },
          { range: '700-799', percentage: 28 },
          { range: '600-699', percentage: 12 },
          { range: '500-599', percentage: 6 },
          { range: 'Below 500', percentage: 4 },
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
          { range: '900-1000', percentage: 18 },
          { range: '800-899', percentage: 36 },
          { range: '700-799', percentage: 26 },
          { range: '600-699', percentage: 12 },
          { range: '500-599', percentage: 5 },
          { range: 'Below 500', percentage: 3 },
        ],
      },
      {
        name: 'Problem Solving',
        meanScore: 71,
        bands: [
          { range: '900-1000', percentage: 12 },
          { range: '800-899', percentage: 26 },
          { range: '700-799', percentage: 32 },
          { range: '600-699', percentage: 18 },
          { range: '500-599', percentage: 8 },
          { range: 'Below 500', percentage: 4 },
        ],
      },
      {
        name: 'Mathematical Logic',
        meanScore: 73,
        bands: [
          { range: '900-1000', percentage: 15 },
          { range: '800-899', percentage: 30 },
          { range: '700-799', percentage: 30 },
          { range: '600-699', percentage: 15 },
          { range: '500-599', percentage: 6 },
          { range: 'Below 500', percentage: 4 },
        ],
      },
      {
        name: 'Quantitative Thinking',
        meanScore: 79,
        bands: [
          { range: '900-1000', percentage: 20 },
          { range: '800-899', percentage: 40 },
          { range: '700-799', percentage: 22 },
          { range: '600-699', percentage: 10 },
          { range: '500-599', percentage: 5 },
          { range: 'Below 500', percentage: 3 },
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
          { range: '900-1000', percentage: 24 },
          { range: '800-899', percentage: 40 },
          { range: '700-799', percentage: 22 },
          { range: '600-699', percentage: 8 },
          { range: '500-599', percentage: 4 },
          { range: 'Below 500', percentage: 2 },
        ],
      },
      {
        name: 'Reading Between the Lines',
        meanScore: 75,
        bands: [
          { range: '900-1000', percentage: 14 },
          { range: '800-899', percentage: 32 },
          { range: '700-799', percentage: 30 },
          { range: '600-699', percentage: 14 },
          { range: '500-599', percentage: 6 },
          { range: 'Below 500', percentage: 4 },
        ],
      },
      {
        name: 'Evidence and Arguments',
        meanScore: 70,
        bands: [
          { range: '900-1000', percentage: 10 },
          { range: '800-899', percentage: 24 },
          { range: '700-799', percentage: 34 },
          { range: '600-699', percentage: 18 },
          { range: '500-599', percentage: 8 },
          { range: 'Below 500', percentage: 6 },
        ],
      },
      {
        name: 'Reasoning with Text',
        meanScore: 78,
        bands: [
          { range: '900-1000', percentage: 17 },
          { range: '800-899', percentage: 35 },
          { range: '700-799', percentage: 28 },
          { range: '600-699', percentage: 12 },
          { range: '500-599', percentage: 5 },
          { range: 'Below 500', percentage: 3 },
        ],
      },
    ],
  },
];
