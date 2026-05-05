import type { AssessmentType } from '../../db/assessmentCollection';
import {
  ASSESSMENT_NAMES,
  ASSESSMENT_ORDER,
  computeGate,
  type AssessmentProgress,
  type GateResult,
} from '../../utils/assessmentGating';

/** Same inputs as dashboard {@link computeGate} - membership + official prerequisites. */
export interface PracticeAssessmentGateInput {
  membershipLevel: number;
  grade: number;
  assessments: AssessmentType[];
  progress: Record<string, AssessmentProgress>;
}

export function practiceExamGate(examId: string, gate: PracticeAssessmentGateInput): GateResult {
  return computeGate(examId, gate.membershipLevel, gate.progress, gate.grade, gate.assessments);
}

export function practiceExamIsUnlocked(examId: string, gate: PracticeAssessmentGateInput): boolean {
  return !practiceExamGate(examId, gate).locked;
}

/** Exams 1–5 have skill-based practice pools. Exams 6–7 are profile-style (no practice pool). */
export const PRACTICE_ELIGIBLE_EXAM_IDS = ASSESSMENT_ORDER.slice(0, 5) as readonly string[];

export const NON_PRACTICE_EXAM_IDS = ASSESSMENT_ORDER.slice(5, 7) as readonly string[];

/** First practice-eligible exam the student may access (same order as Step 1 cards). */
export function firstUnlockedPracticeEligibleExamId(gate: PracticeAssessmentGateInput | undefined): string {
  if (!gate) return PRACTICE_ELIGIBLE_EXAM_IDS[0];
  for (const id of PRACTICE_ELIGIBLE_EXAM_IDS) {
    if (practiceExamIsUnlocked(id, gate)) return id;
  }
  return PRACTICE_ELIGIBLE_EXAM_IDS[0];
}

export function practiceExamLockedTooltip(gateResult: GateResult): string {
  if (!gateResult.locked) return '';
  if (gateResult.reason === 'membership') {
    return 'Upgrade your programme tier to unlock practice for this exam.';
  }
  if (gateResult.reason === 'prerequisite' && gateResult.missingPrerequisite) {
    const name = ASSESSMENT_NAMES[gateResult.missingPrerequisite] ?? gateResult.missingPrerequisite;
    return `Finish the official unlock path through ${name} before you can practice here.`;
  }
  return 'This exam is not available for practice yet.';
}

export type PracticeLevel = 1 | 2 | 3;

/** Placeholder pool sizes until the backend exposes counts (varied for realism). */
export const PRACTICE_POOL_BY_EXAM_LEVEL: Record<string, Record<PracticeLevel, number>> = {
  symbolic_reasoning: { 1: 185, 2: 165, 3: 150 },
  verbal_reasoning: { 1: 210, 2: 195, 3: 175 },
  mathematical_reasoning: { 1: 198, 2: 182, 3: 168 },
  english_proficiency: { 1: 220, 2: 205, 3: 190 },
  ai_literacy: { 1: 160, 2: 148, 3: 135 },
};

export function recommendedPracticeLevel(grade: number): PracticeLevel {
  const g = Number.isFinite(grade) ? grade : 8;
  if (g <= 7) return 1;
  if (g <= 9) return 2;
  return 3;
}

export function recommendedLevelLabel(level: PracticeLevel): string {
  switch (level) {
    case 1:
      return 'Grades 6–7';
    case 2:
      return 'Grades 8–9';
    case 3:
      return 'Grades 10–12';
    default:
      return '';
  }
}

/**
 * Highest practice difficulty this student may use for an exam, based on official tier unlocks.
 * `proficiency_tier` is 1-based (which official level is in focus). If you have advanced to
 * official level 2, you may practice at levels 1 and 2. After all official tiers are complete
 * (proficiency_tier greater than the number of official tiers), all three practice levels unlock.
 */
export function maxUnlockedPracticeLevel(
  progress: Partial<Pick<AssessmentProgress, 'proficiency_tier'>> | null | undefined,
  totalOfficialTiers: number
): PracticeLevel {
  const pt =
    typeof progress?.proficiency_tier === 'number' && !Number.isNaN(progress.proficiency_tier)
      ? progress.proficiency_tier
      : 1;
  const capTiers = totalOfficialTiers > 0 ? totalOfficialTiers : 3;
  if (pt > capTiers) {
    return 3;
  }
  return Math.min(3, Math.max(1, pt)) as PracticeLevel;
}

// ─── Local persistence (until practice API exists) ─────────────────────────────

export interface PracticeActiveSession {
  examId: string;
  level: PracticeLevel;
  startedAt: string;
}

