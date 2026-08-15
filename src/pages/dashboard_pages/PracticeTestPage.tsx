import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as Sentry from '@sentry/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { StudentProfileError } from '../../db/studentCollection';
import type { AssessmentType } from '../../db/assessmentCollection';
import PracticeModeContent, { type PracticeUnlockContext } from '../../components/practice/PracticeModeContent';
import { ASSESSMENT_ORDER, membershipLevelForAssessmentGate, type AssessmentProgress } from '../../utils/assessmentGating';
import { canonicalAssessmentId, canonicalizeProgressMap } from '../../utils/assessmentIdCompat';
import { hasFullPracticeUnlock } from '../../utils/practiceAssessmentsAccess';
import BigSpinner from '../../components/ui/BigSpinner';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { useAssessmentConfig, useStudent } from '../../query/hooks';
import { practiceCoinsNotEarnedMessage } from '../../utils/gamification';

type PracticeLocationState = {
  coinsFeedback?: { coins_awarded?: number; coins_reason?: string | null };
};

const PracticeTestPage: React.FC = () => {
  const location = useLocation();
  const coinsFeedback = (location.state as PracticeLocationState | null)?.coinsFeedback;
  const [coinsAlert, setCoinsAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!coinsFeedback) return;
    if ((coinsFeedback.coins_awarded ?? 0) > 0) {
      setCoinsAlert(`You earned ${coinsFeedback.coins_awarded} Argus Coins for this practice set!`);
    } else {
      const msg = practiceCoinsNotEarnedMessage(coinsFeedback.coins_reason);
      if (msg) setCoinsAlert(msg);
    }
  }, [coinsFeedback]);
  const [uid, setUid] = useState(() => auth.currentUser?.uid ?? '');
  const { data: config, isLoading: configLoading, isError: configError } = useAssessmentConfig(Boolean(uid));
  const { data: student, isLoading: studentLoading, error: studentError } = useStudent(uid, Boolean(uid));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? '');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (studentError && !(studentError instanceof StudentProfileError && studentError.code === 'NOT_FOUND')) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'PracticeTestPage.getStudent');
        scope.setExtra('uid', uid);
        Sentry.captureException(studentError);
      });
    }
    if (configError) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'PracticeTestPage.load');
        scope.setExtra('uid', uid);
        Sentry.captureException(configError);
      });
    }
  }, [studentError, configError, uid]);

  const loading = configLoading || studentLoading;

  const grade = useMemo(() => {
    return typeof student?.grade === 'number' && !Number.isNaN(student.grade) ? student.grade : 8;
  }, [student?.grade]);

  const practiceUnlock = useMemo((): PracticeUnlockContext | undefined => {
    if (!config || config.length === 0) return undefined;
    const officialTierCountByExam: Record<string, number> = {};
    for (const a of config) {
      officialTierCountByExam[canonicalAssessmentId(a.id)] = a.tiers?.length ?? 0;
    }
    const sorted: AssessmentType[] = [...config].sort((a, b) => {
      const ia = ASSESSMENT_ORDER.indexOf(
        canonicalAssessmentId(a.id) as (typeof ASSESSMENT_ORDER)[number]
      );
      const ib = ASSESSMENT_ORDER.indexOf(
        canonicalAssessmentId(b.id) as (typeof ASSESSMENT_ORDER)[number]
      );
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    const progress = canonicalizeProgressMap(
      (student?.assessment_progress ?? {}) as Record<string, unknown>
    ) as Record<string, AssessmentProgress>;
    const membershipLevel = membershipLevelForAssessmentGate(student ?? {});
    const fullUnlock = hasFullPracticeUnlock(student?.school_id);
    return {
      progressByExam: progress,
      officialTierCountByExam,
      assessmentGate: {
        membershipLevel,
        grade,
        assessments: sorted,
        progress,
        fullUnlock,
      },
    };
  }, [config, student, grade]);

  const storageScope = uid || auth.currentUser?.uid || 'practice_session';

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'PracticeTestPage');
      }}
    >
      <DashboardLayout>
        <PageTutorial pageKey="student.practice" ready={!loading} />
        {loading ? (
          <BigSpinner />
        ) : (
          <Box data-tutorial-id="student-practice-content">
            {coinsAlert && (
              <Alert severity={(coinsFeedback?.coins_awarded ?? 0) > 0 ? 'success' : 'warning'} sx={{ mb: 2 }} onClose={() => setCoinsAlert(null)}>
                {coinsAlert}
              </Alert>
            )}
            <PracticeModeContent
              storageScope={storageScope}
              grade={grade}
              practiceUnlock={practiceUnlock}
              studentUid={uid}
            />
          </Box>
        )}
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default PracticeTestPage;
