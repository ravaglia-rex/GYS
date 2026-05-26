import React, { useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/use-toast';
import { LoadingSpinner } from '../ui/spinner';
import {
  createStudentRegistrationOrder,
  StudentRegistrationBillingDetails,
  verifyStudentRegistrationPayment,
} from '../../db/studentRegistrationPayment';
import { NewStudent, prepareSignUpTransaction } from '../../db/signupTransaction';
import { gysPaymentInvoiceNumberFromOrderId } from '../../utils/gysPaymentInvoiceNumber';
import { RAZORPAY_CHECKOUT_METHOD } from '../../utils/razorpayCheckoutMethods';
import { assertRazorpayCheckoutKeyAllowed } from '../../utils/razorpayTestMode';
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

export type StudentRegistrationRazorpayCheckoutProps = {
  email: string;
  studentName: string;
  student: NewStudent;
  membershipLevel: 1 | 2 | 3 | 4;
  planLabel: string;
  billingDetails: StudentRegistrationBillingDetails;
  disabled?: boolean;
  /** Called after server verifies payment and activates the pending student account. */
  onPaymentVerified: (razorpayPaymentId: string) => Promise<void>;
};

const StudentRegistrationRazorpayCheckout: React.FC<StudentRegistrationRazorpayCheckoutProps> = ({
  email,
  studentName,
  student,
  membershipLevel,
  planLabel,
  billingDetails,
  disabled,
  onPaymentVerified,
}) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const { toast } = useToast();

  const startCheckout = async () => {
    setBusy(true);
    try {
      const normalizedStudentName = studentName.trim();
      const prepared = await prepareSignUpTransaction(student);
      const order = await createStudentRegistrationOrder(
        prepared.uid,
        membershipLevel,
        billingDetails
      );
      assertRazorpayCheckoutKeyAllowed(order.key_id, 'student_registration');

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
          ...(normalizedStudentName ? { name: normalizedStudentName } : {}),
          email: email.trim().toLowerCase(),
          ...(billingDetails.contact ? { contact: billingDetails.contact } : {}),
        },
        notes: {
          invoice_number: gysPaymentInvoiceNumberFromOrderId(order.order_id),
          purpose: 'student_registration',
          membership_level: String(membershipLevel),
        },
        theme: { color: '#1e3a8a' },
        method: RAZORPAY_CHECKOUT_METHOD,
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
            await verifyStudentRegistrationPayment({
              student_uid: order.student_uid,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await onPaymentVerified(response.razorpay_payment_id);
          } catch (err: unknown) {
            setConfirmingPayment(false);
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
        Sentry.withScope((scope) => {
          scope.setTag('location', 'StudentRegistrationRazorpayCheckout.payment.failed');
          scope.setContext('razorpay', { error: err });
          Sentry.captureMessage(
            detail ? `Razorpay payment.failed: ${detail}` : 'Razorpay payment.failed'
          );
        });
        // Razorpay modal already explains the failure; do not surface raw gateway strings in a toast.
      });
      rzp.open();
    } catch (err: unknown) {
      setBusy(false);
      const message = err instanceof Error ? err.message : 'Payment could not start';

      if (/not pending payment/i.test(message)) {
        toast({
          variant: 'default',
          title: 'Signup already complete',
          description: 'This signup is no longer waiting for payment. Log in to continue.',
        });
        navigate('/login');
        return;
      }

      if (/already exists/i.test(message)) {
        toast({
          variant: 'destructive',
          title: 'Email already registered',
          description: 'This email already has a student account. Log in or start over with a different email.',
        });
        navigate('/students/register', {
          state: {
            prefill: { email: email.trim().toLowerCase() },
            emailInUse: true,
          },
        });
        return;
      }

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

  const confirmingOverlay =
    confirmingPayment &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/65 px-4 backdrop-blur-[2px]"
        role="alertdialog"
        aria-busy="true"
        aria-live="polite"
        aria-labelledby="student-rzp-confirm-title"
        aria-describedby="student-rzp-confirm-desc"
      >
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mb-4 flex justify-center text-[#1e3a8a]">
            <LoadingSpinner size={40} className="opacity-90" />
          </div>
          <h2 id="student-rzp-confirm-title" className="text-lg font-semibold text-slate-900">
            Confirming your payment
          </h2>
          <p id="student-rzp-confirm-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
            Please wait while we complete your signup. Do not refresh or close this page.
          </p>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      {confirmingOverlay}
      <button
      type="button"
      onClick={() => void startCheckout()}
      disabled={busy || disabled}
      className="mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-base sm:text-lg font-semibold text-white shadow-md hover:brightness-110 active:scale-[0.99] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundColor: '#1e3a8a' }}
    >
      {busy ? 'Opening secure checkout…' : disabled ? 'Complete required details to proceed' : 'Proceed to payment'}
    </button>
    </>
  );
};

export default StudentRegistrationRazorpayCheckout;
