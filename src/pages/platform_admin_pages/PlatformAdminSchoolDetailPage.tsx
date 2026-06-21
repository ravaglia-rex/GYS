import React, { useCallback, useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as CaptureIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  capturePlatformAdminSchoolPayment,
  formatDate,
  formatInr,
  formatInrFromPaise,
  getPlatformAdminSchool,
  type PlatformAdminPaymentHistoryItem,
  type PlatformAdminSchoolDetail,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminPageContainerSx,
  platformAdminPalette as ip,
  PlatformAdminChip,
  paymentStatusChipTone,
  platformAdminPrimaryButtonSx,
} from './platformAdminPageStyles';

const PlatformAdminSchoolDetailPage: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<PlatformAdminSchoolDetail | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PlatformAdminPaymentHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleCapturePayment = async () => {
    if (!schoolId || !school) return;
    if (
      !window.confirm(
        `Confirm payment capture for "${school.school_name}"? This will unlock their dashboard and send confirmation email.`
      )
    ) {
      return;
    }
    setCapturing(true);
    setSuccessMessage(null);
    setError(null);
    try {
      await capturePlatformAdminSchoolPayment(schoolId);
      setSuccessMessage('Payment capture initiated. Refreshing…');
      await load();
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Failed to capture payment.');
    } finally {
      setCapturing(false);
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
          <Typography variant="h4" sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
            {school.school_name}
          </Typography>
          <Typography variant="body2" sx={{ color: ip.subtext }}>
            {school.id}
          </Typography>
        </Box>
        {school.pending_wire_capture && (
          <Button
            variant="contained"
            startIcon={capturing ? <CircularProgress size={18} color="inherit" /> : <CaptureIcon />}
            disabled={capturing}
            onClick={handleCapturePayment}
            sx={{ ...platformAdminPrimaryButtonSx, bgcolor: ip.approveGreen, '&:hover': { bgcolor: '#16a34a' } }}
          >
            Capture payment
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
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
              <PlatformAdminChip label={school.payment_status} tone={paymentStatusChipTone(school.payment_status)} />
            </DetailRow>
            <DetailRow label="Payment method" value={school.payment_method || '—'} />
            <DetailRow label="Payment captured flag" value={school.payment_captured || '—'} />
            <DetailRow label="Plan" value={`${school.subscription_plan || '—'} (${formatInr(school.plan_price_inr)}/yr)`} />
            <DetailRow label="POC setup" value={school.verified ? 'Complete' : 'Pending'} />
            <ContactEmailsRow
              primaryEmail={school.poc_email}
              contactEmails={school.contact_emails}
            />
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
                Wire transfer details
              </Typography>
              {school.payment_method === 'wire' || school.payment_method === 'already_paid' ? (
                <>
                  <DetailRow label="Wire payment ID" value={school.wire_payment_id || school.razorpay_payment_id || '—'} />
                  <DetailRow label="Wire order ID" value={school.wire_order_id || '—'} />
                  <DetailRow label="Amount" value={formatInrFromPaise(school.wire_amount_paise)} />
                  {school.pending_wire_capture && (
                    <Alert severity="warning" sx={{ mt: 2, bgcolor: ip.pendingBg, color: '#92400e', '& .MuiAlert-icon': { color: '#d97706' } }}>
                      Payment received offline — click &quot;Capture payment&quot; above to unlock the school portal.
                    </Alert>
                  )}
                </>
              ) : (
                <Typography variant="body2" sx={{ color: ip.subtext }}>
                  No wire transfer on file. School paid via Razorpay or payment is still pending.
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
                  {isPrimary && (
                    <PlatformAdminChip label="Primary POC" tone="info" />
                  )}
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
