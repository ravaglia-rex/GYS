import React, { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { FileDownload as DownloadIcon } from '@mui/icons-material';
import { BookOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AssessmentAttemptHistorySection from '../../../components/dashboard/AssessmentAttemptHistorySection';
import { EnhancedAssessmentCardsGroup } from '../../../components/dashboard/EnhancedAssessmentCardsGroup';
import {
  PREVIEW_ASSESSMENT_ATTEMPTS,
  PREVIEW_ASSESSMENT_PROGRESS,
  PREVIEW_ASSESSMENT_TYPES,
  PREVIEW_MEMBERSHIP_LEVEL,
  PREVIEW_STUDENT_PROFILE,
} from '../../../data/studentPreviewMock';

const SAMPLE_ASSESSMENT_PATH = '/for-schools/preview/assessment';
const SAMPLE_ASSESSMENT_EXIT = '/students/preview/assessments/available';

function a11yProps(index: number) {
  return {
    id: `preview-assessment-tab-${index}`,
    'aria-controls': `preview-assessment-tabpanel-${index}`,
  };
}

const tabSx = {
  backgroundColor: 'rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  mb: 1,
};

const panelSx = {
  backgroundColor: 'rgba(30, 41, 59, 0.5)',
  borderRadius: 2,
  p: 3,
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const MOCK_REPORTS = [
  {
    id: 'preview-milestone-3',
    title: 'Milestone 3 Progress Report',
    milestone: 'Milestone 3',
    generated: '1 May 2026',
    status: 'Ready',
    summary: 'Reasoning triad complete with strong mathematical reasoning and steady verbal growth.',
  },
  {
    id: 'preview-skills-baseline',
    title: 'Skills Baseline Snapshot',
    milestone: 'Skills track',
    generated: '18 Apr 2026',
    status: 'Sample',
    summary: 'English proficiency is in progress; AI Proficiency is unlocked next in this sample path.',
  },
];

const StudentPreviewAssessmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  const activeTab = useMemo(() => {
    if (location.pathname.includes('/completed')) return 1;
    if (location.pathname.includes('/reports')) return 2;
    return 0;
  }, [location.pathname]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) navigate('/students/preview/assessments/available');
    if (newValue === 1) navigate('/students/preview/assessments/completed');
    if (newValue === 2) navigate('/students/preview/reports');
  };

  const showPreviewMessage = (message: string) => {
    setPreviewMessage(`Preview only - ${message}`);
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Snackbar
        open={Boolean(previewMessage)}
        autoHideDuration={6000}
        onClose={() => setPreviewMessage(null)}
        message={previewMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: 'white',
            }}
          >
            <BookOpen size={32} />
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
              Assessments
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 400 }}>
              Explore available exams, completed results, and reports for {PREVIEW_STUDENT_PROFILE.firstName}.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Alert
        severity="info"
        sx={{
          mb: 3,
          bgcolor: 'rgba(59, 130, 246, 0.15)',
          color: '#e2e8f0',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          '& .MuiAlert-icon': { color: '#93c5fd' },
        }}
      >
        This page mirrors the signed-in assessment area with static sample data. Official starts, retakes, and PDF
        downloads stay disabled in the public preview.
      </Alert>

      <Paper data-tutorial-id="student-assessments-tabs" sx={tabSx}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="preview assessment tabs"
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': { color: '#8b5cf6' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#8b5cf6' },
          }}
        >
          <Tab label="Available" {...a11yProps(0)} />
          <Tab label="Completed & Results" {...a11yProps(1)} />
          <Tab label="Reports" {...a11yProps(2)} />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Box role="tabpanel" id="preview-assessment-tabpanel-0" aria-labelledby="preview-assessment-tab-0" sx={{ py: 3 }}>
          <Box data-tutorial-id="student-assessments-cards" sx={panelSx}>
            <EnhancedAssessmentCardsGroup
              uid=""
              filterType="available"
              showDashboardOverview={false}
              description="These are the exams not yet fully completed in the sample learner path. Start and retake buttons are visible but disabled for the public preview."
              previewBundle={{
                assessments: PREVIEW_ASSESSMENT_TYPES,
                progress: PREVIEW_ASSESSMENT_PROGRESS,
                membershipLevel: PREVIEW_MEMBERSHIP_LEVEL,
                previewAssessmentPath: SAMPLE_ASSESSMENT_PATH,
                previewSampleExitTo: SAMPLE_ASSESSMENT_EXIT,
                previewGrade: PREVIEW_STUDENT_PROFILE.grade,
                previewDisableStartNavigation: true,
              }}
            />
          </Box>
        </Box>
      )}

      {activeTab === 1 && (
        <Box role="tabpanel" id="preview-assessment-tabpanel-1" aria-labelledby="preview-assessment-tab-1" sx={{ py: 3 }}>
          <Box sx={panelSx}>
            <EnhancedAssessmentCardsGroup
              uid=""
              filterType="completed"
              showDashboardOverview={false}
              description="Completed sample assessments and visible score history appear here, matching the signed-in results area."
              previewBundle={{
                assessments: PREVIEW_ASSESSMENT_TYPES,
                progress: PREVIEW_ASSESSMENT_PROGRESS,
                membershipLevel: PREVIEW_MEMBERSHIP_LEVEL,
                previewAssessmentPath: SAMPLE_ASSESSMENT_PATH,
                previewSampleExitTo: '/students/preview/assessments/completed',
                previewGrade: PREVIEW_STUDENT_PROFILE.grade,
                previewDisableStartNavigation: true,
              }}
            />

            <AssessmentAttemptHistorySection
              previewAttempts={PREVIEW_ASSESSMENT_ATTEMPTS}
              previewAssessments={PREVIEW_ASSESSMENT_TYPES}
            />
          </Box>
        </Box>
      )}

      {activeTab === 2 && (
        <Box role="tabpanel" id="preview-assessment-tabpanel-2" aria-labelledby="preview-assessment-tab-2" sx={{ py: 3 }}>
          <Box data-tutorial-id="student-reports-list" sx={panelSx}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
              Reports
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)', mb: 3, maxWidth: 760 }}>
              Signed-in students can download official milestone reports here. The preview keeps PDF downloads disabled
              but shows the same report list and action placement.
            </Typography>

            <Box sx={{ display: 'grid', gap: 2 }}>
              {MOCK_REPORTS.map((report) => (
                <Paper
                  key={report.id}
                  elevation={0}
                  sx={{
                    bgcolor: 'rgba(15, 23, 42, 0.58)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 2,
                    p: 2,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: '1 1 360px' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 0.75 }}>
                      <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700 }}>
                        {report.title}
                      </Typography>
                      <Chip size="small" label={report.status} sx={{ bgcolor: 'rgba(16,185,129,0.16)', color: '#86efac', fontWeight: 700 }} />
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.55)', mb: 0.75 }}>
                      {report.milestone} - Generated {report.generated}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                      {report.summary}
                    </Typography>
                  </Box>
                  <Tooltip title="Official PDF downloads are available after sign-in.">
                    <span>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        disabled
                        onClick={() => showPreviewMessage('report downloads are disabled.')}
                        sx={{ borderColor: '#64748b', color: '#94a3b8', fontWeight: 700, textTransform: 'none' }}
                      >
                        Download PDF
                      </Button>
                    </span>
                  </Tooltip>
                </Paper>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default StudentPreviewAssessmentsPage;
