import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Quiz as QuizIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const cards = [
  {
    title: 'Institution dashboard & reports',
    body:
      'Same navy header, sidebar, and Overview as a signed-in school admin - loaded with the Greenfield International School snapshot (srishti+6@argus.ai seed), no login required.',
    path: '/for-schools/preview/dashboard',
    icon: <DashboardIcon sx={{ fontSize: 44, color: '#3b82f6' }} />,
    accent: '#3b82f6',
    cta: 'Enter workspace',
  },
  {
    title: 'Sample student dashboard',
    body:
      'Open the same learner home and sidebar as signed-in students: Dashboard, Assessments, Reports, Billing, and Settings - powered by static demo data.',
    path: '/students/preview/dashboard',
    icon: <PersonIcon sx={{ fontSize: 44, color: '#8b5cf6' }} />,
    accent: '#8b5cf6',
    cta: 'Open sample dashboard',
  },
  {
    title: 'Sample student assessment',
    body:
      'Walk through 10 Symbolic Reasoning - style items in the same full-screen layout students see - sample banner, timer look, and exit anytime.',
    path: '/for-schools/preview/assessment',
    icon: <QuizIcon sx={{ fontSize: 44, color: '#10b981' }} />,
    accent: '#10b981',
    cta: 'Start sample assessment',
  },
];

const SchoolPreviewHubPage: React.FC = () => {
  const navigate = useNavigate();

  const goToPreviewPath = (path: string) => {
    navigate(path);
  };

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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
          <Button
            variant="text"
            onClick={() => navigate('/for-schools')}
            sx={{ color: '#94a3b8', fontWeight: 600, '&:hover': { color: '#e2e8f0', bgcolor: 'rgba(255,255,255,0.04)' } }}
          >
            ← Back to For Schools
          </Button>
          <Button
            variant="text"
            onClick={() => navigate('/')}
            sx={{ color: '#94a3b8', fontWeight: 600, '&:hover': { color: '#e2e8f0', bgcolor: 'rgba(255,255,255,0.04)' } }}
          >
            Home
          </Button>
        </Box>

        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 800, mb: 1 }}>
            Try the institution experience
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 560, mx: 'auto' }}>
            Try a mock admin workspace, a full learner dashboard preview, or a short sample assessment - no account required.
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
                    onClick={() => goToPreviewPath(c.path)}
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
