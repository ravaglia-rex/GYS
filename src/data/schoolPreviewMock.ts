/**
 * Greenfield International School - static snapshot aligned with Firestore seed
 * (`seedGreenfieldGysReport.js`, ADMIN_EMAIL srishti+6@argus.ai).
 */
import type { QuarterlyReportListItem } from '../db/schoolAdminCollection';
import { PREVIEW_SAMPLE_QUESTIONS_BY_EXAM } from './previewSampleAssessments';

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
  udise_code: '29290300301',
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

/** Same bucket as other public Argus assets; override if your sample PDF lives elsewhere. */
const PREVIEW_SAMPLE_REPORT_PDF_URL =
  process.env.REACT_APP_SCHOOL_PREVIEW_SAMPLE_REPORT_PDF_URL ||
  'https://argus-s3-bucket.s3.us-east-1.amazonaws.com/school-reports/greenfield_international_bangalore/2026_q4.pdf';

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
    previewPublicPdfUrl: PREVIEW_SAMPLE_REPORT_PDF_URL,
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

/** Pattern and Logic sample items for the school preview (frontend only). */
export const PREVIEW_PATTERN_LOGIC_SAMPLE_QUESTIONS = PREVIEW_SAMPLE_QUESTIONS_BY_EXAM.symbolic_reasoning;

/** @deprecated Use PREVIEW_PATTERN_LOGIC_SAMPLE_QUESTIONS; kept for any external imports. */
export const PREVIEW_ASSESSMENT_QUESTIONS = PREVIEW_PATTERN_LOGIC_SAMPLE_QUESTIONS;

/** @deprecated Renamed to PREVIEW_PATTERN_LOGIC_SAMPLE_QUESTIONS. */
export const PREVIEW_SYMBOLIC_SAMPLE_QUESTIONS = PREVIEW_PATTERN_LOGIC_SAMPLE_QUESTIONS;
