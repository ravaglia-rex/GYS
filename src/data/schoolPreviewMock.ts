/**
 * Greenfield International School - static snapshot aligned with Firestore seed
 * (`seedGreenfieldGysReport.js`, ADMIN_EMAIL srishti+6@argus.ai).
 */
import type { QuarterlyReportListItem } from '../db/schoolAdminCollection';

export {
  buildGreenfieldPreviewStudentRows,
  GREENFIELD_SCHOOL_FIRESTORE_ID,
} from './greenfieldPreviewCohort';

/** Primary POC on the seeded school document. */
export const GREENFIELD_POC_EMAIL = 'srishti+6@argus.ai';

export const GREENFIELD_SCHOOL_DISPLAY = {
  schoolName: 'Greenfield International School',
  city: 'Bangalore',
  state: 'Karnataka',
  board: 'CBSE',
  udise: '29290300301',
  subscriptionPlan: 'Standard (₹3 lakh / yr)',
  institutionalTier: 'gold',
};

/** Mirrors `schools/{id}/analytics/current` from the seed script. */
export const GREENFIELD_ANALYTICS_SNAPSHOT = {
  avg_percentile: 68,
  completion_rate: 72,
  perf_change_percentile: 4,
  perf_change_gold_plus: 0,
  perf_change_below_bronze: -3,
  perf_change_completion: 8,
  institutional_rank: null as number | null,
  rank_change_q1: null as number | null,
};

export const GREENFIELD_QUARTERLY_REPORTS: QuarterlyReportListItem[] = [
  {
    quarterKey: '2026-Q4',
    reportId: 'GYS-SCH-2026-Q4-0047',
    title: 'GYS Institutional Performance Report - Q4 2026',
    assessmentPeriodLabel: 'Q4 2026 (October  -  December)',
    studentsAssessed: 142,
    subscriptionTier: 'Standard (₹3 lakh)',
    institutionalTier: 'gold',
    pdfS3Key: 'school-reports/greenfield_international_bangalore/2026_q4.pdf',
    pdfFilename: 'Greenfield-International-School-GYS-Q4-2026.pdf',
    hasPdf: true,
    generatedAt: null,
    isLatest: true,
  },
  {
    quarterKey: '2026-Q2',
    reportId: 'GYS-SCH-2026-Q2-PLACEHOLDER',
    title: 'GYS Institutional Performance Report - Q2 2026',
    assessmentPeriodLabel: 'Q2 2026 (April  -  June)',
    studentsAssessed: 100,
    subscriptionTier: 'Standard (₹3 lakh)',
    institutionalTier: 'silver',
    pdfS3Key: null,
    pdfFilename: null,
    hasPdf: false,
    generatedAt: null,
    isLatest: false,
  },
];

/** Ten symbolic-reasoning - style items for the school preview sample exam (frontend only). */
export const PREVIEW_SYMBOLIC_SAMPLE_QUESTIONS: {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}[] = [
  {
    id: 'sym-p1',
    prompt: 'Complete the sequence: ▲ ◆ ▲ ◆ ▲ ?',
    options: ['▲', '◆', '●', '■'],
    correctIndex: 1,
  },
  {
    id: 'sym-p2',
    prompt: 'Which shape continues the pattern: ○ △ ○ △ ○ ?',
    options: ['○', '△', '□', '◇'],
    correctIndex: 1,
  },
  {
    id: 'sym-p3',
    prompt: 'If all corners of a square are removed equally, the outline most resembles:',
    options: ['A circle', 'An octagon', 'A triangle', 'A hexagon'],
    correctIndex: 1,
  },
  {
    id: 'sym-p4',
    prompt: 'Mirror the figure left-to-right:  ⟮  )  -  which option matches?',
    options: ['⟮  )', ')  ⟯', '(  ⟯', '⟯  ('],
    correctIndex: 2,
  },
  {
    id: 'sym-p5',
    prompt: 'Grid rule: each row has one filled cell moving right by one. Row 3, col 4 is ?\n■ · · ·\n· ■ · ·\n· · ? ·',
    options: ['■', '·', 'Both valid', 'No pattern'],
    correctIndex: 0,
  },
  {
    id: 'sym-p6',
    prompt: 'Number sequence: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '48'],
    correctIndex: 1,
  },
  {
    id: 'sym-p7',
    prompt: 'Which option completes the analogy?  BIG is to small as TALL is to:',
    options: ['Wide', 'Short', 'Thin', 'Long'],
    correctIndex: 1,
  },
  {
    id: 'sym-p8',
    prompt: 'Rotating a “Z” shape 180° in the plane looks like:',
    options: ['Z unchanged', 'N', 'S', 'Backwards Z (like Ƨ)'],
    correctIndex: 3,
  },
  {
    id: 'sym-p9',
    prompt: 'Dots per step: ·  ··  ···  ?',
    options: ['····', '···', '··', '·'],
    correctIndex: 0,
  },
  {
    id: 'sym-p10',
    prompt: 'If the rule is “alternate between adding 1 and doubling,” starting at 1: 1, 2, 3, 6, 7, ?',
    options: ['8', '12', '14', '13'],
    correctIndex: 2,
  },
];

/** @deprecated Use PREVIEW_SYMBOLIC_SAMPLE_QUESTIONS; kept for any external imports. */
export const PREVIEW_ASSESSMENT_QUESTIONS = PREVIEW_SYMBOLIC_SAMPLE_QUESTIONS;
