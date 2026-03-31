/**
 * Wireframe-aligned copy and UI flags for the assessment lifecycle (7A–7G).
 * Runtime may override stat values from AssessmentType tier config.
 */

import { ASSESSMENT_NAMES } from '../utils/assessmentGating';

export type AssessmentThemeMode = 'blue' | 'purple';

export type BeforeBeginIconKey = 'clock' | 'phone' | 'block' | 'bolt' | 'chart' | 'headphones' | 'mic';

export interface BeforeBeginItem {
  icon: BeforeBeginIconKey;
  text: string;
}

export interface StatCell {
  label: string;
  value: string;
}

export interface AssessmentFlowDefinition {
  examOrdinal: number;
  examTitleShort: string;
  heroSubtitle: string;
  /** Four cells for the 2×2 grid */
  statGrid: StatCell[];
  bodyDescription: string;
  measuresTitle: string;
  measuresBullets: string[];
  beforeBegin: BeforeBeginItem[];
  theme: AssessmentThemeMode;
  levelExclusiveBadge?: string;
  isComprehensivePersonality?: boolean;
  comprehensiveExtra?: {
    howDifferentTitle: string;
    howDifferentItems: { icon: 'brain' | 'timer' | 'target'; text: string }[];
    footerNote: string;
  };
  /** Optional fine print under primary CTA */
  detailFooterFinePrint?: string;
  defaultQuestionInteraction: 'visual_mcq' | 'passage_mcq' | 'likert' | 'listening_mcq';
  useTimer: boolean;
  adaptiveForwardOnly: boolean;
}

const symbolicBefore: BeforeBeginItem[] = [
  { icon: 'clock', text: 'You have a fixed time once you start - the timer cannot be paused.' },
  { icon: 'block', text: 'No calculators, notes, or outside help.' },
  { icon: 'chart', text: 'Your score is compared to students worldwide.' },
  { icon: 'phone', text: 'Find a quiet place with no distractions.' },
  { icon: 'bolt', text: 'Questions get harder as you answer correctly (adaptive).' },
];

const englishBefore: BeforeBeginItem[] = [
  { icon: 'headphones', text: 'Use headphones for listening sections when possible.' },
  { icon: 'mic', text: 'Speaking sections need microphone access - allow browser permissions.' },
  { icon: 'phone', text: 'We strongly recommend a laptop or desktop for audio quality.' },
  { icon: 'clock', text: 'Manage your time across reading, writing, listening, and speaking.' },
  { icon: 'block', text: 'No outside help during the exam.' },
];

