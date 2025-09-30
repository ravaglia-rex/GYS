import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Avatar, IconButton, Badge } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  School, 
  CheckCircle, 
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { auth } from '../../firebase/firebase';
import { getStudent } from '../../db/studentCollection';
import { getPhase2ExamResponse } from '../../db/phase2ExamResponsesCollection';

const ColumnChart: React.FC<{ data: { subject: string; score: number }[]; isPhase2?: boolean }> = ({ data, isPhase2 }) => {
  // Load student grade to pick Phase 1 caps
  const [grade, setGrade] = React.useState<number>(12);
  React.useEffect(() => {
    (async () => {
      try {
        const user = await getStudent(auth.currentUser?.uid || '');
        if (user?.grade) setGrade(user.grade);
      } catch {}
    })();
  }, []);

  const phase1Max = React.useMemo(() => {
    if (grade >= 6 && grade <= 8) return { math: 8, reading: 8, writing: 10 };
    if (grade >= 9 && grade <= 10) return { math: 9, reading: 8, writing: 10 };
    return { math: 10, reading: 10, writing: 12 }; // 11–12
  }, [grade]);

  const phase2Max = { reading: 32, writing: 16, logic: 10, math: 22 };

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          No exam results available yet
        </Typography>
      </Box>
    );
  }

  // Calculate percentages with correct caps
  const dataWithPercentages = data.map(item => {
    const key = item.subject.toLowerCase() as 'math' | 'reading' | 'writing' | 'logic';
    const maxPoints = (isPhase2 ? (phase2Max as any)[key] : (phase1Max as any)[key]) ?? 100;
    const percentage = Math.round((item.score / maxPoints) * 100);
    return { ...item, percentage, maxPoints };
  });

  const maxPercentage = Math.max(...dataWithPercentages.map(item => item.percentage));
  const chartMax = Math.min(110, Math.max(100, maxPercentage + 10));

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
        Latest Exam Results (%)
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
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: 32,
        mr: 2
      }}>
               {(() => {
  // Build ticks without showing 110; always include 100, 75, 50, 25, 0
  const baseTicks = [100, 75, 50, 25, 0];
  // Only include the top value if it's <= 100 (never show 110)
  const topTick = chartMax <= 100 ? [chartMax] : [];
  const ticks = Array.from(new Set([...topTick, ...baseTicks].filter(v => v <= chartMax))).sort((a, b) => b - a);

  return ticks.map((value) => {
    const pct = Math.max(0, Math.min(100, (value / chartMax) * 100));
    return (
      <Typography
        key={`tick-${value}`}
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: `${pct}%`,
          transform: 'translateY(50%)',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.7rem'
        }}
      >
        {value}%
      </Typography>
    );
  });
})()}
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
          {dataWithPercentages.map((item, index) => {
            // Use the calculated percentage for bar height
            const barHeight = (item.percentage / chartMax) * 200;
            // Different colors for each subject
            const colorMap: { [key: string]: string } = {
              'Reading': '#FFB3BA',    // Light pink
              'Writing': '#BAFFC9',    // Light green
              'Logic': '#BAE1FF',     // Light blue
              'Math': '#FFFFBA'       // Light yellow
            };
            const color = colorMap[item.subject] || '#99D5C9'; // Fallback color
            
            return (
              <Box key={index} sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1,
                flex: 1,
                minWidth: '60px',
                maxWidth: '100px',
                position: 'relative',
                height: '200px'
              }}>
                <Box
                  sx={{
                    width: '100%',
                    backgroundColor: color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    position: 'absolute',
                    bottom: '0px',
                    left: 0,
                    right: 0,
                    boxShadow: `0 4px 12px ${color}40`
                  }}
                  style={{
                    height: `${barHeight}px`
                  }}
                />
                
                {/* Percentage label at the top of the bar */}
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    position: 'absolute',
                    bottom: `${barHeight + 12}px`,  // constant 12px gap above bar
                    transform: 'translateX(-50%)',
                    left: '50%',
                    zIndex: 10
                  }}
                >
                  {item.percentage}%
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
                  wordBreak: 'break-word',
                  position: 'absolute',
                  bottom: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100%'
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
  onClick?: () => void;
}> = ({ title, value, icon, color, trend, onClick }) => (
  <Card 
    onClick={onClick}
    sx={{
      background: 'rgba(30, 41, 59, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        borderColor: `${color}40`,
      }
    }}
  >
    <CardContent sx={{ p: 3, textAlign: 'left' }}>
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
            ml: 1,
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

