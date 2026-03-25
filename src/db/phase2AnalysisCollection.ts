// Legacy file — Phase 2 analysis is no longer stored in a separate collection.
// Assessment results live in students/{uid}/attempts/ and
// students/{uid}/assessments/.

export interface Phase2Analysis {
  studentId: string;
  submissionId: string;
  big5Analysis: any;
  logicAnalysis: any;
  mathAnalysis: any;
  readingAnalysis: any;
  writingAnalysis: any;
  createdAt: any;
  updatedAt: any;
}

export const getPhase2Analysis = async (_studentId: string): Promise<null> => {
  console.warn('getPhase2Analysis is deprecated. Read from assessmentCollection.ts instead.');
  return null;
};

export const createPhase2Analysis = async (
  _studentId: string,
  _submissionId: string,
  _computedAnalysis?: any
): Promise<Phase2Analysis> => {
  console.warn('createPhase2Analysis is deprecated.');
  throw new Error('createPhase2Analysis is deprecated. Use the new assessment system.');
};

export const updatePhase2Analysis = async (
  _studentId: string,
  _analysisData: Partial<Phase2Analysis>
): Promise<void> => {
  console.warn('updatePhase2Analysis is deprecated.');
};
