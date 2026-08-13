import type { AssessmentTier } from '../../db/assessmentCollection';
import type { AssessmentFlowDefinition, StatCell } from '../../config/assessmentFlowUI';

export function mergeStatGridWithTier(
  flow: AssessmentFlowDefinition,
  tier: AssessmentTier | undefined
): StatCell[] {
  const grid = flow.statGrid.map((c) => ({ ...c }));
  if (!tier) return grid;

  const qc = tier.question_count;
  const tlim = tier.time_limit_minutes;

  for (const cell of grid) {
    const L = cell.label.toLowerCase();
    if (qc != null && (L === 'questions' || L.includes('question'))) {
      // Keep authored ranges (e.g. Analytical Reasoning "32–40") — adaptive length varies.
      const looksLikeRange = /\d\s*[–-]\s*\d/.test(cell.value);
      if (!looksLikeRange) {
        cell.value = String(qc);
      }
    }
    if (tlim != null && (L === 'duration' || L === 'timer')) {
      cell.value = tlim === 0 ? 'None' : `${tlim} min`;
    }
  }
  return grid;
}
