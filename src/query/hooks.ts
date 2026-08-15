import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStudent } from '../db/studentCollection';
import {
  getAssessmentConfig,
  getStudentAssessments,
  type AssessmentType,
  type AttemptRecord,
} from '../db/assessmentCollection';
import { getSchoolDetails } from '../db/schoolCollection';
import { getPayments } from '../db/studentPaymentMappings';
import { fetchQod, fetchRewards } from '../db/gamificationCollection';
import { getSchoolStudentRoster, getSchoolSummary } from '../db/schoolAdminCollection';
import { getStudentCoinsLeaderboard } from '../db/studentLeaderboardCollection';
import { isVisibleSchoolRosterStudent } from '../utils/schoolAdminRosterUtils';
import { queryKeys } from './queryKeys';

const ASSESSMENT_CONFIG_STALE_MS = 15 * 60_000;
const STUDENT_STALE_MS = 2 * 60_000;
const SCHOOL_STALE_MS = 30 * 60_000;
const PAYMENTS_STALE_MS = 5 * 60_000;
const STUDENT_ASSESSMENTS_STALE_MS = 60_000;
const SCHOOL_ADMIN_SUMMARY_STALE_MS = 60_000;
const SCHOOL_ADMIN_ROSTER_STALE_MS = 60_000;
/** Coins boards refresh once/day server-side - keep client cache warm for most of a day. */
const COINS_LEADERBOARD_STALE_MS = 12 * 60 * 60_000;

export function useStudent(uid: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.student(uid ?? ''),
    queryFn: () => getStudent(uid!),
    enabled: Boolean(uid) && enabled,
    staleTime: STUDENT_STALE_MS,
  });
}

export function useAssessmentConfig(enabled = true) {
  return useQuery({
    queryKey: queryKeys.assessmentConfig(),
    queryFn: getAssessmentConfig,
    enabled,
    staleTime: ASSESSMENT_CONFIG_STALE_MS,
  });
}

export function useSchoolDetails(schoolId: string | undefined, enabled = true) {
  const shouldFetch = Boolean(schoolId) && schoolId !== 'not-listed' && enabled;
  return useQuery({
    queryKey: queryKeys.schoolDetails(schoolId ?? ''),
    queryFn: () => getSchoolDetails(schoolId!),
    enabled: shouldFetch,
    staleTime: SCHOOL_STALE_MS,
  });
}

export function usePayments(uid: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.payments(uid ?? ''),
    queryFn: () => getPayments(uid!),
    enabled: Boolean(uid) && enabled,
    staleTime: PAYMENTS_STALE_MS,
  });
}

export function useStudentAssessments(uid: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.studentAssessments(uid ?? ''),
    queryFn: () => getStudentAssessments(uid!),
    enabled: Boolean(uid) && enabled,
    staleTime: STUDENT_ASSESSMENTS_STALE_MS,
  });
}

export function useInvalidateStudentQueries() {
  const qc = useQueryClient();
  return (uid: string) => {
    void qc.invalidateQueries({ queryKey: queryKeys.student(uid) });
    void qc.invalidateQueries({ queryKey: queryKeys.studentAssessments(uid) });
    void qc.invalidateQueries({ queryKey: queryKeys.payments(uid) });
    void qc.invalidateQueries({ queryKey: queryKeys.rewards() });
    void qc.invalidateQueries({ queryKey: queryKeys.qod() });
  };
}

/** QoD / coin-only mutations should not refetch assessments or payments. */
export function useInvalidateStudentProfile() {
  const qc = useQueryClient();
  return (uid: string) => {
    void qc.invalidateQueries({ queryKey: queryKeys.student(uid) });
  };
}

export function useQod(enabled = true) {
  return useQuery({
    queryKey: queryKeys.qod(),
    queryFn: fetchQod,
    enabled,
    staleTime: 60_000,
    refetchOnMount: false,
  });
}

export function useRewards(enabled = true) {
  return useQuery({
    queryKey: queryKeys.rewards(),
    queryFn: fetchRewards,
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Shared, cached school-admin summary fetch. Every School Official page that needs summary data
 * (Dashboard, Students, Subscription, tutorial preferences) reads from this single query key, so
 * navigating between them within `staleTime` reuses the cached result instead of re-fetching.
 */
export function useSchoolAdminSummary(schoolId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.schoolAdminSummary(schoolId ?? ''),
    queryFn: () => getSchoolSummary(schoolId!),
    enabled: Boolean(schoolId) && enabled,
    staleTime: SCHOOL_ADMIN_SUMMARY_STALE_MS,
  });
}

/**
 * Shared, cached full-roster fetch (paginated server-side, see `getSchoolStudentRoster`). Shared
 * across Dashboard/Students/Analytics pages via the same query key.
 */
export function useSchoolAdminRoster(schoolId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.schoolAdminRoster(schoolId ?? ''),
    queryFn: () => getSchoolStudentRoster(schoolId!),
    enabled: Boolean(schoolId) && enabled,
    staleTime: SCHOOL_ADMIN_ROSTER_STALE_MS,
    // Runs on cached data too, so a stale cache from before staff-student filtering still hides them.
    select: (students) => students.filter(isVisibleSchoolRosterStudent),
  });
}

/**
 * Daily-cached Argus Coins top-10 boards (overall + school). Source data refreshes once/day
 * server-side, so a long staleTime avoids repeat network calls within a session day.
 */
export function useCoinsLeaderboard(
  uid: string | undefined,
  enabled = true,
  schoolId?: string | null
) {
  return useQuery({
    queryKey: queryKeys.coinsLeaderboard(uid ?? ''),
    queryFn: () => getStudentCoinsLeaderboard(schoolId),
    enabled: Boolean(uid) && enabled,
    staleTime: COINS_LEADERBOARD_STALE_MS,
  });
}

export function useInvalidateSchoolAdminQueries() {
  const qc = useQueryClient();
  return (schoolId: string) => {
    void qc.invalidateQueries({ queryKey: queryKeys.schoolAdminSummary(schoolId) });
    void qc.invalidateQueries({ queryKey: queryKeys.schoolAdminRoster(schoolId) });
  };
}

export type { AssessmentType, AttemptRecord };
