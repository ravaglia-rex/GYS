// phase2Submission.test.ts
import { runPhase2ExamSubmissionTransaction } from '../db/studentSubmissionMapping';

describe('Phase 2 Exam Submission', () => {
  it('should handle errors correctly', async () => {
    // Test that the function throws the expected error
    await expect(runPhase2ExamSubmissionTransaction(
      "test_student_123",
      "test_submission_456",
      "test_form_789",
      "2024-12-19T10:00:00.000Z"
    )).rejects.toThrow('Error submitting phase 2 exam');
  });

  it('should exist and be callable', () => {
    expect(typeof runPhase2ExamSubmissionTransaction).toBe('function');
  });
});