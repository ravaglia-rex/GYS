import React from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import { BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as Sentry from '@sentry/react';

/** Program-level narrative reports (beyond per-assessment results) — not built yet for v2. */
const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'ReportsPage');
      }}
    >
      <DashboardLayout>
        <Box sx={{ maxWidth: '720px', mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                color: 'white',
              }}
            >
              <BarChart2 size={32} />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Reports
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.75)', mt: 0.5 }}>
                Deep-dive programme reports will appear here as we roll out each assessment.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              borderRadius: 2,
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Where to see scores today
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.78)', mb: 2 }}>
              Your tier scores and outcomes for assessments you have completed — including Pattern and Logic
              (symbolic reasoning) — are on{' '}
              <strong style={{ color: '#93c5fd' }}>Completed &amp; Results</strong> under Assessments.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/assessments/completed')} sx={{ mt: 1 }}>
              Go to completed assessments
            </Button>
          </Box>
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default ReportsPage;
