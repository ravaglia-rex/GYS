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
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  formatDate,
  formatInr,
  formatInrFromPaise,
  getPlatformAdminSchool,
  getPlatformAdminSchoolInvoiceDownloadUrl,
  markPlatformAdminSchoolPaid,
  deletePlatformAdminSchool,
  updatePlatformAdminSchoolBilling,
  PLATFORM_ADMIN_PAYMENT_METHOD_LABELS,
  type PlatformAdminMarkSchoolPaidMethod,
  type PlatformAdminEmailActivityRow,
  type PlatformAdminPaymentHistoryItem,
  type PlatformAdminPocAccountRow,
  type PlatformAdminSchoolDetail,
  type PlatformAdminSchoolRegistrant,
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
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  PlatformAdminChip,
  formatPaymentStatusLabel,
  paymentStatusChipTone,
} from './platformAdminComponents';
import {
  formatPlanAmountInrInput,
  REGISTER_PLAN_IDS,
  resolveRegisterPlanIdFromFields,
  resolveSchoolPlanPriceInr,
  SCHOOL_INSTITUTIONAL_BASE_INR,
  type RegisterPlanId,
} from '../../utils/schoolRegistrationPlans';
import { isPlatformAdminTestSchool } from './platformAdminTestSchools';

const PAYMENT_METHODS = Object.keys(PLATFORM_ADMIN_PAYMENT_METHOD_LABELS) as PlatformAdminMarkSchoolPaidMethod[];

const PLAN_OPTIONS = REGISTER_PLAN_IDS.map((id) => ({
  id,
  label: id.charAt(0).toUpperCase() + id.slice(1),
  listPriceInr: SCHOOL_INSTITUTIONAL_BASE_INR[id],
}));

function planLabelFromId(planId: string | null | undefined): string {
  if (!planId) return '-';
  const row = PLAN_OPTIONS.find((p) => p.id === planId);
  return row ? `${row.label} (${formatInr(row.listPriceInr)}/yr)` : planId;
}

function resolveSchoolPlanId(school: PlatformAdminSchoolDetail): RegisterPlanId | '' {
  return resolveRegisterPlanIdFromFields(school.selected_plan_id, school.subscription_plan) ?? '';
}

function resolveRegisteredPlanId(school: PlatformAdminSchoolDetail): RegisterPlanId | '' {
  return (
    resolveRegisterPlanIdFromFields(school.registered_plan_id, school.registered_subscription_plan) ?? ''
  );
}

function schoolDisplayName(school: PlatformAdminSchoolDetail): string {
  return school.school_name.trim();
}

function schoolNamesMatch(typed: string, school: PlatformAdminSchoolDetail): boolean {
  const normalizedConfirm = typed.trim().replace(/\s+/g, ' ').toLowerCase();
  const normalizedSchool = schoolDisplayName(school).replace(/\s+/g, ' ').toLowerCase();
  return Boolean(normalizedConfirm) && normalizedConfirm === normalizedSchool;
}

