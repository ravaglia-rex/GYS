import React, { useEffect, useMemo, useState } from 'react';
import type { SvgIconProps } from '@mui/material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  WorkspacePremium as PremiumIcon,
  School as StandardIcon,
  ArrowForward as ArrowIcon,
  LooksOne as EntryIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { useLocation } from 'react-router-dom';
import {
  downloadBillingInvoicePdf,
  getSchoolDashboard,
  type SchoolDashboardBilling,
  type SchoolDashboardPaymentHistoryItem,
} from '../../db/schoolAdminCollection';
import {
  SCHOOL_INSTITUTIONAL_BASE_INR,
  SCHOOL_INSTITUTIONAL_PLAN_MATRIX,
  SCHOOL_INSTITUTIONAL_PRICE_LANDING,
  SCHOOL_REGISTRATION_GST_RATE,
  type RegisterPlanId,
} from '../../utils/schoolRegistrationPlans';
import {
  createSchoolUpgradeOrder,
  verifySchoolUpgradePayment,
} from '../../db/schoolSubscriptionUpgradePayment';
import { gysPaymentInvoiceNumberFromOrderId } from '../../utils/gysPaymentInvoiceNumber';
import { assertRazorpayCheckoutKeyAllowed } from '../../utils/razorpayTestMode';
import { auth } from '../../firebase/firebase';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { SchoolAdminPageHeader, schoolAdminPageContainerSx } from './schoolAdminPageStyles';
import { GREENFIELD_POC_EMAIL } from '../../data/schoolPreviewMock';

/** Same as ip.statBlue - literal here so plan data has no palette init at module top */
const PLAN_STANDARD_BLUE = '#1D4ED8';

type PlanIcon = React.ComponentType<SvgIconProps>;

interface Plan {
  id: string;
  name: string;
  price: string;
  per: string;
  rosterCap: string;
  features: string[];
  accent: string;
  Icon: PlanIcon;
}

const PLAN_ICONS: Record<'entry' | 'standard' | 'premium', PlanIcon> = {
  entry: EntryIcon,
  standard: StandardIcon,
  premium: PremiumIcon,
};

const PLAN_ACCENTS: Record<'entry' | 'standard' | 'premium', string> = {
  entry: '#475569',
  standard: PLAN_STANDARD_BLUE,
  premium: '#8b5cf6',
};

const PLAN_ORDER: Record<RegisterPlanId, number> = {
  entry: 1,
  standard: 2,
  premium: 3,
};

const EMPTY_BILLING_META = {
  billing: null as SchoolDashboardBilling | null,
  s3Configured: false,
  selectedPlanId: 'standard' as RegisterPlanId,
  subscriptionPlan: 'Standard',
  paymentHistory: [] as SchoolDashboardPaymentHistoryItem[],
};

const PREVIEW_BILLING_META = {
  billing: {
    invoice_number: 'GYS-GREENFIELD-2026-001',
    has_invoice_pdf: true,
  },
  s3Configured: false,
  selectedPlanId: 'standard' as RegisterPlanId,
  subscriptionPlan: 'Standard',
  paymentHistory: [
    {
      payment_id: 'preview_greenfield_standard_2026',
      order_id: 'order_preview_greenfield_standard',
      kind: 'captured',
      paid_at: '2026-01-10T05:30:00.000Z',
      amount_paise: 35400000,
      plan_id: 'standard',
      invoice_number: 'GYS-GREENFIELD-2026-001',
      payment_method: 'Razorpay checkout',
      renewal_date: '2027-01-10T05:30:00.000Z',
    },
  ] satisfies SchoolDashboardPaymentHistoryItem[],
};

const loadScript = (src: string): Promise<boolean> =>
  new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatInrFromPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateLabel(iso: string | null | undefined, fallback = 'Not available'): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function formatPaymentMethod(raw: string | null | undefined): string {
  const method = (raw ?? '').trim();
  if (!method) return 'Razorpay checkout';
  if (method === 'dev_mode') return 'Development mode';
  if (method === 'online') return 'Razorpay checkout';
  if (method === 'wire_transfer') return 'Wire transfer';
  return method;
}

