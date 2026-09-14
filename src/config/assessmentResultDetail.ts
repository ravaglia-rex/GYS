/** Result detail helpers that do not invent fake national percentiles. */

export function nextAssessmentNudge(assessmentId: string): { title: string; subtitle: string; path: string } | null {
  const map: Record<string, { title: string; subtitle: string; path: string }> = {
    analytical_reasoning: {
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
      title: 'Next: Personality and Interest',
      subtitle: 'Profile group - unlocks after the reasoning triad with Stream Ready (Membership 2).',
      path: '/assessments/comprehensive_personality/tier/1/detail',
    },
    comprehensive_personality: {
      title: 'Next: AI Proficiency',
      subtitle: 'Continue the Profile group after personality.',
      path: '/assessments/ai_literacy/tier/1/detail',
    },
    ai_literacy: {
      title: 'Next: English Proficiency',
      subtitle: 'Pathways group - complete all AI Proficiency levels first; Career Ready membership required.',
      path: '/assessments/english_proficiency/tier/1/detail',
    },
    english_proficiency: {
      title: 'Next: Career Discovery',
      subtitle: 'Finish the Pathways group after English - Career Ready.',
      path: '/assessments/career_interest_inventory/tier/1/detail',
    },
  };
  return map[assessmentId] ?? null;
}
