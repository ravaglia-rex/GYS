import type { AssessmentProgress } from './assessmentGating';
import { isUnlimitedOfficialExamRetakeEmail } from './officialStudentAssessmentsAccess';

export const EXAM_ATTEMPT_COOLDOWN_MONTHS = 3;

type FirestoreTimestampJson = {
  _seconds?: number;
  seconds?: number;
  _nanoseconds?: number;
  nanoseconds?: number;
};

export function timestampToMillis(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  if (value && typeof value === 'object') {
    const maybeDate = value as { toDate?: () => Date; toMillis?: () => number };
    if (typeof maybeDate.toMillis === 'function') {
      try {
        return maybeDate.toMillis();
      } catch {
        return null;
      }
    }
    if (typeof maybeDate.toDate === 'function') {
      try {
        return maybeDate.toDate().getTime();
      } catch {
        return null;
      }
    }
    const json = value as FirestoreTimestampJson;
    const seconds = json._seconds ?? json.seconds;
    const nanos = json._nanoseconds ?? json.nanoseconds ?? 0;
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      return seconds * 1000 + Math.floor(nanos / 1_000_000);
    }
  }
  return null;
}

export function nextEligibleAtMsForLevel(
  progress: AssessmentProgress | undefined,
  level: number,
  email?: unknown
): number | null {
  if (isUnlimitedOfficialExamRetakeEmail(email)) return null;
  const value = progress?.next_eligible_at_by_level?.[String(level)];
  const ms = timestampToMillis(value);
  return ms != null && ms > Date.now() ? ms : null;
}

export function addExamAttemptCooldown(startMs: number): number {
  const start = new Date(startMs);
  const next = new Date(startMs);
  next.setMonth(start.getMonth() + EXAM_ATTEMPT_COOLDOWN_MONTHS);
  if (next.getDate() !== start.getDate()) {
    next.setDate(0);
  }
  return next.getTime();
}

export function formatCooldownDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
