import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Paper, Avatar } from '@mui/material';
import { BookOpen } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import EnhancedExamCardsGroup from '../../components/dashboard/EnhancedExamCardsGroup';
import { auth } from '../../firebase/firebase';
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

  // Debug logging

  // Determine active tab based on current route
  useEffect(() => {
    if (pathname.includes('/available')) {
      setActiveTab(0);
    } else if (pathname.includes('/completed')) {
      setActiveTab(1);
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
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default ExamsPage;
