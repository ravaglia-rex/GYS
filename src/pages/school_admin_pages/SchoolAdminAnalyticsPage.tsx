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
import { type StudentRow } from '../../db/schoolAdminCollection';
import { useSchoolAdminRoster } from '../../query/hooks';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  allExamsWithAnyActivity,
  assessmentDisplayName,
  summarizeExamGradeTier123,
  summarizeNationalPerformanceTiers,
} from '../../utils/schoolAdminTierAnalytics';
import {
  EXAM_MAX_SCORE_POINTS,
  SCHOOL_SCORED_ASSESSMENT_IDS,
  isSchoolScoredAssessment,
  tierPercentToExamPoints,
} from '../../utils/assessmentGating';
import { NationalPerformanceTierOverview } from '../../components/school_admin/NationalPerformanceTierOverview';
import { buildGreenfieldPreviewStudentRows } from '../../data/schoolPreviewMock';
import { REASONING_EXAM_SUBCATEGORIES } from '../../data/reasoningExamSubcategories';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { SchoolAdminPageHeader, schoolAdminPageContainerSx } from './schoolAdminPageStyles';

const SCORE_BAND_ORDER = ['900-1000', '800-899', '700-799', '600-699', '500-599', 'Below 500'] as const;

const SCORE_BAND_COLORS: Record<(typeof SCORE_BAND_ORDER)[number], string> = {
  '900-1000': '#10b981',
  '800-899': '#3b82f6',
  '700-799': '#f59e0b',
  '600-699': '#ef4444',
  '500-599': '#6b7280',
  'Below 500': '#cbd5e1',
};

/** Sub-strand scaffold for Score Distribution until sectional scores ship. */
const SCORE_DISTRIBUTION_SCAFFOLD = (
  ['symbolic_reasoning', 'mathematical_reasoning', 'verbal_reasoning'] as const
).map(examId => ({
  examId,
  subcategories: [...(REASONING_EXAM_SUBCATEGORIES[examId] ?? [])],
}));

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

/** Per assessment, average best score among the school’s top-N students by that score (N capped by how many have progress). */
const TOP_STUDENTS_PER_EXAM_FOR_AVG = 10;

function bestScorePoints(raw: number | null | undefined): number | null {
  if (raw == null || typeof raw !== 'number' || Number.isNaN(raw)) return null;
  return tierPercentToExamPoints(raw <= 1 ? raw * 100 : raw);
}

function scoredExamIdsForAvgChart(): string[] {
  return [...SCHOOL_SCORED_ASSESSMENT_IDS];
}

function isPersonalityCompleted(progress: StudentRow['assessment_progress'] | undefined): boolean {
  const p = progress?.[PERSONALITY_ASSESSMENT_ID];
  if (!p) return false;
  const st = p.status ?? '';
  return st === 'completed' || st === 'tier_advanced';
}

