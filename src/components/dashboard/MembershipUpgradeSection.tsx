import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Tooltip, Typography } from '@mui/material';
import { TrendingUp } from 'lucide-react';
import { auth } from '../../firebase/firebase';
import { getStudent, StudentProfileError } from '../../db/studentCollection';
import {
  createStudentUpgradeOrder,
  verifyStudentUpgradePayment,
} from '../../db/studentMembershipUpgradePayment';
import {
  formatInrFromPaise,
  MEMBERSHIP_LEVEL_LABEL,
  normalizeStudentMembershipLevel,
  studentMembershipUpgradeAmountPaise,
} from '../../utils/studentMembershipPricing';
import { useToast } from '../ui/use-toast';
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

  const startUpgrade = async (targetLevel: 1 | 2 | 3 | 4) => {
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
      const order = await createStudentUpgradeOrder(targetLevel);

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
        const detail = razorpayPaymentFailedUserMessage(response);
        toast({
          variant: 'destructive',
          title: 'Payment failed',
          description: detail || 'The transaction did not complete.',
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
          const upgradePriceLabel =
            paise !== null ? formatInrFromPaise(paise) : null;
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
                  onClick={() => void startUpgrade(pkg.level)}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none',
                    color: '#fff',
                    border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 45%, #2563eb 100%)',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.45)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #6d28d9 0%, #4338ca 45%, #1d4ed8 100%)',
                      boxShadow: '0 6px 18px rgba(124, 58, 237, 0.55)',
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
                    : `Pay ${upgradePriceLabel}`}
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
    </Paper>
  );
};

export default MembershipUpgradeSection;
