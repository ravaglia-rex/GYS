import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as Sentry from '@sentry/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { getStudent } from '../../db/studentCollection';
import { getAssessmentConfig } from '../../db/assessmentCollection';
import type { AssessmentType } from '../../db/assessmentCollection';
import PracticeModeContent, { type PracticeUnlockContext } from '../../components/practice/PracticeModeContent';
import { ASSESSMENT_ORDER, membershipLevelForAssessmentGate, type AssessmentProgress } from '../../utils/assessmentGating';
import BigSpinner from '../../components/ui/BigSpinner';

const PracticeTestPage: React.FC = () => {
  const [uid, setUid] = useState(() => auth.currentUser?.uid ?? '');
  const [grade, setGrade] = useState(8);
  const [loading, setLoading] = useState(false);
  const [practiceUnlock, setPracticeUnlock] = useState<PracticeUnlockContext | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? '');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [student, config] = await Promise.all([getStudent(uid), getAssessmentConfig()]);
        if (cancelled) return;
        const g =
          typeof student?.grade === 'number' && !Number.isNaN(student.grade) ? student.grade : 8;
        setGrade(g);
        const officialTierCountByExam: Record<string, number> = {};
        for (const a of config) {
          officialTierCountByExam[a.id] = a.tiers?.length ?? 0;
        }
        const sorted: AssessmentType[] = [...config].sort((a, b) => {
          const ia = ASSESSMENT_ORDER.indexOf(a.id as (typeof ASSESSMENT_ORDER)[number]);
          const ib = ASSESSMENT_ORDER.indexOf(b.id as (typeof ASSESSMENT_ORDER)[number]);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        const progress = (student?.assessment_progress ?? {}) as Record<string, AssessmentProgress>;
        const membershipLevel = membershipLevelForAssessmentGate(student);
        setPracticeUnlock({
          progressByExam: progress,
          officialTierCountByExam,
          assessmentGate: {
            membershipLevel,
            grade: g,
            assessments: sorted,
            progress,
          },
        });
      } catch (err) {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'PracticeTestPage.load');
          scope.setExtra('uid', uid);
          Sentry.captureException(err);
        });
        if (!cancelled) {
          setGrade(8);
          setPracticeUnlock(undefined);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const storageScope = uid || auth.currentUser?.uid || 'practice_session';

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'PracticeTestPage');
      }}
    >
      <DashboardLayout>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <BigSpinner />
          </Box>
        ) : (
          <PracticeModeContent storageScope={storageScope} grade={grade} practiceUnlock={practiceUnlock} />
        )}
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default PracticeTestPage;
