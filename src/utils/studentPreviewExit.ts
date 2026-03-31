const STORAGE_KEY = 'argus.studentPreview.exitTo';

/**
 * Exit preview always sends users to the public home page (`/`).
 * Storage is cleared for backwards compatibility with older sessions.
 */
export function consumeStudentPreviewExitTo(): '/' {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return '/';
}

/** Kept for callers that still set a return path; exit destination is always `/`. */
export function rememberStudentPreviewExitTo(_path?: string): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
