import type { TutorialAudience, TutorialUiPreferences } from './types';

const CACHE_PREFIX = 'argus:tutorial-preferences';

function cacheKey(audience: TutorialAudience, ownerId: string): string {
  return `${CACHE_PREFIX}:${audience}:${ownerId}`;
}

export function readTutorialPreferenceCache(
  audience: TutorialAudience,
  ownerId: string
): TutorialUiPreferences | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(audience, ownerId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as TutorialUiPreferences) : null;
  } catch {
    return null;
  }
}

export function writeTutorialPreferenceCache(
  audience: TutorialAudience,
  ownerId: string,
  prefs: TutorialUiPreferences | null | undefined
): void {
  try {
    const key = cacheKey(audience, ownerId);
    if (!prefs) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    // Cache misses should never block the tutorial flow.
  }
}
