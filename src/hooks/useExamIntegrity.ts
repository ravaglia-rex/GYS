import { useEffect, useRef, useState, useCallback } from 'react';

/** Grace to return after minimize, tab switch, focus loss, or leaving fullscreen. */
export const EXAM_LEAVE_GRACE_MS = 30_000;
/** Brief leaves allowed in one sit before the attempt is ended. */
export const EXAM_LEAVE_MAX_INCIDENTS = 3;

/** @deprecated Use EXAM_LEAVE_GRACE_MS */
export const EXAM_BACKGROUND_MS = EXAM_LEAVE_GRACE_MS;
/** @deprecated Use EXAM_LEAVE_GRACE_MS */
export const EXAM_FULLSCREEN_EXIT_GRACE_MS = EXAM_LEAVE_GRACE_MS;

export type ExamIntegrityWarning = {
  leaveCount: number;
  secondsLeft: number;
  /** True while the exam tab is visible but fullscreen is off. */
  canReenterFullscreen: boolean;
};

type UseExamIntegrityOptions = {
  /** Exam in progress with a live attempt */
  active: boolean;
  /** Fired when grace expires or they leave 3 times in this sit. */
  onLeaveLimitReached: () => void | Promise<void>;
  onPrintScreen?: () => void;
  /** When true, leaving fullscreen starts the grace timer (default true while active). */
  enforceFullscreen?: boolean;
};

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenCapableDocument = Document & {
  fullscreenEnabled?: boolean;
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
};

/** True when the browser can enter document fullscreen (standard or webkit-prefixed). */
export function isFullscreenCapable(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenCapableDocument;
  const el = document.documentElement as FullscreenCapableElement;
  const enabled = Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
  const canRequest = Boolean(el.requestFullscreen || el.webkitRequestFullscreen);
  return enabled && canRequest;
}

