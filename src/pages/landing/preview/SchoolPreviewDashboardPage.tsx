import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  FileDownload as FileDownloadIcon,
  Rocket as RocketIcon,
  ArrowForward as ArrowForwardIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  PREVIEW_SCHOOL,
  PREVIEW_STUDENTS,
  PREVIEW_TIER_DISTRIBUTION,
  PREVIEW_PERFORMANCE,
} from '../../../data/schoolPreviewMock';

const TIER_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  diamond:  { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',  label: 'Diamond'  },
  platinum: { color: '#a1a1aa', bg: 'rgba(161,161,170,0.15)', label: 'Platinum' },
  gold:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Gold'     },
  silver:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', label: 'Silver'  },
  bronze:   { color: '#b45309', bg: 'rgba(180,83,9,0.15)',   label: 'Bronze'   },
  explorer: { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', label: 'Explorer' },
};

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

const SchoolPreviewDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const performance = PREVIEW_PERFORMANCE;
  const tierDistribution = PREVIEW_TIER_DISTRIBUTION;
  const previewStudents = PREVIEW_STUDENTS;
  const totalStudentCount = previewStudents.length;
  const activeStudentCount = totalStudentCount;

  const schoolTier = normalizeTier(PREVIEW_SCHOOL.institutionalTier);
  const institutionalTierCfg = TIER_CONFIG[schoolTier] ?? TIER_CONFIG.gold;

  const previewAction = (msg: string) => () => setToast(msg);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 6 }}>
      <Box sx={{
        background: 'linear-gradient(135deg, #0f2a4a 0%, #1a3a5c 40%, #1e293b 100%)',
        borderRadius: 3,
        border: '1px solid rgba(59,130,246,0.25)',
        p: { xs: 2.5, md: 3.5 },
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -60, right: -60, width: 220, height: 220,
          borderRadius: '50%', bgcolor: 'rgba(59,130,246,0.08)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700, mb: 0.5 }}>
              {PREVIEW_SCHOOL.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#93c5fd', mb: 2 }}>
              {[PREVIEW_SCHOOL.city, `UDISE: ${PREVIEW_SCHOOL.udise}`, PREVIEW_SCHOOL.subscriptionPlan].join(' • ')}
            </Typography>
          </Box>
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

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 130, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>{activeStudentCount}</Typography>
            <Typography variant="caption" sx={{ color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem' }}>Active Students</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 130, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>{performance.completionRate}%</Typography>
            <Typography variant="caption" sx={{ color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem' }}>Assessment Completion</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 130, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>{ordinal(performance.avgPercentile)}</Typography>
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

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, mb: 3 }}>
        {[
          { icon: <AssessmentIcon sx={{ color: '#8b5cf6', fontSize: '1.6rem' }} />, label: 'Latest Report', path: '/for-schools/preview/reports' },
          { icon: <FileDownloadIcon sx={{ color: '#10b981', fontSize: '1.6rem' }} />, label: 'Export Data', path: '/for-schools/preview/reports' },
        ].map((action: { icon: React.ReactNode; label: string; path: string }) => (
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

      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 0.5 }}>
            Performance Overview — Q2 2027
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>All assessments, all grades (sample)</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <StatCard
              label="Avg. Percentile"
              value={ordinal(performance.avgPercentile)}
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
              value={`${performance.completionRate}%`}
              change={performance.completionChange !== 0 ? { value: performance.completionChange, label: '% from Q1' } : undefined}
              accent="#10b981"
            />
          </Box>

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
              { icon: <AssessmentIcon sx={{ color: '#8b5cf6', fontSize: '2rem' }} />, title: 'Grade-Level Breakdown', sub: 'Grades 6–12 · All assessments', accent: '#8b5cf6' },
            ].map(r => (
              <Box
                key={r.title}
                sx={{
                  bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 2, p: 2.5,
                  cursor: 'pointer', transition: 'all 0.18s',
                  '&:hover': { border: `1px solid ${r.accent}40`, bgcolor: '#1a2744' },
                }}
                onClick={() => navigate('/for-schools/preview/reports')}
              >
                {r.icon}
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, mt: 1, mb: 0.3 }}>{r.title}</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.5 }}>{r.sub}</Typography>
                <Typography variant="caption" sx={{ color: r.accent, fontWeight: 600 }}>
                  Open reports preview →
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

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
              onClick={previewAction('Full roster management is available to signed-in school admins.')}
              sx={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.8rem' }}
            >
              View All
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Name', 'Grade', 'Tier', 'Percentile', 'Assessments Done', 'Action'].map(h => (
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
                      {student.percentile !== null ? ordinal(student.percentile) : '—'}
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8', py: 1.5 }}>
                      {`${student.assessmentsCompleted} of ${student.totalAssessments}`}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Button
                        endIcon={<ArrowForwardIcon sx={{ fontSize: '0.8rem !important' }} />}
                        onClick={() => navigate('/for-schools/preview/reports')}
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
        </CardContent>
      </Card>

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
              Ready for the real workspace?
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 500 }}>
              Request a demo or register your institution to connect live data, student roster, and exports.
            </Typography>
          </Box>
        </Box>
        <Button
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/for-schools/demo-request')}
          sx={{
            bgcolor: '#8b5cf6', color: '#ffffff', fontWeight: 700,
            '&:hover': { bgcolor: '#7c3aed' }, borderRadius: 1.5, px: 3, py: 1, whiteSpace: 'nowrap',
          }}
        >
          Book a demo
        </Button>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={4500} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast(null)} severity="info" sx={{ width: '100%' }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SchoolPreviewDashboardPage;
