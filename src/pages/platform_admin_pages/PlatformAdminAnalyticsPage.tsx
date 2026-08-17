import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Sentry from '@sentry/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
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
import { useNavigate, useParams } from 'react-router-dom';
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
  getPlatformAdminOfficialExamAbandons,
  getPlatformAdminOfficialExamSummaries,
  searchPlatformAdminOfficialExamCompletions,
  getPlatformAdminOfficialExamAttemptDetail,
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
  type OfficialExamAbandons,
  type OfficialExamGradeRow,
  type OfficialExamLevelRow,
  type OfficialExamRecentRow,
  type OfficialExamSchoolRow,
  type OfficialExamSummaryRow,
  type OfficialExamAttemptDetail,
  type OfficialQuestionTagType,
  type OfficialTagAggRow,
  type OfficialCrossSplitRow,
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
import {
  AdminExamOptionText,
  AdminExamQuestionStem,
} from './PlatformAdminExamQuestionCard';
import { resolveLearnerExamOptions } from '../../components/assessment/resolveLearnerExamOptions';

type AnalyticsSection = 'official' | 'practice' | 'qod' | 'activity' | 'coins';

type OfficialView = 'overview' | 'exam-snapshots' | 'constructs' | 'grade-school' | 'completions' | 'abandons';
type PracticeView = 'overview' | 'by-exam' | 'exam-detail';
type QodView = 'overview' | 'top-students';
type GradeSchoolStrandSplit =
  | { kind: 'grade'; key: string; label: string }
  | { kind: 'school'; key: string; label: string };

const ANALYTICS_SECTIONS: AnalyticsSection[] = ['official', 'practice', 'qod', 'activity', 'coins'];

const AR_STRAND_LABELS: Record<string, string> = {
  pattern: 'Pattern & Structure Induction',
  rule: 'Rule & Transformation Application',
  relational: 'Relational & Constraint Deduction',
  flexible: 'Flexible Model Evaluation',
};

const AR_INSTRUCTION_FAMILY_LABELS: Record<string, string> = {
  'IF-01': 'Matrix and grid completion',
  'IF-02': 'Sequence and panel progression',
  'IF-03': 'Analogy and transformation',
  'IF-04': 'Input-output and correspondence',
  'IF-05': 'Relational order reconstruction',
  'IF-06': 'Constraint scenarios',
  'IF-07': 'Anchored classification and set relations',
  'IF-08': 'Spatial transformation',
  'IF-09': 'Model and evidence evaluation',
  'IF-10': 'Spatial construction and recognition',
};

const AR_REPRESENTATION_MODE_LABELS: Record<string, string> = {
  abstract_figural: 'Abstract figural',
  code_table: 'Code table',
  relational_schematic: 'Relational schematic',
  short_context: 'Short context',
  spatial_2d: 'Spatial 2D',
  spatial_3d: 'Spatial 3D',
};

const AR_PROGRESSION_REASON_LABELS: Record<string, string> = {
  not_all_strands_have_sufficient_evidence: 'Not all strands have enough evidence',
  fewer_than_three_secure_strands: 'Fewer than three strands are secure',
  a_strand_remains_emerging: 'A strand is still emerging',
  unresolved_delivery_or_rendering_incident: 'Unresolved delivery or rendering issue',
};

const AR_EXTENSION_REASON_LABELS: Record<string, string> = {
  progression_decision_within_uncertainty_margin: 'Level-up decision is still uncertain',
  usable_evidence_reduced_by_omission_or_delivery_incident:
    'Usable evidence reduced by a skipped item or delivery issue',
  extension_pool_infeasible_finishing_at_32:
    'Could not add the extra 8 items — sitting finished at 32',
  extension_assembly_infeasible_finishing_at_32:
    'Could not assemble the extra 8 items — sitting finished at 32',
};

function titleCaseAnalyticsKey(key: string): string {
  const spaced = key.replace(/_/g, ' ').replace(/:/g, ' · ').trim();
  if (!spaced) return key;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function representationModeDisplayLabel(key: string, fallback?: string): string {
  return AR_REPRESENTATION_MODE_LABELS[key] ?? fallback ?? titleCaseAnalyticsKey(key);
}

function progressionReasonDisplayLabel(key: string, fallback?: string): string {
  return AR_PROGRESSION_REASON_LABELS[key] ?? fallback ?? titleCaseAnalyticsKey(key);
}

function extensionReasonDisplayLabel(key: string, fallback?: string): string {
  if (AR_EXTENSION_REASON_LABELS[key]) return AR_EXTENSION_REASON_LABELS[key];
  const colon = key.indexOf(':');
  if (colon > 0) {
    const prefix = key.slice(0, colon);
    const strandName = AR_STRAND_LABELS[key.slice(colon + 1)] ?? key.slice(colon + 1);
    if (prefix === 'strand_below_evidence_floor') {
      return `${strandName} is below the evidence floor`;
    }
    if (prefix === 'conflicting_results_leave_strand_unresolved') {
      return `${strandName} has conflicting results`;
    }
    if (prefix === 'strength_lacks_changed_family_or_stretch_confirmation') {
      return `${strandName} looks strong but lacks a new family or Stretch confirmation`;
    }
  }
  return fallback && fallback !== key ? fallback : titleCaseAnalyticsKey(key);
}

function exposureGroupDisplayLabel(key: string, fallback?: string): string {
  const live = key.match(/^AR-(L[12])-IF(\d{2})-([ECS])-P(\d+)$/i);
  if (live) {
    const level = live[1].toUpperCase();
    const ifId = `IF-${live[2]}`;
    const family = AR_INSTRUCTION_FAMILY_LABELS[ifId] ?? ifId;
    const bandCode = live[3].toUpperCase();
    const band = bandCode === 'E' ? 'Entry' : bandCode === 'C' ? 'Core' : 'Stretch';
    return `${level} · ${ifId} ${family} · ${band} · parent ${live[4]}`;
  }
  const legacy = key.match(/^AR-(L[12])-([A-Z]{1,3}\d*)-(\d{2})-P(\d+)$/i);
  if (legacy) {
    return `${legacy[1].toUpperCase()} · ${legacy[2].toUpperCase()} · family ${legacy[3]} · parent ${legacy[4]}`;
  }
  return fallback && fallback !== key ? fallback : key;
}

function gradeSchoolRowSx(selected: boolean) {
  return {
    cursor: 'pointer',
    bgcolor: selected ? 'rgba(16, 64, 139, 0.08)' : undefined,
    '&:hover': { bgcolor: selected ? 'rgba(16, 64, 139, 0.1)' : 'rgba(16, 64, 139, 0.04)' },
  } as const;
}

function strandRowsForGradeSchoolSplit(
  split: GradeSchoolStrandSplit,
  drilldown: OfficialExamDrilldown | null
): OfficialCrossSplitRow[] {
  if (!drilldown) return [];
  if (split.kind === 'grade') {
    return (drilldown.strand_by_grade || []).filter(
      (row) =>
        row.split_key === split.key ||
        row.split_label === `Grade ${split.key}` ||
        row.split_label === split.label
    );
  }
  return (drilldown.strand_by_school || []).filter(
    (row) => row.split_key === split.key || row.split_label === split.label
  );
}

function GradeSchoolStrandExpandRow({
  split,
  drilldown,
  loading,
  colSpan,
}: {
  split: GradeSchoolStrandSplit;
  drilldown: OfficialExamDrilldown | null;
  loading: boolean;
  colSpan: number;
}) {
  const rows = strandRowsForGradeSchoolSplit(split, drilldown);
  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ bgcolor: '#f8fafc', py: 1.5, px: 1.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={22} sx={{ color: ip.navy }} />
          </Box>
        ) : (
          <Table size="small" sx={{ ...platformAdminTableSx, minWidth: 0 }}>
            <TableHead>
              <TableRow sx={platformAdminTableHeadRowSx}>
                <TableCell>Strand</TableCell>
                <TableCell align="right">Attempts</TableCell>
                <TableCell align="right">Accuracy</TableCell>
                <TableCell align="right">Served</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 1.5, color: ip.subtext }}>
                    No strand rows for this {split.kind} yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={`${row.split_key}-${row.tag_key}`}>
                    <TableCell>{row.tag_label}</TableCell>
                    <TableCell align="right">{row.attempts_with_data}</TableCell>
                    <TableCell align="right">
                      <PlatformAdminAccuracyChip pct={row.accuracy_pct} />
                    </TableCell>
                    <TableCell align="right">{row.served_sum}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableCell>
    </TableRow>
  );
}

