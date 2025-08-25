import React, { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar } from '@mui/material';
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

// Spider Chart Component
const SpiderChart: React.FC<{ data: { subject: string; score: number; maxScore: number }[] }> = ({ data }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Draw concentric circles
    for (let i = 1; i <= 5; i++) {
      const currentRadius = (radius * i) / 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw axis lines
    const numSubjects = data.length;
    for (let i = 0; i < numSubjects; i++) {
      const angle = (2 * Math.PI * i) / numSubjects - Math.PI / 2;
      const endX = centerX + radius * Math.cos(angle);
      const endY = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw spider chart
    ctx.strokeStyle = '#8b5cf6';
    ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < numSubjects; i++) {
      const angle = (2 * Math.PI * i) / numSubjects - Math.PI / 2;
      const scoreRatio = data[i].score / data[i].maxScore;
      const currentRadius = radius * scoreRatio;
      const x = centerX + currentRadius * Math.cos(angle);
      const y = centerY + currentRadius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#8b5cf6';
    for (let i = 0; i < numSubjects; i++) {
      const angle = (2 * Math.PI * i) / numSubjects - Math.PI / 2;
      const scoreRatio = data[i].score / data[i].maxScore;
      const currentRadius = radius * scoreRatio;
      const x = centerX + currentRadius * Math.cos(angle);
      const y = centerY + currentRadius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw subject labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < numSubjects; i++) {
      const angle = (2 * Math.PI * i) / numSubjects - Math.PI / 2;
      const labelRadius = radius + 20;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      ctx.fillText(data[i].subject, x, y);
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          No exam results available yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
          Latest Exam Performance by Subject
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
          {data.map((item, index) => (
            <Box
              key={index}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                {item.subject}: {item.score}/{item.maxScore}
              </Typography>
            </Box>
          ))}
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
    maxScore: number;
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

  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      try {
        navigate(path);
      } catch (error) {
        console.error('Navigation failed:', error);
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
          👋 Welcome to Your Dashboard, {auth.currentUser?.displayName?.split(' ')[0] || 'Student'}!
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
                    : 'Track your exam performance and progress'
                  }
                </Typography>
              </Box>
            </Box>

            {/* Content based on whether there are exam results */}
            {latestExamResults.length > 0 ? (
              // Show spider chart when there are results
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <SpiderChart data={latestExamResults} />
              </Box>
            ) : (
              // Show message when no exams taken
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
                  No Exams Taken Yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 400 }}>
                  Complete your first exam to see your performance breakdown and track your progress across different subjects.
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
