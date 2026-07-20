import type { ExamQuestion, QuestionInteractionType } from '../../db/assessmentCollection';
import { getAssessmentFlowDefinition } from '../../config/assessmentFlowUI';

export function inferQuestionInteraction(
  assessmentId: string,
  q: ExamQuestion | null
): QuestionInteractionType {
  if (!q) return 'visual_mcq';
  if (q.question_type) return q.question_type;
  if (q.audio_url) return 'listening_mcq';
  if (q.passage && q.passage.trim()) return 'passage_mcq';
  const flow = getAssessmentFlowDefinition(assessmentId);
  const pid = assessmentId === 'comprehensive_personality';
  if (pid && q.options?.length >= 5) return 'likert';
  if (flow.defaultQuestionInteraction === 'likert' && q.options?.length >= 5) return 'likert';
  if (flow.defaultQuestionInteraction === 'listening_mcq' && q.audio_url) return 'listening_mcq';
  if (flow.defaultQuestionInteraction === 'passage_mcq' && q.passage) return 'passage_mcq';
  return 'visual_mcq';
}
