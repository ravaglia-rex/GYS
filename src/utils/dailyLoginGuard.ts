import { istDateStringClient } from './gamification';

const STORAGE_PREFIX = 'argus:daily-login:v1:';

function storageKey(uid: string, istDate: string): string {
  return `${STORAGE_PREFIX}${uid}:${istDate}`;
}

function canUseLocalStorage(): boolean {
  try {
    const probe = '__argus_daily_login_probe__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** True when this browser already recorded today's IST login for this uid. */
export function hasRecordedDailyLoginToday(uid: string, now: Date = new Date()): boolean {
  if (!uid || !canUseLocalStorage()) return false;
  try {
    return localStorage.getItem(storageKey(uid, istDateStringClient(now))) === '1';
  } catch {
    return false;
  }
}

export function markDailyLoginRecorded(uid: string, now: Date = new Date()): void {
  if (!uid || !canUseLocalStorage()) return;
  try {
    const today = istDateStringClient(now);
    localStorage.setItem(storageKey(uid, today), '1');
    // Drop yesterday's marker for this uid so the key set cannot grow forever.
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    localStorage.removeItem(storageKey(uid, istDateStringClient(yesterday)));
  } catch {
    /* ignore quota / private-mode failures */
  }
}