export const ASSESSMENT_FLOW_UI: Record<string, AssessmentFlowDefinition> = {
  symbolic_reasoning: {
    examOrdinal: 1,
    examTitleShort: 'Symbolic Reasoning',
    heroSubtitle: 'Your first assessment',
    statGrid: [
      { label: 'Duration', value: '45 min' },
      { label: 'Questions', value: '20' },
      { label: 'Difficulty', value: 'Adaptive' },
      { label: 'Language', value: 'Language-free' },
    ],
    bodyDescription:
      'This exam measures how you identify patterns, sequences, and abstract relationships. No reading or language knowledge is required - only careful observation and reasoning.',
    measuresTitle: 'What This Measures',
    measuresBullets: [
      'Pattern recognition & completion',
      'Abstract sequence reasoning',
      'Spatial relationship processing',
      'Non-verbal problem solving',
    ],
    beforeBegin: symbolicBefore,
    theme: 'blue',
    detailFooterFinePrint: 'Once started, you must complete this in one sitting.',
    defaultQuestionInteraction: 'visual_mcq',
    useTimer: true,
    adaptiveForwardOnly: true,
  },
  verbal_reasoning: {
    examOrdinal: 2,
    examTitleShort: 'Verbal Reasoning',
    heroSubtitle: 'Reading and argument skills',
    statGrid: [
      { label: 'Duration', value: '30 min' },
      { label: 'Questions', value: '25' },
      { label: 'Difficulty', value: 'Adaptive' },
      { label: 'Language', value: 'Your selected language' },
    ],
    bodyDescription:
      'You will read short passages and answer questions about meaning, inference, and author intent. All content is in the language you chose for this exam.',
    measuresTitle: 'What This Measures',
    measuresBullets: [
      'Reading comprehension',
      'Inference and implication',
      'Argument structure',
      'Vocabulary in context',
    ],
    beforeBegin: [
      { icon: 'clock', text: 'The timer runs continuously - plan your pace.' },
      { icon: 'phone', text: 'Minimize distractions; you will need focused reading.' },
      { icon: 'block', text: 'No dictionaries, translators, or outside help.' },
    ],
    theme: 'blue',
    detailFooterFinePrint: 'Once started, you must complete this in one sitting.',
    defaultQuestionInteraction: 'passage_mcq',
    useTimer: true,
    adaptiveForwardOnly: true,
  },
  mathematical_reasoning: {
    examOrdinal: 3,
    examTitleShort: 'Mathematical Reasoning',
    heroSubtitle: 'Quantitative and logical thinking',
    statGrid: [
      { label: 'Duration', value: '35 min' },
      { label: 'Questions', value: '28' },
      { label: 'Difficulty', value: 'Adaptive' },
      { label: 'Language', value: 'Your selected language' },
    ],
    bodyDescription:
      'Problems emphasize reasoning, structure, and quantitative insight. Visual grids and diagrams share the same layout as symbolic items; word problems appear in your chosen language.',
    measuresTitle: 'What This Measures',
    measuresBullets: [
      'Quantitative reasoning',
      'Structure and relationships',
      'Problem decomposition',
      'Visual-mathematical patterns',
    ],
    beforeBegin: symbolicBefore.filter((b) => b.icon !== 'chart'),
    theme: 'blue',
    detailFooterFinePrint: 'Once started, you must complete this in one sitting.',
    defaultQuestionInteraction: 'visual_mcq',
    useTimer: true,
    adaptiveForwardOnly: true,
  },
  personality_assessment: {
    examOrdinal: 4,
    examTitleShort: 'Personality Assessment',
    heroSubtitle: 'Self-report - no wrong answers',
    statGrid: [
      { label: 'Duration', value: 'No limit' },
      { label: 'Questions', value: '40' },
      { label: 'Format', value: 'Likert scale' },
      { label: 'Language', value: 'Your selected language' },
    ],
    bodyDescription:
      'Honest responses help us understand how you learn and work. There are no trick questions and no timed pressure.',
    measuresTitle: 'What This Covers',
    measuresBullets: [
      'Goal orientation and persistence',
      'Openness to new ideas',
      'Collaboration preferences',
      'Stress and motivation patterns',
    ],
    beforeBegin: [
      { icon: 'bolt', text: 'There are no right or wrong answers - choose what fits you best.' },
      { icon: 'phone', text: 'Answer based on how you usually are, not how you wish to be seen.' },
    ],
    theme: 'purple',
    defaultQuestionInteraction: 'likert',
    useTimer: false,
    adaptiveForwardOnly: false,
  },
  english_proficiency: {
    examOrdinal: 5,
    examTitleShort: 'English Proficiency',
    heroSubtitle: 'Reading, writing, listening & speaking',
    statGrid: [
      { label: 'Duration', value: 'Varies' },
      { label: 'Sections', value: '4 skills' },
      { label: 'Difficulty', value: 'CEFR-aligned' },
      { label: 'Language', value: 'English only' },
    ],
    bodyDescription:
      'This assessment is entirely in English. Listening and speaking sections need working audio output and a microphone. Use a laptop or desktop for the best experience.',
    measuresTitle: 'What This Measures',
    measuresBullets: [
      'Reading and writing in English',
      'Listening comprehension',
      'Spoken communication',
      'Integrated skills',
    ],
    beforeBegin: englishBefore,
    theme: 'blue',
    detailFooterFinePrint: 'Confirm microphone and speakers work before you begin.',
    defaultQuestionInteraction: 'listening_mcq',
    useTimer: true,
    adaptiveForwardOnly: false,
  },
  ai_literacy: {
    examOrdinal: 6,
    examTitleShort: 'AI Literacy & Capability',
    heroSubtitle: 'Concepts, evaluation, and live task',
    statGrid: [
      { label: 'Duration', value: '60 min' },
      { label: 'Format', value: 'Mixed' },
      { label: 'Difficulty', value: 'Tiered' },
      { label: 'Language', value: 'English' },
    ],
    bodyDescription:
      'Sections cover AI concepts, evaluating outputs, a live sandboxed task, and reflection. A laptop or desktop is recommended for the interactive portion.',
    measuresTitle: 'What This Measures',
    measuresBullets: [
      'Core AI concepts',
      'Critical evaluation of outputs',
      'Responsible use of tools',
      'Applied problem solving',
    ],
    beforeBegin: [
      { icon: 'phone', text: 'Use a laptop or desktop for the live AI task when possible.' },
      { icon: 'clock', text: 'Allow enough uninterrupted time to complete all sections.' },
    ],
    theme: 'blue',
    detailFooterFinePrint: 'Once started, plan to complete in one sitting.',
    defaultQuestionInteraction: 'passage_mcq',
    useTimer: true,
    adaptiveForwardOnly: false,
  },
  comprehensive_personality: {
    examOrdinal: 7,
    examTitleShort: 'Comprehensive Personality',
    heroSubtitle: 'Exam 7 • The deep-dive assessment',
    statGrid: [
      { label: 'Duration', value: '45–60 min' },
      { label: 'Dimensions', value: '~30' },
      { label: 'Questions', value: '~200' },
      { label: 'Timer', value: 'None' },
    ],
    bodyDescription:
      'Our most comprehensive self-report instrument maps many dimensions for college matching and career guidance. There is no timer - take breaks if you need them.',
    measuresTitle: 'What This Maps',
    measuresBullets: [
      'Intellectual curiosity & openness',
      'Risk tolerance and decision style',
      'Leadership & motivation profiles',
      'Values and interpersonal style',
    ],
    beforeBegin: [
      { icon: 'bolt', text: 'No right or wrong answers - honesty improves your guidance.' },
      { icon: 'chart', text: 'Results feed into college matching and counselor conversations.' },
    ],
    theme: 'purple',
    levelExclusiveBadge: 'LEVEL 3 EXCLUSIVE',
    isComprehensivePersonality: true,
    comprehensiveExtra: {
      howDifferentTitle: 'How This Is Different',
      howDifferentItems: [
        { icon: 'brain', text: 'No right or wrong answers' },
        { icon: 'timer', text: 'No timer - work at your pace' },
        { icon: 'target', text: 'Feeds college matching & counseling' },
      ],
      footerNote: 'Can be retaken once per year (policy may vary).',
    },
    detailFooterFinePrint: 'Estimated time: 45–60 minutes • Take breaks if needed.',
    defaultQuestionInteraction: 'likert',
    useTimer: false,
    adaptiveForwardOnly: false,
  },
};

