import React, { useCallback, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { getStudent, updateStudent } from '../../db/studentCollection';
import { TutorialProvider, useTutorialContext } from './TutorialContext';
import { readTutorialPreferenceCache, writeTutorialPreferenceCache } from './tutorialPreferenceCache';

interface StudentTutorialProviderProps {
  children: React.ReactNode;
}

const StudentTutorialPrefsLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setPreferences = useTutorialContext()?.setPreferences;
  const loadedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!setPreferences) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid ?? null;
      if (!uid) {
        loadedUidRef.current = null;
        setPreferences(null);
        return;
      }
      if (loadedUidRef.current === uid) return;
      loadedUidRef.current = uid;
      setPreferences(readTutorialPreferenceCache('student', uid));
      try {
        const student = await getStudent(uid);
        setPreferences(student?.ui_preferences);
        writeTutorialPreferenceCache('student', uid, student?.ui_preferences);
      } catch {
        setPreferences(readTutorialPreferenceCache('student', uid));
      }
    });
    return () => {
      loadedUidRef.current = null;
      unsub();
    };
  }, [setPreferences]);

  return <>{children}</>;
};

const StudentTutorialProvider: React.FC<StudentTutorialProviderProps> = ({ children }) => {
  const handleDismiss = useCallback(async (_pageKey: string, nextDismissed: Record<string, boolean>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateStudent(uid, {
      ui_preferences: { tutorials: { dismissed: nextDismissed } },
    });
    writeTutorialPreferenceCache('student', uid, { tutorials: { dismissed: nextDismissed } });
  }, []);

  return (
    <TutorialProvider audience="student" onDismissPage={handleDismiss}>
      <StudentTutorialPrefsLoader>{children}</StudentTutorialPrefsLoader>
    </TutorialProvider>
  );
};

export default StudentTutorialProvider;
