// Legacy file - exam mappings have been replaced by assessment_progress on the
// student document and the assessmentCollection API.
// Stubs are kept so existing imports compile while components are being migrated.

export const getExamIds = async (_uid: string): Promise<{
  formLinks: string[];
  completed: boolean[];
  eligibility_at: string[];
  result: (boolean | null)[];
}> => {
  console.warn('getExamIds is deprecated. Use getStudentAssessments from assessmentCollection.ts.');
  return { formLinks: [], completed: [], eligibility_at: [], result: [] };
};

export const getCurrentExamResult = async (
  _uid: string,
  _formId: string
): Promise<{ result: boolean | null; completed: boolean } | null> => {
  console.warn('getCurrentExamResult is deprecated. Use getStudentAssessments from assessmentCollection.ts.');
  return null;
};
