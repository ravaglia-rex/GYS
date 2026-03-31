// Legacy file - exam details (Typeform-based) have been replaced by the
// adaptive assessment system. Use assessmentCollection.ts instead.
// getExamDetails is kept as a no-op stub so existing imports don't hard-error
// while the referencing components are being migrated.

export const getExamDetails = async (_formLinks: string[]): Promise<any[]> => {
  console.warn('getExamDetails is deprecated. Use getAssessmentConfig from assessmentCollection.ts.');
  return [];
};