/** One bar per school-scored assessment; `current` is 0 when no student has a best score yet. */
function buildExamAverageChartRows(
  students: StudentRow[]
): Array<{ category: string; current: number; remainder: number }> {
  return scoredExamIdsForAvgChart().map(id => {
    const scores: number[] = [];
    for (const s of students) {
      const points = bestScorePoints(s.assessment_progress?.[id]?.best_score ?? undefined);
      if (points != null) scores.push(points);
    }
    scores.sort((a, b) => b - a);
    const top = scores.slice(0, TOP_STUDENTS_PER_EXAM_FOR_AVG);
    const current =
      top.length > 0 ? Math.round(top.reduce((acc, v) => acc + v, 0) / top.length) : 0;
    return {
      category: assessmentDisplayName(id),
      current,
      remainder: Math.max(0, EXAM_MAX_SCORE_POINTS - current),
    };
  });
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

interface AnalyticsData {
  gradeDistribution: Array<{
    grade: number;
    count: number;
    percentage: number;
  }>;
  qualificationStats: {
    total: number;
  };
  /** Mean best score points among top performers per exam; one row per school-scored assessment (0 if none). */
  examAverages: Array<{ category: string; current: number; remainder: number }>;
  personalityCompletion: { completed: number; total: number };
}

const SchoolAdminAnalyticsPage: React.FC = () => {
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const [tierAnalyticsStudents, setTierAnalyticsStudents] = useState<StudentRow[]>([]);
  const [examBreakdownId, setExamBreakdownId] = useState<string>('');

  const nationalPerfTiersSummary = useMemo(
    () => summarizeNationalPerformanceTiers(tierAnalyticsStudents),
    [tierAnalyticsStudents]
  );
  const examIdsWithActivity = useMemo(
    () => allExamsWithAnyActivity(tierAnalyticsStudents).filter(isSchoolScoredAssessment),
    [tierAnalyticsStudents]
  );
  const examGradeTierRows = useMemo(
    () =>
      examBreakdownId
        ? summarizeExamGradeTier123(tierAnalyticsStudents, examBreakdownId)
        : [],
    [tierAnalyticsStudents, examBreakdownId]
  );

  useEffect(() => {
    if (examIdsWithActivity.length === 0) {
      setExamBreakdownId('');
      return;
    }
    setExamBreakdownId(prev => (prev && examIdsWithActivity.includes(prev) ? prev : examIdsWithActivity[0]!));
  }, [examIdsWithActivity]);

  // Shared, cached roster fetch (see query/hooks.ts) - Dashboard/Students pages loading the same
  // school's roster within the staleTime window serve this straight from the React Query cache
  // instead of each page re-reading the full student collection.
  const rosterQuery = useSchoolAdminRoster(
    schoolAdmin?.schoolId ? String(schoolAdmin.schoolId).trim() : undefined,
    !isSchoolAdminPreview
  );

  useEffect(() => {
    if (isSchoolAdminPreview) {
      setTierAnalyticsStudents(buildGreenfieldPreviewStudentRows());
      return;
    }
    if (rosterQuery.data) {
      setTierAnalyticsStudents(rosterQuery.data);
    } else if (rosterQuery.isError) {
      console.warn('School roster fetch failed (tier analytics)', rosterQuery.error);
      setTierAnalyticsStudents([]);
    }
  }, [isSchoolAdminPreview, rosterQuery.data, rosterQuery.isError, rosterQuery.error]);

  const loading = isSchoolAdminPreview ? false : rosterQuery.isLoading;

  // Grade distribution and exam averages are both derivable from the same roster fetch above -
  // no need for a second, separate full-roster read just for grade counts.
  const analyticsData = useMemo<AnalyticsData>(() => {
    const gradeCounts: Record<number, number> = {};
    for (const s of tierAnalyticsStudents) {
      const grade = typeof s.grade === 'number' && s.grade > 0 ? s.grade : 0;
      if (grade > 0) {
        gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
      }
    }
    const totalStudents = tierAnalyticsStudents.length;
    const gradeDistribution = Object.entries(gradeCounts)
      .map(([grade, count]) => ({
        grade: parseInt(grade, 10),
        count,
        percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
      }))
      .sort((a, b) => a.grade - b.grade);

    return {
      gradeDistribution,
      qualificationStats: { total: totalStudents },
      examAverages: buildExamAverageChartRows(tierAnalyticsStudents),
      personalityCompletion: buildPersonalityCompletionStats(tierAnalyticsStudents),
    };
  }, [tierAnalyticsStudents]);

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
        tierAnalyticsStudents.length > 0 ||
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
    <Box sx={schoolAdminPageContainerSx}>
      <PageTutorial pageKey="school.analytics" ready={!loading} />
      <SchoolAdminPageHeader
        title="Analytics"
        subtitle="Comprehensive insights into your school's performance and student achievements"
      />

      {!hasAnyAnalyticsData && (
        <Card sx={{ bgcolor: '#ffffff', boxShadow: 'none', border: `1px solid ${ip.cardBorder}`, borderRadius: 2 }}>
          <CardContent sx={{ py: 5, px: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(16, 64, 139, 0.08)', color: ip.navy, mx: 'auto', mb: 2 }}>
              <ShowChartIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>
              No analytics data yet
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, maxWidth: 560, mx: 'auto', lineHeight: 1.6 }}>
              Analytics will appear here once students are registered under your school and begin completing assessments.
              Use the Students page to invite learners, then return here to review class mix, proficiency tiers, and score trends.
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

          {/* Nationwide GYS performance tiers (achievement_tier) */}
          <Card sx={{ bgcolor: '#ffffff', boxShadow: 'none', border: `1px solid ${ip.cardBorder}`, mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', mb: 0.5 }}>
                National performance tiers (GYS)
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, lineHeight: 1.55 }}>
                Explorer → Diamond: normed tiers from each student&apos;s profile. 
              </Typography>
              <NationalPerformanceTierOverview
                counts={nationalPerfTiersSummary.counts}
                total={nationalPerfTiersSummary.total}
                subtitle="Each student counted once by current GYS performance tier (achievement_tier on each profile). Same roster as proficiency analytics."
                barHeight={36}
              />
            </CardContent>
          </Card>

          {/* Proficiency levels 1–3 (assessment progress) */}
          <Card sx={{ bgcolor: '#ffffff', boxShadow: 'none', border: `1px solid ${ip.cardBorder}`, mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', mb: 0.5 }}>
                Proficiency level analytics
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, lineHeight: 1.55 }}>
                Counts students at Level 1 / 2 / 3 on a single assessment, broken down by class. Each student is
                counted once for the selected exam based on their proficiency on that exam only (not their weakest
                across subjects). Overview uses the same per-exam view without the class split.
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

          {/* Score Distribution - structure only until sectional scores exist */}
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
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, lineHeight: 1.55 }}>
                Sub-strand score bands will appear here once sectional scores are available. Empty tracks show where
                each reasoning strand will fill in.
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B', mb: 0.5 }}>
                By reasoning sub-strand
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.5 }}>
                No sectional scores yet - bars stay empty until real student data arrives.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center', mb: 2 }}>
                {SCORE_BAND_ORDER.map(r => (
                  <Box key={r} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: 0.5,
                        bgcolor: SCORE_BAND_COLORS[r],
                        flexShrink: 0,
                        opacity: 0.45,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                      {r}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {SCORE_DISTRIBUTION_SCAFFOLD.map(examBlock => (
                <Box key={examBlock.examId} sx={{ mb: 3, '&:last-of-type': { mb: 0 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 1.5 }}>
                    {assessmentDisplayName(examBlock.examId)}
                  </Typography>
                  {examBlock.subcategories.map(name => (
                    <Box key={name} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          mb: 0.75,
                          gap: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                          {name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', flexShrink: 0 }}>
                          Mean - / {EXAM_MAX_SCORE_POINTS}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 10,
                          borderRadius: 5,
                          bgcolor: '#e2e8f0',
                          border: `1px dashed ${ip.cardBorder}`,
                        }}
                        title="Sectional scores not available yet"
                      />
                    </Box>
                  ))}
                </Box>
              ))}
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

          <Card
            data-tutorial-id="school-analytics-charts"
            sx={{ bgcolor: '#ffffff', boxShadow: 'none', border: `1px solid ${ip.cardBorder}`, mb: 4 }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShowChartIcon sx={{ color: '#3b82f6', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B' }}>
                  Average best score by assessment
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, lineHeight: 1.6 }}>
                For each exam, we pool students across all classes, rank them by their personal best score on that exam,
                take the top {TOP_STUDENTS_PER_EXAM_FOR_AVG} performers, and plot the average of those scores. Charts
                cover Symbolic Reasoning, Verbal Reasoning, Mathematical Reasoning, and AI Proficiency (school-scored
                tracks). Bars are 0 when no student has a recorded best
                score yet. If fewer than {TOP_STUDENTS_PER_EXAM_FOR_AVG} students have a score for an exam, we average
                everyone who has one.
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
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={[0, EXAM_MAX_SCORE_POINTS]}
                      width={44}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: `1px solid ${ip.cardBorder}`,
                        color: '#1E293B',
                      }}
                      formatter={(value: number) => [
                        `${value} / ${EXAM_MAX_SCORE_POINTS}`,
                        `Top ${TOP_STUDENTS_PER_EXAM_FOR_AVG} avg`,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: 8 }} />
                    <Bar
                      dataKey="current"
                      stackId="avg"
                      fill="#3b82f6"
                      name={`Top ${TOP_STUDENTS_PER_EXAM_FOR_AVG} avg score`}
                      barSize={68}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="remainder"
                      stackId="avg"
                      fill="#e2e8f0"
                      name="Remaining to max"
                      barSize={68}
                      radius={[4, 4, 0, 0]}
                      legendType="none"
                      tooltipType="none"
                      isAnimationActive={false}
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
