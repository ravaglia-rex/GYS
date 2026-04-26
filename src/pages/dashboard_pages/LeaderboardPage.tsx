import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import * as Sentry from '@sentry/react';
import DashboardLayout from '../../layouts/DashboardLayout';

const LeaderboardPage: React.FC = () => {
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
                  Leaderboard
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.72)', mt: 0.5 }}>
                  See how you compare on score-based exams within your grade band, when cohort data is available.
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="caption"
              component="div"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                textAlign: { xs: 'left', sm: 'right' },
                maxWidth: 260,
                lineHeight: 1.45,
              }}
            >
              Last updated:{' '}
              <Box component="span" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                Not published
              </Box>
              <Box sx={{ display: 'block', mt: 0.5, color: 'rgba(255,255,255,0.45)' }}>
                Shown once your school’s cohort snapshot is available.
              </Box>
            </Typography>
          </Box>

          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'rgba(30, 41, 59, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1.5 }}>
              No leaderboard data yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', mb: 1.5 }}>
              There is no leaderboard information to show for your account right now. Official cohort rankings are not
              loaded in the portal yet, or your programme has not published them for your cohort.
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Check back later, or ask your school coordinator if rankings should be available for your batch.
            </Typography>
          </Box>
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default LeaderboardPage;
