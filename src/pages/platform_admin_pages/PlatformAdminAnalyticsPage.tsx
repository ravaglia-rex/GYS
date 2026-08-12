import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CorrectIcon from '@mui/icons-material/CheckCircleOutline';
import PeopleIcon from '@mui/icons-material/PeopleOutline';
import QuizIcon from '@mui/icons-material/Quiz';
import RefreshIcon from '@mui/icons-material/Refresh';
import TimelineIcon from '@mui/icons-material/Timeline';
import { ExamQuestionStimulus } from '../../components/assessment/ExamQuestionBody';
import type { ExamQuestion } from '../../db/assessmentCollection';
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
  getPlatformAdminPracticeDailyStats,
  getPlatformAdminPracticeDailyStatsByExam,
  getPlatformAdminPracticeExamDetail,
  getPlatformAdminPracticeExamSummaries,
  getPlatformAdminPracticeMonthlyStats,
  getPlatformAdminQodStats,
  getPlatformAdminSchoolAdminActivity,
  getPlatformAdminTopCoins,
  getPlatformAdminTopQod,
  getPlatformAdminOfficialDailyStats,
  getPlatformAdminOfficialExamDetail,
  getPlatformAdminOfficialExamDrilldown,
  getPlatformAdminOfficialExamQuestionStats,
  getPlatformAdminOfficialExamSummaries,
  searchPlatformAdminOfficialExamCompletions,
  type PracticeDailyByExamStatRow,
  type PracticeDailyStatRow,
  type PracticeExamSummaryRow,
  type PracticeGradeBreakdownRow,
  type PracticeLeaderboardRow,
  type PracticeMonthlyStatRow,
  type QodDailyStatRow,
  type SchoolAdminActivityRow,
  type TopCoinsStudentRow,
  type TopQodStudentRow,
  type OfficialDailyStatRow,
  type OfficialExamDrilldown,
  type OfficialExamQuestionStats,
  type OfficialExamGradeRow,
  type OfficialExamLevelRow,
  type OfficialExamRecentRow,
  type OfficialExamSchoolRow,
  type OfficialExamSummaryRow,
  type OfficialQuestionStatRow,
  type OfficialQuestionTagType,
} from '../../db/platformAdminAnalytics';
import { formatDate, formatDateTime } from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminFilterSelectSx,
  platformAdminFilterToolbarRowSx,
  platformAdminOutlinedButtonSx,
  platformAdminPageContainerSx,
  platformAdminSelectMenuPaperSx,
  platformAdminStatsGridSx,
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
  platformAdminTextFieldSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  PlatformAdminAccuracyChip,
  PlatformAdminAnalyticsSection,
  PlatformAdminChip,
  PlatformAdminPageHeader,
  PlatformAdminStatCard,
} from './platformAdminComponents';

type AnalyticsTab = 'official' | 'practice' | 'qod' | 'activity';

/** "Symbolic Reasoning" → "Symbolic"; leaves AI/English Proficiency unchanged. */
function shortOfficialExamLabel(label: string): string {
  return label.replace(/\s+Reasoning$/i, '').trim() || label;
}

function toStimulusExamQuestion(q: OfficialQuestionStatRow): ExamQuestion {
  return {
    id: q.item_id,
    prompt: q.prompt || q.prompt_preview || '',
    options: (q.options || []).map((o) => o.text),
    stimulus: q.stimulus,
    stimulus_type: q.stimulus_type ?? undefined,
  };
}

const selectedTagRowSx = {
  cursor: 'pointer' as const,
  bgcolor: 'rgba(15, 118, 110, 0.08)',
  '& td:first-of-type': {
    boxShadow: `inset 3px 0 0 #0f766e`,
  },
};

const analyticsTabRailSx = {
  mb: 2.5,
  minHeight: 44,
  p: 0.5,
  borderRadius: 2,
  bgcolor: ip.cardMutedBg,
  border: `1px solid ${ip.cardBorder}`,
  '& .MuiTabs-flexContainer': { gap: 0.5 },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    minHeight: 36,
    minWidth: 'auto',
    px: 1.75,
    borderRadius: 1.5,
    color: `${ip.subtext} !important`,
  },
  '& .MuiTab-root.Mui-selected': {
    color: `${ip.navy} !important`,
    fontWeight: 800,
    bgcolor: '#fff',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
  },
  '& .MuiTabs-indicator': { display: 'none' },
} as const;

const examPickerTabsSx = {
  mb: 2,
  minHeight: 40,
  p: 0.5,
  borderRadius: 2,
  bgcolor: 'rgba(16, 64, 139, 0.05)',
  border: `1px solid rgba(16, 64, 139, 0.12)`,
  '& .MuiTabs-flexContainer': { gap: 0.5 },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    minHeight: 32,
    minWidth: 'auto',
    px: 1.5,
    borderRadius: 1.25,
    color: `${ip.subtext} !important`,
  },
  '& .MuiTab-root.Mui-selected': {
    color: `${ip.navy} !important`,
    fontWeight: 800,
    bgcolor: '#fff',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
  },
  '& .MuiTabs-indicator': { display: 'none' },
} as const;

