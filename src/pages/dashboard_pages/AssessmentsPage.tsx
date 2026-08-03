import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Paper, Avatar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BookOpen } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { EnhancedAssessmentCardsGroup } from '../../components/dashboard/EnhancedAssessmentCardsGroup';
import AssessmentAttemptHistorySection from '../../components/dashboard/AssessmentAttemptHistorySection';
import { auth } from '../../firebase/firebase';
import * as Sentry from '@sentry/react';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { studentPageSubtitleSx, studentPageTitleSx } from '../../styles/studentTypography';
import { canAccessOfficialStudentAssessments } from '../../utils/officialStudentAssessmentsAccess';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`assessment-tabpanel-${index}`}
      aria-labelledby={`assessment-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `assessment-tab-${index}`,
    'aria-controls': `assessment-tabpanel-${index}`,
  };
}

const AssessmentsPage: React.FC = () => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid || '';
  const officialAssessmentsEnabled = canAccessOfficialStudentAssessments(auth.currentUser?.email);
  const [activeTab, setActiveTab] = useState(0);

  // Determine active tab based on current route
  useEffect(() => {
    if (pathname.includes('/available')) {
      setActiveTab(0);
    } else if (pathname.includes('/completed')) {
      setActiveTab(1);
    } else if (pathname.includes('/reports')) {
      setActiveTab(2);
    } else {
      setActiveTab(0); // Default to available
    }
  }, [pathname]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    switch (newValue) {
      case 0:
        navigate('/assessments/available');
        break;
      case 1:
        navigate('/assessments/completed');
        break;
      case 2:
        navigate('/assessments/reports');
        break;
      default:
        navigate('/assessments/available');
    }
  };

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'AssessmentsPage');
      }}
    >
      <DashboardLayout>
        <PageTutorial pageKey="student.assessments" />
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: 2 }}>
              <Avatar sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: 'white',
                flexShrink: 0,
              }}>
                <BookOpen size={32} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h4" sx={{ 
                  ...studentPageTitleSx,
                  minWidth: 0,
                }}>
                  Assessments
                </Typography>
                <Typography variant="h6" sx={studentPageSubtitleSx}>
                  {officialAssessmentsEnabled
                    ? 'Take assessments, view results, and track your progress'
                    : 'Official exams are coming soon; practice mode remains available'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Tabs */}
          <Paper
            data-tutorial-id="student-assessments-tabs"
            sx={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.8)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 1
          }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="assessment tabs"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#8b5cf6',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#8b5cf6',
                },
              }}
            >
              <Tab label="Available" {...a11yProps(0)} />
              <Tab
                label={isPhone ? 'Results' : 'Completed & Results'}
                aria-label="Completed and Results"
                {...a11yProps(1)}
              />
              <Tab label="Reports" {...a11yProps(2)} />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            <Box
              data-tutorial-id="student-assessments-cards"
              sx={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.5)', 
              borderRadius: 2, 
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <EnhancedAssessmentCardsGroup 
                uid={uid} 
                filterType="available" 
                showDashboardOverview={false}
                description={
                  officialAssessmentsEnabled
                    ? 'These are the assessments currently available for you to take. Make sure your device meets all requirements before starting.'
                    : 'Official exams are shown for reference, but they are not open yet while the real question banks are being prepared.'
                }
              />
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.5)', 
              borderRadius: 2, 
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <EnhancedAssessmentCardsGroup 
                uid={uid} 
                filterType="completed" 
                showDashboardOverview={false}
                description="View your completed assessments and their results. All assessment outcomes and performance analytics are displayed here."
              />
              <AssessmentAttemptHistorySection uid={uid} />
            </Box>
          </TabPanel>

        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default AssessmentsPage;
