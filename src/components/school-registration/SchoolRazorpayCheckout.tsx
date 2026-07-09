import React, { useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useToast } from '../ui/use-toast';
import { LoadingSpinner } from '../ui/spinner';
import {
  createSchoolRazorpayOrder,
  markSchoolManualPaymentAttempt,
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

const WIRE_TRANSFER_PAYMENT_REFERENCE =
  '/FFC/202355477128/Argus Futures, Inc./San Francisco-, USA';

const WIRE_TRANSFER_DETAIL_ROWS = [
  { label: 'Payment reference / memo', value: WIRE_TRANSFER_PAYMENT_REFERENCE },
  { label: 'SWIFT / BIC Code', value: 'CHASUS33XXX' },
  { label: 'ABA Routing Number', value: '021000021' },
  { label: 'Bank Name', value: 'JP Morgan Chase Bank, N.A. - New York' },
  { label: 'Bank Address', value: '383 Madison Avenue, Floor 23, New York, NY 10017 USA' },
  { label: 'IBAN / Account Number', value: '707567692' },
  { label: 'Beneficiary Name', value: 'Choice Financial Group' },
  { label: 'Beneficiary Address', value: '4501 23rd Ave S, Fargo, ND 58104 USA' },
];

type PaymentStep = 'select' | 'razorpay' | 'wire' | 'already_paid' | 'razorpay_pending';
type ManualPaymentMethod = 'wire' | 'already_paid';

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
  const [wireBusy, setWireBusy] = useState(false);
  const [wireAttemptRecorded, setWireAttemptRecorded] = useState(false);
  const [alreadyPaidRecorded, setAlreadyPaidRecorded] = useState(false);
  const [wireDetailsEmailSent, setWireDetailsEmailSent] = useState(false);
  const [missingBankName, setMissingBankName] = useState('');
  const [missingBankError, setMissingBankError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('select');
  const wireRecordInFlightRef = useRef(false);
  const alreadyPaidRecordedRef = useRef(false);
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
            const verification = await verifySchoolRazorpayPayment({
              school_id: schoolId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verification.payment_status !== 'captured') {
              setConfirmingPayment(false);
              setBusy(false);
              setPaymentStep('razorpay_pending');
              toast({
                title: 'Payment received',
                description: 'Razorpay is confirming this payment. Your registration will unlock after webhook confirmation.',
              });
              return;
            }
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

  const recordManualPaymentAttempt = async (options?: {
    paymentMethod?: ManualPaymentMethod;
    missingBankName?: string;
    source?: 'wire' | 'razorpay_missing_bank' | 'already_paid';
    showToast?: boolean;
    forceEmail?: boolean;
  }) => {
    if (wireRecordInFlightRef.current) {
      return;
    }
    const paymentMethod = options?.paymentMethod ?? 'wire';
    if (paymentMethod === 'already_paid' && alreadyPaidRecordedRef.current) {
      setPaymentStep('already_paid');
      return;
    }
    const optionalPhone = normalizeIndiaMobileE164(checkoutPhone) ? withIndiaCountryCode(checkoutPhone) : undefined;
    wireRecordInFlightRef.current = true;
    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    setWireBusy(true);
    try {
      const result = await markSchoolManualPaymentAttempt({
        schoolId,
        checkoutSecret,
        ...(optionalPhone ? { poc_phone: optionalPhone } : {}),
        ...(options?.missingBankName ? { missing_bank_name: options.missingBankName } : {}),
        payment_method: paymentMethod,
        ...(options?.source ? { source: options.source } : {}),
        ...(options?.forceEmail ? { force_email: true } : {}),
      });
      if (paymentMethod === 'already_paid') {
        alreadyPaidRecordedRef.current = true;
        setAlreadyPaidRecorded(true);
      } else {
        setWireAttemptRecorded(true);
        setWireDetailsEmailSent(Boolean(result.details_email_sent || result.details_email_already_sent));
      }
      if (options?.showToast) {
        toast({
          title:
            paymentMethod === 'already_paid'
              ? 'Response captured'
              : result.details_email_sent || result.details_email_already_sent
                ? 'Wire details emailed'
                : 'Wire details ready',
          description:
            paymentMethod === 'already_paid'
              ? 'We will verify that your payment has already been received before activating your school account.'
              : result.details_email_sent
                ? `We emailed the wire transfer details to ${pocEmail}.`
                : result.details_email_already_sent
                  ? `Wire transfer details were already emailed to ${pocEmail}.`
                  : 'The wire transfer details are shown below. Please contact us if you do not receive the email.',
        });
      }
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not record payment attempt';
      Sentry.withScope((scope) => {
        scope.setTag('location', 'SchoolRazorpayCheckout.recordManualPaymentAttempt');
        Sentry.captureException(err);
      });
      toast({
        variant: 'destructive',
        title: 'Could not record payment choice',
        description: message,
      });
    } finally {
      wireRecordInFlightRef.current = false;
      setWireBusy(false);
    }
  };

  const openWireTransfer = () => {
    setPaymentStep('wire');
    if (!wireAttemptRecorded && !wireBusy && !wireRecordInFlightRef.current) {
      void recordManualPaymentAttempt({ paymentMethod: 'wire', source: 'wire', showToast: true });
    }
  };

  const openAlreadyPaid = () => {
    setPaymentStep('already_paid');
  };

  const confirmAlreadyPaid = async () => {
    if (alreadyPaidRecordedRef.current) {
      setPaymentStep('already_paid');
      return;
    }
    await recordManualPaymentAttempt({
      paymentMethod: 'already_paid',
      source: 'already_paid',
      showToast: true,
    });
  };

  const submitMissingBank = async () => {
    const bankName = missingBankName.trim().replace(/\s+/g, ' ');
    if (bankName.length < 2) {
      setMissingBankError('Enter the bank name so we can look into it.');
      return;
    }
    setMissingBankError(null);
    setPaymentStep('wire');
    await recordManualPaymentAttempt({
      paymentMethod: 'wire',
      missingBankName: bankName,
      source: 'razorpay_missing_bank',
      showToast: true,
    });
  };

  const backToPaymentOptionsButton = (disabled = false) => (
    <button
      type="button"
      onClick={() => setPaymentStep('select')}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span aria-hidden="true">&larr;</span>
      Back to payment options
    </button>
  );

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
      {paymentStep === 'select' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Choose how you want to pay</p>
          <button
            type="button"
            onClick={() => setPaymentStep('razorpay')}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="block text-sm font-semibold text-slate-900">Pay with Razorpay</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-600">
              Use UPI, cards, net banking, or other Razorpay checkout methods.
            </span>
          </button>
          <button
            type="button"
            onClick={openWireTransfer}
            disabled={wireBusy}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 disabled:opacity-60"
          >
            <span className="block text-sm font-semibold text-slate-900">Pay by wire transfer</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-600">
              View bank details and receive the remittance instructions by email.
            </span>
          </button>
          <button
            type="button"
            onClick={openAlreadyPaid}
            disabled={wireBusy}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 disabled:opacity-60"
          >
            <span className="block text-sm font-semibold text-slate-900">Already paid</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-600">
              Choose this if your school paid through a direct Razorpay link or through a group/chain payment.
            </span>
          </button>
        </div>
      )}

      {paymentStep === 'razorpay' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              India mobile number<span className="text-red-500"> *</span>
            </label>
            <p className="mb-1.5 text-[11px] text-slate-500 leading-relaxed">
              Required for Razorpay checkout.
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
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
            style={{ backgroundColor: '#1e3a8a' }}
          >
            {busy ? 'Opening secure checkout...' : 'Pay securely with Razorpay'}
          </button>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-sm font-semibold text-amber-950">My bank isn&apos;t listed</p>
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
          <div className="flex justify-end pt-1">{backToPaymentOptionsButton(busy)}</div>
        </div>
      )}

      {paymentStep === 'razorpay_pending' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-sm font-semibold text-blue-950">Payment submitted</p>
          <p className="mt-2 text-xs leading-relaxed text-blue-900">
            Razorpay is confirming the payment with us. Your school account will activate automatically after
            Razorpay sends the signed webhook confirmation.
          </p>
          <div className="mt-3 flex justify-end">{backToPaymentOptionsButton()}</div>
        </div>
      )}

      {paymentStep === 'wire' && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-950">
            <span className="font-bold">IMPORTANT:</span> The payment reference below must be included in
            your bank memo/reference field, or the money may be delayed or may not make it here.
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <span className="font-semibold text-slate-500">Payment reference</span>
            <p className="mt-1 break-words font-semibold text-slate-950">
              {WIRE_TRANSFER_PAYMENT_REFERENCE}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="mb-3 leading-relaxed text-slate-700">
              Use these details to send an international wire in INR to complete your payment.
              If you prefer sending USD, please contact globalyoungscholar@argus.ai to get the wire transfer
              details to send an international wire in USD.
            </p>
            <div className="space-y-2">
              {WIRE_TRANSFER_DETAIL_ROWS.map((item) => (
                <div key={item.label} className="grid grid-cols-1 gap-1 sm:grid-cols-[150px_1fr]">
                  <span className="font-semibold text-slate-500">{item.label}</span>
                  <span className="font-medium text-slate-900 break-words">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              void recordManualPaymentAttempt({
                paymentMethod: 'wire',
                source: 'wire',
                showToast: true,
                forceEmail: true,
              })
            }
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
              After we manually confirm the bank transfer, we will activate your school account.
            </p>
          )}
          <div className="flex justify-end pt-1">{backToPaymentOptionsButton(wireBusy)}</div>
        </div>
      )}

      {paymentStep === 'already_paid' && !alreadyPaidRecorded && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Already paid through another channel?</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Choose this only if your school has already completed payment through a direct Razorpay link,
              a group or chain payment, or another approved route, not if you still need to pay.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Click the button below to confirm. We will verify the payment on our end before activating your
              school account. Please allow up to 5 business days for confirmation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void confirmAlreadyPaid()}
            disabled={wireBusy}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
            style={{ backgroundColor: '#1e3a8a' }}
          >
            {wireBusy ? 'Submitting...' : 'I confirm my school has already paid'}
          </button>
          <div className="flex justify-end pt-1">{backToPaymentOptionsButton(wireBusy)}</div>
        </div>
      )}

      {paymentStep === 'already_paid' && alreadyPaidRecorded && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-sm font-semibold text-emerald-950">Response captured</p>
          <p className="mt-2 text-justify text-xs leading-relaxed text-emerald-900">
            We will verify that your payment has already been received. Once we confirm it, your
            school account will be activated and you can continue account setup. Please let us know if you do not hear from us within 5 business days.
          </p>
          <div className="mt-3 flex justify-end">{backToPaymentOptionsButton()}</div>
        </div>
      )}
    </div>
  );
};

export default SchoolRazorpayCheckout;
