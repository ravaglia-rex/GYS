import type { AssessmentType } from '../../db/assessmentCollection';
import { DEFAULT_PROCTORING_CONFIG, type ProctoringConfig } from './types';

export function resolveProctoringConfig(
  assessment?: Pick<AssessmentType, 'proctoring'> | null
): ProctoringConfig {
  const raw = assessment?.proctoring;
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PROCTORING_CONFIG };
  }
  return {
    enabled: raw.enabled === true,
    min_face_checks:
      typeof raw.min_face_checks === 'number' && raw.min_face_checks > 0
        ? raw.min_face_checks
        : DEFAULT_PROCTORING_CONFIG.min_face_checks,
    snapshot_on_violation:
      typeof raw.snapshot_on_violation === 'boolean'
        ? raw.snapshot_on_violation
        : DEFAULT_PROCTORING_CONFIG.snapshot_on_violation,
    check_interval_sec:
      typeof raw.check_interval_sec === 'number' && raw.check_interval_sec >= 15
        ? raw.check_interval_sec
        : DEFAULT_PROCTORING_CONFIG.check_interval_sec,
  };
}

export function isProctoringActive(config: ProctoringConfig): boolean {
  return config.enabled === true;
}
