/** Subscore rows for results deep-dive (7D). Values are derived from total score with small spread until norms API exists. */

export interface SubscoreRow {
  id: string;
  label: string;
  /** 0–99 percentile-style display */
  percentile: number;
}

export function buildSubscores(assessmentId: string, scorePercent: number): SubscoreRow[] {
  const p = Math.round(scorePercent);
  const clamp = (n: number) => Math.min(99, Math.max(5, Math.round(n)));

  if (assessmentId === 'symbolic_reasoning') {
    return [
      { id: 'pat', label: 'Pattern Recognition', percentile: clamp(p + 7) },
      { id: 'seq', label: 'Sequence Completion', percentile: clamp(p - 4) },
      { id: 'spa', label: 'Spatial Reasoning', percentile: clamp(p - 6) },
      { id: 'mat', label: 'Matrix Logic', percentile: clamp(p + 2) },
    ];
  }
  if (assessmentId === 'mathematical_reasoning') {
    return [
      { id: 'q', label: 'Quantitative reasoning', percentile: clamp(p + 3) },
      { id: 'm', label: 'Modeling & structure', percentile: clamp(p - 2) },
      { id: 'w', label: 'Word problems', percentile: clamp(p - 5) },
      { id: 'v', label: 'Visual structure', percentile: clamp(p + 4) },
    ];
  }
  if (assessmentId === 'verbal_reasoning') {
    return [
      { id: 'r', label: 'Reading comprehension', percentile: clamp(p + 2) },
      { id: 'i', label: 'Inference', percentile: clamp(p - 3) },
      { id: 'a', label: 'Argument analysis', percentile: clamp(p + 1) },
      { id: 'v', label: 'Vocabulary in context', percentile: clamp(p - 4) },
    ];
  }
  return [{ id: 'all', label: 'Overall performance', percentile: clamp(p) }];
}

export function strengthAndGrowth(rows: SubscoreRow[]): { strength: string; growth: string } {
  if (rows.length < 2) return { strength: rows[0]?.label ?? 'Performance', growth: 'Keep practicing across skills.' };
  const sorted = [...rows].sort((a, b) => b.percentile - a.percentile);
  return { strength: sorted[0].label, growth: sorted[sorted.length - 1].label };
}

export function nextAssessmentNudge(assessmentId: string): { title: string; subtitle: string; path: string } | null {
  const map: Record<string, { title: string; subtitle: string; path: string }> = {
    symbolic_reasoning: {
      title: 'Next: Verbal Reasoning',
      subtitle: 'Continue with reading and argument skills.',
      path: '/assessments/verbal_reasoning/tier/1/detail',
    },
    verbal_reasoning: {
      title: 'Next: Mathematical Reasoning',
      subtitle: 'Build on verbal with quantitative reasoning.',
      path: '/assessments/mathematical_reasoning/tier/1/detail',
    },
    mathematical_reasoning: {
      title: 'Next: Personality Assessment',
      subtitle: 'Short self-report — unlocks English & more.',
      path: '/assessments/personality_assessment/tier/1/detail',
    },
  };
  return map[assessmentId] ?? null;
}
