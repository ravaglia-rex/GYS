import React, { useEffect, useState } from 'react';
import {
  Box,
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
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { LoadingSpinner } from '../../components/ui/spinner';
import { getSchoolQualificationBySchool } from '../../db/schoolAdminCollection';

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
  const navigate = useNavigate();
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const [schoolName, setSchoolName] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    completedExams: 0,
    averageScore: 0,
    qualificationRate: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!schoolAdmin?.schoolId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const schoolId = String(schoolAdmin.schoolId ?? '').trim();
        if (!schoolId) {
          setLoading(false);
          return;
        }

        // What we fetch (in order):
        // 1. schools/{schoolId} — school name for header
        // 2. students — where school_id == schoolId (totalStudents, list for all downstream data)
        // 3. student_submission_mappings — per student_uid (completed exams, recent activity)
        // 4. phase_2_exam_responses — per submissionId (average score, monthly stats)
        // 5. student_exam_mappings — per student uid (qualification count)

        const [schoolDocSnap, studentsSnapshotBySchoolId] = await Promise.all([
          getDoc(doc(db, 'schools', schoolId)),
          getDocs(query(collection(db, 'students'), where('school_id', '==', schoolId)))
        ]);
        setSchoolName(schoolDocSnap.data()?.school_name ?? '');
        // Fallback: some data may use camelCase field "schoolId" instead of "school_id"
        let studentsSnapshot = studentsSnapshotBySchoolId;
        if (studentsSnapshot.empty) {
          const byCamel = await getDocs(query(collection(db, 'students'), where('schoolId', '==', schoolId)));
          if (!byCamel.empty) studentsSnapshot = byCamel;
        }
        const students = studentsSnapshot.docs.map(d => ({
          uid: d.id,
          ...d.data()
        }));
        const totalStudents = students.length;
        const studentUids = students.map(s => s.uid);

        // To keep the dashboard fast for schools with many students,
        // we compute exam-based metrics from a capped sample of students.
        const MAX_STUDENTS_FOR_METRICS = 50;
        const metricStudentUids = studentUids.slice(0, MAX_STUDENTS_FOR_METRICS);

        if (process.env.NODE_ENV === 'development') {
          const which = studentsSnapshotBySchoolId.empty && !studentsSnapshot.empty ? 'schoolId (camelCase)' : 'school_id';
          console.log('[Dashboard] schoolId:', JSON.stringify(schoolId), '| field used:', which, '| students found:', totalStudents);
        }

        if (totalStudents === 0) {
          setStats({
            totalStudents: 0,
            activeStudents: 0,
            completedExams: 0,
            averageScore: 0,
            qualificationRate: 0,
            recentActivity: []
          });
          setMonthlyData([]);
          setSubjectData([]);
          setGradeDistribution([]);
          setPerformanceData([]);
          setLoading(false);
          return;
        }

        // 2. Fetch exam submissions for sampled students in parallel (one query per student)
        const submissionSnapshots = await Promise.all(
          metricStudentUids.map(uid =>
            getDocs(query(
              collection(db, 'student_submission_mappings'),
              where('student_uid', '==', uid)
            ))
          )
        );
        const allSubmissions: any[] = [];
        submissionSnapshots.forEach((snap, i) => {
          snap.forEach(d => {
            allSubmissions.push({ student_uid: metricStudentUids[i], ...d.data() });
          });
        });
        const completedExams = allSubmissions.length;

        // 3. Fetch phase 2 exam responses in parallel (one query per submission that has submission_id)
        const submissionsWithId = allSubmissions.filter(s => s.submission_id);
        const uniqueSubmissionIds = Array.from(new Set(submissionsWithId.map((s: any) => s.submission_id)));
        const phase2Snapshots = await Promise.all(
          uniqueSubmissionIds.map(subId =>
            getDocs(query(
              collection(db, 'phase_2_exam_responses'),
              where('submissionId', '==', subId)
            ))
          )
        );
        const allPhase2Responses: any[] = [];
        phase2Snapshots.forEach(snap => snap.forEach(d => allPhase2Responses.push(d.data())));

        let averageScore = 0;
        if (allPhase2Responses.length > 0) {
          const totalScore = allPhase2Responses.reduce((sum, response) => sum + (response.overallTotal || 0), 0);
          averageScore = totalScore / allPhase2Responses.length;
        }

        // 4. Qualification rate
        // Compute qualification via backend (Admin SDK), so we don't weaken Firestore rules.
        let qualifiedCount = 0;
        let qualificationRate = 0;
        try {
          const q = await getSchoolQualificationBySchool(schoolId);
          qualifiedCount = q.qualifiedCount || 0;
          qualificationRate = q.qualificationRate || 0;
        } catch (e) {
          // If this fails (network/auth), keep dashboard usable with score metrics.
          qualifiedCount = 0;
          qualificationRate = 0;
        }

        // 5. Calculate grade distribution
        // Fix: Avoid accessing properties that may not exist on type, and make this robust
        const gradeCounts: Record<number, number> = {};
        students.forEach(student => {
          // Try to extract grade information safely from student object
          // Accept keys likely to be used for grade/class indicators
          let grade: number = 0;
          if ('grade' in student && typeof student['grade'] === 'number') {
            grade = student['grade'] as number;
          } else if ('class' in student && typeof student['class'] === 'number') {
            grade = student['class'] as number;
          }
          gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        });

        const gradeDist = Object.entries(gradeCounts)
          .map(([grade, count]) => ({
            grade: parseInt(grade),
            students: count,
            percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
          }))
          .sort((a, b) => a.grade - b.grade);

        // 6. Generate monthly data (last 6 months)
        const monthlyStats: Record<string, { exams: number; scores: number[] }> = {};
        allSubmissions.forEach(submission => {
          if (submission.submission_time) {
            const date = new Date(submission.submission_time.seconds * 1000 || submission.submission_time);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            if (!monthlyStats[monthKey]) {
              monthlyStats[monthKey] = { exams: 0, scores: [] };
            }
            monthlyStats[monthKey].exams++;
          }
        });

        // Add scores to monthly stats
        allPhase2Responses.forEach(response => {
          if (response.createdAt) {
            const date = new Date(response.createdAt.seconds * 1000 || response.createdAt);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            if (monthlyStats[monthKey]) {
              monthlyStats[monthKey].scores.push(response.overallTotal || 0);
            }
          }
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const last6Months = months.slice(-6);
        const monthlyDataArray = last6Months.map(month => {
          const stats = monthlyStats[month] || { exams: 0, scores: [] };
          const avgScore = stats.scores.length > 0
            ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length
            : 0;
          return {
            month,
            students: 0, // Could calculate this if needed
            exams: stats.exams,
            score: Math.round(avgScore)
          };
        });

        // 7. Set subject data (placeholder for now - could be enhanced with actual subject breakdown)
        const subjectDataArray: SubjectData[] = [
          { subject: 'Overall', students: totalStudents, averageScore: Math.round(averageScore), qualified: qualifiedCount }
        ];

        // 8. Set performance data (placeholder - could be enhanced)
        const performanceDataArray: PerformanceData[] = [
          { category: 'Overall Performance', value: Math.round(averageScore), fullMark: 100 }
        ];

        // 9. Build recent activity from submissions (exam completed) and student names
        const studentByName: Record<string, { first_name?: string; last_name?: string }> = {};
        students.forEach((s: any) => {
          studentByName[s.uid] = {
            first_name: s.first_name,
            last_name: s.last_name
          };
        });
        const submissionsWithTime = allSubmissions
          .filter((s: any) => s.submission_time)
          .sort((a: any, b: any) => {
            const aMs = a.submission_time?.seconds ? a.submission_time.seconds * 1000 : new Date(a.submission_time).getTime();
            const bMs = b.submission_time?.seconds ? b.submission_time.seconds * 1000 : new Date(b.submission_time).getTime();
            return bMs - aMs;
          })
          .slice(0, 10);
        const recentActivityItems: DashboardStats['recentActivity'] = submissionsWithTime.map((s: any, idx: number) => {
          const ts = s.submission_time?.seconds
            ? new Date(s.submission_time.seconds * 1000)
            : new Date(s.submission_time);
          const name = studentByName[s.student_uid];
          const displayName = name
            ? [name.first_name, name.last_name].filter(Boolean).join(' ') || 'Student'
            : 'Student';
          return {
            id: `exam-${s.student_uid}-${idx}-${ts.getTime()}`,
            type: 'exam_completed' as const,
            message: `${displayName} completed an exam`,
            timestamp: ts.toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
          };
        });

        setStats({
          totalStudents,
          activeStudents: totalStudents,
          completedExams,
          averageScore: Math.round(averageScore * 10) / 10,
          qualificationRate: Math.round(qualificationRate * 10) / 10,
          recentActivity: recentActivityItems
        });

        setMonthlyData(monthlyDataArray);
        setSubjectData(subjectDataArray);
        setGradeDistribution(gradeDist);
        setPerformanceData(performanceDataArray);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [schoolAdmin]);

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

  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 3,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ color: '#93c5fd' }}>
          <LoadingSpinner size={48} className="loading-spinner" />
        </Box>
        <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
          {schoolName ? `${schoolName}` : 'School Dashboard'}
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8' }}>
          Overview of your school&apos;s performance and student activity
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
                value={stats.totalStudents > 0 ? (stats.activeStudents / stats.totalStudents) * 100 : 0}
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
                    Total Exams Completed
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label="All Time" 
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
                  Based on phase 2 exams
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
                    Qualifying Exam Qualification Rate
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
                  Overall Performance
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
              {gradeDistribution.length > 0 ? (
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
              ) : (
                <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                  No grade data available
                </Typography>
              )}
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
                  Overall Performance
                </Typography>
              </Box>
              {performanceData.length > 0 ? (
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
              ) : (
                <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                  No performance data available
                </Typography>
              )}
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
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, index) => (
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
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                    No recent activity
                  </Typography>
                )}
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
                  onClick={() => navigate('/school-admin/students')}
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
                  onClick={() => navigate('/school-admin/analytics')}
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
                    View Analytics
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Performance analytics and reports
                  </Typography>
                </Paper>
                <Paper
                  onClick={() => navigate('/school-admin/settings')}
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
