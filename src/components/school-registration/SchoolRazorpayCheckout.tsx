import React, { useState } from 'react';
import { useToast } from '../ui/use-toast';
import {
  createSchoolRazorpayOrder,
  verifySchoolRazorpayPayment,
} from '../../db/schoolCollection';
import * as Sentry from '@sentry/react';

/** Best-effort string for Razorpay `payment.failed` payloads (shape varies by version). */
function razorpayPaymentFailedUserMessage(payload: unknown): string {
  const err =
    payload && typeof payload === 'object' && 'error' in payload
      ? (payload as { error?: Record<string, unknown> }).error
      : undefined;
  if (!err) {
    return '';
  }
  const bits: string[] = [];
  for (const k of ['code', 'description', 'reason', 'source', 'step', 'field'] as const) {
    const v = err[k];
    if (typeof v === 'string' && v.trim()) {
      bits.push(v.trim());
    }
  }
  const meta = err.metadata;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    for (const v of Object.values(meta as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim()) {
        bits.push(v.trim());
      }
    }
  }
  return bits.filter((b, i) => bits.indexOf(b) === i).join(' - ');
}

const loadScript = (src: string): Promise<boolean> =>
  new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export type SchoolRazorpayCheckoutProps = {
  schoolId: string;
  checkoutSecret: string;
  schoolName: string;
  pocEmail: string;
  planName: string;
  onSuccess: () => void;
  /**
   * E.164 (e.g. +919876543210). US/cross-border INR: Razorpay docs say payments can fail if you pass dummy
   * customer phone/email - do not send a fake number; omit this prop to let the customer enter contact in Checkout.
   */
  prefillContactE164?: string;
};

/**
 * Loads Razorpay Standard Checkout for school registration (order created server-side).
 */
const SchoolRazorpayCheckout: React.FC<SchoolRazorpayCheckoutProps> = ({
  schoolId,
  checkoutSecret,
  schoolName,
  pocEmail,
  planName,
  onSuccess,
  prefillContactE164,
}) => {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const startCheckout = async () => {
    setBusy(true);
    try {
      const order = await createSchoolRazorpayOrder(schoolId, checkoutSecret);

      // Checkout key must match the backend that created the order (not REACT_APP_RAZORPAY_KEY_ID).
      if (process.env.NODE_ENV === 'development' && typeof order.key_id === 'string') {
        if (order.key_id.startsWith('rzp_live_')) {
          console.warn(
            '[SchoolRazorpay] createSchoolOrder returned a LIVE key_id; set RAZORPAY_KEY_ID/SECRET to test keys on the API for local testing.'
          );
        }
        console.info('[SchoolRazorpay] using key_id prefix:', order.key_id.slice(0, 16));
      }

      const scriptOk = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptOk) {
        throw new Error('Could not load Razorpay checkout');
      }

      const invoiceNumber = `${order.order_id.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30)}_gys`;

      const RazorpayCtor = (window as unknown as {
        Razorpay?: new (o: object) => { open: () => void; on: (e: string, fn: (r: unknown) => void) => void };
      }).Razorpay;
      if (!RazorpayCtor) {
        throw new Error('Razorpay SDK unavailable');
      }

      // Orders API uses paise; Checkout must match the order (amount + currency from createSchoolOrder).
      const amountPaise = Math.round(Number(order.amount));
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        throw new Error('Invalid payment amount from server');
      }
      const currencyRaw = typeof order.currency === 'string' ? order.currency.trim().toUpperCase() : '';
      const currency = currencyRaw.length === 3 ? currencyRaw : 'INR';
      if (
        process.env.NODE_ENV === 'development' &&
        typeof order.key_id === 'string' &&
        order.key_id.includes('_us_') &&
        currency === 'INR'
      ) {
        console.warn(
          '[SchoolRazorpay] US/cross-border merchant (rzp_test_us_*). Razorpay: dummy customer phone/email can fail international INR - we no longer prefill a fake +91 number; enter a real-looking number in Checkout. UPI/netbanking may need Razorpay activation for your account.'
        );
      }

      const contactTrim =
        typeof prefillContactE164 === 'string' ? prefillContactE164.trim() : '';
      const prefill: Record<string, string> = {
        name: schoolName.slice(0, 120),
        email: pocEmail,
      };
      if (contactTrim.length >= 12 && contactTrim.startsWith('+')) {
        prefill.contact = contactTrim;
      }

      const checkoutConfigId =
        typeof order.checkout_config_id === 'string' ? order.checkout_config_id.trim() : '';

      const options = {
        key: order.key_id,
        order_id: order.order_id,
        amount: String(amountPaise),
        currency,
        ...(checkoutConfigId ? {checkout_config_id: checkoutConfigId} : {}),
        name: 'Global Young Scholar',
        description: `${planName} - ${schoolName}`,
        image: 'https://argus-s3-bucket.s3.us-east-1.amazonaws.com/logos/argus.png',
        prefill,
        notes: {
          invoice_number: invoiceNumber,
          school_id: schoolId,
          plan: planName,
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
            await verifySchoolRazorpayPayment({
              school_id: schoolId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setBusy(false);
            toast({
              title: 'Payment successful',
              description: 'Your institutional subscription payment was confirmed.',
            });
            onSuccess();
          } catch (err: unknown) {
            setBusy(false);
            const message = err instanceof Error ? err.message : 'Verification failed';
            Sentry.withScope((scope) => {
              scope.setTag('location', 'SchoolRazorpayCheckout.verify');
              Sentry.captureException(err);
            });
            toast({
              variant: 'destructive',
              title: 'Could not confirm payment',
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
          console.warn('[SchoolRazorpay] payment.failed full payload:', response);
        }
        const err =
          response && typeof response === 'object' && 'error' in response
            ? (response as { error?: Record<string, unknown> }).error
            : undefined;
        const detail = razorpayPaymentFailedUserMessage(response);
        if (detail) {
          Sentry.withScope((scope) => {
            scope.setTag('location', 'SchoolRazorpayCheckout.payment.failed');
            scope.setContext('razorpay', { error: err });
            Sentry.captureMessage(`Razorpay payment.failed: ${detail}`);
          });
        }
        toast({
          variant: 'destructive',
          title: 'Payment failed',
          description:
            detail ||
            'The transaction did not complete. Check Razorpay Dashboard → Payments for the error code, or try UPI test mode.',
        });
      });
      rzp.open();
    } catch (err: unknown) {
      setBusy(false);
      const message = err instanceof Error ? err.message : 'Payment could not start';
      Sentry.withScope((scope) => {
        scope.setTag('location', 'SchoolRazorpayCheckout.startCheckout');
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
      className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
      style={{ backgroundColor: '#1e3a8a' }}
    >
      {busy ? 'Opening secure checkout…' : 'Pay securely with Razorpay'}
    </button>
  );
};

export default SchoolRazorpayCheckout;
