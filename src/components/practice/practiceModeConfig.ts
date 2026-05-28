import type { AssessmentType, ExamQuestion } from '../../db/assessmentCollection';
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

/** Reasoning triad: full-page interactive practice (practice_bank API + PracticeTakePage). */
export const INTERACTIVE_PRACTICE_EXAM_IDS = [
  'symbolic_reasoning',
  'verbal_reasoning',
  'mathematical_reasoning',
] as const;

const INTERACTIVE_PRACTICE_EXAM_SET = new Set<string>(INTERACTIVE_PRACTICE_EXAM_IDS);

export function isInteractivePracticeExam(examId: string): boolean {
  return INTERACTIVE_PRACTICE_EXAM_SET.has(examId);
}

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
      return 'Classes 6–7';
    case 2:
      return 'Classes 8–9';
    case 3:
      return 'Classes 10–12';
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

/** Last exam + level the student used on the practice hub (restored after a session). */
export interface PracticeHubSelection {
  examId: string;
  level: PracticeLevel;
}

interface PracticeModePersisted {
  v: 1;
  completedByKey: Record<string, number>;
  activeSession: PracticeActiveSession | null;
  lastSelection: PracticeHubSelection | null;
}

const STORAGE_KEY_PREFIX = 'argus_practice_mode_v1_';

function key(scope: string): string {
  return `${STORAGE_KEY_PREFIX}${scope}`;
}

function load(scope: string): PracticeModePersisted {
  try {
    const raw = localStorage.getItem(key(scope));
    if (!raw) {
      return { v: 1, completedByKey: {}, activeSession: null, lastSelection: null };
    }
    const parsed = JSON.parse(raw) as Partial<PracticeModePersisted>;
    if (parsed.v !== 1 || typeof parsed.completedByKey !== 'object' || parsed.completedByKey == null) {
      return { v: 1, completedByKey: {}, activeSession: null, lastSelection: null };
    }
    const lastSelection = parsePracticeHubSelection(parsed.lastSelection);
    return {
      v: 1,
      completedByKey: { ...parsed.completedByKey },
      activeSession:
        parsed.activeSession &&
        typeof parsed.activeSession.examId === 'string' &&
        [1, 2, 3].includes(parsed.activeSession.level as number)
          ? parsed.activeSession
          : null,
      lastSelection,
    };
  } catch {
    return { v: 1, completedByKey: {}, activeSession: null, lastSelection: null };
  }
}

function parsePracticeHubSelection(raw: unknown): PracticeHubSelection | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const examId = typeof o.examId === 'string' ? o.examId.trim() : '';
  const level = o.level;
  if (!examId || !(level === 1 || level === 2 || level === 3)) return null;
  return { examId, level };
}

export function getLastPracticeSelection(scope: string): PracticeHubSelection | null {
  return load(scope).lastSelection;
}

export function saveLastPracticeSelection(scope: string, selection: PracticeHubSelection): void {
  const persisted = load(scope);
  persisted.lastSelection = selection;
  save(scope, persisted);
}

export function isValidPracticeHubSelection(
  selection: PracticeHubSelection,
  gate: PracticeAssessmentGateInput | undefined,
  progressByExam: Record<string, AssessmentProgress | { proficiency_tier?: number }> | undefined,
  officialTierCountByExam: Record<string, number> | undefined
): boolean {
  if (!(PRACTICE_ELIGIBLE_EXAM_IDS as readonly string[]).includes(selection.examId)) return false;
  if (gate && !practiceExamIsUnlocked(selection.examId, gate)) return false;
  const maxLevel =
    progressByExam != null
      ? maxUnlockedPracticeLevel(
          progressByExam[selection.examId],
          officialTierCountByExam?.[selection.examId] ?? 3
        )
      : 1;
  return selection.level >= 1 && selection.level <= maxLevel;
}

