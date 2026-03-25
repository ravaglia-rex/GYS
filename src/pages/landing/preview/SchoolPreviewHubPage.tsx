import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Quiz as QuizIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const cards = [
  {
    title: 'Institution dashboard & reports',
    body:
      'Open the full workspace preview: KPIs, tier mix, student table, and the institutional reports library — all with sample data. Use the left sidebar to move between Overview and Reports.',
    path: '/for-schools/preview/dashboard',
    icon: <DashboardIcon sx={{ fontSize: 44, color: '#3b82f6' }} />,
    accent: '#3b82f6',
    cta: 'Enter workspace',
  },
  {
    title: 'Sample student assessment',
    body: 'Answer a few multiple-choice items to see how the assessment flow feels for learners.',
    path: '/for-schools/preview/assessment',
    icon: <QuizIcon sx={{ fontSize: 44, color: '#10b981' }} />,
    accent: '#10b981',
    cta: 'Start sample assessment',
  },
];

const SchoolPreviewHubPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0f1e',
        pt: { xs: 2, sm: 3 },
        pb: 6,
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Button
          variant="text"
          onClick={() => navigate('/for-schools')}
          sx={{ color: '#94a3b8', mb: 2, fontWeight: 600, '&:hover': { color: '#e2e8f0', bgcolor: 'rgba(255,255,255,0.04)' } }}
        >
          ← Back to For Schools
        </Button>

        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800, mb: 1 }}>
            Try the institution experience
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 560, mx: 'auto' }}>
            Enter a mock admin workspace with a working sidebar, or try a short sample assessment — no account required.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gap: 2.5 }}>
          {cards.map(c => (
            <Card
              key={c.path}
              sx={{
                bgcolor: '#1e293b',
                border: '1px solid #334155',
                transition: 'border-color 0.2s, transform 0.2s',
                '&:hover': { borderColor: `${c.accent}55`, transform: 'translateY(-2px)' },
              }}
            >
              <CardContent sx={{ p: '24px !important' }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2.5, alignItems: { sm: 'center' } }}>
                  <Box sx={{ flexShrink: 0 }}>{c.icon}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>
                      {c.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {c.body}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(c.path)}
                    sx={{
                      bgcolor: c.accent,
                      fontWeight: 700,
                      px: 2.5,
                      whiteSpace: 'nowrap',
                      '&:hover': { bgcolor: c.accent, filter: 'brightness(1.08)' },
                    }}
                  >
                    {c.cta}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default SchoolPreviewHubPage;
