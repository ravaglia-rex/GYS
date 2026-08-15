/**
 * Wireframe-aligned copy and UI flags for the assessment lifecycle (7A - 7G).
 * Runtime may override stat values from AssessmentType tier config.
 */

import { ASSESSMENT_NAMES, LEVEL_CLEAR_THRESHOLD_PERCENT } from '../utils/assessmentGating';
import { canonicalAssessmentId } from '../utils/assessmentIdCompat';

export type AssessmentThemeMode = 'blue' | 'purple';

export type BeforeBeginIconKey = 'clock' | 'phone' | 'block' | 'bolt' | 'chart' | 'headphones' | 'mic' | 'seat';

export interface BeforeBeginItem {
  icon: BeforeBeginIconKey;
  text: string;
  /** Stronger visual weight for critical rules (e.g. forward-only answering). */
  emphasize?: boolean;
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

const FORWARD_ONLY_BEFORE: BeforeBeginItem = {
  icon: 'bolt',
  text: 'Forward only: after you answer a question and continue, you cannot go back to change it.',
  emphasize: true,
};

const ONE_SITTING_BEFORE: BeforeBeginItem = {
  icon: 'seat',
  text: 'Once started, you must complete this in one sitting. You cannot return to a question after you submit an answer.',
};

const analyticalReasoningBefore: BeforeBeginItem[] = [
  FORWARD_ONLY_BEFORE,
  { icon: 'clock', text: 'You have a fixed time once you start - the timer cannot be paused.' },
  { icon: 'block', text: 'No calculators, notes, or outside help.' },
  { icon: 'chart', text: 'National tier and percentile update weekly on Monday.' },
  ONE_SITTING_BEFORE,
];

const englishBefore: BeforeBeginItem[] = [
  FORWARD_ONLY_BEFORE,
  { icon: 'headphones', text: 'Use headphones for listening sections when possible.' },
  { icon: 'mic', text: 'Speaking sections need microphone access - allow browser permissions.' },
  { icon: 'phone', text: 'We strongly recommend a laptop or desktop for audio quality.' },
  ONE_SITTING_BEFORE,
  { icon: 'clock', text: 'Manage your time across reading, writing, listening, and speaking.' },
  { icon: 'block', text: 'No outside help during the exam.' },
];

export const ASSESSMENT_FLOW_UI: Record<string, AssessmentFlowDefinition> = {
  analytical_reasoning: {
    examOrdinal: 1,
    examTitleShort: 'Analytical Reasoning',
    heroSubtitle: 'Your first assessment',
    statGrid: [
      { label: 'Duration', value: '30 min' },
      { label: 'Questions', value: '32–40' },
      { label: 'Difficulty', value: 'Adaptive' },
      { label: 'Language', value: 'English' },
    ],
    bodyDescription:
      'This exam measures how you induce structure, apply transformation rules, reason about constraints, and evaluate competing models. No prior subject knowledge is required - only careful observation and reasoning. Most students answer 32 questions; some receive a short extension up to 40.',
    measuresTitle: 'What This Measures',
    measuresBullets: [
      'Pattern & Structure Induction',
      'Rule & Transformation Application',
      'Relational & Constraint Deduction',
      'Flexible Model Evaluation',
    ],
    beforeBegin: analyticalReasoningBefore,
    theme: 'blue',
    defaultQuestionInteraction: 'visual_mcq',
    useTimer: true,
    adaptiveForwardOnly: true,
  },
  verbal_reasoning: {
    examOrdinal: 2,
    examTitleShort: 'Verbal Reasoning',
    heroSubtitle: 'Reading and argument skills',
    statGrid: [
      { label: 'Duration', value: '40 min' },
      { label: 'Format', value: 'Multiple choice' },
      { label: 'Difficulty', value: 'Adaptive' },
      { label: 'Language', value: 'English' },
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
      FORWARD_ONLY_BEFORE,
      { icon: 'clock', text: 'The timer runs continuously - plan your pace.' },
      { icon: 'phone', text: 'Minimize distractions; you will need focused reading.' },
      { icon: 'block', text: 'No dictionaries, translators, or outside help.' },
      ONE_SITTING_BEFORE,
    ],
    theme: 'blue',
    defaultQuestionInteraction: 'passage_mcq',
    useTimer: true,
    adaptiveForwardOnly: true,
  },
  mathematical_reasoning: {
    examOrdinal: 3,
    examTitleShort: 'Mathematical Reasoning',
    heroSubtitle: 'Quantitative and logical thinking',
    statGrid: [
      { label: 'Duration', value: '40 min' },
      { label: 'Format', value: 'Multiple choice' },
      { label: 'Difficulty', value: 'Adaptive' },
      { label: 'Language', value: 'English' },
    ],
    bodyDescription:
      'Problems emphasize reasoning, structure, and quantitative insight. Visual grids and diagrams share the same layout as Analytical Reasoning items; word problems appear in your chosen language.',
    measuresTitle: 'What This Measures',
    measuresBullets: [
      'Quantitative reasoning',
      'Structure and relationships',
      'Problem decomposition',
      'Visual-mathematical patterns',
    ],
    beforeBegin: analyticalReasoningBefore.filter((b) => b.icon !== 'chart'),
    theme: 'blue',
    defaultQuestionInteraction: 'visual_mcq',
    useTimer: true,
    adaptiveForwardOnly: true,
  },
  english_proficiency: {
    examOrdinal: 6,
    examTitleShort: 'English Proficiency',
    heroSubtitle: 'Exam 6 • Pathways group',
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
    levelExclusiveBadge: 'Career Ready only',
    detailFooterFinePrint: 'Confirm microphone and speakers work before you begin.',
    defaultQuestionInteraction: 'listening_mcq',
    useTimer: true,
    adaptiveForwardOnly: false,
  },
  ai_literacy: {
    examOrdinal: 5,
    examTitleShort: 'AI Proficiency',
    heroSubtitle: 'Concepts, evaluation, and live task',
    statGrid: [
      { label: 'Duration', value: '60 min' },
      { label: 'Format', value: 'Mixed' },
      { label: 'Difficulty', value: 'Three levels' },
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
      ONE_SITTING_BEFORE,
    ],
    theme: 'blue',
    defaultQuestionInteraction: 'passage_mcq',
    useTimer: true,
    adaptiveForwardOnly: false,
  },
  comprehensive_personality: {
    examOrdinal: 4,
    examTitleShort: 'Personality and Interest',
    heroSubtitle: 'Exam 4 • Profile group',
    statGrid: [
      { label: 'Duration', value: '45 - 60 min' },
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
      {
        icon: 'chart',
        text: 'Results feed into college matching and into the ongoing counseling profile when you choose to share.',
      },
    ],
    theme: 'purple',
    levelExclusiveBadge: 'Stream Ready only',
    isComprehensivePersonality: true,
    comprehensiveExtra: {
      howDifferentTitle: 'How This Is Different',
      howDifferentItems: [
        { icon: 'brain', text: 'No right or wrong answers' },
        { icon: 'timer', text: 'No timer - work at your pace' },
        { icon: 'target', text: 'Feeds college matching and the ongoing counseling profile' },
      ],
      footerNote: 'Can be retaken once per year (policy may vary).',
    },
    detailFooterFinePrint: 'Estimated time: 45 - 60 minutes • Take breaks if needed.',
    defaultQuestionInteraction: 'likert',
    useTimer: false,
    adaptiveForwardOnly: false,
  },
  career_interest_inventory: {
    examOrdinal: 7,
    examTitleShort: 'Career Discovery',
    heroSubtitle: 'Exam 7 • Pathways group',
    statGrid: [
      { label: 'Duration', value: 'Flexible' },
      { label: 'Format', value: 'Self-report' },
      { label: 'Timer', value: 'None' },
      { label: 'Language', value: 'English' },
    ],
    bodyDescription:
      'Explores interests and career themes to complement personality and reasoning signals. There is no timer; answer honestly for better guidance and counseling follow-up.',
    measuresTitle: 'What This Supports',
    measuresBullets: [
      'Interest clusters and career themes',
      'Stream and pathway exploration',
      'Inputs for longitudinal counseling',
    ],
    beforeBegin: [
      { icon: 'bolt', text: 'No right or wrong answers - candor improves recommendations.' },
      { icon: 'chart', text: 'Pairs with Career Ready counseling when you opt in.' },
    ],
    theme: 'purple',
    levelExclusiveBadge: 'Career Ready only',
    detailFooterFinePrint: 'Complete English Proficiency first when prompted.',
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
  const id = canonicalAssessmentId(assessmentId);
  return ASSESSMENT_FLOW_UI[id] ?? { ...DEFAULT_FLOW, examTitleShort: ASSESSMENT_NAMES[id] ?? 'Assessment' };
}

/** @deprecated Do not use for UI - invents a fake “percentile” from raw score. National percentiles come from the Monday pipeline. */
export function estimatedPercentileFromScore(scorePercent: number): number {
  return Math.min(99, Math.max(5, Math.round(12 + scorePercent * 0.82)));
}

/** @deprecated Do not use for UI - invents Gold/Silver/Bronze from raw score. Real achievement tiers come from the Monday national ranking. */
export function performanceTierFromScore(scorePercent: number): { label: string; tone: 'gold' | 'silver' | 'bronze' } {
  if (scorePercent >= LEVEL_CLEAR_THRESHOLD_PERCENT) return { label: 'Gold Tier', tone: 'gold' };
  if (scorePercent >= 55) return { label: 'Silver Tier', tone: 'silver' };
  return { label: 'Bronze Tier', tone: 'bronze' };
}

/**
 * Labels for items newly available after finishing this attempt.
 * Example after Analytical L1 pass: Analytical Reasoning Level 2, Verbal Reasoning Level 1.
 */
export function unlockedItemsAfterAttempt(params: {
  assessmentId: string;
  completedTier: number;
  passed: boolean;
  nextTier: number | null | undefined;
}): string[] {
  const { assessmentId, completedTier, passed, nextTier } = params;
  const id = canonicalAssessmentId(assessmentId);
  const name = ASSESSMENT_NAMES[id] ?? id;
  const items: string[] = [];

  if (passed && nextTier != null) {
    items.push(`${name} Level ${nextTier}`);
  }

  // Competitive sequence: finishing Analytical L1 unlocks Verbal L1 (attempt also unlocks Verbal).
  if (id === 'analytical_reasoning' && completedTier === 1) {
    items.push(`${ASSESSMENT_NAMES.verbal_reasoning} Level 1`);
  }
  if (id === 'verbal_reasoning' && completedTier === 1) {
    items.push(`${ASSESSMENT_NAMES.mathematical_reasoning} Level 1`);
  }

  return items;
}

/** @deprecated Prefer {@link unlockedItemsAfterAttempt}. */
export function unlockNoticeForAssessment(assessmentId: string, passed: boolean): string | null {
  if (!passed) return null;
  const items = unlockedItemsAfterAttempt({
    assessmentId,
    completedTier: 1,
    passed: true,
    nextTier: 2,
  });
  return items.length > 0 ? items.join('; ') : null;
}
