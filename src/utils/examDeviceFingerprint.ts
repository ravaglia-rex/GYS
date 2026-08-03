/**
 * Lightweight device fingerprint for exam concurrent-session locking.
 * Not cryptographic — just enough to detect a different browser/device mid-attempt.
 */
export function getExamDeviceFingerprint(): string {
  try {
    const parts = [
      navigator.userAgent || '',
      String(window.screen.width),
      String(window.screen.height),
      String(window.devicePixelRatio || 1),
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      navigator.language || '',
    ];
    const raw = parts.join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (Math.imul(31, hash) + raw.charCodeAt(i)) | 0;
    }
    return `fp_${Math.abs(hash).toString(36)}_${raw.length}`;
  } catch {
    return 'fp_unknown';
  }
}
