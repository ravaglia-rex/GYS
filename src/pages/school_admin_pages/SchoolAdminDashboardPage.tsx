import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  FileDownload as FileDownloadIcon,
  QrCode as QrCodeIcon,
  Rocket as RocketIcon,
  ArrowForward as ArrowForwardIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { LoadingSpinner } from '../../components/ui/spinner';
import { getSchoolQualificationBySchool } from '../../db/schoolAdminCollection';

// ─── Tier config ─────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  diamond:  { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',  label: 'Diamond'  },
  platinum: { color: '#a1a1aa', bg: 'rgba(161,161,170,0.15)', label: 'Platinum' },
  gold:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Gold'     },
  silver:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', label: 'Silver'  },
  bronze:   { color: '#b45309', bg: 'rgba(180,83,9,0.15)',   label: 'Bronze'   },
  explorer: { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', label: 'Explorer' },
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface PendingApproval {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  grade: string | number;
  signedUpDate: string;
}

interface TierCount {
  tier: string;
  count: number;
  pct: number;
}

interface ReportStudent {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  tier: string;
  percentile: number | null;
  examsCompleted: number;
  totalExams: number;
  paymentSource: 'school' | 'parent';
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

interface InvitationStats {
  codesGenerated: number;
  codesUsed: number;
  codesRemaining: number;
  pendingApprovals: number;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; label: string };
  accent?: string;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, change, accent = '#3b82f6' }) => (
  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', flex: 1, minWidth: 160 }}>
    <CardContent sx={{ p: '20px !important' }}>
      <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color: accent, fontWeight: 700, lineHeight: 1.1, mb: 0.5 }}>
        {value}
      </Typography>
      {change && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          {change.value >= 0
            ? <TrendingUpIcon sx={{ fontSize: '0.8rem', color: '#10b981' }} />
            : <TrendingDownIcon sx={{ fontSize: '0.8rem', color: '#ef4444' }} />}
          <Typography variant="caption" sx={{ color: change.value >= 0 ? '#10b981' : '#ef4444', fontSize: '0.7rem' }}>
            {change.value >= 0 ? '+' : ''}{change.value} {change.label}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

// ─── Tier Badge ──────────────────────────────────────────────────────────────
const TierBadge: React.FC<{ tier: string; size?: 'sm' | 'md' }> = ({ tier, size = 'md' }) => {
  const key = normalizeTier(tier);
  const cfg = TIER_CONFIG[key] ?? TIER_CONFIG.explorer;
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
        fontWeight: 600,
        fontSize: size === 'sm' ? '0.65rem' : '0.72rem',
        height: size === 'sm' ? 20 : 24,
      }}
    />
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SchoolAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { schoolAdmin } = useSelector((state: RootState) => state.auth);

  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [schoolBoard, setSchoolBoard] = useState('');
  const [schoolUDISE, setSchoolUDISE] = useState('');
  const [schoolTier, setSchoolTier] = useState('gold');
  const [subscriptionPlan, setSubscriptionPlan] = useState('Standard Subscription');
  const [activeStudentCount, setActiveStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    avgPercentile: 0, goldPlusPct: 0, belowBronzePct: 0, completionRate: 0,
    avgPercentileChange: 0, goldPlusChange: 0, belowBronzeChange: 0, completionChange: 0,
  });
  const [tierDistribution, setTierDistribution] = useState<TierCount[]>([]);
  const [invitationStats, setInvitationStats] = useState<InvitationStats>({
    codesGenerated: 0, codesUsed: 0, codesRemaining: 0, pendingApprovals: 0,
  });
  const [previewStudents, setPreviewStudents] = useState<ReportStudent[]>([]);
  const [totalStudentCount, setTotalStudentCount] = useState(0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleApprove = async (studentId: string) => {
    try {
      await updateDoc(doc(db, 'students', studentId), {
        approval_status: 'approved',
        connection_status: 'connected',
      });
      setPendingApprovals(prev => prev.filter(s => s.id !== studentId));
      setInvitationStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,
      }));
    } catch (err) {
      console.error('Error approving student:', err);
    }
  };

  const handleDecline = async (studentId: string) => {
    try {
      await updateDoc(doc(db, 'students', studentId), {
        approval_status: 'declined',
        connection_status: 'disconnected',
      });
      setPendingApprovals(prev => prev.filter(s => s.id !== studentId));
      setInvitationStats(prev => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,
      }));
    } catch (err) {
      console.error('Error declining student:', err);
    }
  };

  // ── Data Fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!schoolAdmin?.schoolId) { setLoading(false); return; }
      const schoolId = String(schoolAdmin.schoolId ?? '').trim();
      if (!schoolId) { setLoading(false); return; }

      try {
        setLoading(true);

        // School document
        const schoolSnap = await getDoc(doc(db, 'schools', schoolId));
        const schoolData = schoolSnap.data() ?? {};
        setSchoolName(schoolData.school_name ?? schoolData.name ?? 'Your School');
        setSchoolCity(schoolData.city ?? schoolData.location ?? '');
        setSchoolBoard(schoolData.board ?? schoolData.affiliation ?? '');
        setSchoolUDISE(schoolData.udise_code ?? schoolData.udise ?? schoolId);
        setSchoolTier(normalizeTier(schoolData.institutional_tier ?? schoolData.tier ?? 'gold'));
        setSubscriptionPlan(schoolData.subscription_plan ?? schoolData.plan ?? 'Standard Subscription');

        // All connected students
        let studentsSnap = await getDocs(
          query(collection(db, 'students'), where('school_id', '==', schoolId))
        );
        if (studentsSnap.empty) {
          studentsSnap = await getDocs(
            query(collection(db, 'students'), where('schoolId', '==', schoolId))
          );
        }
        const allStudents = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const approvedStudents = allStudents.filter(
          (s: any) => !s.approval_status || s.approval_status === 'approved'
        );
        setActiveStudentCount(approvedStudents.length);
        setTotalStudentCount(approvedStudents.length);

        // Pending approvals
        const pending = allStudents
          .filter((s: any) => s.approval_status === 'pending')
          .slice(0, 10)
          .map((s: any) => ({
            id: s.id,
            firstName: s.first_name ?? s.firstName ?? '',
            lastName: s.last_name ?? s.lastName ?? '',
            email: s.email ?? '',
            grade: s.grade ?? s.class ?? '—',
            signedUpDate: s.created_at
              ? new Date(s.created_at.seconds ? s.created_at.seconds * 1000 : s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—',
          }));
        setPendingApprovals(pending);

        // Tier distribution from approved students
        const tierCounts: Record<string, number> = {};
        approvedStudents.forEach((s: any) => {
          const t = normalizeTier(s.tier ?? s.student_tier ?? s.membership_tier);
          tierCounts[t] = (tierCounts[t] || 0) + 1;
        });
        const total = approvedStudents.length || 1;
        const dist = TIER_ORDER.map(t => ({
          tier: t,
          count: tierCounts[t] ?? 0,
          pct: Math.round(((tierCounts[t] ?? 0) / total) * 100),
        })).filter(t => t.count > 0);
        setTierDistribution(dist);

        // Performance metrics from students
        const percList = approvedStudents
          .map((s: any) => s.percentile ?? s.national_percentile)
          .filter((v: any) => typeof v === 'number') as number[];
        const avgPerc = percList.length > 0 ? Math.round(percList.reduce((a, b) => a + b, 0) / percList.length) : 0;

        const goldPlusCount = approvedStudents.filter((s: any) => {
          const t = normalizeTier(s.tier ?? s.student_tier);
          return ['diamond', 'platinum', 'gold'].includes(t);
        }).length;
        const belowBronzeCount = approvedStudents.filter((s: any) => {
          const t = normalizeTier(s.tier ?? s.student_tier);
          return t === 'explorer';
        }).length;

        let completionRate = 0;
        let qualificationRate = 0;
        try {
          const q = await getSchoolQualificationBySchool(schoolId);
          qualificationRate = q.qualificationRate ?? 0;
          completionRate = (q as any).completionRate ?? q.qualificationRate ?? 0;
        } catch (_) {}

        setPerformance({
          avgPercentile: avgPerc,
          goldPlusPct: Math.round((goldPlusCount / total) * 100),
          belowBronzePct: Math.round((belowBronzeCount / total) * 100),
          completionRate: Math.round(completionRate),
          avgPercentileChange: schoolData.perf_change_percentile ?? 5,
          goldPlusChange: schoolData.perf_change_gold_plus ?? 6,
          belowBronzeChange: schoolData.perf_change_below_bronze ?? -3,
          completionChange: schoolData.perf_change_completion ?? 4,
        });

        // Invitation stats
        const inviteSnap = await getDocs(
          query(collection(db, 'invitation_codes'), where('school_id', '==', schoolId))
        ).catch(() => null);
        const inviteCodes = inviteSnap ? inviteSnap.docs.map(d => d.data() as any) : [];
        const generated = inviteCodes.length || schoolData.codes_generated || 0;
        const used = inviteCodes.filter((c: any) => c.used || c.status === 'used').length || approvedStudents.length;
        setInvitationStats({
          codesGenerated: generated,
          codesUsed: used,
          codesRemaining: Math.max(0, generated - used),
          pendingApprovals: pending.length,
        });

        // Preview students (first 10 approved)
        const preview = approvedStudents.slice(0, 10).map((s: any) => ({
          id: s.id,
          firstName: s.first_name ?? s.firstName ?? '',
          lastName: s.last_name ?? s.lastName ?? '',
          grade: s.grade ?? s.class ?? 0,
          tier: normalizeTier(s.tier ?? s.student_tier ?? s.membership_tier),
          percentile: typeof s.percentile === 'number' ? s.percentile : null,
          examsCompleted: s.exams_completed ?? s.examsCompleted ?? 0,
          totalExams: 5,
          paymentSource: (s.payment_source === 'parent' || s.paid_by === 'parent') ? 'parent' as const : 'school' as const,
        }));
        setPreviewStudents(preview);

      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolAdmin]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3,
        backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)',
      }}>
        <Box sx={{ color: '#93c5fd' }}>
          <LoadingSpinner size={48} className="loading-spinner" />
        </Box>
        <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
          Loading institution dashboard…
        </Typography>
      </Box>
    );
  }

  const institutionalTierCfg = TIER_CONFIG[schoolTier] ?? TIER_CONFIG.gold;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 6 }}>

      {/* ── School Header Banner ─────────────────────────────────────────── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0f2a4a 0%, #1a3a5c 40%, #1e293b 100%)',
        borderRadius: 3,
        border: '1px solid rgba(59,130,246,0.25)',
        p: { xs: 2.5, md: 3.5 },
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative glow */}
        <Box sx={{
          position: 'absolute', top: -60, right: -60, width: 220, height: 220,
          borderRadius: '50%', bgcolor: 'rgba(59,130,246,0.08)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700, mb: 0.5 }}>
              {schoolName || 'Your Institution'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#93c5fd', mb: 2 }}>
              {[schoolCity, schoolUDISE ? `UDISE: ${schoolUDISE}` : null, subscriptionPlan]
                .filter(Boolean).join(' • ')}
            </Typography>
          </Box>
          {/* Institutional Tier Badge */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 90 }}>
            <WorkspacePremiumIcon sx={{ color: institutionalTierCfg.color, fontSize: '2rem', mb: 0.3 }} />
            <Typography sx={{ color: institutionalTierCfg.color, fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>
              {institutionalTierCfg.label}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
              Institutional Tier
            </Typography>
          </Box>
        </Box>

        {/* Stats row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 130, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>{activeStudentCount}</Typography>
            <Typography variant="caption" sx={{ color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem' }}>Active Students</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 130, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>{performance.completionRate > 0 ? `${performance.completionRate}%` : '—'}</Typography>
            <Typography variant="caption" sx={{ color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem' }}>Exam Completion</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 130, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>{performance.avgPercentile > 0 ? ordinal(performance.avgPercentile) : '—'}</Typography>
            <Typography variant="caption" sx={{ color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem' }}>Avg. Percentile</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 130, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>
              {performance.avgPercentileChange >= 0 ? `+${performance.avgPercentileChange}` : `${performance.avgPercentileChange}`}
            </Typography>
            <Typography variant="caption" sx={{ color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem' }}>Pts vs. Q1</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, mb: 3 }}>
        {[
          { icon: <SendIcon sx={{ color: '#3b82f6', fontSize: '1.6rem' }} />, label: 'Send Invitations', path: '/school-admin/invitations' },
          { icon: <AssessmentIcon sx={{ color: '#8b5cf6', fontSize: '1.6rem' }} />, label: 'Latest Report', path: '/school-admin/reports' },
          { icon: <FileDownloadIcon sx={{ color: '#10b981', fontSize: '1.6rem' }} />, label: 'Export Data', path: '/school-admin/analytics' },
          { icon: <QrCodeIcon sx={{ color: '#f59e0b', fontSize: '1.6rem' }} />, label: 'Generate Codes', path: '/school-admin/invitations' },
        ].map(action => (
          <Card
            key={action.label}
            onClick={() => navigate(action.path)}
            sx={{
              bgcolor: '#1e293b', border: '1px solid #334155',
              cursor: 'pointer', transition: 'all 0.18s',
              '&:hover': { border: '1px solid #475569', bgcolor: '#263348', transform: 'translateY(-2px)' },
            }}
          >
            <CardContent sx={{ p: '18px !important', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              {action.icon}
              <Typography variant="body2" sx={{ color: '#e2e8f0', fontWeight: 600, textAlign: 'center', fontSize: '0.8rem' }}>
                {action.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Pending Student Approvals ──────────────────────────────────────── */}
      {pendingApprovals.length > 0 && (
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #f59e0b40', mb: 3 }}>
          <CardContent sx={{ p: '24px !important' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700 }}>
                Pending Student Approvals
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                {pendingApprovals.length} student{pendingApprovals.length !== 1 ? 's' : ''} requesting to connect to your school
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {pendingApprovals.map(student => (
                <Box
                  key={student.id}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
                    bgcolor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 2, px: 2.5, py: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                      {student.firstName} {student.lastName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {student.grade !== '—' ? `Grade ${student.grade}` : ''}{student.grade !== '—' ? ' • ' : ''}
                      Signed up {student.signedUpDate}{student.email ? ` • ${student.email}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleApprove(student.id)}
                      sx={{
                        bgcolor: '#10b981', color: '#ffffff', fontWeight: 600, fontSize: '0.75rem',
                        '&:hover': { bgcolor: '#059669' }, borderRadius: 1.5, px: 2,
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleDecline(student.id)}
                      sx={{
                        borderColor: '#ef4444', color: '#ef4444', fontWeight: 600, fontSize: '0.75rem',
                        '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', borderColor: '#ef4444' }, borderRadius: 1.5, px: 2,
                      }}
                    >
                      Decline
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Performance Overview ───────────────────────────────────────────── */}
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 0.5 }}>
            Performance Overview — Q2 2027
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>All assessments, all grades</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <StatCard
              label="Avg. Percentile"
              value={performance.avgPercentile > 0 ? ordinal(performance.avgPercentile) : '—'}
              change={performance.avgPercentileChange !== 0 ? { value: performance.avgPercentileChange, label: 'pts from Q1' } : undefined}
              accent="#3b82f6"
            />
            <StatCard
              label="Students at Gold+"
              value={`${performance.goldPlusPct}%`}
              change={performance.goldPlusChange !== 0 ? { value: performance.goldPlusChange, label: '% from Q1' } : undefined}
              accent="#f59e0b"
            />
            <StatCard
              label="Below Bronze"
              value={`${performance.belowBronzePct}%`}
              change={performance.belowBronzeChange !== 0 ? { value: performance.belowBronzeChange, label: '% from Q1' } : undefined}
              accent="#ef4444"
            />
            <StatCard
              label="Completion Rate"
              value={performance.completionRate > 0 ? `${performance.completionRate}%` : '—'}
              change={performance.completionChange !== 0 ? { value: performance.completionChange, label: '% from Q1' } : undefined}
              accent="#10b981"
            />
          </Box>

          {/* Tier Distribution Bar */}
          {tierDistribution.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, mb: 1.5 }}>Tier Distribution</Typography>
              <Box sx={{ display: 'flex', borderRadius: 1, overflow: 'hidden', height: 28, mb: 1.5 }}>
                {tierDistribution.map(t => (
                  <Tooltip key={t.tier} title={`${TIER_CONFIG[t.tier]?.label ?? t.tier}: ${t.pct}%`}>
                    <Box sx={{
                      width: `${t.pct}%`, bgcolor: TIER_CONFIG[t.tier]?.color ?? '#6b7280',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: t.pct > 5 ? 'auto' : 0,
                    }}>
                      {t.pct > 5 && (
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                          {t.pct}%
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {tierDistribution.map(t => (
                  <Box key={t.tier} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: TIER_CONFIG[t.tier]?.color ?? '#6b7280' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                      {TIER_CONFIG[t.tier]?.label ?? t.tier} ({t.pct}%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Student Invitations ────────────────────────────────────────────── */}
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 0.5 }}>
            Student Invitations
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>Manage invitation codes and track onboarding</Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {[
              { label: 'Codes Generated', value: invitationStats.codesGenerated, color: '#3b82f6' },
              { label: 'Codes Used', value: invitationStats.codesUsed, color: '#10b981' },
              { label: 'Codes Remaining', value: invitationStats.codesRemaining, color: '#8b5cf6' },
              { label: 'Pending Approvals', value: invitationStats.pendingApprovals, color: '#f59e0b' },
            ].map(s => (
              <Box key={s.label} sx={{ flex: 1, minWidth: 120, textAlign: 'center', bgcolor: '#0f172a', borderRadius: 2, p: 2, border: '1px solid #334155' }}>
                <Typography variant="h4" sx={{ color: s.color, fontWeight: 700 }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/school-admin/invitations')}
              sx={{ bgcolor: '#3b82f6', fontWeight: 600, '&:hover': { bgcolor: '#2563eb' }, borderRadius: 1.5 }}
            >
              Generate New Codes
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/school-admin/invitations')}
              sx={{ borderColor: '#475569', color: '#e2e8f0', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }, borderRadius: 1.5 }}
            >
              Send Bulk Invitations
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/school-admin/invitations')}
              sx={{ borderColor: '#475569', color: '#e2e8f0', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }, borderRadius: 1.5 }}
            >
              Download Code List
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Latest Institutional Reports ───────────────────────────────────── */}
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 0.5 }}>
            Latest Institutional Reports
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>Downloadable performance reports for your school</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
            {[
              { icon: <BarChartIcon sx={{ color: '#3b82f6', fontSize: '2rem' }} />, title: 'Q2 Performance Report', sub: 'Generated 1 Mar 2027', accent: '#3b82f6' },
              { icon: <TrendingUpIcon sx={{ color: '#10b981', fontSize: '2rem' }} />, title: 'Q1 → Q2 Growth Report', sub: 'Generated 1 Mar 2027', accent: '#10b981' },
              { icon: <AssessmentIcon sx={{ color: '#8b5cf6', fontSize: '2rem' }} />, title: 'Grade-Level Breakdown', sub: 'Grades 6–12 · All exams', accent: '#8b5cf6' },
            ].map(r => (
              <Box
                key={r.title}
                sx={{
                  bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 2, p: 2.5,
                  cursor: 'pointer', transition: 'all 0.18s',
                  '&:hover': { border: `1px solid ${r.accent}40`, bgcolor: '#1a2744' },
                }}
                onClick={() => navigate('/school-admin/reports')}
              >
                {r.icon}
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, mt: 1, mb: 0.3 }}>{r.title}</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.5 }}>{r.sub}</Typography>
                <Typography variant="caption" sx={{ color: r.accent, fontWeight: 600 }}>
                  Download .docx →
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* ── Students Preview Table ─────────────────────────────────────────── */}
      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700 }}>Students</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Showing {previewStudents.length} of {totalStudentCount}
              </Typography>
            </Box>
            <Button
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/school-admin/students')}
              sx={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.8rem' }}
            >
              View All
            </Button>
          </Box>

          {previewStudents.length > 0 ? (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Name', 'Grade', 'Tier', 'Percentile', 'Exams Done', 'Action'].map(h => (
                      <TableCell key={h} sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid #334155', py: 1 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewStudents.map((student, idx) => (
                    <TableRow
                      key={student.id}
                      sx={{
                        bgcolor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        '&:hover': { bgcolor: 'rgba(59,130,246,0.05)' },
                        '& td': { borderBottom: '1px solid #1e293b' },
                      }}
                    >
                      <TableCell sx={{ color: '#ffffff', fontWeight: 600, py: 1.5 }}>
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8', py: 1.5 }}>{student.grade || '—'}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <TierBadge tier={student.tier} size="sm" />
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8', py: 1.5 }}>
                        {student.paymentSource === 'school'
                          ? (student.percentile !== null ? ordinal(student.percentile) : '—')
                          : (student.percentile !== null ? ordinal(student.percentile) : '—')
                        }
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8', py: 1.5 }}>
                        {student.paymentSource === 'school'
                          ? `${student.examsCompleted} of ${student.totalExams}`
                          : `${student.examsCompleted} of ${student.totalExams}`
                        }
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Button
                          endIcon={<ArrowForwardIcon sx={{ fontSize: '0.8rem !important' }} />}
                          onClick={() => navigate('/school-admin/students')}
                          sx={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.75rem', p: 0, minWidth: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <PeopleIcon sx={{ color: '#334155', fontSize: '3rem', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>No students connected yet</Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Generate invitation codes to onboard students</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Upgrade Banner ────────────────────────────────────────────────── */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.12) 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: 3, p: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <RocketIcon sx={{ color: '#8b5cf6', fontSize: '2rem', mt: 0.3 }} />
          <Box>
            <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 700 }}>
              Upgrade to Premium — ₹5,00,000/yr
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 500 }}>
              Get consulting-style action plans, dedicated account manager, faculty training workshops,
              and a marketing toolkit with tier badges for parent communications.
            </Typography>
          </Box>
        </Box>
        <Button
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/school-admin/subscription')}
          sx={{
            bgcolor: '#8b5cf6', color: '#ffffff', fontWeight: 700,
            '&:hover': { bgcolor: '#7c3aed' }, borderRadius: 1.5, px: 3, py: 1, whiteSpace: 'nowrap',
          }}
        >
          Learn More About Premium
        </Button>
      </Box>

    </Box>
  );
};

export default SchoolAdminDashboardPage;
