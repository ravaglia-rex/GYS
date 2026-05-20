import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { TrendingUp } from 'lucide-react';
import { auth } from '../../firebase/firebase';
import { getStudent, StudentProfileError } from '../../db/studentCollection';
import {
  createStudentUpgradeOrder,
  type StudentUpgradeBillingDetails,
  verifyStudentUpgradePayment,
} from '../../db/studentMembershipUpgradePayment';
import {
  MEMBERSHIP_LEVEL_LABEL,
  normalizeStudentMembershipLevel,
  studentMembershipUpgradeAmountPaise,
} from '../../utils/studentMembershipPricing';
import { normalizeIndiaMobileE164 } from '../../utils/indiaMobile';
import {
  cityOk,
  RAZORPAY_CITY_MAX,
  RAZORPAY_CITY_MIN,
  RAZORPAY_SHIP_LINE1_MAX,
  RAZORPAY_SHIP_LINE1_MIN,
  RAZORPAY_SHIP_LINE2_MAX,
  RAZORPAY_SHIP_LINE2_MIN,
  sanitizeLatinNameInput,
  sanitizeShipLineInput,
  shipLine1Ok,
  shipLine2Ok,
  shipLineCharsError,
  stateOk,
} from '../../utils/schoolRegistrationPaymentRules';
import { useToast } from '../ui/use-toast';
import { gysPaymentInvoiceNumberFromOrderId } from '../../utils/gysPaymentInvoiceNumber';
import * as Sentry from '@sentry/react';

const loadScript = (src: string): Promise<boolean> =>
  new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function razorpayPaymentFailedUserMessage(payload: unknown): string {
  const err =
    payload && typeof payload === 'object' && 'error' in payload
      ? (payload as { error?: Record<string, unknown> }).error
      : undefined;
  if (!err) return '';
  const bits: string[] = [];
  for (const k of ['code', 'description', 'reason', 'source', 'step', 'field'] as const) {
    const v = err[k];
    if (typeof v === 'string' && v.trim()) bits.push(v.trim());
  }
  const meta = err.metadata;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    for (const v of Object.values(meta as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim()) bits.push(v.trim());
    }
  }
  return bits.filter((b, i) => bits.indexOf(b) === i).join(' - ');
}

function formatRsFromPaise(paise: number): string {
  return `Rs ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100)}`;
}

type UpgradeBillingForm = {
  billingPhone: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
};

type UpgradeBillingErrors = Partial<Record<keyof UpgradeBillingForm, string>>;

const EMPTY_BILLING_FORM: UpgradeBillingForm = {
  billingPhone: '',
  billingAddressLine1: '',
  billingAddressLine2: '',
  billingCity: '',
  billingState: '',
  billingPostalCode: '',
};

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi NCT',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

function FormFieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-0.5 text-[11px] leading-snug text-slate-300">{children}</p>;
}

function FormFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-red-300" role="alert">
      {message}
    </p>
  );
}

