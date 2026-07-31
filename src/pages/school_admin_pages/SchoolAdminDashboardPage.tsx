import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Rocket as RocketIcon,
  ArrowForward as ArrowForwardIcon,
  Stars as StarsIcon,
  PriorityHigh as PriorityHighIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as MiniBarChartIcon,
  HelpOutline as HelpOutlineIcon,
  FileDownload as FileDownloadIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { RootState } from '../../state_data/reducer';
import { LoadingSpinner } from '../../components/ui/spinner';
import {
  downloadPdfFromUrl,
  downloadQuarterlyReportPdf,
  getQuarterlyReports,
  getSchoolStudentRoster,
  getSchoolSummary,
  getStudentRegistrationEmailLists,
  type QuarterlyReportListItem,
  type StudentRow,
} from '../../db/schoolAdminCollection';
import { queryKeys } from '../../query/queryKeys';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { useSchoolAdminBelowNav } from '../../layouts/schoolAdminBelowNavContext';
import {
  summarizeSchoolTier123,
  summarizeNationalPerformanceTiers,
  summarizeProficiencyByExam,
  computeAttemptRatePct,
  assessmentDisplayName,
  type ExamProficiencySummary,
} from '../../utils/schoolAdminTierAnalytics';
import { SCHOOL_SCORED_ASSESSMENT_IDS } from '../../utils/assessmentGating';
import { normalizeTierSlugForDashboard, parseInstitutionalTierSlug } from '../../utils/achievementTier';
import { displaySubscriptionPlan } from '../../utils/displaySubscriptionPlan';
import { normalizeRosterEmail, filterHiddenStaffStudentEmails, isVisibleSchoolRosterStudent } from '../../utils/schoolAdminRosterUtils';
import { ProficiencyTier123Overview } from '../../components/school_admin/ProficiencyTier123Overview';
import { NationalPerformanceTierOverview } from '../../components/school_admin/NationalPerformanceTierOverview';
import {
  buildGreenfieldPreviewStudentRows,
  GREENFIELD_ANALYTICS_SNAPSHOT,
  GREENFIELD_QUARTERLY_REPORTS,
  GREENFIELD_SCHOOL_DISPLAY,
} from '../../data/schoolPreviewMock';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { SCHOOL_ADMIN_PAGE_MAX_WIDTH } from './schoolAdminPageStyles';

// ─── Tier config ─────────────────────────────────────────────────────────────
const SCHOOL_ADMIN_HELP_HREF =
  'mailto:globalyoungscholar@argus.ai?subject=' + encodeURIComponent('Argus school portal - help');

/** Matches the staleTime used by `useSchoolAdminSummary`/`useSchoolAdminRoster` (query/hooks.ts)
 * so this page's `ensureQueryData` calls share the same cache freshness window as other pages. */
const SCHOOL_ADMIN_QUERY_STALE_MS = 60_000;

type DashboardQuickAction =
  | { key: string; icon: React.ReactElement; label: string; subcaption: string; path: string }
  | { key: string; icon: React.ReactElement; label: string; subcaption: string; href: string };

function getDashboardQuickActions(routeBase: string): DashboardQuickAction[] {
  return [
    {
      key: 'analytics',
      icon: <AnalyticsIcon sx={{ color: '#dc2626', fontSize: '2rem' }} />,
      label: 'Analytics',
      subcaption: 'School-wide scores, class mix, and proficiency levels across assessments.',
      path: `${routeBase}/analytics`,
    },
    {
      key: 'help',
      icon: <HelpOutlineIcon sx={{ color: '#0d9488', fontSize: '2rem' }} />,
      label: 'Help & support',
      subcaption: 'Email Argus for roster, reports, billing, or anything about your portal.',
      href: SCHOOL_ADMIN_HELP_HREF,
    },
  ];
}

