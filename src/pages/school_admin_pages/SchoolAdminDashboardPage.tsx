import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Rocket as RocketIcon,
  ArrowForward as ArrowForwardIcon,
  Mail as MailIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
  QrCode2 as QrCodeIcon,
  Stars as StarsIcon,
  PriorityHigh as PriorityHighIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as MiniBarChartIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { LoadingSpinner } from '../../components/ui/spinner';
import { getSchoolDashboard, type StudentRow } from '../../db/schoolAdminCollection';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { useSchoolAdminBelowNav } from '../../layouts/schoolAdminBelowNavContext';

// ─── Tier config ─────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { color: string; bg: string; label: string; bar: string }> = {
  diamond:  { color: '#0f766e', bg: 'rgba(13,148,136,0.12)',  label: 'Diamond',  bar: ip.tierBar.diamond },
  platinum: { color: '#475569', bg: 'rgba(71,85,105,0.12)', label: 'Platinum', bar: ip.tierBar.platinum },
  gold:     { color: '#d97706', bg: 'rgba(245,158,11,0.12)', label: 'Gold',     bar: ip.tierBar.gold },
  silver:   { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: 'Silver',  bar: ip.tierBar.silver },
  bronze:   { color: '#9a3412', bg: 'rgba(194,65,12,0.12)',   label: 'Bronze',   bar: ip.tierBar.bronze },
  explorer: { color: '#6b7280', bg: 'rgba(209,213,219,0.35)', label: 'Explorer', bar: ip.tierBar.explorer },
};

