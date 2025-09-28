import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  School, 
  CheckCircle, 
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { auth } from '../../firebase/firebase';
import { getStudent } from '../../db/studentCollection';

// Simple Column Chart Component
const ColumnChart: React.FC<{ data: { subject: string; score: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          No exam results available yet
        </Typography>
      </Box>
    );
  }

  // Find the maximum score to normalize the columns
  const maxScore = Math.max(...data.map(item => item.score));
  const chartMax = maxScore + 3; // Add 3 to give breathing room at the top
  

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
        Latest Exam Results
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'end', 
        gap: 3, 
        justifyContent: 'center',
        height: '200px',
        position: 'relative',
        minWidth: '400px',
        width: '100%'
      }}>
        {/* Y-axis labels */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          height: '100%',
          mr: 2,
          position: 'absolute',
          left: 0,
          top: 0
        }}>
          {(() => {
            // Create even intervals from 0 to chartMax
            const yAxisValues = [chartMax, Math.round(chartMax * 0.75), Math.round(chartMax * 0.5), Math.round(chartMax * 0.25), 0];
            return yAxisValues.map((value) => (
              <Typography 
                key={value} 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.7rem'
                }}
              >
                {value}
              </Typography>
            ));
          }
          )()}
        </Box>
        
        {/* Columns */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'end', 
          gap: 3, 
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          pl: 4
        }}>
          {data.map((item, index) => {
            // Use relative scoring - compare each score to chartMax (maxScore + 3)
            const percentage = chartMax > 0 ? (item.score / chartMax) * 100 : 0;
            // Color coding based on relative performance
            const color = percentage >= 90 ? '#10b981' : percentage >= 70 ? '#f59e0b' : '#ef4444';
            
            
            return (
              <Box key={index} sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 1,
                flex: 1,
                minWidth: '60px',
                maxWidth: '100px',
                position: 'relative', // Add this for absolute positioning
                height: '200px' // Match the chart height
              }}>
                {/* Column */}
                <Box
                  sx={{
                    width: '100%',
                    backgroundColor: color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    position: 'absolute',
                    bottom: '0px', // Start from the very bottom (0 baseline)
                    left: 0,
                    right: 0,
                    boxShadow: `0 4px 12px ${color}40`
                  }}
                  style={{
                    height: `${(percentage / 100) * 160}px` // Convert percentage to pixels
                  }}
                />
                
                {/* Score label at the top of the bar */}
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    position: 'absolute',
                    bottom: `${(percentage / 100) * 160 + 20}px`, // Position above the bar with some spacing
                    transform: 'translateX(-50%)', // Center horizontally
                    left: '50%',
                    zIndex: 10
                  }}
                >
                  {item.score}
                </Typography>
                
                {/* Subject label */}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    maxWidth: '100%',
                    wordBreak: 'break-word'
                  }}
                >
                  {item.subject}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