export function defaultPracticeHubSelection(
  gate: PracticeAssessmentGateInput | undefined,
  grade: number,
  progressByExam?: Record<string, AssessmentProgress | { proficiency_tier?: number }>,
  officialTierCountByExam?: Record<string, number>
): PracticeHubSelection {
  const examId = firstUnlockedPracticeEligibleExamId(gate);
  const max0 =
    progressByExam != null
      ? maxUnlockedPracticeLevel(
          progressByExam[examId],
          officialTierCountByExam?.[examId] ?? 3
        )
      : 1;
  const level = Math.min(recommendedPracticeLevel(grade), max0) as PracticeLevel;
  return { examId, level };
}

/** Prefer navigation state, then persisted hub selection, then program defaults. */
export function resolvePracticeHubSelection(
  scope: string,
  gate: PracticeAssessmentGateInput | undefined,
  grade: number,
  progressByExam?: Record<string, AssessmentProgress | { proficiency_tier?: number }>,
  officialTierCountByExam?: Record<string, number>,
  override?: PracticeHubSelection | null
): PracticeHubSelection {
  const candidates = [override, getLastPracticeSelection(scope)];
  for (const candidate of candidates) {
    if (
      candidate &&
      isValidPracticeHubSelection(candidate, gate, progressByExam, officialTierCountByExam)
    ) {
      return candidate;
    }
  }
  return defaultPracticeHubSelection(gate, grade, progressByExam, officialTierCountByExam);
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

// ─── Full-page practice session (question batch + cursor) — interactive exams only ─────────

const TAKE_SESSION_PREFIX = 'argus_practice_take_v1_';

/** Firestore doc id for outcomes/reports; bank payloads may carry a bad/null `id` that must not win. */
export function resolvePracticeItemId(q: ExamQuestion | null | undefined): string | undefined {
  if (!q) return undefined;
  const id = q.id as unknown;
  if (typeof id === 'string' && id.trim().length > 0) return id.trim();
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  const legacy = (q as { item_id?: unknown }).item_id;
  if (typeof legacy === 'string' && legacy.trim().length > 0) return legacy.trim();
  if (typeof legacy === 'number' && Number.isFinite(legacy)) return String(legacy);
  return undefined;
}

function takeSessionStorageKey(scope: string, examId: string, level: PracticeLevel): string {
  return `${TAKE_SESSION_PREFIX}${scope}_${examId}_L${level}`;
}

/** Answers already submitted locally for this batch (synced to Firestore when the session completes). */
export interface PracticeTakePendingOutcome {
  itemId: string;
  selectedOptionIndex: number;
  timeToFirstCheckMs: number;
}

/** Replace an existing row for the same item, or append — avoids duplicate counts when revisiting questions. */
export function upsertPracticePendingOutcome(
  outcomes: PracticeTakePendingOutcome[],
  row: PracticeTakePendingOutcome
): PracticeTakePendingOutcome[] {
  const i = outcomes.findIndex((o) => o.itemId === row.itemId);
  if (i >= 0) {
    const next = outcomes.slice();
    next[i] = row;
    return next;
  }
  return [...outcomes, row];
}

/** Keep the latest answer per item (e.g. after resuming a corrupted local session). */
export function dedupePracticePendingOutcomes(
  outcomes: PracticeTakePendingOutcome[]
): PracticeTakePendingOutcome[] {
  const byId = new Map<string, PracticeTakePendingOutcome>();
  for (const o of outcomes) {
    byId.set(o.itemId, o);
  }
  return Array.from(byId.values());
}

export interface PracticeSessionResultRow {
  item_id: string;
  selected_option_index: number;
  time_to_first_check_ms: number;
}

/** Outcomes for API submit, one row per question in the current batch (deduped, in question order). */
export function buildPracticeSessionResults(
  questions: ExamQuestion[],
  pending: PracticeTakePendingOutcome[]
): PracticeSessionResultRow[] {
  const byId = new Map(
    dedupePracticePendingOutcomes(pending).map((o) => [o.itemId, o] as const)
  );
  const results: PracticeSessionResultRow[] = [];
  for (const q of questions) {
    const itemId = resolvePracticeItemId(q);
    if (!itemId) continue;
    const row = byId.get(itemId);
    if (!row) continue;
    results.push({
      item_id: row.itemId,
      selected_option_index: row.selectedOptionIndex,
      time_to_first_check_ms: row.timeToFirstCheckMs,
    });
  }
  return results;
}

interface PracticeTakePersistedV1 {
  v: 1;
  examId: string;
  level: PracticeLevel;
  questions: ExamQuestion[];
  index: number;
  totalInLevel?: number;
  pendingOutcomes?: PracticeTakePendingOutcome[];
}

function parsePendingOutcomes(raw: unknown): PracticeTakePendingOutcome[] {
  if (!Array.isArray(raw)) return [];
  const out: PracticeTakePendingOutcome[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const itemId = typeof o.itemId === 'string' ? o.itemId.trim() : '';
    const sel = o.selectedOptionIndex;
    const t = o.timeToFirstCheckMs;
    if (
      !itemId ||
      typeof sel !== 'number' ||
      !Number.isInteger(sel) ||
      sel < 0 ||
      sel > 3 ||
      typeof t !== 'number' ||
      !Number.isFinite(t) ||
      t < 0
    ) {
      continue;
    }
    out.push({ itemId, selectedOptionIndex: sel, timeToFirstCheckMs: Math.floor(t) });
  }
  return dedupePracticePendingOutcomes(out);
}

/** Persist the drawn practice batch and position so Resume continues unanswered items (same batch). */
export function savePracticeTakeSession(
  scope: string,
  examId: string,
  level: PracticeLevel,
  payload: {
    questions: ExamQuestion[];
    index: number;
    totalInLevel?: number;
    pendingOutcomes?: PracticeTakePendingOutcome[];
  }
): void {
  try {
    const data: PracticeTakePersistedV1 = {
      v: 1,
      examId,
      level,
      questions: payload.questions,
      index: payload.index,
      totalInLevel: payload.totalInLevel,
      ...(payload.pendingOutcomes && payload.pendingOutcomes.length > 0
        ? { pendingOutcomes: payload.pendingOutcomes }
        : {}),
    };
    localStorage.setItem(takeSessionStorageKey(scope, examId, level), JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function loadPracticeTakeSession(
  scope: string,
  examId: string,
  level: PracticeLevel
): {
  questions: ExamQuestion[];
  index: number;
  totalInLevel?: number;
  pendingOutcomes: PracticeTakePendingOutcome[];
} | null {
  try {
    const raw = localStorage.getItem(takeSessionStorageKey(scope, examId, level));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PracticeTakePersistedV1>;
    if (parsed.v !== 1 || parsed.examId !== examId || parsed.level !== level) return null;
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) return null;
    const idx =
      typeof parsed.index === 'number' && Number.isFinite(parsed.index)
        ? Math.max(0, Math.floor(parsed.index))
        : 0;
    if (idx >= parsed.questions.length) return null;
    return {
      questions: parsed.questions as ExamQuestion[],
      index: idx,
      totalInLevel: typeof parsed.totalInLevel === 'number' ? parsed.totalInLevel : undefined,
      pendingOutcomes: parsePendingOutcomes(parsed.pendingOutcomes),
    };
  } catch {
    return null;
  }
}

export function clearPracticeTakeSession(scope: string, examId: string, level: PracticeLevel): void {
  try {
    localStorage.removeItem(takeSessionStorageKey(scope, examId, level));
  } catch {
    /* ignore */
  }
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

export function resetLocalPracticeProgress(scope: string, examId: string, level: PracticeLevel): void {
  const persisted = load(scope);
  persisted.completedByKey[storageKeyForExamLevel(examId, level)] = 0;
  if (persisted.activeSession?.examId === examId && persisted.activeSession.level === level) {
    persisted.activeSession = null;
  }
  save(scope, persisted);
  clearPracticeTakeSession(scope, examId, level);
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
