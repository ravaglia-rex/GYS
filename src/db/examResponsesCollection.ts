// Legacy file - Typeform-based exam responses have been replaced by the
// adaptive assessment system. Use completeExam from assessmentCollection.ts.

export const fetchResultTotals = async (
  _userID: string,
  _formID: string
): Promise<{ overallTotal: number; typeTotals: Record<string, number> } | null> => {
  console.warn('fetchResultTotals is deprecated. Use completeExam from assessmentCollection.ts.');
  return null;
};

export const fetchPhase2ResultTotals = async (
  _userID: string,
  _formID: string
): Promise<{ overallTotal: number; typeTotals: Record<string, number> } | null> => {
  console.warn('fetchPhase2ResultTotals is deprecated.');
  return null;
};