interface DashboardOverviewProps {
  stats: {
    totalExams: number;
    completedExams: number;
    averageScore: number;
    availableExams: number;
  };
  latestExamResults?: {
    subject: string;
    score: number;
  }[];
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  trend?: string;
}> = ({ title, value, icon, color, trend }) => (
  <Card sx={{
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      borderColor: `${color}40`,
    }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            background: `linear-gradient(135deg, ${color}20, ${color}40)`,
            color: color,
            border: `2px solid ${color}30`,
          }}
        >
          {icon}
        </Avatar>
        {trend && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            backgroundColor: `${color}20`,
            color: color,
            ml: 1, // Add left margin to create space from the icon
          }}>
            <TrendingUp size={16} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {trend}
            </Typography>
          </Box>
        )}
      </Box>

      <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
        {value}
      </Typography>
      
      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
        {title}
      </Typography>
    </CardContent>
  </Card>
);

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, latestExamResults = [] }) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [userName, setUserName] = useState<string>('Student');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserName = async () => {
      if (auth.currentUser?.uid) {
        try {
          const userData = await getStudent(auth.currentUser.uid);
          if (userData?.first_name) {
            setUserName(userData.first_name.charAt(0).toUpperCase() + userData.first_name.slice(1).toLowerCase());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to Firebase displayName or 'Student'
          const fallbackName = auth.currentUser?.displayName?.split(' ')[0];
          setUserName(fallbackName ? fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1).toLowerCase() : 'Student');
        }
      }
      setLoading(false);
    };

    fetchUserName();
  }, []);

  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      try {
        navigate(path);
      } catch (error) {
        // Fallback to window.location if React Router fails
        window.location.href = path;
      }
    }, 150);
  };

  return (
    <Box sx={{ mb: 4, ml: 1 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          color: 'white', 
          fontWeight: 700, 
          mb: 1,
          fontSize: '2.2rem',
          background: 'linear-gradient(45deg, #10b981, #3b82f6)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          👋 Welcome to Your Dashboard, {loading ? 'Student' : userName}!
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 400, fontSize: '1.2rem' }}>
          Track your progress, manage exams, and achieve your goals
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3, 
        mb: 4 
      }}>
        <StatCard
          title="Total Exams"
          value={stats.totalExams}
          icon={<School size={24} />}
          color="#3b82f6"
          trend="+2 this week"
        />
        
        <StatCard
          title="Exams Completed"
          value={stats.completedExams}
          icon={<CheckCircle size={24} />}
          color="#10b981"
        />
         <StatCard
          title="Available Exams"
          value={stats.availableExams}
          icon={<Clock size={24} />}
          color="#8b5cf6"
        />
        
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={<Target size={24} />}
          color="#f59e0b"
          trend={stats.averageScore >= 80 ? 'Excellent' : stats.averageScore >= 60 ? 'Good' : 'Needs Improvement'}
        />
        
       
      </Box>

      {/* Performance Overview and Quick Actions - Side by side */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
        gap: 3,
        mb: 3
      }}>
        {/* Performance Overview */}
        <Card sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: 'white',
              }}>
                <BarChart3 size={24} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
                  Performance Overview
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem' }}>
                  {latestExamResults.length > 0 
                    ? 'Your latest exam performance across different subjects'
                    : 'Performance data will appear here once your exams are evaluated'
                  }
                </Typography>
              </Box>
            </Box>

            {/* Content based on whether there are exam results */}
            {latestExamResults.length > 0 ? (
              // Show spider chart when there are results
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ColumnChart data={latestExamResults} />
              </Box>
            ) : (
              // Show message when no results available (either no exams taken or under evaluation)
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <BarChart3 size={40} color="#8b5cf6" />
                </Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  No Results Available Yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 400 }}>
                  Complete your first exam or wait for your completed exams to be evaluated to see your performance breakdown and track your progress across different subjects.
                </Typography>
                
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: '1.2rem' }}>
              Quick Actions
            </Typography>
          
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box 
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!isNavigating) {
                      handleNavigation('/exams/available');
                    }
                  }
                }}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  cursor: isNavigating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isNavigating ? 0.7 : 1,
                  '&:hover': {
                    backgroundColor: isNavigating ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.2)',
                    transform: isNavigating ? 'none' : 'translateY(-2px)',
                  },
                  '&:focus': {
                    outline: '2px solid rgba(139, 92, 246, 0.5)',
                    outlineOffset: '2px',
                  }
                }} 
                onClick={() => !isNavigating && handleNavigation('/exams/available')}
              >
                <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                  📚 Start New Exam
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(139, 92, 246, 0.7)' }}>
                  {isNavigating ? 'Starting exam...' : 'Begin your next assessment'}
                </Typography>
              </Box>

              <Box 
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!isNavigating) {
                      handleNavigation('/exams/completed');
                    }
                  }
                }}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  cursor: isNavigating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isNavigating ? 0.7 : 1,
                  '&:hover': {
                    backgroundColor: isNavigating ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.2)',
                    transform: isNavigating ? 'none' : 'translateY(-2px)',
                  },
                  '&:focus': {
                    outline: '2px solid rgba(16, 185, 129, 0.5)',
                    outlineOffset: '2px',
                  }
                }} 
                onClick={() => !isNavigating && handleNavigation('/exams/completed')}
              >
                <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                  📊 View Results
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(16, 185, 129, 0.7)' }}>
                  {isNavigating ? 'Loading results...' : 'Check your performance'}
                </Typography>
              </Box>

              <Box 
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!isNavigating) {
                      handleNavigation('/settings');
                    }
                  }
                }}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  cursor: isNavigating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isNavigating ? 0.7 : 1,
                  '&:hover': {
                    backgroundColor: isNavigating ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)',
                    transform: isNavigating ? 'none' : 'translateY(-2px)',
                  },
                  '&:focus': {
                    outline: '2px solid rgba(59, 130, 246, 0.5)',
                    outlineOffset: '2px',
                  }
                }} 
                onClick={() => !isNavigating && handleNavigation('/settings')}
              >
                <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                  ⚙️ Update Profile
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(59, 130, 246, 0.7)' }}>
                  {isNavigating ? 'Opening settings...' : 'Manage your information'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardOverview;