const ANALYTICS_SECTION_META: Record<
  AnalyticsSection,
  { title: string; subtitle: string }
> = {
  official: {
    title: 'Official Exams',
    subtitle: 'Completions, scores, strands, and search across live official exams.',
  },
  practice: {
    title: 'Practice Exams',
    subtitle: 'Daily volume, exam splits, grade breakdowns, and top practice students.',
  },
  qod: {
    title: 'Question of the Day',
    subtitle: 'Daily QoD volume, accuracy, and top students.',
  },
  activity: {
    title: 'Overall Activity',
    subtitle: 'School admin login and platform activity signals.',
  },
  coins: {
    title: 'Coins',
    subtitle: 'Highest Argus Coin balances and lifetime earnings.',
  },
};

function isAnalyticsSection(value: string | undefined): value is AnalyticsSection {
  return Boolean(value && ANALYTICS_SECTIONS.includes(value as AnalyticsSection));
}

/** Chart x-label from YYYY-MM-DD; never throw if a cached row is missing `date`. */
function ymdChartLabel(date: unknown): string {
  return typeof date === 'string' && date.length >= 5 ? date.slice(5) : '';
}

/** "Analytical Reasoning" → "Analytical"; leaves AI/English Proficiency unchanged. */
function shortOfficialExamLabel(label: string): string {
  return label.replace(/\s+Reasoning$/i, '').trim() || label;
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

const PlatformAdminAnalyticsPageInner: React.FC = () => {
  const navigate = useNavigate();
  const { section: sectionParam } = useParams<{ section?: string }>();
  const section: AnalyticsSection = isAnalyticsSection(sectionParam) ? sectionParam : 'official';

  const [officialView, setOfficialView] = useState<OfficialView>('overview');
  const [practiceView, setPracticeView] = useState<PracticeView>('overview');
  const [qodView, setQodView] = useState<QodView>('overview');

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
  const [gradeSchoolStrandSplit, setGradeSchoolStrandSplit] =
    useState<GradeSchoolStrandSplit | null>(null);
  const [officialAttemptDetail, setOfficialAttemptDetail] =
    useState<OfficialExamAttemptDetail | null>(null);
  const [officialAttemptDetailLoading, setOfficialAttemptDetailLoading] = useState(false);
  const [officialAttemptDetailKey, setOfficialAttemptDetailKey] = useState<string | null>(null);
  const officialAttemptDetailReqRef = useRef(0);
  const officialAttemptDetailPanelRef = useRef<HTMLDivElement | null>(null);
  const [officialGeneratedAt, setOfficialGeneratedAt] = useState('');
  const [officialIndexesBuilding, setOfficialIndexesBuilding] = useState(false);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialDetailLoading, setOfficialDetailLoading] = useState(false);
  const [officialDrillLoading, setOfficialDrillLoading] = useState(false);
  const [officialCompletionsLoading, setOfficialCompletionsLoading] = useState(false);
  const [officialError, setOfficialError] = useState<string | null>(null);
  const officialDetailReqRef = useRef(0);
  const officialCompletionsReqRef = useRef(0);
  const officialDrillReqRef = useRef(0);
  const [officialAbandons, setOfficialAbandons] = useState<OfficialExamAbandons | null>(null);
  const [officialAbandonsLoading, setOfficialAbandonsLoading] = useState(false);
  const [officialAbandonLevel, setOfficialAbandonLevel] = useState<'all' | number>('all');
  const officialAbandonsReqRef = useRef(0);

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

  const [topCoinsByBalance, setTopCoinsByBalance] = useState<TopCoinsStudentRow[]>([]);
  const [topCoinsByLifetime, setTopCoinsByLifetime] = useState<TopCoinsStudentRow[]>([]);
  const [coinsGeneratedAt, setCoinsGeneratedAt] = useState('');
  const [coinsLoading, setCoinsLoading] = useState(false);
  const [coinsError, setCoinsError] = useState<string | null>(null);

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
      const req = ++officialCompletionsReqRef.current;
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
        if (req !== officialCompletionsReqRef.current) return;
        setOfficialRecent(data.results);
        setOfficialRecentMatched(data.matched);
        setOfficialRecentSearched(true);
        setOfficialAttemptDetail(null);
        setOfficialAttemptDetailKey(null);
      } catch (e: unknown) {
        if (req !== officialCompletionsReqRef.current) return;
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setOfficialError(err?.response?.data?.error || err?.message || 'Failed to search completions');
        setOfficialRecent([]);
        setOfficialRecentMatched(0);
        setOfficialRecentSearched(true);
      } finally {
        if (req === officialCompletionsReqRef.current) setOfficialCompletionsLoading(false);
      }
    },
    [completionQ, completionFrom, completionTo, completionLevel, completionLimit]
  );
  const searchOfficialCompletionsRef = useRef(searchOfficialCompletions);
  searchOfficialCompletionsRef.current = searchOfficialCompletions;

  const loadOfficialDrilldown = useCallback(
    async (examId: string, level: 'all' | number, opts?: { refresh?: boolean }) => {
      if (!examId) return;
      const req = ++officialDrillReqRef.current;
      setOfficialDrillLoading(true);
      setOfficialDrilldown(null);
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

  const loadOfficialAbandons = useCallback(
    async (examId: string, level: 'all' | number, opts?: { refresh?: boolean }) => {
      if (!examId) return;
      const req = ++officialAbandonsReqRef.current;
      setOfficialAbandonsLoading(true);
      setOfficialAbandons(null);
      try {
        const data = await getPlatformAdminOfficialExamAbandons(examId, {
          level: level === 'all' ? null : level,
          refresh: opts?.refresh,
        });
        if (req !== officialAbandonsReqRef.current) return;
        setOfficialAbandons(data);
        if (data.indexes_building) setOfficialIndexesBuilding(true);
      } catch (e: unknown) {
        if (req !== officialAbandonsReqRef.current) return;
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setOfficialError(err?.response?.data?.error || err?.message || 'Failed to load abandon stats');
        setOfficialAbandons(null);
      } finally {
        if (req === officialAbandonsReqRef.current) setOfficialAbandonsLoading(false);
      }
    },
    []
  );

  const loadOfficialAttemptDetail = useCallback(
    async (examId: string, row: OfficialExamRecentRow) => {
      const key = `${row.uid}::${row.attempt_id}`;
      if (officialAttemptDetailKey === key) {
        setOfficialAttemptDetail(null);
        setOfficialAttemptDetailKey(null);
        return;
      }
      const req = ++officialAttemptDetailReqRef.current;
      setOfficialAttemptDetailKey(key);
      setOfficialAttemptDetailLoading(true);
      setOfficialAttemptDetail(null);
      setOfficialError(null);
      try {
        const data = await getPlatformAdminOfficialExamAttemptDetail(examId, {
          uid: row.uid,
          attemptId: row.attempt_id,
        });
        if (req !== officialAttemptDetailReqRef.current) return;
        setOfficialAttemptDetail(data);
      } catch (e: unknown) {
        if (req !== officialAttemptDetailReqRef.current) return;
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setOfficialError(err?.response?.data?.error || err?.message || 'Failed to load attempt detail');
        setOfficialAttemptDetail(null);
        setOfficialAttemptDetailKey(null);
      } finally {
        if (req === officialAttemptDetailReqRef.current) setOfficialAttemptDetailLoading(false);
      }
    },
    [officialAttemptDetailKey]
  );

  useEffect(() => {
    if (!officialAttemptDetailKey) return;
    officialAttemptDetailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [officialAttemptDetailKey, officialAttemptDetailLoading, officialAttemptDetail]);

  const openItemBankForTag = (tagType: OfficialQuestionTagType, tag: string) => {
    if (!selectedOfficialExamId) return;
    const params = new URLSearchParams();
    params.set('exam', selectedOfficialExamId);
    if (officialDrillLevel !== 'all') params.set('level', String(officialDrillLevel));
    params.set(tagType, tag);
    navigate(`/platform-admin/item-bank?${params.toString()}`);
  };

  const renderOfficialTagTable = (
    tagType: OfficialQuestionTagType,
    title: string,
    caption: string,
    rows: OfficialTagAggRow[],
    emptyLabel: string
  ) => {
    return (
      <>
        <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5, mt: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1 }}>
          {caption}
        </Typography>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ ...platformAdminTablePaperSx, mb: 2.5 }}
        >
          <Table size="small" sx={platformAdminTableSx}>
            <TableHead>
              <TableRow sx={platformAdminTableHeadRowSx}>
                <TableCell>Tag</TableCell>
                <TableCell align="right">Attempts</TableCell>
                <TableCell align="right">Avg served</TableCell>
                <TableCell align="right">Accuracy</TableCell>
                <TableCell align="right">Total served</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 2, color: ip.subtext }}>
                    {emptyLabel}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={`${tagType}-${row.key}`}
                    hover
                    onClick={() => openItemBankForTag(tagType, row.key)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: ip.navy,
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                      }}
                    >
                      {row.label}
                    </TableCell>
                    <TableCell align="right">{row.attempts_with_data}</TableCell>
                    <TableCell align="right">{row.avg_served}</TableCell>
                    <TableCell align="right">
                      <PlatformAdminAccuracyChip pct={row.accuracy_pct} />
                    </TableCell>
                    <TableCell align="right">{row.served_sum}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </>
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

  const loadCoins = useCallback(async (opts?: { refresh?: boolean }) => {
    setCoinsLoading(true);
    setCoinsError(null);
    try {
      const coins = await getPlatformAdminTopCoins(10, { refresh: opts?.refresh });
      setTopCoinsByBalance(coins.by_balance);
      setTopCoinsByLifetime(coins.by_lifetime);
      setCoinsGeneratedAt(coins.generated_at);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setCoinsError(err?.response?.data?.error || err?.message || 'Failed to load coins analytics');
    } finally {
      setCoinsLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async (opts?: { refresh?: boolean }) => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const admins = await getPlatformAdminSchoolAdminActivity(20, { refresh: opts?.refresh });
      setSchoolAdmins(admins.admins);
      setActivityGeneratedAt(admins.generated_at);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setActivityError(err?.response?.data?.error || err?.message || 'Failed to load activity analytics');
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAnalyticsSection(sectionParam)) {
      navigate('/platform-admin/analytics/official', { replace: true });
    }
  }, [sectionParam, navigate]);

  useEffect(() => {
    if (section === 'official') void loadOfficialOverview();
    if (section === 'practice') void loadPractice();
    if (section === 'qod') void loadQod();
    if (section === 'activity') void loadActivity();
    if (section === 'coins') void loadCoins();
  }, [section, loadOfficialOverview, loadPractice, loadQod, loadActivity, loadCoins]);

  useEffect(() => {
    if (section !== 'official' || !selectedOfficialExamId) return;
    if (officialView !== 'exam-snapshots' && officialView !== 'grade-school') return;
    void loadOfficialDetail(selectedOfficialExamId);
  }, [section, officialView, selectedOfficialExamId, loadOfficialDetail]);

  useEffect(() => {
    if (section !== 'official' || officialView !== 'constructs' || !selectedOfficialExamId) return;
    void loadOfficialDrilldown(selectedOfficialExamId, officialDrillLevel);
  }, [section, officialView, selectedOfficialExamId, officialDrillLevel, loadOfficialDrilldown]);

  useEffect(() => {
    setGradeSchoolStrandSplit(null);
  }, [selectedOfficialExamId, officialView]);

  const officialDrilldownRef = useRef(officialDrilldown);
  officialDrilldownRef.current = officialDrilldown;

  useEffect(() => {
    if (section !== 'official' || officialView !== 'grade-school' || !selectedOfficialExamId) return;
    if (!gradeSchoolStrandSplit) return;
    const current = officialDrilldownRef.current;
    if (current && current.exam_id === selectedOfficialExamId && current.level_filter == null) {
      return;
    }
    void loadOfficialDrilldown(selectedOfficialExamId, 'all');
  }, [section, officialView, selectedOfficialExamId, gradeSchoolStrandSplit, loadOfficialDrilldown]);

  useEffect(() => {
    if (section !== 'official' || officialView !== 'abandons' || !selectedOfficialExamId) return;
    void loadOfficialAbandons(selectedOfficialExamId, officialAbandonLevel);
  }, [section, officialView, selectedOfficialExamId, officialAbandonLevel, loadOfficialAbandons]);

  useEffect(() => {
    if (section !== 'official' || officialView !== 'completions' || !selectedOfficialExamId) return;
    void searchOfficialCompletionsRef.current(selectedOfficialExamId);
  }, [section, officialView, selectedOfficialExamId]);

  useEffect(() => {
    if (section !== 'practice' || !selectedExamId) return;
    void loadPracticeDetail(selectedExamId);
  }, [section, selectedExamId, loadPracticeDetail]);

  const anyLoading =
    officialLoading ||
    officialDetailLoading ||
    officialDrillLoading ||
    officialCompletionsLoading ||
    officialAbandonsLoading ||
    officialAttemptDetailLoading ||
    practiceLoading ||
    practiceMonthlyLoading ||
    practiceDetailLoading ||
    qodLoading ||
    activityLoading ||
    coinsLoading;

  const handleForceRefresh = () => {
    if (section === 'official') {
      void loadOfficialOverview({ refresh: true });
      if (selectedOfficialExamId) {
        if (officialView === 'exam-snapshots' || officialView === 'grade-school') {
          void loadOfficialDetail(selectedOfficialExamId, { refresh: true });
        }
        if (officialView === 'constructs') {
          void loadOfficialDrilldown(selectedOfficialExamId, officialDrillLevel, { refresh: true });
        }
        if (officialView === 'grade-school' && gradeSchoolStrandSplit) {
          void loadOfficialDrilldown(selectedOfficialExamId, 'all', { refresh: true });
        }
        if (officialView === 'abandons') {
          void loadOfficialAbandons(selectedOfficialExamId, officialAbandonLevel, { refresh: true });
        }
      }
    }
    if (section === 'practice') {
      void loadPractice({ refresh: true });
      if (selectedExamId) void loadPracticeDetail(selectedExamId, { refresh: true });
    }
    if (section === 'qod') void loadQod({ refresh: true });
    if (section === 'activity') void loadActivity({ refresh: true });
    if (section === 'coins') void loadCoins({ refresh: true });
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
          date: ymdChartLabel(d?.date),
          completed: d?.total_completed ?? 0,
        };
        const byExam = d?.by_exam && typeof d.by_exam === 'object' ? d.by_exam : {};
        for (const examId of officialDailyExamIds) {
          row[examId] = byExam[examId]?.completed ?? 0;
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

  const openOfficialTab = (view: OfficialView) => {
    const top = [...officialSummaries].sort((a, b) => b.completed_attempts - a.completed_attempts)[0];
    const examId = top?.exam_id || selectedOfficialExamId;
    if (examId) setSelectedOfficialExamId(examId);
    setOfficialView(view);
  };

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
        date: ymdChartLabel(d?.date),
        answered: d?.total_answered ?? 0,
        correct: d?.total_correct ?? 0,
      })),
    [qodDays]
  );

  const practiceDailyChartData = useMemo(
    () =>
      practiceDaily.map((d) => ({
        date: ymdChartLabel(d?.date),
        sessions: d?.total_sessions ?? 0,
        questions: d?.total_questions ?? 0,
        correct: d?.total_correct ?? 0,
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
        const row: Record<string, string | number> = { date: ymdChartLabel(d?.date) };
        const byExam = d?.by_exam && typeof d.by_exam === 'object' ? d.by_exam : {};
        for (const examId of practiceDailyExamIds) {
          row[examId] = byExam[examId]?.sessions ?? 0;
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
        title={ANALYTICS_SECTION_META[section].title}
        subtitle={`${ANALYTICS_SECTION_META[section].subtitle} Data is Redis-cached and not realtime.`}
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

      {anyLoading ? (
        <LinearProgress
          sx={{
            mb: 2,
            height: 3,
            borderRadius: 1,
            bgcolor: 'rgba(16, 64, 139, 0.08)',
            '& .MuiLinearProgress-bar': { bgcolor: ip.navy },
          }}
        />
      ) : null}

      {section === 'official' && (
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
                {staleHint(officialGeneratedAt)} · scores shown as % and points / 1000
              </Typography>

              <Tabs
                value={officialView}
                onChange={(_e, value: OfficialView) => setOfficialView(value)}
                variant="scrollable"
                scrollButtons="auto"
                sx={analyticsTabRailSx}
              >
                <Tab value="overview" label="Overview" />
                <Tab value="exam-snapshots" label="Exam snapshots" />
                <Tab value="constructs" label="Strands & items" />
                <Tab value="grade-school" label="Grade & school" />
                <Tab value="completions" label="Search completions" />
                <Tab value="abandons" label="Abandons" />
              </Tabs>

              {officialView === 'overview' && (
              <PlatformAdminAnalyticsSection
                title="Overview"
                subtitle="Platform-wide official exam totals and daily completion trends (IST). Click a card to open the matching tab."
                accent="navy"
              >
                <Box sx={{ ...platformAdminStatsGridSx, mb: 2.5 }}>
                  <PlatformAdminStatCard
                    title="Total completions"
                    value={officialTotals.completed.toLocaleString()}
                    icon={<CorrectIcon sx={{ color: '#059669' }} />}
                    accent="#059669"
                    onClick={() => openOfficialTab('completions')}
                  />
                  <PlatformAdminStatCard
                    title="Students"
                    value={officialTotals.students.toLocaleString()}
                    icon={<PeopleIcon sx={{ color: '#0f766e' }} />}
                    accent="#0f766e"
                    onClick={() => openOfficialTab('grade-school')}
                  />
                  <PlatformAdminStatCard
                    title="Avg score"
                    value={`${officialTotals.avgScore}%`}
                    icon={<TimelineIcon sx={{ color: '#b45309' }} />}
                    accent="#b45309"
                    onClick={() => openOfficialTab('exam-snapshots')}
                  />
                  <PlatformAdminStatCard
                    title="Pass rate"
                    value={`${officialTotals.passRate}%`}
                    icon={<QuizIcon sx={{ color: '#0d47a1' }} />}
                    accent="#0d47a1"
                    onClick={() => openOfficialTab('exam-snapshots')}
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
              )}

              {officialView !== 'overview' && (
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
              )}

              {officialView === 'exam-snapshots' && (
              <PlatformAdminAnalyticsSection
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
              )}

              {officialView === 'constructs' && (
              <PlatformAdminAnalyticsSection
                title="Strands & items"
                subtitle={
                  <>
                    Strand, instruction family, and band rollups from completed attempts
                    {officialDrilldown
                      ? ` · ${officialDrilldown.attempts_analyzed.toLocaleString()} analyzed`
                      : ''}
                    . Click a row to open that filter in Item Bank.
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

                      {renderOfficialTagTable(
                        'strand',
                        'By strand',
                        'Click a strand to open those items in Item Bank.',
                        officialDrilldown.by_strand || [],
                        'No strand statuses on these completions yet.'
                      )}
                      {renderOfficialTagTable(
                        'instruction_family',
                        'By instruction family (IF-01…IF-10)',
                        'Click an instruction family to open those items in Item Bank.',
                        officialDrilldown.by_instruction_family || [],
                        'No instruction-family tallies yet.'
                      )}
                      {renderOfficialTagTable(
                        'band',
                        'By band (Entry / Core / Stretch)',
                        'Click Entry / Core / Stretch to open those items in Item Bank.',
                        officialDrilldown.by_band || [],
                        'No band tallies on these completions yet.'
                      )}

                      <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5, mt: 1 }}>
                        Strand performance & evidence
                      </Typography>
                      <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1 }}>
                        secure / developing / emerging + evidence sufficient vs unresolved (from strand_statuses).
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={{ ...platformAdminTablePaperSx, mb: 2.5 }}>
                        <Table size="small" sx={platformAdminTableSx}>
                          <TableHead>
                            <TableRow sx={platformAdminTableHeadRowSx}>
                              <TableCell>Strand</TableCell>
                              <TableCell align="right">Attempts</TableCell>
                              <TableCell align="right">Secure</TableCell>
                              <TableCell align="right">Developing</TableCell>
                              <TableCell align="right">Emerging</TableCell>
                              <TableCell align="right">Evidence OK %</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(officialDrilldown.strand_status_summary || []).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 2, color: ip.subtext }}>
                                  No strand status rows yet.
                                </TableCell>
                              </TableRow>
                            ) : (
                              officialDrilldown.strand_status_summary.map((row) => (
                                <TableRow key={row.key}>
                                  <TableCell sx={{ fontWeight: 700 }}>{row.label}</TableCell>
                                  <TableCell align="right">{row.attempts}</TableCell>
                                  <TableCell align="right">{row.secure}</TableCell>
                                  <TableCell align="right">{row.developing}</TableCell>
                                  <TableCell align="right">{row.emerging}</TableCell>
                                  <TableCell align="right">
                                    <PlatformAdminAccuracyChip pct={row.evidence_sufficient_pct} />
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
                        L1 → L2 progression
                      </Typography>
                      <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1 }}>
                        {officialDrilldown.l1_to_l2_progression?.attempts_with_data
                          ? `${officialDrilldown.l1_to_l2_progression.recommended} of ${officialDrilldown.l1_to_l2_progression.attempts_with_data} sits recommended for Level 2 (${officialDrilldown.l1_to_l2_progression.recommended_pct}%)`
                          : 'No Level 1 → Level 2 recommendations on these completions yet.'}
                      </Typography>
                      {(officialDrilldown.l1_to_l2_progression?.reason_counts || []).length > 0 && (
                        <TableContainer component={Paper} elevation={0} sx={{ ...platformAdminTablePaperSx, mb: 2.5 }}>
                          <Table size="small" sx={platformAdminTableSx}>
                            <TableHead>
                              <TableRow sx={platformAdminTableHeadRowSx}>
                                <TableCell>Why not recommended</TableCell>
                                <TableCell align="right">Sits</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {officialDrilldown.l1_to_l2_progression.reason_counts.map((r) => (
                                <TableRow key={r.key}>
                                  <TableCell>
                                    {progressionReasonDisplayLabel(r.key, r.label)}
                                  </TableCell>
                                  <TableCell align="right">{r.count}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}

                      <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5, mt: 1 }}>
                        32-item vs 40-item sittings
                      </Typography>
                      <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1 }}>
                        {officialDrilldown.set_route?.attempts_with_ar_shape
                          ? `${officialDrilldown.set_route.attempts_with_ar_shape} Analytical Reasoning sits: ${officialDrilldown.set_route.finished_at_32} finished at 32 items, ${officialDrilldown.set_route.finished_at_40} at 40 items. Extra 8-item set used on ${officialDrilldown.set_route.extension_triggered} sits (${officialDrilldown.set_route.extension_trigger_pct}%).`
                          : 'No Analytical Reasoning sits in this filter yet.'}
                      </Typography>
                      {(officialDrilldown.set_route?.reason_counts || []).length > 0 && (
                        <TableContainer component={Paper} elevation={0} sx={{ ...platformAdminTablePaperSx, mb: 2.5 }}>
                          <Table size="small" sx={platformAdminTableSx}>
                            <TableHead>
                              <TableRow sx={platformAdminTableHeadRowSx}>
                                <TableCell>Why the extra 8 items were added</TableCell>
                                <TableCell align="right">Sits</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {officialDrilldown.set_route.reason_counts.map((r) => (
                                <TableRow key={r.key}>
                                  <TableCell>
                                    {extensionReasonDisplayLabel(r.key, r.label)}
                                  </TableCell>
                                  <TableCell align="right">{r.count}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}

                      <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5, mt: 1 }}>
                        How items were shown
                      </Typography>
                      <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1 }}>
                        Presentation style on newer Analytical Reasoning sits (figures, spatial, tables, short context).
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={{ ...platformAdminTablePaperSx, mb: 2.5 }}>
                        <Table size="small" sx={platformAdminTableSx}>
                          <TableHead>
                            <TableRow sx={platformAdminTableHeadRowSx}>
                              <TableCell>Style</TableCell>
                              <TableCell align="right">Attempts</TableCell>
                              <TableCell align="right">Accuracy</TableCell>
                              <TableCell align="right">Served</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(officialDrilldown.by_representation_mode || []).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 2, color: ip.subtext }}>
                                  No presentation-style tags yet.
                                </TableCell>
                              </TableRow>
                            ) : (
                              officialDrilldown.by_representation_mode.map((row) => (
                                <TableRow key={row.key}>
                                  <TableCell sx={{ fontWeight: 700 }}>
                                    {representationModeDisplayLabel(row.key, row.label)}
                                  </TableCell>
                                  <TableCell align="right">{row.attempts_with_data}</TableCell>
                                  <TableCell align="right">
                                    <PlatformAdminAccuracyChip pct={row.accuracy_pct} />
                                  </TableCell>
                                  <TableCell align="right">{row.served_sum}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
                        Look-alike item groups
                      </Typography>
                      <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1 }}>
                        Families that look too similar to serve twice in one sitting. Top 15 by items served.
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={{ ...platformAdminTablePaperSx, mb: 2.5 }}>
                        <Table size="small" sx={platformAdminTableSx}>
                          <TableHead>
                            <TableRow sx={platformAdminTableHeadRowSx}>
                              <TableCell>Group</TableCell>
                              <TableCell align="right">Attempts</TableCell>
                              <TableCell align="right">Accuracy</TableCell>
                              <TableCell align="right">Served</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(officialDrilldown.by_exposure_group || []).slice(0, 15).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 2, color: ip.subtext }}>
                                  No look-alike group tags yet.
                                </TableCell>
                              </TableRow>
                            ) : (
                              officialDrilldown.by_exposure_group.slice(0, 15).map((row) => (
                                <TableRow key={row.key}>
                                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                                    <Box>
                                      {exposureGroupDisplayLabel(row.key, row.label)}
                                      <Typography
                                        variant="caption"
                                        sx={{ display: 'block', color: ip.subtext, fontFamily: 'monospace' }}
                                      >
                                        {row.key}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right">{row.attempts_with_data}</TableCell>
                                  <TableCell align="right">
                                    <PlatformAdminAccuracyChip pct={row.accuracy_pct} />
                                  </TableCell>
                                  <TableCell align="right">{row.served_sum}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
              </PlatformAdminAnalyticsSection>
              )}

              {officialView === 'grade-school' && (
              <PlatformAdminAnalyticsSection
                title="Grade & school"
                subtitle="From completed attempts (grade at attempt when available; otherwise student grade). Click a grade or school for strand-wise accuracy."
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
                                officialByGrade.map((row) => {
                                  const key = row.grade == null ? 'unknown' : String(row.grade);
                                  const label = row.grade == null ? 'Unknown' : `G${row.grade}`;
                                  const selected =
                                    gradeSchoolStrandSplit?.kind === 'grade' &&
                                    gradeSchoolStrandSplit.key === key;
                                  return (
                                  <React.Fragment key={key}>
                                  <TableRow
                                    hover
                                    onClick={() =>
                                      setGradeSchoolStrandSplit(
                                        selected ? null : { kind: 'grade', key, label }
                                      )
                                    }
                                    sx={gradeSchoolRowSx(selected)}
                                  >
                                    <TableCell sx={{ fontWeight: 700 }}>{label}</TableCell>
                                    <TableCell align="right">{row.completed_attempts}</TableCell>
                                    <TableCell align="right">{row.unique_students}</TableCell>
                                    <TableCell align="right">
                                      <PlatformAdminAccuracyChip pct={row.avg_score_pct} />
                                    </TableCell>
                                    <TableCell align="right">
                                      <PlatformAdminAccuracyChip pct={row.pass_rate_pct} />
                                    </TableCell>
                                  </TableRow>
                                  {selected && gradeSchoolStrandSplit ? (
                                    <GradeSchoolStrandExpandRow
                                      split={gradeSchoolStrandSplit}
                                      drilldown={officialDrilldown}
                                      loading={officialDrillLoading}
                                      colSpan={5}
                                    />
                                  ) : null}
                                  </React.Fragment>
                                  );
                                })
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
                                officialBySchool.map((row) => {
                                  const key = row.school_id || row.school_name;
                                  const selected =
                                    gradeSchoolStrandSplit?.kind === 'school' &&
                                    gradeSchoolStrandSplit.key === key;
                                  return (
                                  <React.Fragment key={key}>
                                  <TableRow
                                    hover
                                    onClick={() =>
                                      setGradeSchoolStrandSplit(
                                        selected
                                          ? null
                                          : { kind: 'school', key, label: row.school_name }
                                      )
                                    }
                                    sx={gradeSchoolRowSx(selected)}
                                  >
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
                                  {selected && gradeSchoolStrandSplit ? (
                                    <GradeSchoolStrandExpandRow
                                      split={gradeSchoolStrandSplit}
                                      drilldown={officialDrilldown}
                                      loading={officialDrillLoading}
                                      colSpan={5}
                                    />
                                  ) : null}
                                  </React.Fragment>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Box>
                  )}
              </PlatformAdminAnalyticsSection>
              )}

              {officialView === 'completions' && (
              <PlatformAdminAnalyticsSection
                title="Search completions"
                subtitle="Loads when you open this tab. Use filters and Search to refine. Click a student to open their full exam paper (questions, choices, and answers) for that level."
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
                      startIcon={
                        officialCompletionsLoading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : undefined
                      }
                      sx={platformAdminOutlinedButtonSx}
                    >
                      {officialCompletionsLoading ? 'Searching…' : 'Search'}
                    </Button>
                  </Box>

                  {officialCompletionsLoading ||
                  (Boolean(selectedOfficialExamId) && !officialRecentSearched) ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.25,
                        py: 6,
                      }}
                    >
                      <CircularProgress size={28} sx={{ color: ip.navy }} />
                      <Typography variant="body2" sx={{ color: ip.subtext }}>
                        Loading completions…
                      </Typography>
                    </Box>
                  ) : !officialRecentSearched ? (
                    <Typography variant="body2" sx={{ color: ip.subtext, py: 2 }}>
                      Select an exam, then click Search to load completions.
                    </Typography>
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
                              officialRecent.map((row) => {
                                const key = `${row.uid}::${row.attempt_id}`;
                                const selected = officialAttemptDetailKey === key;
                                const sameStudentSits = officialRecent.filter((r) => r.uid === row.uid);
                                return (
                                  <React.Fragment key={row.attempt_id}>
                                  <TableRow
                                    hover
                                    onClick={() => {
                                      if (!selectedOfficialExamId) return;
                                      void loadOfficialAttemptDetail(selectedOfficialExamId, row);
                                    }}
                                    sx={selected ? selectedTagRowSx : { cursor: 'pointer' }}
                                  >
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {formatDateTime(row.completed_at)}
                                    {selected ? ' · open' : ''}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    <Typography
                                      component="span"
                                      sx={{
                                        color: ip.navy,
                                        fontWeight: 700,
                                        textDecoration: 'underline',
                                        textUnderlineOffset: '3px',
                                      }}
                                    >
                                      {[row.first_name, row.last_name].filter(Boolean).join(' ') ||
                                        row.email}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ display: 'block', color: ip.subtext }}
                                    >
                                      {row.email}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>{row.school_name ?? '-'}</TableCell>
                                  <TableCell align="right">{row.proficiency_tier ?? '-'}</TableCell>
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
                                {selected ? (
                                  <TableRow>
                                    <TableCell
                                      colSpan={6}
                                      sx={{ p: 0, bgcolor: '#f8fafc', verticalAlign: 'top' }}
                                    >
                                      <Box ref={officialAttemptDetailPanelRef} sx={{ p: 2 }}>
                                        {sameStudentSits.length > 1 ? (
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                                            {sameStudentSits.map((sit) => {
                                              const sitKey = `${sit.uid}::${sit.attempt_id}`;
                                              const sitOpen = officialAttemptDetailKey === sitKey;
                                              return (
                                                <Button
                                                  key={sit.attempt_id}
                                                  size="small"
                                                  variant={sitOpen ? 'contained' : 'outlined'}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!selectedOfficialExamId) return;
                                                    void loadOfficialAttemptDetail(selectedOfficialExamId, sit);
                                                  }}
                                                  sx={{
                                                    ...platformAdminOutlinedButtonSx,
                                                    textTransform: 'none',
                                                    ...(sitOpen
                                                      ? {
                                                          bgcolor: ip.navy,
                                                          color: '#fff',
                                                          '&:hover': { bgcolor: ip.navy },
                                                        }
                                                      : {}),
                                                  }}
                                                >
                                                  Level {sit.proficiency_tier ?? '-'}
                                                  {sit.score_pct != null ? ` · ${sit.score_pct}%` : ''}
                                                </Button>
                                              );
                                            })}
                                          </Box>
                                        ) : null}
                                        {officialAttemptDetailLoading ? (
                                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                            <CircularProgress size={28} sx={{ color: ip.navy }} />
                                          </Box>
                                        ) : officialAttemptDetail ? (
                                          <Box>
                                            <Box
                                              sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                gap: 1,
                                                flexWrap: 'wrap',
                                                mb: 1.5,
                                              }}
                                            >
                                              <Box>
                                                <Typography sx={{ fontWeight: 800, color: ip.heading, fontSize: 15 }}>
                                                  Level {officialAttemptDetail.proficiency_tier ?? '-'} exam ·{' '}
                                                  {officialAttemptDetail.questions.length} questions
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: ip.subtext }}>
                                                  {officialAttemptDetail.scoring_mode || 'scoring unknown'}
                                                  {officialAttemptDetail.score_pct != null
                                                    ? ` · ${officialAttemptDetail.score_pct}% (${officialAttemptDetail.score_points}/1000)`
                                                    : ''}
                                                </Typography>
                                              </Box>
                                              <Button
                                                size="small"
                                                startIcon={<ArrowBackIcon />}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOfficialAttemptDetail(null);
                                                  setOfficialAttemptDetailKey(null);
                                                }}
                                                sx={platformAdminOutlinedButtonSx}
                                              >
                                                Close
                                              </Button>
                                            </Box>
                                            {officialAttemptDetail.questions.length === 0 ? (
                                              <Typography variant="body2" sx={{ color: ip.subtext }}>
                                                This attempt has no stored question queue, so the paper cannot be reconstructed.
                                              </Typography>
                                            ) : (
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                {officialAttemptDetail.questions.map((q) => (
                                                  <Box
                                                    key={`${officialAttemptDetail.attempt_id}-${q.index}-${q.item_id}`}
                                                    sx={{
                                                      bgcolor: '#fff',
                                                      border: '1px solid #e2e8f0',
                                                      borderRadius: 1.5,
                                                      p: 1.75,
                                                    }}
                                                  >
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 0.75 }}>
                                                      <Typography sx={{ fontWeight: 800, color: ip.heading }}>
                                                        Q{q.index}
                                                      </Typography>
                                                      <PlatformAdminChip
                                                        label={
                                                          q.is_correct == null
                                                            ? 'ungraded'
                                                            : q.is_correct
                                                              ? 'correct'
                                                              : 'incorrect'
                                                        }
                                                        tone={
                                                          q.is_correct == null
                                                            ? 'neutral'
                                                            : q.is_correct
                                                              ? 'success'
                                                              : 'error'
                                                        }
                                                      />
                                                      {q.time_spent_sec != null ? (
                                                        <PlatformAdminChip
                                                          label={`${q.time_spent_sec}s`}
                                                          tone="info"
                                                        />
                                                      ) : null}
                                                      {q.strand_label || q.strand ? (
                                                        <PlatformAdminChip
                                                          label={q.strand_label || q.strand || ''}
                                                          tone="info"
                                                        />
                                                      ) : null}
                                                      {q.instruction_family ? (
                                                        <PlatformAdminChip
                                                          label={
                                                            q.instruction_family_label
                                                              ? `${q.instruction_family} · ${q.instruction_family_label}`
                                                              : q.instruction_family
                                                          }
                                                          tone="neutral"
                                                        />
                                                      ) : null}
                                                      {q.band ? (
                                                        <PlatformAdminChip label={q.band} tone="warning" />
                                                      ) : null}
                                                    </Box>
                                                    <Typography sx={{ color: '#475569', fontSize: 12, mb: 0.5 }}>
                                                      {q.item_id}
                                                    </Typography>
                                                    <AdminExamQuestionStem
                                                      q={q}
                                                      emptyLabel="(no prompt - bank item missing)"
                                                    />
                                                    {(() => {
                                                      const optionRows = Array.isArray(q.options) ? q.options : [];
                                                      const resolved = resolveLearnerExamOptions({
                                                        markdown: q.prompt || q.prompt_preview || '',
                                                        stimulus: q.stimulus,
                                                        stimulusType: q.stimulus_type,
                                                        bankOptions: optionRows.map((o) => o.text),
                                                      });
                                                      const hasText = resolved.optionTexts.some((t) => t);
                                                      if (optionRows.length > 0 && (resolved.pickOnFigure || !hasText)) {
                                                        return (
                                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                                        {optionRows.map((opt, optIdx) => {
                                                          const picked = q.selected_index === optIdx;
                                                          const keyCorrect = q.correct_index === optIdx;
                                                          return (
                                                            <Box
                                                              key={`${q.item_id}-${opt.letter}`}
                                                              sx={{
                                                                px: 1.1,
                                                                py: 0.55,
                                                                borderRadius: 1,
                                                                border: '1px solid',
                                                                borderColor: keyCorrect
                                                                  ? '#86efac'
                                                                  : picked
                                                                    ? '#fca5a5'
                                                                    : '#e2e8f0',
                                                                bgcolor: keyCorrect
                                                                  ? '#f0fdf4'
                                                                  : picked
                                                                    ? '#fef2f2'
                                                                    : '#fff',
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                color: ip.heading,
                                                              }}
                                                            >
                                                              {opt.letter}
                                                              {keyCorrect && picked
                                                                ? ' · correct · picked'
                                                                : keyCorrect
                                                                  ? ' · correct'
                                                                  : picked
                                                                    ? ' · picked'
                                                                    : ''}
                                                            </Box>
                                                          );
                                                        })}
                                                      </Box>
                                                        );
                                                      }
                                                      if (optionRows.length > 0) {
                                                        return (
                                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                                        {optionRows.map((opt, optIdx) => {
                                                          const picked = q.selected_index === optIdx;
                                                          const keyCorrect = q.correct_index === optIdx;
                                                          return (
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
                                                                borderColor: keyCorrect
                                                                  ? '#86efac'
                                                                  : picked
                                                                    ? '#fca5a5'
                                                                    : '#e2e8f0',
                                                                bgcolor: keyCorrect
                                                                  ? '#f0fdf4'
                                                                  : picked
                                                                    ? '#fef2f2'
                                                                    : '#fff',
                                                              }}
                                                            >
                                                              <Typography sx={{ fontWeight: 800, minWidth: 18 }}>
                                                                {opt.letter}
                                                              </Typography>
                                                              <AdminExamOptionText text={resolved.optionTexts[optIdx] || opt.text} />
                                                              <Typography variant="caption" sx={{ color: ip.subtext }}>
                                                                {keyCorrect && picked
                                                                  ? 'correct · picked'
                                                                  : keyCorrect
                                                                    ? 'correct'
                                                                    : picked
                                                                      ? 'picked'
                                                                      : ''}
                                                              </Typography>
                                                            </Box>
                                                          );
                                                        })}
                                                      </Box>
                                                        );
                                                      }
                                                      return (
                                                      <Typography variant="caption" sx={{ color: ip.subtext }}>
                                                        Picked {q.selected_letter} · key {q.correct_letter ?? '-'}
                                                      </Typography>
                                                      );
                                                    })()}
                                                  </Box>
                                                ))}
                                              </Box>
                                            )}
                                          </Box>
                                        ) : (
                                          <Typography variant="body2" sx={{ color: ip.subtext }}>
                                            Could not load this exam paper. Try Refresh data, then click the student again.
                                          </Typography>
                                        )}
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                ) : null}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
              </PlatformAdminAnalyticsSection>
              )}

              {officialView === 'abandons' && (
              <PlatformAdminAnalyticsSection
                title="Abandons / failed sits"
                subtitle="Single cached scan of status=failed attempts (reload/leave). Not loaded until you open this tab."
                accent="amber"
                action={
                  <FormControl size="small" sx={platformAdminFilterSelectSx(140)}>
                    <InputLabel>Level</InputLabel>
                    <Select
                      label="Level"
                      value={officialAbandonLevel}
                      onChange={(e) => {
                        const v = e.target.value;
                        setOfficialAbandonLevel(v === 'all' ? 'all' : Number(v));
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
                {officialAbandonsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={32} sx={{ color: ip.navy }} />
                  </Box>
                ) : !officialAbandons ? (
                  <Typography variant="body2" sx={{ color: ip.subtext, py: 2 }}>
                    No abandon data yet for this exam.
                  </Typography>
                ) : (
                  <>
                    <Box sx={{ ...platformAdminStatsGridSx, mb: 2 }}>
                      <PlatformAdminStatCard
                        title="Failed sits"
                        value={officialAbandons.attempts_analyzed.toLocaleString()}
                        icon={<QuizIcon sx={{ color: '#b45309' }} />}
                        accent="#b45309"
                      />
                      <PlatformAdminStatCard
                        title="Unique students"
                        value={officialAbandons.unique_students.toLocaleString()}
                        icon={<PeopleIcon sx={{ color: '#0f766e' }} />}
                        accent="#0f766e"
                      />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>By reason</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ ...platformAdminTablePaperSx, mb: 2.5 }}>
                      <Table size="small" sx={platformAdminTableSx}>
                        <TableHead>
                          <TableRow sx={platformAdminTableHeadRowSx}>
                            <TableCell>Reason</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Share</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {officialAbandons.by_reason.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} align="center" sx={{ py: 2, color: ip.subtext }}>
                                No failed attempts in this filter.
                              </TableCell>
                            </TableRow>
                          ) : (
                            officialAbandons.by_reason.map((r) => (
                              <TableRow key={r.key}>
                                <TableCell sx={{ fontWeight: 700 }}>{r.key}</TableCell>
                                <TableCell align="right">{r.count}</TableCell>
                                <TableCell align="right">{r.pct}%</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 1 }}>Recent (25)</Typography>
                    <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                      <Table size="small" sx={platformAdminTableSx}>
                        <TableHead>
                          <TableRow sx={platformAdminTableHeadRowSx}>
                            <TableCell>Attempt</TableCell>
                            <TableCell>UID</TableCell>
                            <TableCell align="right">Level</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell align="right">Answered</TableCell>
                            <TableCell align="right">When</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {officialAbandons.recent.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 2, color: ip.subtext }}>
                                No recent abandons.
                              </TableCell>
                            </TableRow>
                          ) : (
                            officialAbandons.recent.map((r) => (
                              <TableRow key={r.attempt_id}>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.attempt_id}</TableCell>
                                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.uid}</TableCell>
                                <TableCell align="right">{r.proficiency_tier ?? '-'}</TableCell>
                                <TableCell>{r.abandon_reason || '-'}</TableCell>
                                <TableCell align="right">{r.questions_answered}</TableCell>
                                <TableCell align="right">
                                  {r.failed_at ? formatDateTime(r.failed_at) : '-'}
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
              )}

            </>
          )}
        </>
      )}

      {section === 'practice' && (
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

              <Tabs
                value={practiceView}
                onChange={(_e, value: PracticeView) => setPracticeView(value)}
                variant="scrollable"
                scrollButtons="auto"
                sx={analyticsTabRailSx}
              >
                <Tab value="overview" label="Overview" />
                <Tab value="by-exam" label="Sessions by exam" />
                <Tab value="exam-detail" label="Exam detail" />
              </Tabs>

              {practiceView === 'overview' && (
              <PlatformAdminAnalyticsSection
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
                    onClick={() => setPracticeView('by-exam')}
                  />
                  <PlatformAdminStatCard
                    title="Questions today"
                    value={(practiceDailyToday?.total_questions ?? 0).toLocaleString()}
                    icon={<CorrectIcon sx={{ color: '#059669' }} />}
                    accent="#059669"
                    onClick={() => setPracticeView('by-exam')}
                  />
                  <PlatformAdminStatCard
                    title="30-day sessions"
                    value={practiceDailyTotals.sessions.toLocaleString()}
                    icon={<PeopleIcon sx={{ color: '#7c3aed' }} />}
                    accent="#7c3aed"
                    onClick={() => setPracticeView('by-exam')}
                  />
                  <PlatformAdminStatCard
                    title="30-day accuracy"
                    value={`${practiceDailyTotals.accuracy}%`}
                    icon={<TimelineIcon sx={{ color: '#b45309' }} />}
                    accent="#b45309"
                    onClick={() => setPracticeView('exam-detail')}
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
              )}

              {practiceView === 'by-exam' && (
              <PlatformAdminAnalyticsSection
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
              )}

              {practiceView === 'exam-detail' && (
              <PlatformAdminAnalyticsSection
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
              )}
            </>
          )}
        </>
      )}

      {section === 'qod' && (
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
              <Tabs
                value={qodView}
                onChange={(_e, value: QodView) => setQodView(value)}
                variant="scrollable"
                scrollButtons="auto"
                sx={analyticsTabRailSx}
              >
                <Tab value="overview" label="Overview" />
                <Tab value="top-students" label="Top students" />
              </Tabs>

              {qodView === 'overview' && (
              <PlatformAdminAnalyticsSection
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
                    onClick={() => setQodView('top-students')}
                  />
                  <PlatformAdminStatCard
                    title="Correct today"
                    value={(qodToday?.total_correct ?? 0).toLocaleString()}
                    icon={<CorrectIcon sx={{ color: '#059669' }} />}
                    accent="#059669"
                    onClick={() => setQodView('top-students')}
                  />
                  <PlatformAdminStatCard
                    title="30-day answers"
                    value={qodTotals.answered.toLocaleString()}
                    icon={<PeopleIcon sx={{ color: '#7c3aed' }} />}
                    accent="#7c3aed"
                    onClick={() => setQodView('top-students')}
                  />
                  <PlatformAdminStatCard
                    title="30-day accuracy"
                    value={`${qodTotals.accuracy}%`}
                    icon={<TimelineIcon sx={{ color: '#b45309' }} />}
                    accent="#b45309"
                    onClick={() => setQodView('top-students')}
                  />
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
              )}

              {qodView === 'top-students' && (
              <PlatformAdminAnalyticsSection
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
              )}
            </>
          )}
        </>
      )}

      {section === 'activity' && (
        <>
          {activityError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {activityError}
            </Alert>
          )}
          <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1.5 }}>
            {staleHint(activityGeneratedAt)}
          </Typography>

          {activityLoading && schoolAdmins.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: ip.navy }} />
            </Box>
          ) : (
            <PlatformAdminAnalyticsSection
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
          )}
        </>
      )}

      {section === 'coins' && (
        <>
          {coinsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {coinsError}
            </Alert>
          )}
          <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1.5 }}>
            {staleHint(coinsGeneratedAt)}
          </Typography>

          {coinsLoading && topCoinsByBalance.length === 0 && topCoinsByLifetime.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: ip.navy }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <PlatformAdminAnalyticsSection
                title="Top 10 by balance"
                subtitle="Students with the highest current Argus Coin balance."
                accent="amber"
              >
                <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                  <Table size="small" sx={platformAdminTableSx}>
                    <TableHead>
                      <TableRow sx={platformAdminTableHeadRowSx}>
                        <TableCell>#</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>School</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell align="right">Lifetime</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCoinsByBalance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3, color: ip.subtext }}>
                            No coin balances yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        topCoinsByBalance.map((row, idx) => (
                          <TableRow key={`balance-${row.uid}`}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {[row.first_name, row.last_name].filter(Boolean).join(' ') || row.email}
                            </TableCell>
                            <TableCell>{row.school_name ?? '-'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {row.argus_coins.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: ip.subtext }}>
                              {(row.coins_lifetime_earned ?? 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </PlatformAdminAnalyticsSection>

              <PlatformAdminAnalyticsSection
                title="Top 10 by lifetime"
                subtitle="Students with the highest lifetime Argus Coins earned."
                accent="amber"
              >
                <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                  <Table size="small" sx={platformAdminTableSx}>
                    <TableHead>
                      <TableRow sx={platformAdminTableHeadRowSx}>
                        <TableCell>#</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>School</TableCell>
                        <TableCell align="right">Lifetime</TableCell>
                        <TableCell align="right">Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCoinsByLifetime.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3, color: ip.subtext }}>
                            No lifetime earnings yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        topCoinsByLifetime.map((row, idx) => (
                          <TableRow key={`lifetime-${row.uid}`}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {[row.first_name, row.last_name].filter(Boolean).join(' ') || row.email}
                            </TableCell>
                            <TableCell>{row.school_name ?? '-'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {(row.coins_lifetime_earned ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: ip.subtext }}>
                              {row.argus_coins.toLocaleString()}
                            </TableCell>
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

function AnalyticsPageFallback({ resetError }: { resetError?: () => void }) {
  return (
    <Alert
      severity="error"
      sx={{ mt: 2 }}
      action={
        resetError ? (
          <Button color="inherit" size="small" onClick={() => resetError()}>
            Try again
          </Button>
        ) : undefined
      }
    >
      Analytics failed to render. Try again, or hard-refresh if this followed a deploy.
    </Alert>
  );
}

const PlatformAdminAnalyticsPage: React.FC = () => (
  <Sentry.ErrorBoundary
    fallback={({ resetError }) => <AnalyticsPageFallback resetError={resetError} />}
  >
    <PlatformAdminAnalyticsPageInner />
  </Sentry.ErrorBoundary>
);

export default PlatformAdminAnalyticsPage;
