import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import { IDLE_TIMEOUT_MS, IDLE_WARNING_BEFORE_MS } from '../constants/idleTimeout';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
const MOUSEMOVE_THROTTLE_MS = 1000;

interface UseIdleTimeoutOptions {
  enabled: boolean;
}

export function useIdleTimeout({ enabled }: UseIdleTimeoutOptions) {
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.ceil(IDLE_WARNING_BEFORE_MS / 1000)
  );

  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityResetRef = useRef(0);
  const warningOpenRef = useRef(false);

  useEffect(() => {
    warningOpenRef.current = warningOpen;
  }, [warningOpen]);

  const clearTimers = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const signOutFromIdle = useCallback(async () => {
    clearTimers();
    setWarningOpen(false);
    try {
      authTokenHandler.clearToken();
      await signOut(auth);
    } catch (error) {
      console.error('Idle timeout sign-out failed:', error);
    }
  }, [clearTimers]);

  const startCountdown = useCallback(() => {
    const warningSeconds = Math.ceil(IDLE_WARNING_BEFORE_MS / 1000);
    setSecondsRemaining(warningSeconds);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          void signOutFromIdle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [signOutFromIdle]);

  const resetIdleTimers = useCallback(() => {
    clearTimers();
    setWarningOpen(false);
    setSecondsRemaining(Math.ceil(IDLE_WARNING_BEFORE_MS / 1000));

    warningTimeoutRef.current = setTimeout(() => {
      setWarningOpen(true);
      startCountdown();
    }, IDLE_TIMEOUT_MS - IDLE_WARNING_BEFORE_MS);

    logoutTimeoutRef.current = setTimeout(() => {
      void signOutFromIdle();
    }, IDLE_TIMEOUT_MS);
  }, [clearTimers, signOutFromIdle, startCountdown]);

  const staySignedIn = useCallback(() => {
    lastActivityResetRef.current = Date.now();
    resetIdleTimers();
  }, [resetIdleTimers]);

  const resetIdleTimersRef = useRef(resetIdleTimers);
  const staySignedInRef = useRef(staySignedIn);

  useEffect(() => {
    resetIdleTimersRef.current = resetIdleTimers;
    staySignedInRef.current = staySignedIn;
  }, [resetIdleTimers, staySignedIn]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setWarningOpen(false);
      return undefined;
    }

    resetIdleTimersRef.current();

    const onActivity = (event: Event) => {
      if (event.type === 'mousemove') {
        const now = Date.now();
        if (now - lastActivityResetRef.current < MOUSEMOVE_THROTTLE_MS) {
          return;
        }
        lastActivityResetRef.current = now;
      } else {
        lastActivityResetRef.current = Date.now();
      }

      if (warningOpenRef.current) {
        staySignedInRef.current();
        return;
      }

      resetIdleTimersRef.current();
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true });
    });
    window.addEventListener('mousemove', onActivity, { passive: true });

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, onActivity);
      });
      window.removeEventListener('mousemove', onActivity);
    };
  }, [clearTimers, enabled]);

  return {
    warningOpen,
    secondsRemaining,
    staySignedIn,
  };
}
