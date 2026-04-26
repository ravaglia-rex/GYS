import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
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

  const upgrades = TARGETS.map((t) => {
    const paise = studentMembershipUpgradeAmountPaise(membershipLevel, t);
    return paise === null ? null : { target: t, paise };
  }).filter((x): x is { target: 1 | 2 | 3 | 4; paise: number } => x !== null);

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <TrendingUp size={22} color="#a78bfa" />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Membership upgrade
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.72)', mb: 2 }}>
        Three annual membership levels (plus Discovery as a one-time entry). Current plan:{' '}
        <Box component="span" sx={{ color: '#e9d5ff', fontWeight: 600 }}>
          {membershipLevel === 0
            ? 'No paid tier yet'
            : MEMBERSHIP_LEVEL_LABEL[membershipLevel as 1 | 2 | 3 | 4]}
        </Box>
        . Prices include 18% GST; you only pay the difference when moving up. Discovery is credited toward
        higher tiers the same way - list difference only.
      </Typography>

      {upgrades.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)' }}>
          You already have the highest package. Exam fees and other billing are below.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {upgrades.map(({ target, paise }) => (
            <Box
              key={target}
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                py: 1.5,
                px: 2,
                borderRadius: 2,
                bgcolor: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
              }}
            >
              <Box>
                <Typography sx={{ color: 'white', fontWeight: 600 }}>{MEMBERSHIP_LEVEL_LABEL[target]}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                  {formatInrFromPaise(paise)} today
                </Typography>
              </Box>
              <Button
                variant="contained"
                disabled={busyTarget !== null}
                onClick={() => void startUpgrade(target)}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #7c3aed, #2563eb)',
                  '&:hover': { background: 'linear-gradient(45deg, #6d28d9, #1d4ed8)' },
                }}
              >
                {busyTarget === target ? 'Opening checkout…' : `Pay ${formatInrFromPaise(paise)}`}
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default MembershipUpgradeSection;
