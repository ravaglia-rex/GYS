/**
 * Display sub-strands for the three core reasoning assessments.
 * Must match backend `SUBCONSTRUCTS_BY_EXAM` in subconstructConstants.ts — Score
 * Distribution matches roster construct `subconstruct` labels exactly.
 */
export const REASONING_EXAM_SUBCATEGORIES: Record<string, readonly string[]> = {
  symbolic_reasoning: [
    'Pattern Recognition',
    'Logical Deduction',
    'Sequence Analysis',
    'Abstract Problem-Solving',
  ],
  verbal_reasoning: [
    'Reading Comprehension',
    'Argument Analysis',
    'Inference & Deduction',
    'Vocabulary in Context',
  ],
  mathematical_reasoning: [
    'Quantitative Logic',
    'Non-Routine Problem Solving',
    'Mathematical Patterns',
    'Data Interpretation',
  ],
};

export function getReasoningExamSubcategories(assessmentId: string): string[] {
  const list = REASONING_EXAM_SUBCATEGORIES[assessmentId];
  return list ? [...list] : [];
}
