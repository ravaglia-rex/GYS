// Legacy file - Phase 2 Typeform exam responses no longer exist.
// Personality Profile assessment results are now stored in
// students/{uid}/attempts/ and students/{uid}/assessments/.

export interface Phase2ExamResponse {
  submissionId: string;
  studentId: string;
  responseData: Record<string, any>;
  big5analysis?: string;
  typeTotals?: Record<string, any>;
  createdAt?: any;
}

export const getPhase2ExamResponse = async (_studentId: string): Promise<Phase2ExamResponse | null> => {
  console.warn('getPhase2ExamResponse is deprecated. Read from assessmentCollection.ts instead.');
  return null;
};

export const saveBig5Analysis = async (_submissionId: string, _analysis: string): Promise<void> => {
  console.warn('saveBig5Analysis is deprecated.');
};
