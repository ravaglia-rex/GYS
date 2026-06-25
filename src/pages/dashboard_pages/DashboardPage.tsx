import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { useAssessmentConfig, useStudent } from '../../query/hooks';
import * as Sentry from '@sentry/react';
import DashboardOverview from '../../components/dashboard/DashboardOverview';
import { EnhancedAssessmentCardsGroup } from '../../components/dashboard/EnhancedAssessmentCardsGroup';
import {
  ASSESSMENT_ORDER,
  ASSESSMENT_NAMES,
  COMPLETION_PREREQUISITES,
  PROGRAM_EXAM_COUNT,
  computeGate,
  membershipLevelForAssessmentGate,
  defaultAssessmentProgress,
  isAssessmentFullyComplete,
  buildDashboardExamChartRows,
  type AssessmentChartRow,
} from '../../utils/assessmentGating';
import { STUDENT_OFFICIAL_ASSESSMENTS_ENABLED } from '../../constants/constants';
import PageTutorial from '../../components/tutorial/PageTutorial';
import type {
  CompletedAssessmentNotificationSource,
  DashboardNotificationEventSource,
  UnlockedAssessmentNotificationSource,
} from '../../utils/dashboardNotifications';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssessmentProgress {
  proficiency_tier: number;
  status: 'locked' | 'available' | 'tier_advanced';
  best_score: number | null;
  attempts_count: number;
}

interface DashboardStats {
  totalAssessments: number;
  tiersCompleted: number;
  averageScore: number;
  availableAssessments: number;
}


// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [uid, setUid] = useState(() => auth.currentUser?.uid ?? '');
  const { data: student, isLoading: studentLoading, isError: studentError } = useStudent(uid, Boolean(uid));
  const { data: configFromBackend = [], isLoading: configLoading } = useAssessmentConfig(Boolean(uid));

  const loading = studentLoading || configLoading;
  const loadError = studentError ? 'Could not load your dashboard data. Please refresh or try again later.' : '';

  const dashboardDerived = useMemo(() => {
    if (loading || !student) {
      return {
        stats: {
          totalAssessments: PROGRAM_EXAM_COUNT,
          tiersCompleted: 0,
          averageScore: 0,
          availableAssessments: 0,
        } as DashboardStats,
        scoresByAssessment: [] as AssessmentChartRow[],
        completedAssessments: [] as CompletedAssessmentNotificationSource[],
        unlockedAssessments: [] as UnlockedAssessmentNotificationSource[],
        backendNotificationEvents: [] as DashboardNotificationEventSource[],
        assessmentScopeLine: '',
      };
    }

    const progress: Record<string, AssessmentProgress> = student?.assessment_progress ?? {};
    const dashboardNotificationEvents = Array.isArray(student?.dashboard_notification_events)
      ? (student.dashboard_notification_events as DashboardNotificationEventSource[])
      : [];
    const membershipLevel = membershipLevelForAssessmentGate(student);
    const studentGrade =
      typeof student?.grade === 'number' && !Number.isNaN(student.grade) ? student.grade : 8;

    const sorted = [...configFromBackend].sort((a, b) => {
      const ia = ASSESSMENT_ORDER.indexOf(a.id as (typeof ASSESSMENT_ORDER)[number]);
      const ib = ASSESSMENT_ORDER.indexOf(b.id as (typeof ASSESSMENT_ORDER)[number]);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    let availableAssessments = 0;
    let tiersCompleted = 0;
    const completedForNotifications: CompletedAssessmentNotificationSource[] = [];
    const unlockedForNotifications: UnlockedAssessmentNotificationSource[] = [];

    for (const a of sorted) {
      const p = progress[a.id] ?? defaultAssessmentProgress;
      const gate = computeGate(a.id, membershipLevel, progress, studentGrade, sorted);
      const done = isAssessmentFullyComplete(a, p);
      if (done) {
        tiersCompleted++;
        completedForNotifications.push({
          assessmentId: a.id,
          assessmentName: a.name?.trim() || ASSESSMENT_NAMES[a.id] || a.id,
        });
      }
      if (!gate.locked && !isAssessmentFullyComplete(a, p)) {
        availableAssessments++;
        const hasAttemptedThisAssessment = (p.attempts_count ?? 0) > 0 || p.best_score !== null;
        const hasPrerequisite = (COMPLETION_PREREQUISITES[a.id] ?? []).length > 0;
        if (!hasAttemptedThisAssessment && hasPrerequisite) {
          unlockedForNotifications.push({
            assessmentId: a.id,
            assessmentName: a.name?.trim() || ASSESSMENT_NAMES[a.id] || a.id,
          });
        }
      }
    }

    const listedTotal = Math.max(sorted.length, PROGRAM_EXAM_COUNT);
    const scoresWithValues = Object.values(progress).filter((p) => p.best_score !== null);
    const avgScore =
      scoresWithValues.length > 0
        ? Math.round(
            (scoresWithValues.reduce((sum, p) => sum + (p.best_score ?? 0), 0) /
              scoresWithValues.length) *
              1000
          )
        : 0;

    return {
      stats: {
        totalAssessments: listedTotal,
        tiersCompleted,
        averageScore: avgScore,
        availableAssessments,
      },
      scoresByAssessment: buildDashboardExamChartRows(sorted, progress, membershipLevel, studentGrade),
      completedAssessments: completedForNotifications,
      unlockedAssessments: unlockedForNotifications,
      backendNotificationEvents: dashboardNotificationEvents,
      assessmentScopeLine: `${tiersCompleted} of ${listedTotal} complete`,
    };
  }, [student, configFromBackend, loading]);

  const {
    stats,
    scoresByAssessment,
    completedAssessments,
    unlockedAssessments,
    backendNotificationEvents,
    assessmentScopeLine,
  } = dashboardDerived;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setUid(user?.uid ?? '');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (studentError) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'DashboardPage.load');
        scope.setExtra('uid', uid);
        scope.captureException(studentError);
      });
    }
  }, [studentError, uid]);

  return (
    <Sentry.ErrorBoundary beforeCapture={(s) => s.setTag('location', 'DashboardPage')}>
      <DashboardLayout
        availableAssessmentsCount={stats.availableAssessments}
        completedAssessments={completedAssessments}
        unlockedAssessments={unlockedAssessments}
        backendNotificationEvents={backendNotificationEvents}
      >
        <PageTutorial pageKey="student.dashboard" ready={!loading && !loadError} />
        <Box sx={{ p: 0, maxWidth: 1200, mx: 'auto', width: '100%' }}>
          {loading ? (
            <Box sx={{
              textAlign: 'center', py: 8,
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Loading Dashboard…
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Fetching your assessment progress
              </Typography>
            </Box>
          ) : loadError ? (
            <Alert severity="error" sx={{ bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#fecaca', border: '1px solid rgba(239, 68, 68, 0.35)', '& .MuiAlert-icon': { color: '#fca5a5' } }}>
              {loadError}
            </Alert>
          ) : (
            <>
              <DashboardOverview
                uid={uid}
                stats={{
                  totalAssessments: stats.totalAssessments,
                  completedAssessments: stats.tiersCompleted,
                  averageScore: stats.averageScore,
                  availableAssessments: stats.availableAssessments,
                }}
                latestAssessmentResults={scoresByAssessment}
                completedAssessments={completedAssessments}
                unlockedAssessments={unlockedAssessments}
                backendNotificationEvents={backendNotificationEvents}
              />
              <Box sx={{ mt: 4, ml: { xs: 0, sm: 1 }, minWidth: 0 }} data-tutorial-id="student-dashboard-assessments">
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 2 }}>
                    <Typography
                      variant="h5"
                      data-tutorial-scroll-id="student-dashboard-assessments-heading"
                      sx={{ color: 'white', fontWeight: 700 }}
                    >
                      Your Assessments
                    </Typography>
                    {assessmentScopeLine && (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                        {assessmentScopeLine}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', mb: 2 }}>
                    {STUDENT_OFFICIAL_ASSESSMENTS_ENABLED
                      ? 'All assessments are listed below. Complete them in sequence where your membership allows - Reasoning Triad covers Exams 1-3; Stream Ready adds Personality and Interest and AI Proficiency (4-5); Career Ready adds the Pathways group (6-7) and ongoing AI career counseling that begins after that baseline and grows as you log new experiences. Practice Mode uses a separate pool and does not change official scores.'
                      : 'Official exams are listed for reference, but they are not open yet while the real question banks are being prepared. Practice Mode remains available and uses a separate pool that does not change official scores.'}
                  </Typography>
                </Box>
                <EnhancedAssessmentCardsGroup uid={uid} filterType="all" />
              </Box>
            </>
          )}
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default Dashboard;
