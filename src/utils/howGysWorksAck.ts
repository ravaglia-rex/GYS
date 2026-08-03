import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  updateStudent,
  type HowGysWorksUiPreferences,
  type StudentTutorialUiPreferences,
} from '../db/studentCollection';
import { useStudent } from '../query/hooks';
import { queryClient } from '../query/queryClient';
import { queryKeys } from '../query/queryKeys';

type StudentCache = {
  ui_preferences?: StudentTutorialUiPreferences;
  [key: string]: unknown;
};

export function readHowGysWorksPrefs(
  uiPreferences: StudentTutorialUiPreferences | null | undefined
): HowGysWorksUiPreferences {
  const raw = uiPreferences?.how_gys_works;
  if (!raw || typeof raw !== 'object') return {};
  return {
    visited: raw.visited === true,
    acknowledged: raw.acknowledged === true,
  };
}

function getCachedStudent(uid: string): StudentCache | undefined {
  return queryClient.getQueryData(queryKeys.student(uid)) as StudentCache | undefined;
}

function withHowGysPrefs(old: StudentCache | undefined, patch: HowGysWorksUiPreferences): StudentCache | undefined {
  if (!old) return old;
  const ui = old.ui_preferences ?? {};
  const prev = readHowGysWorksPrefs(ui);
  return {
    ...old,
    ui_preferences: {
      ...ui,
      how_gys_works: {
        ...prev,
        ...patch,
      },
    },
  };
}

async function persistHowGysWorksPrefs(uid: string, patch: HowGysWorksUiPreferences) {
  const cached = getCachedStudent(uid);
  const ui = cached?.ui_preferences ?? {};
  const nextHowGys = {
    ...readHowGysWorksPrefs(ui),
    ...patch,
  };
  await updateStudent(uid, {
    ui_preferences: {
      ...ui,
      how_gys_works: nextHowGys,
    },
  });
  queryClient.setQueryData(queryKeys.student(uid), (old: StudentCache | undefined) =>
    withHowGysPrefs(old ?? cached, patch)
  );
}

/** Marks How GYS Works as visited on the student account (no-op if already visited). */
export async function markHowGysWorksVisited(uid: string) {
  if (!uid) return;
  const cached = getCachedStudent(uid);
  if (readHowGysWorksPrefs(cached?.ui_preferences).visited) return;

  queryClient.setQueryData(queryKeys.student(uid), (old: StudentCache | undefined) =>
    withHowGysPrefs(old, { visited: true })
  );
  await persistHowGysWorksPrefs(uid, { visited: true });
}

export function useHowGysWorksAck(uid: string | undefined) {
  const safeUid = uid ?? '';
  const qc = useQueryClient();
  const { data: student, isFetched } = useStudent(safeUid || undefined, Boolean(safeUid));
  const [pending, setPending] = useState(false);

  const prefs = useMemo(
    () => readHowGysWorksPrefs(student?.ui_preferences),
    [student?.ui_preferences]
  );

  const acknowledge = useCallback(async () => {
    if (!safeUid || prefs.acknowledged || pending) return;
    setPending(true);
    const patch: HowGysWorksUiPreferences = { visited: true, acknowledged: true };
    qc.setQueryData(queryKeys.student(safeUid), (old: StudentCache | undefined) =>
      withHowGysPrefs(old, patch)
    );
    try {
      await persistHowGysWorksPrefs(safeUid, patch);
    } catch {
      void qc.invalidateQueries({ queryKey: queryKeys.student(safeUid) });
    } finally {
      setPending(false);
    }
  }, [pending, prefs.acknowledged, qc, safeUid]);

  return {
    visited: prefs.visited === true,
    acknowledged: prefs.acknowledged === true,
    showBanner: Boolean(safeUid) && isFetched && prefs.acknowledged !== true,
    pending,
    acknowledge,
  };
}
