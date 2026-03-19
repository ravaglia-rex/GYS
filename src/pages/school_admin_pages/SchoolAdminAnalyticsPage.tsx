import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import {
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
  ComposedChart,
  ScatterChart,
  Scatter,
} from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { getSchoolQualificationBySchool } from '../../db/schoolAdminCollection';

interface AnalyticsData {
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  gradeDistribution: Array<{
    grade: number;
    count: number;
    percentage: number;
  }>;
  qualificationStats: {
    qualified: number;
    notQualified: number;
    pending: number;
    total: number;
  };
  monthlyTrends: Array<{
    month: string;
    averageScore: number;
    examsCompleted: number;
    qualifications: number;
  }>;
  subjectPerformance: Array<{
    subject: string;
    averageScore: number;
    totalStudents: number;
    qualifiedStudents: number;
  }>;
}

// Additional chart data interfaces
interface StudentProgressData {
  student: string;
  math: number;
  science: number;
  english: number;
  history: number;
}

interface ExamDifficultyData {
  difficulty: string;
  count: number;
  averageScore: number;
  passRate: number;
}

interface TimeAnalysisData {
  hour: number;
  exams: number;
  averageScore: number;
}

interface PerformanceComparisonData {
  category: string;
  current: number;
  previous: number;
  target: number;
}

