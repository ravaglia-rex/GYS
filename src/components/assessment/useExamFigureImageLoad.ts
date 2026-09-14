import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MAX_RETRIES = 3;
/** Backoff between retries — school Wi‑Fi often recovers within a few seconds. */
const RETRY_DELAYS_MS = [800, 1600, 3200] as const;

export type ExamFigureImageStatus = 'loading' | 'ready' | 'error';

/**
 * Load an exam figure URL with spinner/error states and automatic retries.
 * Retries append `?retry=N` (or `&retry=N`) so the browser does not reuse a
 * failed in-memory cache entry for the same src.
 */
export function useExamFigureImageLoad(resolvedSrc: string): {
  status: ExamFigureImageStatus;
  displaySrc: string;
  isRetrying: boolean;
  onLoad: () => void;
  onError: () => void;
  markReadyIfComplete: (el: HTMLImageElement | null) => void;
} {
  const [status, setStatus] = useState<ExamFigureImageStatus>(
    resolvedSrc ? 'loading' : 'error'
  );
  const [attempt, setAttempt] = useState(0);
  const retryTimerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  attemptRef.current = attempt;

  useEffect(() => {
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setAttempt(0);
    setStatus(resolvedSrc ? 'loading' : 'error');
    return () => {
      if (retryTimerRef.current != null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [resolvedSrc]);

  const displaySrc = useMemo(() => {
    if (!resolvedSrc) return '';
    if (attempt === 0) return resolvedSrc;
    const sep = resolvedSrc.includes('?') ? '&' : '?';
    return `${resolvedSrc}${sep}retry=${attempt}`;
  }, [resolvedSrc, attempt]);

  const onLoad = useCallback(() => {
    setStatus('ready');
  }, []);

  const onError = useCallback(() => {
    const current = attemptRef.current;
    if (!resolvedSrc || current >= MAX_RETRIES) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
    }
    const delay = RETRY_DELAYS_MS[current] ?? 3200;
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      setAttempt((n) => n + 1);
    }, delay);
  }, [resolvedSrc]);

  const markReadyIfComplete = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el || !displaySrc) return;
      if (el.complete && el.naturalWidth > 0) {
        setStatus('ready');
      }
    },
    [displaySrc]
  );

  return {
    status,
    displaySrc,
    isRetrying: status === 'loading' && attempt > 0,
    onLoad,
    onError,
    markReadyIfComplete,
  };
}
