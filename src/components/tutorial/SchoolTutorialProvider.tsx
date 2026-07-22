import React, { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../../state_data/reducer';
import { putSchoolTutorialDismissal } from '../../db/schoolAdminCollection';
import { useSchoolAdminSummary } from '../../query/hooks';
import { TutorialProvider, useTutorialContext } from './TutorialContext';
import { readTutorialPreferenceCache, writeTutorialPreferenceCache } from './tutorialPreferenceCache';

interface SchoolTutorialProviderProps {
  children: React.ReactNode;
}

const SchoolTutorialPrefsLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setPreferences = useTutorialContext()?.setPreferences;
  const schoolId = useSelector((s: RootState) => s.auth.schoolAdmin?.schoolId);
  const uid = useSelector((s: RootState) => s.auth.user?.uid);
  const location = useLocation();
  const isPreview = location.pathname.startsWith('/for-schools/preview');
  const normalizedSchoolId = schoolId ? String(schoolId).trim() : undefined;

  // Shared, cached fetch (see query/hooks.ts) - other School Official pages loading the same
  // summary within the staleTime window serve this straight from the React Query cache.
  const { data: summaryData } = useSchoolAdminSummary(
    normalizedSchoolId,
    !isPreview && Boolean(normalizedSchoolId) && Boolean(uid)
  );

  useEffect(() => {
    if (!setPreferences) return;
    if (isPreview || !normalizedSchoolId || !uid) {
      setPreferences(null);
      return;
    }
    const adminKey = `${normalizedSchoolId}:${uid}`;
    if (summaryData) {
      setPreferences(summaryData.ui_preferences);
      writeTutorialPreferenceCache('school', adminKey, summaryData.ui_preferences);
    } else {
      setPreferences(readTutorialPreferenceCache('school', adminKey));
    }
  }, [setPreferences, normalizedSchoolId, uid, isPreview, summaryData]);

  return <>{children}</>;
};

const SchoolTutorialProvider: React.FC<SchoolTutorialProviderProps> = ({ children }) => {
  const schoolId = useSelector((s: RootState) => s.auth.schoolAdmin?.schoolId);
  const uid = useSelector((s: RootState) => s.auth.user?.uid);

  const handleDismiss = useCallback(async (pageKey: string, nextDismissed: Record<string, boolean>) => {
    const sid = schoolId ? String(schoolId).trim() : '';
    if (!sid) {
      throw new Error('School context is missing.');
    }
    await putSchoolTutorialDismissal(pageKey, nextDismissed, sid);
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
