import { useEffect, useRef, useState, useCallback } from 'react';

/** If the tab is hidden longer than this, we treat it as an integrity violation. */
export const EXAM_BACKGROUND_MS = 45_000;

type UseExamIntegrityOptions = {
  /** Exam in progress with a live attempt */
  active: boolean;
  onBackgroundTooLong: () => void | Promise<void>;
  onPrintScreen?: () => void;
};

/**
 * While active: blocks copy/cut/paste/context menu on the document, detects extended
 * backgrounding, discourages PrintScreen, and tracks fullscreen exit (mobile/desktop).
 */
export function useExamIntegrity({ active, onBackgroundTooLong, onPrintScreen }: UseExamIntegrityOptions) {
  const [leftFullscreen, setLeftFullscreen] = useState(false);
  const hiddenAtRef = useRef<number | null>(null);
  const backgroundFiredRef = useRef(false);

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

    const onFsChange = () => {
      setLeftFullscreen(!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    setLeftFullscreen(!document.fullscreenElement);

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
    };
  }, [active, onBackgroundTooLong, onPrintScreen]);

  return { leftFullscreen, tryEnterFullscreen, dismissFullscreenWarning: () => setLeftFullscreen(false) };
}
