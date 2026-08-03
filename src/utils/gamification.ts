import type { GamificationState } from '../db/gamificationCollection';

export function istDateStringClient(date: Date = new Date()): string {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readDateStringField(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return istDateStringClient((value as { toDate: () => Date }).toDate());
  }
  if (
    value &&
    typeof value === 'object' &&
    ('seconds' in value || '_seconds' in value)
  ) {
    const sec =
      typeof (value as { seconds?: number }).seconds === 'number'
        ? (value as { seconds: number }).seconds
        : typeof (value as { _seconds?: number })._seconds === 'number'
          ? (value as { _seconds: number })._seconds
          : null;
    if (sec != null) return istDateStringClient(new Date(sec * 1000));
  }
  return undefined;
}

export function readGamificationFromStudent(student: Record<string, unknown> | null | undefined): GamificationState {
  const raw = student?.gamification;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      argus_coins: 0,
      coins_lifetime_earned: 0,
      login_streak: { current: 0, longest: 0 },
      qod_streak: { current: 0, longest: 0 },
      qod_attempted_total: 0,
      qod_correct_total: 0,
      qod_accuracy_pct: 0,
      practice_sessions_total: 0,
      practice_questions_total: 0,
      practice_correct_total: 0,
      practice_accuracy_pct: 0,
      practice_coins_earned_total: 0,
      redemptions: {},
    };
  }
  const g = raw as Record<string, unknown>;
  const login = (g.login_streak ?? {}) as Record<string, unknown>;
  const qod = (g.qod_streak ?? g['qotd_streak'] ?? {}) as Record<string, unknown>;
  const qodAnsweredDate =
    readDateStringField(qod.last_answered_date) ??
    readDateStringField(g.qod_last_answered_date) ??
    readDateStringField(g['qotd_last_answered_date']);
  const attempted =
    typeof g.qod_attempted_total === 'number' && g.qod_attempted_total > 0
      ? Math.floor(g.qod_attempted_total)
      : 0;
  const correctTotal =
    typeof g.qod_correct_total === 'number' && g.qod_correct_total > 0
      ? Math.floor(g.qod_correct_total)
      : 0;
  const storedAccuracy =
    typeof g.qod_accuracy_pct === 'number' && Number.isFinite(g.qod_accuracy_pct)
      ? g.qod_accuracy_pct
      : null;
  return {
    argus_coins: typeof g.argus_coins === 'number' ? g.argus_coins : 0,
    coins_lifetime_earned: typeof g.coins_lifetime_earned === 'number' ? g.coins_lifetime_earned : 0,
    login_streak: {
      current: typeof login.current === 'number' ? login.current : 0,
      longest: typeof login.longest === 'number' ? login.longest : 0,
      last_active_date: typeof login.last_active_date === 'string' ? login.last_active_date : undefined,
    },
    qod_streak: {
      current: typeof qod.current === 'number' ? qod.current : 0,
      longest: typeof qod.longest === 'number' ? qod.longest : 0,
      last_answered_date: qodAnsweredDate,
      last_correct_date: typeof qod.last_correct_date === 'string' ? qod.last_correct_date : undefined,
    },
    qod_attempted_total: attempted,
    qod_correct_total: correctTotal,
    qod_accuracy_pct:
      storedAccuracy ?? (attempted > 0 ? Math.round((1000 * correctTotal) / attempted) / 10 : 0),
    qod_last_answered_date: qodAnsweredDate,
    qod_last_result: (g.qod_last_result ?? g['qotd_last_result']) as GamificationState['qod_last_result'],
    practice_sessions_total:
      typeof g.practice_sessions_total === 'number' && g.practice_sessions_total > 0
        ? Math.floor(g.practice_sessions_total)
        : 0,
    practice_questions_total:
      typeof g.practice_questions_total === 'number' && g.practice_questions_total > 0
        ? Math.floor(g.practice_questions_total)
        : 0,
    practice_correct_total:
      typeof g.practice_correct_total === 'number' && g.practice_correct_total > 0
        ? Math.floor(g.practice_correct_total)
        : 0,
    practice_accuracy_pct:
      typeof g.practice_accuracy_pct === 'number' && Number.isFinite(g.practice_accuracy_pct)
        ? g.practice_accuracy_pct
        : 0,
    practice_coins_earned_total:
      typeof g.practice_coins_earned_total === 'number' && g.practice_coins_earned_total > 0
        ? Math.floor(g.practice_coins_earned_total)
        : 0,
    practice_last_awarded_week: typeof g.practice_last_awarded_week === 'string' ? g.practice_last_awarded_week : undefined,
    redemptions: (g.redemptions ?? {}) as GamificationState['redemptions'],
  };
}

export function practiceCoinsNotEarnedMessage(reason: string | null | undefined): string | null {
  if (reason === 'honesty') {
    return 'Argus coins not earned - it looks like the questions may not have been attempted thoughtfully. Take your time on each question next session!';
  }
  if (reason === 'weekly_cap') {
    return 'You already earned your weekly practice coins. Come back next week for another reward!';
  }
  if (reason === 'insufficient_questions') {
    return 'Answer all 10 questions in a practice set to earn weekly Argus coins.';
  }
  return null;
}
