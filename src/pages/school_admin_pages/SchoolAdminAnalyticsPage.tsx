import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  People as PeopleIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../../state_data/reducer';
import {
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
} from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { getSchoolDashboard, type StudentRow } from '../../db/schoolAdminCollection';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  allExamsWithAnyActivity,
  assessmentDisplayName,
  PROF_TIER_COLORS,
  summarizeExamGradeTier123,
  summarizeSchoolTier123,
  summarizeTier123ByGrade,
} from '../../utils/schoolAdminTierAnalytics';
import { ASSESSMENT_ORDER, NON_COMPETITIVE_CHART_ASSESSMENT_IDS } from '../../utils/assessmentGating';
import { ProficiencyTier123Overview } from '../../components/school_admin/ProficiencyTier123Overview';
import { FAKE_SCORE_DISTRIBUTION_BY_EXAM } from '../../data/schoolAdminScoreSubcategoryMock';
import { buildGreenfieldPreviewStudentRows } from '../../data/schoolPreviewMock';

/** App theme is dark; school admin analytics cards are light - Select needs explicit light-field styles. */
const examTierSelectFormSx = {
  minWidth: 280,
  mb: 2,
  '& .MuiInputLabel-root': {
    color: `${ip.subtext} !important`,
    '&.Mui-focused': { color: `${ip.navy} !important` },
  },
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fff',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: ip.cardBorder },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ip.navy },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ip.navy, borderWidth: 1 },
  },
  '& .MuiSelect-select': { color: `${ip.heading} !important` },
  '& .MuiSvgIcon-root': { color: ip.heading },
} as const;

const examTierSelectMenuPaperSx = {
  bgcolor: '#fff',
  color: ip.heading,
  border: `1px solid ${ip.cardBorder}`,
  '& .MuiMenuItem-root': { color: ip.heading },
} as const;

/** Per assessment, average best score among the school’s top-N students by that score (N capped by how many have progress). */
const TOP_STUDENTS_PER_EXAM_FOR_AVG = 10;

function bestScorePercent(raw: number | null | undefined): number | null {
  if (raw == null || typeof raw !== 'number' || Number.isNaN(raw)) return null;
  return raw <= 1 ? raw * 100 : raw;
}

function scoredExamIdsForAvgChart(): string[] {
  if (!Array.isArray(ASSESSMENT_ORDER)) return [];
  const nonCompetitive = NON_COMPETITIVE_CHART_ASSESSMENT_IDS ?? new Set<string>();
  return ASSESSMENT_ORDER.filter((id) => !nonCompetitive.has(id));
}

/** One bar per scored assessment; `current` is 0 when no student has a best score yet. */
function buildExamAverageChartRows(students: StudentRow[]): Array<{ category: string; current: number }> {
  return scoredExamIdsForAvgChart().map((id) => {
    const scores: number[] = [];
    for (const s of students) {
      const pct = bestScorePercent(s.assessment_progress?.[id]?.best_score ?? undefined);
      if (pct != null) scores.push(pct);
    }
    scores.sort((a, b) => b - a);
    const top = scores.slice(0, TOP_STUDENTS_PER_EXAM_FOR_AVG);
    const current =
      top.length > 0 ? Math.round(top.reduce((acc, v) => acc + v, 0) / top.length) : 0;
    return { category: assessmentDisplayName(id), current };
  });
}

interface AnalyticsData {
  gradeDistribution: Array<{
    grade: number;
    count: number;
    percentage: number;
  }>;
  qualificationStats: {
    total: number;
  };
  /** Mean best_score (0 - 100) among top performers per exam; one row per scored assessment (0 if none). */
  examAverages: Array<{ category: string; current: number }>;
}

