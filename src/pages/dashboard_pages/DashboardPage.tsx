import React, { useEffect, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { getStudent } from '../../db/studentCollection';
import { getAssessmentConfig } from '../../db/assessmentCollection';
import * as Sentry from '@sentry/react';
import DashboardOverview from '../../components/dashboard/DashboardOverview';
import { EnhancedAssessmentCardsGroup } from '../../components/dashboard/EnhancedAssessmentCardsGroup';
import {
  ASSESSMENT_ORDER,
  PROGRAM_EXAM_COUNT,
  computeGate,
  membershipLevelForAssessmentGate,
  defaultAssessmentProgress,
  isAssessmentFullyComplete,
  buildDashboardExamChartRows,
  type AssessmentChartRow,
} from '../../utils/assessmentGating';
import { STUDENT_OFFICIAL_ASSESSMENTS_ENABLED } from '../../constants/constants';

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
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalAssessments: PROGRAM_EXAM_COUNT,
    tiersCompleted: 0,
    averageScore: 0,
    availableAssessments: 0,
  });
  const [scoresByAssessment, setScoresByAssessment] = useState<AssessmentChartRow[]>([]);
  const [assessmentScopeLine, setAssessmentScopeLine] = useState<string>('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setUid(user?.uid ?? '');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const load = async () => {
      try {
        setLoading(true);
        const [student, configFromBackend] = await Promise.all([getStudent(uid), getAssessmentConfig()]);
        setLoadError('');
        const progress: Record<string, AssessmentProgress> = student?.assessment_progress ?? {};
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

        for (const a of sorted) {
          const p = progress[a.id] ?? defaultAssessmentProgress;
          const gate = computeGate(a.id, membershipLevel, progress, studentGrade, sorted);
          const done =
            p.status === 'tier_advanced' || isAssessmentFullyComplete(a, p);
          if (done) tiersCompleted++;
          if (!gate.locked && !isAssessmentFullyComplete(a, p)) availableAssessments++;
        }

        const listedTotal = Math.max(sorted.length, PROGRAM_EXAM_COUNT);
        setAssessmentScopeLine(
          `${tiersCompleted} of ${listedTotal} complete`
        );

        // Average score across all assessments that have a best score
        const scoresWithValues = Object.values(progress).filter((p) => p.best_score !== null);
        const avgScore =
          scoresWithValues.length > 0
            ? Math.round(
                (scoresWithValues.reduce((sum, p) => sum + (p.best_score ?? 0), 0) /
                  scoresWithValues.length) *
                  1000
              )
            : 0;

        setStats({
          totalAssessments: listedTotal,
          tiersCompleted,
          averageScore: avgScore,
          availableAssessments,
        });

        setScoresByAssessment(
          buildDashboardExamChartRows(sorted, progress, membershipLevel, studentGrade)
        );
      } catch (err) {
        setLoadError('Could not load your dashboard data. Please refresh or try again later.');
        setScoresByAssessment([]);
        setAssessmentScopeLine('');
        Sentry.withScope((scope) => {
          scope.setTag('location', 'DashboardPage.load');
          scope.setExtra('uid', uid);
          scope.captureException(err);
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [uid]);

  return (
    <Sentry.ErrorBoundary beforeCapture={(s) => s.setTag('location', 'DashboardPage')}>
      <DashboardLayout
        availableAssessmentsCount={stats.availableAssessments}
        resultsAvailableCount={stats.tiersCompleted}
      >
        <Box sx={{ p: 0 }}>
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
                stats={{
                  totalAssessments: stats.totalAssessments,
                  completedAssessments: stats.tiersCompleted,
                  averageScore: stats.averageScore,
                  availableAssessments: stats.availableAssessments,
                }}
                latestAssessmentResults={scoresByAssessment}
              />
              <Box sx={{ mt: 4, ml: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 2 }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                    Your Assessments
                  </Typography>
                  {assessmentScopeLine && (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                      {assessmentScopeLine}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', mb: 2, maxWidth: 720 }}>
                  {STUDENT_OFFICIAL_ASSESSMENTS_ENABLED
                    ? 'All assessments are listed below. Complete them in sequence where your membership allows - Reasoning Triad covers Exams 1-3; Reasoning + Skills adds English and AI Proficiency (4-5); Guided Decision adds the Insight group (6-7) and ongoing AI career counseling that begins after that baseline and grows as you log new experiences. Practice Mode uses a separate pool and does not change official scores.'
                    : 'Official exams are listed for reference, but they are not open yet while the real question banks are being prepared. Practice Mode remains available and uses a separate pool that does not change official scores.'}
                </Typography>
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
