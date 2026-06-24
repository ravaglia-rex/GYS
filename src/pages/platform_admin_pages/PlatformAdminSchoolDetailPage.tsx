import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  formatDate,
  formatInr,
  formatInrFromPaise,
  getPlatformAdminSchool,
  markPlatformAdminSchoolPaid,
  PLATFORM_ADMIN_PAYMENT_METHOD_LABELS,
  type PlatformAdminMarkSchoolPaidMethod,
  type PlatformAdminPaymentHistoryItem,
  type PlatformAdminSchoolDetail,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminPageContainerSx,
  platformAdminDialogFieldLabelSx,
  platformAdminDialogPaperSx,
  platformAdminDialogSelectSx,
  platformAdminDialogTextFieldSx,
  platformAdminPrimaryButtonSx,
  platformAdminSelectMenuPaperSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  PlatformAdminChip,
  formatPaymentStatusLabel,
  paymentStatusChipTone,
} from './platformAdminComponents';
import {
  formatPlanAmountInrInput,
  resolveSchoolPlanPriceInr,
} from '../../utils/schoolRegistrationPlans';
import { isPlatformAdminTestSchool } from './platformAdminTestSchools';

const PAYMENT_METHODS = Object.keys(PLATFORM_ADMIN_PAYMENT_METHOD_LABELS) as PlatformAdminMarkSchoolPaidMethod[];

function todayDateInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dateInputToIso(dateValue: string): string {
  if (!dateValue) return '';
  const d = new Date(`${dateValue}T12:00:00`);
  return Number.isFinite(d.getTime()) ? d.toISOString() : '';
}

function defaultMarkPaidAmountInr(school: PlatformAdminSchoolDetail): string {
  return formatPlanAmountInrInput(resolveSchoolPlanPriceInr(school));
}

function defaultPaymentMethod(school: PlatformAdminSchoolDetail): PlatformAdminMarkSchoolPaidMethod {
  const raw = (school.payment_method ?? '').toLowerCase();
  if (raw === 'already_paid') return 'already_paid';
  if (raw === 'wire' || school.pending_wire_capture) return 'wire';
  if (raw === 'neft_rtgs' || raw === 'upi' || raw === 'cheque' || raw === 'cash' || raw === 'other') {
    return raw as PlatformAdminMarkSchoolPaidMethod;
  }
  return 'wire';
}

