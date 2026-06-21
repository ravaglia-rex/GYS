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
      qotd_streak: { current: 0, longest: 0 },
      redemptions: {},
    };
  }
  const g = raw as Record<string, unknown>;
  const login = (g.login_streak ?? {}) as Record<string, unknown>;
  const qotd = (g.qotd_streak ?? {}) as Record<string, unknown>;
  const qotdAnsweredDate =
    readDateStringField(qotd.last_answered_date) ??
    readDateStringField(g.qotd_last_answered_date);
  return {
    argus_coins: typeof g.argus_coins === 'number' ? g.argus_coins : 0,
    coins_lifetime_earned: typeof g.coins_lifetime_earned === 'number' ? g.coins_lifetime_earned : 0,
    login_streak: {
      current: typeof login.current === 'number' ? login.current : 0,
      longest: typeof login.longest === 'number' ? login.longest : 0,
      last_active_date: typeof login.last_active_date === 'string' ? login.last_active_date : undefined,
    },
    qotd_streak: {
      current: typeof qotd.current === 'number' ? qotd.current : 0,
      longest: typeof qotd.longest === 'number' ? qotd.longest : 0,
      last_answered_date: qotdAnsweredDate,
      last_correct_date: typeof qotd.last_correct_date === 'string' ? qotd.last_correct_date : undefined,
    },
    qotd_last_answered_date: qotdAnsweredDate,
    qotd_last_result: g.qotd_last_result as GamificationState['qotd_last_result'],
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
    return 'Complete a full practice set to earn weekly Argus coins.';
  }
  return null;
}
