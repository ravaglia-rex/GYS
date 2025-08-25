import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';
import { getExamIds } from '../../db/studentExamMappings';
import { getExamDetails } from '../../db/examDetailsCollection';
import { RootState } from '../../state_data/reducer';
import { setExamDetails, ExamDetailsPayload } from '../../state_data/examDetailsSlice';
import { getPayments } from '../../db/studentPaymentMappings';
import { setPayments } from '../../state_data/studentPaymentsSlice';
import BigSpinner from '../ui/BigSpinner';
import { auth } from '../../firebase/firebase';
import DashboardOverview from './DashboardOverview';
import EnhancedExamCard from './EnhancedExamCard';
import { fetchResultTotals } from '../../db/examResponsesCollection';
import authTokenHandler from '../../functions/auth_token/auth_token_handler';

import * as Sentry from '@sentry/react';
import segment from '../../segment/segment';

interface EnhancedExamCardsGroupProps {
  uid: string;
  filterType?: 'available' | 'completed' | 'results' | 'all';
  showDashboardOverview?: boolean;
  description?: string;
}

const EnhancedExamCardsGroup: React.FC<EnhancedExamCardsGroupProps> = ({ 
  uid, 
  filterType = 'all', 
  showDashboardOverview = false,
  description 
}) => {
  const dispatch = useDispatch();
  const examDetailsState = useSelector((state: RootState) => state.examDetails.examDetails);
  const examDetailsLoaded = useSelector((state: RootState) => state.examDetails.examDetailsLoaded);
  const paymentsState = useSelector((state: RootState) => state.studentPayments.payments);
  const paymentsLoaded = useSelector((state: RootState) => state.studentPayments.paymentsLoaded);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestExamResults, setLatestExamResults] = useState<{ subject: string; score: number; maxScore: number }[]>([]);

  // Fetch latest exam results for spider chart
  useEffect(() => {
    const fetchLatestResults = async () => {
      if (!examDetailsState || examDetailsState.length === 0) {
        setLatestExamResults([]);
        return;
      }

      // Find the most recent completed exam
      const completedExams = examDetailsState.filter(exam => exam.completed);
      
      if (completedExams.length === 0) {
        setLatestExamResults([]);
        return;
      }

      // Get the first completed exam (assuming they're already sorted by completion date)
      const latestExam = completedExams[0];
      
      try {
        // Fetch the actual result totals for this exam
        const resultTotals = await fetchResultTotals(uid, latestExam.formId);
        
        if (resultTotals && resultTotals.typeTotals) {
          // Convert typeTotals to spider chart data format
          const chartData = Object.entries(resultTotals.typeTotals).map(([subject, score]) => ({
            subject: subject.charAt(0).toUpperCase() + subject.slice(1), // Capitalize first letter
            score: score as number,
            maxScore: 10 // Assuming max score is 10 for each subject, adjust as needed
          }));
          setLatestExamResults(chartData);
        } else {
          setLatestExamResults([]);
        }
      } catch (error) {
        console.error('Error fetching result totals for spider chart:', error);
        setLatestExamResults([]);
      }
    };

    fetchLatestResults();
  }, [examDetailsState, uid]);

  // Calculate stats for the dashboard
  const calculateStats = () => {
    console.log('calculateStats called with examDetailsState:', examDetailsState);
    
    const totalExams = examDetailsState.length;
    const completedExams = examDetailsState.filter(exam => exam.completed).length;
    const upcomingExams = examDetailsState.filter(exam => !exam.completed && exam.eligibility_at).length;
    
    // Calculate average score from completed exams
    const completedExamsWithScores = examDetailsState.filter(
      exam => exam.completed && typeof exam.result === 'number' && !isNaN(exam.result)
    );
    const totalScore = completedExamsWithScores.reduce(
      (sum, exam) => sum + (typeof exam.result === 'number' ? exam.result : 0),
      0
    );
    const averageScore =
      completedExamsWithScores.length > 0
        ? Math.round(totalScore / completedExamsWithScores.length)
        : 0;

    const stats = {
      totalExams,
      completedExams,
      upcomingExams,
      averageScore
    };
    
    console.log('calculateStats result:', stats);
    return stats;
  };

  // Filter exams based on filterType
  const filterExams = (exams: any[]) => {
    switch (filterType) {
      case 'available':
        return exams.filter(exam => !exam.completed && checkEligibility(exam.eligibility_at));
      case 'completed':
        // Show all completed exams (both with and without results)
        return exams.filter(exam => exam.completed);
      case 'results':
        // This filter type is no longer used, but keeping for backward compatibility
        return exams.filter(exam => exam.completed && exam.result !== null && exam.result !== undefined);
      default:
        return exams;
    }
  };

  // Transform exam data for enhanced cards
  const transformExamData = (exam: any) => {
    const isCompleted = exam.completed;
    const isEligible = checkEligibility(exam.eligibility_at);
    
    let status: 'available' | 'completed' | 'upcoming' | 'in-progress' = 'available';
    if (isCompleted) {
      status = 'completed';
    } else if (!isEligible) {
      status = 'upcoming';
    }

    const transformedExam = {
      id: exam.formId,
      title: exam.cardTitle || `Exam ${exam.formId}`,
      description: exam.cardDescription || 'Complete this assessment to evaluate your knowledge and skills.',
      duration: exam.duration || 60,
      totalQuestions: exam.type_questions ? Object.values(exam.type_questions).reduce((sum: number, count: any) => sum + (count || 0), 0) : 50,
      eligibilityDate: exam.eligibility_at,
      completed: isCompleted,
      score: exam.result,
      status,
      paymentNeeded: exam.paymentNeeded,
      isProctored: exam.isProctored,
      cost: exam.cost,
      currency: exam.currency
    };

    return transformedExam;
  };

  const handleStartExam = (examId: string) => {
    // Navigate to exam or trigger exam start
    // You can add navigation logic here
  };

  const handleViewResults = (examId: string) => {
    // Navigate to results or show results modal
    // You can add navigation logic here
  };

  const checkEligibility = (eligibility_at: string | number) => {
    
    if (typeof eligibility_at === 'string') {
      if(eligibility_at.trim() === '') {
        return true;
      }
      try {
        const eligibilityDate = new Date(eligibility_at);
        const currentDate = new Date();
        const isEligible = currentDate >= eligibilityDate;
        return isEligible;
      } catch(e) {
        eligibility_at = Number(eligibility_at);
      }
    }
    
    if (typeof eligibility_at === 'number') {
      const eligibilityDate = new Date(eligibility_at);
      const currentDate = new Date();
      const isEligible = currentDate >= eligibilityDate;
      return isEligible;
    }
    
    // If eligibility_at is null, undefined, or any other type, consider it immediately available
    return true;
  };

  const transformPaymentData = (paymentData: any) => {
    return {
      paidOn: new Date(paymentData.paid_on),
      paymentMethod: paymentData.payment_method,
      paymentStatus: paymentData.payment_status,
      transactionId: paymentData.transaction_id,
      uid: paymentData.uid,
      formId: paymentData.form_id,
      amount: paymentData.amount,
    };
  };

  useEffect(() => {
    console.log('EnhancedExamCardsGroup useEffect triggered:', { 
      uid, 
      paymentsLoaded, 
      examDetailsLoaded,
      filterType,
      showDashboardOverview 
    });
    
    const loadPayments = async () => {
      const startTime = performance.now();
      try {
        console.log('Loading payments for uid:', uid);
        const paymentsData = await getPayments(uid);
        console.log('Payments data received:', paymentsData);
        if(paymentsData.length === 0) {
          dispatch(setPayments([]));
          setLoading(false);
          return;
        }
        const transformedData = paymentsData.map(transformPaymentData);
        dispatch(setPayments(transformedData));
        setLoading(false);
      } catch (error: any) {
        console.error('Error loading payments:', error);
        Sentry.withScope((scope) => {
          scope.setTag('location', 'EnhancedExamCardsGroup.loadPayments');
          scope.setExtra('email', auth.currentUser?.email);
          Sentry.captureException(error);
        });
        setError(error.message);
        setLoading(false);
      } finally {
        const endTime = performance.now();
        const fetchTime = endTime - startTime;
        segment.track('Fetch Payments Data Time', {
          fetchTime: fetchTime,
          email: auth.currentUser?.email,
          url: window.location.href
        });
      }
    };

    const loadExamDetails = async () => {
      const startTime = performance.now();
      try {
        console.log('Loading exam details for uid:', uid);
        console.log('Current user email:', auth.currentUser?.email);
        console.log('Environment variables:', {
          REACT_APP_GOOGLE_CLOUD_FUNCTIONS: process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS,
          NODE_ENV: process.env.NODE_ENV
        });
        console.log('API URL will be:', `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}/students/getExamIds/${uid}`);
        
        // Check if we have an auth token
        try {
          const authToken = await authTokenHandler.getAuthToken();
          console.log('Auth token obtained:', authToken ? 'Yes' : 'No');
          if (authToken) {
            console.log('Auth token length:', authToken.length);
          }
        } catch (tokenError) {
          console.error('Error getting auth token:', tokenError);
        }
        
        const { formLinks, completed, eligibility_at, result } = await getExamIds(uid);
        console.log('Exam IDs received:', { formLinks, completed, eligibility_at, result });
        
        if (!formLinks || formLinks.length === 0) {
          console.log('No form links found for uid:', uid);
          dispatch(setExamDetails({ examDetails: [], examDetailsLoaded: true }));
          setLoading(false);
          return;
        }
        
        console.log('Fetching exam details for form links:', formLinks);
        const details = await getExamDetails(formLinks);
        console.log('Exam details received:', details);
        
        if (!details || details.length === 0) {
          console.log('No exam details received for form links');
          dispatch(setExamDetails({ examDetails: [], examDetailsLoaded: true }));
          setLoading(false);
          return;
        }
        
        const validDetails: ExamDetailsPayload[] = details
          .filter((detail: any): detail is any => detail !== null && typeof detail === 'object')
          .map((detail: any, index) => {
            console.log(`Processing exam detail ${index}:`, detail);
            const examData = {
              formId: formLinks[index],
              additionalInstructions: detail.additional_instructions,
              examDetails: detail.exam_details,
              duration: detail.duration,
              cardTitle: detail.card_title,
              cardDescription: detail.card_description,
              paymentNeeded: detail.payment_needed,
              completed: completed[index],
              cost: detail.cost,
              currency: detail.currency,
              isProctored: detail.is_proctored,
              eligibility_at: eligibility_at[index],
              result: result[index],
              type_questions: detail.type_questions ? JSON.parse(detail.type_questions) : {},
            };
            
            console.log(`Transformed exam data ${index}:`, examData);
            return examData;
          });

        console.log('Final transformed exam details:', validDetails);
        dispatch(setExamDetails({ examDetails: validDetails, examDetailsLoaded: true }));
        setLoading(false);
      } catch (error: any) {
        console.error('Error loading exam details:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data
        });
        Sentry.withScope((scope) => {
          scope.setTag('location', 'EnhancedExamCardsGroup.loadExamDetails');
          scope.setExtra('email', auth.currentUser?.email);
          scope.setExtra('uid', uid);
          scope.setExtra('error', error);
          Sentry.captureException(error);
        });
        setError(error.message);
        setLoading(false);
      } finally {
        const endTime = performance.now();
        const fetchTime = endTime - startTime;
        segment.track('Fetch Exam Details Data Time', {
          fetchTime: fetchTime,
          email: auth.currentUser?.email,
          url: window.location.href
        });
      }
    };

    if (!paymentsLoaded) {
      loadPayments();
    }

    // Always fetch exam details when component mounts, regardless of previous state
    // This ensures data is available when navigating to ExamsPage
    loadExamDetails();
  }, [uid, dispatch, paymentsLoaded]);

  if (loading) return <BigSpinner />;
  if (error) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 8,
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Error loading exam data
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
          {error}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
          UID: {uid} | Email: {auth.currentUser?.email}
        </Typography>
      </Box>
    );
  }

  // Debug information
  console.log('EnhancedExamCardsGroup render state:', {
    uid,
    examDetailsState: examDetailsState?.length || 0,
    examDetailsLoaded,
    paymentsLoaded,
    loading,
    error
  });

  const stats = calculateStats();
  const transformedExams = examDetailsState.map(transformExamData);
  const filteredExams = filterExams(transformedExams);
  
  const getSectionTitle = () => {
    switch (filterType) {
      case 'available':
        return 'Available Exams';
      case 'completed':
        return 'Completed Exams & Results';
      case 'results':
        return 'Exam Results';
      default:
        return 'Your Exams';
    }
  };

  const getSectionDescription = () => {
    switch (filterType) {
      case 'available':
        return 'Exams that are currently available for you to take';
      case 'completed':
        return 'View your completed exams and their results';
      case 'results':
        return 'View your exam results and performance analytics';
      default:
        return 'Manage all your exams in one place';
    }
  };

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Dashboard Overview - Only show when not filtering or when explicitly requested */}
      {showDashboardOverview && filterType === 'all' && (
        <DashboardOverview
          stats={{
            totalExams: stats.totalExams,
            completedExams: stats.completedExams,
            averageScore: stats.averageScore,
            availableExams: stats.upcomingExams
          }}
          latestExamResults={latestExamResults}
        />
      )}

      {/* Exam Cards Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'white', 
            fontWeight: 600, 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          {getSectionTitle()}
          <Box 
            component="span" 
            sx={{ 
              background: 'rgba(139, 92, 246, 0.2)', 
              color: '#8b5cf6',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            {filteredExams.length} {filteredExams.length === 1 ? 'Exam' : 'Exams'}
          </Box>
        </Typography>

        {description && (
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            {description}
          </Typography>
        )}

        {filteredExams.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 8,
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              {filterType === 'available' ? 'No exams available yet' :
               filterType === 'completed' ? 'No completed exams yet' :
               filterType === 'results' ? 'No exam results available' :
               'No exams available yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {filterType === 'available' ? 'Check back later for available assessments or contact your administrator.' :
               filterType === 'completed' ? 'Complete some exams to see them here with their results.' :
               filterType === 'results' ? 'Complete exams to see your results and performance analytics.' :
               'Check back later for available assessments or contact your administrator.'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 3 
          }}>
            {filteredExams.map((exam) => (
              <Box key={exam.id}>
                <EnhancedExamCard
                  exam={exam}
                  onStartExam={handleStartExam}
                  onViewResults={handleViewResults}
                  uid={uid}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EnhancedExamCardsGroup;
