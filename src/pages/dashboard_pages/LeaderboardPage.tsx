import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Box, Typography } from '@mui/material';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import * as Sentry from '@sentry/react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StudentLeaderboardPanel from '../../components/dashboard/StudentLeaderboardPanel';
import BigSpinner from '../../components/ui/BigSpinner';
import { getStudentSchoolLeaderboard } from '../../db/studentLeaderboardCollection';
import { type ExamLeaderboardSection, type LeaderboardGrade } from '../../utils/leaderboard';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { studentPageSubtitleSx, studentPageTitleSx } from '../../styles/studentTypography';

const LeaderboardPage: React.FC = () => {
  const [initialGrade, setInitialGrade] = useState<LeaderboardGrade>(10);
  const [sections, setSections] = useState<ExamLeaderboardSection[]>([]);
  const [lastUpdatedISO, setLastUpdatedISO] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getStudentSchoolLeaderboard()
      .then((data) => {
        if (cancelled) return;
        setInitialGrade(data.grade);
        setSections(data.sections);
        setLastUpdatedISO(data.lastUpdatedISO);
        setError('');
      })
      .catch((err) => {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'LeaderboardPage.load');
          scope.captureException(err);
        });
        if (!cancelled) {
          setSections([]);
          setLastUpdatedISO(null);
          setError('Could not load official school leaderboard data. Please try again later.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  background: 'linear-gradient(135deg, #f59e0b, #8b5cf6)',
                  color: 'white',
                }}
              >
                <EmojiEvents sx={{ fontSize: 36 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    ...studentPageTitleSx,
                  }}
                >
                  School Leaderboard
                </Typography>
                <Typography variant="h6" sx={studentPageSubtitleSx}>
                  See how you compare with classmates at your school on each exam. Available when your school’s cohort data is published.
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
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <BigSpinner />
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
