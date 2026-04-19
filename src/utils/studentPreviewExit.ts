const STORAGE_KEY = 'argus.studentPreview.exitTo';

/** Persist where Exit preview should go (set when entering `/students/preview/*` with router state). */
export function rememberStudentPreviewExitTo(path: string): void {
  try {
    if (path.startsWith('/')) sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* ignore */
  }
}

/** Read exit path, clear storage, default `/`. */
export function consumeStudentPreviewExitTo(): string {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return v != null && v.startsWith('/') ? v : '/';
  } catch {
    return '/';
  }
}
