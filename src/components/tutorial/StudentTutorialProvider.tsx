import React, { useCallback, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { updateStudent } from '../../db/studentCollection';
import { useStudent } from '../../query/hooks';
import { queryClient } from '../../query/queryClient';
import { queryKeys } from '../../query/queryKeys';
import { TutorialProvider, useTutorialContext } from './TutorialContext';
import { readTutorialPreferenceCache, writeTutorialPreferenceCache } from './tutorialPreferenceCache';

interface StudentTutorialProviderProps {
  children: React.ReactNode;
}

const StudentTutorialPrefsLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setPreferences = useTutorialContext()?.setPreferences;
  const [authUid, setAuthUid] = React.useState<string | null>(() => auth.currentUser?.uid ?? null);
  const { data: student } = useStudent(authUid ?? undefined, Boolean(authUid));

  useEffect(() => {
    if (!setPreferences) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      const uid = user?.uid ?? null;
      setAuthUid(uid);
      if (!uid) {
        setPreferences(null);
        return;
      }
      setPreferences(readTutorialPreferenceCache('student', uid));
    });
    return () => unsub();
  }, [setPreferences]);

  useEffect(() => {
    if (!setPreferences || !authUid) return;
    if (student?.ui_preferences) {
      setPreferences(student.ui_preferences);
      writeTutorialPreferenceCache('student', authUid, student.ui_preferences);
    }
  }, [authUid, setPreferences, student?.ui_preferences]);

  return <>{children}</>;
};

const StudentTutorialProvider: React.FC<StudentTutorialProviderProps> = ({ children }) => {
  const handleDismiss = useCallback(async (_pageKey: string, nextDismissed: Record<string, boolean>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateStudent(uid, {
      ui_preferences: { tutorials: { dismissed: nextDismissed } },
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.student(uid) });
    writeTutorialPreferenceCache('student', uid, { tutorials: { dismissed: nextDismissed } });
  }, []);

  return (
    <TutorialProvider audience="student" onDismissPage={handleDismiss}>
      <StudentTutorialPrefsLoader>{children}</StudentTutorialPrefsLoader>
    </TutorialProvider>
  );
};

export default StudentTutorialProvider;