const TIER_ORDER = ['diamond', 'platinum', 'gold', 'silver', 'bronze', 'explorer'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeTier(raw: unknown): string {
  if (!raw) return 'explorer';
  return String(raw).toLowerCase().replace(/\s+/g, '');
}

function ordinal(n: number): string {
  if (n <= 0) return '—';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatStudentDate(createdAt: unknown): string {
  if (!createdAt || typeof createdAt !== 'object') return '—';
  const sec = (createdAt as { seconds?: number }).seconds;
  if (typeof sec === 'number') return new Date(sec * 1000).toLocaleDateString();
  return '—';
}

/** Count completed assessment slots across all registered students at the school. */
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
interface TierCount {
  tier: string;
  count: number;
  pct: number;
}

interface PerformanceMetrics {
  avgPercentile: number;
  goldPlusPct: number;
  belowBronzePct: number;
  completionRate: number;
  avgPercentileChange: number;
  goldPlusChange: number;
  belowBronzeChange: number;
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
}) {
  const { institutionalRank, rankChangeQ1, avgPercentileChange } = props;
  const hasRank = institutionalRank != null && institutionalRank > 0;

  if (hasRank && rankChangeQ1 != null) {
    if (rankChangeQ1 !== 0) {
      const improved = rankChangeQ1 < 0;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
          {improved ? (
            <TrendingUpIcon sx={{ color: '#86efac', fontSize: '1.05rem' }} />
          ) : (
            <TrendingDownIcon sx={{ color: '#fecaca', fontSize: '1.05rem' }} />
          )}
          <Typography sx={{ color: improved ? 'rgba(220,252,231,0.95)' : 'rgba(254,226,226,0.95)', fontSize: '0.72rem', fontWeight: 600 }}>
            {improved ? `↑ ${Math.abs(rankChangeQ1)}` : `↓ ${rankChangeQ1}`} vs. Q1
          </Typography>
        </Box>
      );
    }
    return (
      <Typography sx={{ mt: 1, fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
        No change vs. Q1
      </Typography>
    );
  }

  if (avgPercentileChange !== 0) {
    const up = avgPercentileChange > 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
        {up ? (
          <TrendingUpIcon sx={{ color: '#86efac', fontSize: '1.05rem' }} />
        ) : (
          <TrendingDownIcon sx={{ color: '#fecaca', fontSize: '1.05rem' }} />
        )}
        <Typography sx={{ color: up ? 'rgba(220,252,231,0.95)' : 'rgba(254,226,226,0.95)', fontSize: '0.72rem', fontWeight: 600 }}>
          {up ? `↑ ${avgPercentileChange}` : `↓ ${Math.abs(avgPercentileChange)}`} pts vs. Q1
        </Typography>
      </Box>
    );
  }

  return (
    <Typography sx={{ mt: 1, fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
      No change vs. Q1
    </Typography>
  );
}

/** Full-width strip above sidebar + main (mockup). */
function InstitutionHeroStrip(props: {
  schoolName: string;
  schoolCity: string;
  schoolBoard: string;
  schoolUDISE: string;
  subscriptionPlan: string;
  institutionalTierCfg: { label: string; color: string; bg: string; bar: string };
  activeStudentCount: number;
  totalAssessmentsCompleted: number;
  institutionalRank: number | null;
  rankChangeQ1: number | null;
  performance: PerformanceMetrics;
}) {
  const {
    schoolName,
    schoolCity,
    schoolBoard,
    schoolUDISE,
    subscriptionPlan,
    institutionalTierCfg,
    activeStudentCount,
    totalAssessmentsCompleted,
    institutionalRank,
    rankChangeQ1,
    performance,
  } = props;

  const rankDisplay =
    institutionalRank != null && institutionalRank > 0 ? ordinal(institutionalRank) : '—';

  return (
    <Box
      sx={{
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 0,
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        bgcolor: ip.navy,
        pt: { xs: 3, md: 4 },
        pb: { xs: 3, md: 4 },
        position: 'relative',
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, maxWidth: 1320, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2.5 }}>
          <Box sx={{ flex: '1 1 280px', minWidth: 0 }}>
            <Typography
              sx={{
                color: '#ffffff',
                fontWeight: 700,
                fontSize: { xs: '1.5rem', md: '1.85rem' },
                lineHeight: 1.2,
                mb: 1,
                letterSpacing: -0.3,
              }}
            >
              {schoolName || 'Your Institution'}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(191, 219, 254, 0.95)', fontSize: { xs: '0.875rem', md: '0.95rem' }, lineHeight: 1.5, fontWeight: 400 }}>
              {[schoolCity, schoolBoard || null, schoolUDISE ? `UDISE: ${schoolUDISE}` : null, subscriptionPlan]
                .filter(Boolean)
                .join(' • ')}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1.75,
              px: 2.5,
              py: 1.75,
              borderRadius: 2,
              bgcolor: 'rgba(147, 197, 253, 0.2)',
              border: '1px solid rgba(186, 230, 253, 0.45)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            }}
          >
            <Typography component="span" sx={{ fontSize: '2.25rem', lineHeight: 1 }} aria-hidden>
              🥇
            </Typography>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.15 }}>
                {institutionalTierCfg.label}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.75rem', fontWeight: 500, mt: 0.35 }}>
                Institutional Tier
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3 }}>
          {[
            {
              node: (
                <>
                  <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: { xs: '1.65rem', md: '1.85rem' }, lineHeight: 1.1 }}>
                    {activeStudentCount}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.88)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem', fontWeight: 600, mt: 1 }}>
                    Active Students
                  </Typography>
                </>
              ),
            },
            {
              node: (
                <>
                  <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: { xs: '1.65rem', md: '1.85rem' }, lineHeight: 1.1 }}>
                    {totalAssessmentsCompleted}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.88)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem', fontWeight: 600, mt: 1 }}>
                    Assessments Completed
                  </Typography>
                </>
              ),
            },
            {
              node: (
                <>
                  <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: { xs: '1.65rem', md: '1.85rem' }, lineHeight: 1.1 }}>
                    {performance.avgPercentile > 0 ? ordinal(performance.avgPercentile) : '—'}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.88)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem', fontWeight: 600, mt: 1 }}>
                    Avg. Percentile
                  </Typography>
                </>
              ),
            },
            {
              node: (
                <>
                  <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: { xs: '1.65rem', md: '1.85rem' }, lineHeight: 1.1 }}>
                    {rankDisplay}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.88)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem', fontWeight: 600, mt: 1 }}>
                    School Rank
                  </Typography>
                  <HeroRankTrend
                    institutionalRank={institutionalRank}
                    rankChangeQ1={rankChangeQ1}
                    avgPercentileChange={performance.avgPercentileChange}
                  />
                </>
              ),
            },
          ].map((stat, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                minWidth: { xs: 'calc(50% - 8px)', sm: 140, md: 160 },
                bgcolor: 'rgba(255,255,255,0.14)',
                borderRadius: 2,
                p: 2.25,
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(6px)',
              }}
            >
              {stat.node}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

