export type PipelineId = 'student' | 'school' | 'monthly';

export type PipelineDefinition = {
  id: PipelineId;
  title: string;
  subtitle: string;
  duration: string;
  summary: string;
  steps: string[];
  warning?: string;
};

export const PIPELINE_DEFINITIONS: PipelineDefinition[] = [
  {
    id: 'student',
    title: 'Student pipeline',
    subtitle: 'National tiers + student PDF reports',
    duration: 'Typically 5–20 minutes',
    summary:
      'Runs across every student account. Use after large assessment windows or when student tiers/reports look stale. Same job as the weekly Monday 2:00 IST schedule.',
    steps: [
      'Recalculates national performance tiers and national_composite_percentile for all students.',
      'Scans each student for newly eligible Discovery / Triad (and higher) reports.',
      'Generates missing PDF reports and stores them on the student record (S3 + Firestore).',
      'On a full completed pass: publishes in-app dashboard alerts for leaderboard and badge refresh. No email.',
    ],
    warning:
      'Can pause mid-run if it hits the Cloud Functions time limit; the next run resumes from a checkpoint for that India month.',
  },
  {
    id: 'school',
    title: 'School pipeline',
    subtitle: 'Institutional analytics + quarterly PDFs',
    duration: 'Typically 3–15 minutes',
    summary:
      'Recomputes school-wide analytics from each school’s roster. Same job as the monthly 1st-of-month IST schedule. In August this is analytics only — no PDFs.',
    steps: [
      'Loads rostered students per school and recomputes assessed count, completion rate, and avg national percentile (only from stored national_composite_percentile).',
      'Updates schools/{id}/analytics/current (including avg_percentile_source) and institutional tier on the school doc.',
      'On Jan/Apr/Jul/Oct (IST) only: writes the previous quarter’s report metadata.',
      'PDF upload on those months: Entry-plan schools with at least one assessed student get the Discovery school PDF. Standard/Premium get metadata only for now.',
    ],
    warning:
      'Does not regenerate PDFs for every school. Outside Jan/Apr/Jul/Oct it never builds PDFs.',
  },
  {
    id: 'monthly',
    title: 'Full refresh (student + school)',
    subtitle: 'Manual: student stage, then school stage',
    duration: 'Typically 10–35 minutes',
    summary:
      'Manual full refresh: runs the student pipeline first, then the school pipeline so school analytics can use fresh national tiers. This is heavier than the automatic 1st-of-month job, which is school-only (students already refresh weekly).',
    steps: [
      'Stage 1 - Student pipeline (national tiers + missing student PDF reports).',
      'Stage 2 - School pipeline (per-school analytics; quarterly Entry PDFs only in Jan/Apr/Jul/Oct).',
    ],
    warning: 'Heaviest operation. Avoid during peak exam hours. In August, stage 2 still will not generate school PDFs.',
  },
];
