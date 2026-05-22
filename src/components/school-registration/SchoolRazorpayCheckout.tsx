import React, { useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/use-toast';
import { LoadingSpinner } from '../ui/spinner';
import {
  createSchoolRazorpayOrder,
  markSchoolWireTransferAttempt,
  verifySchoolRazorpayPayment,
} from '../../db/schoolCollection';
import { isValidIndiaMobile, normalizeIndiaMobileE164 } from '../../utils/indiaMobile';
import { gysPaymentInvoiceNumberFromOrderId } from '../../utils/gysPaymentInvoiceNumber';
import * as Sentry from '@sentry/react';

/** Best-effort string for Razorpay `payment.failed` payloads (shape varies by version). Used for Sentry only. */
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

const WIRE_TRANSFER_DETAILS = [
  { label: 'Payment reference / memo', value: '/FFC/202355477128/Argus Futures, Inc./San Francisco-, USA' },
  { label: 'SWIFT / BIC Code', value: 'CHASUS33XXX' },
  { label: 'ABA Routing Number', value: '021000021' },
  { label: 'Bank Name', value: 'JP Morgan Chase Bank, N.A. - New York' },
  { label: 'Bank Address', value: '383 Madison Avenue, Floor 23, New York, NY 10017 USA' },
  { label: 'IBAN / Account Number', value: '707567692' },
  { label: 'Beneficiary Name', value: 'Choice Financial Group' },
  { label: 'Beneficiary Address', value: '4501 23rd Ave S, Fargo, ND 58104 USA' },
];

export type SchoolRazorpayCheckoutProps = {
  schoolId: string;
  checkoutSecret: string;
  schoolName: string;
  pocEmail: string;
  planName: string;
  onSuccess: () => void;
};

/**
 * Import Flow: phone collected here → POST createSchoolOrder with customer + customer_details.
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
  /** Full-screen overlay while the Razorpay modal is gone but we are verifying / handing off to success UI. */
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string }>({});
  const [wireOpen, setWireOpen] = useState(false);
  const [wireBusy, setWireBusy] = useState(false);
  const [wireAttemptRecorded, setWireAttemptRecorded] = useState(false);
  const [wireConfirmationPaymentId, setWireConfirmationPaymentId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateCheckoutPhone = (): string | undefined => {
    return checkoutPhone.trim().length === 0
      ? 'Enter your India mobile number.'
      : !isValidIndiaMobile(checkoutPhone)
        ? 'Use 10 digits (6-9...) or +91XXXXXXXXXX.'
        : undefined;
  };

  const startCheckout = async () => {
    const phoneErr = validateCheckoutPhone();
    setFieldErrors({ phone: phoneErr });
    if (phoneErr) {
      return;
    }

    setBusy(true);
    try {
      const order = await createSchoolRazorpayOrder({
        schoolId,
        checkoutSecret,
        poc_phone: checkoutPhone.trim(),
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

      const invoiceNumber = gysPaymentInvoiceNumberFromOrderId(order.order_id);

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
            flushSync(() => {
              setConfirmingPayment(true);
            });
            await verifySchoolRazorpayPayment({
              school_id: schoolId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast({
              title: 'Payment successful',
              description: 'Your institutional package payment was confirmed.',
            });
            onSuccess();
          } catch (err: unknown) {
            setConfirmingPayment(false);
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
        Sentry.withScope((scope) => {
          scope.setTag('location', 'SchoolRazorpayCheckout.payment.failed');
          scope.setContext('razorpay', { error: err });
          Sentry.captureMessage(
            detail ? `Razorpay payment.failed: ${detail}` : 'Razorpay payment.failed'
          );
        });
        // Razorpay modal already shows a user-friendly failure message; avoid duplicate dev-style toasts.
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

  const recordWireTransferAttempt = async () => {
    const optionalPhone = normalizeIndiaMobileE164(checkoutPhone) ? checkoutPhone.trim() : undefined;
    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    setWireBusy(true);
    try {
      const result = await markSchoolWireTransferAttempt({
        schoolId,
        checkoutSecret,
        ...(optionalPhone ? { poc_phone: optionalPhone } : {}),
      });
      setWireAttemptRecorded(true);
      setWireConfirmationPaymentId(result.payment_id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not record wire transfer attempt';
      Sentry.withScope((scope) => {
        scope.setTag('location', 'SchoolRazorpayCheckout.recordWireTransferAttempt');
        Sentry.captureException(err);
      });
      toast({
        variant: 'destructive',
        title: 'Could not record wire transfer',
        description: message,
      });
    } finally {
      setWireBusy(false);
    }
  };

  const confirmingOverlay =
    confirmingPayment &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/65 px-4 backdrop-blur-[2px]"
        role="alertdialog"
        aria-busy="true"
        aria-live="polite"
        aria-labelledby="school-rzp-confirm-title"
        aria-describedby="school-rzp-confirm-desc"
      >
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mb-4 flex justify-center text-[#1e3a8a]">
            <LoadingSpinner size={40} className="opacity-90" />
          </div>
          <h2 id="school-rzp-confirm-title" className="text-lg font-semibold text-slate-900">
            Confirming your payment
          </h2>
          <p id="school-rzp-confirm-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
            Please wait while we secure your registration. Do not refresh or close this page.
          </p>
        </div>
      </div>,
      document.body
    );

  const wireConfirmationOverlay =
    wireConfirmationPaymentId &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/65 px-4 backdrop-blur-[2px]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="school-wire-confirm-title"
        aria-describedby="school-wire-confirm-desc"
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-[#1e3a8a]">
            ✓
          </div>
          <h2 id="school-wire-confirm-title" className="text-lg font-semibold text-slate-900">
            Wire transfer marked for review
          </h2>
          <p id="school-wire-confirm-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
            Thank you. We recorded that your school has paid by wire transfer. We will check the bank transfer and
            activate your school account after payment is confirmed.
          </p>
          <p className="mt-3 break-all rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
            Reference: {wireConfirmationPaymentId}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.99]"
            style={{ backgroundColor: '#1e3a8a' }}
          >
            OK
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <div className="mt-4 w-full space-y-4 text-left">
      {confirmingOverlay}
      {wireConfirmationOverlay}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          India mobile number<span className="text-red-500"> *</span>
        </label>
        <p className="mb-1.5 text-[11px] text-slate-500 leading-relaxed">
          Required only when paying through Razorpay.
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

      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={busy}
        className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
        style={{ backgroundColor: '#1e3a8a' }}
      >
        {busy ? 'Opening secure checkout…' : 'Pay securely with Razorpay'}
      </button>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Prefer wire transfer?</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              View remittance details, complete the transfer with your bank, then mark it for manual review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWireOpen((v) => !v)}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            disabled={busy || wireBusy}
          >
            {wireOpen ? 'Hide details' : 'Pay by wire'}
          </button>
        </div>

        {wireOpen && (
          <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-950">
              <span className="font-semibold">Important:</span> include the payment reference below in your bank
              memo/reference field. If space is limited, include as much as possible.
            </div>
            <div className="space-y-2 text-xs">
              {WIRE_TRANSFER_DETAILS.map((item) => (
                <div key={item.label} className="grid grid-cols-1 gap-1 rounded-lg bg-slate-50 px-3 py-2 sm:grid-cols-[150px_1fr]">
                  <span className="font-semibold text-slate-500">{item.label}</span>
                  <span className="font-medium text-slate-900 break-words">{item.value}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void recordWireTransferAttempt()}
              disabled={busy || wireBusy || wireAttemptRecorded}
              className="w-full rounded-xl border border-blue-900 px-4 py-3 text-sm font-semibold text-blue-900 transition-all hover:bg-blue-50 disabled:opacity-60 disabled:pointer-events-none"
            >
              {wireAttemptRecorded
                ? 'Wire transfer marked for review'
                : wireBusy
                  ? 'Recording wire transfer...'
                  : 'I have paid by wire transfer'}
            </button>
            {wireAttemptRecorded && (
              <p className="text-xs leading-relaxed text-slate-600">
                We will check the bank transfer and activate your school account after payment is confirmed.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolRazorpayCheckout;
