/**
 * Display sub-strands for the three core reasoning assessments (GYS-style taxonomy).
 * Keys match assessment `id` from Firestore / assessment config.
 */
export const REASONING_EXAM_SUBCATEGORIES: Record<string, readonly string[]> = {
  symbolic_reasoning: [
    'Pattern Recognition',
    'Rule Application',
    'Logic Puzzles',
    'Flexible Thinking',
  ],
  mathematical_reasoning: [
    'Number Sense',
    'Problem Solving',
    'Mathematical Logic',
    'Quantitative Thinking',
  ],
  verbal_reasoning: [
    'Understanding Meaning',
    'Reading Between the Lines',
    'Evidence and Arguments',
    'Reasoning with Text',
  ],
};

export function getReasoningExamSubcategories(assessmentId: string): string[] {
  const list = REASONING_EXAM_SUBCATEGORIES[assessmentId];
  return list ? [...list] : [];
}
