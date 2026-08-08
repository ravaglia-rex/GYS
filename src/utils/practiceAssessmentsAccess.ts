/**
 * Schools whose rostered students get every practice-eligible exam and all three
 * practice levels unlocked (membership / official-progress gates bypassed).
 * Official exam start rules are unchanged.
 */
export const FULL_PRACTICE_UNLOCK_SCHOOL_IDS = new Set([
  'g2TwMLddS4LzfHtC1v1Y', // Sri Sri Academy (platform-admin test school)
]);

export function normalizePracticeAccessSchoolId(schoolId: unknown): string {
  return typeof schoolId === 'string' ? schoolId.trim() : '';
}

/** True when this school roster should bypass practice exam + level locks. */
export function hasFullPracticeUnlock(schoolId: unknown): boolean {
  const id = normalizePracticeAccessSchoolId(schoolId);
  return Boolean(id) && FULL_PRACTICE_UNLOCK_SCHOOL_IDS.has(id);
}
