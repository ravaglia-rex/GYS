import React, { useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useToast } from '../ui/use-toast';
import { LoadingSpinner } from '../ui/spinner';
import {
  createSchoolRazorpayOrder,
  markSchoolWireTransferAttempt,
  verifySchoolRazorpayPayment,
} from '../../db/schoolCollection';
import {
  isValidIndiaMobile,
  normalizeIndiaMobileE164,
  toIndiaMobileNationalDigits,
  withIndiaCountryCode,
} from '../../utils/indiaMobile';
import { gysPaymentInvoiceNumberFromOrderId } from '../../utils/gysPaymentInvoiceNumber';
import { assertRazorpayCheckoutKeyAllowed } from '../../utils/razorpayTestMode';
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
  const [wireDetailsEmailSent, setWireDetailsEmailSent] = useState(false);
  const [missingBankName, setMissingBankName] = useState('');
  const [missingBankError, setMissingBankError] = useState<string | null>(null);
  const wireRecordInFlightRef = useRef(false);
  const { toast } = useToast();

  const validateCheckoutPhone = (): string | undefined => {
    return checkoutPhone.trim().length === 0
      ? 'Enter your India mobile number.'
      : !isValidIndiaMobile(checkoutPhone)
        ? 'Use 10 digits starting with 6-9.'
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
        poc_phone: withIndiaCountryCode(checkoutPhone),
      });
      assertRazorpayCheckoutKeyAllowed(order.key_id, 'school_registration');

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

  const recordWireTransferAttempt = async (options?: {
    missingBankName?: string;
    source?: 'wire' | 'razorpay_missing_bank';
    showToast?: boolean;
    forceEmail?: boolean;
  }) => {
    if (wireRecordInFlightRef.current) {
      return;
    }
    const optionalPhone = normalizeIndiaMobileE164(checkoutPhone) ? withIndiaCountryCode(checkoutPhone) : undefined;
    wireRecordInFlightRef.current = true;
    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    setWireBusy(true);
    try {
      const result = await markSchoolWireTransferAttempt({
        schoolId,
        checkoutSecret,
        ...(optionalPhone ? { poc_phone: optionalPhone } : {}),
        ...(options?.missingBankName ? { missing_bank_name: options.missingBankName } : {}),
        ...(options?.source ? { source: options.source } : {}),
        ...(options?.forceEmail ? { force_email: true } : {}),
      });
      setWireAttemptRecorded(true);
      setWireDetailsEmailSent(Boolean(result.details_email_sent || result.details_email_already_sent));
      if (options?.showToast) {
        toast({
          title:
            result.details_email_sent || result.details_email_already_sent
              ? 'Wire details emailed'
              : 'Wire details ready',
          description: result.details_email_sent
            ? `We emailed the wire transfer details to ${pocEmail}.`
            : result.details_email_already_sent
              ? `Wire transfer details were already emailed to ${pocEmail}.`
              : 'The wire transfer details are shown below. Please contact us if you do not receive the email.',
        });
      }
      return result;
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
      wireRecordInFlightRef.current = false;
      setWireBusy(false);
    }
  };

  const openWireTransfer = () => {
    if (wireOpen) {
      setWireOpen(false);
      return;
    }
    setWireOpen(true);
    if (!wireAttemptRecorded && !wireBusy && !wireRecordInFlightRef.current) {
      void recordWireTransferAttempt({ showToast: true });
    }
  };

  const submitMissingBank = async () => {
    const bankName = missingBankName.trim().replace(/\s+/g, ' ');
    if (bankName.length < 2) {
      setMissingBankError('Enter the bank name so we can look into it.');
      return;
    }
    setMissingBankError(null);
    setWireOpen(true);
    await recordWireTransferAttempt({
      missingBankName: bankName,
      source: 'razorpay_missing_bank',
      showToast: true,
    });
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

  return (
    <div className="mt-4 w-full space-y-4 text-left">
      {confirmingOverlay}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          India mobile number<span className="text-red-500"> *</span>
        </label>
        <p className="mb-1.5 text-[11px] text-slate-500 leading-relaxed">
          Required only when paying through Razorpay.
        </p>
        <div
          className={`flex w-full overflow-hidden rounded-lg border bg-white text-sm focus-within:outline-none focus-within:ring-1 ${
            fieldErrors.phone
              ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-300'
              : 'border-slate-200 focus-within:border-slate-400 focus-within:ring-slate-400'
          }`}
        >
          <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium text-slate-600">
            +91
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={checkoutPhone}
            onChange={(e) => {
              setCheckoutPhone(toIndiaMobileNationalDigits(e.target.value));
              setFieldErrors((f) => ({ ...f, phone: undefined }));
            }}
            disabled={busy}
            className="w-full px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-100"
            placeholder="98765 43210"
            autoComplete="tel-national"
            maxLength={10}
          />
        </div>
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

      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <p className="text-sm font-semibold text-amber-950">
          My bank isn&apos;t listed
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-900">
          Tell us the bank name and we&apos;ll look into it. We can also email wire transfer details so your
          school can pay directly.
        </p>
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={missingBankName}
            onChange={(e) => {
              setMissingBankName(e.target.value);
              setMissingBankError(null);
            }}
            disabled={busy || wireBusy}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
              missingBankError
                ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300'
            }`}
            placeholder="Enter your bank name"
          />
          {missingBankError && <p className="text-xs text-red-600">{missingBankError}</p>}
          <button
            type="button"
            onClick={() => void submitMissingBank()}
            disabled={busy || wireBusy}
            className="w-full rounded-xl border border-amber-900 px-4 py-2.5 text-sm font-semibold text-amber-950 transition-all hover:bg-amber-100 disabled:opacity-60 disabled:pointer-events-none"
          >
            {wireBusy ? 'Sending details...' : 'Submit bank name and email wire details'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Prefer wire transfer?</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Click here to see the wire transfer details. We&apos;ll also email the remittance details to {pocEmail} as soon as you choose this option.
            </p>
          </div>
          <button
            type="button"
            onClick={openWireTransfer}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            disabled={busy || wireBusy}
          >
            {wireOpen ? 'Hide details' : wireAttemptRecorded ? 'Show wire details' : 'Pay by wire'}
          </button>
        </div>

        {wireOpen && (
          <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-950">
              <span className="font-bold">IMPORTANT:</span> The payment reference below must be included in
              your bank memo/reference field, or the money may be delayed or may not make it here.
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
              onClick={() => void recordWireTransferAttempt({ showToast: true, forceEmail: true })}
              disabled={busy || wireBusy}
              className="w-full rounded-xl border border-blue-900 px-4 py-3 text-sm font-semibold text-blue-900 transition-all hover:bg-blue-50 disabled:opacity-60 disabled:pointer-events-none"
            >
              {wireBusy ? 'Sending wire details...' : wireAttemptRecorded ? 'Email wire details again' : 'Email wire details'}
            </button>
            {wireAttemptRecorded && (
              <p className="text-xs leading-relaxed text-slate-600">
                {wireDetailsEmailSent
                  ? `We emailed these details to ${pocEmail}. `
                  : 'These details are ready below. '}
                After we confirm the bank transfer, we will activate your school account.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolRazorpayCheckout;
