import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Chip, Table, TableBody, TableCell, TableFooter, TableRow, IconButton } from '@mui/material';
import { 
  CheckCircle, 
  XCircle, 
  Play,
  Eye,
  RefreshCw,
  Clock
} from 'lucide-react';
import { fetchResultTotals, fetchPhase1ResultTotals } from '../../db/examResponsesCollection';
import { getCurrentExamResult } from '../../db/studentExamMappings';

// Add CSS for spinning animation
const spinningStyle = {
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  '&.animate-spin': {
    animation: 'spin 1s linear infinite'
  }
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
  onStartExam?: (examId: string) => void;
  onViewResults?: (examId: string) => void;
  uid?: string; // Add user ID for fetching detailed results
}> = ({
  exam,
  onStartExam,
  onViewResults,
  uid
}) => {
  const [resultTotals, setResultTotals] = useState<ResultTotals | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [currentResult, setCurrentResult] = useState<boolean | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch current result from Firebase
  const fetchCurrentResult = async () => {
    if (!exam.completed || !uid) return;
    
    console.log(`[EnhancedExamCard] fetchCurrentResult: Starting fetch for uid=${uid}, examId=${exam.id}`);
    
    setIsLoadingResult(true);
    try {
      const resultData = await getCurrentExamResult(uid, exam.id);
      console.log('[EnhancedExamCard] fetchCurrentResult: Firebase result fetched', resultData);
      
      setCurrentResult(resultData.result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[EnhancedExamCard] fetchCurrentResult: Error fetching current result:', error);
      // Keep the existing result if fetch fails
    } finally {
      setIsLoadingResult(false);
    }
  };

  // Initialize with cached result if available
  useEffect(() => {
    console.log('[EnhancedExamCard] useEffect: exam.completed, exam.result, currentResult', exam.completed, exam.result, currentResult);
    
    if (exam.completed && currentResult === null && exam.result !== null && exam.result !== undefined) {
      console.log('[EnhancedExamCard] Using cached exam.result value as initial result:', exam.result);
      setCurrentResult(exam.result);
      setLastUpdated(new Date());
    }
  }, [exam.completed, exam.result, currentResult]);

  // Effect to fetch current result on mount/refresh
  useEffect(() => {
    console.log('[EnhancedExamCard] useEffect: Fetching current result on mount/refresh. exam.completed:', exam.completed);
    
    if (exam.completed && uid) {
      fetchCurrentResult();
    }
  }, [exam.completed, uid, exam.id]);

  // Fetch detailed results when exam is completed
  useEffect(() => {
    const getResultTotals = async () => {
      if (exam.completed && exam.id && uid) {
        try {
          let results;
          if (exam.id === 'npByEB') {
            // Phase 1 exam
            results = await fetchPhase1ResultTotals(uid);
          } else {
            // Other exams
            results = await fetchResultTotals(uid, exam.id);
          }
          
          if (results) {
            setResultTotals(results);
          }
        } catch (error) {
          console.error('Error fetching results:', error);
        }
      }
    };

    getResultTotals();
  }, [exam.completed, exam.id, uid]);

  // Check if qualified (for phase 1 exam)
  const isQualified = () => {
    if (exam.id === 'npByEB' && resultTotals) {
      // For phase 1, check if overallTotal meets qualification threshold
      // You can adjust this threshold as needed
      return resultTotals.overallTotal >= 70; // Example: 70 points to qualify
    }
    
    // Use currentResult from Firebase if available, otherwise fall back to exam.result
    const result = currentResult !== null ? currentResult : exam.result;
    return result === true;
  };

  // Check if evaluation is in progress
  const isEvaluationInProgress = () => {
    if (!exam.completed) return false;
    
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

        {/* Exam Duration - Displayed above the results box */}
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
                    {Object.entries(resultTotals.typeTotals).map(([type, total]) => (
                      <TableRow key={type}>
                        <TableCell sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                          {type}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {total} points
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
                        {resultTotals.overallTotal} points
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </Box>
            )}
          </Box>
        )}

        {/* Qualification Status - Displayed at bottom center of card */}
        {exam.completed && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 1, 
            mt: 2,
            p: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {isEvaluationInProgress() ? (
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
            )}
          </Box>
        )}
        
        {loadingResults && (
          <Typography variant="body2" sx={{ color: 'rgba(16, 185, 129, 0.7)', fontStyle: 'italic' }}>
            Loading detailed results...
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          {exam.status === 'available' && isEligible() && onStartExam && (
            <Button
              variant="contained"
              size="medium"
              onClick={() => onStartExam(exam.id)}
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
              Start Exam
            </Button>
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
