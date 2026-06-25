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
  Chip,
} from '@mui/material';
import {
  Check as FulfillIcon,
  Close as RejectIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  MonetizationOn as CoinsIcon,
} from '@mui/icons-material';
import {
  fulfillPlatformAdminRedemption,
  formatInr,
  getPlatformAdminRedemptionHistory,
  listPlatformAdminPendingRedemptions,
  type PlatformAdminPendingRedemption,
  type PlatformAdminRedemptionHistoryEntry,
  type PlatformAdminRedemptionHistorySummary,
} from '../../db/platformAdminCollection';
import {
  platformAdminPageContainerSx,
  platformAdminPrimaryButtonSx,
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminPageHeader, PlatformAdminStatCard, PlatformAdminTableSection } from './platformAdminComponents';

function formatFirestoreTimestamp(
  ts?: { seconds?: number; _seconds?: number } | null
): string {
  if (!ts) return ' — ';
  const seconds = ts.seconds ?? ts._seconds;
  if (typeof seconds !== 'number') return ' — ';
  return new Date(seconds * 1000).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const EMPTY_SUMMARY: PlatformAdminRedemptionHistorySummary = {
  pending_count: 0,
  fulfilled_count: 0,
  rejected_count: 0,
  coins_fulfilled: 0,
  coins_rejected_refunded: 0,
  inr_fulfilled_total: 0,
};

const PlatformAdminRewardsPage: React.FC = () => {
  const [pending, setPending] = useState<PlatformAdminPendingRedemption[]>([]);
  const [summary, setSummary] = useState<PlatformAdminRedemptionHistorySummary>(EMPTY_SUMMARY);
  const [history, setHistory] = useState<PlatformAdminRedemptionHistoryEntry[]>([]);
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
      const [pendingData, historyData] = await Promise.all([
        listPlatformAdminPendingRedemptions(),
        getPlatformAdminRedemptionHistory(),
      ]);
      setPending(pendingData);
      setSummary(historyData.summary);
      setHistory(historyData.history);
    } catch {
      setError('Failed to load rewards data.');
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
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(5, 1fr)' },
              gap: 2,
              mb: 3,
            }}
          >
            <PlatformAdminStatCard
              title="Pending"
              value={summary.pending_count}
              subtitle="Awaiting review"
              icon={<PendingIcon />}
              accent="#b45309"
            />
            <PlatformAdminStatCard
              title="Approved"
              value={summary.fulfilled_count}
              subtitle={`${summary.coins_fulfilled.toLocaleString()} coins spent`}
              icon={<ApprovedIcon />}
              accent={ip.approveGreen}
            />
            <PlatformAdminStatCard
              title="Rejected"
              value={summary.rejected_count}
              subtitle={`${summary.coins_rejected_refunded.toLocaleString()} coins refunded`}
              icon={<RejectedIcon />}
              accent="#b91c1c"
            />
            <PlatformAdminStatCard
              title="Coins fulfilled"
              value={summary.coins_fulfilled.toLocaleString()}
              subtitle="Spent on approved rewards"
              icon={<CoinsIcon />}
              accent={ip.statBlue}
            />
            <PlatformAdminStatCard
              title="Voucher value"
              value={formatInr(summary.inr_fulfilled_total)}
              subtitle="Gift cards only (not digital perks)"
              icon={<CoinsIcon />}
              accent="#7c3aed"
            />
          </Box>

          <PlatformAdminTableSection
            countLabel={`${pending.length} pending redemption${pending.length === 1 ? '' : 's'}`}
          >
            <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
              <Table size="medium" sx={platformAdminTableSx}>
                <TableHead>
                  <TableRow sx={platformAdminTableHeadRowSx}>
                    <TableCell>Student</TableCell>
                    <TableCell>Reward</TableCell>
                    <TableCell>Coins</TableCell>
                    <TableCell>Requested</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5, color: ip.subtext }}>
                        No pending redemptions — all caught up!
                      </TableCell>
                    </TableRow>
                  ) : (
                    pending.map((row) => (
                      <TableRow key={row.redemption_id}>
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
                        <TableCell sx={{ color: ip.subtext }}>
                          {formatFirestoreTimestamp(row.requested_at)}
                        </TableCell>
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
          </PlatformAdminTableSection>

          <Box sx={{ mt: 4 }}>
            <PlatformAdminTableSection
              countLabel={`${history.length} completed action${history.length === 1 ? '' : 's'}`}
            >
              <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                <Table size="medium" sx={platformAdminTableSx}>
                  <TableHead>
                    <TableRow sx={platformAdminTableHeadRowSx}>
                      <TableCell>Action date</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Student account</TableCell>
                      <TableCell>Reward</TableCell>
                      <TableCell>Coins</TableCell>
                      <TableCell>Voucher value</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 5, color: ip.subtext }}>
                          No approved or rejected redemptions yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((row) => (
                        <TableRow key={`${row.uid}-${row.redemption_id}`}>
                          <TableCell sx={{ color: ip.subtext }}>
                            {formatFirestoreTimestamp(row.action_at)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={row.status === 'fulfilled' ? 'Approved' : 'Rejected'}
                              color={row.status === 'fulfilled' ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: ip.heading }}>
                              {row.student_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: ip.subtext, display: 'block' }}>
                              {row.student_email}
                            </Typography>
                            {row.parent_email && (
                              <Typography variant="caption" sx={{ color: ip.subtext, display: 'block' }}>
                                Parent: {row.parent_email}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ color: ip.heading }}>{row.item_name}</TableCell>
                          <TableCell sx={{ color: ip.heading }}>{row.coins_spent}</TableCell>
                          <TableCell sx={{ color: ip.heading }}>
                            {row.face_value_inr > 0 ? formatInr(row.face_value_inr) : '—'}
                          </TableCell>
                          <TableCell sx={{ color: ip.subtext, maxWidth: 220 }}>
                            {row.status === 'fulfilled' && row.voucher_code && (
                              <Typography variant="caption" sx={{ display: 'block', wordBreak: 'break-all' }}>
                                Code: {row.voucher_code}
                              </Typography>
                            )}
                            {row.status === 'rejected' && row.admin_note && (
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                Reason: {row.admin_note}
                              </Typography>
                            )}
                            {row.status === 'rejected' && !row.admin_note && (
                              <Typography variant="caption">Coins refunded</Typography>
                            )}
                            {row.status === 'fulfilled' && !row.voucher_code && (
                              <Typography variant="caption">—</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </PlatformAdminTableSection>
          </Box>
        </>
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
