import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
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
import { RootState } from '../../state_data/reducer';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { LoadingSpinner } from '../../components/ui/spinner';
import {
  downloadQuarterlyReportPdf,
  getQuarterlyReports,
  getSchoolDashboard,
  type QuarterlyReportListItem,
  type StudentRow,
} from '../../db/schoolAdminCollection';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { useSchoolAdminBelowNav } from '../../layouts/schoolAdminBelowNavContext';
import { summarizeSchoolTier123, summarizeNationalPerformanceTiers } from '../../utils/schoolAdminTierAnalytics';
import { normalizeTierSlugForDashboard } from '../../utils/achievementTier';
import { displaySubscriptionPlan } from '../../utils/displaySubscriptionPlan';
import { ProficiencyTier123Overview } from '../../components/school_admin/ProficiencyTier123Overview';
import { NationalPerformanceTierOverview } from '../../components/school_admin/NationalPerformanceTierOverview';
import {
  buildGreenfieldPreviewStudentRows,
  GREENFIELD_ANALYTICS_SNAPSHOT,
  GREENFIELD_QUARTERLY_REPORTS,
  GREENFIELD_SCHOOL_DISPLAY,
} from '../../data/schoolPreviewMock';

// ─── Tier config ─────────────────────────────────────────────────────────────
const SCHOOL_ADMIN_HELP_HREF =
  'mailto:talentsearch@argus.ai?subject=' + encodeURIComponent('Argus school portal - help');

type DashboardQuickAction =
  | { key: string; icon: React.ReactElement; label: string; subcaption: string; path: string }
  | { key: string; icon: React.ReactElement; label: string; subcaption: string; href: string };

