import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Avatar,
  Grid,
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  BarChart3, 
  Target, 
  TrendingUp,
  BookOpen,
  PenTool,
  Calculator,
  Brain,
  Award
} from 'lucide-react';

interface ScoreBreakdown {
  reading: number;
  writing: number;
  math: number;
  science?: number;
  socialStudies?: number;
  total: number;
  maxScore: number;
  examName: string;
  date: string;
}

interface ScoreBreakdownChartProps {
  scores: ScoreBreakdown[];
  showLatestOnly?: boolean;
}

const ScoreBreakdownChart: React.FC<ScoreBreakdownChartProps> = ({ 
  scores, 
  showLatestOnly = false 
}) => {
  // Use the latest score if showLatestOnly is true, otherwise show all
  const displayScores = showLatestOnly ? [scores[0]] : scores;
  
  if (!scores || scores.length === 0) {
    return (
      <Card sx={{
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
            }}>
              <BarChart3 size={24} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
                Score Breakdown
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No exam scores available yet
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Complete your first exam to see detailed score breakdowns
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreGrade = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getPerformanceLevel = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const renderScoreBar = (label: string, score: number, maxScore: number, icon: React.ReactElement) => {
    const percentage = (score / maxScore) * 100;
    const color = getScoreColor(score, maxScore);
    
    return (
      <Box key={label} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ color: color }}>
              {icon}
            </Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500, fontSize: '1rem' }}>
              {label}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
              {score}/{maxScore}
            </Typography>
            <Chip
              label={`${Math.round(percentage)}%`}
              size="small"
              sx={{
                backgroundColor: `${color}20`,
                color: color,
                border: `1px solid ${color}40`,
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            />
          </Box>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${color}, ${color}80)`,
            }
          }}
        />
      </Box>
    );
  };

  const renderOverallScore = (score: ScoreBreakdown) => {
    const totalPercentage = (score.total / score.maxScore) * 100;
    const grade = getScoreGrade(score.total, score.maxScore);
    const performance = getPerformanceLevel(score.total, score.maxScore);
    const color = getScoreColor(score.total, score.maxScore);

    return (
      <Box sx={{ 
        p: 3, 
        borderRadius: 3, 
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        border: `1px solid ${color}30`,
        textAlign: 'center',
        mb: 3
      }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1, fontSize: '2rem' }}>
          {score.total}/{score.maxScore}
        </Typography>
        <Typography variant="h6" sx={{ color: color, fontWeight: 600, mb: 1, fontSize: '1.5rem' }}>
          {grade} - {performance}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem' }}>
          Overall Score: {Math.round(totalPercentage)}%
        </Typography>
        
        <LinearProgress
          variant="determinate"
          value={totalPercentage}
          sx={{
            height: 10,
            borderRadius: 5,
            mt: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              background: `linear-gradient(90deg, ${color}, ${color}80)`,
            }
          }}
        />
      </Box>
    );
  };

  return (
    <Card sx={{
      background: 'rgba(30, 41, 59, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white',
          }}>
            <BarChart3 size={24} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
              Score Breakdown
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem' }}>
              Detailed performance analysis by subject
            </Typography>
          </Box>
        </Box>

        {displayScores.map((score, index) => (
          <Box key={index} sx={{ mb: index < displayScores.length - 1 ? 4 : 0 }}>
            {/* Exam Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
                  {score.examName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                  {score.date}
                </Typography>
              </Box>
              <Chip
                label={getScoreGrade(score.total, score.maxScore)}
                size="medium"
                sx={{
                  backgroundColor: `${getScoreColor(score.total, score.maxScore)}20`,
                  color: getScoreColor(score.total, score.maxScore),
                  border: `1px solid ${getScoreColor(score.total, score.maxScore)}40`,
                  fontWeight: 700,
                  fontSize: '1rem'
                }}
              />
            </Box>

            {/* Overall Score */}
            {renderOverallScore(score)}

            {/* Subject Breakdown */}
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flex: { xs: 1, md: 2 } }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 3, fontSize: '1.1rem' }}>
                  Subject Performance
                </Typography>
                
                {renderScoreBar('Reading', score.reading, score.maxScore, <BookOpen size={18} />)}
                {renderScoreBar('Writing', score.writing, score.maxScore, <PenTool size={18} />)}
                {renderScoreBar('Math', score.math, score.maxScore, <Calculator size={18} />)}
                
                {score.science && renderScoreBar('Science', score.science, score.maxScore, <Brain size={18} />)}
                {score.socialStudies && renderScoreBar('Social Studies', score.socialStudies, score.maxScore, <Award size={18} />)}
              </Box>

              <Box sx={{ flex: { xs: 1, md: 1 } }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 3, fontSize: '1.1rem' }}>
                  Performance Insights
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1, fontSize: '0.9rem' }}>
                      Strongest Subject
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
                      {score.reading > score.writing && score.reading > score.math ? 'Reading' : 
                       score.writing > score.math ? 'Writing' : 'Math'}
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1, fontSize: '0.9rem' }}>
                      Areas for Improvement
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
                      {score.reading < score.writing && score.reading < score.math ? 'Reading' : 
                       score.writing < score.math ? 'Writing' : 'Math'}
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1, fontSize: '0.9rem' }}>
                      Progress Trend
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp size={16} style={{ color: '#10b981' }} />
                      <Typography variant="body1" sx={{ color: '#10b981', fontWeight: 600, fontSize: '1rem' }}>
                        Improving
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

export default ScoreBreakdownChart;