const SchoolAdminAnalyticsPage: React.FC = () => {
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tierAnalyticsStudents, setTierAnalyticsStudents] = useState<StudentRow[]>([]);
  const [proficiencyView, setProficiencyView] = useState<'school' | 'grade'>('school');
  const [examBreakdownId, setExamBreakdownId] = useState<string>('');

  const tierSchoolSummary = useMemo(
    () => summarizeSchoolTier123(tierAnalyticsStudents),
    [tierAnalyticsStudents]
  );
  const tierByGradeRows = useMemo(
    () => summarizeTier123ByGrade(tierAnalyticsStudents),
    [tierAnalyticsStudents]
  );
  const examIdsWithActivity = useMemo(
    () => allExamsWithAnyActivity(tierAnalyticsStudents),
    [tierAnalyticsStudents]
  );
  const examGradeTierRows = useMemo(
    () =>
      examBreakdownId
        ? summarizeExamGradeTier123(tierAnalyticsStudents, examBreakdownId)
        : [],
    [tierAnalyticsStudents, examBreakdownId]
  );

  const gradeBarChartData = useMemo(
    () =>
      tierByGradeRows.map(r => ({
        name: r.grade === 0 ? 'Unspecified' : `Gr. ${r.grade}`,
        tier1: r.tier1,
        tier2: r.tier2,
        tier3: r.tier3,
      })),
    [tierByGradeRows]
  );

  useEffect(() => {
    if (examIdsWithActivity.length === 0) {
      setExamBreakdownId('');
      return;
    }
    setExamBreakdownId(prev => (prev && examIdsWithActivity.includes(prev) ? prev : examIdsWithActivity[0]!));
  }, [examIdsWithActivity]);

  useEffect(() => {
    const buildFromDashboardStudents = (dashboardStudents: StudentRow[]) => {
      const gradeCounts: Record<number, number> = {};
      for (const s of dashboardStudents) {
        const grade = typeof s.grade === 'number' && s.grade > 0 ? s.grade : 0;
        if (grade > 0) {
          gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        }
      }
      const totalStudents = dashboardStudents.length;
      const gradeDistribution = Object.entries(gradeCounts)
        .map(([grade, count]) => ({
          grade: parseInt(grade, 10),
          count,
          percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
        }))
        .sort((a, b) => a.grade - b.grade);

      const examAverages = buildExamAverageChartRows(dashboardStudents);

      setAnalyticsData({
        gradeDistribution,
        qualificationStats: { total: totalStudents },
        examAverages,
      });
    };

    if (isSchoolAdminPreview) {
      setLoading(true);
      const dashboardStudents = buildGreenfieldPreviewStudentRows();
      setTierAnalyticsStudents(dashboardStudents);
      buildFromDashboardStudents(dashboardStudents);
      setLoading(false);
      return;
    }

    const fetchAnalyticsData = async () => {
      if (!schoolAdmin?.schoolId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const schoolId = schoolAdmin.schoolId;

        let dashboardStudents: StudentRow[] = [];
        try {
          const dash = await getSchoolDashboard(String(schoolId ?? '').trim());
          dashboardStudents = (dash?.students ?? []) as StudentRow[];
        } catch (e) {
          console.warn('School dashboard fetch failed (tier analytics)', e);
        }
        setTierAnalyticsStudents(dashboardStudents);

        const studentsQuery = query(collection(db, 'students'), where('school_id', '==', schoolId));
        const studentsSnapshot = await getDocs(studentsQuery);
        const students = studentsSnapshot.docs.map(d => ({
          uid: d.id,
          ...d.data(),
        }));

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
            grade: parseInt(grade, 10),
            count,
            percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
          }))
          .sort((a, b) => a.grade - b.grade);

        const examAverages = buildExamAverageChartRows(dashboardStudents as StudentRow[]);

        setAnalyticsData({
          gradeDistribution,
          qualificationStats: {
            total: totalStudents,
          },
          examAverages,
        });
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalyticsData();
  }, [schoolAdmin, isSchoolAdminPreview]);

  const gradePieData = useMemo(
    () =>
      (analyticsData?.gradeDistribution ?? [])
        .filter(d => d.count > 0)
        .map(d => ({
          name: `Grade ${d.grade}`,
          count: d.count,
          percentage: d.percentage,
        })),
    [analyticsData?.gradeDistribution]
  );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const getScoreColor = (range: string) => {
    const score = parseInt(range.split('-')[0], 10);
    if (!Number.isNaN(score) && score >= 90) return '#10b981';
    if (!Number.isNaN(score) && score >= 80) return '#3b82f6';
    if (!Number.isNaN(score) && score >= 70) return '#f59e0b';
    if (!Number.isNaN(score) && score >= 60) return '#ef4444';
    return '#6b7280';
  };

  const SCORE_BAND_ORDER = ['90-100', '80-89', '70-79', '60-69', '50-59', 'Below 50'] as const;

  if (loading) {
    return (
      <Box sx={{ maxWidth: '100%', mx: 'auto', p: 4 }}>
        <Typography variant="h6" sx={{ color: '#1E293B' }}>
          Loading analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1E293B', mb: 1 }}>
          Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8' }}>
          Comprehensive insights into your school's performance and student achievements
        </Typography>
      </Box>

      {analyticsData && (
        <>
          {/* Total students + grade distribution */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 300px) 1fr' },
              gap: 3,
              mb: 4,
              alignItems: 'stretch',
            }}
          >
            <Card
              sx={{
                bgcolor: '#ffffff',
                boxShadow: 'none',
                border: `1px solid ${ip.cardBorder}`,
                height: '100%',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: '#3b82f6', mr: 2 }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#1E293B' }}>
                      {analyticsData.qualificationStats.total}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Students
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                  Total students registered under your school on Argus.
                </Typography>
              </CardContent>
            </Card>

            <Card
              sx={{
                bgcolor: '#ffffff',
                boxShadow: 'none',
                border: `1px solid ${ip.cardBorder}`,
                height: '100%',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PieChartIcon sx={{ color: '#3b82f6', mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    Grade Distribution
                  </Typography>
                </Box>
                {gradePieData.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#94a3b8', py: 2 }}>
                    No grade data yet for registered students.
                  </Typography>
                ) : (
                  <Box sx={{ width: '100%', height: 280, minHeight: 260 }}>
                    {/*
                      ResponsiveContainer defaults initialDimension to -1/-1, so Recharts renders nothing
                      until after useEffect + ResizeObserver - feels like labels “load late”.
                      Positive initialDimension draws pie + labels on first paint; observer then corrects size.
                    */}
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 520, height: 280 }}
                    >
                      <PieChart>
                        <Pie
                          data={gradePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          isAnimationActive={false}
                          label={({ name, count, percentage }) => `${name}: ${count} (${percentage}%)`}
                          outerRadius={88}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="name"
                        >
                          {gradePieData.map((_, index) => (
                            <Cell key={`grade-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: `1px solid ${ip.cardBorder}`,
                            color: '#1E293B',
                          }}
                          formatter={(value: number, _name, item) => [
                            `${value} students (${item.payload?.percentage ?? 0}%)`,
                            item.payload?.name ?? 'Grade',
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Proficiency levels 1–3 (assessment progress) */}
          <Card sx={{ bgcolor: '#ffffff', boxShadow: 'none', border: `1px solid ${ip.cardBorder}`, mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', mb: 0.5 }}>
                Proficiency level analytics
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, lineHeight: 1.55 }}>
                For each student we use the <strong>lowest</strong> level among assessments they’ve started or completed (that’s their bottleneck).
                <strong> Level 1 = Bronze, Level 2 = Silver, Level 3+ = Gold.</strong> Whole-school and grade views include everyone on the roster;
                the exam × grade table only counts students with progress on the assessment you pick.
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={proficiencyView}
                onChange={(_, v) => v && setProficiencyView(v)}
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="school">Whole school</ToggleButton>
                <ToggleButton value="grade">By grade</ToggleButton>
              </ToggleButtonGroup>

              {proficiencyView === 'school' && (
                <ProficiencyTier123Overview
                  summary={tierSchoolSummary}
                  subtitle={`${tierSchoolSummary.total} students. Same methodology as the institution overview.`}
                  barHeight={36}
                />
              )}

              {proficiencyView === 'grade' && (
                <Box sx={{ width: '100%', height: 340, minHeight: 280 }}>
                  {gradeBarChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeBarChartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tier1" name="Level 1" stackId="t" fill={PROF_TIER_COLORS.tier1} />
                        <Bar dataKey="tier2" name="Level 2" stackId="t" fill={PROF_TIER_COLORS.tier2} />
                        <Bar dataKey="tier3" name="Level 3+" stackId="t" fill={PROF_TIER_COLORS.tier3} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#94a3b8', py: 4 }}>
                      No grade or progress data yet.
                    </Typography>
                  )}
                </Box>
              )}

              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1E293B', mt: 3, mb: 1 }}>
                By exam × grade × level
              </Typography>
              <FormControl size="small" sx={examTierSelectFormSx}>
                <InputLabel id="exam-tier-select-label">Assessment</InputLabel>
                <Select
                  labelId="exam-tier-select-label"
                  label="Assessment"
                  value={examBreakdownId}
                  onChange={e => setExamBreakdownId(String(e.target.value))}
                  MenuProps={{ PaperProps: { sx: examTierSelectMenuPaperSx } }}
                >
                  {examIdsWithActivity.length === 0 ? (
                    <MenuItem value="">No assessments with activity</MenuItem>
                  ) : (
                    examIdsWithActivity.map(id => (
                      <MenuItem key={id} value={id}>
                        {assessmentDisplayName(id)}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              {examBreakdownId && examGradeTierRows.length > 0 ? (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    boxShadow: 'none',
                    bgcolor: '#fff',
                    color: ip.heading,
                    border: `1px solid ${ip.cardBorder}`,
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Table size="small" sx={{ bgcolor: '#fff' }}>
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: ip.cardMutedBg,
                          '& .MuiTableCell-root': {
                            color: ip.heading,
                            fontWeight: 700,
                            borderBottom: `1px solid ${ip.cardBorder}`,
                          },
                        }}
                      >
                        <TableCell>Grade</TableCell>
                        <TableCell align="right">Level 1</TableCell>
                        <TableCell align="right">Level 2</TableCell>
                        <TableCell align="right">Level 3+</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {examGradeTierRows.map(row => (
                        <TableRow
                          key={row.grade}
                          hover
                          sx={{
                            bgcolor: '#fff',
                            '&:nth-of-type(even)': { bgcolor: ip.cardMutedBg },
                            '&:hover': { bgcolor: 'rgba(16, 64, 139, 0.06) !important' },
                            '& .MuiTableCell-root': {
                              color: ip.heading,
                              borderBottom: `1px solid ${ip.cardBorder}`,
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>
                            {row.grade === 0 ? 'Unspecified' : `Grade ${row.grade}`}
                          </TableCell>
                          <TableCell align="right">{row.tier1}</TableCell>
                          <TableCell align="right">{row.tier2}</TableCell>
                          <TableCell align="right">{row.tier3}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {row.total}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  {examBreakdownId
                    ? 'No students with active progress on this assessment by grade.'
                    : 'Select an assessment once students begin assessments.'}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card
            sx={{
              bgcolor: '#ffffff',
              boxShadow: 'none',
              border: `1px solid ${ip.cardBorder}`,
              mb: 4,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', mb: 0.5 }}>
                Score Distribution
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                Sub-strand breakdowns use illustrative sample data until sectional scores are available.
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B', mb: 0.5 }}>
                By reasoning sub-strand (sample)
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.5 }}>
                Stacked bars show the share of a synthetic cohort in each score band; mean is shown for context only.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center', mb: 2 }}>
                {SCORE_BAND_ORDER.map((r) => (
                  <Box key={r} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: getScoreColor(r), flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                      {r}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {FAKE_SCORE_DISTRIBUTION_BY_EXAM.map((examBlock) => (
                <Box key={examBlock.examId} sx={{ mb: 3, '&:last-of-type': { mb: 0 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 1.5 }}>
                    {assessmentDisplayName(examBlock.examId)}
                  </Typography>
                  {examBlock.subcategories.map((sub) => (
                    <Box key={sub.name} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75, gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                          {sub.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', flexShrink: 0 }}>
                          Mean {sub.meanScore}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          width: '100%',
                          height: 10,
                          borderRadius: 5,
                          overflow: 'hidden',
                          bgcolor: '#f1f5f9',
                        }}
                      >
                        {sub.bands.map((b) =>
                          b.percentage > 0 ? (
                            <Box
                              key={b.range}
                              title={`${b.range}: ${b.percentage}%`}
                              sx={{
                                width: `${b.percentage}%`,
                                minWidth: b.percentage > 0 ? 2 : 0,
                                bgcolor: getScoreColor(b.range),
                                transition: 'width 0.35s ease-out',
                              }}
                            />
                          ) : null
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#ffffff', boxShadow: 'none', border: `1px solid ${ip.cardBorder}`, mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShowChartIcon sx={{ color: '#3b82f6', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B' }}>
                  Average best score by assessment
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, lineHeight: 1.6 }}>
                For each exam, we pool students across all grades, rank them by their personal best score on that exam,
                take the top {TOP_STUDENTS_PER_EXAM_FOR_AVG} performers, and plot the average of those scores. Every
                scored assessment is listed; bars are 0 when no student has a recorded best score yet. Personality
                assessments are excluded. These per-exam averages feed your school&apos;s ranking. If fewer than{' '}
                {TOP_STUDENTS_PER_EXAM_FOR_AVG} students have a score for an exam, we average everyone who has one.
              </Typography>
              <Box sx={{ maxWidth: 650, width: '100%', mx: 'auto' }}>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={analyticsData.examAverages}
                    margin={{ top: 8, bottom: 8, left: 4, right: 12 }}
                    barCategoryGap="18%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="category"
                      stroke="#94a3b8"
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={88}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} width={44} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: `1px solid ${ip.cardBorder}`,
                        color: '#1E293B',
                      }}
                      formatter={(value: number) => [`${value}%`, `Top ${TOP_STUDENTS_PER_EXAM_FOR_AVG} avg`]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: 8 }} />
                    <Bar
                      dataKey="current"
                      fill="#3b82f6"
                      name={`Top ${TOP_STUDENTS_PER_EXAM_FOR_AVG} avg %`}
                      barSize={68}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default SchoolAdminAnalyticsPage;