const TIER_CONFIG: Record<string, { color: string; bg: string; label: string; bar: string; emoji: string }> = {
  diamond: { color: '#5b21b6', bg: 'rgba(91,33,182,0.14)', label: 'Diamond', bar: ip.tierBar.diamond, emoji: '💎' },
  platinum: {
    color: '#0369a1',
    bg: 'rgba(3,105,161,0.12)',
    label: 'Platinum',
    bar: ip.tierBar.platinum,
    emoji: '🏅',
  },
  gold: { color: '#d97706', bg: 'rgba(245,158,11,0.12)', label: 'Gold', bar: ip.tierBar.gold, emoji: '🥇' },
  silver: { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: 'Silver', bar: ip.tierBar.silver, emoji: '🥈' },
  bronze: { color: '#9a3412', bg: 'rgba(194,65,12,0.12)', label: 'Bronze', bar: ip.tierBar.bronze, emoji: '🥉' },
  explorer: { color: '#6b7280', bg: 'rgba(209,213,219,0.35)', label: 'Explorer', bar: ip.tierBar.explorer, emoji: '🧭' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ordinal(n: number): string {
  if (n <= 0) return '-';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Count completed assessment slots across all students at the school. */
function countAssessmentsCompleted(students: StudentRow[]): number {
  let n = 0;
  for (const s of students) {
    const progress = s.assessment_progress ?? {};
    for (const p of Object.values(progress)) {
      const pr = p as { status?: string; best_score?: number | null };
      if (pr.status === 'tier_advanced' || (pr.best_score != null && pr.best_score > 0)) {
        n += 1;
      }
    }
  }
  return n;
}

function parseOptionalInt(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Math.round(Number(v));
  return null;
}

function formatMemberSince(raw: unknown): string {
  let date: Date | null = null;
  if (raw instanceof Date) {
    date = raw;
  } else if (typeof raw === 'string' || typeof raw === 'number') {
    const parsed = new Date(raw);
    date = Number.isNaN(parsed.getTime()) ? null : parsed;
  } else if (
    raw &&
    typeof raw === 'object' &&
    'toDate' in raw &&
    typeof (raw as { toDate?: unknown }).toDate === 'function'
  ) {
    date = (raw as { toDate: () => Date }).toDate();
  }

  const year = date && !Number.isNaN(date.getTime()) ? date.getFullYear() : new Date().getFullYear();
  return `Member since ${year}`;
}

function countInitializedStudents(students: StudentRow[], registrationEmails: string[]): number {
  const registeredEmails = new Set(
    students
      .map(student => normalizeRosterEmail(String(student.email ?? '')))
      .filter(Boolean)
  );
  const invitedNotRegisteredCount = new Set(
    registrationEmails
      .map(normalizeRosterEmail)
      .filter(email => email && !registeredEmails.has(email))
  ).size;

  return students.length + invitedNotRegisteredCount;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PerformanceMetrics {
  avgPercentile: number;
  /** Count of roster whose highest active proficiency is level 3. */
  atLevel3Count: number;
  /** Count of roster whose highest active proficiency is level 2 or 3 (cleared L1). */
  clearedLevel1Count: number;
  rosterTotal: number;
  /** % of roster who started/completed at least one assessment. */
  attemptRate: number;
  avgPercentileChange: number;
  goldPlusChange: number;
  inBronzeChange: number;
  completionChange: number;
}

/** Real headcount, e.g. "3 of 10" - not a fake "per 100" cohort. */
function formatCountOf(part: number, total: number): string {
  if (total <= 0) return '-';
  return `${part} of ${total}`;
}

function formatPct(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '-';
  return `${Math.round(value)}%`;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  change?: { value: number; label: string };
  accent?: string;
  icon?: React.ReactNode;
}
/** Trend under ranking: rank delta (lower rank # = better) or percentile pts vs Q1. */
function HeroRankTrend(props: {
  institutionalRank: number | null;
  rankChangeQ1: number | null;
  avgPercentileChange: number;
  compact?: boolean;
}) {
  const { institutionalRank, rankChangeQ1, avgPercentileChange, compact } = props;
  const hasRank = institutionalRank != null && institutionalRank > 0;
  const mt = compact ? 0.35 : 1;
  const iconSz = compact ? '0.85rem' : '1.05rem';
  const fontSz = compact ? '0.62rem' : '0.72rem';
  const mutedSz = compact ? '0.6rem' : '0.68rem';

  if (hasRank && rankChangeQ1 != null) {
    if (rankChangeQ1 !== 0) {
      const improved = rankChangeQ1 < 0;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: compact ? 'flex-end' : 'center', gap: 0.5, mt }}>
          {improved ? (
            <TrendingUpIcon sx={{ color: '#86efac', fontSize: iconSz }} />
          ) : (
            <TrendingDownIcon sx={{ color: '#fecaca', fontSize: iconSz }} />
          )}
          <Typography sx={{ color: improved ? 'rgba(220,252,231,0.95)' : 'rgba(254,226,226,0.95)', fontSize: fontSz, fontWeight: 600 }}>
            {improved ? `↑ ${Math.abs(rankChangeQ1)}` : `↓ ${rankChangeQ1}`} vs. Q1
          </Typography>
        </Box>
      );
    }
    return (
      <Typography sx={{ mt, fontSize: mutedSz, color: 'rgba(255,255,255,0.65)', fontWeight: 500, textAlign: compact ? 'right' : 'center' }}>
        No change vs. Q1
      </Typography>
    );
  }

  if (avgPercentileChange !== 0) {
    const up = avgPercentileChange > 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: compact ? 'flex-end' : 'center', gap: 0.5, mt }}>
        {up ? (
          <TrendingUpIcon sx={{ color: '#86efac', fontSize: iconSz }} />
        ) : (
          <TrendingDownIcon sx={{ color: '#fecaca', fontSize: iconSz }} />
        )}
        <Typography sx={{ color: up ? 'rgba(220,252,231,0.95)' : 'rgba(254,226,226,0.95)', fontSize: fontSz, fontWeight: 600 }}>
          {up ? `↑ ${avgPercentileChange}` : `↓ ${Math.abs(avgPercentileChange)}`} pts vs. Q1
        </Typography>
      </Box>
    );
  }

  return (
    <Typography sx={{ mt, fontSize: mutedSz, color: 'rgba(255,255,255,0.65)', fontWeight: 500, textAlign: compact ? 'right' : 'center' }}>
      No change vs. Q1
    </Typography>
  );
}

