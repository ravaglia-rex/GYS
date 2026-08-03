import { useEffect, useRef, useState, useCallback } from 'react';

/** If the tab is hidden longer than this, we treat it as an integrity violation. */
export const EXAM_BACKGROUND_MS = 45_000;
/** Grace period to re-enter fullscreen before the attempt is ended. */
export const EXAM_FULLSCREEN_EXIT_GRACE_MS = 12_000;

type UseExamIntegrityOptions = {
  /** Exam in progress with a live attempt */
  active: boolean;
  onBackgroundTooLong: () => void | Promise<void>;
  onPrintScreen?: () => void;
  /** Fired if fullscreen stays exited longer than the grace period (forced fullscreen). */
  onFullscreenExitTooLong?: () => void | Promise<void>;
  /** When true, leaving fullscreen starts the grace timer (default true while active). */
  enforceFullscreen?: boolean;
};

/**
 * While active: blocks copy/cut/paste/context menu on the document, detects extended
 * backgrounding, discourages PrintScreen, and enforces fullscreen with a short grace period.
 */
export function useExamIntegrity({
  active,
  onBackgroundTooLong,
  onPrintScreen,
  onFullscreenExitTooLong,
  enforceFullscreen = true,
}: UseExamIntegrityOptions) {
  const [leftFullscreen, setLeftFullscreen] = useState(false);
  const hiddenAtRef = useRef<number | null>(null);
  const backgroundFiredRef = useRef(false);
  const fullscreenExitFiredRef = useRef(false);
  const fullscreenGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tryEnterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      void el.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!active) {
      setLeftFullscreen(false);
      hiddenAtRef.current = null;
      backgroundFiredRef.current = false;
      fullscreenExitFiredRef.current = false;
      if (fullscreenGraceTimerRef.current) {
        clearTimeout(fullscreenGraceTimerRef.current);
        fullscreenGraceTimerRef.current = null;
      }
      return;
    }

    const stop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('copy', stop, true);
    document.addEventListener('cut', stop, true);
    document.addEventListener('paste', stop, true);
    document.addEventListener('contextmenu', stop, true);

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenAtRef.current != null) {
        const elapsed = Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
        if (elapsed >= EXAM_BACKGROUND_MS && !backgroundFiredRef.current) {
          backgroundFiredRef.current = true;
          void Promise.resolve(onBackgroundTooLong());
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const clearFsGrace = () => {
      if (fullscreenGraceTimerRef.current) {
        clearTimeout(fullscreenGraceTimerRef.current);
        fullscreenGraceTimerRef.current = null;
      }
    };

    const onFsChange = () => {
      const exited = !document.fullscreenElement;
      setLeftFullscreen(exited);
      if (!enforceFullscreen || !onFullscreenExitTooLong) return;
      if (exited) {
        clearFsGrace();
        fullscreenGraceTimerRef.current = setTimeout(() => {
          if (!document.fullscreenElement && !fullscreenExitFiredRef.current) {
            fullscreenExitFiredRef.current = true;
            void Promise.resolve(onFullscreenExitTooLong());
          }
        }, EXAM_FULLSCREEN_EXIT_GRACE_MS);
      } else {
        clearFsGrace();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    setLeftFullscreen(!document.fullscreenElement);
    if (enforceFullscreen && !document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.().catch(() => {});
    }

    const onKeyCapture = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        onPrintScreen?.();
      }
    };
    window.addEventListener('keydown', onKeyCapture, true);

    return () => {
      document.removeEventListener('copy', stop, true);
      document.removeEventListener('cut', stop, true);
      document.removeEventListener('paste', stop, true);
      document.removeEventListener('contextmenu', stop, true);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKeyCapture, true);
      clearFsGrace();
    };
  }, [active, onBackgroundTooLong, onPrintScreen, onFullscreenExitTooLong, enforceFullscreen]);

  return {
    leftFullscreen,
    tryEnterFullscreen,
    dismissFullscreenWarning: () => setLeftFullscreen(false),
  };
}
