import React, { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import * as Sentry from '@sentry/react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/spinner';
import { useRewards, useInvalidateStudentQueries } from '../../query/hooks';
import { redeemReward, type RedemptionRecord } from '../../db/gamificationCollection';
import { studentPageSubtitleSx, studentPageTitleSx, studentSectionHeadingSx } from '../../styles/studentTypography';
import { auth } from '../../firebase/firebase';

const REWARD_CARD_SX = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 3,
  background: 'rgba(30, 41, 59, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.25s ease',
  '&:hover': {
    borderColor: 'rgba(234, 179, 8, 0.35)',
    transform: 'translateY(-2px)',
  },
} as const;

const TABLE_CARD_SX = {
  borderRadius: 2,
  overflow: 'hidden',
  background: 'rgba(30, 41, 59, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  '& .MuiTableCell-root': {
    color: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  '& .MuiTableCell-head': {
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: 700,
    bgcolor: 'rgba(15, 23, 42, 0.5)',
  },
} as const;

function formatRedemptionDate(val: RedemptionRecord['requested_at']): string {
  if (!val) return '-';
  if (typeof val === 'string') return new Date(val).toLocaleDateString();
  const sec = val.seconds ?? val._seconds;
  if (typeof sec === 'number') return new Date(sec * 1000).toLocaleDateString();
  return '-';
}

const RewardsShopPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useRewards();
  const invalidateStudent = useInvalidateStudentQueries();
  const [confirmItemId, setConfirmItemId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  const catalog = data?.catalog ?? [];
  const balance = data?.argus_coins ?? 0;
  const redemptions = Object.entries(data?.redemptions ?? {}).sort(([, a], [, b]) => {
    const ta = typeof a.requested_at === 'object' && a.requested_at && 'seconds' in a.requested_at
      ? (a.requested_at.seconds ?? 0) : 0;
    const tb = typeof b.requested_at === 'object' && b.requested_at && 'seconds' in b.requested_at
      ? (b.requested_at.seconds ?? 0) : 0;
    return tb - ta;
  });

  const selectedItem = catalog.find((i) => i.id === confirmItemId);

  const handleRedeem = async () => {
    if (!confirmItemId) return;
    setRedeeming(true);
    setRedeemError('');
    try {
      await redeemReward(confirmItemId);
      setRedeemSuccess('Redemption request submitted! We will email your voucher once approved.');
      setConfirmItemId(null);
      const uid = auth.currentUser?.uid;
      if (uid) invalidateStudent(uid);
      void refetch();
    } catch (e) {
      Sentry.captureException(e);
      setRedeemError('Could not redeem. Check your balance and try again.');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: '#eab308', color: '#1e293b', width: 56, height: 56 }}>
            <StorefrontIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={studentPageTitleSx}>
              Rewards Shop
            </Typography>
            <Typography variant="body1" sx={studentPageSubtitleSx}>
              Redeem your Argus Coins for gift cards, vouchers, and profile perks.
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            mb: 3,
            px: 2,
            py: 1.25,
            borderRadius: 999,
            bgcolor: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.45)',
          }}
        >
          <Typography
            component="span"
            sx={{
              color: '#fde68a',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.01em',
            }}
          >
            {balance.toLocaleString()} Argus Coins available
          </Typography>
        </Box>

        {redeemSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setRedeemSuccess('')}>{redeemSuccess}</Alert>}
        {redeemError && <Alert severity="error" sx={{ mb: 2 }}>{redeemError}</Alert>}

        {isLoading ? (
          <Box
            sx={{
              minHeight: { xs: 360, md: 'calc(100vh - 320px)' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              color: 'rgba(255, 255, 255, 0.86)',
              textAlign: 'center',
            }}
          >
            <LoadingSpinner size={72} />
            <Typography sx={{ fontWeight: 600, letterSpacing: '0.02em' }}>
              Loading rewards...
            </Typography>
          </Box>
        ) : (
          <>
        {error && <Alert severity="error" sx={{ mb: 2 }}>Could not load rewards catalog.</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          {catalog.map((item) => (
            <Card key={item.id} sx={REWARD_CARD_SX}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                  {item.brand && (
                    <Chip
                      label={item.brand}
                      size="small"
                      sx={{
                        mb: 1,
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        color: 'rgba(255, 255, 255, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    />
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.65)' }}>
                    {item.description}
                  </Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fde68a', mb: 2 }}>
                    {item.coins_cost.toLocaleString()} coins
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={balance < item.coins_cost}
                    onClick={() => setConfirmItemId(item.id)}
                    sx={{
                      mt: 'auto',
                      bgcolor: '#eab308',
                      color: '#1e293b',
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#ca8a04' },
                      '&.Mui-disabled': {
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        color: 'rgba(255, 255, 255, 0.35)',
                      },
                    }}
                  >
                    {balance < item.coins_cost ? 'Not enough coins' : 'Redeem'}
                  </Button>
                </CardContent>
              </Card>
          ))}
        </Box>

        <Typography variant="h6" sx={{ ...studentSectionHeadingSx, mb: 2 }}>
          Redemption history
        </Typography>
        <Card sx={TABLE_CARD_SX}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Coins</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Code</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {redemptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'rgba(255, 255, 255, 0.55) !important' }}>
                    No redemptions yet  -  start earning coins!
                  </TableCell>
                </TableRow>
              )}
              {redemptions.map(([id, r]) => (
                <TableRow key={id}>
                  <TableCell>{r.item_name}</TableCell>
                  <TableCell>{r.coins_spent}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.status}
                      color={r.status === 'fulfilled' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>{formatRedemptionDate(r.requested_at)}</TableCell>
                  <TableCell>{r.voucher_code ?? (r.status === 'fulfilled' ? 'Check email' : '-')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
          </>
        )}
      </Box>

      <Dialog open={Boolean(confirmItemId)} onClose={() => setConfirmItemId(null)}>
        <DialogTitle>Confirm redemption</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Typography>
              Spend <strong>{selectedItem.coins_cost.toLocaleString()}</strong> Argus Coins for{' '}
              <strong>{selectedItem.name}</strong>? Your request will be reviewed and fulfilled by email.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmItemId(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleRedeem()} disabled={redeeming}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default RewardsShopPage;