const StatCard: React.FC<StatCardProps> = ({ label, value, change, accent = ip.statBlue, icon }) => {
  const empty = value === '—';
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
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);
  const { setBelowNav } = useSchoolAdminBelowNav();

  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [schoolBoard, setSchoolBoard] = useState('');
  const [schoolUDISE, setSchoolUDISE] = useState('');
  const [schoolTier, setSchoolTier] = useState('gold');
  const [subscriptionPlan, setSubscriptionPlan] = useState('Standard Subscription');
  const [activeStudentCount, setActiveStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [performance, setPerformance] = useState<PerformanceMetrics>({
    avgPercentile: 0, goldPlusPct: 0, belowBronzePct: 0, completionRate: 0,
    avgPercentileChange: 0, goldPlusChange: 0, belowBronzeChange: 0, completionChange: 0,
  });
  const [tierDistribution, setTierDistribution] = useState<TierCount[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<(StudentRow & { email?: string })[]>([]);
  const [totalAssessmentsCompleted, setTotalAssessmentsCompleted] = useState(0);
  const [institutionalRank, setInstitutionalRank] = useState<number | null>(null);
  const [rankChangeQ1, setRankChangeQ1] = useState<number | null>(null);

  // ── Data Fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!schoolAdmin?.schoolId) { setLoading(false); return; }
      const schoolId = String(schoolAdmin.schoolId ?? '').trim();
      if (!schoolId) { setLoading(false); return; }

      try {
        setLoading(true);

        // School document (direct read — schools collection is unchanged)
        const [schoolSnap, dashboardData] = await Promise.all([
          getDoc(doc(db, 'schools', schoolId)),
          getSchoolDashboard(schoolId),
        ]);

        const schoolData = schoolSnap.data() ?? {};
        setSchoolName(schoolData.school_name ?? schoolData.name ?? 'Your School');
        setSchoolCity(schoolData.city ?? schoolData.location ?? '');
        setSchoolBoard(schoolData.board ?? schoolData.affiliation ?? '');
        setSchoolUDISE(schoolData.udise_code ?? schoolData.udise ?? schoolId);
        setSchoolTier(normalizeTier(schoolData.institutional_tier ?? schoolData.tier ?? 'gold'));
        setSubscriptionPlan(schoolData.subscription_plan ?? schoolData.plan ?? 'Standard Subscription');

        const allStudents = dashboardData.students;
        setTotalAssessmentsCompleted(countAssessmentsCompleted(allStudents));

        const approvedStudents = allStudents.filter(
          s => !s.approval_status || s.approval_status === 'approved'
        );
        setActiveStudentCount(approvedStudents.length);

        const pendingRaw = allStudents.filter(s => s.approval_status === 'pending');
        const enrichedPending = await Promise.all(
          pendingRaw.slice(0, 12).map(async (s) => {
            try {
              const snap = await getDoc(doc(db, 'student_email_mappings', s.uid));
              const email = (snap.exists() ? (snap.data() as { email?: string })?.email : '') || '';
              return { ...s, email };
            } catch {
              return { ...s, email: '' };
            }
          })
        );
        setPendingApprovals(enrichedPending);

        // Tier distribution from achievement_tier on approved students
        const tierCounts: Record<string, number> = {};
        approvedStudents.forEach(s => {
          const t = normalizeTier(s.achievement_tier ?? 'explorer');
          tierCounts[t] = (tierCounts[t] || 0) + 1;
        });
        const total = approvedStudents.length || 1;
        const dist = TIER_ORDER.map(t => ({
          tier: t,
          count: tierCounts[t] ?? 0,
          pct: Math.round(((tierCounts[t] ?? 0) / total) * 100),
        })).filter(t => t.count > 0);
        setTierDistribution(dist);

        // Performance metrics
        const goldPlusCount = approvedStudents.filter(s => {
          const t = normalizeTier(s.achievement_tier ?? 'explorer');
          return ['diamond', 'platinum', 'gold'].includes(t);
        }).length;
        const belowBronzeCount = approvedStudents.filter(s =>
          normalizeTier(s.achievement_tier ?? 'explorer') === 'explorer'
        ).length;

        const analyticsData = dashboardData.analytics ?? {};
        const rankParsed = parseOptionalInt(
          analyticsData.institutional_rank ?? analyticsData.school_rank ?? analyticsData.national_rank
        );
        setInstitutionalRank(rankParsed != null && rankParsed > 0 ? rankParsed : null);
        const rankDeltaParsed = parseOptionalInt(analyticsData.rank_change_q1 ?? analyticsData.rank_delta_q1);
        setRankChangeQ1(rankDeltaParsed);

        setPerformance({
          avgPercentile: analyticsData.avg_percentile ?? 0,
          goldPlusPct: Math.round((goldPlusCount / total) * 100),
          belowBronzePct: Math.round((belowBronzeCount / total) * 100),
          completionRate: analyticsData.completion_rate ?? 0,
          avgPercentileChange: analyticsData.perf_change_percentile ?? 0,
          goldPlusChange: analyticsData.perf_change_gold_plus ?? 0,
          belowBronzeChange: analyticsData.perf_change_below_bronze ?? 0,
          completionChange: analyticsData.perf_change_completion ?? 0,
        });

      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolAdmin]);

  useEffect(() => {
    if (loading) {
      setBelowNav(null);
      return;
    }
    const tierCfg = TIER_CONFIG[normalizeTier(schoolTier)] ?? TIER_CONFIG.gold;
    setBelowNav(
      <InstitutionHeroStrip
        schoolName={schoolName}
        schoolCity={schoolCity}
        schoolBoard={schoolBoard}
        schoolUDISE={schoolUDISE}
        subscriptionPlan={subscriptionPlan}
        institutionalTierCfg={tierCfg}
        activeStudentCount={activeStudentCount}
        totalAssessmentsCompleted={totalAssessmentsCompleted}
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
    schoolUDISE,
    subscriptionPlan,
    schoolTier,
    activeStudentCount,
    totalAssessmentsCompleted,
    institutionalRank,
    rankChangeQ1,
    performance.avgPercentile,
    performance.goldPlusPct,
    performance.belowBronzePct,
    performance.completionRate,
    performance.avgPercentileChange,
    performance.goldPlusChange,
    performance.belowBronzeChange,
    performance.completionChange,
  ]);

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

      {/* ── Quick Actions (wireframe: 4 tiles) ───────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        {[
          { icon: <MailIcon sx={{ color: '#6366f1', fontSize: '2rem' }} />, label: 'Send Invitations', path: '/school-admin/invitations' },
          { icon: <DescriptionIcon sx={{ color: '#8b5cf6', fontSize: '2rem' }} />, label: 'Latest Report', path: '/school-admin/reports' },
          { icon: <TableChartIcon sx={{ color: '#10b981', fontSize: '2rem' }} />, label: 'Export Data', path: '/school-admin/analytics' },
          { icon: <QrCodeIcon sx={{ color: '#f59e0b', fontSize: '2rem' }} />, label: 'Generate Codes', path: '/school-admin/invitations' },
        ].map(action => (
          <Card
            key={action.label}
            onClick={() => navigate(action.path)}
            sx={{
              bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2, boxShadow: 'none',
              cursor: 'pointer', transition: 'all 0.18s',
              '&:hover': { borderColor: ip.navy, bgcolor: ip.cardMutedBg, transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(16,64,139,0.08)' },
            }}
          >
            <CardContent sx={{ p: '20px !important', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}>{action.icon}</Box>
              <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 600, textAlign: 'center', fontSize: '0.82rem' }}>
                {action.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Pending Student Approvals ─────────────────────────────────────── */}
      <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, mb: 3, borderRadius: 2, boxShadow: 'none' }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700 }}>
              Pending Student Approvals
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext }}>
              {pendingApprovals.length} student{pendingApprovals.length === 1 ? '' : 's'}
            </Typography>
          </Box>
          {pendingApprovals.length > 0 ? (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Student', 'Grade', 'Signed up', 'Email', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ color: ip.subtext, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: `1px solid ${ip.cardBorder}`, py: 1.25 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingApprovals.map((row, idx) => (
                    <TableRow
                      key={row.uid}
                      sx={{
                        bgcolor: idx % 2 === 0 ? 'transparent' : ip.cardMutedBg,
                        '& td': { borderBottom: `1px solid ${ip.cardBorder}` },
                      }}
                    >
                      <TableCell sx={{ color: ip.heading, fontWeight: 600, py: 1.5 }}>
                        {row.first_name} {row.last_name}
                      </TableCell>
                      <TableCell sx={{ color: ip.subtext, py: 1.5 }}>{row.grade || '—'}</TableCell>
                      <TableCell sx={{ color: ip.subtext, py: 1.5 }}>{formatStudentDate(row.created_at)}</TableCell>
                      <TableCell sx={{ color: ip.subtext, py: 1.5, fontSize: '0.8rem' }}>{row.email || '—'}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate('/school-admin/students?pending=1')}
                            sx={{ bgcolor: ip.approveGreen, fontWeight: 700, fontSize: '0.72rem', textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#16a34a', boxShadow: 'none' } }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate('/school-admin/students?pending=1')}
                            sx={{ borderColor: ip.cardBorder, color: ip.declineText, bgcolor: ip.declineGray, fontWeight: 600, fontSize: '0.72rem', textTransform: 'none', '&:hover': { borderColor: '#d1d5db', bgcolor: '#e5e7eb' } }}
                          >
                            Decline
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4, bgcolor: ip.cardMutedBg, borderRadius: 2, border: `1px dashed ${ip.cardBorder}` }}>
              <PeopleIcon sx={{ color: '#3b82f6', fontSize: '2.75rem', mb: 1, opacity: 0.85 }} />
              <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 600 }}>No pending requests</Typography>
              <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mt: 0.5 }}>
                New student sign-ups awaiting your review will appear here
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Performance Overview ───────────────────────────────────────────── */}
      <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, mb: 3, borderRadius: 2, boxShadow: 'none' }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 0.5 }}>
            Performance Overview — Q2 2027
          </Typography>
          <Typography variant="body2" sx={{ color: ip.subtext, mb: 3 }}>All assessments, all grades</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <StatCard
              label="Avg. Percentile"
              value={performance.avgPercentile > 0 ? ordinal(performance.avgPercentile) : '—'}
              change={performance.avgPercentileChange !== 0 ? { value: performance.avgPercentileChange, label: 'pts from Q1' } : undefined}
              accent={ip.statBlue}
              icon={<MiniBarChartIcon sx={{ fontSize: '1.15rem', color: ip.statBlue }} />}
            />
            <StatCard
              label="Students at Gold+"
              value={`${performance.goldPlusPct}%`}
              change={performance.goldPlusChange !== 0 ? { value: performance.goldPlusChange, label: '% from Q1' } : undefined}
              accent="#d97706"
              icon={<StarsIcon sx={{ fontSize: '1.15rem', color: '#f59e0b' }} />}
            />
            <StatCard
              label="Below Bronze"
              value={`${performance.belowBronzePct}%`}
              change={performance.belowBronzeChange !== 0 ? { value: performance.belowBronzeChange, label: '% from Q1' } : undefined}
              accent="#dc2626"
              icon={<PriorityHighIcon sx={{ fontSize: '1.15rem', color: '#ef4444' }} />}
            />
            <StatCard
              label="Completion Rate"
              value={performance.completionRate > 0 ? `${performance.completionRate}%` : '—'}
              change={performance.completionChange !== 0 ? { value: performance.completionChange, label: '% from Q1' } : undefined}
              accent="#16a34a"
              icon={<CheckCircleIcon sx={{ fontSize: '1.15rem', color: '#22c55e' }} />}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 600, mb: 1.5 }}>Tier Distribution</Typography>
            <Box sx={{ display: 'flex', borderRadius: 1, overflow: 'hidden', height: 28, mb: 1.5, border: `1px solid ${ip.cardBorder}` }}>
              {tierDistribution.length > 0 ? (
                tierDistribution.map(t => (
                  <Tooltip key={t.tier} title={`${TIER_CONFIG[t.tier]?.label ?? t.tier}: ${t.pct}%`}>
                    <Box sx={{
                      width: `${t.pct}%`, bgcolor: TIER_CONFIG[t.tier]?.bar ?? '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: t.pct > 5 ? 'auto' : 0,
                    }}>
                      {t.pct > 5 && (
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                          {t.pct}%
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                ))
              ) : (
                TIER_ORDER.map(t => (
                  <Box
                    key={t}
                    sx={{
                      flex: 1,
                      bgcolor: alpha(TIER_CONFIG[t]?.bar ?? '#94a3b8', 0.4),
                      minWidth: 8,
                      borderRight: `1px solid ${alpha('#fff', 0.35)}`,
                      '&:last-of-type': { borderRight: 'none' },
                    }}
                  />
                ))
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {TIER_ORDER.map(t => {
                const row = tierDistribution.find(x => x.tier === t);
                const pct = row?.pct ?? 0;
                return (
                  <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: TIER_CONFIG[t]?.bar ?? '#94a3b8' }} />
                    <Typography variant="caption" sx={{ color: ip.subtext, fontSize: '0.7rem' }}>
                      {TIER_CONFIG[t]?.label ?? t} ({pct}%)
                    </Typography>
                  </Box>
                );
              })}
            </Box>
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
              Upgrade to Premium — ₹5,00,000/yr
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, maxWidth: 500 }}>
              Get consulting-style action plans, dedicated account manager, faculty training workshops,
              and a marketing toolkit with tier badges for parent communications.
            </Typography>
          </Box>
        </Box>
        <Button
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/school-admin/subscription')}
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