const DEFAULT_FLOW: AssessmentFlowDefinition = {
  examOrdinal: 0,
  examTitleShort: 'Assessment',
  heroSubtitle: '',
  statGrid: [
    { label: 'Duration', value: '-' },
    { label: 'Questions', value: '-' },
    { label: 'Difficulty', value: '-' },
    { label: 'Language', value: '-' },
  ],
  bodyDescription: '',
  measuresTitle: 'What This Measures',
  measuresBullets: [],
  beforeBegin: [],
  theme: 'blue',
  defaultQuestionInteraction: 'visual_mcq',
  useTimer: true,
  adaptiveForwardOnly: false,
};

export function getAssessmentFlowDefinition(assessmentId: string): AssessmentFlowDefinition {
  return ASSESSMENT_FLOW_UI[assessmentId] ?? { ...DEFAULT_FLOW, examTitleShort: ASSESSMENT_NAMES[assessmentId] ?? 'Assessment' };
}

export function estimatedPercentileFromScore(scorePercent: number): number {
  return Math.min(99, Math.max(5, Math.round(12 + scorePercent * 0.82)));
}

export function performanceTierFromScore(scorePercent: number): { label: string; tone: 'gold' | 'silver' | 'bronze' } {
  if (scorePercent >= 75) return { label: 'Gold Tier', tone: 'gold' };
  if (scorePercent >= 55) return { label: 'Silver Tier', tone: 'silver' };
  return { label: 'Bronze Tier', tone: 'bronze' };
}

/** Short unlock line after a passed tier (gamification / 7C). */
export function unlockNoticeForAssessment(assessmentId: string, passed: boolean): string | null {
  if (!passed) return null;
  switch (assessmentId) {
    case 'symbolic_reasoning':
      return 'Verbal Reasoning and Mathematical Reasoning are now available (within your membership).';
    case 'verbal_reasoning':
    case 'mathematical_reasoning':
      return 'Continue the sequence - Personality and English assessments unlock when prerequisites are complete.';
    case 'personality_assessment':
      return 'English Proficiency and further assessments may unlock next - check your dashboard.';
    default:
      return null;
  }
}
