import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Paper, Avatar } from '@mui/material';
import { BookOpen } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import EnhancedExamCardsGroup from '../../components/dashboard/EnhancedExamCardsGroup';
import AnalysisSection from '../../components/dashboard/AnalysisSection';
import { auth } from '../../firebase/firebase';
import { getPhase2ExamResponse } from '../../db/phase2ExamResponsesCollection';
import * as Sentry from '@sentry/react';


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
      id={`exam-tabpanel-${index}`}
      aria-labelledby={`exam-tab-${index}`}
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
    id: `exam-tab-${index}`,
    'aria-controls': `exam-tabpanel-${index}`,
  };
}

const ExamsPage: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid || '';
  const [activeTab, setActiveTab] = useState(0);
  const [hasPhase2Exam, setHasPhase2Exam] = useState(false);
  const [loadingPhase2Check, setLoadingPhase2Check] = useState(true);

  // Debug logging

  // Check if student has Phase 2 exam data
  useEffect(() => {
    const checkPhase2Exam = async () => {
      if (!uid) {
        setLoadingPhase2Check(false);
        return;
      }
      
      try {
        const phase2Response = await getPhase2ExamResponse(uid);
        setHasPhase2Exam(!!phase2Response);
      } catch (error) {
        console.error('Error checking Phase 2 exam:', error);
        setHasPhase2Exam(false);
      } finally {
        setLoadingPhase2Check(false);
      }
    };

    checkPhase2Exam();
  }, [uid]);

  // Determine active tab based on current route
  useEffect(() => {
    if (pathname.includes('/available')) {
      setActiveTab(0);
    } else if (pathname.includes('/completed')) {
      setActiveTab(1);
    } else if (pathname.includes('/analysis')) {
      setActiveTab(2);
    } else {
      setActiveTab(0); // Default to available
    }
  }, [pathname]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Navigate to the corresponding route
    switch (newValue) {
      case 0:
        navigate('/exams/available');
        break;
      case 1:
        navigate('/exams/completed');
        break;
      case 2:
        navigate('/exams/analysis');
        break;
      default:
        navigate('/exams/available');
    }
  };

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'ExamsPage');
      }}
    >
      <DashboardLayout>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: 'white',
              }}>
                <BookOpen size={32} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ 
                  color: 'white', 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Exams & Assessments
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 400 }}>
                  Take exams, view results, and track your progress
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Tabs */}
          <Paper sx={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.8)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 1
          }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="exam tabs"
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
              <Tab label="Completed & Results" {...a11yProps(1)} />
              <Tab label="Analysis" {...a11yProps(2)} />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.5)', 
              borderRadius: 2, 
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <EnhancedExamCardsGroup 
                uid={uid} 
                filterType="available" 
                showDashboardOverview={false}
                description="These are the exams currently available for you to take. Make sure your device meets all requirements before starting."
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
              <EnhancedExamCardsGroup 
                uid={uid} 
                filterType="completed" 
                showDashboardOverview={false}
                description="View your completed exams and their results. All exam outcomes and performance analytics are displayed here."
              />
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.5)', 
              borderRadius: 2, 
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {loadingPhase2Check ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 2,
                  py: 4
                }}>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Checking for analysis data...
                  </Typography>
                </Box>
              ) : hasPhase2Exam ? (
                <AnalysisSection studentId={uid} />
              ) : (
                <Box>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
                    Detailed Exam Analysis
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3 }}>
                    Get comprehensive insights and detailed analysis of your Phase 2 exam performance.
                  </Typography>
                  
                  <Box sx={{ 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 600, mb: 2 }}>
                      No Phase 2 Exam Data Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                      You need to complete a Phase 2 exam to access detailed personality analysis.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Once you complete a Phase 2 exam, you'll be able to view your comprehensive analysis here.
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </TabPanel>
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default ExamsPage;
