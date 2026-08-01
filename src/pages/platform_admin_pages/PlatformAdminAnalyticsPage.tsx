import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutline as CorrectIcon,
  PeopleOutline as PeopleIcon,
  Quiz as QuizIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getPlatformAdminPracticeExamDetail,
  getPlatformAdminPracticeExamSummaries,
  getPlatformAdminQodStats,
  getPlatformAdminSchoolAdminActivity,
  getPlatformAdminTopCoins,
  getPlatformAdminTopQod,
  type PracticeExamSummaryRow,
  type PracticeGradeBreakdownRow,
  type PracticeLeaderboardRow,
  type QodDailyStatRow,
  type SchoolAdminActivityRow,
  type TopCoinsStudentRow,
  type TopQodStudentRow,
} from '../../db/platformAdminAnalytics';
import { formatDate, formatDateTime } from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminFilterSelectSx,
  platformAdminOutlinedButtonSx,
  platformAdminPageContainerSx,
  platformAdminSelectMenuPaperSx,
  platformAdminStatsGridSx,
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminPageHeader, PlatformAdminStatCard } from './platformAdminComponents';

type AnalyticsTab = 'practice' | 'qod' | 'activity';

const PlatformAdminAnalyticsPage: React.FC = () => {
  const [tab, setTab] = useState<AnalyticsTab>('practice');

  const [practiceSummaries, setPracticeSummaries] = useState<PracticeExamSummaryRow[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'total_correct' | 'total_sessions'>('total_correct');
  const [byGrade, setByGrade] = useState<PracticeGradeBreakdownRow[]>([]);
  const [topStudents, setTopStudents] = useState<PracticeLeaderboardRow[]>([]);
  const [practiceGeneratedAt, setPracticeGeneratedAt] = useState('');
  const [practiceIndexesBuilding, setPracticeIndexesBuilding] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);

  const [qodDays, setQodDays] = useState<QodDailyStatRow[]>([]);
  const [qodToday, setQodToday] = useState<QodDailyStatRow | null>(null);
  const [topQod, setTopQod] = useState<TopQodStudentRow[]>([]);
  const [qodGeneratedAt, setQodGeneratedAt] = useState('');
  const [qodLoading, setQodLoading] = useState(false);
  const [qodError, setQodError] = useState<string | null>(null);

  const [topCoins, setTopCoins] = useState<TopCoinsStudentRow[]>([]);
  const [schoolAdmins, setSchoolAdmins] = useState<SchoolAdminActivityRow[]>([]);
  const [activityGeneratedAt, setActivityGeneratedAt] = useState('');
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const loadPractice = useCallback(async (opts?: { refresh?: boolean }) => {
    setPracticeLoading(true);
    setPracticeError(null);
    setPracticeIndexesBuilding(false);
    try {
      let summaries = await getPlatformAdminPracticeExamSummaries({ refresh: opts?.refresh });
      // Stale cache from before session backfill: attempts exist but sessions are all 0.
      const staleSessions =
        !opts?.refresh &&
        summaries.exams.some(
          (e) => (e.total_attempts ?? 0) > 0 && (e.total_sessions ?? 0) === 0
        );
      if (staleSessions) {
        summaries = await getPlatformAdminPracticeExamSummaries({ refresh: true });
      }
      setPracticeSummaries(summaries.exams);
      setPracticeGeneratedAt(summaries.generated_at);
      setPracticeIndexesBuilding(summaries.indexes_building === true);
      const examId = selectedExamId || summaries.exams[0]?.exam_id || '';
      if (!selectedExamId && examId) {
        setSelectedExamId(examId);
      }
      if (examId) {
        const detail = await getPlatformAdminPracticeExamDetail(examId, {
          limit: 10,
          sortBy,
          refresh: opts?.refresh || staleSessions,
        });
        setByGrade(detail.by_grade);
        setTopStudents(detail.top_students);
        setPracticeGeneratedAt(detail.generated_at || summaries.generated_at);
        if (detail.indexes_building) setPracticeIndexesBuilding(true);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      const msg = err?.response?.data?.error || err?.message || 'Failed to load practice analytics';
      const lower = msg.toLowerCase();
      if (lower.includes('index') || lower.includes('failed_precondition')) {
        setPracticeError(
          'Firestore indexes for practice analytics are still building. Check the Firebase console Indexes tab - usually a few minutes. Refresh after they show Enabled.'
        );
      } else {
        setPracticeError(msg);
      }
    } finally {
      setPracticeLoading(false);
    }
  }, [selectedExamId, sortBy]);

  const loadQod = useCallback(async (opts?: { refresh?: boolean }) => {
    setQodLoading(true);
    setQodError(null);
    try {
      const [stats, top] = await Promise.all([
        getPlatformAdminQodStats(30, { refresh: opts?.refresh }),
        getPlatformAdminTopQod(10, { refresh: opts?.refresh }),
      ]);
      setQodDays(stats.days);
      setQodToday(stats.today);
      setTopQod(top.students);
      setQodGeneratedAt(stats.generated_at || top.generated_at);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setQodError(err?.response?.data?.error || err?.message || 'Failed to load QoD analytics');
    } finally {
      setQodLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async (opts?: { refresh?: boolean }) => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const [coins, admins] = await Promise.all([
        getPlatformAdminTopCoins(10, { refresh: opts?.refresh }),
        getPlatformAdminSchoolAdminActivity(20, { refresh: opts?.refresh }),
      ]);
      setTopCoins(coins.students);
      setSchoolAdmins(admins.admins);
      setActivityGeneratedAt(coins.generated_at || admins.generated_at);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setActivityError(err?.response?.data?.error || err?.message || 'Failed to load activity analytics');
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'practice') void loadPractice();
    if (tab === 'qod') void loadQod();
    if (tab === 'activity') void loadActivity();
  }, [tab, loadPractice, loadQod, loadActivity]);

  const anyLoading = practiceLoading || qodLoading || activityLoading;

  const handleForceRefresh = () => {
    if (tab === 'practice') void loadPractice({ refresh: true });
    if (tab === 'qod') void loadQod({ refresh: true });
    if (tab === 'activity') void loadActivity({ refresh: true });
  };

  const selectedSummary = useMemo(
    () => practiceSummaries.find((e) => e.exam_id === selectedExamId) ?? null,
    [practiceSummaries, selectedExamId]
  );

  const gradeChartData = useMemo(
    () =>
      byGrade.map((g) => ({
        grade: `G${g.grade}`,
        accuracy_pct: g.accuracy_pct,
        students: g.unique_students,
        sessions: g.total_sessions,
      })),
    [byGrade]
  );

  const qodChartData = useMemo(
    () =>
      qodDays.map((d) => ({
        date: d.date.slice(5),
        answered: d.total_answered,
        correct: d.total_correct,
      })),
    [qodDays]
  );

  const qodTotals = useMemo(() => {
    const answered = qodDays.reduce((s, d) => s + d.total_answered, 0);
    const correct = qodDays.reduce((s, d) => s + d.total_correct, 0);
    return {
      answered,
      correct,
      accuracy: answered > 0 ? Math.round((1000 * correct) / answered) / 10 : 0,
    };
  }, [qodDays]);

  const staleHint = (iso: string) =>
    iso ? `Cached as of ${formatDateTime(iso)} · refreshes ~6 hours` : 'Cached · not realtime';

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Analytics"
        subtitle="Platform usage for practice exams, Question of the Day, and admin activity. Data is Redis-cached and not realtime."
        action={
          <Button
            variant="outlined"
            startIcon={anyLoading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={handleForceRefresh}
            disabled={anyLoading}
            sx={platformAdminOutlinedButtonSx}
          >
            Refresh data
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={(_e, value: AnalyticsTab) => setTab(value)}
        sx={{
          mb: 2.5,
          minHeight: 42,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 42,
            color: `${ip.subtext} !important`,
          },
          '& .MuiTab-root.Mui-selected': {
            color: `${ip.navy} !important`,
          },
          '& .MuiTabs-indicator': { bgcolor: ip.navy },
        }}
      >
        <Tab value="practice" label="Practice Exams" />
        <Tab value="qod" label="Question of the Day" />
        <Tab value="activity" label="Activity" />
      </Tabs>

      {tab === 'practice' && (
        <>
          {practiceError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {practiceError}
            </Alert>
          )}
          {practiceIndexesBuilding && !practiceError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Firestore indexes for accuracy/sessions are still building. Student counts may show now;
              practice session totals and accuracy will fill in once indexes finish (usually a few minutes).
              Refresh after they show Enabled in the Firebase console.
            </Alert>
          )}

          {practiceLoading && practiceSummaries.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: ip.navy }} />
            </Box>
          ) : practiceSummaries.length === 0 ? (
            <Card sx={platformAdminCardSx}>
              <CardContent sx={{ py: 5, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.75 }}>
                  Practice analytics unavailable
                </Typography>
                <Typography variant="body2" sx={{ color: ip.subtext, maxWidth: 480, mx: 'auto' }}>
                  {practiceError
                    ? practiceError
                    : 'No practice exam summary data yet. After students practice, or after running the one-time backfill, stats will appear here.'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1.5 }}>
                {staleHint(practiceGeneratedAt)}
              </Typography>
              <Box sx={{ ...platformAdminStatsGridSx, mb: 2.5 }}>
                {practiceSummaries.map((exam) => (
                  <Card
                    key={exam.exam_id}
                    sx={{
                      ...platformAdminCardSx,
                      cursor: 'pointer',
                      outline: selectedExamId === exam.exam_id ? `2px solid ${ip.navy}` : 'none',
                    }}
                    onClick={() => setSelectedExamId(exam.exam_id)}
                  >
                    <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                      <Typography sx={{ fontWeight: 700, color: ip.heading, fontSize: '0.92rem', mb: 1 }}>
                        {exam.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: ip.subtext }}>
                        {exam.unique_students.toLocaleString()} students ·{' '}
                        {(exam.total_sessions ?? 0).toLocaleString()} practice sessions
                      </Typography>
                      <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 600, mt: 0.5 }}>
                        {exam.accuracy_pct}% accuracy · {exam.active_students_30d} active (30d)
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2.5, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel sx={{ color: ip.subtext }}>Practice exam</InputLabel>
                  <Select
                    label="Practice exam"
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(String(e.target.value))}
                    MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                    sx={platformAdminFilterSelectSx(220)}
                  >
                    {practiceSummaries.map((exam) => (
                      <MenuItem key={exam.exam_id} value={exam.exam_id}>
                        {exam.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel sx={{ color: ip.subtext }}>Top students by</InputLabel>
                  <Select
                    label="Top students by"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value === 'total_sessions' ? 'total_sessions' : 'total_correct')
                    }
                    MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                    sx={platformAdminFilterSelectSx(180)}
                  >
                    <MenuItem value="total_correct">Correct answers</MenuItem>
                    <MenuItem value="total_sessions">Practice sessions</MenuItem>
                  </Select>
                </FormControl>
                {selectedSummary && (
                  <Typography variant="body2" sx={{ color: ip.subtext }}>
                    Overall accuracy {selectedSummary.accuracy_pct}% across{' '}
                    {selectedSummary.unique_students.toLocaleString()} students
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                  gap: 2.5,
                  mb: 2.5,
                }}
              >
                <Card sx={platformAdminCardSx}>
                  <CardContent>
                    <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
                      Accuracy by grade
                    </Typography>
                    {practiceLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} sx={{ color: ip.navy }} />
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                          <BarChart data={gradeChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="accuracy_pct" name="Accuracy %" fill="#2563eb" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                <Card sx={platformAdminCardSx}>
                  <CardContent>
                    <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
                      Volume by grade
                    </Typography>
                    {practiceLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} sx={{ color: ip.navy }} />
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                          <BarChart data={gradeChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="students" name="Students" fill="#059669" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="sessions" name="Practice sessions" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>

              <Card sx={platformAdminCardSx}>
                <CardContent>
                  <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
                    Top students · {selectedSummary?.label ?? 'Practice exam'}
                  </Typography>
                  <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                    <Table size="medium" sx={platformAdminTableSx}>
                      <TableHead>
                        <TableRow sx={platformAdminTableHeadRowSx}>
                          <TableCell>#</TableCell>
                          <TableCell>Student</TableCell>
                          <TableCell>School</TableCell>
                          <TableCell>Grade</TableCell>
                          <TableCell align="right">Correct</TableCell>
                          <TableCell align="right">Practice sessions</TableCell>
                          <TableCell align="right">Accuracy</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topStudents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 4, color: ip.subtext }}>
                              No practice outcomes yet for this exam.
                            </TableCell>
                          </TableRow>
                        ) : (
                          topStudents.map((row, idx) => (
                            <TableRow key={row.uid}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: ip.heading }}>
                                {[row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || row.uid}
                              </TableCell>
                              <TableCell>{row.school_name ?? '-'}</TableCell>
                              <TableCell>{row.grade ?? '-'}</TableCell>
                              <TableCell align="right">{row.total_correct.toLocaleString()}</TableCell>
                              <TableCell align="right">{(row.total_sessions ?? 0).toLocaleString()}</TableCell>
                              <TableCell align="right">{row.accuracy_pct}%</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {tab === 'qod' && (
        <>
          {qodError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {qodError}
            </Alert>
          )}
          <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1.5 }}>
            {staleHint(qodGeneratedAt)}
          </Typography>

          {qodLoading && qodDays.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: ip.navy }} />
            </Box>
          ) : (
            <>
              <Box sx={{ ...platformAdminStatsGridSx, mb: 2.5 }}>
                <PlatformAdminStatCard
                  title="Answered today"
                  value={(qodToday?.total_answered ?? 0).toLocaleString()}
                  icon={<QuizIcon sx={{ color: '#2563eb' }} />}
                  accent="#2563eb"
                />
                <PlatformAdminStatCard
                  title="Correct today"
                  value={(qodToday?.total_correct ?? 0).toLocaleString()}
                  icon={<CorrectIcon sx={{ color: '#059669' }} />}
                  accent="#059669"
                />
                <PlatformAdminStatCard
                  title="30-day answers"
                  value={qodTotals.answered.toLocaleString()}
                  icon={<PeopleIcon sx={{ color: '#7c3aed' }} />}
                  accent="#7c3aed"
                />
                <PlatformAdminStatCard
                  title="30-day accuracy"
                  value={`${qodTotals.accuracy}%`}
                  icon={<TimelineIcon sx={{ color: '#b45309' }} />}
                  accent="#b45309"
                />
              </Box>

              <Card sx={platformAdminCardSx}>
                <CardContent>
                  <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
                    Last 30 days (IST)
                  </Typography>
                  <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <LineChart data={qodChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" interval={1} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="answered" name="Answered" stroke="#2563eb" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="correct" name="Correct" stroke="#059669" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ ...platformAdminCardSx, mt: 2.5 }}>
                <CardContent>
                  <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
                    Top Question of the Day
                  </Typography>
                  <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 2 }}>
                    Lifetime attempts per student (tracked from when totals were introduced). Test/staff accounts excluded.
                  </Typography>
                  <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                    <Table size="small" sx={platformAdminTableSx}>
                      <TableHead>
                        <TableRow sx={platformAdminTableHeadRowSx}>
                          <TableCell>#</TableCell>
                          <TableCell>Student</TableCell>
                          <TableCell>School</TableCell>
                          <TableCell align="right">Attempted</TableCell>
                          <TableCell align="right">Correct</TableCell>
                          <TableCell align="right">Accuracy</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topQod.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3, color: ip.subtext }}>
                              No QoD totals yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          topQod.map((row, idx) => (
                            <TableRow key={row.uid}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                {[row.first_name, row.last_name].filter(Boolean).join(' ') || row.email}
                              </TableCell>
                              <TableCell>{row.school_name ?? '-'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>
                                {row.qod_attempted_total.toLocaleString()}
                              </TableCell>
                              <TableCell align="right">{row.qod_correct_total.toLocaleString()}</TableCell>
                              <TableCell align="right">{row.qod_accuracy_pct}%</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {tab === 'activity' && (
        <>
          {activityError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {activityError}
            </Alert>
          )}
          <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1.5 }}>
            {staleHint(activityGeneratedAt)}
          </Typography>

          {activityLoading && topCoins.length === 0 && schoolAdmins.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: ip.navy }} />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                gap: 2.5,
              }}
            >
              <Card sx={platformAdminCardSx}>
                <CardContent>
                  <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
                    Top Argus Coins
                  </Typography>
                  <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                    <Table size="small" sx={platformAdminTableSx}>
                      <TableHead>
                        <TableRow sx={platformAdminTableHeadRowSx}>
                          <TableCell>#</TableCell>
                          <TableCell>Student</TableCell>
                          <TableCell>School</TableCell>
                          <TableCell align="right">Coins</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topCoins.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 3, color: ip.subtext }}>
                              No coin balances yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          topCoins.map((row, idx) => (
                            <TableRow key={row.uid}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                {[row.first_name, row.last_name].filter(Boolean).join(' ') || row.email}
                              </TableCell>
                              <TableCell>{row.school_name ?? '-'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>
                                {row.argus_coins.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Card sx={platformAdminCardSx}>
                <CardContent>
                  <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
                    Recently signed-in school admins
                  </Typography>
                  <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 2 }}>
                    Firebase Auth last sign-in. Also shown on each school detail page.
                  </Typography>
                  <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                    <Table size="small" sx={platformAdminTableSx}>
                      <TableHead>
                        <TableRow sx={platformAdminTableHeadRowSx}>
                          <TableCell>Email</TableCell>
                          <TableCell>School</TableCell>
                          <TableCell>Last sign-in</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {schoolAdmins.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 3, color: ip.subtext }}>
                              No school admin sign-ins recorded yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          schoolAdmins.map((row) => (
                            <TableRow key={row.email}>
                              <TableCell sx={{ fontWeight: 600 }}>{row.email}</TableCell>
                              <TableCell>{row.school_name ?? row.school_id ?? '-'}</TableCell>
                              <TableCell>{formatDate(row.last_active_at)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default PlatformAdminAnalyticsPage;
