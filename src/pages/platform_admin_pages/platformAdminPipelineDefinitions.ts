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
      'Runs across every student account. Use after large assessment windows or when student tiers/reports look stale.',
    steps: [
      'Recalculates national performance tiers for all students (leaderboard rankings).',
      'Scans each student for newly eligible Discovery and Reasoning Triad reports.',
      'Generates missing PDF reports and stores them on the student record (S3 + Firestore).',
      'Publishes in-app dashboard alerts (bell icon) for students - leaderboard and badge refresh. No email is sent.',
    ],
  },
  {
    id: 'school',
    title: 'School pipeline',
    subtitle: 'Institutional analytics + quarterly PDFs',
    duration: 'Typically 3–15 minutes',
    summary:
      'Recomputes school-wide analytics from the current student roster. On quarter-start months it also builds quarterly institutional PDFs.',
    steps: [
      'Loads all students rostered to each school and recomputes avg percentile, completion rate, and assessed count.',
      'Updates `schools/{id}/analytics/current` and institutional tier fields on the school document.',
      'On Jan/Apr/Jul/Oct (IST): writes quarterly report metadata and uploads the institutional PDF to S3.',
      'School POCs see new report alerts in the school admin portal - no email is sent by this pipeline.',
    ],
    warning: 'Quarter-start months also regenerate quarterly PDFs for every school.',
  },
  {
    id: 'monthly',
    title: 'Full monthly pipeline',
    subtitle: 'Student stage, then school stage',
    duration: 'Typically 10–35 minutes',
    summary:
      'Same job that runs automatically on the 1st of each month (IST). Runs the student pipeline first, then the school pipeline so institutional analytics use fresh student tiers.',
    steps: [
      'Stage 1 - Student pipeline (tiers + student PDF reports for all students).',
      'Stage 2 - School pipeline (per-school analytics cache + quarterly PDFs when applicable).',
    ],
    warning: 'This is the heaviest operation. Avoid running during peak exam hours.',
  },
];