function normalizePlanId(raw: unknown): RegisterPlanId | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'entry' || normalized.includes('entry')) return 'entry';
  if (normalized === 'standard' || normalized.includes('standard')) return 'standard';
  if (normalized === 'premium' || normalized.includes('premium')) return 'premium';
  return null;
}

function resolvePlanId(...values: unknown[]): RegisterPlanId {
  for (const value of values) {
    const planId = normalizePlanId(value);
    if (planId) return planId;
  }
  return 'standard';
}

export function SchoolAdminSubscriptionPage() {
  const location = useLocation();
  const isInteractivePreview = location.pathname.startsWith('/for-schools/preview');
  const plans = useMemo<Plan[]>(
    () =>
      SCHOOL_INSTITUTIONAL_PLAN_MATRIX.map((row) => ({
        id: row.id,
        name: row.name,
        price: row.annualPriceRupeeDisplay,
        per: '/yr',
        rosterCap: row.rosterGuidance,
        features: [...row.features],
        accent: PLAN_ACCENTS[row.id],
        Icon: PLAN_ICONS[row.id],
      })),
    []
  );
  const schoolId = useSelector((state: RootState) => state.auth.schoolAdmin?.schoolId ?? '').trim();
  const [billingMeta, setBillingMeta] = useState<{
    billing: SchoolDashboardBilling | null;
    s3Configured: boolean;
    selectedPlanId: RegisterPlanId;
    subscriptionPlan: string;
    paymentHistory: SchoolDashboardPaymentHistoryItem[];
  }>(() => (isInteractivePreview ? PREVIEW_BILLING_META : EMPTY_BILLING_META));
  const [billingLoading, setBillingLoading] = useState(false);
  const [invoiceDownloadingPaymentId, setInvoiceDownloadingPaymentId] = useState<string | null>(null);
  const [invoiceDownloadErr, setInvoiceDownloadErr] = useState<string | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<Plan | null>(null);
  const [upgradeBusy, setUpgradeBusy] = useState<RegisterPlanId | null>(null);
  const [upgradeErr, setUpgradeErr] = useState<string | null>(null);

  useEffect(() => {
    if (isInteractivePreview) {
      setBillingMeta(PREVIEW_BILLING_META);
      setBillingLoading(false);
      return;
    }
    if (!schoolId) return;
    let cancelled = false;
    setBillingLoading(true);
    void getSchoolDashboard(schoolId)
      .then((dash) => {
        if (cancelled) return;
        const selectedPlanId = resolvePlanId(dash.selected_plan_id, dash.subscription_plan);
        setBillingMeta({
          billing: dash.billing ?? null,
          s3Configured: dash.s3_invoice_download_configured === true,
          selectedPlanId,
          subscriptionPlan: dash.subscription_plan || SCHOOL_INSTITUTIONAL_PLAN_MATRIX.find(
            (p) => p.id === selectedPlanId
          )?.name || 'Standard',
          paymentHistory: Array.isArray(dash.payment_history) ? dash.payment_history : [],
        });
      })
      .catch(() => {
        if (!cancelled) {
          setBillingMeta({
            ...EMPTY_BILLING_META,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setBillingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isInteractivePreview, schoolId]);

  const currentPlanId = billingMeta.selectedPlanId;
  const currentPlanName =
    SCHOOL_INSTITUTIONAL_PLAN_MATRIX.find((p) => p.id === currentPlanId)?.name || billingMeta.subscriptionPlan;
  const currentPlanPrice = SCHOOL_INSTITUTIONAL_BASE_INR[currentPlanId];
  const latestPayment = billingMeta.paymentHistory[0];
  const nextRenewalLabel = formatDateLabel(latestPayment?.renewal_date, '1 January 2028');
  const planNameForHistory = (planId: string | null) => {
    if (!planId) return currentPlanName;
    const normalized = normalizePlanId(planId);
    return SCHOOL_INSTITUTIONAL_PLAN_MATRIX.find((p) => p.id === normalized)?.name || currentPlanName;
  };
  const upgradeDeltaBaseInr = upgradeTarget
    ? Math.max(0, SCHOOL_INSTITUTIONAL_BASE_INR[upgradeTarget.id as RegisterPlanId] - currentPlanPrice)
    : 0;
  const upgradeDeltaGstPaise = Math.round(upgradeDeltaBaseInr * 100 * SCHOOL_REGISTRATION_GST_RATE);
  const upgradeDeltaTotalPaise = Math.round(upgradeDeltaBaseInr * 100) + upgradeDeltaGstPaise;

  const handleDownloadInvoice = async (paymentId: string) => {
    setInvoiceDownloadErr(null);
    if (isInteractivePreview) {
      setInvoiceDownloadErr('Invoice downloads are disabled in the public preview. Sign in to download official PDFs.');
      return;
    }
    setInvoiceDownloadingPaymentId(paymentId);
    try {
      await downloadBillingInvoicePdf(paymentId);
    } catch (e: unknown) {
      setInvoiceDownloadErr(e instanceof Error ? e.message : 'Could not download invoice.');
    } finally {
      setInvoiceDownloadingPaymentId(null);
    }
  };

  const refreshBilling = async () => {
    if (isInteractivePreview) {
      setBillingMeta(PREVIEW_BILLING_META);
      return;
    }
    if (!schoolId) return;
    const dash = await getSchoolDashboard(schoolId);
    const selectedPlanId = resolvePlanId(dash.selected_plan_id, dash.subscription_plan);
    setBillingMeta({
      billing: dash.billing ?? null,
      s3Configured: dash.s3_invoice_download_configured === true,
      selectedPlanId,
      subscriptionPlan: dash.subscription_plan || SCHOOL_INSTITUTIONAL_PLAN_MATRIX.find(
        (p) => p.id === selectedPlanId
      )?.name || 'Standard',
      paymentHistory: Array.isArray(dash.payment_history) ? dash.payment_history : [],
    });
  };

  const startUpgradeCheckout = async () => {
    if (isInteractivePreview) {
      setUpgradeErr('Checkout is disabled in the public preview. Sign in to upgrade your institutional subscription.');
      return;
    }
    if (!upgradeTarget || !schoolId) return;
    const targetPlanId = upgradeTarget.id as RegisterPlanId;
    setUpgradeErr(null);
    setUpgradeBusy(targetPlanId);
    try {
      const order = await createSchoolUpgradeOrder(schoolId, targetPlanId);
      assertRazorpayCheckoutKeyAllowed(order.key_id, 'school_subscription_upgrade');
      const scriptOk = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptOk) {
        throw new Error('Could not load Razorpay checkout');
      }

      const RazorpayCtor = (window as unknown as {
        Razorpay?: new (o: object) => { open: () => void; on: (e: string, fn: (r: unknown) => void) => void };
      }).Razorpay;
      if (!RazorpayCtor) {
        throw new Error('Razorpay SDK unavailable');
      }

      const amountPaise = Math.round(Number(order.amount));
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        throw new Error('Invalid payment amount from server');
      }
      const currencyRaw = typeof order.currency === 'string' ? order.currency.trim().toUpperCase() : '';
      const currency = currencyRaw.length === 3 ? currencyRaw : 'INR';
      const checkoutConfigId =
        typeof order.checkout_config_id === 'string' ? order.checkout_config_id.trim() : '';
      const customerId =
        typeof order.customer_id === 'string' && order.customer_id.startsWith('cust_') ? order.customer_id : '';
      const email = auth.currentUser?.email?.trim() ?? '';

      const rzp = new RazorpayCtor({
        key: order.key_id,
        order_id: order.order_id,
        amount: String(amountPaise),
        currency,
        ...(customerId ? { customer_id: customerId } : {}),
        ...(checkoutConfigId ? { checkout_config_id: checkoutConfigId } : {}),
        name: 'Global Young Scholar',
        description: `Upgrade ${order.from_plan_name} to ${order.target_plan_name}`,
        image: 'https://argus-s3-bucket.s3.us-east-1.amazonaws.com/logos/argus.png',
        prefill: email ? { email } : {},
        notes: {
          invoice_number: gysPaymentInvoiceNumberFromOrderId(order.order_id),
          purpose: 'school_plan_upgrade',
          school_id: schoolId,
          target_plan_id: targetPlanId,
        },
        theme: { color: '#1e3a8a' },
        handler: async (response: {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        }) => {
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            setUpgradeBusy(null);
            setUpgradeErr('Missing payment details from Razorpay. Please try again.');
            return;
          }
          try {
            await verifySchoolUpgradePayment({
              school_id: schoolId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setUpgradeTarget(null);
            setUpgradeBusy(null);
            await refreshBilling();
          } catch (err: unknown) {
            setUpgradeBusy(null);
            setUpgradeErr(err instanceof Error ? err.message : 'Verification failed.');
          }
        },
        modal: {
          ondismiss: () => {
            setUpgradeBusy(null);
          },
        },
      });
      rzp.on('payment.failed', () => {
        setUpgradeBusy(null);
      });
      rzp.open();
    } catch (err: unknown) {
      setUpgradeBusy(null);
      setUpgradeErr(err instanceof Error ? err.message : 'Payment could not start.');
    }
  };

  return (
    <Box sx={schoolAdminPageContainerSx}>
      <PageTutorial pageKey="school.subscription" ready={!billingLoading} />
      <SchoolAdminPageHeader
        title="Institutional Subscriptions"
        subtitle="Annual institutional license. All students in selected classes included."
      />

      {isInteractivePreview && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            bgcolor: '#eff6ff',
            color: ip.heading,
            border: `1px solid ${ip.cardBorder}`,
            '& .MuiAlert-icon': { color: ip.statBlue },
          }}
        >
          This subscription page is fully mocked for Greenfield International School. Plan comparison, billing history,
          upgrade CTAs, and invoice actions are visible, but checkout and downloads are disabled.
        </Alert>
      )}

      {/* Current plan banner */}
      <Box data-tutorial-id="school-subscription-current-plan" sx={{
        bgcolor: ip.cardMutedBg,
        border: `1px solid ${ip.cardBorder}`,
        borderRadius: 2.5, p: 3, mb: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ bgcolor: 'rgba(37,99,235,0.1)', borderRadius: 1.5, p: 1.2, display: 'flex' }}>
            <StandardIcon sx={{ color: ip.statBlue, fontSize: '1.5rem' }} />
          </Box>
          <Box>
            <Typography variant="body1" sx={{ color: ip.heading, fontWeight: 700 }}>
              {currentPlanName}
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext }}>
              Renews annually • {SCHOOL_INSTITUTIONAL_PRICE_LANDING[currentPlanId]} • Next renewal: {nextRenewalLabel}
            </Typography>
          </Box>
        </Box>
        <Chip label="Active" sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#16a34a', fontWeight: 700 }} />
      </Box>

      <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 2 }}>
        Available plans
      </Typography>
      <Typography variant="body2" sx={{ color: ip.subtext, mb: 2 }}>
        Upgrades are prorated as the plan difference. From {currentPlanName}, you only pay the difference to move to a
        higher package; GST is added at checkout.
      </Typography>
      <Box data-tutorial-id="school-subscription-plans" sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(3, 1fr)' },
        gap: 2.5,
        mb: 4,
      }}>
        {plans.map(plan => {
          const planId = plan.id as RegisterPlanId;
          const isCurrentPlan = planId === currentPlanId;
          const isLowerPlan = PLAN_ORDER[planId] < PLAN_ORDER[currentPlanId];
          const canUpgrade = PLAN_ORDER[planId] > PLAN_ORDER[currentPlanId];
          const deltaBase = Math.max(0, SCHOOL_INSTITUTIONAL_BASE_INR[planId] - currentPlanPrice);
          const deltaTotalPaise = Math.round(deltaBase * 100 * (1 + SCHOOL_REGISTRATION_GST_RATE));
          const isBusy = upgradeBusy === planId;
          return (
            <Card
              key={plan.id}
              sx={{
                bgcolor: '#fff',
                boxShadow: isCurrentPlan ? 2 : 'none',
                border: isCurrentPlan ? `2px solid ${plan.accent}` : `1px solid ${ip.cardBorder}`,
                borderRadius: 2.5,
                position: 'relative',
                overflow: 'visible',
                transition: 'all 0.18s',
                pt: isCurrentPlan ? 1.5 : 0,
                '&:hover': {
                  border: `2px solid ${plan.accent}`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
            {isCurrentPlan && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: plan.accent,
                  color: '#fff',
                  px: 1.75,
                  py: 0.35,
                  borderRadius: 999,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                  whiteSpace: 'nowrap',
                }}
              >
                Current
              </Box>
            )}
            <CardContent sx={{ p: '24px !important', pt: isCurrentPlan ? '28px !important' : '24px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <plan.Icon sx={{ fontSize: '1.6rem', color: plan.accent }} />
                <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700 }}>{plan.name}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mb: 1.5, pl: 0.25 }}>
                {plan.rosterCap}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2 }}>
                <Typography variant="h4" sx={{ color: plan.accent, fontWeight: 800 }}>{plan.price}</Typography>
                <Typography variant="body2" sx={{ color: ip.subtext }}>{plan.per}</Typography>
              </Box>
              <Divider sx={{ borderColor: ip.cardBorder, mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3, minHeight: { md: 200 } }}>
                {plan.features.map(text => (
                  <Box key={text} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckIcon sx={{ fontSize: '1rem', color: '#16a34a', mt: '2px', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: ip.heading, fontSize: '0.875rem', lineHeight: 1.45 }}>
                      {text}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {isCurrentPlan ? (
                <Button
                  fullWidth
                  variant="outlined"
                  disabled
                  sx={{ borderColor: ip.cardBorder, color: ip.subtext, borderRadius: 1.5, fontWeight: 600 }}
                >
                  Current plan
                </Button>
              ) : isLowerPlan ? (
                <Button
                  fullWidth
                  variant="outlined"
                  disabled
                  sx={{ borderColor: ip.cardBorder, color: ip.heading, borderRadius: 1.5, fontWeight: 600, '&:hover': { bgcolor: ip.cardMutedBg } }}
                >
                  Lower plan
                </Button>
              ) : canUpgrade ? (
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<ArrowIcon />}
                  disabled={isInteractivePreview || upgradeBusy !== null}
                  onClick={() => {
                    setUpgradeErr(null);
                    setUpgradeTarget(plan);
                  }}
                  sx={{ bgcolor: plan.accent, fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: plan.accent, filter: 'brightness(0.9)' } }}
                >
                  {isInteractivePreview
                    ? 'Upgrade after sign-in'
                    : isBusy
                    ? 'Opening checkout…'
                    : `Upgrade for ${formatInrFromPaise(deltaTotalPaise)}`}
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ borderColor: ip.cardBorder, color: ip.heading, borderRadius: 1.5, fontWeight: 600, '&:hover': { bgcolor: ip.cardMutedBg } }}
                >
                  Contact sales
                </Button>
              )}
            </CardContent>
          </Card>
          );
        })}
      </Box>

      {/* EducationWorld strip - matches public For Schools page */}
      <Box
        sx={{
          borderRadius: '24px',
          bgcolor: '#eef4ff',
          px: { xs: 4, sm: 5, md: 6 },
          py: { xs: 4, sm: 5, md: 6 },
          mb: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: { xs: 3, sm: 4 } }}>
          <Box
            component="img"
            src="/EW%20logo.png"
            alt="EducationWorld"
            sx={{
              flexShrink: 0,
              height: { xs: 96, sm: 112 },
              width: 'auto',
              maxWidth: { xs: 176, sm: 208 },
              objectFit: 'contain',
            }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: ip.heading, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
              Presented by EducationWorld
            </Typography>
            <Typography sx={{ mt: 0.75, color: '#1e293b', fontSize: { xs: '0.9375rem', sm: '1rem' }, lineHeight: 1.6 }}>
              India&apos;s most trusted name in school assessment and ranking. Your data, our expertise.
              For the past 20 years, the annual EducationWorld India School Rankings - the world&apos;s
              largest and most comprehensive schools survey - has stimulated and motivated institutional
              managements to strive for delivering balanced holistic education and benchmark themselves
              with globally admired schools.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Billing info */}
      <Card data-tutorial-id="school-subscription-billing" sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2, boxShadow: 'none' }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700, mb: 2 }}>Billing information</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {[
              { label: 'Billing contact', value: isInteractivePreview ? GREENFIELD_POC_EMAIL : 'Principal / Academic Director' },
              {
                label: 'Payment method',
                value: latestPayment ? formatPaymentMethod(latestPayment.payment_method) : 'See your completed checkout',
              },
              { label: 'Next renewal', value: nextRenewalLabel },
              ...(billingMeta.billing?.invoice_number
                ? [{ label: 'Invoice reference', value: billingMeta.billing.invoice_number, mono: true }]
                : []),
            ].map(item => (
              <Box key={item.label} sx={{ flex: '1 1 180px', minWidth: 0, maxWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' } }}>
                <Typography variant="caption" sx={{ color: ip.subtext, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>
                  {item.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: ip.heading,
                    fontWeight: 500,
                    mt: 0.3,
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    ...('mono' in item && item.mono ? { fontFamily: 'ui-monospace, monospace' } : {}),
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
          {billingLoading && (
            <Typography variant="caption" sx={{ color: ip.subtext, display: 'block', mt: 1 }}>
              Loading billing details…
            </Typography>
          )}
          {!billingLoading && billingMeta.billing?.has_invoice_pdf && !billingMeta.s3Configured && !isInteractivePreview && (
            <Typography variant="caption" sx={{ color: '#b45309', display: 'block', mt: 1 }}>
              Invoice PDF is on file; downloads require S3 signing to be configured on the API (AWS keys + bucket).
            </Typography>
          )}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ color: ip.heading, fontWeight: 700, mb: 1.5 }}>
              Payment history
            </Typography>
            {billingLoading ? (
              <Typography variant="body2" sx={{ color: ip.subtext }}>
                Loading payment history…
              </Typography>
            ) : billingMeta.paymentHistory.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {billingMeta.paymentHistory.map((payment) => (
                  <Box
                    key={payment.payment_id}
                    sx={{
                      border: `1px solid ${ip.cardBorder}`,
                      borderRadius: 1.5,
                      p: 1.75,
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(6, minmax(0, 1fr))' },
                      gap: 1.5,
                      bgcolor: '#f8fafc',
                    }}
                  >
                    {[
                      { label: 'Paid on', value: formatDateLabel(payment.paid_at) },
                      { label: 'Package', value: planNameForHistory(payment.plan_id) },
                      {
                        label: 'Amount',
                        value: payment.amount_paise !== null ? formatInrFromPaise(payment.amount_paise) : 'Not available',
                      },
                      { label: 'Payment method', value: formatPaymentMethod(payment.payment_method) },
                      { label: 'Renewal date', value: formatDateLabel(payment.renewal_date) },
                    ].map((item) => (
                      <Box key={item.label} sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: ip.subtext, textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: 0.5 }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: ip.heading, fontWeight: 600, overflowWrap: 'anywhere', mt: 0.25 }}
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                    <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'flex-end' }}>
                      {(() => {
                        const canDownloadPaymentInvoice =
                          Boolean(payment.has_invoice_pdf) && billingMeta.s3Configured && !isInteractivePreview;
                        const isDownloadingThisInvoice = invoiceDownloadingPaymentId === payment.payment_id;
                        return (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={
                              isDownloadingThisInvoice ? (
                                <CircularProgress size={14} sx={{ color: ip.navy }} />
                              ) : (
                                <DownloadIcon sx={{ fontSize: '1.05rem' }} />
                              )
                            }
                            disabled={!canDownloadPaymentInvoice || invoiceDownloadingPaymentId !== null}
                            onClick={() => void handleDownloadInvoice(payment.payment_id)}
                            sx={{
                              borderColor: canDownloadPaymentInvoice ? ip.navy : ip.cardBorder,
                              color: canDownloadPaymentInvoice ? ip.navy : ip.subtext,
                              fontWeight: 600,
                              textTransform: 'none',
                              borderRadius: 1.5,
                              whiteSpace: 'nowrap',
                              '&:hover': canDownloadPaymentInvoice
                                ? { borderColor: ip.navy, bgcolor: 'rgba(16, 64, 139, 0.06)' }
                                : { bgcolor: ip.cardMutedBg },
                              '&.Mui-disabled': {
                                opacity: 1,
                                borderColor: ip.cardBorder,
                                color: ip.subtext,
                                bgcolor: '#f8fafc',
                              },
                            }}
                          >
                            Invoice PDF
                          </Button>
                        );
                      })()}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: ip.subtext }}>
                No completed school payments found yet.
              </Typography>
            )}
          </Box>
          <Divider sx={{ borderColor: ip.cardBorder, my: 2 }} />
          <Typography variant="caption" sx={{ color: ip.subtext, fontWeight: 600 }}>
            {isInteractivePreview ? 'Preview only - invoice download disabled' : 'Contact sales for custom pricing'}
          </Typography>
          {invoiceDownloadErr && (
            <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 1.5 }}>
              {invoiceDownloadErr}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(upgradeTarget)}
        onClose={() => {
          if (!upgradeBusy) setUpgradeTarget(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(15, 23, 42, 0.35)',
          },
        }}
        BackdropProps={{
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.58)',
            backdropFilter: 'blur(2px)',
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#FFFFFF',
            color: ip.heading,
            fontWeight: 800,
            px: 3,
            py: 2.25,
            borderBottom: `1px solid ${ip.cardBorder}`,
          }}
        >
          Confirm Subscription Upgrade
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#FFFFFF', px: 3, py: 0 }}>
          <Box sx={{ pt: 2.5, pb: 2.5 }}>
          <Box
            sx={{
              border: `1px solid ${ip.cardBorder}`,
              borderRadius: 2,
              bgcolor: ip.cardMutedBg,
              px: 2,
              py: 1.5,
              mb: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: ip.heading, fontWeight: 700 }}>
              {currentPlanName} → {upgradeTarget?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: ip.subtext, mt: 0.5, lineHeight: 1.5 }}>
              You only pay the difference between the two annual package prices. GST is added at checkout.
            </Typography>
          </Box>
          <Box
            sx={{
              border: `1px solid ${ip.cardBorder}`,
              borderRadius: 2,
              overflow: 'hidden',
              mb: 2,
              bgcolor: '#FFFFFF',
            }}
          >
            {[
              { label: `${upgradeTarget?.name ?? 'Target'} annual price`, value: formatInr(upgradeTarget ? SCHOOL_INSTITUTIONAL_BASE_INR[upgradeTarget.id as RegisterPlanId] : 0) },
              { label: `${currentPlanName} already paid`, value: `-${formatInr(currentPlanPrice)}` },
              { label: 'Upgrade difference before GST', value: formatInr(upgradeDeltaBaseInr) },
              { label: `GST @ ${Math.round(SCHOOL_REGISTRATION_GST_RATE * 100)}%`, value: formatInrFromPaise(upgradeDeltaGstPaise) },
              { label: 'Total due now', value: formatInrFromPaise(upgradeDeltaTotalPaise), strong: true },
            ].map((row) => (
              <Box
                key={row.label}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  px: 2,
                  py: row.strong ? 1.4 : 1.15,
                  bgcolor: row.strong ? ip.cardMutedBg : '#fff',
                  borderTop: row.strong ? `1px solid ${ip.cardBorder}` : 'none',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: row.strong ? ip.heading : '#475569', fontWeight: row.strong ? 800 : 600 }}
                >
                  {row.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: ip.heading, fontWeight: row.strong ? 900 : 700, whiteSpace: 'nowrap' }}
                >
                  {row.value}
                </Typography>
              </Box>
            ))}
          </Box>
          {upgradeErr && (
            <Alert
              severity="error"
              sx={{
                mb: 0,
                borderRadius: 2,
                bgcolor: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                '& .MuiAlert-icon': { color: '#dc2626' },
                '& .MuiAlert-message': { color: '#991b1b', fontWeight: 500 },
              }}
            >
              {upgradeErr}
            </Alert>
          )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#FFFFFF', px: 3, py: 2, borderTop: `1px solid ${ip.cardBorder}` }}>
          <Button
            onClick={() => setUpgradeTarget(null)}
            disabled={upgradeBusy !== null}
            sx={{
              color: ip.subtext,
              fontWeight: 700,
              textTransform: 'none',
              '&.Mui-disabled': { color: '#94a3b8' },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void startUpgradeCheckout()}
            disabled={upgradeBusy !== null || !upgradeTarget}
            sx={{
              bgcolor: upgradeTarget?.accent ?? ip.statBlue,
              color: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 1.5,
              px: 2.5,
              minWidth: 230,
              '&:hover': { bgcolor: upgradeTarget?.accent ?? ip.statBlue, filter: 'brightness(0.9)' },
              '&.Mui-disabled': {
                bgcolor: upgradeTarget?.accent ?? ip.statBlue,
                color: '#FFFFFF',
                opacity: 0.78,
              },
            }}
          >
            {upgradeBusy ? (
              <>
                <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />
                Opening checkout…
              </>
            ) : (
              'Confirm and pay difference'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