function defaultPaidAmountInr(school: PlatformAdminSchoolDetail): string {
  if (typeof school.paid_amount_paise === 'number' && school.paid_amount_paise > 0) {
    return formatPlanAmountInrInput(school.paid_amount_paise / 100);
  }
  return defaultMarkPaidAmountInr(school);
}

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
  if (raw === 'razorpay_link') return 'razorpay_link';
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
  const [pocAccounts, setPocAccounts] = useState<PlatformAdminPocAccountRow[]>([]);
  const [emailActivity, setEmailActivity] = useState<PlatformAdminEmailActivityRow[]>([]);
  const [registrant, setRegistrant] = useState<PlatformAdminSchoolRegistrant | null>(null);
  const [invoiceDownloadingKey, setInvoiceDownloadingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PlatformAdminMarkSchoolPaidMethod>('wire');
  const [paidDate, setPaidDate] = useState(todayDateInputValue());
  const [amountInr, setAmountInr] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [razorpayOrderId, setRazorpayOrderId] = useState('');
  const [razorpayPaymentId, setRazorpayPaymentId] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);
  const [paidPlanId, setPaidPlanId] = useState<RegisterPlanId | ''>('');
  const [billingOpen, setBillingOpen] = useState(false);
  const [billingPlanId, setBillingPlanId] = useState<RegisterPlanId | ''>('');
  const [billingAmountInr, setBillingAmountInr] = useState('');
  const [billingNote, setBillingNote] = useState('');
  const [billingSubmitting, setBillingSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteAdminAuth, setDeleteAdminAuth] = useState(true);
  const [unlinkStudents, setUnlinkStudents] = useState(true);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPlatformAdminSchool(schoolId);
      setSchool(data.school ?? null);
      setPaymentHistory(Array.isArray(data.payment_history) ? data.payment_history : []);
      setAnalytics(data.analytics ?? null);
      setPocAccounts(Array.isArray(data.poc_accounts) ? data.poc_accounts : []);
      setEmailActivity(Array.isArray(data.email_activity) ? data.email_activity : []);
      setRegistrant(data.registrant ?? null);
    } catch {
      setSchool(null);
      setPaymentHistory([]);
      setAnalytics(null);
      setPocAccounts([]);
      setEmailActivity([]);
      setRegistrant(null);
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
    setRazorpayOrderId('');
    setRazorpayPaymentId('');
    setAdminNote('');
    setSendConfirmationEmail(true);
    setPaidPlanId(resolveSchoolPlanId(school) || resolveRegisteredPlanId(school) || '');
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
    setRazorpayOrderId('');
    setRazorpayPaymentId('');
    setAdminNote('');
    setSendConfirmationEmail(true);
    setPaidPlanId(resolveSchoolPlanId(school) || resolveRegisteredPlanId(school) || '');
    setMarkPaidOpen(true);
  };

  const openBillingDialog = () => {
    if (!school) return;
    setBillingPlanId(resolveSchoolPlanId(school));
    setBillingAmountInr(school.payment_satisfied ? defaultPaidAmountInr(school) : '');
    setBillingNote('');
    setBillingOpen(true);
  };

  const handleUpdateBilling = async () => {
    if (!schoolId || !school) return;

    const parsedAmount = Number(billingAmountInr.replace(/,/g, '').trim());
    const hasAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
    const hasPlan = Boolean(billingPlanId);

    if (!hasAmount && !hasPlan) {
      setError('Choose an effective package and/or enter the amount paid.');
      return;
    }

    setBillingSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await updatePlatformAdminSchoolBilling(schoolId, {
        ...(hasPlan ? { effective_plan_id: billingPlanId } : {}),
        ...(hasAmount ? { paid_amount_paise: Math.round(parsedAmount * 100) } : {}),
        admin_note: billingNote.trim() || undefined,
      });
      setBillingOpen(false);
      setSuccessMessage(
        school.payment_satisfied
          ? 'Package and billing updated.'
          : 'Package updated. The school checkout and any new payment will use the corrected package.'
      );
      await load();
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Failed to update package and billing.');
    } finally {
      setBillingSubmitting(false);
    }
  };

  const openDeleteDialog = () => {
    if (!school) return;
    setDeleteConfirmName('');
    setDeleteAdminAuth(true);
    setUnlinkStudents(true);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleDeleteSchool = async () => {
    if (!schoolId || !school) return;
    if (!schoolNamesMatch(deleteConfirmName, school)) {
      setDeleteError(`Type "${schoolDisplayName(school)}" exactly to confirm.`);
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const result = await deletePlatformAdminSchool(schoolId, {
        confirm_school_name: deleteConfirmName.trim(),
        delete_admin_auth: deleteAdminAuth,
        unlink_students: unlinkStudents,
      });
      setDeleteOpen(false);
      navigate('/platform-admin/schools', {
        replace: true,
        state: {
          deleteSuccess: `${schoolDisplayName(school)} deleted. ${result.studentsUnlinked} student(s) unlinked, ${result.adminAuthDeleted} admin login(s) removed.`,
        },
      });
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setDeleteError(msg || 'Failed to delete school. Check the network tab or retry after redeploying functions.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!schoolId || !school) return;
    if (!paidPlanId) {
      setError('Please select the package they paid for.');
      return;
    }
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
    const trimmedRazorpayOrderId = razorpayOrderId.trim();
    const trimmedRazorpayPaymentId = razorpayPaymentId.trim();
    if (trimmedRazorpayOrderId && !trimmedRazorpayOrderId.startsWith('order_')) {
      setError('Razorpay Order ID must start with order_.');
      return;
    }
    if (trimmedRazorpayPaymentId && !trimmedRazorpayPaymentId.startsWith('pay_')) {
      setError('Razorpay Payment ID must start with pay_.');
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
        ...(paidPlanId ? { plan_id: paidPlanId } : {}),
        ...(trimmedRazorpayOrderId ? { razorpay_order_id: trimmedRazorpayOrderId } : {}),
        ...(trimmedRazorpayPaymentId ? { razorpay_payment_id: trimmedRazorpayPaymentId } : {}),
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

  const handleDownloadInvoice = async (params: {
    key: string;
    payment_history_id?: string;
    public_reference?: string;
  }) => {
    if (!schoolId) return;
    setInvoiceDownloadingKey(params.key);
    setError(null);
    try {
      const result = await getPlatformAdminSchoolInvoiceDownloadUrl(schoolId, {
        payment_history_id: params.payment_history_id,
        public_reference: params.public_reference,
      });
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Failed to download invoice.');
    } finally {
      setInvoiceDownloadingKey(null);
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
  const registeredPlanId = resolveRegisteredPlanId(school);
  const effectivePlanId = resolveSchoolPlanId(school);
  const paidAmountLabel = formatInrFromPaise(school.paid_amount_paise);
  const plansDiffer =
    registeredPlanId && effectivePlanId && registeredPlanId !== effectivePlanId;
  const deleteNameMatches = school ? schoolNamesMatch(deleteConfirmName, school) : false;

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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={openBillingDialog}
            sx={{ textTransform: 'none', color: ip.navy, borderColor: ip.cardBorder, fontWeight: 600 }}
          >
            Update package & billing
          </Button>
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
          Payment not captured yet. If they picked the wrong package, use{' '}
          <strong>Update package & billing</strong> to fix it before they pay. Use{' '}
          <strong>Mark as paid</strong> when an off-platform payment is received.
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
            <DetailRow label="Payment method" value={school.payment_method || ' - '} />
            <DetailRow
              label="Package at registration"
              value={planLabelFromId(registeredPlanId || effectivePlanId)}
            />
            <DetailRow
              label="Effective package"
              value={
                plansDiffer
                  ? `${planLabelFromId(effectivePlanId)} (updated from ${planLabelFromId(registeredPlanId)})`
                  : planLabelFromId(effectivePlanId)
              }
            />
            <DetailRow label="List price" value={`${formatInr(resolvedPlanPriceInr)}/yr`} />
            <DetailRow label="Amount paid" value={paidAmountLabel} />
            <DetailRow label="POC setup" value={school.verified ? 'Complete' : 'Pending'} />
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
              school.wire_order_id ||
              school.razorpay_payment_id ||
              school.razorpay_order_id ? (
                <>
                  <DetailRow
                    label="Payment ID"
                    value={school.razorpay_payment_id || school.wire_payment_id || ' - '}
                  />
                  <DetailRow
                    label="Order ID"
                    value={school.razorpay_order_id || school.wire_order_id || ' - '}
                  />
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
                <DetailRow label="Institutional tier" value={String(analytics.institutional_tier ?? ' - ')} />
                <DetailRow label="Performance tier" value={String(analytics.institutional_performance_tier ?? ' - ')} />
                <DetailRow label="Avg percentile" value={String(analytics.avg_percentile ?? ' - ')} />
                <DetailRow label="Completion rate" value={String(analytics.completion_rate ?? ' - ')} />
                <DetailRow label="Students assessed" value={String(analytics.students_assessed ?? ' - ')} />
                <DetailRow label="Updated" value={formatDate(String(analytics.updated_at ?? ''))} />
              </CardContent>
            </Card>
          )}
        </Box>

        <Card sx={{ ...platformAdminCardSx, gridColumn: '1 / -1' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
              POC accounts
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, mb: 2, lineHeight: 1.55 }}>
              {registrant ? (
                <>
                  Registration submitted by{' '}
                  <Box component="span" sx={{ fontWeight: 600, color: ip.heading }}>
                    {registrant.name || 'Unknown'}
                  </Box>
                  {registrant.designation ? ` (${registrant.designation})` : ''}.
                  {' '}Each contact email below — whether they created a login and completed setup.
                </>
              ) : (
                'Contact emails on file and whether each created a login and completed setup.'
              )}
            </Typography>
            {pocAccounts.length === 0 ? (
              <Typography variant="body2" sx={{ color: ip.subtext }}>
                No contact emails on file.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {pocAccounts.filter((poc) => poc && poc.email).map((poc) => (
                  <Box
                    key={poc.email}
                    sx={{
                      border: `1px solid ${ip.cardBorder}`,
                      borderRadius: 1.5,
                      p: 2,
                      bgcolor: ip.cardMutedBg,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: ip.heading,
                          flex: '1 1 200px',
                          wordBreak: 'break-word',
                        }}
                      >
                        {poc.email}
                      </Typography>
                      {poc.is_primary && <PlatformAdminChip label="Primary POC" tone="info" />}
                      <PlatformAdminChip
                        label={poc.account_created ? 'Account created' : 'No account yet'}
                        tone={poc.account_created ? 'success' : 'neutral'}
                      />
                      <PlatformAdminChip
                        label={poc.setup_complete ? 'Setup complete' : 'Setup pending'}
                        tone={poc.setup_complete ? 'success' : 'warning'}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: ip.subtext, lineHeight: 1.5 }}>
                      Account created: {formatDate(poc.auth_created_at)}
                      {' · '}
                      Last sign-in: {formatDate(poc.last_sign_in_at)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

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
              <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                <Table size="small" sx={platformAdminTableSx}>
                  <TableHead>
                    <TableRow sx={platformAdminTableHeadRowSx}>
                      <TableCell>Date</TableCell>
                      <TableCell>Kind</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Invoice</TableCell>
                      <TableCell>PDF</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentHistory.map((ph) => (
                      <TableRow key={ph.id} hover>
                        <TableCell sx={{ color: ip.subtext, whiteSpace: 'nowrap' }}>
                          {formatDate(ph.recorded_at)}
                        </TableCell>
                        <TableCell>{ph.kind || ' - '}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatInrFromPaise(ph.amount_paise)}</TableCell>
                        <TableCell>{ph.source || ' - '}</TableCell>
                        <TableCell sx={{ wordBreak: 'break-word', maxWidth: 200 }}>
                          {ph.billing_invoice_number || ' - '}
                        </TableCell>
                        <TableCell>
                          {ph.has_invoice_pdf ? (
                            <Button
                              size="small"
                              startIcon={
                                invoiceDownloadingKey === ph.id ? (
                                  <CircularProgress size={14} color="inherit" />
                                ) : (
                                  <DownloadIcon fontSize="small" />
                                )
                              }
                              disabled={invoiceDownloadingKey === ph.id}
                              onClick={() =>
                                void handleDownloadInvoice({
                                  key: ph.id,
                                  payment_history_id: ph.id,
                                  public_reference: ph.public_reference ?? undefined,
                                })
                              }
                              sx={{ textTransform: 'none', fontWeight: 600, color: ip.navy, minWidth: 0, px: 1 }}
                            >
                              Download
                            </Button>
                          ) : (
                            <Typography variant="body2" sx={{ color: ip.subtext }}>
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Card sx={{ ...platformAdminCardSx, gridColumn: '1 / -1' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
              Email history
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, mb: 2, lineHeight: 1.55 }}>
              Dates and email types sent to school contacts (not full message bodies).
            </Typography>
            {emailActivity.length === 0 ? (
              <Typography variant="body2" sx={{ color: ip.subtext }}>
                No emails recorded yet.
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
                <Table size="small" sx={{ ...platformAdminTableSx, minWidth: 640 }}>
                  <TableHead>
                    <TableRow sx={platformAdminTableHeadRowSx}>
                      <TableCell>Date</TableCell>
                      <TableCell>Email type</TableCell>
                      <TableCell>Subject / detail</TableCell>
                      <TableCell>Recipients</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {emailActivity.filter((row) => row && row.id).map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ color: ip.subtext, whiteSpace: 'nowrap' }}>
                          {formatDate(row.sent_at)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.label}</TableCell>
                        <TableCell sx={{ color: ip.subtext, wordBreak: 'break-word', minWidth: 180 }}>
                          {row.subject || '-'}
                        </TableCell>
                        <TableCell sx={{ color: ip.subtext, wordBreak: 'break-word', minWidth: 160 }}>
                          {(Array.isArray(row.recipients) ? row.recipients : []).length > 0
                            ? (Array.isArray(row.recipients) ? row.recipients : []).join(', ')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      <Card
        sx={{
          ...platformAdminCardSx,
          mt: 3,
          borderColor: '#fecaca',
          bgcolor: '#fffafa',
        }}
      >
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#991b1b', mb: 1 }}>
            Danger zone
          </Typography>
          <Typography variant="body2" sx={{ color: ip.subtext, mb: 2, lineHeight: 1.55, maxWidth: 720 }}>
            Permanently delete this school, its payment history, analytics, quarterly reports, admin
            preferences, and platform notifications. Optionally remove Firebase Auth logins for school
            contacts and unlink rostered students (student accounts are kept).
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={openDeleteDialog}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Delete school
          </Button>
        </CardContent>
      </Card>

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
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="mark-paid-plan">
                Package paid for
              </Typography>
              <Select
                id="mark-paid-plan"
                fullWidth
                size="small"
                value={paidPlanId}
                onChange={(e) => {
                  const nextPlan = e.target.value as RegisterPlanId | '';
                  setPaidPlanId(nextPlan);
                  if (nextPlan) {
                    setAmountInr(formatPlanAmountInrInput(SCHOOL_INSTITUTIONAL_BASE_INR[nextPlan]));
                  }
                }}
                displayEmpty
                renderValue={(v) =>
                  v ? planLabelFromId(v) : 'Select package'
                }
                MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                sx={platformAdminDialogSelectSx}
              >
                {PLAN_OPTIONS.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.label} - {formatInr(plan.listPriceInr)}/yr list
                  </MenuItem>
                ))}
              </Select>
              {registeredPlanId && paidPlanId && registeredPlanId !== paidPlanId && (
                <Typography sx={{ color: ip.subtext, fontSize: '0.75rem', mt: 0.75, lineHeight: 1.4 }}>
                  Registered for {planLabelFromId(registeredPlanId)}; recording payment for a different package.
                </Typography>
              )}
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
                  Override the list price if they paid a discounted amount.
                </Typography>
              )}
            </Box>

            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="mark-paid-razorpay-order">
                Razorpay Order ID (optional)
              </Typography>
              <TextField
                id="mark-paid-razorpay-order"
                size="small"
                fullWidth
                value={razorpayOrderId}
                onChange={(e) => setRazorpayOrderId(e.target.value)}
                placeholder="order_…"
                sx={platformAdminDialogTextFieldSx}
              />
            </Box>

            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="mark-paid-razorpay-payment">
                Razorpay Payment ID (optional)
              </Typography>
              <TextField
                id="mark-paid-razorpay-payment"
                size="small"
                fullWidth
                value={razorpayPaymentId}
                onChange={(e) => setRazorpayPaymentId(e.target.value)}
                placeholder="pay_…"
                sx={platformAdminDialogTextFieldSx}
              />
              <Typography sx={{ color: ip.subtext, fontSize: '0.75rem', mt: 0.75, lineHeight: 1.4 }}>
                If paid via Razorpay link or checkout, enter both IDs from the Razorpay dashboard. They are stored
                separately on the school record and in payment history.
              </Typography>
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

      <Dialog
        open={billingOpen}
        onClose={() => !billingSubmitting && setBillingOpen(false)}
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
          Update package & billing
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: '#fff',
            borderColor: ip.cardBorder,
            overflowY: 'auto',
          }}
        >
          <Typography sx={{ color: ip.subtext, mb: 2.5, lineHeight: 1.55, fontSize: '0.9rem' }}>
            {school.payment_satisfied ? (
              <>
                Set the package the school should receive access to and/or correct the amount they paid.
                Registration package is preserved for audit when it differs.
              </>
            ) : (
              <>
                This school has not paid yet. Change <strong>Effective package</strong> if they registered
                for the wrong tier - checkout and invoices will use the corrected package. Leave amount
                blank until payment is captured (or enter it when using <strong>Mark as paid</strong>).
              </>
            )}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="billing-plan">
                Effective package
              </Typography>
              <Select
                id="billing-plan"
                fullWidth
                size="small"
                value={billingPlanId}
                onChange={(e) => setBillingPlanId(e.target.value as RegisterPlanId)}
                MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
                sx={platformAdminDialogSelectSx}
              >
                {PLAN_OPTIONS.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.label} - {formatInr(plan.listPriceInr)}/yr list
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="billing-amount">
                {school.payment_satisfied ? 'Amount paid (INR)' : 'Expected amount (INR, optional)'}
              </Typography>
              <TextField
                id="billing-amount"
                size="small"
                fullWidth
                value={billingAmountInr}
                onChange={(e) => setBillingAmountInr(e.target.value)}
                placeholder={
                  school.payment_satisfied
                    ? 'Discounted or negotiated amount'
                    : 'Leave blank - use list price at checkout'
                }
                sx={platformAdminDialogTextFieldSx}
              />
            </Box>

            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="billing-note">
                Internal note (optional)
              </Typography>
              <TextField
                id="billing-note"
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={billingNote}
                onChange={(e) => setBillingNote(e.target.value)}
                placeholder="e.g. Upgraded to Premium after paying Standard price"
                sx={platformAdminDialogTextFieldSx}
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
          <Button
            onClick={() => setBillingOpen(false)}
            disabled={billingSubmitting}
            sx={{ textTransform: 'none', color: ip.subtext }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={billingSubmitting}
            onClick={handleUpdateBilling}
            startIcon={billingSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={platformAdminPrimaryButtonSx}
          >
            {billingSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => !deleteSubmitting && setDeleteOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        slotProps={{
          backdrop: { sx: { bgcolor: 'rgba(15, 23, 42, 0.5)' } },
        }}
        PaperProps={{ sx: platformAdminDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#991b1b', px: 3, pt: 2.5, pb: 2 }}>
          Delete school permanently?
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
              {deleteError}
            </Alert>
          )}
          <Alert severity="error" sx={{ mb: 2 }}>
            This cannot be undone. You are about to delete <strong>{school.school_name}</strong> and
            all school data stored in Firestore.
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={unlinkStudents}
                  onChange={(e) => setUnlinkStudents(e.target.checked)}
                  sx={{ color: ip.navy, '&.Mui-checked': { color: ip.navy } }}
                />
              }
              label={
                <Typography sx={{ color: ip.heading, fontSize: '0.9rem' }}>
                  Unlink {school.student_count} rostered student(s) from this school
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={deleteAdminAuth}
                  onChange={(e) => setDeleteAdminAuth(e.target.checked)}
                  sx={{ color: ip.navy, '&.Mui-checked': { color: ip.navy } }}
                />
              }
              label={
                <Typography sx={{ color: ip.heading, fontSize: '0.9rem' }}>
                  Delete Firebase Auth logins for school POC/contacts (skipped if also a student or
                  linked to another school)
                </Typography>
              }
            />

            <Box>
              <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="delete-confirm-name">
                Type school name to confirm
              </Typography>
              <TextField
                id="delete-confirm-name"
                size="small"
                fullWidth
                value={deleteConfirmName}
                onChange={(e) => {
                  setDeleteConfirmName(e.target.value);
                  if (deleteError) setDeleteError(null);
                }}
                placeholder={schoolDisplayName(school)}
                error={deleteConfirmName.length > 0 && !deleteNameMatches}
                helperText={
                  deleteConfirmName.length > 0 && !deleteNameMatches
                    ? `Must match "${schoolDisplayName(school)}" exactly`
                    : 'Delete stays disabled until the name matches exactly'
                }
                sx={platformAdminDialogTextFieldSx}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1.5,
            bgcolor: '#f8fafc',
            borderTop: `1px solid ${ip.cardBorder}`,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <Button
            type="button"
            onClick={() => setDeleteOpen(false)}
            disabled={deleteSubmitting}
            sx={{ textTransform: 'none', color: ip.subtext }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="contained"
            color="error"
            disabled={deleteSubmitting || !deleteNameMatches}
            onClick={() => void handleDeleteSchool()}
            startIcon={deleteSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 148,
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
              '&.Mui-disabled': {
                bgcolor: '#fecaca',
                color: '#991b1b',
                opacity: 1,
              },
            }}
          >
            {deleteSubmitting ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

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