const PlatformAdminAnalyticsPage: React.FC = () => {
  const [tab, setTab] = useState<AnalyticsTab>('official');

  const [officialSummaries, setOfficialSummaries] = useState<OfficialExamSummaryRow[]>([]);
  const [officialDaily, setOfficialDaily] = useState<OfficialDailyStatRow[]>([]);
  const [officialDailyExamIds, setOfficialDailyExamIds] = useState<string[]>([]);
  const [selectedOfficialExamId, setSelectedOfficialExamId] = useState('');
  const [officialByLevel, setOfficialByLevel] = useState<OfficialExamLevelRow[]>([]);
  const [officialByGrade, setOfficialByGrade] = useState<OfficialExamGradeRow[]>([]);
  const [officialBySchool, setOfficialBySchool] = useState<OfficialExamSchoolRow[]>([]);
  const [officialRecent, setOfficialRecent] = useState<OfficialExamRecentRow[]>([]);
  const [officialRecentMatched, setOfficialRecentMatched] = useState(0);
  const [officialRecentSearched, setOfficialRecentSearched] = useState(false);
  const [completionQ, setCompletionQ] = useState('');
  const [completionFrom, setCompletionFrom] = useState('');
  const [completionTo, setCompletionTo] = useState('');
  const [completionLevel, setCompletionLevel] = useState<'all' | number>('all');
  const [completionLimit, setCompletionLimit] = useState(25);
  const [officialDrilldown, setOfficialDrilldown] = useState<OfficialExamDrilldown | null>(null);
  const [officialDrillLevel, setOfficialDrillLevel] = useState<'all' | number>('all');
  const [officialQuestionStats, setOfficialQuestionStats] =
    useState<OfficialExamQuestionStats | null>(null);
  const [officialQuestionLoading, setOfficialQuestionLoading] = useState(false);
  const [officialQuestionSelection, setOfficialQuestionSelection] = useState<{
    tagType: OfficialQuestionTagType;
    tag: string;
    label: string;
  } | null>(null);
  const [officialGeneratedAt, setOfficialGeneratedAt] = useState('');
  const [officialIndexesBuilding, setOfficialIndexesBuilding] = useState(false);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialDetailLoading, setOfficialDetailLoading] = useState(false);
  const [officialDrillLoading, setOfficialDrillLoading] = useState(false);
  const [officialCompletionsLoading, setOfficialCompletionsLoading] = useState(false);
  const [officialError, setOfficialError] = useState<string | null>(null);
  const officialDetailReqRef = useRef(0);
  const officialDrillReqRef = useRef(0);
  const officialQuestionReqRef = useRef(0);
  const officialQuestionPanelRef = useRef<HTMLDivElement | null>(null);

  const [practiceSummaries, setPracticeSummaries] = useState<PracticeExamSummaryRow[]>([]);
  const [practiceDaily, setPracticeDaily] = useState<PracticeDailyStatRow[]>([]);
  const [practiceDailyByExam, setPracticeDailyByExam] = useState<PracticeDailyByExamStatRow[]>([]);
  const [practiceDailyExamIds, setPracticeDailyExamIds] = useState<string[]>([]);
  const [practiceDailyToday, setPracticeDailyToday] = useState<PracticeDailyStatRow | null>(null);
  const [practiceMonthly, setPracticeMonthly] = useState<PracticeMonthlyStatRow[]>([]);
  const [practiceMonthlyYear, setPracticeMonthlyYear] = useState(new Date().getFullYear());
  const [practiceMonthlyLoading, setPracticeMonthlyLoading] = useState(false);
  const [practiceMonthlyError, setPracticeMonthlyError] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'total_correct' | 'total_sessions'>('total_correct');
  const [byGrade, setByGrade] = useState<PracticeGradeBreakdownRow[]>([]);
  const [topStudents, setTopStudents] = useState<PracticeLeaderboardRow[]>([]);
  const [practiceGeneratedAt, setPracticeGeneratedAt] = useState('');
  const [practiceIndexesBuilding, setPracticeIndexesBuilding] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceDetailLoading, setPracticeDetailLoading] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const practiceDetailReqRef = useRef(0);

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

  const loadOfficialOverview = useCallback(async (opts?: { refresh?: boolean }) => {
    setOfficialLoading(true);
    setOfficialError(null);
    setOfficialIndexesBuilding(false);
    try {
      const [summaries, daily] = await Promise.all([
        getPlatformAdminOfficialExamSummaries({ refresh: opts?.refresh }),
        getPlatformAdminOfficialDailyStats(30, { refresh: opts?.refresh }),
      ]);
      setOfficialSummaries(summaries.exams);
      setOfficialDaily(daily.days);
      setOfficialDailyExamIds(daily.exam_ids);
      setOfficialGeneratedAt(summaries.generated_at || daily.generated_at);
      setOfficialIndexesBuilding(summaries.indexes_building === true);
      setSelectedOfficialExamId((prev) => prev || summaries.exams[0]?.exam_id || '');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      const msg = err?.response?.data?.error || err?.message || 'Failed to load official exam analytics';
      const lower = msg.toLowerCase();
      if (lower.includes('index') || lower.includes('failed_precondition')) {
        setOfficialError(
          'Firestore indexes for official exam analytics are still building. Refresh after they show Enabled.'
        );
      } else {
        setOfficialError(msg);
      }
    } finally {
      setOfficialLoading(false);
    }
  }, []);

  const loadOfficialDetail = useCallback(async (examId: string, opts?: { refresh?: boolean }) => {
    if (!examId) return;
    const req = ++officialDetailReqRef.current;
    setOfficialDetailLoading(true);
    setOfficialByLevel([]);
    setOfficialByGrade([]);
    setOfficialBySchool([]);
    try {
      const detail = await getPlatformAdminOfficialExamDetail(examId, {
        refresh: opts?.refresh,
      });
      if (req !== officialDetailReqRef.current) return;
      setOfficialByLevel(detail.by_level);
      setOfficialByGrade(detail.by_grade);
      setOfficialBySchool(detail.by_school);
      setOfficialGeneratedAt((prev) => detail.generated_at || prev);
      if (detail.indexes_building) setOfficialIndexesBuilding(true);
    } catch (e: unknown) {
      if (req !== officialDetailReqRef.current) return;
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setOfficialError(err?.response?.data?.error || err?.message || 'Failed to load official exam detail');
      setOfficialByLevel([]);
      setOfficialByGrade([]);
      setOfficialBySchool([]);
    } finally {
      if (req === officialDetailReqRef.current) setOfficialDetailLoading(false);
    }
  }, []);

  const searchOfficialCompletions = useCallback(
    async (examId: string) => {
      if (!examId) return;
      setOfficialCompletionsLoading(true);
      setOfficialError(null);
      try {
        const data = await searchPlatformAdminOfficialExamCompletions(examId, {
          q: completionQ,
          from: completionFrom || undefined,
          to: completionTo || undefined,
          level: completionLevel === 'all' ? null : completionLevel,
          limit: completionLimit,
        });
        setOfficialRecent(data.results);
        setOfficialRecentMatched(data.matched);
        setOfficialRecentSearched(true);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setOfficialError(err?.response?.data?.error || err?.message || 'Failed to search completions');
        setOfficialRecent([]);
        setOfficialRecentMatched(0);
        setOfficialRecentSearched(true);
      } finally {
        setOfficialCompletionsLoading(false);
      }
    },
    [completionQ, completionFrom, completionTo, completionLevel, completionLimit]
  );

  const loadOfficialDrilldown = useCallback(
    async (examId: string, level: 'all' | number, opts?: { refresh?: boolean }) => {
      if (!examId) return;
      const req = ++officialDrillReqRef.current;
      setOfficialDrillLoading(true);
      setOfficialDrilldown(null);
      setOfficialQuestionSelection(null);
      setOfficialQuestionStats(null);
      try {
        const data = await getPlatformAdminOfficialExamDrilldown(examId, {
          level: level === 'all' ? null : level,
          refresh: opts?.refresh,
        });
        if (req !== officialDrillReqRef.current) return;
        setOfficialDrilldown(data);
        if (data.indexes_building) setOfficialIndexesBuilding(true);
      } catch (e: unknown) {
        if (req !== officialDrillReqRef.current) return;
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setOfficialError(err?.response?.data?.error || err?.message || 'Failed to load exam deep dive');
        setOfficialDrilldown(null);
      } finally {
        if (req === officialDrillReqRef.current) setOfficialDrillLoading(false);
      }
    },
    []
  );

  const loadOfficialQuestionStats = useCallback(
    async (
      examId: string,
      selection: { tagType: OfficialQuestionTagType; tag: string; label: string },
      level: 'all' | number,
      opts?: { refresh?: boolean }
    ) => {
      if (!examId) return;
      const req = ++officialQuestionReqRef.current;
      setOfficialQuestionSelection(selection);
      setOfficialQuestionLoading(true);
      setOfficialQuestionStats(null);
      setOfficialError(null);
      requestAnimationFrame(() => {
        officialQuestionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      try {
        const data = await getPlatformAdminOfficialExamQuestionStats(examId, {
          tagType: selection.tagType,
          tag: selection.tag,
          level: level === 'all' ? null : level,
          refresh: opts?.refresh,
        });
        if (req !== officialQuestionReqRef.current) return;
        setOfficialQuestionStats(data);
        if (data.indexes_building) setOfficialIndexesBuilding(true);
        requestAnimationFrame(() => {
          officialQuestionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } catch (e: unknown) {
        if (req !== officialQuestionReqRef.current) return;
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setOfficialError(
          err?.response?.data?.error || err?.message || 'Failed to load question-level stats'
        );
        setOfficialQuestionStats(null);
      } finally {
        if (req === officialQuestionReqRef.current) setOfficialQuestionLoading(false);
      }
    },
    []
  );

  const clearOfficialQuestionDrill = useCallback(() => {
    officialQuestionReqRef.current += 1;
    setOfficialQuestionSelection(null);
    setOfficialQuestionStats(null);
    setOfficialQuestionLoading(false);
  }, []);

  const renderOfficialQuestionDrillPanel = (forTagType: OfficialQuestionTagType) => {
    if (!officialQuestionSelection || officialQuestionSelection.tagType !== forTagType) {
      return null;
    }
    return (
      <Box
          ref={officialQuestionPanelRef}
          sx={{
            mb: 2.5,
            mt: 0.5,
            borderRadius: 2,
            border: '1px solid #cbd5e1',
            borderLeft: `4px solid ${ip.navy}`,
            bgcolor: '#f8fafc',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              px: 2,
              py: 1.5,
              bgcolor: 'rgba(16, 64, 139, 0.06)',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800, color: ip.heading, fontSize: 15 }}>
                Questions · {officialQuestionSelection.label}
              </Typography>
              <Typography variant="caption" sx={{ color: ip.subtext }}>
                Full items from the bank
                {officialQuestionStats
                  ? ` · ${officialQuestionStats.questions.length} served`
                  : officialQuestionLoading
                    ? ' · loading…'
                    : ''}
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={clearOfficialQuestionDrill}
              sx={platformAdminOutlinedButtonSx}
            >
              Back to rollups
            </Button>
          </Box>

          <Box sx={{ px: 2, py: 2 }}>
            {officialQuestionLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} sx={{ color: ip.navy }} />
              </Box>
            ) : !officialQuestionStats || officialQuestionStats.questions.length === 0 ? (
              <Typography variant="body2" sx={{ color: ip.subtext, py: 1 }}>
                No served items found for this tag yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                {officialQuestionStats.questions.map((q, qi) => (
                  <Box
                    key={q.item_id}
                    sx={{
                      bgcolor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 1.5,
                      p: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography sx={{ fontWeight: 800, color: ip.heading, fontSize: 15 }}>
                        Q{qi + 1}
                      </Typography>
                      <PlatformAdminChip
                        label={`${q.times_seen} saw`}
                        tone="neutral"
                      />
                      <PlatformAdminAccuracyChip pct={q.accuracy_pct} />
                      <PlatformAdminChip
                        label={
                          q.avg_time_sec != null ? `${q.avg_time_sec}s avg` : '— time'
                        }
                        tone="info"
                      />
                      {q.mechanic ? (
                        <PlatformAdminChip label={q.mechanic} tone="info" />
                      ) : null}
                    </Box>
                    <Typography sx={{ color: '#475569', fontSize: 12, mb: 0.75 }}>
                      {q.item_id}
                      {q.family || q.subconstruct
                        ? ` · ${[q.family, q.subconstruct].filter(Boolean).join(' · ')}`
                        : ''}
                    </Typography>
                    <Typography
                      sx={{ color: ip.heading, fontSize: 14, mb: 1, lineHeight: 1.45 }}
                    >
                      {q.prompt || q.prompt_preview || '(no prompt)'}
                    </Typography>
                    {q.stimulus != null ? (
                      <Box sx={{ mb: 1.25, maxWidth: 560 }}>
                        <ExamQuestionStimulus
                          q={toStimulusExamQuestion(q)}
                          border="#cbd5e1"
                          variant="light"
                        />
                      </Box>
                    ) : null}
                    {q.options.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {q.options.map((opt) => (
                          <Box
                            key={`${q.item_id}-${opt.letter}`}
                            sx={{
                              display: 'flex',
                              gap: 1,
                              alignItems: 'flex-start',
                              px: 1.25,
                              py: 0.85,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: opt.is_correct ? '#86efac' : '#e2e8f0',
                              bgcolor: opt.is_correct ? '#f0fdf4' : '#f8fafc',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                width: `${Math.min(100, opt.pick_pct)}%`,
                                bgcolor: opt.is_correct
                                  ? 'rgba(22, 163, 74, 0.12)'
                                  : 'rgba(16, 64, 139, 0.08)',
                                pointerEvents: 'none',
                              }}
                            />
                            <Typography
                              sx={{
                                fontWeight: 800,
                                color: ip.heading,
                                minWidth: 18,
                                fontSize: 13,
                                position: 'relative',
                              }}
                            >
                              {opt.letter}.
                            </Typography>
                            <Typography
                              sx={{
                                color: ip.heading,
                                fontSize: 18,
                                lineHeight: 1.35,
                                flex: 1,
                                letterSpacing: '0.04em',
                                position: 'relative',
                              }}
                            >
                              {opt.text || '(empty / image option)'}
                            </Typography>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: 12,
                                color: opt.is_correct ? '#166534' : '#334155',
                                whiteSpace: 'nowrap',
                                position: 'relative',
                              }}
                            >
                              {opt.pick_pct}%
                              {opt.is_correct ? ' · correct' : ''}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: '#64748b', fontSize: 13 }}>
                        (No option text on this item — often image-only.)
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
      </Box>
    );
  };

  const loadPracticeMonthly = useCallback(async (opts?: { refresh?: boolean }) => {
    setPracticeMonthlyLoading(true);
    setPracticeMonthlyError(null);
    try {
      const year = new Date().getFullYear();
      const monthly = await getPlatformAdminPracticeMonthlyStats(year, { refresh: opts?.refresh });
      setPracticeMonthly(monthly.months);
      setPracticeMonthlyYear(monthly.year);
      setPracticeGeneratedAt((prev) => monthly.generated_at || prev);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setPracticeMonthlyError(
        err?.response?.data?.error || err?.message || 'Failed to load month-wise practice stats'
      );
      setPracticeMonthly([]);
    } finally {
      setPracticeMonthlyLoading(false);
    }
  }, []);

  const loadPractice = useCallback(async (opts?: { refresh?: boolean }) => {
    setPracticeLoading(true);
    setPracticeError(null);
    setPracticeIndexesBuilding(false);
    void loadPracticeMonthly(opts);
    try {
      const [daily, dailyByExam, summariesInitial] = await Promise.all([
        getPlatformAdminPracticeDailyStats(30, { refresh: opts?.refresh }),
        getPlatformAdminPracticeDailyStatsByExam(30, { refresh: opts?.refresh }),
        getPlatformAdminPracticeExamSummaries({ refresh: opts?.refresh }),
      ]);
      setPracticeDaily(daily.days);
      setPracticeDailyToday(daily.today);
      setPracticeDailyByExam(dailyByExam.days);
      setPracticeDailyExamIds(dailyByExam.exam_ids);
      let summaries = summariesInitial;
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
      setPracticeGeneratedAt(daily.generated_at || summaries.generated_at);
      setPracticeIndexesBuilding(summaries.indexes_building === true);
      setSelectedExamId((prev) => prev || summaries.exams[0]?.exam_id || '');
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
  }, [loadPracticeMonthly]);

  const loadPracticeDetail = useCallback(async (examId: string, opts?: { refresh?: boolean }) => {
    if (!examId) return;
    const req = ++practiceDetailReqRef.current;
    setPracticeDetailLoading(true);
    setByGrade([]);
    setTopStudents([]);
    try {
      const detail = await getPlatformAdminPracticeExamDetail(examId, {
        limit: 10,
        sortBy,
        refresh: opts?.refresh,
      });
      if (req !== practiceDetailReqRef.current) return;
      setByGrade(detail.by_grade);
      setTopStudents(detail.top_students);
      setPracticeGeneratedAt((prev) => detail.generated_at || prev);
      if (detail.indexes_building) setPracticeIndexesBuilding(true);
    } catch (e: unknown) {
      if (req !== practiceDetailReqRef.current) return;
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      const msg = err?.response?.data?.error || err?.message || 'Failed to load practice exam detail';
      const lower = msg.toLowerCase();
      if (lower.includes('index') || lower.includes('failed_precondition')) {
        setPracticeError(
          'Firestore indexes for practice analytics are still building. Check the Firebase console Indexes tab - usually a few minutes. Refresh after they show Enabled.'
        );
      } else {
        setPracticeError(msg);
      }
      setByGrade([]);
      setTopStudents([]);
    } finally {
      if (req === practiceDetailReqRef.current) setPracticeDetailLoading(false);
    }
  }, [sortBy]);

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
    if (tab === 'official') void loadOfficialOverview();
    if (tab === 'practice') void loadPractice();
    if (tab === 'qod') void loadQod();
    if (tab === 'activity') void loadActivity();
  }, [tab, loadOfficialOverview, loadPractice, loadQod, loadActivity]);

  useEffect(() => {
    if (tab !== 'official' || !selectedOfficialExamId) return;
    void loadOfficialDetail(selectedOfficialExamId);
  }, [tab, selectedOfficialExamId, loadOfficialDetail]);

  useEffect(() => {
    if (tab !== 'official' || !selectedOfficialExamId) return;
    void loadOfficialDrilldown(selectedOfficialExamId, officialDrillLevel);
  }, [tab, selectedOfficialExamId, officialDrillLevel, loadOfficialDrilldown]);

  useEffect(() => {
    if (tab !== 'practice' || !selectedExamId) return;
    void loadPracticeDetail(selectedExamId);
  }, [tab, selectedExamId, loadPracticeDetail]);

  const anyLoading =
    officialLoading ||
    officialDetailLoading ||
    officialDrillLoading ||
    officialCompletionsLoading ||
    practiceLoading ||
    practiceMonthlyLoading ||
    practiceDetailLoading ||
    qodLoading ||
    activityLoading;

  const handleForceRefresh = () => {
    if (tab === 'official') {
      void loadOfficialOverview({ refresh: true });
      if (selectedOfficialExamId) {
        void loadOfficialDetail(selectedOfficialExamId, { refresh: true });
        void loadOfficialDrilldown(selectedOfficialExamId, officialDrillLevel, { refresh: true });
        if (officialQuestionSelection) {
          void loadOfficialQuestionStats(
            selectedOfficialExamId,
            officialQuestionSelection,
            officialDrillLevel,
            { refresh: true }
          );
        }
      }
    }
    if (tab === 'practice') {
      void loadPractice({ refresh: true });
      if (selectedExamId) void loadPracticeDetail(selectedExamId, { refresh: true });
    }
    if (tab === 'qod') void loadQod({ refresh: true });
    if (tab === 'activity') void loadActivity({ refresh: true });
  };

  const selectedSummary = useMemo(
    () => practiceSummaries.find((e) => e.exam_id === selectedExamId) ?? null,
    [practiceSummaries, selectedExamId]
  );

  const selectedOfficialSummary = useMemo(
    () => officialSummaries.find((e) => e.exam_id === selectedOfficialExamId) ?? null,
    [officialSummaries, selectedOfficialExamId]
  );

  const officialDailyChartData = useMemo(
    () =>
      officialDaily.map((d) => {
        const row: Record<string, string | number> = {
          date: d.date.slice(5),
          completed: d.total_completed,
        };
        for (const examId of officialDailyExamIds) {
          row[examId] = d.by_exam[examId]?.completed ?? 0;
        }
        return row;
      }),
    [officialDaily, officialDailyExamIds]
  );

  const officialTotals = useMemo(() => {
    const completed = officialSummaries.reduce((s, e) => s + e.completed_attempts, 0);
    const students = officialSummaries.reduce((s, e) => s + e.unique_students, 0);
    const passed = officialSummaries.reduce((s, e) => s + e.passed_attempts, 0);
    const weighted = officialSummaries.reduce(
      (s, e) => s + e.avg_score_pct * e.completed_attempts,
      0
    );
    return {
      completed,
      students,
      avgScore: completed > 0 ? Math.round((10 * weighted) / completed) / 10 : 0,
      passRate: completed > 0 ? Math.round((1000 * passed) / completed) / 10 : 0,
    };
  }, [officialSummaries]);

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

  const practiceDailyChartData = useMemo(
    () =>
      practiceDaily.map((d) => ({
        date: d.date.slice(5),
        sessions: d.total_sessions,
        questions: d.total_questions,
        correct: d.total_correct,
      })),
    [practiceDaily]
  );

  const practiceMonthlyChartData = useMemo(
    () =>
      practiceMonthly.map((m) => ({
        month: m.label,
        sessions: m.total_sessions,
        questions: m.total_questions,
        correct: m.total_correct,
      })),
    [practiceMonthly]
  );

  const examLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const exam of practiceSummaries) map.set(exam.exam_id, exam.label);
    return map;
  }, [practiceSummaries]);

  const practiceDailyByExamChartData = useMemo(
    () =>
      practiceDailyByExam.map((d) => {
        const row: Record<string, string | number> = { date: d.date.slice(5) };
        for (const examId of practiceDailyExamIds) {
          row[examId] = d.by_exam[examId]?.sessions ?? 0;
        }
        return row;
      }),
    [practiceDailyByExam, practiceDailyExamIds]
  );

  const EXAM_SERIES_COLORS = ['#2563eb', '#059669', '#7c3aed', '#b45309', '#dc2626', '#0891b2'];

  const practiceDailyTotals = useMemo(() => {
    const sessions = practiceDaily.reduce((s, d) => s + d.total_sessions, 0);
    const questions = practiceDaily.reduce((s, d) => s + d.total_questions, 0);
    const correct = practiceDaily.reduce((s, d) => s + d.total_correct, 0);
    return {
      sessions,
      questions,
      correct,
      accuracy: questions > 0 ? Math.round((1000 * correct) / questions) / 10 : 0,
    };
  }, [practiceDaily]);

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
    <Box
      sx={{
        ...platformAdminPageContainerSx,
        maxWidth: 1280,
        bgcolor: '#F1F5F9',
        borderRadius: { md: 3 },
        border: { md: `1px solid ${ip.cardBorder}` },
      }}
    >
      <PlatformAdminPageHeader
        title="Analytics"
        subtitle="Platform usage for official exams, practice, Question of the Day, and admin activity. Data is Redis-cached and not realtime."
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
        variant="scrollable"
        scrollButtons="auto"
        sx={analyticsTabRailSx}
      >
        <Tab value="official" label="Official Exams" />
        <Tab value="practice" label="Practice Exams" />
        <Tab value="qod" label="Question of the Day" />
        <Tab value="activity" label="Activity" />
      </Tabs>

      {tab === 'official' && (
        <>
          {officialError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {officialError}
            </Alert>
          )}
          {officialIndexesBuilding && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Some Firestore indexes may still be building. Numbers can look incomplete until they finish.
            </Alert>
          )}
          {officialLoading && officialSummaries.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: ip.navy }} />
            </Box>
          ) : (
            <>
              <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1.5 }}>
                {staleHint(officialGeneratedAt)} · scores shown as % and points / 1000 · test accounts excluded
              </Typography>

              <PlatformAdminAnalyticsSection
                step={1}
                title="Overview"
                subtitle="Platform-wide official exam totals and daily completion trends (IST)."
                accent="navy"
              >
                <Box sx={{ ...platformAdminStatsGridSx, mb: 2.5 }}>
                  <PlatformAdminStatCard
                    title="Total completions"
                    value={officialTotals.completed.toLocaleString()}
                    icon={<CorrectIcon sx={{ color: '#059669' }} />}
                    accent="#059669"
                  />
                  <PlatformAdminStatCard
                    title="Students"
                    value={officialTotals.students.toLocaleString()}
                    icon={<PeopleIcon sx={{ color: '#0f766e' }} />}
                    accent="#0f766e"
                  />
                  <PlatformAdminStatCard
                    title="Avg score"
                    value={`${officialTotals.avgScore}%`}
                    icon={<TimelineIcon sx={{ color: '#b45309' }} />}
                    accent="#b45309"
                  />
                  <PlatformAdminStatCard
                    title="Pass rate"
                    value={`${officialTotals.passRate}%`}
                    icon={<QuizIcon sx={{ color: '#0d47a1' }} />}
                    accent="#0d47a1"
                  />
                </Box>
                <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.75 }}>
                  Completions by exam (last 30 days)
                </Typography>
                <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1.5 }}>
                  Daily totals use IST calendar dates from completed attempts. Test accounts excluded.
                </Typography>
                <Box sx={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart data={officialDailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" interval={1} tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {officialDailyExamIds.map((examId, idx) => (
                        <Line
                          key={examId}
                          type="monotone"
                          dataKey={examId}
                          name={shortOfficialExamLabel(
                            officialSummaries.find((e) => e.exam_id === examId)?.label ?? examId
                          )}
                          stroke={EXAM_SERIES_COLORS[idx % EXAM_SERIES_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </PlatformAdminAnalyticsSection>

              <Tabs
                value={selectedOfficialExamId || false}
                onChange={(_e, value: string) => {
                  setSelectedOfficialExamId(value);
                  setOfficialDrillLevel('all');
                  setOfficialRecent([]);
                  setOfficialRecentMatched(0);
                  setOfficialRecentSearched(false);
                  setCompletionQ('');
                  setCompletionFrom('');
                  setCompletionTo('');
                  setCompletionLevel('all');
                  setCompletionLimit(25);
                }}
                variant="scrollable"
                scrollButtons="auto"
                sx={examPickerTabsSx}
              >
                {officialSummaries.map((exam) => (
                  <Tab
                    key={exam.exam_id}
                    value={exam.exam_id}
                    label={shortOfficialExamLabel(exam.label)}
                  />
                ))}
              </Tabs>

              <PlatformAdminAnalyticsSection
                step={2}
                title={
                  selectedOfficialSummary
                    ? `${shortOfficialExamLabel(selectedOfficialSummary.label)} · snapshot`
                    : 'Exam snapshot'
                }
                subtitle="Completions, students, score, and pass rate for the selected exam, then breakdown by level."
                accent="slate"
              >
                {selectedOfficialSummary ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                      gap: 1.25,
                      mb: 2.25,
                    }}
                  >
                    {[
                      {
                        label: 'Completions',
                        value: selectedOfficialSummary.completed_attempts.toLocaleString(),
                      },
                      {
                        label: 'Students',
                        value: selectedOfficialSummary.unique_students.toLocaleString(),
                      },
                      {
                        label: 'Avg score',
                        value: `${selectedOfficialSummary.avg_score_pct}% (${selectedOfficialSummary.avg_score_points}/1000)`,
                      },
                      {
                        label: 'Pass rate',
                        value: `${selectedOfficialSummary.pass_rate_pct}%`,
                      },
                    ].map((cell) => (
                      <Box
                        key={cell.label}
                        sx={{
                          bgcolor: ip.cardMutedBg,
                          border: `1px solid ${ip.cardBorder}`,
                          borderRadius: 1.5,
                          px: 1.5,
                          py: 1.25,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: ip.subtext, fontWeight: 600 }}>
                          {cell.label}
                        </Typography>
                        <Typography sx={{ fontWeight: 800, color: ip.heading, mt: 0.25 }}>
                          {cell.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : null}

                {officialDetailLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={32} sx={{ color: ip.navy }} />
                  </Box>
                ) : (
                  <>
                    <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>
                      By level
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                      <Table size="small" sx={platformAdminTableSx}>
                        <TableHead>
                          <TableRow sx={platformAdminTableHeadRowSx}>
                            <TableCell>Level</TableCell>
                            <TableCell align="right">Completions</TableCell>
                            <TableCell align="right">Students</TableCell>
                            <TableCell align="right">Avg %</TableCell>
                            <TableCell align="right">Avg /1000</TableCell>
                            <TableCell align="right">Passed</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {officialByLevel.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 2, color: ip.subtext }}>
                                No completed attempts yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            officialByLevel.map((row) => (
                              <TableRow key={row.level}>
                                <TableCell sx={{ fontWeight: 700 }}>{row.level}</TableCell>
                                <TableCell align="right">{row.completed_attempts}</TableCell>
                                <TableCell align="right">{row.unique_students}</TableCell>
                                <TableCell align="right">
                                  <PlatformAdminAccuracyChip pct={row.avg_score_pct} />
                                </TableCell>
                                <TableCell align="right">{row.avg_score_points}</TableCell>
                                <TableCell align="right">{row.passed_attempts}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </PlatformAdminAnalyticsSection>

              <PlatformAdminAnalyticsSection
                step={3}
                title="Constructs & items"
                subtitle={
                  <>
                    Family/construct, subconstruct, and mechanic rollups from completed attempts
                    {officialDrilldown
                      ? ` · ${officialDrilldown.attempts_analyzed.toLocaleString()} analyzed`
                      : ''}
                    . Click a family row to open per-question stats.
                  </>
                }
                accent="teal"
                action={
                  <FormControl size="small" sx={platformAdminFilterSelectSx(140)}>
                    <InputLabel id="official-drill-level">Level</InputLabel>
                    <Select
                      labelId="official-drill-level"
                      label="Level"
                      value={officialDrillLevel}
                      onChange={(e) => {
                        const v = e.target.value;
                        setOfficialDrillLevel(v === 'all' ? 'all' : Number(v));
                      }}
                      MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                    >
                      <MenuItem value="all">All levels</MenuItem>
                      {(officialByLevel.length > 0
                        ? officialByLevel.map((r) => r.level)
                        : [1, 2, 3]
                      ).map((level) => (
                        <MenuItem key={level} value={level}>
                          Level {level}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                }
              >
                  {officialDrilldown?.notes?.map((note) => (
                    <Alert key={note} severity="info" sx={{ mb: 1.5 }}>
                      {note}
                    </Alert>
                  ))}

                  {officialDrillLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress size={32} sx={{ color: ip.navy }} />
                    </Box>
                  ) : !officialDrilldown ? (
                    <Typography variant="body2" sx={{ color: ip.subtext, py: 2 }}>
                      No deep-dive data yet for this exam.
                    </Typography>
                  ) : (
                    <>
                      <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>
                        Score distribution (/1000)
                      </Typography>
                      <Box sx={{ width: '100%', height: 220, mb: 2.5 }}>
                        <ResponsiveContainer>
                          <BarChart data={officialDrilldown.score_distribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" name="Completions" fill="#2563eb" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>

                      <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
                        By family / construct
                      </Typography>
                      <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1 }}>
                        Click a family to see per-question saw / correct / avg time. Avg served = mean
                        items of that family per completion. Symbolic only when construct_scores were
                        stored.
                      </Typography>
                      <TableContainer
                        component={Paper}
                        elevation={0}
                        sx={{
                          ...platformAdminTablePaperSx,
                          mb: officialQuestionSelection?.tagType === 'family' ? 1 : 2.5,
                        }}
                      >
                        <Table size="small" sx={platformAdminTableSx}>
                          <TableHead>
                            <TableRow sx={platformAdminTableHeadRowSx}>
                              <TableCell>Family</TableCell>
                              <TableCell align="right">Attempts</TableCell>
                              <TableCell align="right">Avg served</TableCell>
                              <TableCell align="right">Accuracy</TableCell>
                              <TableCell align="right">Avg construct /250</TableCell>
                              <TableCell align="right">Floor met %</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {officialDrilldown.by_family.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 2, color: ip.subtext }}>
                                  No family/construct maps on these completions.
                                </TableCell>
                              </TableRow>
                            ) : (
                              officialDrilldown.by_family.map((row) => {
                                const selected =
                                  officialQuestionSelection?.tagType === 'family' &&
                                  officialQuestionSelection.tag === row.key;
                                return (
                                  <TableRow
                                    key={row.key}
                                    hover
                                    onClick={() => {
                                      if (!selectedOfficialExamId) return;
                                      if (selected) {
                                        clearOfficialQuestionDrill();
                                        return;
                                      }
                                      void loadOfficialQuestionStats(
                                        selectedOfficialExamId,
                                        {
                                          tagType: 'family',
                                          tag: row.key,
                                          label: row.label,
                                        },
                                        officialDrillLevel
                                      );
                                    }}
                                    sx={selected ? selectedTagRowSx : { cursor: 'pointer' }}
                                  >
                                    <TableCell
                                      sx={{
                                        fontWeight: 700,
                                        color: ip.navy,
                                        textDecoration: selected ? 'none' : 'underline',
                                        textUnderlineOffset: 2,
                                      }}
                                    >
                                      {row.label}
                                      {selected ? ' · open' : ''}
                                    </TableCell>
                                    <TableCell align="right">{row.attempts_with_data}</TableCell>
                                    <TableCell align="right">{row.avg_served}</TableCell>
                                    <TableCell align="right">
                                      <PlatformAdminAccuracyChip pct={row.accuracy_pct} />
                                    </TableCell>
                                    <TableCell align="right">
                                      {row.avg_construct_score != null ? row.avg_construct_score : '—'}
                                    </TableCell>
                                    <TableCell align="right">
                                      {row.floor_met_rate_pct != null
                                        ? `${row.floor_met_rate_pct}%`
                                        : '—'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {renderOfficialQuestionDrillPanel('family')}

                      <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5, mt: 0.5 }}>
                        By subconstruct
                      </Typography>
                      <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1 }}>
                        Report skill labels (not the same as mechanic). Symbolic section-mode stores
                        these on the family row instead, so this table is often empty for Symbolic.
                      </Typography>
                      <TableContainer
                        component={Paper}
                        elevation={0}
                        sx={{
                          ...platformAdminTablePaperSx,
                          mb: officialQuestionSelection?.tagType === 'subconstruct' ? 1 : 2.5,
                        }}
                      >
                        <Table size="small" sx={platformAdminTableSx}>
                          <TableHead>
                            <TableRow sx={platformAdminTableHeadRowSx}>
                              <TableCell>Subconstruct</TableCell>
                              <TableCell align="right">Attempts</TableCell>
                              <TableCell align="right">Avg served</TableCell>
                              <TableCell align="right">Accuracy</TableCell>
                              <TableCell align="right">Total served</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {officialDrilldown.by_subconstruct.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 2, color: ip.subtext }}>
                                  No subconstruct scores on these completions.
                                </TableCell>
                              </TableRow>
                            ) : (
                              officialDrilldown.by_subconstruct.map((row) => {
                                const selected =
                                  officialQuestionSelection?.tagType === 'subconstruct' &&
                                  officialQuestionSelection.tag === row.key;
                                return (
                                  <TableRow
                                    key={row.key}
                                    hover
                                    onClick={() => {
                                      if (!selectedOfficialExamId) return;
                                      if (selected) {
                                        clearOfficialQuestionDrill();
                                        return;
                                      }
                                      void loadOfficialQuestionStats(
                                        selectedOfficialExamId,
                                        {
                                          tagType: 'subconstruct',
                                          tag: row.key,
                                          label: row.label,
                                        },
                                        officialDrillLevel
                                      );
                                    }}
                                    sx={selected ? selectedTagRowSx : { cursor: 'pointer' }}
                                  >
                                    <TableCell
                                      sx={{
                                        fontWeight: 700,
                                        color: ip.navy,
                                        textDecoration: selected ? 'none' : 'underline',
                                        textUnderlineOffset: 2,
                                      }}
                                    >
                                      {row.label}
                                      {selected ? ' · open' : ''}
                                    </TableCell>
                                    <TableCell align="right">{row.attempts_with_data}</TableCell>
                                    <TableCell align="right">{row.avg_served}</TableCell>
                                    <TableCell align="right">
                                      <PlatformAdminAccuracyChip pct={row.accuracy_pct} />
                                    </TableCell>
                                    <TableCell align="right">{row.served_sum}</TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {renderOfficialQuestionDrillPanel('subconstruct')}

                      <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5, mt: 0.5 }}>
                        By mechanic
                      </Typography>
                      <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1 }}>
                        Finer item tags from the bank (e.g. Mapping Preserve). Click for per-question
                        stats. Not the same as subconstruct.
                      </Typography>
                      <TableContainer
                        component={Paper}
                        elevation={0}
                        sx={{
                          ...platformAdminTablePaperSx,
                          mb: officialQuestionSelection?.tagType === 'mechanic' ? 1 : 0,
                        }}
                      >
                        <Table size="small" sx={platformAdminTableSx}>
                          <TableHead>
                            <TableRow sx={platformAdminTableHeadRowSx}>
                              <TableCell>Mechanic</TableCell>
                              <TableCell align="right">Attempts</TableCell>
                              <TableCell align="right">Avg served</TableCell>
                              <TableCell align="right">Accuracy</TableCell>
                              <TableCell align="right">Total served</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {officialDrilldown.by_mechanic.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 2, color: ip.subtext }}>
                                  No mechanic feedback on these completions (Symbolic section-mode).
                                </TableCell>
                              </TableRow>
                            ) : (
                              officialDrilldown.by_mechanic.map((row) => {
                                const selected =
                                  officialQuestionSelection?.tagType === 'mechanic' &&
                                  officialQuestionSelection.tag === row.key;
                                return (
                                  <TableRow
                                    key={row.key}
                                    hover
                                    onClick={() => {
                                      if (!selectedOfficialExamId) return;
                                      if (selected) {
                                        clearOfficialQuestionDrill();
                                        return;
                                      }
                                      void loadOfficialQuestionStats(
                                        selectedOfficialExamId,
                                        {
                                          tagType: 'mechanic',
                                          tag: row.key,
                                          label: row.label,
                                        },
                                        officialDrillLevel
                                      );
                                    }}
                                    sx={selected ? selectedTagRowSx : { cursor: 'pointer' }}
                                  >
                                    <TableCell
                                      sx={{
                                        fontWeight: 700,
                                        color: ip.navy,
                                        textDecoration: selected ? 'none' : 'underline',
                                        textUnderlineOffset: 2,
                                      }}
                                    >
                                      {row.label}
                                      {selected ? ' · open' : ''}
                                    </TableCell>
                                    <TableCell align="right">{row.attempts_with_data}</TableCell>
                                    <TableCell align="right">{row.avg_served}</TableCell>
                                    <TableCell align="right">
                                      <PlatformAdminAccuracyChip pct={row.accuracy_pct} />
                                    </TableCell>
                                    <TableCell align="right">{row.served_sum}</TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {renderOfficialQuestionDrillPanel('mechanic')}
                    </>
                  )}
              </PlatformAdminAnalyticsSection>

              <PlatformAdminAnalyticsSection
                step={4}
                title="Grade & school"
                subtitle="From completed attempts (grade at attempt when available; otherwise student grade)."
                accent="amber"
              >
                  {officialDetailLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={28} sx={{ color: ip.navy }} />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>By grade</Typography>
                        <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                          <Table size="small" sx={platformAdminTableSx}>
                            <TableHead>
                              <TableRow sx={platformAdminTableHeadRowSx}>
                                <TableCell>Grade</TableCell>
                                <TableCell align="right">Completions</TableCell>
                                <TableCell align="right">Students</TableCell>
                                <TableCell align="right">Avg %</TableCell>
                                <TableCell align="right">Pass %</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {officialByGrade.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} align="center" sx={{ py: 2, color: ip.subtext }}>
                                    No grade data yet.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                officialByGrade.map((row) => (
                                  <TableRow key={row.grade == null ? 'unknown' : row.grade}>
                                    <TableCell sx={{ fontWeight: 700 }}>
                                      {row.grade == null ? 'Unknown' : `G${row.grade}`}
                                    </TableCell>
                                    <TableCell align="right">{row.completed_attempts}</TableCell>
                                    <TableCell align="right">{row.unique_students}</TableCell>
                                    <TableCell align="right">
                                      <PlatformAdminAccuracyChip pct={row.avg_score_pct} />
                                    </TableCell>
                                    <TableCell align="right">
                                      <PlatformAdminAccuracyChip pct={row.pass_rate_pct} />
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>By school</Typography>
                        <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                          <Table size="small" sx={platformAdminTableSx}>
                            <TableHead>
                              <TableRow sx={platformAdminTableHeadRowSx}>
                                <TableCell>School</TableCell>
                                <TableCell align="right">Completions</TableCell>
                                <TableCell align="right">Students</TableCell>
                                <TableCell align="right">Avg %</TableCell>
                                <TableCell align="right">Pass %</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {officialBySchool.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} align="center" sx={{ py: 2, color: ip.subtext }}>
                                    No school data yet.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                officialBySchool.map((row) => (
                                  <TableRow key={row.school_id ?? row.school_name}>
                                    <TableCell sx={{ fontWeight: 600 }}>{row.school_name}</TableCell>
                                    <TableCell align="right">{row.completed_attempts}</TableCell>
                                    <TableCell align="right">{row.unique_students}</TableCell>
                                    <TableCell align="right">
                                      <PlatformAdminAccuracyChip pct={row.avg_score_pct} />
                                    </TableCell>
                                    <TableCell align="right">
                                      <PlatformAdminAccuracyChip pct={row.pass_rate_pct} />
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Box>
                  )}
              </PlatformAdminAnalyticsSection>

              <PlatformAdminAnalyticsSection
                step={5}
                title="Search completions"
                subtitle="On-demand only — not loaded until you search. Filter by student, date range, level, and limit."
                accent="violet"
              >
                  <Box sx={{ ...platformAdminFilterToolbarRowSx, mb: 2 }}>
                    <TextField
                      size="small"
                      label="Student"
                      placeholder="Name, email, or uid"
                      value={completionQ}
                      onChange={(e) => setCompletionQ(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedOfficialExamId) {
                          void searchOfficialCompletions(selectedOfficialExamId);
                        }
                      }}
                      sx={{
                        ...platformAdminTextFieldSx,
                        minWidth: { xs: '100%', sm: 220 },
                        flex: '1 1 220px',
                        '& .MuiInputLabel-root': { color: ip.subtext },
                        '& .MuiInputLabel-root.Mui-focused': { color: ip.navy },
                      }}
                    />
                    <TextField
                      size="small"
                      label="From"
                      type="date"
                      value={completionFrom}
                      onChange={(e) => setCompletionFrom(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        ...platformAdminTextFieldSx,
                        minWidth: 150,
                        flex: '0 1 150px',
                        '& .MuiInputLabel-root': { color: ip.subtext },
                        '& .MuiInputLabel-root.Mui-focused': { color: ip.navy },
                        '& .MuiInputBase-input': {
                          color: `${ip.heading} !important`,
                          WebkitTextFillColor: ip.heading,
                        },
                      }}
                    />
                    <TextField
                      size="small"
                      label="To"
                      type="date"
                      value={completionTo}
                      onChange={(e) => setCompletionTo(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        ...platformAdminTextFieldSx,
                        minWidth: 150,
                        flex: '0 1 150px',
                        '& .MuiInputLabel-root': { color: ip.subtext },
                        '& .MuiInputLabel-root.Mui-focused': { color: ip.navy },
                        '& .MuiInputBase-input': {
                          color: `${ip.heading} !important`,
                          WebkitTextFillColor: ip.heading,
                        },
                      }}
                    />
                    <FormControl size="small" sx={platformAdminFilterSelectSx(120)}>
                      <InputLabel id="completion-level" sx={{ color: ip.subtext }}>
                        Level
                      </InputLabel>
                      <Select
                        labelId="completion-level"
                        label="Level"
                        value={completionLevel}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCompletionLevel(v === 'all' ? 'all' : Number(v));
                        }}
                        MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                      >
                        <MenuItem value="all">All levels</MenuItem>
                        {(officialByLevel.length > 0
                          ? officialByLevel.map((r) => r.level)
                          : [1, 2, 3]
                        ).map((level) => (
                          <MenuItem key={level} value={level}>
                            Level {level}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={platformAdminFilterSelectSx(100)}>
                      <InputLabel id="completion-limit" sx={{ color: ip.subtext }}>
                        Limit
                      </InputLabel>
                      <Select
                        labelId="completion-limit"
                        label="Limit"
                        value={completionLimit}
                        onChange={(e) => setCompletionLimit(Number(e.target.value))}
                        MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                      >
                        {[10, 25, 50, 100].map((n) => (
                          <MenuItem key={n} value={n}>
                            {n}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      disabled={!selectedOfficialExamId || officialCompletionsLoading}
                      onClick={() => {
                        if (selectedOfficialExamId) void searchOfficialCompletions(selectedOfficialExamId);
                      }}
                      sx={platformAdminOutlinedButtonSx}
                    >
                      {officialCompletionsLoading ? 'Searching…' : 'Search'}
                    </Button>
                  </Box>

                  {!officialRecentSearched ? (
                    <Typography variant="body2" sx={{ color: ip.subtext, py: 2 }}>
                      Set filters and click Search to load completions.
                    </Typography>
                  ) : officialCompletionsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={28} sx={{ color: ip.navy }} />
                    </Box>
                  ) : (
                    <>
                      <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1 }}>
                        Showing {officialRecent.length.toLocaleString()} of{' '}
                        {officialRecentMatched.toLocaleString()} matched
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                        <Table size="small" sx={platformAdminTableSx}>
                          <TableHead>
                            <TableRow sx={platformAdminTableHeadRowSx}>
                              <TableCell>When</TableCell>
                              <TableCell>Student</TableCell>
                              <TableCell>School</TableCell>
                              <TableCell align="right">Level</TableCell>
                              <TableCell align="right">Score</TableCell>
                              <TableCell align="right">Passed</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {officialRecent.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: ip.subtext }}>
                                  No completions matched these filters.
                                </TableCell>
                              </TableRow>
                            ) : (
                              officialRecent.map((row) => (
                                <TableRow key={row.attempt_id}>
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {formatDateTime(row.completed_at)}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    {[row.first_name, row.last_name].filter(Boolean).join(' ') ||
                                      row.email}
                                    <Typography
                                      variant="caption"
                                      sx={{ display: 'block', color: ip.subtext }}
                                    >
                                      {row.email}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>{row.school_name ?? '—'}</TableCell>
                                  <TableCell align="right">{row.proficiency_tier ?? '—'}</TableCell>
                                  <TableCell align="right">
                                    <Box
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        justifyContent: 'flex-end',
                                      }}
                                    >
                                      <PlatformAdminAccuracyChip pct={row.score_pct} />
                                      <Typography
                                        component="span"
                                        variant="caption"
                                        sx={{ color: ip.subtext, whiteSpace: 'nowrap' }}
                                      >
                                        ({row.score_points})
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right">
                                    <PlatformAdminChip
                                      label={row.passed ? 'Passed' : 'Not passed'}
                                      tone={row.passed ? 'success' : 'neutral'}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
              </PlatformAdminAnalyticsSection>
            </>
          )}
        </>
      )}

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

          {practiceLoading && practiceSummaries.length === 0 && practiceDaily.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: ip.navy }} />
            </Box>
          ) : practiceSummaries.length === 0 && practiceDaily.length === 0 ? (
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

              <PlatformAdminAnalyticsSection
                step={1}
                title="Overview"
                subtitle="Platform-wide daily counters (test/staff excluded). Historical days are reconstructed from practice attempt timestamps."
                accent="navy"
              >
                <Box sx={{ ...platformAdminStatsGridSx, mb: 2.5 }}>
                  <PlatformAdminStatCard
                    title="Sessions today"
                    value={(practiceDailyToday?.total_sessions ?? 0).toLocaleString()}
                    icon={<QuizIcon sx={{ color: '#2563eb' }} />}
                    accent="#2563eb"
                  />
                  <PlatformAdminStatCard
                    title="Questions today"
                    value={(practiceDailyToday?.total_questions ?? 0).toLocaleString()}
                    icon={<CorrectIcon sx={{ color: '#059669' }} />}
                    accent="#059669"
                  />
                  <PlatformAdminStatCard
                    title="30-day sessions"
                    value={practiceDailyTotals.sessions.toLocaleString()}
                    icon={<PeopleIcon sx={{ color: '#7c3aed' }} />}
                    accent="#7c3aed"
                  />
                  <PlatformAdminStatCard
                    title="30-day accuracy"
                    value={`${practiceDailyTotals.accuracy}%`}
                    icon={<TimelineIcon sx={{ color: '#b45309' }} />}
                    accent="#b45309"
                  />
                </Box>
                <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 1.5 }}>
                  Practice volume · last 30 days (IST)
                </Typography>
                <Box sx={{ width: '100%', height: 280, mb: 3 }}>
                  <ResponsiveContainer>
                    <LineChart data={practiceDailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" interval={1} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        name="Sessions"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="questions"
                        name="Questions"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="correct"
                        name="Correct"
                        stroke="#059669"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>

                <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
                  Month-wise activity · {practiceMonthlyYear}
                </Typography>
                <Typography variant="body2" sx={{ color: ip.subtext, mb: 1.5 }}>
                  Same daily counters rolled up by calendar month (IST).
                </Typography>
                {practiceMonthlyError && (
                  <Alert severity="warning" sx={{ mb: 1.5 }}>
                    {practiceMonthlyError}
                  </Alert>
                )}
                {practiceMonthlyLoading && practiceMonthly.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={28} sx={{ color: ip.navy }} />
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={practiceMonthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sessions" name="Sessions" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="questions" name="Questions" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="correct" name="Correct" fill="#059669" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </PlatformAdminAnalyticsSection>

              <PlatformAdminAnalyticsSection
                step={2}
                title="Sessions by exam"
                subtitle="Same daily counters, split by exam type. Days before an exam had activity stay at zero."
                accent="teal"
              >
                <Box sx={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart data={practiceDailyByExamChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" interval={1} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {practiceDailyExamIds.map((examId, idx) => (
                        <Line
                          key={examId}
                          type="monotone"
                          dataKey={examId}
                          name={examLabelById.get(examId) ?? examId}
                          stroke={EXAM_SERIES_COLORS[idx % EXAM_SERIES_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </PlatformAdminAnalyticsSection>

              <PlatformAdminAnalyticsSection
                step={3}
                title="Exam detail"
                subtitle="Pick an exam to inspect grade breakdowns and top students."
                accent="amber"
              >
                <Box
                  sx={{
                    ...platformAdminStatsGridSx,
                    gridTemplateColumns: {
                      xs: '1fr 1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: `repeat(${Math.max(practiceSummaries.length, 1)}, 1fr)`,
                    },
                    mb: 2.5,
                  }}
                >
                  {practiceSummaries.map((exam) => (
                    <Card
                      key={exam.exam_id}
                      sx={{
                        ...platformAdminCardSx,
                        cursor: 'pointer',
                        outline: selectedExamId === exam.exam_id ? `2px solid ${ip.navy}` : 'none',
                        bgcolor: selectedExamId === exam.exam_id ? 'rgba(16, 64, 139, 0.04)' : '#fff',
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
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <PlatformAdminAccuracyChip pct={exam.accuracy_pct} />
                          <Typography variant="caption" sx={{ color: ip.subtext }}>
                            {exam.active_students_30d} active (30d)
                          </Typography>
                        </Box>
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
                  <Box
                    sx={{
                      border: `1px solid ${ip.cardBorder}`,
                      borderRadius: 2,
                      p: 2,
                      bgcolor: '#f8fafc',
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
                      Accuracy by grade
                    </Typography>
                    {practiceDetailLoading ? (
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
                  </Box>

                  <Box
                    sx={{
                      border: `1px solid ${ip.cardBorder}`,
                      borderRadius: 2,
                      p: 2,
                      bgcolor: '#f8fafc',
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
                      Volume by grade
                    </Typography>
                    {practiceDetailLoading ? (
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
                  </Box>
                </Box>

                <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 1.5 }}>
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
                      {practiceDetailLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <CircularProgress size={28} sx={{ color: ip.navy }} />
                          </TableCell>
                        </TableRow>
                      ) : topStudents.length === 0 ? (
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
                            <TableCell align="right">
                              <PlatformAdminAccuracyChip pct={row.accuracy_pct} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </PlatformAdminAnalyticsSection>
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
              <PlatformAdminAnalyticsSection
                step={1}
                title="Overview"
                subtitle="Daily Question of the Day volume and accuracy (IST)."
                accent="navy"
              >
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
              </PlatformAdminAnalyticsSection>

              <PlatformAdminAnalyticsSection
                step={2}
                title="Top students"
                subtitle="Lifetime attempts per student (tracked from when totals were introduced). Test/staff accounts excluded."
                accent="teal"
              >
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
                            <TableCell align="right">
                              <PlatformAdminAccuracyChip pct={row.qod_accuracy_pct} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </PlatformAdminAnalyticsSection>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <PlatformAdminAnalyticsSection
                step={1}
                title="Top Argus Coins"
                subtitle="Highest coin balances across students."
                accent="amber"
              >
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
              </PlatformAdminAnalyticsSection>

              <PlatformAdminAnalyticsSection
                step={2}
                title="School admin sign-ins"
                subtitle="Firebase Auth last sign-in. Also shown on each school detail page."
                accent="slate"
              >
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
              </PlatformAdminAnalyticsSection>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default PlatformAdminAnalyticsPage;
