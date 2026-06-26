export { default as PreExamProctoringSetup } from './PreExamProctoringSetup';
export { useProctoringMonitor } from './useProctoringMonitor';
export { resolveProctoringConfig, isProctoringActive, isProctoringGloballyEnabled } from './config';
export { getSchoolStudentProctoringFlags } from './api';
export type {
  ProctoringConfig,
  ProctoringEventType,
  ProctoringEventSeverity,
  ProctoringSummary,
  FlaggedProctoringAttempt,
} from './types';