function billingInputClass(hasError: boolean, extra = ''): string {
  return [
    'mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-50',
    'placeholder:text-slate-300/35 placeholder:opacity-100',
    'bg-slate-700/90 focus:outline-none focus:ring-1',
    '[&:-webkit-autofill]:[-webkit-text-fill-color:rgb(248_250_252)] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_rgb(51_65_85)]',
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/50'
      : 'border-slate-500 focus:border-violet-400 focus:ring-violet-400/40',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

function getBillingErrors(details: UpgradeBillingForm): UpgradeBillingErrors {
  const errors: UpgradeBillingErrors = {};
  const normalizedPhone = normalizeIndiaMobileE164(details.billingPhone);
  const line1 = details.billingAddressLine1.trim();
  const line2 = details.billingAddressLine2.trim();
  const city = details.billingCity.trim();
  const state = details.billingState.trim();
  const postalCode = details.billingPostalCode.trim();

  if (!normalizedPhone) {
    errors.billingPhone = 'Enter a valid India mobile number: 10 digits starting with 6-9, or +91 followed by 10 digits.';
  }
  if (!line1) {
    errors.billingAddressLine1 = 'Address line 1 is required.';
  } else if (!shipLine1Ok(line1)) {
    errors.billingAddressLine1 =
      line1.length < RAZORPAY_SHIP_LINE1_MIN || line1.length > RAZORPAY_SHIP_LINE1_MAX
        ? `Address line 1 must be ${RAZORPAY_SHIP_LINE1_MIN}-${RAZORPAY_SHIP_LINE1_MAX} characters.`
        : shipLineCharsError('Address line 1');
  }
  if (line2 && !shipLine2Ok(line2)) {
    errors.billingAddressLine2 =
      line2.length < RAZORPAY_SHIP_LINE2_MIN || line2.length > RAZORPAY_SHIP_LINE2_MAX
        ? `Address line 2 must be ${RAZORPAY_SHIP_LINE2_MIN}-${RAZORPAY_SHIP_LINE2_MAX} characters when provided.`
        : shipLineCharsError('Address line 2');
  }
  if (!city) {
    errors.billingCity = 'City is required.';
  } else if (!cityOk(city)) {
    errors.billingCity =
      city.length < RAZORPAY_CITY_MIN || city.length > RAZORPAY_CITY_MAX
        ? `City must be ${RAZORPAY_CITY_MIN}-${RAZORPAY_CITY_MAX} characters.`
        : 'City may only contain English letters and spaces.';
  }
  if (!state || !INDIAN_STATES.includes(state) || !stateOk(state)) {
    errors.billingState = 'Select the full Indian state or union territory name.';
  }
  if (!postalCode) {
    errors.billingPostalCode = 'PIN code is required.';
  } else if (!/^[1-9]\d{5}$/.test(postalCode)) {
    errors.billingPostalCode = 'PIN code must be 6 digits and cannot start with 0.';
  }

  return errors;
}

function toUpgradeBillingDetails(details: UpgradeBillingForm): StudentUpgradeBillingDetails {
  return {
    contact: normalizeIndiaMobileE164(details.billingPhone) ?? details.billingPhone.trim(),
    line1: details.billingAddressLine1.trim(),
    line2: details.billingAddressLine2.trim(),
    city: details.billingCity.trim(),
    state: details.billingState.trim(),
    zipcode: details.billingPostalCode.trim(),
  };
}

const TARGETS: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

/** Same layout copy as the dashboard billing preview – package names come from `MEMBERSHIP_LEVEL_LABEL`. */
const MEMBERSHIP_PACKAGE_CARDS: Array<{
  level: 1 | 2 | 3 | 4;
  blurb: string;
  note: string;
}> = [
  {
    level: 1,
    blurb: 'One-time Trial entry - Symbolic Reasoning (Exam 1).',
    note: 'Not annual',
  },
  {
    level: 2,
    blurb: 'Annual - Exams 1–3 (Reasoning track).',
    note: 'Annual billing',
  },
  {
    level: 3,
    blurb: 'Annual - adds English & AI (Exams 4–5).',
    note: 'Annual billing',
  },
  {
    level: 4,
    blurb: 'Annual - Insight exams & counseling features (6–7).',
    note: 'Annual billing',
  },
];

const MembershipUpgradeSection: React.FC = () => {
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [loading, setLoading] = useState(true);
  const [membershipLevel, setMembershipLevel] = useState<number>(0);
  const [busyTarget, setBusyTarget] = useState<1 | 2 | 3 | 4 | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [billingTarget, setBillingTarget] = useState<1 | 2 | 3 | 4 | null>(null);
  const [billingDetails, setBillingDetails] = useState<UpgradeBillingForm>(EMPTY_BILLING_FORM);
  const [showBillingErrors, setShowBillingErrors] = useState(false);

  const refreshProfile = useCallback(async () => {
    const u = auth.currentUser?.uid;
    if (!u) {
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getStudent(u);
      setMembershipLevel(normalizeStudentMembershipLevel(data?.membership_level));
    } catch (e) {
      if (e instanceof StudentProfileError) {
        setLoadError(e.message);
      } else {
        setLoadError('Could not load your membership.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [uid, refreshProfile]);

  const billingErrors = getBillingErrors(billingDetails);
  const billingReady = Object.keys(billingErrors).length === 0;

  const openBillingPrompt = (targetLevel: 1 | 2 | 3 | 4) => {
    setBillingTarget(targetLevel);
    setShowBillingErrors(false);
  };

  const updateBillingDetails =
    (field: keyof UpgradeBillingForm) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setBillingDetails((prev) => ({ ...prev, [field]: value }));
      };

  const updateBillingState = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setBillingDetails((prev) => ({ ...prev, billingState: value }));
  };

  const updateBillingAddressLine =
    (field: 'billingAddressLine1' | 'billingAddressLine2') =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = sanitizeShipLineInput(event.target.value);
        setBillingDetails((prev) => ({ ...prev, [field]: value }));
      };

  const updateBillingCity = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeLatinNameInput(event.target.value);
    setBillingDetails((prev) => ({ ...prev, billingCity: value }));
  };

  const updateBillingPostalCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6);
    setBillingDetails((prev) => ({ ...prev, billingPostalCode: value }));
  };

  const submitBillingPrompt = () => {
    if (!billingTarget) return;
    if (!billingReady) {
      setShowBillingErrors(true);
      return;
    }
    const targetLevel = billingTarget;
    setBillingTarget(null);
    setShowBillingErrors(false);
    void startUpgrade(targetLevel, toUpgradeBillingDetails(billingDetails));
  };

  const startUpgrade = async (targetLevel: 1 | 2 | 3 | 4, billing: StudentUpgradeBillingDetails) => {
    const user = auth.currentUser;
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Sign in required',
        description: 'Please sign in to upgrade your membership.',
      });
      return;
    }

    setBusyTarget(targetLevel);
    try {
      const order = await createStudentUpgradeOrder(targetLevel, billing);

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
      const email = user.email?.trim() ?? '';

      const options = {
        key: order.key_id,
        order_id: order.order_id,
        amount: String(amountPaise),
        currency,
        ...(checkoutConfigId ? { checkout_config_id: checkoutConfigId } : {}),
        name: 'Global Young Scholar',
        description: `Membership upgrade - ${MEMBERSHIP_LEVEL_LABEL[targetLevel]}`,
        image: 'https://argus-s3-bucket.s3.us-east-1.amazonaws.com/logos/argus.png',
        prefill: email ? { email } : {},
        notes: {
          invoice_number: gysPaymentInvoiceNumberFromOrderId(order.order_id),
          purpose: 'student_membership_upgrade',
          target_membership_level: String(targetLevel),
        },
        theme: { color: '#1e3a8a' },
        handler: async (response: {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        }) => {
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            setBusyTarget(null);
            toast({
              variant: 'destructive',
              title: 'Payment incomplete',
              description: 'Missing payment details from Razorpay. Please try again.',
            });
            return;
          }
          try {
            await verifyStudentUpgradePayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setBusyTarget(null);
            await refreshProfile();
            toast({
              title: 'Membership updated',
              description: `You now have ${MEMBERSHIP_LEVEL_LABEL[targetLevel]}.`,
            });
          } catch (err: unknown) {
            setBusyTarget(null);
            const message = err instanceof Error ? err.message : 'Verification failed';
            Sentry.withScope((scope) => {
              scope.setTag('location', 'MembershipUpgradeSection.handler');
              Sentry.captureException(err);
            });
            toast({
              variant: 'destructive',
              title: 'Could not apply upgrade',
              description: message,
            });
          }
        },
        modal: {
          ondismiss: () => {
            setBusyTarget(null);
          },
        },
      };

      const rzp = new RazorpayCtor(options);
      rzp.on('payment.failed', (response: unknown) => {
        setBusyTarget(null);
        const err =
          response && typeof response === 'object' && 'error' in response
            ? (response as { error?: Record<string, unknown> }).error
            : undefined;
        const detail = razorpayPaymentFailedUserMessage(response);
        Sentry.withScope((scope) => {
          scope.setTag('location', 'MembershipUpgradeSection.payment.failed');
          scope.setContext('razorpay', { error: err });
          Sentry.captureMessage(
            detail ? `Razorpay payment.failed: ${detail}` : 'Razorpay payment.failed'
          );
        });
      });
      rzp.open();
    } catch (err: unknown) {
      setBusyTarget(null);
      const message = err instanceof Error ? err.message : 'Payment could not start';
      Sentry.withScope((scope) => {
        scope.setTag('location', 'MembershipUpgradeSection.startUpgrade');
        Sentry.captureException(err);
      });
      toast({
        variant: 'destructive',
        title: 'Checkout error',
        description: message,
      });
    }
  };

  if (!uid) {
    return (
      <Paper
        sx={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          p: 3,
          mb: 4,
        }}
      >
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.75)' }}>
          Sign in to view membership upgrades.
        </Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper
        sx={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          p: 4,
          mb: 4,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={32} sx={{ color: '#8b5cf6' }} />
      </Paper>
    );
  }

  if (loadError) {
    return (
      <Paper
        sx={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          p: 3,
          mb: 4,
        }}
      >
        <Typography variant="body2" sx={{ color: '#fecaca', mb: 1 }}>
          {loadError}
        </Typography>
        <Button size="small" variant="outlined" onClick={() => void refreshProfile()} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
          Retry
        </Button>
      </Paper>
    );
  }

  const atHighestTier =
    membershipLevel === 4 ||
    TARGETS.every((t) => studentMembershipUpgradeAmountPaise(membershipLevel, t) === null);

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        backgroundColor: 'rgba(30, 41, 59, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TrendingUp size={22} color="#a78bfa" />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Membership Packages
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 2 }}>
        Trial first, then three annual packages - Reasoning Triad, Reasoning + Skills, and Guided Decision. Your current
        package is highlighted. Amounts shown are list prices (excluding GST); applicable tax is added on the Razorpay
        payment screen. When upgrading you pay only the list-price difference (Trial Discovery credits toward higher
        tiers the same way).
      </Typography>
      {atHighestTier ? (
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', mb: 2 }}>
          You already have the highest package. Exam fees and other billing are below.
        </Typography>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {MEMBERSHIP_PACKAGE_CARDS.map((pkg) => {
          const paise = studentMembershipUpgradeAmountPaise(membershipLevel, pkg.level);
          const isCurrent = membershipLevel === pkg.level;
          const isLowerTier = membershipLevel > pkg.level;
          const upgradePriceLabel = paise !== null ? formatRsFromPaise(paise) : null;
          const checkoutBusy = busyTarget !== null;

          return (
            <Paper
              key={pkg.level}
              elevation={0}
              sx={{
                p: 2,
                position: 'relative',
                bgcolor: isCurrent ? 'rgba(139, 92, 246, 0.14)' : 'rgba(15, 23, 42, 0.6)',
                border: isCurrent
                  ? '2px solid rgba(167, 139, 250, 0.75)'
                  : '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: 2,
                boxShadow: isCurrent ? '0 0 24px rgba(139, 92, 246, 0.18)' : undefined,
              }}
            >
              {isCurrent ? (
                <Typography
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: '#c4b5fd',
                    textTransform: 'uppercase',
                  }}
                >
                  Current
                </Typography>
              ) : null}
              <Typography
                sx={{
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {pkg.note}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  mt: 0.75,
                  lineHeight: 1.3,
                  pr: isCurrent ? 5 : 0,
                }}
              >
                {MEMBERSHIP_LEVEL_LABEL[pkg.level]}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 2, minHeight: 44 }}>
                {pkg.blurb}
              </Typography>
              {isCurrent ? (
                <Button
                  fullWidth
                  variant="outlined"
                  disabled
                  sx={{
                    borderColor: 'rgba(167, 139, 250, 0.6)',
                    color: '#e9d5ff',
                    fontWeight: 600,
                  }}
                >
                  Current plan
                </Button>
              ) : isLowerTier ? (
                <Tooltip title="You've already moved past this package.">
                  <span>
                    <Button fullWidth variant="outlined" disabled sx={{ borderColor: '#64748b', color: '#94a3b8' }}>
                      Upgrade
                    </Button>
                  </span>
                </Tooltip>
              ) : paise !== null ? (
                <Button
                  fullWidth
                  variant="contained"
                  disabled={checkoutBusy}
                  onClick={() => openBillingPrompt(pkg.level)}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none',
                    color: '#fff',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6d28d9 0%, #4338ca 48%, #1d4ed8 100%)',
                    boxShadow: '0 3px 10px rgba(79, 70, 229, 0.28)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5b21b6 0%, #3730a3 48%, #1e40af 100%)',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.34)',
                    },
                    '&:disabled': {
                      color: 'rgba(255,255,255,0.85)',
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.45), rgba(37,99,235,0.45))',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {busyTarget === pkg.level
                    ? 'Opening checkout…'
                    : `Upgrade ${upgradePriceLabel}`}
                </Button>
              ) : (
                <Button fullWidth variant="outlined" disabled sx={{ borderColor: '#64748b', color: '#94a3b8' }}>
                  —
                </Button>
              )}
            </Paper>
          );
        })}
      </Box>
      <Dialog
        open={billingTarget !== null}
        onClose={() => {
          if (busyTarget === null) {
            setBillingTarget(null);
            setShowBillingErrors(false);
          }
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}>
          Billing details
         
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important', color: '#e2e8f0' }}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-100">
                Mobile number<span className="text-red-300"> *</span>
              </label>
              <FormFieldHint>
                10-digit India mobile number starting with 6-9, or +91 followed by 10 digits.
              </FormFieldHint>
              <input
                type="tel"
                value={billingDetails.billingPhone}
                onChange={updateBillingDetails('billingPhone')}
                aria-invalid={Boolean((showBillingErrors || billingDetails.billingPhone) && billingErrors.billingPhone)}
                className={billingInputClass(Boolean((showBillingErrors || billingDetails.billingPhone) && billingErrors.billingPhone))}
                placeholder="+91 98765 43210"
                autoComplete="tel"
                required
              />
              <FormFieldError
                message={(showBillingErrors || billingDetails.billingPhone) ? billingErrors.billingPhone : undefined}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-100">
                Address line 1<span className="text-red-300"> *</span>
              </label>
              <FormFieldHint>
                {RAZORPAY_SHIP_LINE1_MIN}-{RAZORPAY_SHIP_LINE1_MAX} characters. English letters,
                numbers, spaces, and standard symbols only.
              </FormFieldHint>
              <input
                type="text"
                value={billingDetails.billingAddressLine1}
                maxLength={RAZORPAY_SHIP_LINE1_MAX}
                aria-invalid={Boolean((showBillingErrors || billingDetails.billingAddressLine1) && billingErrors.billingAddressLine1)}
                onChange={updateBillingAddressLine('billingAddressLine1')}
                className={billingInputClass(Boolean((showBillingErrors || billingDetails.billingAddressLine1) && billingErrors.billingAddressLine1))}
                placeholder="House / apartment, street"
                autoComplete="address-line1"
                required
              />
              <FormFieldError
                message={(showBillingErrors || billingDetails.billingAddressLine1) ? billingErrors.billingAddressLine1 : undefined}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-100">Address line 2</label>
              <FormFieldHint>
                Optional. If filled: {RAZORPAY_SHIP_LINE2_MIN}-{RAZORPAY_SHIP_LINE2_MAX} characters,
                same character rules as line 1: English letters, numbers, spaces, and standard punctuation.
              </FormFieldHint>
              <input
                type="text"
                value={billingDetails.billingAddressLine2}
                maxLength={RAZORPAY_SHIP_LINE2_MAX}
                aria-invalid={Boolean((showBillingErrors || billingDetails.billingAddressLine2) && billingErrors.billingAddressLine2)}
                onChange={updateBillingAddressLine('billingAddressLine2')}
                className={billingInputClass(Boolean((showBillingErrors || billingDetails.billingAddressLine2) && billingErrors.billingAddressLine2))}
                placeholder="Area / landmark"
                autoComplete="address-line2"
              />
              <FormFieldError
                message={(showBillingErrors || billingDetails.billingAddressLine2) ? billingErrors.billingAddressLine2 : undefined}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-100">
                  City<span className="text-red-300"> *</span>
                </label>
                <FormFieldHint>
                  {RAZORPAY_CITY_MIN}-{RAZORPAY_CITY_MAX} characters. English letters and spaces only.
                </FormFieldHint>
                <input
                  type="text"
                  value={billingDetails.billingCity}
                  minLength={RAZORPAY_CITY_MIN}
                  maxLength={RAZORPAY_CITY_MAX}
                  aria-invalid={Boolean((showBillingErrors || billingDetails.billingCity) && billingErrors.billingCity)}
                  onChange={updateBillingCity}
                  className={billingInputClass(Boolean((showBillingErrors || billingDetails.billingCity) && billingErrors.billingCity))}
                  placeholder="Bengaluru"
                  autoComplete="address-level2"
                  required
                />
                <FormFieldError
                  message={(showBillingErrors || billingDetails.billingCity) ? billingErrors.billingCity : undefined}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-100">
                  State<span className="text-red-300"> *</span>
                </label>
                <FormFieldHint>Select the full Indian state or union territory name.</FormFieldHint>
                <select
                  value={billingDetails.billingState}
                  aria-invalid={Boolean((showBillingErrors || billingDetails.billingState) && billingErrors.billingState)}
                  onChange={updateBillingState}
                  className={billingInputClass(
                    Boolean((showBillingErrors || billingDetails.billingState) && billingErrors.billingState),
                    billingDetails.billingState ? '' : 'text-slate-300/35',
                  )}
                  autoComplete="address-level1"
                  required
                >
                  <option value="" className="text-slate-500">
                    Select state
                  </option>
                  {INDIAN_STATES.map((stateName) => (
                    <option key={stateName} value={stateName}>
                      {stateName}
                    </option>
                  ))}
                </select>
                <FormFieldError
                  message={(showBillingErrors || billingDetails.billingState) ? billingErrors.billingState : undefined}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-100">Country</label>
              <FormFieldHint>India - required by Razorpay for this checkout.</FormFieldHint>
              <input
                type="text"
                value="India"
                readOnly
                disabled
                aria-label="Country - India only"
                className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-slate-500 bg-slate-700/50 px-3.5 py-2.5 text-sm text-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-100">
                PIN code<span className="text-red-300"> *</span>
              </label>
              <FormFieldHint>6 digits; first digit must be 1–9 (Indian PIN code).</FormFieldHint>
              <input
                type="text"
                inputMode="numeric"
                value={billingDetails.billingPostalCode}
                maxLength={6}
                aria-invalid={Boolean((showBillingErrors || billingDetails.billingPostalCode) && billingErrors.billingPostalCode)}
                onChange={updateBillingPostalCode}
                className={billingInputClass(Boolean((showBillingErrors || billingDetails.billingPostalCode) && billingErrors.billingPostalCode))}
                placeholder="560001"
                autoComplete="postal-code"
                required
              />
              <FormFieldError
                message={(showBillingErrors || billingDetails.billingPostalCode) ? billingErrors.billingPostalCode : undefined}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setBillingTarget(null);
              setShowBillingErrors(false);
            }}
            disabled={busyTarget !== null}
            sx={{ color: 'rgba(255,255,255,0.75)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={busyTarget !== null}
            onClick={submitBillingPrompt}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6d28d9 0%, #4338ca 48%, #1d4ed8 100%)',
            }}
          >
            {busyTarget !== null ? 'Opening checkout...' : 'Continue to Razorpay'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MembershipUpgradeSection;