const SchoolAdminAnalyticsPage: React.FC = () => {
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('last_30_days');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!schoolAdmin?.schoolId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const schoolId = schoolAdmin.schoolId;

        // Fetch all students
        const studentsQuery = query(
          collection(db, 'students'),
          where('school_id', '==', schoolId)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const students = studentsSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));

        // Fetch all submissions and responses
        const allSubmissions: any[] = [];
        const allResponses: any[] = [];
        const studentScores: number[] = [];

        for (const student of students) {
          const submissionsQuery = query(
            collection(db, 'student_submission_mappings'),
            where('student_uid', '==', student.uid)
          );
          const submissionsSnapshot = await getDocs(submissionsQuery);
          
          submissionsSnapshot.forEach(subDoc => {
            const subData = subDoc.data();
            allSubmissions.push({
              student_uid: student.uid,
              ...subData
            });

            if (subData.submission_id) {
              // Fetch phase 2 responses
              const responsesQuery = query(
                collection(db, 'phase_2_exam_responses'),
                where('submissionId', '==', subData.submission_id)
              );
              getDocs(responsesQuery).then(responsesSnapshot => {
                responsesSnapshot.forEach(respDoc => {
                  const respData = respDoc.data();
                  if (respData.overallTotal) {
                    allResponses.push(respData);
                    studentScores.push(respData.overallTotal);
                  }
                });
              });
            }
          });
        }

        // Wait for all responses to be fetched
        await Promise.all(
          students.map(async (student) => {
            const submissionsQuery = query(
              collection(db, 'student_submission_mappings'),
              where('student_uid', '==', student.uid)
            );
            const submissionsSnapshot = await getDocs(submissionsQuery);
            
            for (const subDoc of submissionsSnapshot.docs) {
              const subData = subDoc.data();
              if (subData.submission_id) {
                const responsesQuery = query(
                  collection(db, 'phase_2_exam_responses'),
                  where('submissionId', '==', subData.submission_id)
                );
                const responsesSnapshot = await getDocs(responsesQuery);
                responsesSnapshot.forEach(respDoc => {
                  const respData = respDoc.data();
                  if (respData.overallTotal) {
                    allResponses.push(respData);
                    studentScores.push(respData.overallTotal);
                  }
                });
              }
            }
          })
        );

        // Calculate score distribution
        const scoreRanges = {
          '90-100': 0,
          '80-89': 0,
          '70-79': 0,
          '60-69': 0,
          '50-59': 0,
          'Below 50': 0
        };

        studentScores.forEach(score => {
          if (score >= 90) scoreRanges['90-100']++;
          else if (score >= 80) scoreRanges['80-89']++;
          else if (score >= 70) scoreRanges['70-79']++;
          else if (score >= 60) scoreRanges['60-69']++;
          else if (score >= 50) scoreRanges['50-59']++;
          else scoreRanges['Below 50']++;
        });

        const totalScores = studentScores.length;
        const scoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
          range,
          count,
          percentage: totalScores > 0 ? Math.round((count / totalScores) * 100) : 0
        }));

        // Calculate grade distribution
        const gradeCounts: Record<number, number> = {};
        students.forEach(student => {
          let grade = 0;
          if ('grade' in student && typeof student['grade'] === 'number') {
            grade = student['grade'] as number;
          } else if ('class' in student && typeof student['class'] === 'number') {
            grade = student['class'] as number;
          }
          if (grade > 0) {
            gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
          }
        });

        const totalStudents = students.length;
        const gradeDistribution = Object.entries(gradeCounts)
          .map(([grade, count]) => ({
            grade: parseInt(grade),
            count,
            percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
          }))
          .sort((a, b) => a.grade - b.grade);

        // Calculate qualification stats
        let qualified = 0;
        let notQualified = 0;
        let pending = 0;

        try {
          const q = await getSchoolQualificationBySchool(String(schoolId ?? '').trim());
          const byStudent = q?.byStudent || {};
          Object.values(byStudent).forEach((status: any) => {
            if (status === 'qualified') qualified++;
            else if (status === 'not_qualified') notQualified++;
            else pending++;
          });
        } catch {
          // Fall back to treating all as pending if the backend call fails
          pending = totalStudents;
        }

        // Calculate monthly trends (last 6 months)
        const monthlyStats: Record<string, { scores: number[]; exams: number; qualifications: number }> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = months[date.getMonth()];
          monthlyStats[monthKey] = { scores: [], exams: 0, qualifications: 0 };
        }

        allSubmissions.forEach(submission => {
          if (submission.submission_time) {
            const date = submission.submission_time.seconds
              ? new Date(submission.submission_time.seconds * 1000)
              : new Date(submission.submission_time);
            const monthKey = months[date.getMonth()];
            if (monthlyStats[monthKey]) {
              monthlyStats[monthKey].exams++;
            }
          }
        });

        allResponses.forEach(response => {
          if (response.createdAt) {
            const date = response.createdAt.seconds
              ? new Date(response.createdAt.seconds * 1000)
              : new Date(response.createdAt);
            const monthKey = months[date.getMonth()];
            if (monthlyStats[monthKey] && response.overallTotal) {
              monthlyStats[monthKey].scores.push(response.overallTotal);
            }
          }
        });

        const monthlyTrends = Object.entries(monthlyStats).map(([month, stats]) => ({
          month,
          averageScore: stats.scores.length > 0
            ? Math.round((stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length) * 10) / 10
            : 0,
          examsCompleted: stats.exams,
          qualifications: stats.qualifications
        }));

        // Subject performance (simplified - using overall)
        const averageScore = studentScores.length > 0
          ? Math.round((studentScores.reduce((a, b) => a + b, 0) / studentScores.length) * 10) / 10
          : 0;

        const subjectPerformance = [
          {
            subject: 'Overall',
            averageScore,
            totalStudents,
            qualifiedStudents: qualified
          }
        ];

        setAnalyticsData({
          scoreDistribution,
          gradeDistribution,
          qualificationStats: {
            qualified,
            notQualified,
            pending,
            total: totalStudents
          },
          monthlyTrends,
          subjectPerformance
        });
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [schoolAdmin, timeRange]);

  // Additional chart data
  const studentProgressData: StudentProgressData[] = [
    { student: 'Sarah J.', math: 85, science: 78, english: 92, history: 88 },
    { student: 'Michael C.', math: 92, science: 85, english: 79, history: 82 },
    { student: 'Emma D.', math: 78, science: 90, english: 88, history: 85 },
    { student: 'Alex T.', math: 88, science: 82, english: 85, history: 79 },
    { student: 'Priya P.', math: 95, science: 88, english: 90, history: 92 }
  ];

  const examDifficultyData: ExamDifficultyData[] = [
    { difficulty: 'Easy', count: 45, averageScore: 88, passRate: 95 },
    { difficulty: 'Medium', count: 67, averageScore: 76, passRate: 82 },
    { difficulty: 'Hard', count: 23, averageScore: 65, passRate: 58 },
    { difficulty: 'Expert', count: 12, averageScore: 52, passRate: 42 }
  ];

  const timeAnalysisData: TimeAnalysisData[] = [
    { hour: 9, exams: 15, averageScore: 78 },
    { hour: 10, exams: 22, averageScore: 82 },
    { hour: 11, exams: 18, averageScore: 79 },
    { hour: 12, exams: 12, averageScore: 75 },
    { hour: 13, exams: 8, averageScore: 73 },
    { hour: 14, exams: 25, averageScore: 85 },
    { hour: 15, exams: 30, averageScore: 88 },
    { hour: 16, exams: 20, averageScore: 81 }
  ];

  const performanceComparisonData: PerformanceComparisonData[] = [
    { category: 'Mathematics', current: 85, previous: 78, target: 90 },
    { category: 'Science', current: 79, previous: 75, target: 85 },
    { category: 'English', current: 82, previous: 79, target: 88 },
    { category: 'History', current: 77, previous: 72, target: 82 }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const getScoreColor = (range: string) => {
    const score = parseInt(range.split('-')[0]);
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    if (score >= 60) return '#ef4444';
    return '#6b7280';
  };

  const getQualificationPercentage = (type: 'qualified' | 'notQualified' | 'pending') => {
    if (!analyticsData) return 0;
    return (analyticsData.qualificationStats[type] / analyticsData.qualificationStats.total) * 100;
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: '100%', mx: 'auto', p: 4 }}>
        <Typography variant="h6" sx={{ color: '#ffffff' }}>
          Loading analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
          Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8' }}>
          Comprehensive insights into your school's performance and student achievements
        </Typography>
      </Box>

      {/* Time Range Filter */}
      <Card sx={{ 
        bgcolor: '#1e293b', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        border: '1px solid #334155',
        mb: 3
      }}>
        <CardContent>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="last_7_days">Last 7 Days</MenuItem>
              <MenuItem value="last_30_days">Last 30 Days</MenuItem>
              <MenuItem value="last_3_months">Last 3 Months</MenuItem>
              <MenuItem value="last_6_months">Last 6 Months</MenuItem>
              <MenuItem value="last_year">Last Year</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {analyticsData && (
        <>
          {/* Qualification Overview */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            <Box sx={{ 
                width: { xs: '100%', sm: '50%', md: '25%' } 
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
                        {analyticsData.qualificationStats.qualified}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Qualified Students
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ color: '#3b82f6', mr: 0.5, fontSize: '1rem' }} />
                    <Typography variant="caption" sx={{ color: '#3b82f6' }}>
                      {getQualificationPercentage('qualified').toFixed(1)}% of total
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ 
                width: { xs: '100%', sm: '50%', md: '25%' } 
            }}>
              <Card sx={{ 
                bgcolor: '#1e293b', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                border: '1px solid #334155',
                height: '100%'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#ef4444', mr: 2 }}>
                      <AssessmentIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff' }}>
                        {analyticsData.qualificationStats.notQualified}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Not Qualified
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingDownIcon sx={{ color: '#ef4444', mr: 0.5, fontSize: '1rem' }} />
                    <Typography variant="caption" sx={{ color: '#ef4444' }}>
                      {getQualificationPercentage('notQualified').toFixed(1)}% of total
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ 
                width: { xs: '100%', sm: '50%', md: '25%' } 
            }}>
              <Card sx={{ 
                bgcolor: '#1e293b', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                border: '1px solid #334155',
                height: '100%'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#f59e0b', mr: 2 }}>
                      <PeopleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff' }}>
                        {analyticsData.qualificationStats.pending}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Pending Review
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#f59e0b' }}>
                      {getQualificationPercentage('pending').toFixed(1)}% of total
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Score Distribution */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
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
                    Score Distribution
                  </Typography>
                  <Box>
                    {analyticsData.scoreDistribution.map((item, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                            {item.range}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            {item.count} students ({item.percentage}%)
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 8, 
                          bgcolor: '#334155', 
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${item.percentage}%`, 
                            height: '100%', 
                            bgcolor: getScoreColor(item.range),
                            borderRadius: 4
                          }} />
                        </Box>
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
                    Grade Distribution
                  </Typography>
                  <Box>
                    {analyticsData.gradeDistribution.map((item, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                            Grade {item.grade}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            {item.count} students ({item.percentage}%)
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 8, 
                          bgcolor: '#3b82f6',
                          borderRadius: 4
                        }}>
                          <Box sx={{ 
                            width: `${item.percentage}%`, 
                            height: '100%', 
                            bgcolor: '#3b82f6',
                            borderRadius: 4
                          }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Subject Performance */}
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155',
            mb: 4
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 3 }}>
                Subject Performance
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {analyticsData.subjectPerformance.map((subject, index) => (
                  <Box sx={{ 
                      width: { xs: '100%', sm: '50%', md: '20%' } 
                  }} key={index}>
                    <Paper sx={{ p: 2, border: '1px solid #334155', bgcolor: '#334155' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
                        {subject.subject}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#3b82f6', mb: 1 }}>
                        {subject.averageScore}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                        Average Score
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {subject.qualifiedStudents}/{subject.totalStudents} qualified
                        </Typography>
                        <Chip 
                          label={`${((subject.qualifiedStudents / subject.totalStudents) * 100).toFixed(0)}%`}
                          size="small"
                          sx={{ 
                            bgcolor: '#3b82f6', 
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card sx={{ 
            bgcolor: '#1e293b', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 3 }}>
                Monthly Trends
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {analyticsData.monthlyTrends.map((trend, index) => (
                  <Box sx={{ 
                      width: { xs: '100%', sm: '50%', md: '20%' } 
                  }} key={index}>
                    <Paper sx={{ p: 2, border: '1px solid #334155', bgcolor: '#334155' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff', mb: 2 }}>
                        {trend.month}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Avg Score:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                            {trend.averageScore}%
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Exams:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                            {trend.examsCompleted}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Qualifications:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                            {trend.qualifications}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Advanced Analytics Charts */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            {/* Student Progress Heatmap */}
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
                      Student Progress by Subject
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={studentProgressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="student" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          color: '#ffffff'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="math" fill="#3b82f6" name="Mathematics" />
                      <Bar dataKey="science" fill="#10b981" name="Science" />
                      <Bar dataKey="english" fill="#f59e0b" name="English" />
                      <Bar dataKey="history" fill="#ef4444" name="History" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Exam Difficulty Analysis */}
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
                      Exam Difficulty Distribution
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={examDifficultyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ difficulty, count }) => `${difficulty}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {examDifficultyData.map((entry, index) => (
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
          </Box>

          {/* More Advanced Charts */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            {/* Time Analysis Chart */}
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
                    <TimelineIcon sx={{ color: '#3b82f6', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      Performance by Time of Day
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={timeAnalysisData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="hour" stroke="#94a3b8" />
                      <YAxis yAxisId="left" stroke="#94a3b8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          color: '#ffffff'
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="exams" fill="#3b82f6" name="Exams Taken" />
                      <Line yAxisId="right" type="monotone" dataKey="averageScore" stroke="#10b981" strokeWidth={3} name="Average Score" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Performance Comparison */}
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
                      Performance Comparison
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="category" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          color: '#ffffff'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="current" fill="#3b82f6" name="Current" />
                      <Bar dataKey="previous" fill="#94a3b8" name="Previous" />
                      <Bar dataKey="target" fill="#10b981" name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Scatter Plot and Area Chart */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            {/* Scatter Plot for Score vs Time */}
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
                      Score vs Time Correlation
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={timeAnalysisData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" dataKey="hour" name="Hour" stroke="#94a3b8" />
                      <YAxis type="number" dataKey="averageScore" name="Score" stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          color: '#ffffff'
                        }}
                      />
                      <Scatter name="Performance" dataKey="averageScore" fill="#3b82f6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            {/* Area Chart for Cumulative Performance */}
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
                    <TrendingUpIcon sx={{ color: '#3b82f6', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      Cumulative Performance Trend
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.monthlyTrends}>
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
                      <Area 
                        type="monotone" 
                        dataKey="averageScore" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6}
                        name="Average Score"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="qualifications" 
                        stackId="2"
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.6}
                        name="Qualifications"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default SchoolAdminAnalyticsPage;
