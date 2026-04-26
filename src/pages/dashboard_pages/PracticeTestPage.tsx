import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { FlaskConical } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as Sentry from '@sentry/react';

const PracticeTestPage: React.FC = () => {
  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'PracticeTestPage');
      }}
    >
      <DashboardLayout>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #a78bfa, #38bdf8)',
                color: 'white',
              }}
            >
              <FlaskConical size={32} />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #a78bfa, #38bdf8)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Practice Mode
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.75)', mt: 0.5 }}>
                Warm up with sample questions before your programme assessments.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              borderRadius: 2,
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1.5 }}>
              Coming soon
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              We are building practice modes so you can build confidence at your own pace. Check back after your next
              portal update.
            </Typography>
          </Box>
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default PracticeTestPage;
