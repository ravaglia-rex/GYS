import React, { useState } from 'react';
import { useToast } from '../ui/use-toast';
import {
  createStudentRegistrationOrder,
  devBypassStudentSignupPaymentClaim,
  verifyStudentRegistrationPayment,
} from '../../db/studentRegistrationPayment';
import * as Sentry from '@sentry/react';

function isStudentSignupRazorpayDevBypass(): boolean {
  const v = (process.env.REACT_APP_DEV_BYPASS_STUDENT_RAZORPAY ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

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

export type StudentRegistrationRazorpayCheckoutProps = {
  email: string;
  membershipLevel: 1 | 2 | 3 | 4;
  planLabel: string;
  /** Called after server verifies payment; create Firebase user + runSignUpTransaction here. */
  onPaymentVerified: (razorpayPaymentId: string) => Promise<void>;
};

const StudentRegistrationRazorpayCheckout: React.FC<StudentRegistrationRazorpayCheckoutProps> = ({
  email,
  membershipLevel,
  planLabel,
  onPaymentVerified,
}) => {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const startCheckout = async () => {
    setBusy(true);
    try {
      if (isStudentSignupRazorpayDevBypass()) {
        const { razorpay_payment_id: pid } = await devBypassStudentSignupPaymentClaim(email, membershipLevel);
        setBusy(false);
        await onPaymentVerified(pid);
        return;
      }

      const order = await createStudentRegistrationOrder(email, membershipLevel);

      if (process.env.NODE_ENV === 'development' && typeof order.key_id === 'string') {
        console.info('[StudentSignupRazorpay] key_id prefix:', order.key_id.slice(0, 16));
      }

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

      const options = {
        key: order.key_id,
        order_id: order.order_id,
        amount: String(amountPaise),
        currency,
        ...(checkoutConfigId ? {checkout_config_id: checkoutConfigId} : {}),
        name: 'Global Young Scholar',
        description: `${planLabel} - membership`,
        image: 'https://argus-s3-bucket.s3.us-east-1.amazonaws.com/logos/argus.png',
        prefill: {
          email: email.trim().toLowerCase(),
        },
        notes: {
          purpose: 'student_registration',
          membership_level: String(membershipLevel),
        },
        theme: { color: '#1e3a8a' },
        handler: async (response: {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        }) => {
          if (
            !response.razorpay_payment_id ||
            !response.razorpay_order_id ||
            !response.razorpay_signature
          ) {
            setBusy(false);
            toast({
              variant: 'destructive',
              title: 'Payment incomplete',
              description: 'Missing payment details from Razorpay. Please try again.',
            });
            return;
          }
          try {
            await verifyStudentRegistrationPayment({
              email: email.trim().toLowerCase(),
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setBusy(false);
            await onPaymentVerified(response.razorpay_payment_id);
          } catch (err: unknown) {
            setBusy(false);
            const message = err instanceof Error ? err.message : 'Verification or signup failed';
            Sentry.withScope((scope) => {
              scope.setTag('location', 'StudentRegistrationRazorpayCheckout.handler');
              Sentry.captureException(err);
            });
            toast({
              variant: 'destructive',
              title: 'Could not finish signup',
              description: message,
            });
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
          },
        },
      };

      const rzp = new RazorpayCtor(options);
      rzp.on('payment.failed', (response: unknown) => {
        setBusy(false);
        if (process.env.NODE_ENV === 'development') {
          console.warn('[StudentSignupRazorpay] payment.failed:', response);
        }
        const err =
          response && typeof response === 'object' && 'error' in response
            ? (response as { error?: Record<string, unknown> }).error
            : undefined;
        const detail = razorpayPaymentFailedUserMessage(response);
        if (detail) {
          Sentry.withScope((scope) => {
            scope.setTag('location', 'StudentRegistrationRazorpayCheckout.payment.failed');
            scope.setContext('razorpay', { error: err });
            Sentry.captureMessage(`Razorpay payment.failed: ${detail}`);
          });
        }
        toast({
          variant: 'destructive',
          title: 'Payment failed',
          description: detail || 'The transaction did not complete.',
        });
      });
      rzp.open();
    } catch (err: unknown) {
      setBusy(false);
      const message = err instanceof Error ? err.message : 'Payment could not start';
      Sentry.withScope((scope) => {
        scope.setTag('location', 'StudentRegistrationRazorpayCheckout.startCheckout');
        Sentry.captureException(err);
      });
      toast({
        variant: 'destructive',
        title: 'Checkout error',
        description: message,
      });
    }
  };

  return (
    <button
      type="button"
      onClick={() => void startCheckout()}
      disabled={busy}
      className="mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-base sm:text-lg font-semibold text-white shadow-md hover:brightness-110 active:scale-[0.99] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundColor: '#1e3a8a' }}
    >
      {busy
        ? isStudentSignupRazorpayDevBypass()
          ? 'Skipping payment (dev)…'
          : 'Opening secure checkout…'
        : isStudentSignupRazorpayDevBypass()
          ? `Dev: skip Razorpay — continue as ${planLabel}`
          : `Pay ${planLabel} securely with Razorpay`}
    </button>
  );
};

export default StudentRegistrationRazorpayCheckout;
