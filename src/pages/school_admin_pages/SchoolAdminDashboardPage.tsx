import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Grade as GradeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  completedExams: number;
  averageScore: number;
  qualificationRate: number;
  recentActivity: Array<{
    id: string;
    type: 'exam_completed' | 'student_registered' | 'qualification_achieved';
    message: string;
    timestamp: string;
  }>;
}

// Chart data interfaces
interface MonthlyData {
  month: string;
  students: number;
  exams: number;
  score: number;
}

interface SubjectData {
  subject: string;
  students: number;
  averageScore: number;
  qualified: number;
}

interface GradeDistribution {
  grade: number;
  students: number;
  percentage: number;
}

interface PerformanceData {
  category: string;
  value: number;
  fullMark: number;
}

const SchoolAdminDashboardPage: React.FC = () => {
  // Mock school admin data for testing
  const mockSchoolAdmin = {
    email: 'srishti2k1@gmail.com',
    schoolId: '018WuXO6zOabXh4ZXmcq',
    role: 'schooladmin'
  };
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    completedExams: 0,
    averageScore: 0,
    qualificationRate: 0,
    recentActivity: []
  });

  // Chart data
  const monthlyData: MonthlyData[] = [
    { month: 'Jan', students: 120, exams: 45, score: 75 },
    { month: 'Feb', students: 135, exams: 52, score: 78 },
    { month: 'Mar', students: 142, exams: 67, score: 82 },
    { month: 'Apr', students: 156, exams: 89, score: 79 },
    { month: 'May', students: 148, exams: 76, score: 81 },
    { month: 'Jun', students: 162, exams: 95, score: 84 }
  ];

  const subjectData: SubjectData[] = [
    { subject: 'Math', students: 156, averageScore: 85, qualified: 98 },
    { subject: 'Science', students: 142, averageScore: 79, qualified: 87 },
    { subject: 'English', students: 134, averageScore: 82, qualified: 92 },
    { subject: 'History', students: 128, averageScore: 77, qualified: 78 }
  ];

  const gradeDistribution: GradeDistribution[] = [
    { grade: 9, students: 35, percentage: 22 },
    { grade: 10, students: 45, percentage: 29 },
    { grade: 11, students: 52, percentage: 33 },
    { grade: 12, students: 24, percentage: 16 }
  ];

  const performanceData: PerformanceData[] = [
    { category: 'Mathematics', value: 85, fullMark: 100 },
    { category: 'Science', value: 79, fullMark: 100 },
    { category: 'English', value: 82, fullMark: 100 },
    { category: 'History', value: 77, fullMark: 100 },
    { category: 'Geography', value: 80, fullMark: 100 }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    // TODO: Fetch actual data from backend
    // For now, using mock data
    setStats({
      totalStudents: 156,
      activeStudents: 142,
      completedExams: 89,
      averageScore: 78.5,
      qualificationRate: 67.2,
      recentActivity: [
        {
          id: '1',
          type: 'exam_completed',
          message: 'Sarah Johnson completed Mathematics Assessment',
          timestamp: '2 hours ago'
        },
        {
          id: '2',
          type: 'student_registered',
          message: 'New student registered: Michael Chen',
          timestamp: '4 hours ago'
        },
        {
          id: '3',
          type: 'qualification_achieved',
          message: 'Emma Davis qualified for Advanced Program',
          timestamp: '1 day ago'
        },
        {
          id: '4',
          type: 'exam_completed',
          message: 'Alex Thompson completed Science Assessment',
          timestamp: '1 day ago'
        }
      ]
    });
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'exam_completed':
        return <AssessmentIcon sx={{ color: '#10b981' }} />;
      case 'student_registered':
        return <PeopleIcon sx={{ color: '#3b82f6' }} />;
      case 'qualification_achieved':
        return <CheckCircleIcon sx={{ color: '#f59e0b' }} />;
      default:
        return <SchoolIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'exam_completed':
        return '#10b981';
      case 'student_registered':
        return '#3b82f6';
      case 'qualification_achieved':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
          School Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8' }}>
          Overview of your school's performance and student activity
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4, justifyContent: 'space-between' }}>
        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '23%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#3b82f6', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff' }}>
                    {stats.totalStudents}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    Total Students
                  </Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(stats.activeStudents / stats.totalStudents) * 100}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: '#334155',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#3b82f6'
                  }
                }}
              />
              <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                {stats.activeStudents} active students
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '23%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#3b82f6', mr: 2 }}>
                  <AssessmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff' }}>
                    {stats.completedExams}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    Exams Completed
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label="This Month" 
                size="small" 
                sx={{ 
                  bgcolor: '#3b82f6', 
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '23%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#3b82f6', mr: 2 }}>
                  <GradeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff' }}>
                    {stats.averageScore}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    Average Score
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ color: '#3b82f6', mr: 0.5, fontSize: '1rem' }} />
                <Typography variant="caption" sx={{ color: '#3b82f6' }}>
                  +5.2% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '23%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#3b82f6', mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff' }}>
                    {stats.qualificationRate}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    Qualification Rate
                  </Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.qualificationRate}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: '#334155',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#3b82f6'
                  }
                }}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts Section */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* Monthly Trends Line Chart */}
        <Box sx={{ 
            width: { xs: '100%', lg: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ShowChartIcon sx={{ color: '#3b82f6', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Monthly Performance Trends
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      color: '#ffffff'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Average Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="exams" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Exams Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Subject Performance Bar Chart */}
        <Box sx={{ 
            width: { xs: '100%', lg: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BarChartIcon sx={{ color: '#3b82f6', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Subject Performance
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="subject" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      color: '#ffffff'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="averageScore" fill="#3b82f6" name="Average Score" />
                  <Bar dataKey="qualified" fill="#10b981" name="Qualified Students" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* More Charts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* Grade Distribution Pie Chart */}
        <Box sx={{ 
            width: { xs: '100%', lg: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PieChartIcon sx={{ color: '#3b82f6', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Grade Distribution
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ grade, percentage }) => `Grade ${grade}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="students"
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      color: '#ffffff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Performance Radar Chart */}
        <Box sx={{ 
            width: { xs: '100%', lg: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ShowChartIcon sx={{ color: '#3b82f6', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Subject Performance Radar
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={performanceData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      color: '#ffffff'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>


      </Box>

      {/* Recent Activity */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 3 }}>
                Recent Activity
              </Typography>
              <Box>
                {stats.recentActivity.map((activity, index) => (
                  <Box key={activity.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: getActivityColor(activity.type), 
                        mr: 2,
                        width: 40,
                        height: 40
                      }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                                             <Box sx={{ flexGrow: 1 }}>
                         <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                           {activity.message}
                         </Typography>
                         <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                           {activity.timestamp}
                         </Typography>
                       </Box>
                    </Box>
                                         {index < stats.recentActivity.length - 1 && (
                       <Divider sx={{ borderColor: '#334155' }} />
                     )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ 
            width: { xs: '100%', sm: '50%', md: '50%' } 
        }}>
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            height: '100%'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 3 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    border: '1px solid #334155',
                    bgcolor: '#334155',
                    '&:hover': {
                      bgcolor: '#475569',
                      borderColor: '#3b82f6'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                    View All Students
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Manage student profiles and data
                  </Typography>
                </Paper>
                <Paper 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    border: '1px solid #334155',
                    bgcolor: '#334155',
                    '&:hover': {
                      bgcolor: '#475569',
                      borderColor: '#3b82f6'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                    Generate Reports
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Export performance analytics
                  </Typography>
                </Paper>
                <Paper 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    border: '1px solid #334155',
                    bgcolor: '#334155',
                    '&:hover': {
                      bgcolor: '#475569',
                      borderColor: '#3b82f6'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                    School Settings
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Configure school preferences
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default SchoolAdminDashboardPage;