// Function to generate dynamic notifications based on the rules
const generateDynamicNotifications = (
  availableExamsCount: number,
  resultsAvailableCount: number
) => {
  const notifications = [];
  const now = new Date();

  // Rule 1: If number of exams available is not 0, show "New Exam Available"
  if (availableExamsCount > 0) {
    notifications.push({
      id: 'new-exam-available',
      type: 'info',
      title: 'New Exam Available',
      message: `You have ${availableExamsCount} new exam${availableExamsCount > 1 ? 's' : ''} available to take. Check the exams section to get started.`,
      timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      color: '#8b5cf6'
    });
  }

  // Rule 2: If number of results available is 2, show 2 different notifications
  if (resultsAvailableCount === 2) {
    // First notification: Challenge exam evaluated and result available
    notifications.push({
      id: 'challenge-exam-result',
      type: 'success',
      title: 'Challenge Exam Evaluated',
      message: 'Your challenge exam has been evaluated and results are now available. Check your performance analysis.',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      color: '#10b981'
    });

    // Second notification: Check your exam analysis now
    notifications.push({
      id: 'exam-analysis-ready',
      type: 'info',
      title: 'Analysis Complete',
      message: 'Your detailed exam analysis is ready for review. Discover your strengths and areas for improvement.',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      color: '#3b82f6'
    });
  }

  // Rule 3: If number of results available is 1, show qualifying exam result notification
  if (resultsAvailableCount === 1) {
    notifications.push({
      id: 'qualifying-exam-result',
      type: 'success',
      title: 'Qualifying Exam Result Available',
      message: 'Your qualifying exam has been evaluated and results are now available. View your performance and next steps.',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      color: '#10b981'
    });
  }

  return notifications;
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, latestExamResults = [] }) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [userName, setUserName] = useState<string>('Student');
  const [loading, setLoading] = useState<boolean>(true);
  const [phase2Results, setPhase2Results] = useState<{ subject: string; score: number }[]>([]);
  const [hasPhase2Results, setHasPhase2Results] = useState<boolean>(false);
  const [isLoadingPhase2, setIsLoadingPhase2] = useState<boolean>(true);

  // Generate notifications based on stats
  const notifications = generateDynamicNotifications(stats.availableExams, stats.completedExams);

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

  // Check for phase 2 exam responses
  useEffect(() => {
    const checkPhase2Results = async () => {
      if (!auth.currentUser?.uid) {
        setIsLoadingPhase2(false);
        return;
      }

      try {
        const phase2Response = await getPhase2ExamResponse(auth.currentUser.uid);
        
        if (phase2Response && phase2Response.typeTotals) {
          // Extract type totals excluding big5
          const { big5, ...otherTotals } = phase2Response.typeTotals;
          
          // Convert to chart data format
          const chartData = Object.entries(otherTotals)
            .filter(([key, value]) => typeof value === 'number')
            .map(([subject, score]) => ({
              subject: subject.charAt(0).toUpperCase() + subject.slice(1),
              score: score as number
            }));
          
          if (chartData.length > 0) {
            setPhase2Results(chartData);
            setHasPhase2Results(true);
          } else {
            setHasPhase2Results(false);
          }
        } else {
          setHasPhase2Results(false);
        }
      } catch (error) {
        console.error('Error fetching phase 2 results:', error);
        setHasPhase2Results(false);
      } finally {
        setIsLoadingPhase2(false);
      }
    };

    checkPhase2Results();
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

  // Determine which results to show
  const getDisplayResults = () => {
    if (isLoadingPhase2) {
      return { data: [], isLoading: true };
    }
    
    if (hasPhase2Results && phase2Results.length > 0) {
      return { data: phase2Results, isLoading: false, isPhase2: true };
    }
    
    if (latestExamResults.length > 0) {
      return { data: latestExamResults, isLoading: false, isPhase2: false };
    }
    
    return { data: [], isLoading: false };
  };

  const displayResults = getDisplayResults();

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
        />
        
        <StatCard
          title="Results Available"
          value={stats.completedExams}
          icon={<CheckCircle size={24} />}
          color="#10b981"
          onClick={() => handleNavigation('/exams/completed')}
        />
         <StatCard
          title="Exams Available"
          value={stats.availableExams}
          icon={<Clock size={24} />}
          color="#8b5cf6"
          onClick={() => handleNavigation('/exams/available')}
        />
        
        <StatCard
          title="Ranking (Coming Soon!)"
          value="--"
          icon={<Target size={24} />}
          color="#f59e0b"
        />
      </Box>

      {/* Performance Overview and Notifications - Side by side */}
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
                  {displayResults.data.length > 0 
                    ? (displayResults.isPhase2 
                        ? 'Your Phase 2 exam performance across different subjects'
                        : 'Your latest exam performance across different subjects')
                    : 'Performance data will appear here once your exams are evaluated'
                  }
                </Typography>
              </Box>
            </Box>

            {/* Content based on whether there are exam results */}
            {displayResults.isLoading ? (
              // Show loading state
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
                  border: '2px solid rgba(139, 92, 246, 0.3)',
                  animation: 'pulse 2s infinite'
                }}>
                  <BarChart3 size={40} color="#8b5cf6" />
                </Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Loading Results...
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 400 }}>
                  Checking for your latest exam results and performance data.
                </Typography>
              </Box>
            ) : displayResults.data.length > 0 ? (
              // Show chart when there are results
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ColumnChart data={displayResults.data} isPhase2={!!displayResults.isPhase2} />
              </Box>
            ) : (
              // Show message when no results available
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

        {/* Latest Notifications */}
        <Card sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
                Latest Notifications
              </Typography>
              <Badge 
                badgeContent={notifications.length} 
                color="error"
                invisible={notifications.length === 0}
              >
                <NotificationsIcon sx={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.8)' }} />
              </Badge>
            </Box>
          
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {notifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    No notifications at the moment. Check back later for updates.
                  </Typography>
                </Box>
              ) : (
                notifications.map((notification) => (
                  <Box
                    key={notification.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: `${notification.color}10`,
                      border: `1px solid ${notification.color}30`,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: notification.color, fontWeight: 600, mb: 0.5 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {notification.message}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardOverview;
