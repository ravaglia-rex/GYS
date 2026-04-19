/**
 * Persists student signup flow fields in sessionStorage so Back/forward and refresh
 * keep data, and location.state stays the single source when present (it wins over draft).
 */

const STORAGE_KEY = 'gys_student_signup_draft_v1';

export type StudentSignupDraft = Record<string, unknown>;

export function readSignupDraft(): StudentSignupDraft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as StudentSignupDraft)
      : {};
  } catch {
    return {};
  }
}

/** Merge: draft first, then location.state overwrites (explicit navigation wins). */
export function mergeSignupState(locationState: unknown): StudentSignupDraft {
  const draft = readSignupDraft();
  const loc =
    locationState && typeof locationState === 'object' && !Array.isArray(locationState)
      ? (locationState as StudentSignupDraft)
      : {};
  return { ...draft, ...loc };
}

export function writeSignupDraft(patch: StudentSignupDraft) {
  try {
    const prev = readSignupDraft();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {
    /* private mode / quota */
  }
}

export function clearSignupDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* */
  }
}
