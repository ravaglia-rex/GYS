export const queryKeys = {
  student: (uid: string) => ['student', uid] as const,
  assessmentConfig: () => ['assessmentConfig'] as const,
  schoolDetails: (schoolId: string) => ['schoolDetails', schoolId] as const,
  payments: (uid: string) => ['payments', uid] as const,
  studentAssessments: (uid: string) => ['studentAssessments', uid] as const,
  qod: () => ['qod'] as const,
  rewards: () => ['rewards'] as const,
};