/** Full-width strip above sidebar + main (mockup). */
const InstitutionHeroStrip = React.memo(function InstitutionHeroStrip(props: {
  schoolName: string;
  schoolCity: string;
  schoolBoard: string;
  subscriptionPlan: string;
  memberSinceLabel: string;
  studentCount: number;
  institutionalTierCfg: { label: string; color: string; bg: string; bar: string; emoji: string } | null;
  institutionalRank: number | null;
  rankChangeQ1: number | null;
  performance: PerformanceMetrics;
}) {
  const {
    schoolName,
    schoolCity,
    schoolBoard,
    subscriptionPlan,
    memberSinceLabel,
    studentCount,
    institutionalTierCfg,
    institutionalRank,
    rankChangeQ1,
    performance,
  } = props;

  const tierLabel = institutionalTierCfg?.label ?? '-';
  const rankShort =
    institutionalRank != null && institutionalRank > 0 ? ordinal(institutionalRank) : '-';

  return (
    <Box
      data-tutorial-id="school-dashboard-hero"
      sx={{
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 0,
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        bgcolor: ip.navy,
        pt: { xs: 2.5, md: 3 },
        pb: { xs: 2.5, md: 3 },
        position: 'relative',
        scrollMarginTop: '72px',
      }}
    >
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 1320, mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            columnGap: 2,
          }}
        >
          <Box sx={{ flex: '1 1 auto', minWidth: 0, maxWidth: { sm: 'min(100%, 560px)' } }}>
            <Typography
              sx={{
                color: '#ffffff',
                fontWeight: 700,
                fontSize: { xs: '1.35rem', sm: '1.5rem', md: '1.65rem' },
                lineHeight: 1.2,
                letterSpacing: -0.3,
                pt: { xs: 0, sm: 0.25 },
              }}
            >
              {schoolName || 'Your Institution'}
            </Typography>
            <Typography
              variant="body1"
              component="div"
              sx={{
                color: 'rgba(191, 219, 254, 0.95)',
                fontSize: { xs: '0.8rem', md: '0.875rem' },
                lineHeight: 1.45,
                fontWeight: 400,
                mt: { xs: 0.35, sm: 0.5 },
              }}
            >
              {[schoolCity, schoolBoard || null, subscriptionPlan].filter(Boolean).join(' • ')}
            </Typography>
            <Typography
              variant="body2"
              component="div"
              sx={{
                color: 'rgba(219, 234, 254, 0.78)',
                fontSize: { xs: '0.75rem', md: '0.8125rem' },
                lineHeight: 1.45,
                fontWeight: 500,
                mt: 0.3,
              }}
            >
              {memberSinceLabel} • Active roster: {studentCount.toLocaleString('en-IN')} student{studentCount === 1 ? '' : 's'}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.22)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              flexShrink: 0,
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 260 },
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                flex: '1 1 0',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: { xs: 1.35, sm: 1.5 },
                px: { xs: 1.5, sm: 2 },
                gap: 0.35,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.75, justifyContent: 'center', flexWrap: 'wrap' }}>
                {institutionalTierCfg ? (
                  <Typography
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: 26, sm: 28 },
                      height: { xs: 26, sm: 28 },
                      fontSize: { xs: '1.35rem', sm: '1.5rem' },
                      lineHeight: 1,
                      fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                    }}
                    aria-hidden
                  >
                    {institutionalTierCfg.emoji}
                  </Typography>
                ) : null}
                <Typography
                  sx={{
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: { xs: '1.05rem', sm: '1.15rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {tierLabel}
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.75,
                }}
              >
                Institutional tier
              </Typography>
            </Box>
            <Box
              sx={{
                alignSelf: 'stretch',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
                py: 0.85,
                px: { xs: 0.65, sm: 0.85 },
              }}
              aria-hidden
            >
              <Box
                sx={{
                  width: '1.5px',
                  flex: '1 1 auto',
                  minHeight: 48,
                  bgcolor: 'rgba(255,255,255,0.4)',
                  borderRadius: 0.5,
                }}
              />
            </Box>
            <Box
              sx={{
                flex: '1 1 0',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: { xs: 1.35, sm: 1.5 },
                px: { xs: 1.5, sm: 2 },
                gap: 0.35,
              }}
            >
              <Typography
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: { xs: '1.05rem', sm: '1.15rem' },
                  lineHeight: 1.2,
                }}
              >
                {rankShort}
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.75,
                }}
              >
                School rank
              </Typography>
              <HeroRankTrend
                institutionalRank={institutionalRank}
                rankChangeQ1={rankChangeQ1}
                avgPercentileChange={performance.avgPercentileChange}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

