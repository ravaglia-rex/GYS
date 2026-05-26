import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../../state_data/reducer';
import { getSchoolDashboard, putSchoolTutorialDismissal } from '../../db/schoolAdminCollection';
import { TutorialProvider, useTutorialContext } from './TutorialContext';
import { readTutorialPreferenceCache, writeTutorialPreferenceCache } from './tutorialPreferenceCache';

interface SchoolTutorialProviderProps {
  children: React.ReactNode;
}

const SchoolTutorialPrefsLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setPreferences = useTutorialContext()?.setPreferences;
  const loadedAdminKeyRef = useRef<string | null>(null);
  const schoolId = useSelector((s: RootState) => s.auth.schoolAdmin?.schoolId);
  const uid = useSelector((s: RootState) => s.auth.user?.uid);
  const location = useLocation();
  const isPreview = location.pathname.startsWith('/for-schools/preview');

  useEffect(() => {
    if (!setPreferences) return;
    if (isPreview || !schoolId || !uid) {
      loadedAdminKeyRef.current = null;
      setPreferences(null);
      return;
    }
    const normalizedSchoolId = String(schoolId).trim();
    const adminKey = `${normalizedSchoolId}:${uid}`;
    if (loadedAdminKeyRef.current === adminKey) return;
    loadedAdminKeyRef.current = adminKey;
    setPreferences(readTutorialPreferenceCache('school', adminKey));

    let cancelled = false;
    (async () => {
      try {
        const dash = await getSchoolDashboard(normalizedSchoolId);
        if (!cancelled) {
          setPreferences(dash.ui_preferences);
          writeTutorialPreferenceCache('school', adminKey, dash.ui_preferences);
        }
      } catch {
        if (!cancelled) setPreferences(readTutorialPreferenceCache('school', adminKey));
      }
    })();
    return () => {
      cancelled = true;
      loadedAdminKeyRef.current = null;
    };
  }, [setPreferences, schoolId, uid, isPreview]);

  return <>{children}</>;
};

const SchoolTutorialProvider: React.FC<SchoolTutorialProviderProps> = ({ children }) => {
  const schoolId = useSelector((s: RootState) => s.auth.schoolAdmin?.schoolId);
  const uid = useSelector((s: RootState) => s.auth.user?.uid);

  const handleDismiss = useCallback(async (pageKey: string, nextDismissed: Record<string, boolean>) => {
    await putSchoolTutorialDismissal(pageKey, nextDismissed);
    if (schoolId && uid) {
      writeTutorialPreferenceCache('school', `${String(schoolId).trim()}:${uid}`, {
        tutorials: { dismissed: nextDismissed },
      });
    }
  }, [schoolId, uid]);

  return (
    <TutorialProvider audience="school" onDismissPage={handleDismiss}>
      <SchoolTutorialPrefsLoader>{children}</SchoolTutorialPrefsLoader>
    </TutorialProvider>
  );
};

export default SchoolTutorialProvider;