interface PracticeModePersisted {
  v: 1;
  completedByKey: Record<string, number>;
  activeSession: PracticeActiveSession | null;
}

const STORAGE_KEY_PREFIX = 'argus_practice_mode_v1_';

function key(scope: string): string {
  return `${STORAGE_KEY_PREFIX}${scope}`;
}

function load(scope: string): PracticeModePersisted {
  try {
    const raw = localStorage.getItem(key(scope));
    if (!raw) {
      return { v: 1, completedByKey: {}, activeSession: null };
    }
    const parsed = JSON.parse(raw) as Partial<PracticeModePersisted>;
    if (parsed.v !== 1 || typeof parsed.completedByKey !== 'object' || parsed.completedByKey == null) {
      return { v: 1, completedByKey: {}, activeSession: null };
    }
    return {
      v: 1,
      completedByKey: { ...parsed.completedByKey },
      activeSession:
        parsed.activeSession &&
        typeof parsed.activeSession.examId === 'string' &&
        [1, 2, 3].includes(parsed.activeSession.level as number)
          ? parsed.activeSession
          : null,
    };
  } catch {
    return { v: 1, completedByKey: {}, activeSession: null };
  }
}

function save(scope: string, data: PracticeModePersisted): void {
  try {
    localStorage.setItem(key(scope), JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function storageKeyForExamLevel(examId: string, level: PracticeLevel): string {
  return `${examId}_L${level}`;
}

export function getPracticeStats(
  scope: string,
  examId: string,
  level: PracticeLevel,
  /** When set (e.g. practice_bank loaded from API), overrides placeholder PRACTICE_POOL_BY_EXAM_LEVEL. */
  livePoolByLevel?: Partial<Record<PracticeLevel, number>> | null
): {
  pool: number;
  completed: number;
  activeSession: PracticeActiveSession | null;
} {
  const persisted = load(scope);
  const staticPool = PRACTICE_POOL_BY_EXAM_LEVEL[examId]?.[level] ?? 0;
  const pool =
    livePoolByLevel != null && typeof livePoolByLevel[level] === 'number'
      ? livePoolByLevel[level]!
      : staticPool;
  const completed = persisted.completedByKey[storageKeyForExamLevel(examId, level)] ?? 0;
  return {
    pool,
    completed: Math.min(completed, pool),
    activeSession: persisted.activeSession,
  };
}

export function setActivePracticeSession(scope: string, session: PracticeActiveSession | null): void {
  const persisted = load(scope);
  persisted.activeSession = session;
  save(scope, persisted);
}

export function clearActivePracticeSession(scope: string): void {
  const persisted = load(scope);
  persisted.activeSession = null;
  save(scope, persisted);
}

/** Optional hook for when question engine lands - increments completed count for an exam/level. */
export function recordPracticeQuestionsCompleted(
  scope: string,
  examId: string,
  level: PracticeLevel,
  delta: number,
  poolCap?: number
): void {
  if (delta <= 0) return;
  const persisted = load(scope);
  const k = storageKeyForExamLevel(examId, level);
  const pool =
    poolCap != null && poolCap >= 0
      ? poolCap
      : PRACTICE_POOL_BY_EXAM_LEVEL[examId]?.[level] ?? 0;
  const prev = persisted.completedByKey[k] ?? 0;
  persisted.completedByKey[k] = Math.min(pool, prev + delta);
  save(scope, persisted);
}

export function getAssessmentDisplayName(id: string): string {
  return ASSESSMENT_NAMES[id] ?? id;
}

/** Card chrome aligned with programme assessment cards on the dashboard. */
export const PRACTICE_EXAM_CARD_STYLE: Record<
  string,
  { examNumber: number; gradient: string; accent: string }
> = {
  symbolic_reasoning: {
    examNumber: 1,
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    accent: '#8b5cf6',
  },
  verbal_reasoning: {
    examNumber: 2,
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    accent: '#3b82f6',
  },
  mathematical_reasoning: {
    examNumber: 3,
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    accent: '#10b981',
  },
  english_proficiency: {
    examNumber: 4,
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    accent: '#ef4444',
  },
  ai_literacy: {
    examNumber: 5,
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
    accent: '#06b6d4',
  },
};

export const NON_PRACTICE_EXAM_CARD_STYLE: Record<string, { examNumber: number; gradient: string }> = {
  comprehensive_personality: {
    examNumber: 6,
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.35) 0%, rgba(190,24,93,0.25) 100%)',
  },
  career_interest_inventory: {
    examNumber: 7,
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(109,40,217,0.25) 100%)',
  },
};