const StatCard: React.FC<StatCardProps> = ({ label, value, description, change, accent = ip.statBlue, icon }) => {
  const empty = value === '-';
  const card = (
    <Card sx={{ bgcolor: ip.cardMutedBg, border: `1px solid ${ip.cardBorder}`, flex: 1, minWidth: 160, borderRadius: 2, boxShadow: 'none', height: '100%' }}>
      <CardContent sx={{ p: '20px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          {icon}
          <Typography variant="caption" sx={{ color: ip.subtext, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}>
            {label}
          </Typography>
          {description ? (
            <HelpOutlineIcon sx={{ fontSize: '0.85rem', color: ip.subtext, opacity: 0.75 }} />
          ) : null}
        </Box>
        {empty ? (
          <Box sx={{ height: 10, width: '58%', bgcolor: alpha(accent, 0.35), borderRadius: 1, my: 1 }} />
        ) : (
          <Typography variant="h4" sx={{ color: accent, fontWeight: 700, lineHeight: 1.1, mb: 0.5 }}>
            {value}
          </Typography>
        )}
        {change && !empty && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            {change.value >= 0
              ? <TrendingUpIcon sx={{ fontSize: '0.8rem', color: '#16a34a' }} />
              : <TrendingDownIcon sx={{ fontSize: '0.8rem', color: '#ef4444' }} />}
            <Typography variant="caption" sx={{ color: change.value >= 0 ? '#16a34a' : '#ef4444', fontSize: '0.7rem' }}>
              {change.value >= 0 ? '+' : ''}{change.value} {change.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (!description) return card;
  return (
    <Tooltip title={description} arrow placement="top" enterDelay={200}>
      <Box sx={{ flex: 1, minWidth: 160, display: 'flex' }}>{card}</Box>
    </Tooltip>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SchoolAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const routeBase = isSchoolAdminPreview ? '/for-schools/preview' : '/school-admin';
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const { setBelowNav } = useSchoolAdminBelowNav();
  const queryClient = useQueryClient();

  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [schoolBoard, setSchoolBoard] = useState('');
  const [schoolTier, setSchoolTier] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState('Standard Subscription');
  const [memberSinceLabel, setMemberSinceLabel] = useState(() => formatMemberSince(null));
  const [studentCount, setStudentCount] = useState(0);
  const [initializedStudentCount, setInitializedStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [performance, setPerformance] = useState<PerformanceMetrics>({
    avgPercentile: 0,
    atLevel3Count: 0,
    clearedLevel1Count: 0,
    rosterTotal: 0,
    attemptRate: 0,
    avgPercentileChange: 0,
    goldPlusChange: 0,
    inBronzeChange: 0,
    completionChange: 0,
  });
  const [proficiencyByExam, setProficiencyByExam] = useState<ExamProficiencySummary[]>([]);
  const [nationalPerfTiers, setNationalPerfTiers] = useState(() => summarizeNationalPerformanceTiers([]));
  const [totalAssessmentsCompleted, setTotalAssessmentsCompleted] = useState(0);
  const [institutionalRank, setInstitutionalRank] = useState<number | null>(null);
  const [rankChangeQ1, setRankChangeQ1] = useState<number | null>(null);
  const [dashboardApiError, setDashboardApiError] = useState<string | null>(null);
  const [latestQuarterly, setLatestQuarterly] = useState<QuarterlyReportListItem | null>(null);
  const [quarterlyS3Configured, setQuarterlyS3Configured] = useState(true);
  const [reportDownloadError, setReportDownloadError] = useState<string | null>(null);

  // ── Data Fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSchoolAdminPreview) {
      setLoading(true);
      setDashboardApiError(null);
      const allStudents = buildGreenfieldPreviewStudentRows();
      setSchoolName(GREENFIELD_SCHOOL_DISPLAY.schoolName);
      setSchoolCity(
        [GREENFIELD_SCHOOL_DISPLAY.city, GREENFIELD_SCHOOL_DISPLAY.state].filter(Boolean).join(', ')
      );
      setSchoolBoard(GREENFIELD_SCHOOL_DISPLAY.board);
      setSchoolTier(parseInstitutionalTierSlug(GREENFIELD_SCHOOL_DISPLAY.institutionalTier));
      setSubscriptionPlan(GREENFIELD_SCHOOL_DISPLAY.subscriptionPlan);
      setMemberSinceLabel('Member since 2026');
      setStudentCount(allStudents.length);
      setInitializedStudentCount(allStudents.length);
      setTotalAssessmentsCompleted(countAssessmentsCompleted(allStudents));
      const tier123 = summarizeSchoolTier123(allStudents);
      setProficiencyByExam(summarizeProficiencyByExam(allStudents, SCHOOL_SCORED_ASSESSMENT_IDS));
      setNationalPerfTiers(summarizeNationalPerformanceTiers(allStudents));
      setInstitutionalRank(GREENFIELD_ANALYTICS_SNAPSHOT.institutional_rank);
      setRankChangeQ1(GREENFIELD_ANALYTICS_SNAPSHOT.rank_change_q1);
      setPerformance({
        avgPercentile: GREENFIELD_ANALYTICS_SNAPSHOT.avg_percentile,
        atLevel3Count: tier123.tier3,
        clearedLevel1Count: tier123.tier2 + tier123.tier3,
        rosterTotal: tier123.total,
        attemptRate: computeAttemptRatePct(allStudents),
        avgPercentileChange: GREENFIELD_ANALYTICS_SNAPSHOT.perf_change_percentile,
        goldPlusChange: 0,
        inBronzeChange: 0,
        completionChange: GREENFIELD_ANALYTICS_SNAPSHOT.perf_change_completion,
      });
      setLatestQuarterly(
        GREENFIELD_QUARTERLY_REPORTS.find(r => r.isLatest) ?? GREENFIELD_QUARTERLY_REPORTS[0] ?? null
      );
      // Preview PDFs use `previewPublicPdfUrl` (public sample asset); signed-URL API is not used on this route.
      setQuarterlyS3Configured(false);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!schoolAdmin?.schoolId) { setLoading(false); return; }
      const schoolId = String(schoolAdmin.schoolId ?? '').trim();
      if (!schoolId) { setLoading(false); return; }

      try {
        setLoading(true);
        setDashboardApiError(null);

        let allStudents: StudentRow[] = [];
        let analyticsData: Record<string, any> = {};
        let registrationEmails: string[] = [];
        let institutionalTier: string | null = null;
        try {
          // Single summary call also covers the school "header" fields (name/city/board/member
          // since/institutional tier) that used to require a separate client-side
          // `getDoc(schools/{id})` - the summary endpoint already reads that same doc
          // server-side for billing/plan data.
          // `ensureQueryData` reads/populates the same React Query cache entries the
          // Students/Analytics/Subscription pages read via `useSchoolAdminSummary` /
          // `useSchoolAdminRoster` - navigating between pages within staleTime reuses the
          // cached result instead of re-fetching.
          const [summaryData, rosterData] = await Promise.all([
            queryClient.ensureQueryData({
              queryKey: queryKeys.schoolAdminSummary(schoolId),
              queryFn: () => getSchoolSummary(schoolId),
              staleTime: SCHOOL_ADMIN_QUERY_STALE_MS,
            }),
            queryClient.ensureQueryData({
              queryKey: queryKeys.schoolAdminRoster(schoolId),
              queryFn: () => getSchoolStudentRoster(schoolId),
              staleTime: SCHOOL_ADMIN_QUERY_STALE_MS,
            }),
          ]);
          allStudents = (rosterData ?? []).filter(isVisibleSchoolRosterStudent);
          analyticsData = summaryData.analytics ?? {};
          institutionalTier = summaryData.institutional_tier ?? null;

          setSchoolName(summaryData.school_name || 'Your School');
          setSchoolCity(summaryData.city || '');
          setSchoolBoard(summaryData.board_label || '');
          setSubscriptionPlan(
            displaySubscriptionPlan(summaryData.subscription_plan || 'Standard Subscription')
          );
          setMemberSinceLabel(formatMemberSince(summaryData.member_since_iso));
        } catch (apiErr) {
          console.error('School summary/roster fetch failed:', apiErr);
          setDashboardApiError(
            'Could not load the student roster from the API (getSchoolSummary/getSchoolStudentRoster). ' +
              'Confirm REACT_APP_GOOGLE_CLOUD_FUNCTIONS points at the same Firebase project you seeded, ' +
              'and that functions are deployed or your local emulator is running with the latest build.'
          );
        }

        try {
          const lists = await getStudentRegistrationEmailLists(schoolId);
          registrationEmails = filterHiddenStaffStudentEmails(lists.emails ?? []);
        } catch (emailErr) {
          console.warn('getStudentRegistrationEmailLists failed:', emailErr);
        }

        try {
          const qr = await getQuarterlyReports(schoolId);
          setQuarterlyS3Configured(qr.s3Configured !== false);
          const sorted = [...(qr.reports ?? [])].sort((a, b) => a.quarterKey.localeCompare(b.quarterKey));
          const pick =
            sorted.find((r) => r.isLatest && r.hasPdf) ??
            [...sorted].reverse().find((r) => r.hasPdf) ??
            null;
          setLatestQuarterly(pick);
        } catch (e) {
          console.warn('getQuarterlyReports:', e);
          setLatestQuarterly(null);
        }

        setSchoolTier(
          parseInstitutionalTierSlug(
            institutionalTier ??
              analyticsData.institutional_tier ??
              analyticsData.institutional_performance_tier
          )
        );

        setTotalAssessmentsCompleted(countAssessmentsCompleted(allStudents));
        setStudentCount(allStudents.length);
        setInitializedStudentCount(countInitializedStudents(allStudents, registrationEmails));

        const tier123 = summarizeSchoolTier123(allStudents);
        setProficiencyByExam(summarizeProficiencyByExam(allStudents, SCHOOL_SCORED_ASSESSMENT_IDS));
        setNationalPerfTiers(summarizeNationalPerformanceTiers(allStudents));

        const rankParsed = parseOptionalInt(
          analyticsData.institutional_rank ?? analyticsData.school_rank ?? analyticsData.national_rank
        );
        setInstitutionalRank(rankParsed != null && rankParsed > 0 ? rankParsed : null);
        const rankDeltaParsed = parseOptionalInt(analyticsData.rank_change_q1 ?? analyticsData.rank_delta_q1);
        setRankChangeQ1(rankDeltaParsed);

        setPerformance({
          avgPercentile: analyticsData.avg_percentile ?? 0,
          atLevel3Count: tier123.tier3,
          clearedLevel1Count: tier123.tier2 + tier123.tier3,
          rosterTotal: tier123.total,
          attemptRate: computeAttemptRatePct(allStudents),
          avgPercentileChange: analyticsData.perf_change_percentile ?? 0,
          goldPlusChange: 0,
          inBronzeChange: 0,
          completionChange: analyticsData.perf_change_completion ?? 0,
        });

      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [schoolAdmin, isSchoolAdminPreview, queryClient]);

  useEffect(() => {
    if (loading) {
      setBelowNav(null);
      return;
    }
    const tierCfg =
      schoolTier != null
        ? TIER_CONFIG[normalizeTierSlugForDashboard(schoolTier)] ?? TIER_CONFIG.explorer
        : null;
    setBelowNav(
      <InstitutionHeroStrip
        schoolName={schoolName}
        schoolCity={schoolCity}
        schoolBoard={schoolBoard}
        subscriptionPlan={subscriptionPlan}
        memberSinceLabel={memberSinceLabel}
        studentCount={studentCount}
        institutionalTierCfg={tierCfg}
        institutionalRank={institutionalRank}
        rankChangeQ1={rankChangeQ1}
        performance={performance}
      />
    );
    return () => setBelowNav(null);
  }, [
    loading,
    setBelowNav,
    schoolName,
    schoolCity,
    schoolBoard,
    subscriptionPlan,
    memberSinceLabel,
    studentCount,
    schoolTier,
    institutionalRank,
    rankChangeQ1,
    performance,
  ]);

  const latestReportAccent = ip.statBlue;
  const latestReportLabel = latestQuarterly?.title ?? 'Institutional report';
  const canDownloadQuarterlyPdf = Boolean(
    latestQuarterly?.hasPdf &&
      latestQuarterly?.quarterKey &&
      (quarterlyS3Configured || Boolean(latestQuarterly.previewPublicPdfUrl))
  );
  const showStudentOnboardingPrompt = !isSchoolAdminPreview && initializedStudentCount < 10;

  const handleLatestReportClick = async () => {
    setReportDownloadError(null);
    if (!latestQuarterly?.hasPdf || !latestQuarterly.quarterKey) {
      return;
    }
    if (isSchoolAdminPreview && latestQuarterly.previewPublicPdfUrl) {
      try {
        await downloadPdfFromUrl(
          latestQuarterly.previewPublicPdfUrl,
          latestQuarterly.pdfFilename || `${latestQuarterly.quarterKey}.pdf`
        );
      } catch (e) {
        setReportDownloadError((e as Error).message ?? 'Download failed.');
      }
      return;
    }
    if (!quarterlyS3Configured) {
      setReportDownloadError(
        'Report downloads are not configured on the server (AWS S3 env vars). PDFs must be available in S3.'
      );
      return;
    }
    try {
      const sid = String(schoolAdmin?.schoolId ?? '').trim();
      if (!sid) {
        setReportDownloadError('School context is missing. Please sign in again.');
        return;
      }
      await downloadQuarterlyReportPdf(latestQuarterly.quarterKey, sid);
    } catch (e) {
      setReportDownloadError((e as Error).message ?? 'Download failed.');
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3,
        backgroundColor: 'rgba(248,250,252,0.92)', backdropFilter: 'blur(8px)',
      }}>
        <Box sx={{ color: ip.navy }}>
          <LoadingSpinner size={48} className="loading-spinner" />
        </Box>
        <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 500 }}>
          Loading institution dashboard…
        </Typography>
      </Box>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: SCHOOL_ADMIN_PAGE_MAX_WIDTH, mx: 'auto', px: { xs: 1.5, md: 2 }, pb: 6, pt: 3 }}>
      <PageTutorial pageKey="school.dashboard" ready={!loading} />
      {dashboardApiError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setDashboardApiError(null)}>
          {dashboardApiError}
        </Alert>
      )}
      {reportDownloadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setReportDownloadError(null)}>
          {reportDownloadError}
        </Alert>
      )}
      {showStudentOnboardingPrompt && (
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            border: '1px solid rgba(245, 158, 11, 0.3)',
            background: 'linear-gradient(135deg, #fff7ed 0%, #eff6ff 52%, #f0fdfa 100%)',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: { xs: -26, sm: 18 },
              top: { xs: -28, sm: -20 },
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'rgba(251, 191, 36, 0.18)',
            }}
            aria-hidden
          />
          <CardContent
            sx={{
              p: { xs: '20px !important', sm: '24px !important' },
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              position: 'relative',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75, maxWidth: 720 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  bgcolor: '#f59e0b',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 10px 18px rgba(245, 158, 11, 0.28)',
                }}
              >
                <PeopleIcon sx={{ fontSize: '2rem' }} />
              </Box>
              <Box>
                <Typography sx={{ color: ip.heading, fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.18rem' }, mb: 0.4 }}>
                  Start strong: onboard your first 10 students
                </Typography>
                <Typography sx={{ color: ip.subtext, fontSize: '0.9rem', lineHeight: 1.55 }}>
                  You only have {initializedStudentCount} students invited or registered. Add students now so your analytics,
                  reports, and school insights become more meaningful.
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(`${routeBase}/students`)}
              sx={{
                bgcolor: ip.navy,
                color: '#fff',
                borderRadius: 2,
                px: 2.5,
                py: 1.15,
                fontWeight: 800,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 8px 18px rgba(16, 64, 139, 0.22)',
                '&:hover': { bgcolor: '#0c356f', boxShadow: '0 10px 22px rgba(16, 64, 139, 0.3)' },
              }}
            >
              Onboard students
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Actions: roster summary + shortcuts ───────────────── */}
      <Box
        data-tutorial-id="school-dashboard-quick-actions"
        sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        <Card
          onClick={() => navigate(`${routeBase}/students`)}
          sx={{
            bgcolor: '#fff',
            border: `1px solid ${ip.cardBorder}`,
            borderRadius: 2,
            boxShadow: 'none',
            cursor: 'pointer',
            transition: 'all 0.18s',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              borderColor: ip.navy,
              bgcolor: ip.cardMutedBg,
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(16,64,139,0.08)',
            },
          }}
        >
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: '20px !important', '&:last-child': { pb: '20px !important' }, gap: 0.85 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: { xs: 1, sm: 1.25 } }}>
                <PeopleIcon sx={{ color: '#f59e0b', fontSize: { xs: '2rem', sm: '2.35rem' }, flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: 0 }}>
                  <Typography
                    variant="h4"
                    sx={{ color: ip.navy, fontWeight: 800, lineHeight: 1.05, fontSize: { xs: '1.75rem', sm: '2rem' } }}
                  >
                    {studentCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: ip.subtext, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem' }}>
                    Students
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ width: '100%', pt: 1, mt: 0.25, borderTop: `1px solid ${ip.cardBorder}`, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ color: ip.subtext, fontSize: '0.68rem', fontWeight: 500 }}>Assessments</Typography>
                <Typography sx={{ color: ip.heading, fontSize: '0.8rem', fontWeight: 700 }}>{totalAssessmentsCompleted}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ color: ip.subtext, fontSize: '0.68rem', fontWeight: 500 }}>Avg. percentile</Typography>
                <Typography sx={{ color: ip.heading, fontSize: '0.8rem', fontWeight: 700 }}>
                  {performance.avgPercentile > 0 ? ordinal(performance.avgPercentile) : '-'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card
          onClick={canDownloadQuarterlyPdf ? () => { void handleLatestReportClick(); } : undefined}
          sx={{
            bgcolor: '#fff',
            border: `1px solid ${ip.cardBorder}`,
            borderRadius: 2,
            boxShadow: 'none',
            cursor: canDownloadQuarterlyPdf ? 'pointer' : 'default',
            transition: 'all 0.18s',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            opacity: latestQuarterly?.hasPdf ? 1 : 0.92,
            '&:hover': canDownloadQuarterlyPdf ? {
              borderColor: latestReportAccent,
              bgcolor: ip.cardMutedBg,
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 16px ${latestReportAccent}22`,
            } : {},
          }}
        >
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: '20px !important', '&:last-child': { pb: '20px !important' }, gap: 0.65 }}>
            <Box sx={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}>
              <MiniBarChartIcon sx={{ color: latestReportAccent, fontSize: '2rem' }} />
            </Box>
            <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 600, textAlign: 'center', fontSize: '0.82rem' }}>
              Latest report
            </Typography>
            <Typography variant="caption" sx={{ color: ip.subtext, textAlign: 'center', fontSize: '0.72rem', lineHeight: 1.35, maxWidth: 260 }}>
              {latestQuarterly?.hasPdf ? latestReportLabel : 'No PDF on file yet. Open Reports after uploading to S3.'}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
                color: latestReportAccent,
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              <FileDownloadIcon sx={{ fontSize: '1.1rem' }} />
              <span>{canDownloadQuarterlyPdf ? 'Download PDF' : 'PDF unavailable'}</span>
            </Box>
          </CardContent>
        </Card>
        {getDashboardQuickActions(routeBase).map(action => (
          <Card
            key={action.key}
            onClick={() => {
              if ('href' in action) {
                window.location.href = action.href;
              } else {
                navigate(action.path);
              }
            }}
            sx={{
              bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2, boxShadow: 'none',
              cursor: 'pointer', transition: 'all 0.18s',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': { borderColor: ip.navy, bgcolor: ip.cardMutedBg, transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(16,64,139,0.08)' },
            }}
          >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: '20px !important', '&:last-child': { pb: '20px !important' }, gap: 0.65 }}>
              <Box sx={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}>{action.icon}</Box>
              <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 600, textAlign: 'center', fontSize: '0.82rem' }}>
                {action.label}
              </Typography>
              <Typography variant="caption" sx={{ color: ip.subtext, textAlign: 'center', fontSize: '0.72rem', lineHeight: 1.35, maxWidth: 260 }}>
                {action.subcaption}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Performance Overview ───────────────────────────────────────────── */}
      <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, mb: 3, borderRadius: 2, boxShadow: 'none' }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 0.5 }}>
            Performance overview
          </Typography>
          <Typography variant="body2" sx={{ color: ip.subtext, mb: 1, lineHeight: 1.55 }}>
            <strong>GYS performance tiers</strong> are the nationwide normed bands from each student&apos;s profile (Explorer through Diamond).
            Separately, <strong>proficiency levels</strong> summarize per-assessment progress as three difficulty bands-useful for where to focus{' '}
            instruction next.
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 600, mb: 0.5 }}>
              National performance tiers (GYS)
            </Typography>
            <NationalPerformanceTierOverview
              counts={nationalPerfTiers.counts}
              total={nationalPerfTiers.total}
              subtitle="Each student is counted once, by their current GYS performance tier from the roster (achievement_tier on each student profile). Same roster as below."
            />
          </Box>
          <Typography variant="body2" sx={{ color: ip.subtext, mb: 1, lineHeight: 1.55 }}>
            Headline stats use each student’s <strong>highest</strong> proficiency level across assessments they have
            started or completed. The bars below break levels out <strong>per exam</strong> for a fairer view. For
            class-level detail, open Analytics.
          </Typography>
          <Typography variant="caption" sx={{ color: ip.subtext, mb: 2, display: 'block', lineHeight: 1.5 }}>
            <strong>Proficiency ladder:</strong> Level 1 / 2 / 3 = foundational / intermediate / advanced difficulty on
            each assessment (not GYS Explorer→Diamond tiers).
          </Typography>
          <Box data-tutorial-id="school-dashboard-stats" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <StatCard
              label="Avg. Percentile"
              value={performance.avgPercentile > 0 ? ordinal(performance.avgPercentile) : '-'}
              description="School-wide average percentile from analytics. Higher means stronger relative standing."
              change={performance.avgPercentileChange !== 0 ? { value: performance.avgPercentileChange, label: 'pts from Q1' } : undefined}
              accent={ip.statBlue}
              icon={<MiniBarChartIcon sx={{ fontSize: '1.15rem', color: ip.statBlue }} />}
            />
            <StatCard
              label="At proficiency Level 3"
              value={formatCountOf(performance.atLevel3Count, performance.rosterTotal)}
              description="Students whose highest proficiency on any started/completed assessment is Level 3."
              change={performance.goldPlusChange !== 0 ? { value: performance.goldPlusChange, label: 'pts from Q1' } : undefined}
              accent="#d97706"
              icon={<StarsIcon sx={{ fontSize: '1.15rem', color: '#f59e0b' }} />}
            />
            <StatCard
              label="Cleared Level 1"
              value={formatCountOf(performance.clearedLevel1Count, performance.rosterTotal)}
              description="Students whose highest proficiency is Level 2 or 3 - they have moved past Level 1 on at least one assessment."
              change={
                performance.inBronzeChange !== 0
                  ? { value: -performance.inBronzeChange, label: 'pts from Q1' }
                  : undefined
              }
              accent="#b45309"
              icon={<PriorityHighIcon sx={{ fontSize: '1.15rem', color: '#b45309' }} />}
            />
            <StatCard
              label="Attempt rate"
              value={formatPct(performance.attemptRate)}
              description="Share of roster students who have started or completed at least one assessment."
              change={performance.completionChange !== 0 ? { value: performance.completionChange, label: 'pts from Q1' } : undefined}
              accent="#16a34a"
              icon={<CheckCircleIcon sx={{ fontSize: '1.15rem', color: '#22c55e' }} />}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 600, mb: 0.5 }}>
              Proficiency by exam (levels 1–3)
            </Typography>
            <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 2, lineHeight: 1.5 }}>
              Each bar counts only students with activity on that exam. Open Analytics for the same breakdown by class.
            </Typography>
            {proficiencyByExam.length === 0 ? (
              <Typography variant="body2" sx={{ color: ip.subtext }}>
                No exam activity yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {proficiencyByExam.map(exam => (
                  <Box key={exam.examId}>
                    <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 600, mb: 0.75 }}>
                      {assessmentDisplayName(exam.examId)}
                      <Typography component="span" variant="caption" sx={{ color: ip.subtext, ml: 1, fontWeight: 500 }}>
                        {exam.total} with activity
                      </Typography>
                    </Typography>
                    <ProficiencyTier123Overview
                      summary={exam}
                      barHeight={22}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ── Upgrade Banner ────────────────────────────────────────────────── */}
      <Box sx={{
        bgcolor: ip.cardMutedBg,
        border: `1px solid ${ip.cardBorder}`,
        borderRadius: 2, p: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <RocketIcon sx={{ color: '#f97316', fontSize: '2.25rem', mt: 0.2, filter: 'drop-shadow(0 2px 4px rgba(249,115,22,0.35))' }} />
          <Box>
            <Typography variant="body1" sx={{ color: ip.heading, fontWeight: 700 }}>
              Upgrade to Premium - ₹5,00,000/yr
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, maxWidth: 500 }}>
              Get consulting-style action plans, dedicated account manager, and a marketing toolkit
              with tier badges for parent communications.
            </Typography>
          </Box>
        </Box>
        <Button
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate(`${routeBase}/subscription`)}
          sx={{
            bgcolor: ip.navy, color: '#ffffff', fontWeight: 700,
            '&:hover': { bgcolor: '#0c356f' }, borderRadius: 1.5, px: 3, py: 1, whiteSpace: 'nowrap',
          }}
        >
          Learn More About Premium
        </Button>
      </Box>
    </Box>
  );
};

export default SchoolAdminDashboardPage;
