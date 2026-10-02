import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { useAssessmentConfig, useOfficialExamOps, useStudent } from '../../query/hooks';
import * as Sentry from '@sentry/react';
import DashboardOverview from '../../components/dashboard/DashboardOverview';
import {
  ASSESSMENT_ORDER,
  COMPLETION_PREREQUISITES,
  assessmentDisplayName,
  assessmentHasReleasedScore,
  countAssessmentSits,
  computeGate,
  gateWithRestrictedStarterBypass,
  membershipLevelForAssessmentGate,
  defaultAssessmentProgress,
  isAssessmentFullyComplete,
  buildDashboardExamChartRows,
  studentCanStartAssessmentNow,
  type AssessmentChartRow,
  type AssessmentProgress,
} from '../../utils/assessmentGating';
import PageTutorial from '../../components/tutorial/PageTutorial';
import {
  canStartOfficialAssessmentNow,
  officialAssessmentSchoolIdFromStudent,
} from '../../utils/officialStudentAssessmentsAccess';
import { canonicalAssessmentId, readAssessmentProgress } from '../../utils/assessmentIdCompat';
import type {
  CompletedAssessmentNotificationSource,
  DashboardNotificationEventSource,
  UnlockedAssessmentNotificationSource,
} from '../../utils/dashboardNotifications';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  availableAssessments: number;
  assessmentsTaken: number;
  resultsAvailable: number;
}


// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [uid, setUid] = useState(() => auth.currentUser?.uid ?? '');
  const [userEmail, setUserEmail] = useState(() => auth.currentUser?.email ?? '');
  const {
    data: student,
    isLoading: studentLoading,
    isError: studentIsError,
    error: studentErrorObj,
  } = useStudent(uid, Boolean(uid));
  const { data: configFromBackend = [], isLoading: configLoading } = useAssessmentConfig(Boolean(uid));
  const { data: officialExamOps } = useOfficialExamOps(Boolean(uid));
  const newStartsPaused = officialExamOps?.new_starts_paused === true;

  const loading = studentLoading || configLoading;
  const loadError = studentIsError
    ? 'Could not load your dashboard data. Please refresh or try again later.'
    : '';
  const officialSchoolId = officialAssessmentSchoolIdFromStudent(student);

  const dashboardDerived = useMemo(() => {
    if (loading || !student) {
      return {
        stats: {
          availableAssessments: 0,
          assessmentsTaken: 0,
          resultsAvailable: 0,
        } as DashboardStats,
        scoresByAssessment: [] as AssessmentChartRow[],
        completedAssessments: [] as CompletedAssessmentNotificationSource[],
        unlockedAssessments: [] as UnlockedAssessmentNotificationSource[],
        backendNotificationEvents: [] as DashboardNotificationEventSource[],
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
      const ia = ASSESSMENT_ORDER.indexOf(
        canonicalAssessmentId(a.id) as (typeof ASSESSMENT_ORDER)[number]
      );
      const ib = ASSESSMENT_ORDER.indexOf(
        canonicalAssessmentId(b.id) as (typeof ASSESSMENT_ORDER)[number]
      );
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    let availableAssessments = 0;
    let assessmentsTaken = 0;
    let resultsAvailable = 0;
    const completedForNotifications: CompletedAssessmentNotificationSource[] = [];
    const unlockedForNotifications: UnlockedAssessmentNotificationSource[] = [];

    for (const a of sorted) {
      const p = {
        ...defaultAssessmentProgress,
        ...(readAssessmentProgress(progress, a.id) as Partial<AssessmentProgress>),
      };
      const gate = gateWithRestrictedStarterBypass(
        a.id,
        computeGate(a.id, membershipLevel, progress, studentGrade, sorted),
        userEmail,
        undefined,
        officialSchoolId
      );
      assessmentsTaken += countAssessmentSits(a.id, p);
      if (assessmentHasReleasedScore(a.id, p)) resultsAvailable += 1;
      if (studentCanStartAssessmentNow({
        assessment: a,
        progress: p,
        gateLocked: gate.locked,
        email: userEmail,
        schoolId: officialSchoolId,
        newStartsPaused,
      })) {
        availableAssessments += 1;
      }
      const done = isAssessmentFullyComplete(a, p);
      if (done) {
        completedForNotifications.push({
          assessmentId: a.id,
          assessmentName: assessmentDisplayName(a.id, a.name),
        });
      }
      if (
        canStartOfficialAssessmentNow(a.id, userEmail, undefined, officialSchoolId, newStartsPaused) &&
        !gate.locked &&
        !done
      ) {
        const hasAttemptedThisAssessment =
          (p.attempts_count ?? 0) > 0 ||
          p.latest_attempt_level != null ||
          p.best_score !== null;
        const hasPrerequisite = (COMPLETION_PREREQUISITES[a.id] ?? []).length > 0;
        if (!hasAttemptedThisAssessment && hasPrerequisite) {
          unlockedForNotifications.push({
            assessmentId: a.id,
            assessmentName: assessmentDisplayName(a.id, a.name),
          });
        }
      }
    }

    return {
      stats: {
        availableAssessments,
        assessmentsTaken,
        resultsAvailable,
      },
      scoresByAssessment: buildDashboardExamChartRows(sorted, progress, membershipLevel, studentGrade),
      completedAssessments: completedForNotifications,
      unlockedAssessments: unlockedForNotifications,
      backendNotificationEvents: dashboardNotificationEvents,
    };
  }, [student, configFromBackend, loading, userEmail, officialSchoolId, newStartsPaused]);

  const {
    stats,
    scoresByAssessment,
    completedAssessments,
    unlockedAssessments,
    backendNotificationEvents,
  } = dashboardDerived;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setUid(user?.uid ?? '');
      setUserEmail(user?.email ?? '');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (studentIsError && studentErrorObj) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'DashboardPage.load');
        scope.setExtra('uid', uid);
        scope.captureException(studentErrorObj);
      });
    }
  }, [studentIsError, studentErrorObj, uid]);

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
                student={student as Record<string, unknown>}
                stats={stats}
                latestAssessmentResults={scoresByAssessment}
                completedAssessments={completedAssessments}
                unlockedAssessments={unlockedAssessments}
                backendNotificationEvents={backendNotificationEvents}
              />
              <Box
                component="button"
                type="button"
                aria-label="Open available assessments"
                data-tutorial-id="student-dashboard-assessments"
                data-tutorial-scroll-id="student-dashboard-assessments-heading"
                onClick={() => navigate('/assessments/available')}
                sx={{
                  mt: 4,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  px: { xs: 2, sm: 2.5 },
                  py: 2.25,
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'white',
                  borderRadius: 3,
                  border: '1px solid rgba(91, 33, 182, 0.4)',
                  background:
                    'radial-gradient(circle at 8% 0%, rgba(76, 29, 149, 0.28), transparent 36%), radial-gradient(circle at 92% 120%, rgba(6, 78, 59, 0.22), transparent 42%), linear-gradient(135deg, rgba(30, 27, 75, 0.72) 0%, rgba(15, 23, 42, 0.94) 58%, rgba(6, 46, 36, 0.4) 100%)',
                  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.35)',
                  transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: 'rgba(109, 40, 217, 0.55)',
                    boxShadow: '0 16px 36px rgba(30, 27, 75, 0.4)',
                  },
                  '&:hover .assessments-go-arrow': {
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.25 }, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }} aria-hidden>
                    {[
                      { icon: '🧩', gradient: 'linear-gradient(160deg, #6d28d9 0%, #3b0764 100%)' },
                      { icon: '📚', gradient: 'linear-gradient(160deg, #93c5fd 0%, #1d4ed8 100%)' },
                      { icon: '∑', gradient: 'linear-gradient(160deg, #6ee7b7 0%, #047857 100%)' },
                    ].map((mark) => (
                      <Box
                        key={mark.icon}
                        sx={{
                          width: { xs: 36, sm: 44 },
                          height: { xs: 36, sm: 44 },
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: { xs: '1rem', sm: '1.15rem' },
                          fontWeight: 800,
                          color: 'white',
                          background: mark.gradient,
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 14px rgba(0,0,0,0.25)',
                        }}
                      >
                        {mark.icon}
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: '#a78bfa',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        letterSpacing: 1.4,
                        textTransform: 'uppercase',
                      }}
                    >
                      Assessments
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.2rem' }, lineHeight: 1.25, mt: 0.25 }}>
                      Continue your exams
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.88rem', mt: 0.4 }}>
                      {stats.availableAssessments > 0
                        ? `${stats.availableAssessments} ready to start`
                        : 'See scores, retakes, and what unlocks next'}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  aria-hidden
                  sx={{
                    flexShrink: 0,
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    background: 'linear-gradient(135deg, #5b21b6 0%, #312e81 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 18px rgba(49, 46, 129, 0.35)',
                  }}
                >
                  <Box className="assessments-go-arrow" sx={{ display: 'flex', transition: 'transform 160ms ease' }}>
                    <ChevronRight size={28} />
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default Dashboard;
