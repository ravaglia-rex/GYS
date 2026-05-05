import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Box, Typography } from '@mui/material';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import * as Sentry from '@sentry/react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StudentLeaderboardPanel from '../../components/dashboard/StudentLeaderboardPanel';
import { auth } from '../../firebase/firebase';
import { getStudent } from '../../db/studentCollection';
import { clampToLeaderboardGrade, type LeaderboardGrade } from '../../data/leaderboardMock';

const LeaderboardPage: React.FC = () => {
  const [initialGrade, setInitialGrade] = useState<LeaderboardGrade>(10);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    let cancelled = false;
    void getStudent(uid)
      .then((student) => {
        if (!cancelled) setInitialGrade(clampToLeaderboardGrade(student?.grade));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Sentry.ErrorBoundary beforeCapture={(s) => s.setTag('location', 'LeaderboardPage')}>
      <DashboardLayout>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Box
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
                    color: 'white',
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #fbbf24, #a78bfa)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  School Leaderboard
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.72)', mt: 0.5 }}>
                  See how you compare with classmates at your school on each exam, by grade - not national rankings. Available when your school’s cohort data is published.
                </Typography>
              </Box>
            </Box>
          
          </Box>

          <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(59, 130, 246, 0.12)', color: '#e2e8f0', border: '1px solid rgba(59, 130, 246, 0.35)', '& .MuiAlert-icon': { color: '#93c5fd' } }}>
            Official cohort rankings may not be loaded yet for your account. The table below shows the layout of school
            standings by exam and grade when data is published.
          </Alert>

          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'rgba(30, 41, 59, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <StudentLeaderboardPanel initialGrade={initialGrade} />
          </Box>
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default LeaderboardPage;