const PlatformAdminSchoolDetailPage: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState<PlatformAdminSchoolDetail | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PlatformAdminPaymentHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PlatformAdminMarkSchoolPaidMethod>('wire');
  const [paidDate, setPaidDate] = useState(todayDateInputValue());
  const [amountInr, setAmountInr] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPlatformAdminSchool(schoolId);
      setSchool(data.school);
      setPaymentHistory(data.payment_history);
      setAnalytics(data.analytics);
    } catch {
      setError('Failed to load school details.');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!school || school.payment_satisfied || searchParams.get('markPaid') !== '1') return;
    setPaymentMethod(defaultPaymentMethod(school));
    setPaidDate(todayDateInputValue());
    setAmountInr(defaultMarkPaidAmountInr(school));
    setTransactionReference('');
    setAdminNote('');
    setSendConfirmationEmail(true);
    setMarkPaidOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('markPaid');
    setSearchParams(next, { replace: true });
  }, [school, searchParams, setSearchParams]);

  const defaultAmountInr = useMemo(
    () => (school ? defaultMarkPaidAmountInr(school) : ''),
    [school]
  );

  const resolvedPlanPriceInr = useMemo(
    () => (school ? resolveSchoolPlanPriceInr(school) : null),
    [school]
  );

  const openMarkPaidDialog = () => {
    if (!school) return;
    setPaymentMethod(defaultPaymentMethod(school));
    setPaidDate(todayDateInputValue());
    setAmountInr(defaultAmountInr);
    setTransactionReference('');
    setAdminNote('');
    setSendConfirmationEmail(true);
    setMarkPaidOpen(true);
  };

  const handleMarkPaid = async () => {
    if (!schoolId || !school) return;
    const paidAtIso = dateInputToIso(paidDate);
    if (!paidAtIso) {
      setError('Please enter a valid payment date.');
      return;
    }
    const parsedAmount = Number(amountInr.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount in INR.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await markPlatformAdminSchoolPaid(schoolId, {
        payment_method: paymentMethod,
        paid_at: paidAtIso,
        amount_paise: Math.round(parsedAmount * 100),
        transaction_reference: transactionReference.trim() || undefined,
        admin_note: adminNote.trim() || undefined,
        send_confirmation_email: sendConfirmationEmail,
      });
      setMarkPaidOpen(false);
      setSuccessMessage(
        `School marked as paid. Invoice ${result.invoiceNumber}.` +
          (sendConfirmationEmail ? ' Confirmation email queued.' : '')
      );
      await load();
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Failed to mark school as paid.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ ...platformAdminPageContainerSx, display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: ip.navy }} />
      </Box>
    );
  }

  if (!school) {
    return (
      <Box sx={platformAdminPageContainerSx}>
        <Alert severity="error">School not found.</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/platform-admin/schools')} sx={{ mt: 2, textTransform: 'none', color: ip.navy }}>
          Back to schools
        </Button>
      </Box>
    );
  }

  const canMarkPaid = !school.payment_satisfied;

  return (
    <Box sx={platformAdminPageContainerSx}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/platform-admin/schools')}
        sx={{ mb: 2, textTransform: 'none', color: ip.navy, fontWeight: 600 }}
      >
        Back to schools
      </Button>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: ip.heading }}>
              {school.school_name}
            </Typography>
            {isPlatformAdminTestSchool(school.id) && (
              <PlatformAdminChip label="Test" tone="info" />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: ip.subtext }}>
            {school.id}
          </Typography>
        </Box>
        {canMarkPaid && (
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={openMarkPaidDialog}
            sx={{ ...platformAdminPrimaryButtonSx, bgcolor: ip.approveGreen, '&:hover': { bgcolor: '#16a34a' } }}
          >
            Mark as paid
          </Button>
        )}
      </Box>

      {canMarkPaid && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            bgcolor: ip.pendingBg,
            color: '#92400e',
            '& .MuiAlert-icon': { color: '#d97706' },
          }}
        >
          Payment not captured yet. Click <strong>Mark as paid</strong> (top right) to record an
          off-platform payment and unlock the school portal.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {canMarkPaid && school.pending_wire_capture && (
        <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(16, 64, 139, 0.08)', color: ip.navy }}>
          Wire/offline payment is on file but not captured yet. Use <strong>Mark as paid</strong> above.
        </Alert>
      )}

      {!canMarkPaid && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Payment is already captured{school.paid_at ? ` (${formatDate(school.paid_at)})` : ''}.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2.5,
        }}
      >
        <Card sx={platformAdminCardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
              Registration & payment
            </Typography>
            <DetailRow label="Payment status">
              <PlatformAdminChip
                label={formatPaymentStatusLabel(school.payment_status)}
                tone={paymentStatusChipTone(school.payment_status)}
              />
            </DetailRow>
            <DetailRow label="Payment method" value={school.payment_method || '—'} />
            <DetailRow
              label="Plan"
              value={`${school.subscription_plan || '—'} (${formatInr(resolvedPlanPriceInr)}/yr)`}
            />
            <DetailRow label="POC setup" value={school.verified ? 'Complete' : 'Pending'} />
            <ContactEmailsRow primaryEmail={school.poc_email} contactEmails={school.contact_emails} />
            <DetailRow label="Registered" value={formatDate(school.created_at)} />
            <DetailRow label="Paid at" value={formatDate(school.paid_at)} />
            <DetailRow label="Students rostered" value={String(school.student_count)} />
            {school.billing_invoice_number && (
              <DetailRow label="Invoice" value={school.billing_invoice_number} />
            )}
          </CardContent>
        </Card>

        <Box>
          <Card sx={platformAdminCardSx}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
                Offline payment details
              </Typography>
              {school.payment_method === 'wire' ||
              school.payment_method === 'already_paid' ||
              school.wire_payment_id ||
              school.wire_order_id ? (
                <>
                  <DetailRow label="Payment ID" value={school.wire_payment_id || school.razorpay_payment_id || '—'} />
                  <DetailRow label="Order ID" value={school.wire_order_id || '—'} />
                  <DetailRow label="Amount on file" value={formatInrFromPaise(school.wire_amount_paise)} />
                </>
              ) : (
                <Typography variant="body2" sx={{ color: ip.subtext, lineHeight: 1.55 }}>
                  No offline payment attempt recorded yet. If they paid outside Razorpay, use Mark as paid to
                  backfill payment date, method, and reference.
                </Typography>
              )}
            </CardContent>
          </Card>

          {analytics && (
            <Card sx={{ ...platformAdminCardSx, mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
                  Analytics snapshot
                </Typography>
                <DetailRow label="Institutional tier" value={String(analytics.institutional_tier ?? '—')} />
                <DetailRow label="Performance tier" value={String(analytics.institutional_performance_tier ?? '—')} />
                <DetailRow label="Avg percentile" value={String(analytics.avg_percentile ?? '—')} />
                <DetailRow label="Completion rate" value={String(analytics.completion_rate ?? '—')} />
                <DetailRow label="Students assessed" value={String(analytics.students_assessed ?? '—')} />
                <DetailRow label="Updated" value={formatDate(String(analytics.updated_at ?? ''))} />
              </CardContent>
            </Card>
          )}
        </Box>

        <Card sx={{ ...platformAdminCardSx, gridColumn: '1 / -1' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
              Payment history
            </Typography>
            {paymentHistory.length === 0 ? (
              <Typography variant="body2" sx={{ color: ip.subtext }}>
                No payment history recorded yet.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: ip.cardMutedBg }}>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading }}>Kind</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading }}>Source</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: ip.heading }}>Invoice</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory.map((ph) => (
                    <TableRow key={ph.id} hover>
                      <TableCell sx={{ color: ip.subtext }}>{formatDate(ph.recorded_at)}</TableCell>
                      <TableCell sx={{ color: ip.heading }}>{ph.kind || '—'}</TableCell>
                      <TableCell sx={{ color: ip.heading }}>{formatInrFromPaise(ph.amount_paise)}</TableCell>
                      <TableCell sx={{ color: ip.heading }}>{ph.source || '—'}</TableCell>
                      <TableCell sx={{ color: ip.heading }}>{ph.billing_invoice_number || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog
        open={markPaidOpen}
        onClose={() => !submitting && setMarkPaidOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        slotProps={{
          backdrop: { sx: { bgcolor: 'rgba(15, 23, 42, 0.5)' } },
        }}
        PaperProps={{ sx: platformAdminDialogPaperSx }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: ip.heading,
            px: 3,
            pt: 2.5,
            pb: 2,
            bgcolor: '#fff',
          }}
        >
          Mark school as paid
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: '#fff',
            borderColor: ip.cardBorder,
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          <Typography sx={{ color: ip.subtext, mb: 2.5, lineHeight: 1.55, fontSize: '0.9rem' }}>
            Backfill an off-platform payment for{' '}
            <Box component="span" sx={{ fontWeight: 700, color: ip.heading }}>
              {school.school_name}
            </Box>
            . This updates Firestore, writes payment history, generates an invoice reference, and optionally
            emails the school POCs.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="mark-paid-method">
                How they paid
              </Typography>
              <Select
                id="mark-paid-method"
                fullWidth
                size="small"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PlatformAdminMarkSchoolPaidMethod)}
                renderValue={(v) => PLATFORM_ADMIN_PAYMENT_METHOD_LABELS[v as PlatformAdminMarkSchoolPaidMethod]}
                MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                sx={platformAdminDialogSelectSx}
              >
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {PLATFORM_ADMIN_PAYMENT_METHOD_LABELS[method]}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="mark-paid-date">
                Payment date
              </Typography>
              <TextField
                id="mark-paid-date"
                type="date"
                size="small"
                fullWidth
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                sx={platformAdminDialogTextFieldSx}
              />
            </Box>

            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="mark-paid-amount">
                Amount (INR)
              </Typography>
              <TextField
                id="mark-paid-amount"
                size="small"
                fullWidth
                value={amountInr}
                onChange={(e) => setAmountInr(e.target.value)}
                placeholder={defaultAmountInr || 'Plan amount'}
                sx={platformAdminDialogTextFieldSx}
              />
              {school.subscription_plan && resolvedPlanPriceInr != null && (
                <Typography sx={{ color: ip.subtext, fontSize: '0.75rem', mt: 0.75, lineHeight: 1.4 }}>
                  Plan: {school.subscription_plan} — default {formatInr(resolvedPlanPriceInr)}/yr
                </Typography>
              )}
            </Box>

            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="mark-paid-reference">
                Transaction / reference ID (optional)
              </Typography>
              <TextField
                id="mark-paid-reference"
                size="small"
                fullWidth
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="UTR, cheque no., receipt ID…"
                sx={platformAdminDialogTextFieldSx}
              />
            </Box>

            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="mark-paid-note">
                Internal note (optional)
              </Typography>
              <TextField
                id="mark-paid-note"
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. Paid via NEFT on call with POC"
                sx={platformAdminDialogTextFieldSx}
              />
            </Box>

            <Box
              sx={{
                pt: 2,
                mt: 0.5,
                borderTop: `1px solid ${ip.cardBorder}`,
              }}
            >
              <FormControlLabel
                sx={{ alignItems: 'flex-start', ml: 0, mr: 0 }}
                control={
                  <Checkbox
                    checked={sendConfirmationEmail}
                    onChange={(e) => setSendConfirmationEmail(e.target.checked)}
                    sx={{
                      color: ip.navy,
                      pt: 0.25,
                      '&.Mui-checked': { color: ip.navy },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: ip.heading, fontSize: '0.9rem', lineHeight: 1.45, pt: 0.25 }}>
                    Send payment confirmation email + invoice to school contacts
                  </Typography>
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            bgcolor: '#f8fafc',
            borderTop: `1px solid ${ip.cardBorder}`,
            gap: 1,
          }}
        >
          <Button onClick={() => setMarkPaidOpen(false)} disabled={submitting} sx={{ textTransform: 'none', color: ip.subtext }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={handleMarkPaid}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ ...platformAdminPrimaryButtonSx, bgcolor: ip.approveGreen, '&:hover': { bgcolor: '#16a34a' } }}
          >
            {submitting ? 'Saving…' : 'Confirm & mark paid'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

function ContactEmailsRow({
  primaryEmail,
  contactEmails,
}: {
  primaryEmail: string;
  contactEmails: string[];
}) {
  const normalizedPrimary = primaryEmail.trim().toLowerCase();
  const seen = new Set<string>();
  const allEmails: string[] = [];

  if (primaryEmail.trim()) {
    seen.add(normalizedPrimary);
    allEmails.push(primaryEmail.trim());
  }
  for (const raw of contactEmails) {
    const email = raw.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    allEmails.push(email);
  }

  return (
    <>
      <Box sx={{ py: 0.75 }}>
        <Typography variant="body2" sx={{ color: ip.subtext, mb: 0.75 }}>
          Contact emails
        </Typography>
        {allEmails.length === 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 600, color: ip.heading }}>
            —
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, alignItems: 'flex-end' }}>
            {allEmails.map((email) => {
              const isPrimary = normalizedPrimary && email.toLowerCase() === normalizedPrimary;
              return (
                <Box key={email} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: ip.heading }}>
                    {email}
                  </Typography>
                  {isPrimary && <PlatformAdminChip label="Primary POC" tone="info" />}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
      <Divider />
    </>
  );
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, gap: 2 }}>
        <Typography variant="body2" sx={{ color: ip.subtext }}>
          {label}
        </Typography>
        {children ?? (
          <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', color: ip.heading }}>
            {value}
          </Typography>
        )}
      </Box>
      <Divider />
    </>
  );
}

export default PlatformAdminSchoolDetailPage;
