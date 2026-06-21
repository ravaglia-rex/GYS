import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Check as FulfillIcon, Close as RejectIcon } from '@mui/icons-material';
import {
  fulfillPlatformAdminRedemption,
  listPlatformAdminPendingRedemptions,
  type PlatformAdminPendingRedemption,
} from '../../db/platformAdminCollection';
import {
  PlatformAdminPageHeader,
  platformAdminPageContainerSx,
  platformAdminPalette as ip,
  platformAdminPrimaryButtonSx,
  platformAdminTableContainerSx,
  platformAdminTableHeadCellSx,
} from './platformAdminPageStyles';

function formatRequestedAt(entry: PlatformAdminPendingRedemption): string {
  const ts = entry.requested_at;
  if (!ts) return '—';
  const seconds = ts.seconds ?? ts._seconds;
  if (typeof seconds !== 'number') return '—';
  return new Date(seconds * 1000).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PlatformAdminRewardsPage: React.FC = () => {
  const [pending, setPending] = useState<PlatformAdminPendingRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [fulfillDialog, setFulfillDialog] = useState<PlatformAdminPendingRedemption | null>(null);
  const [rejectDialog, setRejectDialog] = useState<PlatformAdminPendingRedemption | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlatformAdminPendingRedemptions();
      setPending(data);
    } catch {
      setError('Failed to load pending redemptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFulfill = async () => {
    if (!fulfillDialog) return;
    const code = voucherCode.trim();
    if (!code) return;
    setActionLoading(fulfillDialog.redemption_id);
    try {
      await fulfillPlatformAdminRedemption({
        redemption_id: fulfillDialog.redemption_id,
        uid: fulfillDialog.uid,
        action: 'fulfill',
        voucher_code: code,
      });
      setFulfillDialog(null);
      setVoucherCode('');
      await load();
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Failed to fulfill redemption.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    setActionLoading(rejectDialog.redemption_id);
    try {
      await fulfillPlatformAdminRedemption({
        redemption_id: rejectDialog.redemption_id,
        uid: rejectDialog.uid,
        action: 'reject',
        admin_note: rejectNote.trim() || undefined,
      });
      setRejectDialog(null);
      setRejectNote('');
      await load();
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Failed to reject redemption.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Rewards queue"
        subtitle="Fulfill or reject student Argus Coins redemptions"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: ip.navy }} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={platformAdminTableContainerSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={platformAdminTableHeadCellSx}>Student</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Reward</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Coins</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Requested</TableCell>
                <TableCell align="right" sx={platformAdminTableHeadCellSx}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pending.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: ip.subtext }}>
                    No pending redemptions — all caught up!
                  </TableCell>
                </TableRow>
              ) : (
                pending.map((row) => (
                  <TableRow key={row.redemption_id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: ip.heading }}>
                        {row.student_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: ip.subtext }}>
                        {row.student_email}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: ip.heading }}>{row.item_name}</TableCell>
                    <TableCell sx={{ color: ip.heading }}>{row.coins_spent}</TableCell>
                    <TableCell sx={{ color: ip.subtext }}>{formatRequestedAt(row)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<FulfillIcon />}
                        disabled={actionLoading !== null}
                        onClick={() => {
                          setFulfillDialog(row);
                          setVoucherCode('');
                        }}
                        sx={{
                          ...platformAdminPrimaryButtonSx,
                          mr: 1,
                          bgcolor: ip.approveGreen,
                          '&:hover': { bgcolor: '#16a34a' },
                          py: 0.5,
                          px: 1.5,
                        }}
                      >
                        Fulfill
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RejectIcon />}
                        disabled={actionLoading !== null}
                        onClick={() => {
                          setRejectDialog(row);
                          setRejectNote('');
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          color: '#b91c1c',
                          borderColor: 'rgba(239, 68, 68, 0.35)',
                          '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.06)', borderColor: '#b91c1c' },
                        }}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(fulfillDialog)} onClose={() => setFulfillDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Fulfill redemption</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {fulfillDialog?.student_name} — {fulfillDialog?.item_name}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Voucher code"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            placeholder="Enter voucher or gift code"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFulfillDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!voucherCode.trim() || actionLoading !== null}
            onClick={handleFulfill}
            sx={{ ...platformAdminPrimaryButtonSx, bgcolor: ip.approveGreen, '&:hover': { bgcolor: '#16a34a' } }}
          >
            Confirm fulfill
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rejectDialog)} onClose={() => setRejectDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject redemption</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Coins will be refunded to {rejectDialog?.student_name}.
          </Typography>
          <TextField
            fullWidth
            label="Reason (optional)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={actionLoading !== null}
            onClick={handleReject}
          >
            Confirm reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlatformAdminRewardsPage;
