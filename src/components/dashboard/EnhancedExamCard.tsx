import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, Typography, Box, Button, Chip, Table, TableBody, TableCell, TableFooter, TableRow } from '@mui/material';
import { 
  CheckCircle, 
  XCircle, 
  Play,
  Eye,
  Clock,
  CreditCard
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../state_data/reducer';
import { fetchResultTotals, fetchPhase2ResultTotals } from '../../db/examResponsesCollection';
import { getCurrentExamResult } from '../../db/studentExamMappings';
import { getStudent } from '../../db/studentCollection';

// Phase 1 per-subject max by grade
const getPhase1MaxPoints = (grade: number) => {
  if (grade >= 6 && grade <= 8) return { math: 8, reading: 8, writing: 10 };
  if (grade >= 9 && grade <= 10) return { math: 9, reading: 8, writing: 10 };
  if (grade >= 11) return { math: 10, reading: 10, writing: 12 };
  return { math: 10, reading: 10, writing: 12 };
};

// Phase 1 overall max by grade
const getPhase1OverallMax = (grade: number) => {
  if (grade >= 6 && grade <= 8) return 26;
  if (grade >= 9 && grade <= 10) return 27;
  return 32; // grades 11,12
};

// Phase 2 per-subject max (sums to 80)
const getPhase2MaxPoints = () => ({
  reading: 32,
  writing: 16,
  logic: 10,
  math: 22,
});

// Exam type by formId
const getExamType = (formId: string) => {
  const phase1 = ['wzdOWZ', 'mRjg8v', 'mOEg8k', '3E6g8A', 'npByEB'];
  const phase2 = ['mOGkN8', 'mVy95J'];
  if (phase1.includes(formId)) return 'phase1';
  if (phase2.includes(formId)) return 'phase2';
  return 'unknown';
};

interface Exam {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  totalQuestions?: number;
  eligibilityDate?: string;
  completed?: boolean;
  score?: number;
  status: 'available' | 'completed' | 'upcoming' | 'in-progress';
  type_questions?: { [key: string]: number };
  result?: boolean | null; // Add result field for qualification status
  paymentNeeded?: boolean;
  isProctored?: boolean;
  examDetails?: string[]; // Array of JSON strings containing section details
}

interface ResultTotals {
  overallTotal: number;
  typeTotals: {
    [key: string]: number;
  };
  createdAt?: string;
}

const EnhancedExamCard: React.FC<{
  exam: Exam;
  onStartExam?: (examId: string, examInfo?: { paymentNeeded?: boolean; isProctored?: boolean; duration?: number }) => void;
  onViewResults?: (examId: string) => void;
  uid?: string; // Add user ID for fetching detailed 
}> = ({
  exam,
  onStartExam,
  onViewResults,
  uid
}) => {
  const navigate = useNavigate();
  const payments = useSelector((state: RootState) => state.studentPayments.payments);
  const [resultTotals, setResultTotals] = useState<ResultTotals | null>(null);
  const [currentResult, setCurrentResult] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [studentGrade, setStudentGrade] = useState<number>(12); // Default to grade 12
  const footerRef = useRef<HTMLDivElement>(null);

  // Fetch student grade when component mounts
  useEffect(() => {
    const fetchStudentGrade = async () => {
    if (uid) {
      try {
        const studentData = await getStudent(uid);
        if (studentData?.grade) {
          setStudentGrade(studentData.grade);
        }
      } catch (error) {
        console.error('Error fetching student grade:', error);
        // Keep default grade 12
      }
    }
  };

  fetchStudentGrade();
  }, [uid]);

  // Function to get max points for a subject based on exam type and grade
    const getMaxPointsForSubject = (subject: string) => {
    const examType = getExamType(exam.id);
    
    if (examType === 'phase1') {
      const phase1MaxPoints = getPhase1MaxPoints(studentGrade);
      return phase1MaxPoints[subject.toLowerCase() as keyof typeof phase1MaxPoints] || 10;
    } else if (examType === 'phase2') {
      const m2 = getPhase2MaxPoints();
      return m2[subject.toLowerCase() as keyof ReturnType<typeof getPhase2MaxPoints>] ?? 0;
    }
    
    // Default fallback
    return 10;
  };

  // Check if this is a Phase 2 exam
  const isPhase2Exam = useCallback(() => {
    const isPhase2 = exam.title?.toLowerCase().includes('challenge') || 
                     exam.title?.toLowerCase().includes('phase 2') ||
                     exam.id === 'mVy95J'; // Your actual Phase 2 form ID from the logs
    
    // Debug logging
    
    return isPhase2;
  }, [exam.title, exam.id]);

  // Function to scroll to footer
  const scrollToFooter = () => {
    if (footerRef.current) {
      footerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      });
    }
  };

  // Function to fetch current result from Firebase
  const fetchCurrentResult = useCallback(async () => {
    if (!exam.completed || !uid) return;
    
    try {
      const resultData = await getCurrentExamResult(uid, exam.id);
      
      setCurrentResult(resultData?.result ?? null);
      setLastUpdated(new Date());
    } catch (error) {
      // Keep the existing result if fetch fails
    }
  }, [exam.completed, uid, exam.id]);

  // Initialize with cached result if available
  useEffect(() => {
    
    if (exam.completed && currentResult === null && exam.result !== null && exam.result !== undefined) {
      setCurrentResult(exam.result);
      setLastUpdated(new Date());
    }
  }, [exam.completed, exam.result, currentResult]);

  // Effect to fetch current result on mount/refresh
  useEffect(() => {
    
    if (exam.completed && uid) {
      fetchCurrentResult();
    }
  }, [exam.completed, uid, exam.id, fetchCurrentResult]);

  // Fetch detailed results when exam is completed
  useEffect(() => {
    const getResultTotals = async () => {
      if (exam.completed && exam.id && uid) {
        try {
          let results;
          if (isPhase2Exam()) {
            // Phase 2 exam
            results = await fetchPhase2ResultTotals(uid, exam.id);
          } else {
            // Phase 1 and other exams use exam_responses
            results = await fetchResultTotals(uid, exam.id);
          }
          
          if (results) {
            setResultTotals(results);
          } else {
          }
        } catch (error) {
        }
      }
    };

    getResultTotals();
  }, [exam.completed, exam.id, uid, isPhase2Exam]);

  // Check if qualified (for phase 1 exam)
  const isQualified = () => {
    if (exam.id === 'npByEB' && resultTotals) {
      // For phase 1, check if overallTotal meets qualification threshold
      // You can adjust this threshold as needed
      return resultTotals.overallTotal >= 70; // Example: 70 points to qualify
    }
    
    // For Phase 2 exams, if we have results, consider it qualified
    if (isPhase2Exam() && resultTotals) {
      return true; // Phase 2 exams with results are considered qualified
    }
    
    // For Phase 2 exams without results, show as not qualified (evaluation in progress)
    if (isPhase2Exam() && !resultTotals) {
      return false;
    }
    
    // Use currentResult from Firebase if available, otherwise fall back to exam.result
    const result = currentResult !== null ? currentResult : exam.result;
    return result === true;
  };

  // Check if evaluation is in progress
  const isEvaluationInProgress = () => {
    if (!exam.completed) return false;
    
    // For Phase 2 exams, if we have results (resultTotals), evaluation is complete
    if (isPhase2Exam()) {
      return !resultTotals; // Phase 2 exams without results are in progress
    }
    
    // Use currentResult from Firebase if available, otherwise fall back to exam.result
    const result = currentResult !== null ? currentResult : exam.result;
    return result === null || result === undefined;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'upcoming':
        return 'info';
      default:
        return 'primary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'in-progress':
        return <Play size={16} />;
      case 'upcoming':
        return <Eye size={16} />;
      default:
        return <Play size={16} />; // Changed from Target to Play for default status
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'upcoming':
        return 'Upcoming';
      default:
        return 'Available';
    }
  };

  const isEligible = () => {
    if (!exam.eligibilityDate) return true;
    const eligibilityDate = new Date(exam.eligibilityDate);
    const currentDate = new Date();
    return currentDate >= eligibilityDate;
  };


  // Check if payment has been completed for this exam
  const hasPaidForExam = () => {
    return payments.some((payment) => 
      payment.formId === exam.id && 
      (payment.paymentStatus === 'success' || payment.paymentStatus === 'completed')
    );
  };

  // Handle proceed to payment for Phase 2 exams
  const handleProceedToPayment = () => {
    navigate('/payments', { state: { highlightPaymentsEntry: exam.id } });
  };

  return (
    <Card 
      sx={{ 
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(139, 92, 246, 0.5)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Scroll to start banner - Header */}
        {exam.status === 'available' && !exam.completed && (
          <Box 
            onClick={scrollToFooter} 
            sx={{ 
              cursor: 'pointer', 
              mb: 3,
              p: 2,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 2,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Typography variant="body2" sx={{ 
              color: '#3b82f6', 
              fontWeight: 600,
              textAlign: 'center'
            }}>
              Please scroll down to the bottom to start the assessment
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'white',
                fontWeight: 600,
                mb: 1
              }}
            >
              {exam.title}
            </Typography>
            {exam.description && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 2
                }}
              >
                {exam.description}
              </Typography>
            )}
          </Box>
          <Chip
            icon={getStatusIcon(exam.status)}
            label={getStatusText(exam.status)}
            color={getStatusColor(exam.status) as any}
            size="small"
            sx={{ 
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'inherit' }
            }}
          />
        </Box>

        {/* Exam Details - Show for available exams */}
        {exam.status === 'available' && !exam.completed && (
          <Box sx={{ 
            mb: 3
          }}>
            <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600, mb: 2 }}>
              Assessment Details:
            </Typography>
            
            {/* Duration */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Clock size={16} color="#8b5cf6" />
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
                {exam.duration || 0.5} hour{exam.duration !== 1 ? 's' : ''}
              </Typography>
            </Box>

            {/* Exam Details - Parse JSON strings if available */}
            {exam.examDetails && exam.examDetails.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600, mb: 2 }}>
                  Assessment Sections:
                </Typography>
                {exam.examDetails.map((detailString, index) => {
                  try {
                    const detail = JSON.parse(detailString);
                    return (
                      <Box key={index} sx={{ mb: 2, p: 1.5, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 1, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                        <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 600, mb: 0.5 }}>
                          {detail.section || `Section ${index + 1}`}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', mb: 0.5 }}>
                          Questions: {detail.questions || 'N/A'}
                        </Typography>
                        {detail.description && (
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                            {detail.description}
                          </Typography>
                        )}
                      </Box>
                    );
                  } catch (error) {
                    return null;
                  }
                })}
              </Box>
            )}

            {/* Subject breakdown */}
            {exam.type_questions && Object.keys(exam.type_questions).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600, mb: 2 }}>
                  Subject Breakdown:
                </Typography>
                {Object.entries(exam.type_questions).map(([subject, count]) => (
                  <Box key={subject} sx={{ mb: 2, p: 1.5, background: 'rgba(139, 92, 246, 0.05)', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600, mb: 0.5, textTransform: 'capitalize' }}>
                      {subject}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                      Questions: {count}
                    </Typography>
                    {subject === 'reading' && (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', mt: 0.5 }}>
                        Reading passages followed by questions.
                      </Typography>
                    )}
                    {subject === 'english' && (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', mt: 0.5 }}>
                        Covers concepts in grammar and breadth of english vocabulary
                      </Typography>
                    )}
                    {subject === 'math' && (
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', mt: 0.5 }}>
                        Basic math including word problems, equations, and geometry
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Instructions */}
            <Box sx={{ mt: 2, p: 1.5, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 1, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 600, mb: 1 }}>
                Important Instructions:
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', mb: 1 }}>
                • Ensure that you have a stable internet connection before starting the assessment.
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                • The assessment fees have been covered by your school.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Exam Duration - Displayed above the results box for completed exams */}
        {exam.completed && resultTotals && exam.duration && !isEvaluationInProgress() && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>
              Duration: {exam.duration} hours
            </Typography>
          </Box>
        )}

        {exam.completed && resultTotals && !isEvaluationInProgress() && (
          <Box sx={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 2,
            p: 2,
            mb: 3
          }}>
            {/* Detailed Score Breakdown */}
            {resultTotals.typeTotals && Object.keys(resultTotals.typeTotals).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600, mb: 1 }}>
                  Detailed Breakdown:
                </Typography>
                <Table size="small" sx={{ 
                  '& .MuiTableCell-root': { 
                    border: 'none', 
                    py: 0.5, 
                    px: 1,
                    color: '#10b981',
                    fontSize: '0.875rem'
                  },
                  '& .MuiTableRow-root': { border: 'none' }
                }}>
                  <TableBody>
                    {Object.entries(resultTotals.typeTotals)
                      .filter(([type, total]) => {
                        // For challenge exams (Phase 2), filter out Big5 related data
                        if (isPhase2Exam()) {
                          const big5Keys = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism', 'big5', 'personality'];
                          return !big5Keys.some(big5Key => type.toLowerCase().includes(big5Key));
                        }
                        return true; // Show all data for non-challenge exams
                      })
                      .map(([type, total]) => (
                      <TableRow key={type}>
                        <TableCell sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                          {type}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {(() => {
                            const maxPoints = getMaxPointsForSubject(type);
                            return `${total}/${maxPoints} points`;
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#059669' }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#059669' }}>
                        {(() => {
                          if (isPhase2Exam()) {
                            // Phase 2 overall is out of 80 (exclude Big5 in nonBig5Total)
                            const big5Keys = ['openness','conscientiousness','extraversion','agreeableness','neuroticism','big5','personality'];
                            const nonBig5Total = Object.entries(resultTotals.typeTotals)
                              .filter(([type]) => !big5Keys.some(k => type.toLowerCase().includes(k)))
                              .reduce((sum, [, val]) => sum + (val || 0), 0);
                            return `${nonBig5Total}/80 points`;
                          }
                          // Phase 1 overall depends on grade
                          const overallMax = getPhase1OverallMax(studentGrade);
                          return `${resultTotals.overallTotal}/${overallMax} points`;
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </Box>
            )}
          </Box>
        )}

        {/* Status Display - Different for Phase 2 vs other exams */}
        {exam.completed && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 1, 
            mt: 1,
            p: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {isPhase2Exam() ? (
              // Phase 2 exam status - only show if evaluation is in progress
              isEvaluationInProgress() && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Clock size={20} color="#3b82f6" />
                    <Typography variant="body1" sx={{ 
                      color: '#3b82f6', 
                      fontWeight: 600 
                    }}>
                      Evaluation in Progress
                    </Typography>
                  </Box>
                  
                  {/* Last checked timestamp */}
                  {lastUpdated && (
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                      Last checked: {lastUpdated.toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>
              )
            ) : (
              // Non-Phase 2 exam status (original logic)
              isEvaluationInProgress() ? (
                // Evaluation in Progress state
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Clock size={20} color="#3b82f6" />
                    <Typography variant="body1" sx={{ 
                      color: '#3b82f6', 
                      fontWeight: 600 
                    }}>
                      Evaluation in Progress
                    </Typography>
                  </Box>
                  
                  {/* Last checked timestamp */}
                  {lastUpdated && (
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                      Last checked: {lastUpdated.toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>
              ) : (
                // Result available state
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isQualified() ? (
                      <CheckCircle size={20} color="#10b981" />
                    ) : (
                      <XCircle size={20} color="#ef4444" />
                    )}
                    <Typography variant="body1" sx={{ 
                      color: isQualified() ? '#10b981' : '#ef4444', 
                      fontWeight: 600 
                    }}>
                      {isQualified() ? 'Qualified' : 'Not Qualified'}
                    </Typography>
                  </Box>
                  
                  {/* Last updated timestamp */}
                  {lastUpdated && (
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>
              )
            )}
          </Box>
        )}

        {/* Phase 2 Detailed Analysis Button - Show for completed Phase 2 exams */}
        {exam.completed && isPhase2Exam() && !isEvaluationInProgress() && (
          <Box sx={{ 
            mt: 0,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Button
              variant="contained"
              size="medium"
              onClick={() => navigate('/reports')}
              startIcon={<Eye size={18} />}
              sx={{
                background: 'linear-gradient(45deg, #8b5cf6, #3b82f6)',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(45deg, #7c3aed, #2563eb)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              View Detailed Analysis
            </Button>
          </Box>
        )}
        

        <Box ref={footerRef} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {exam.status === 'available' && isEligible() && (
            <>
              {/* Phase 2 Exam Logic - Temporarily show for all exams with payment needed for testing */}
              {(isPhase2Exam() || exam.paymentNeeded) && exam.paymentNeeded ? (
                <>
                  {/* Proceed to Payment Button - shown when payment is needed */}
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={handleProceedToPayment}
                    disabled={hasPaidForExam()}
                    startIcon={<CreditCard size={18} />}
                    sx={{
                      background: hasPaidForExam() 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : 'linear-gradient(45deg, #8b5cf6, #3b82f6)',
                      color: 'white',
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': {
                        background: hasPaidForExam() 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : 'linear-gradient(45deg, #7c3aed, #2563eb)',
                        transform: hasPaidForExam() ? 'none' : 'translateY(-2px)'
                      },
                      '&:disabled': {
                        background: 'rgba(255, 255, 255, 0.3)',
                        color: 'rgba(255, 255, 255, 0.5)',
                        cursor: 'not-allowed'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {hasPaidForExam() ? 'Payment Complete' : 'Proceed to Payment'}
                  </Button>

                  {/* Start Exam Button - disabled until payment is complete */}
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={() => onStartExam && onStartExam(exam.id, { 
                      paymentNeeded: exam.paymentNeeded, 
                      isProctored: exam.isProctored, 
                      duration: exam.duration ? exam.duration * 60 : undefined 
                    })}
                    disabled={!hasPaidForExam()}
                    startIcon={<Play size={18} />}
                    sx={{
                      background: hasPaidForExam() 
                        ? 'linear-gradient(45deg, #10b981, #3b82f6)' 
                        : 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': {
                        background: hasPaidForExam() 
                          ? 'linear-gradient(45deg, #059669, #2563eb)' 
                          : 'rgba(255, 255, 255, 0.3)',
                        transform: hasPaidForExam() ? 'translateY(-2px)' : 'none'
                      },
                      '&:disabled': {
                        background: 'rgba(255, 255, 255, 0.3)',
                        color: 'rgba(255, 255, 255, 0.5)',
                        cursor: 'not-allowed'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Start Assessment
                  </Button>
                </>
              ) : (
                /* Regular Exam Logic - single Start Exam button */
                onStartExam && (
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={() => onStartExam(exam.id, { 
                      paymentNeeded: exam.paymentNeeded, 
                      isProctored: exam.isProctored, 
                      duration: exam.duration ? exam.duration * 60 : undefined 
                    })}
                    startIcon={<Play size={18} />}
                    sx={{
                      background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                      color: 'white',
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #059669, #2563eb)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Start Assessment
                  </Button>
                )
              )}
            </>
          )}
          
          {exam.status === 'upcoming' && (
            <Button
              variant="outlined"
              size="medium"
              disabled
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600
              }}
            >
              Not Available Yet
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default EnhancedExamCard;
