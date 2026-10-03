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
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSchoolAdminAnalyticsSummary } from '../../query/hooks';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  assessmentDisplayName,
  summarizeExamGradeTier123,
  summarizeNationalPerformanceTiers,
  summarizeSchoolTier123,
  summarizeProficiencyByExam,
  computeAttemptRatePct,
} from '../../utils/schoolAdminTierAnalytics';
import {
  SCHOOL_SCORED_ASSESSMENT_IDS,
  isSchoolScoredAssessment,
} from '../../utils/assessmentGating';
import { buildGreenfieldPreviewStudentRows } from '../../data/schoolPreviewMock';
import type { SchoolAnalyticsSummaryResponse, StudentRow } from '../../db/schoolAdminCollection';
import { countAssessmentsFromProgress } from '../../utils/schoolAdminRosterUtils';

const PERSONALITY_ASSESSMENT_ID = 'comprehensive_personality';

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

function isPersonalityCompleted(progress: StudentRow['assessment_progress'] | undefined): boolean {
  const p = progress?.[PERSONALITY_ASSESSMENT_ID];
  if (!p) return false;
  const st = p.status ?? '';
  return st === 'completed' || st === 'tier_advanced';
}

function buildPersonalityCompletionStats(students: StudentRow[]): {
  completed: number;
  total: number;
} {
  let completed = 0;
  for (const s of students) {
    if (isPersonalityCompleted(s.assessment_progress)) completed += 1;
  }
  return { completed, total: students.length };
}

function buildPreviewAnalyticsSummary(students: StudentRow[]): SchoolAnalyticsSummaryResponse {
  const gradeCounts: Record<number, number> = {};
  for (const s of students) {
    const grade = typeof s.grade === 'number' && s.grade > 0 ? s.grade : 0;
    if (grade > 0) gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
  }
  const totalStudents = students.length;
  const grade_distribution = Object.entries(gradeCounts)
    .map(([grade, count]) => ({
      grade: parseInt(grade, 10),
      count,
      percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
    }))
    .sort((a, b) => a.grade - b.grade);

  const national = summarizeNationalPerformanceTiers(students);
  const examIds = [...SCHOOL_SCORED_ASSESSMENT_IDS].filter(id =>
    students.some(s => {
      const p = s.assessment_progress?.[id];
      if (!p) return false;
      const st = (p.status ?? '').toLowerCase();
      return st === 'completed' || st === 'tier_advanced' || Number(p.attempts_count) > 0;
    })
  );

  const exam_grade_tiers: SchoolAnalyticsSummaryResponse['exam_grade_tiers'] = {};
  for (const examId of SCHOOL_SCORED_ASSESSMENT_IDS) {
    exam_grade_tiers[examId] = summarizeExamGradeTier123(students, examId);
  }

  return {
    schoolId: 'preview',
    student_count: totalStudents,
    grade_distribution,
    national_tiers: national,
    exam_ids_with_activity: examIds.filter(isSchoolScoredAssessment),
    exam_grade_tiers,
    personality_completion: buildPersonalityCompletionStats(students),
    attempt_rate: computeAttemptRatePct(students),
    assessments_completed: students.reduce(
      (n, s) => n + countAssessmentsFromProgress(s.assessment_progress),
      0
    ),
    tier123: summarizeSchoolTier123(students),
    proficiency_by_exam: summarizeProficiencyByExam(students, SCHOOL_SCORED_ASSESSMENT_IDS),
  };
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
  personalityCompletion: { completed: number; total: number };
}

