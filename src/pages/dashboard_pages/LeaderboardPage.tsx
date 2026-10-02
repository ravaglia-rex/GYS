import React, { useEffect } from 'react';
import { Alert, Avatar, Box, Typography } from '@mui/material';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import * as Sentry from '@sentry/react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StudentLeaderboardPanel from '../../components/dashboard/StudentLeaderboardPanel';
import { LoadingSpinner } from '../../components/ui/spinner';
import { useStudentSchoolLeaderboard } from '../../query/hooks';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { studentPageSubtitleSx, studentPageTitleSx } from '../../styles/studentTypography';
import { areExamScoresVisible } from '../../constants/constants';

const LeaderboardPage: React.FC = () => {
  const { data, isLoading: loading, isError, error: queryError } = useStudentSchoolLeaderboard();
  const initialGrade = data?.grade ?? 10;
  const keepVisible = (section: { examId: string }) => areExamScoresVisible(section.examId);
  const sections = (data?.sections ?? []).filter(keepVisible);
  const sectionsByGrade = data?.sectionsByGrade
    ? Object.fromEntries(
        Object.entries(data.sectionsByGrade).map(([grade, list]) => [
          grade,
          (list ?? []).filter(keepVisible),
        ])
      )
    : undefined;
  const lastUpdatedISO = data?.lastUpdatedISO ?? null;
  const error = isError
    ? 'Could not load official school leaderboard data. Please try again later.'
    : '';
  const scoresDeferred =
    (data as { scores_deferred?: boolean } | undefined)?.scores_deferred === true ||
    sections.length === 0;

  useEffect(() => {
    if (!isError || !queryError) return;
    Sentry.withScope((scope) => {
      scope.setTag('location', 'LeaderboardPage.load');
      scope.captureException(queryError);
    });
  }, [isError, queryError]);

  return (
    <Sentry.ErrorBoundary beforeCapture={(s) => s.setTag('location', 'LeaderboardPage')}>
      <DashboardLayout>
        <PageTutorial pageKey="student.leaderboard" ready={!loading} />
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Box
            data-tutorial-id="student-leaderboard-intro"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', minWidth: 0 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(245, 158, 11, 0.18)',
                  color: '#fbbf24',
                  width: 48,
                  height: 48,
                }}
              >
                <EmojiEvents />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={studentPageTitleSx}>Leaderboard</Typography>
                <Typography sx={studentPageSubtitleSx}>
                  {scoresDeferred
                    ? 'Official exam standings will appear here once results are released.'
                    : 'Top 10 Analytical Reasoning scores at your school, by class.'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box data-tutorial-id="student-leaderboard-panel">
            {loading ? (
              <Box
                sx={{
                  minHeight: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  color: 'rgba(255, 255, 255, 0.86)',
                  textAlign: 'center',
                }}
              >
                <LoadingSpinner size={72} />
                <Typography sx={{ fontWeight: 600, letterSpacing: '0.02em' }}>
                  Loading leaderboard...
                </Typography>
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                {scoresDeferred ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Scores and rankings are not available yet. Keep an eye on the portal — your
                    results will show up when they are ready.
                  </Alert>
                ) : (
                  <StudentLeaderboardPanel
                    initialGrade={initialGrade}
                    sections={sections}
                    sectionsByGrade={sectionsByGrade}
                    nationalByGrade={data?.nationalByGrade}
                    lastUpdatedISO={lastUpdatedISO}
                  />
                )}
              </>
            )}
          </Box>
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default LeaderboardPage;
