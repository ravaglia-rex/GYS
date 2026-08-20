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

const LeaderboardPage: React.FC = () => {
  const { data, isLoading: loading, isError, error: queryError } = useStudentSchoolLeaderboard();
  const initialGrade = data?.grade ?? 10;
  const sections = data?.sections ?? [];
  const lastUpdatedISO = data?.lastUpdatedISO ?? null;
  const error = isError
    ? 'Could not load official school leaderboard data. Please try again later.'
    : '';

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, minWidth: 0, width: '100%' }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  background: 'linear-gradient(135deg, #f59e0b, #8b5cf6)',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <EmojiEvents sx={{ fontSize: 36 }} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    ...studentPageTitleSx,
                    minWidth: 0,
                  }}
                >
                  School Leaderboard
                </Typography>
                <Typography variant="h6" sx={studentPageSubtitleSx}>
                  See how students at your school compare on each exam, by class.
                </Typography>
              </Box>
            </Box>
          
          </Box>

          <Box
            data-tutorial-id="student-leaderboard-panel"
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'rgba(30, 41, 59, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {loading ? (
              <Box
                role="status"
                aria-live="polite"
                sx={{
                  minHeight: { xs: 360, md: 'calc(100vh - 260px)' },
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
                <StudentLeaderboardPanel
                  initialGrade={initialGrade}
                  sections={sections}
                  sectionsByGrade={data?.sectionsByGrade}
                  lastUpdatedISO={lastUpdatedISO}
                />
              </>
            )}
          </Box>
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default LeaderboardPage;
