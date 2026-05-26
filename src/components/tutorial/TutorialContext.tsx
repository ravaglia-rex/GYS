import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TutorialAudience, TutorialUiPreferences } from './types';
import { isTutorialPageDismissed, readTutorialDismissed } from './types';

export interface TutorialContextValue {
  audience: TutorialAudience | null;
  dismissed: Record<string, boolean>;
  ready: boolean;
  setPreferences: (prefs: TutorialUiPreferences | null | undefined) => void;
  dismissPage: (pageKey: string) => Promise<void>;
  /** Optimistic local dismiss before persistence completes. */
  markDismissedLocal: (pageKey: string) => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorialContext(): TutorialContextValue | null {
  return useContext(TutorialContext);
}

interface TutorialProviderProps {
  audience: TutorialAudience;
  children: React.ReactNode;
  onDismissPage: (pageKey: string, nextDismissed: Record<string, boolean>) => Promise<void>;
  initialPreferences?: TutorialUiPreferences | null;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({
  audience,
  children,
  onDismissPage,
  initialPreferences,
}) => {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>(() =>
    readTutorialDismissed(initialPreferences)
  );
  const [ready, setReady] = useState(false);

  const setPreferences = useCallback((prefs: TutorialUiPreferences | null | undefined) => {
    const nextDismissed = readTutorialDismissed(prefs);
    setDismissed((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextDismissed);
      if (
        prevKeys.length === nextKeys.length &&
        prevKeys.every((key) => prev[key] === nextDismissed[key])
      ) {
        return prev;
      }
      return nextDismissed;
    });
    setReady((wasReady) => (wasReady ? wasReady : true));
  }, []);

  const markDismissedLocal = useCallback((pageKey: string) => {
    setDismissed((prev) => ({ ...prev, [pageKey]: true }));
  }, []);

  const dismissPage = useCallback(
    async (pageKey: string) => {
      if (isTutorialPageDismissed(dismissed, pageKey)) return;
      const next = { ...dismissed, [pageKey]: true };
      markDismissedLocal(pageKey);
      try {
        await onDismissPage(pageKey, next);
      } catch {
        setDismissed((prev) => {
          const copy = { ...prev };
          delete copy[pageKey];
          return copy;
        });
        throw new Error('Could not save tutorial preference.');
      }
    },
    [dismissed, markDismissedLocal, onDismissPage]
  );

  const value = useMemo(
    () => ({
      audience,
      dismissed,
      ready,
      setPreferences,
      dismissPage,
      markDismissedLocal,
    }),
    [audience, dismissed, ready, setPreferences, dismissPage, markDismissedLocal]
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
};