function getFullscreenElement(): Element | null {
  const doc = document as FullscreenCapableDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function isExamAway(enforceFullscreen: boolean, windowFocused: boolean): boolean {
  if (!windowFocused) return true;
  if (document.visibilityState === 'hidden') return true;
  if (enforceFullscreen && isFullscreenCapable() && !getFullscreenElement()) return true;
  return false;
}

/**
 * While active: blocks copy/cut/paste/context menu, treats minimize / background /
 * another-window focus / fullscreen-exit as one leave type (30s grace, 3 leaves then the sit ends).
 */
export function useExamIntegrity({
  active,
  onLeaveLimitReached,
  onPrintScreen,
  enforceFullscreen = true,
}: UseExamIntegrityOptions) {
  const [leftFullscreen, setLeftFullscreen] = useState(false);
  const [lostWindowFocus, setLostWindowFocus] = useState(false);
  const [warning, setWarning] = useState<ExamIntegrityWarning | null>(null);
  const [fullscreenBlocked, setFullscreenBlocked] = useState(false);

  const onEndRef = useRef(onLeaveLimitReached);
  onEndRef.current = onLeaveLimitReached;
  const onPrintRef = useRef(onPrintScreen);
  onPrintRef.current = onPrintScreen;

  const awayRef = useRef(false);
  const endedRef = useRef(false);
  const primedRef = useRef(false);
  const windowFocusedRef = useRef(true);
  const leaveCountRef = useRef(0);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graceEndsAtRef = useRef(0);

  const tryEnterFullscreen = useCallback(() => {
    if (getFullscreenElement()) {
      setFullscreenBlocked(false);
      return;
    }
    const el = document.documentElement as FullscreenCapableElement;
    const enter =
      el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
    if (!enter) {
      setFullscreenBlocked(true);
      return;
    }
    try {
      const result = enter();
      if (result && typeof (result as Promise<void>).then === 'function') {
        void (result as Promise<void>)
          .then(() => setFullscreenBlocked(false))
          .catch(() => setFullscreenBlocked(true));
      } else {
        setFullscreenBlocked(false);
      }
    } catch {
      setFullscreenBlocked(true);
    }
  }, []);

  const dismissFullscreenRequired = useCallback(() => {
    if (isFullscreenCapable()) return;
    setLeftFullscreen(false);
    setFullscreenBlocked(false);
  }, []);

  const clearTimers = useCallback(() => {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  }, []);

  const endAttempt = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    awayRef.current = false;
    clearTimers();
    setWarning(null);
    void Promise.resolve(onEndRef.current());
  }, [clearTimers]);

  const startGrace = useCallback(() => {
    clearTimers();
    graceEndsAtRef.current = Date.now() + EXAM_LEAVE_GRACE_MS;
    const count = leaveCountRef.current;
    const refreshWarning = () => {
      const msLeft = Math.max(0, graceEndsAtRef.current - Date.now());
      setWarning({
        leaveCount: count,
        secondsLeft: Math.ceil(msLeft / 1000),
        canReenterFullscreen:
          document.visibilityState === 'visible' && !getFullscreenElement(),
      });
    };
    refreshWarning();
    tickTimerRef.current = setInterval(refreshWarning, 250);
    graceTimerRef.current = setTimeout(() => {
      if (endedRef.current) return;
      if (
        isExamAway(enforceFullscreen, windowFocusedRef.current) ||
        leaveCountRef.current >= EXAM_LEAVE_MAX_INCIDENTS
      ) {
        endAttempt();
      }
    }, EXAM_LEAVE_GRACE_MS);
  }, [clearTimers, endAttempt, enforceFullscreen]);

  const onLeave = useCallback(() => {
    if (!active || endedRef.current || awayRef.current) return;
    awayRef.current = true;
    leaveCountRef.current += 1;
    if (leaveCountRef.current >= EXAM_LEAVE_MAX_INCIDENTS) {
      startGrace();
      return;
    }
    startGrace();
  }, [active, startGrace]);

  const onReturn = useCallback(() => {
    if (!active || endedRef.current) return;
    if (isExamAway(enforceFullscreen, windowFocusedRef.current)) return;
    awayRef.current = false;
    clearTimers();
    if (leaveCountRef.current >= EXAM_LEAVE_MAX_INCIDENTS) {
      endAttempt();
      return;
    }
    if (leaveCountRef.current > 0) {
      setWarning({
        leaveCount: leaveCountRef.current,
        secondsLeft: 0,
        canReenterFullscreen: false,
      });
    } else {
      setWarning(null);
    }
  }, [active, clearTimers, endAttempt, enforceFullscreen]);

  useEffect(() => {
    if (!active) {
      setLeftFullscreen(false);
      setLostWindowFocus(false);
      setWarning(null);
      setFullscreenBlocked(false);
      awayRef.current = false;
      endedRef.current = false;
      primedRef.current = false;
      windowFocusedRef.current = true;
      leaveCountRef.current = 0;
      clearTimers();
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

    windowFocusedRef.current = document.hasFocus();

    const sync = () => {
      const capable = isFullscreenCapable();
      const inFs = Boolean(getFullscreenElement());
      const away = isExamAway(enforceFullscreen, windowFocusedRef.current);
      setLeftFullscreen(enforceFullscreen && capable && !inFs);
      if (inFs) setFullscreenBlocked(false);
      setLostWindowFocus(
        !windowFocusedRef.current && document.visibilityState === 'visible'
      );
      if (!primedRef.current) {
        if (
          document.visibilityState === 'visible' &&
          windowFocusedRef.current &&
          (!enforceFullscreen || !capable || inFs)
        ) {
          primedRef.current = true;
        }
        return;
      }
      if (away) onLeave();
      else onReturn();
    };

    const onWindowBlur = () => {
      windowFocusedRef.current = false;
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      // Debounce short blur/focus pairs (keyboard, notification shade) so they
      // don't count as leave incidents. Real app-switch still hits visibilitychange immediately.
      blurTimerRef.current = setTimeout(() => {
        blurTimerRef.current = null;
        sync();
      }, 500);
    };
    const onWindowFocus = () => {
      windowFocusedRef.current = true;
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
      sync();
    };

    document.addEventListener('visibilitychange', sync);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    // Silent mount attempt — never sets fullscreenBlocked (that is reserved for user taps).
    if (enforceFullscreen && isFullscreenCapable() && !getFullscreenElement()) {
      const el = document.documentElement as FullscreenCapableElement;
      const enter = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
      try {
        const result = enter?.();
        if (result && typeof (result as Promise<void>).then === 'function') {
          void (result as Promise<void>).catch(() => {});
        }
      } catch {
        /* ignore — user can re-enter via the dialog button */
      }
    }
    sync();

    const onKeyCapture = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        onPrintRef.current?.();
      }
    };
    window.addEventListener('keydown', onKeyCapture, true);

    return () => {
      document.removeEventListener('copy', stop, true);
      document.removeEventListener('cut', stop, true);
      document.removeEventListener('paste', stop, true);
      document.removeEventListener('contextmenu', stop, true);
      document.removeEventListener('visibilitychange', sync);
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('keydown', onKeyCapture, true);
      clearTimers();
    };
  }, [active, clearTimers, enforceFullscreen, onLeave, onReturn]);

  return {
    leftFullscreen,
    lostWindowFocus,
    integrityWarning: warning,
    fullscreenBlocked,
    fullscreenCapable: isFullscreenCapable(),
    tryEnterFullscreen,
    dismissFullscreenRequired,
    dismissFullscreenWarning: () => {
      if (warning && warning.secondsLeft === 0) setWarning(null);
    },
  };
}
