import React, { useState } from 'react';
import { useToast } from '../ui/use-toast';
import {
  createSchoolRazorpayOrder,
  verifySchoolRazorpayPayment,
} from '../../db/schoolCollection';
import { isValidIndiaMobile, normalizeIndiaMobileE164 } from '../../utils/indiaMobile';
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

/** US test keys route through Razorpay cross-border test APIs 502/currency errors are often Razorpay-side. */
function paymentFailedToastDescription(detail: string, keyId: string): string {
  const low = detail.toLowerCase();
  const usKey = typeof keyId === 'string' && keyId.includes('_us_');
  if (usKey && low.includes('currency is invalid')) {
    return `${detail} If you see 502 on payments_cross_border_test …/cb_flows, that is Razorpay’s cross-border test stack, not your order JSON. Try India test keys (no “_us_”) for INR-only checks, or contact Razorpay with the 502 timestamp.`;
  }
  return detail;
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
};

/**
 * Import Flow: phone + PAN collected here → POST createSchoolOrder with customer + customer_details.
 * Razorpay US/cross-border: avoid dummy contacts (all same digits); use plausible numbers for tests.
 */
const SchoolRazorpayCheckout: React.FC<SchoolRazorpayCheckoutProps> = ({
  schoolId,
  checkoutSecret,
  schoolName,
  pocEmail,
  planName,
  onSuccess,
}) => {
  const [busy, setBusy] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutPan, setCheckoutPan] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; pan?: string }>({});
  const { toast } = useToast();

  const startCheckout = async () => {
    const phoneErr =
      checkoutPhone.trim().length === 0
        ? 'Enter your India mobile number.'
        : !isValidIndiaMobile(checkoutPhone)
          ? 'Use 10 digits (6–9…) or +91XXXXXXXXXX.'
          : undefined;
    const panTrim = checkoutPan.trim().toUpperCase().replace(/\s/g, '');
    const panErr =
      panTrim.length > 0 && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panTrim)
        ? 'PAN must look like ABCDE1234F or leave blank.'
        : undefined;
    setFieldErrors({ phone: phoneErr, pan: panErr });
    if (phoneErr || panErr) {
      return;
    }

    setBusy(true);
    try {
      const order = await createSchoolRazorpayOrder({
        schoolId,
        checkoutSecret,
        poc_phone: checkoutPhone.trim(),
        ...(panTrim.length > 0 ? { institution_pan: panTrim } : {}),
      });

      if (process.env.NODE_ENV === 'development' && typeof order.key_id === 'string') {
        if (order.key_id.startsWith('rzp_live_')) {
          console.warn(
            '[SchoolRazorpay] createSchoolOrder returned a LIVE key_id; set RAZORPAY_KEY_ID/SECRET to test keys on the API for local testing.'
          );
        }
        console.info('[SchoolRazorpay] using key_id prefix:', order.key_id.slice(0, 16));
        if (order.key_id.includes('_us_')) {
          console.warn(
            '[SchoolRazorpay] US test key (rzp_test_us_*): Checkout calls Razorpay cross-border test endpoints. A 502 on …/payments_cross_border_test/…/cb_flows is Razorpay infrastructure - “Currency is invalid” often appears after that fails. For plain INR order testing, use India test keys (no _us_).'
          );
        }
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

      const amountPaise = Math.round(Number(order.amount));
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        throw new Error('Invalid payment amount from server');
      }

      const currencyRaw = typeof order.currency === 'string' ? order.currency.trim() : '';
      if (!/^[A-Za-z]{3}$/.test(currencyRaw)) {
        throw new Error('Payment server returned an invalid currency - redeploy functions or contact support.');
      }
      const currency = currencyRaw.toUpperCase();

      const e164 = normalizeIndiaMobileE164(checkoutPhone);
      const contactTrim = e164 && e164.startsWith('+') ? e164 : '';

      const prefill: Record<string, string> = {
        name: schoolName.slice(0, 120),
        email: pocEmail,
      };
      if (contactTrim.length >= 12) {
        prefill.contact = contactTrim;
      }

      const checkoutConfigId =
        typeof order.checkout_config_id === 'string' ? order.checkout_config_id.trim() : '';

      const customerId =
        typeof order.customer_id === 'string' && order.customer_id.startsWith('cust_')
          ? order.customer_id
          : '';

      if (process.env.NODE_ENV === 'development' && !customerId) {
        console.warn(
          '[SchoolRazorpay] No customer_id from API - Import Flow may fail. Deploy latest functions.'
        );
      }

      /** Amount + currency must match the Razorpay Order response (no client-side currency default). */
      const options: Record<string, unknown> = {
        key: order.key_id,
        order_id: order.order_id,
        amount: String(amountPaise),
        currency,
        ...(customerId ? { customer_id: customerId } : {}),
        ...(checkoutConfigId ? { checkout_config_id: checkoutConfigId } : {}),
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
              description: 'Your institutional package payment was confirmed.',
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

      const diagnosticKeyId = typeof order.key_id === 'string' ? order.key_id : '';

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
        const base =
          detail ||
          'The transaction did not complete. Check Razorpay Dashboard → Payments for the error code, or try UPI test mode.';
        toast({
          variant: 'destructive',
          title: 'Payment failed',
          description: paymentFailedToastDescription(base, diagnosticKeyId),
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
    <div className="mt-4 w-full space-y-4 text-left">
    
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          India mobile number<span className="text-red-500"> *</span>
        </label>
        <p className="mb-1.5 text-[11px] text-slate-500 leading-relaxed">
          Required for Razorpay Import Flow.
        </p>
        <input
          type="tel"
          value={checkoutPhone}
          onChange={(e) => {
            setCheckoutPhone(e.target.value);
            setFieldErrors((f) => ({ ...f, phone: undefined }));
          }}
          disabled={busy}
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
            fieldErrors.phone
              ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
              : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
          }`}
          placeholder="9876543210 or +919876543210"
          autoComplete="tel"
          inputMode="tel"
        />
        {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Institution PAN <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <p className="mb-1.5 text-[11px] text-slate-500 leading-relaxed">
          Recommended for Import Flow tax identity - format ABCDE1234F.
        </p>
        <input
          type="text"
          value={checkoutPan}
          onChange={(e) => {
            setCheckoutPan(e.target.value.toUpperCase());
            setFieldErrors((f) => ({ ...f, pan: undefined }));
          }}
          disabled={busy}
          className={`w-full max-w-xs rounded-lg border px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
            fieldErrors.pan
              ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
              : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
          }`}
          placeholder="ABCDE1234F"
          autoComplete="off"
          maxLength={10}
        />
        {fieldErrors.pan && <p className="mt-1 text-xs text-red-600">{fieldErrors.pan}</p>}
      </div>

      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={busy}
        className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
        style={{ backgroundColor: '#1e3a8a' }}
      >
        {busy ? 'Opening secure checkout…' : 'Pay securely with Razorpay'}
      </button>
    </div>
  );
};

export default SchoolRazorpayCheckout;
