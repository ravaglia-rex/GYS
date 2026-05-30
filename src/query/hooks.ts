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
import { queryKeys } from './queryKeys';

const ASSESSMENT_CONFIG_STALE_MS = 15 * 60_000;
const STUDENT_STALE_MS = 2 * 60_000;
const SCHOOL_STALE_MS = 30 * 60_000;
const PAYMENTS_STALE_MS = 5 * 60_000;
const STUDENT_ASSESSMENTS_STALE_MS = 60_000;

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
  };
}

export type { AssessmentType, AttemptRecord };
