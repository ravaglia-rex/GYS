export { default as PreExamProctoringSetup } from './PreExamProctoringSetup';
export { useProctoringMonitor } from './useProctoringMonitor';
export { resolveProctoringConfig, isProctoringActive, isProctoringGloballyEnabled, VIDEO_PROCTORING_ENABLED } from './config';
export { getSchoolStudentProctoringFlags, getSchoolStudentProctoringSnapshotUrl } from './api';
export type {
  ProctoringConfig,
  ProctoringEventType,
  ProctoringEventSeverity,
  ProctoringSummary,
  FlaggedProctoringAttempt,
} from './types';
