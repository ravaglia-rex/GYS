import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';
import DashboardOverview from '../../components/dashboard/DashboardOverview';
import { auth } from '../../firebase/firebase';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { setExamDetails } from '../../state_data/examDetailsSlice';
import { setPayments } from '../../state_data/studentPaymentsSlice';
import { getExamIds } from '../../db/studentExamMappings';
import { getExamDetails } from '../../db/examDetailsCollection';
import { getPayments } from '../../db/studentPaymentMappings';
import { setPayments as setPaymentsAction } from '../../state_data/studentPaymentsSlice';
import * as Sentry from '@sentry/react';

const Dashboard: React.FC = () => {
  const uid = auth.currentUser?.uid || '';
  const dispatch = useDispatch();
  const examDetailsState = useSelector((state: RootState) => state.examDetails.examDetails);
  const examDetailsLoaded = useSelector((state: RootState) => state.examDetails.examDetailsLoaded);
  const paymentsLoaded = useSelector((state: RootState) => state.studentPayments.paymentsLoaded);
  const [previousUid, setPreviousUid] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [latestExamResults, setLatestExamResults] = useState<{ subject: string; score: number }[]>([]);

  // Load exam data for dashboard stats
  const loadExamData = async () => {
    if (!uid || loading) return;
    
    try {
      setLoading(true);
      
      // Load exam IDs and details
      const { formLinks, completed, eligibility_at, result } = await getExamIds(uid);
      
      if (formLinks && formLinks.length > 0) {
        const details = await getExamDetails(formLinks);
        
        const validDetails = details
          .filter((detail: any): detail is any => detail !== null && typeof detail === 'object')
          .map((detail: any, index) => ({
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
          }));

        dispatch(setExamDetails({ examDetails: validDetails, examDetailsLoaded: true }));
        
        // Fetch latest exam results for spider chart
        await loadLatestExamResults(validDetails);
      } else {
        dispatch(setExamDetails({ examDetails: [], examDetailsLoaded: true }));
        setLatestExamResults([]);
      }

      // Load payments
      const paymentsData = await getPayments(uid);
      
      // Transform payment data to match the expected interface
      const transformedPayments = (paymentsData || []).map((payment: any) => ({
        paidOn: new Date(payment.paid_on),
        paymentMethod: payment.payment_method,
        paymentStatus: payment.payment_status,
        transactionId: payment.transaction_id,
        uid: payment.uid,
        formId: payment.form_id,
        amount: payment.amount,
      }));
      
      dispatch(setPaymentsAction(transformedPayments));
      
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'Dashboard.loadExamData');
        scope.setExtra('uid', uid);
        scope.captureException(error);
      });
    } finally {
      setLoading(false);
    }
  };

  // Load latest exam results for spider chart
  const loadLatestExamResults = async (examDetails: any[]) => {
    try {
      // Find the most recent completed exam with available results (not under evaluation)
      const completedExamsWithResults = examDetails.filter(exam => 
        exam.completed && exam.result !== null && exam.result !== undefined
      );
      
      if (completedExamsWithResults.length === 0) {
        setLatestExamResults([]);
        return;
      }

      // Get the first completed exam with results (assuming they're already sorted by completion date)
      const latestExam = completedExamsWithResults[0];
      
      // Import the function to fetch result totals
      const { fetchResultTotals } = await import('../../db/examResponsesCollection');
      
      // Fetch the actual result totals for this exam
      const resultTotals = await fetchResultTotals(uid, latestExam.formId);
      
      if (resultTotals && resultTotals.typeTotals) {
        // Convert typeTotals to simple score data for bar chart
        const chartData = Object.entries(resultTotals.typeTotals).map(([subject, score]) => ({
          subject: subject.charAt(0).toUpperCase() + subject.slice(1), // Capitalize first letter
          score: score as number
        }));
        setLatestExamResults(chartData);
      } else {
        setLatestExamResults([]);
      }
    } catch (error) {
      setLatestExamResults([]);
    }
  };

  // Load data when component mounts or uid changes
  useEffect(() => {
    if (uid) {
      // Always load data when component mounts, regardless of previous state
      // This ensures data is available even after navigation
      loadExamData();
    }
  }, [uid]);

  // Clear Redux state only when uid actually changes (user switches accounts)
  useEffect(() => {
    
    // Only clear state if this is a different user (uid actually changed)
    if (uid && uid !== previousUid) {
      dispatch(setExamDetails({ examDetails: [], examDetailsLoaded: false }));
      dispatch(setPayments([]));
      setPreviousUid(uid);
    } else if (uid && uid === previousUid) {
    }
  }, [uid, dispatch, previousUid]);

  // Log Redux state changes for debugging (separate useEffect to avoid infinite loops)
  useEffect(() => {
  }, [examDetailsState, examDetailsLoaded]);

  // Calculate real stats from exam data
  const calculateStats = () => {
    
    if (!examDetailsState || examDetailsState.length === 0) {
      return {
        totalExams: 0,
        completedExams: 0,
        averageScore: 0,
        availableExams: 0
      };
    }

    const totalExams = examDetailsState.length;
    const completedExams = examDetailsState.filter(exam => exam.completed).length;
    
    // Available exams are those that are not completed and are eligible
    const availableExams = examDetailsState.filter(exam => 
      !exam.completed && 
      (!exam.eligibility_at || new Date() >= new Date(exam.eligibility_at))
    ).length;
    
    // Upcoming exams are those that are not completed and not yet eligible
    const upcomingExams = examDetailsState.filter(exam => 
      !exam.completed && 
      exam.eligibility_at && 
      new Date() < new Date(exam.eligibility_at)
    ).length;
    
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
      availableExams, // Changed from upcomingExams to availableExams
      averageScore
    };
    
    return stats;
  };

  const stats = calculateStats();

  return (
    <DashboardLayout 
      availableExamsCount={stats.availableExams}
      resultsAvailableCount={stats.completedExams}
    >
      <Box sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Loading Dashboard Data...
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Fetching your exam information and statistics
            </Typography>
          </Box>
        ) : (
          <DashboardOverview
            stats={stats}
            latestExamResults={latestExamResults}
          />
        )}
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;