/** Analytics sections shown on the school Overview page. */
const SchoolAdminOverviewInsights: React.FC = () => {
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const [examBreakdownId, setExamBreakdownId] = useState<string>('');

  const analyticsQuery = useSchoolAdminAnalyticsSummary(
    schoolAdmin?.schoolId ? String(schoolAdmin.schoolId).trim() : undefined,
    !isSchoolAdminPreview
  );

  const summary = useMemo((): SchoolAnalyticsSummaryResponse | null => {
    if (isSchoolAdminPreview) {
      return buildPreviewAnalyticsSummary(buildGreenfieldPreviewStudentRows());
    }
    return analyticsQuery.data ?? null;
  }, [isSchoolAdminPreview, analyticsQuery.data]);

  const examIdsWithActivity = useMemo(
    () => (summary?.exam_ids_with_activity ?? []).filter(isSchoolScoredAssessment),
    [summary]
  );
  const examGradeTierRows = useMemo(
    () => (examBreakdownId && summary ? summary.exam_grade_tiers[examBreakdownId] ?? [] : []),
    [summary, examBreakdownId]
  );

  useEffect(() => {
    if (examIdsWithActivity.length === 0) {
      setExamBreakdownId('');
      return;
    }
    setExamBreakdownId(prev => (prev && examIdsWithActivity.includes(prev) ? prev : examIdsWithActivity[0]!));
  }, [examIdsWithActivity]);

  const loading = isSchoolAdminPreview ? false : analyticsQuery.isLoading;

  const analyticsData = useMemo<AnalyticsData | null>(() => {
    if (!summary) return null;
    return {
      gradeDistribution: summary.grade_distribution,
      qualificationStats: { total: summary.student_count },
      personalityCompletion: summary.personality_completion,
    };
  }, [summary]);

  const gradePieData = useMemo(
    () =>
      (analyticsData?.gradeDistribution ?? [])
        .filter(d => d.count > 0)
        .map(d => ({
          name: `Class ${d.grade}`,
          count: d.count,
          percentage: d.percentage,
        })),
    [analyticsData?.gradeDistribution]
  );

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const hasAnyAnalyticsData = Boolean(
    analyticsData &&
      (analyticsData.qualificationStats.total > 0 ||
        gradePieData.length > 0 ||
        examIdsWithActivity.length > 0)
  );

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
    <Box>
      {!hasAnyAnalyticsData && (
        <Card sx={{ bgcolor: '#ffffff', boxShadow: 'none', border: `1px solid ${ip.cardBorder}`, borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ py: 5, px: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(16, 64, 139, 0.08)', color: ip.navy, mx: 'auto', mb: 2 }}>
              <ShowChartIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>
              No analytics data yet
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, maxWidth: 560, mx: 'auto', lineHeight: 1.6 }}>
              Analytics will appear here once students are registered under your school and begin completing assessments.
              Use the Students page to invite learners, then return here to review class mix and proficiency tiers.
              Sub-strand score bands are in the quarterly school report.
            </Typography>
          </CardContent>
        </Card>
      )}

      {hasAnyAnalyticsData && analyticsData && (
        <>
          {/* Total students + class distribution */}
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
                    Class Distribution
                  </Typography>
                </Box>
                {gradePieData.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#94a3b8', py: 2 }}>
                    No class data yet for registered students.
                  </Typography>
                ) : (
                  <Box sx={{ width: '100%', height: 280, minHeight: 260 }}>
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 480, height: 260 }}
                    >
                      <PieChart>
                        <Pie
                          data={gradePieData}
                          cx="50%"
                          cy="50%"
                          isAnimationActive={false}
                          label={({ name, count }) => `${name}: ${count} students`}
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
                            `${value} students`,
                            item.payload?.name ?? 'Class',
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
                Counts students at Level 1 / 2 / 3 on a single assessment, broken down by class. Each student is
                counted once for the selected exam based on their proficiency on that exam only (not their weakest
                across subjects). The bars above show the same levels across all classes.
              </Typography>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1E293B', mt: 1, mb: 1 }}>
                By exam × class × level
              </Typography>
              <FormControl data-tutorial-id="school-analytics-exam-select" size="small" sx={examTierSelectFormSx}>
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
                    overflowX: 'auto',
                    maxWidth: '100%',
                  }}
                >
                  <Table size="small" sx={{ bgcolor: '#fff', minWidth: 480 }}>
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
                        <TableCell>Class</TableCell>
                        <TableCell align="right">Level 1</TableCell>
                        <TableCell align="right">Level 2</TableCell>
                        <TableCell align="right">Level 3</TableCell>
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
                            {row.grade === 0 ? 'Unspecified' : `Class ${row.grade}`}
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
                    ? 'No students with active progress on this assessment by class.'
                    : 'Select an assessment once students begin assessments.'}
                </Typography>
              )}
            </CardContent>
          </Card>

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
                Personality and Interest
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, lineHeight: 1.55 }}>
                Personality results stay private to the student. Schools only see how many learners have completed the
                assessment.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3,
                  alignItems: 'baseline',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: ip.cardMutedBg,
                  border: `1px solid ${ip.cardBorder}`,
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: ip.heading, lineHeight: 1.2 }}>
                    {analyticsData.personalityCompletion.completed}
                    <Typography
                      component="span"
                      variant="h6"
                      sx={{ fontWeight: 500, color: ip.subtext, ml: 0.75 }}
                    >
                      / {analyticsData.personalityCompletion.total}
                    </Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ color: ip.subtext, mt: 0.5 }}>
                    students completed
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: ip.subtext }}>
                  {analyticsData.personalityCompletion.total > 0
                    ? `${Math.round(
                        (analyticsData.personalityCompletion.completed /
                          analyticsData.personalityCompletion.total) *
                          100
                      )}% of roster`
                    : 'No students on roster yet'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

        </>
      )}
    </Box>
  );
};

export default SchoolAdminOverviewInsights;
