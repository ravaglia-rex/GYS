import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  CardGiftcard as RewardsIcon,
  CurrencyRupee as RupeeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  getPlatformAdminOverview,
  formatInrFromPaise,
  type PlatformAdminOverviewStats,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminPageContainerSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminPageHeader } from './platformAdminComponents';

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  onClick,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <Card
      sx={{
        ...platformAdminCardSx,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': onClick ? { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)', borderColor: '#cbd5e1' } : undefined,
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ color: ip.subtext, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: ip.heading }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: ip.subtext }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ bgcolor: `${accent}18`, color: accent, borderRadius: 2, p: 1.25, display: 'flex' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

const PlatformAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformAdminOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await getPlatformAdminOverview());
    } catch {
      setError('Failed to load overview stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Box sx={{ ...platformAdminPageContainerSx, display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: ip.navy }} />
      </Box>
    );
  }

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Overview"
        subtitle="Platform-wide stats"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {stats && (
        <Card
          sx={{
            ...platformAdminCardSx,
            mb: 2,
            background: `linear-gradient(135deg, ${ip.navy} 0%, #1e3a5f 100%)`,
            borderColor: 'transparent',
          }}
        >
          <CardContent sx={{ py: 2.5, px: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderRadius: 2,
                  p: 1.25,
                  display: 'flex',
                }}
              >
                <RupeeIcon />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.25 }}>
                  Total revenue collected (excl. test schools)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                  {formatInrFromPaise(stats.total_revenue_paise)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {stats && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          <StatCard
            title="Total schools"
            value={stats.schools_total}
            subtitle={`${stats.schools_paid} paid`}
            icon={<SchoolIcon />}
            accent={ip.statBlue}
            onClick={() => navigate('/platform-admin/schools')}
          />
          <StatCard
            title="Pending payments"
            value={stats.schools_pending_payment}
            icon={<PaymentIcon />}
            accent="#d97706"
            onClick={() => navigate('/platform-admin/schools?filter=pending')}
          />
          <StatCard
            title="Total students"
            value={stats.students_total}
            subtitle="Excludes test accounts"
            icon={<PeopleIcon />}
            accent={ip.approveGreen}
            onClick={() => navigate('/platform-admin/students')}
          />
          <StatCard
            title="Pending redemptions"
            value={stats.pending_redemptions}
            icon={<RewardsIcon />}
            accent="#b45309"
            onClick={() => navigate('/platform-admin/rewards')}
          />
        </Box>
      )}
    </Box>
  );
};

export default PlatformAdminDashboardPage;
