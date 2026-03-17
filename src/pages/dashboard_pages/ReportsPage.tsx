import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { BarChart2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AnalysisSection from '../../components/dashboard/AnalysisSection';
import { auth } from '../../firebase/firebase';
import { getPhase2ExamResponse } from '../../db/phase2ExamResponsesCollection';
import * as Sentry from '@sentry/react';

const ReportsPage: React.FC = () => {
  const uid = auth.currentUser?.uid || '';
  const [hasPhase2Exam, setHasPhase2Exam] = useState(false);
  const [loadingPhase2Check, setLoadingPhase2Check] = useState(true);

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

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'ReportsPage');
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
                background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                color: 'white',
              }}>
                <BarChart2 size={32} />
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
                  Reports
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 400 }}>
                  Detailed analysis and insights from your exam performance
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Content */}
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
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default ReportsPage;