function getDashboardQuickActions(routeBase: string): DashboardQuickAction[] {
  return [
    {
      key: 'analytics',
      icon: <AnalyticsIcon sx={{ color: '#dc2626', fontSize: '2rem' }} />,
      label: 'Analytics',
      subcaption: 'School-wide scores, grade mix, and proficiency levels across assessments.',
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
    emoji: '✦',
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface PerformanceMetrics {
  avgPercentile: number;
  /** % of students whose weakest active assessment is in proficiency band 3+ (Gold). */
  goldPlusPct: number;
  /** % of students whose weakest active assessment is in proficiency band 1 (Bronze). */
  inBronzePct: number;
  completionRate: number;
  avgPercentileChange: number;
  goldPlusChange: number;
  inBronzeChange: number;
  completionChange: number;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
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
function InstitutionHeroStrip(props: {
  schoolName: string;
  schoolCity: string;
  schoolBoard: string;
  subscriptionPlan: string;
  institutionalTierCfg: { label: string; color: string; bg: string; bar: string; emoji: string };
  institutionalRank: number | null;
  rankChangeQ1: number | null;
  performance: PerformanceMetrics;
}) {
  const {
    schoolName,
    schoolCity,
    schoolBoard,
    subscriptionPlan,
    institutionalTierCfg,
    institutionalRank,
    rankChangeQ1,
    performance,
  } = props;

  const rankShort =
    institutionalRank != null && institutionalRank > 0 ? ordinal(institutionalRank) : '-';

  return (
    <Box
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
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, maxWidth: 1320, mx: 'auto' }}>
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
                <Typography component="span" sx={{ fontSize: { xs: '1.35rem', sm: '1.5rem' }, lineHeight: 1 }} aria-hidden>
                  {institutionalTierCfg.emoji}
                </Typography>
                <Typography
                  sx={{
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: { xs: '1.05rem', sm: '1.15rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {institutionalTierCfg.label}
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
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, accent = ip.statBlue, icon }) => {
  const empty = value === '-';
  return (
    <Card sx={{ bgcolor: ip.cardMutedBg, border: `1px solid ${ip.cardBorder}`, flex: 1, minWidth: 160, borderRadius: 2, boxShadow: 'none' }}>
      <CardContent sx={{ p: '20px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          {icon}
          <Typography variant="caption" sx={{ color: ip.subtext, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}>
            {label}
          </Typography>
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
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SchoolAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const routeBase = isSchoolAdminPreview ? '/for-schools/preview' : '/school-admin';
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const { setBelowNav } = useSchoolAdminBelowNav();

  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [schoolBoard, setSchoolBoard] = useState('');
  const [schoolTier, setSchoolTier] = useState('gold');
  const [subscriptionPlan, setSubscriptionPlan] = useState('Standard Subscription');
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [performance, setPerformance] = useState<PerformanceMetrics>({
    avgPercentile: 0, goldPlusPct: 0, inBronzePct: 0, completionRate: 0,
    avgPercentileChange: 0, goldPlusChange: 0, inBronzeChange: 0, completionChange: 0,
  });
  const [proficiencyTier123, setProficiencyTier123] = useState({ tier1: 0, tier2: 0, tier3: 0, total: 0 });
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
      setSchoolTier(normalizeTierSlugForDashboard(GREENFIELD_SCHOOL_DISPLAY.institutionalTier));
      setSubscriptionPlan(GREENFIELD_SCHOOL_DISPLAY.subscriptionPlan);
      setStudentCount(allStudents.length);
      setTotalAssessmentsCompleted(countAssessmentsCompleted(allStudents));
      const tier123 = summarizeSchoolTier123(allStudents);
      setProficiencyTier123(tier123);
      setNationalPerfTiers(summarizeNationalPerformanceTiers(allStudents));
      const total = allStudents.length || 1;
      setInstitutionalRank(GREENFIELD_ANALYTICS_SNAPSHOT.institutional_rank);
      setRankChangeQ1(GREENFIELD_ANALYTICS_SNAPSHOT.rank_change_q1);
      setPerformance({
        avgPercentile: GREENFIELD_ANALYTICS_SNAPSHOT.avg_percentile,
        goldPlusPct: Math.round((tier123.tier3 / total) * 100),
        inBronzePct: Math.round((tier123.tier1 / total) * 100),
        completionRate: GREENFIELD_ANALYTICS_SNAPSHOT.completion_rate,
        avgPercentileChange: GREENFIELD_ANALYTICS_SNAPSHOT.perf_change_percentile,
        goldPlusChange: 0,
        inBronzeChange: 0,
        completionChange: GREENFIELD_ANALYTICS_SNAPSHOT.perf_change_completion,
      });
      setLatestQuarterly(
        GREENFIELD_QUARTERLY_REPORTS.find(r => r.isLatest) ?? GREENFIELD_QUARTERLY_REPORTS[0] ?? null
      );
      // Preview uses mock metadata (hasPdf) but cannot call the signed-URL API without a real school-admin session.
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

        const schoolSnap = await getDoc(doc(db, 'schools', schoolId));
        const schoolData = schoolSnap.data() ?? {};
        setSchoolName(schoolData.school_name ?? schoolData.name ?? 'Your School');
        setSchoolCity(schoolData.city ?? schoolData.location ?? '');
        setSchoolBoard(
          Array.isArray(schoolData.boards) && schoolData.boards.length > 0
            ? schoolData.boards.join(', ')
            : (schoolData.board ?? schoolData.affiliation ?? '')
        );
        setSchoolTier(normalizeTierSlugForDashboard(schoolData.institutional_tier ?? schoolData.tier ?? 'gold'));
        setSubscriptionPlan(
          displaySubscriptionPlan(schoolData.subscription_plan ?? schoolData.plan ?? 'Standard Subscription')
        );

        let allStudents: StudentRow[] = [];
        let analyticsData: Record<string, any> = {};
        try {
          const dashboardData = await getSchoolDashboard(schoolId);
          allStudents = dashboardData.students ?? [];
          analyticsData = dashboardData.analytics ?? {};
        } catch (apiErr) {
          console.error('getSchoolDashboard failed:', apiErr);
          setDashboardApiError(
            'Could not load the student roster from the API (getSchoolDashboard). ' +
              'Confirm REACT_APP_GOOGLE_CLOUD_FUNCTIONS points at the same Firebase project you seeded, ' +
              'and that functions are deployed or your local emulator is running with the latest build.'
          );
        }

        try {
          const qr = await getQuarterlyReports();
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

        setTotalAssessmentsCompleted(countAssessmentsCompleted(allStudents));
        setStudentCount(allStudents.length);

        const tier123 = summarizeSchoolTier123(allStudents);
        setProficiencyTier123(tier123);
        setNationalPerfTiers(summarizeNationalPerformanceTiers(allStudents));

        const total = allStudents.length || 1;

        const rankParsed = parseOptionalInt(
          analyticsData.institutional_rank ?? analyticsData.school_rank ?? analyticsData.national_rank
        );
        setInstitutionalRank(rankParsed != null && rankParsed > 0 ? rankParsed : null);
        const rankDeltaParsed = parseOptionalInt(analyticsData.rank_change_q1 ?? analyticsData.rank_delta_q1);
        setRankChangeQ1(rankDeltaParsed);

        setPerformance({
          avgPercentile: analyticsData.avg_percentile ?? 0,
          goldPlusPct: Math.round((tier123.tier3 / total) * 100),
          inBronzePct: Math.round((tier123.tier1 / total) * 100),
          completionRate: analyticsData.completion_rate ?? 0,
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
  }, [schoolAdmin, isSchoolAdminPreview]);

  useEffect(() => {
    if (loading) {
      setBelowNav(null);
      return;
    }
    const tierCfg =
      TIER_CONFIG[normalizeTierSlugForDashboard(schoolTier)] ?? TIER_CONFIG.explorer;
    setBelowNav(
      <InstitutionHeroStrip
        schoolName={schoolName}
        schoolCity={schoolCity}
        schoolBoard={schoolBoard}
        subscriptionPlan={subscriptionPlan}
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
    schoolTier,
    institutionalRank,
    rankChangeQ1,
    performance,
  ]);

  const latestReportAccent = ip.statBlue;
  const latestReportLabel = latestQuarterly?.title ?? 'Institutional report';
  const canDownloadQuarterlyPdf = Boolean(
    latestQuarterly?.hasPdf && latestQuarterly?.quarterKey && quarterlyS3Configured
  );

  const handleLatestReportClick = async () => {
    setReportDownloadError(null);
    if (!latestQuarterly?.hasPdf || !latestQuarterly.quarterKey) {
      return;
    }
    if (!quarterlyS3Configured) {
      setReportDownloadError(
        'Report downloads are not configured on the server (AWS S3 env vars). PDFs must be available in S3.'
      );
      return;
    }
    try {
      await downloadQuarterlyReportPdf(latestQuarterly.quarterKey);
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, pb: 6, pt: 3 }}>
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

      {/* ── Quick Actions: roster summary + shortcuts ───────────────── */}
      <Box sx={{
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
            For proficiency, we only look at assessments students have <strong>started or completed</strong>. Their overall proficiency band is the{' '}
            <strong>lowest</strong> level among those-so if they’re strong in one subject but still in Level 1 on another, they count in Level 1
            (that’s the gap to close first).
          </Typography>
          <Typography variant="caption" sx={{ color: ip.subtext, mb: 2, display: 'block', lineHeight: 1.5 }}>
            <strong>Proficiency ladder (not tier names):</strong> Level 1 / 2 / 3 correspond to foundational / intermediate / advanced difficulty on
            each assessment. Everyone on your school roster is included.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <StatCard
              label="Avg. Percentile"
              value={performance.avgPercentile > 0 ? ordinal(performance.avgPercentile) : '-'}
              change={performance.avgPercentileChange !== 0 ? { value: performance.avgPercentileChange, label: 'pts from Q1' } : undefined}
              accent={ip.statBlue}
              icon={<MiniBarChartIcon sx={{ fontSize: '1.15rem', color: ip.statBlue }} />}
            />
            <StatCard
              label="At proficiency Level 3+"
              value={`${performance.goldPlusPct}%`}
              change={performance.goldPlusChange !== 0 ? { value: performance.goldPlusChange, label: '% from Q1' } : undefined}
              accent="#d97706"
              icon={<StarsIcon sx={{ fontSize: '1.15rem', color: '#f59e0b' }} />}
            />
            <StatCard
              label="At proficiency Level 1"
              value={`${performance.inBronzePct}%`}
              change={performance.inBronzeChange !== 0 ? { value: performance.inBronzeChange, label: '% from Q1' } : undefined}
              accent="#b45309"
              icon={<PriorityHighIcon sx={{ fontSize: '1.15rem', color: '#b45309' }} />}
            />
            <StatCard
              label="Completion Rate"
              value={performance.completionRate > 0 ? `${performance.completionRate}%` : '-'}
              change={performance.completionChange !== 0 ? { value: performance.completionChange, label: '% from Q1' } : undefined}
              accent="#16a34a"
              icon={<CheckCircleIcon sx={{ fontSize: '1.15rem', color: '#22c55e' }} />}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 600, mb: 0.5 }}>
              Student proficiency bands (levels 1–3)
            </Typography>
            <ProficiencyTier123Overview
              summary={proficiencyTier123}
              subtitle="Same rule as above: lowest proficiency among that student’s active assessments. Levels 1 / 2 / 3 refer to difficulty bands on each assessment (see legend labels)."
            />
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
