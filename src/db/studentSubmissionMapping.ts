// Legacy file — Typeform submission mappings no longer exist.
// Exam completion is handled by completeExam in assessmentCollection.ts.

export const runExamSubmissionTransaction = async (
  _student_uid: string,
  _submission_id: string,
  _form_id: string,
  _submission_time: string
): Promise<void> => {
  console.warn('runExamSubmissionTransaction is deprecated. Use completeExam from assessmentCollection.ts.');
};

export const runPhase2ExamSubmissionTransaction = async (
  _student_uid: string,
  _submission_id: string,
  _form_id: string,
  _submission_time: string
): Promise<void> => {
  console.warn('runPhase2ExamSubmissionTransaction is deprecated.');
};
