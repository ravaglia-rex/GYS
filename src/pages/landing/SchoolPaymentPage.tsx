import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/use-toast';
import {
  lookupSchoolRegistrationPayment,
  resumeSchoolCheckout,
} from '../../db/schoolCollection';
import PageFooter from '../../components/layout/LandingSiteFooter';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { LandingHeaderScrollProgress } from '../../components/landing/LandingScrollChrome';
import { useLandingScrollProgress } from '../../hooks/useLandingPageScroll';
import SchoolRazorpayCheckout from '../../components/school-registration/SchoolRazorpayCheckout';
import { schoolRegistrationCheckoutSummaryFromBaseInr } from '../../utils/schoolRegistrationPlans';
import { razorpayEmailOk } from '../../utils/schoolRegistrationPaymentRules';

const GYS_BLUE = '#1e3a8a';

type PaymentLocationState = {
  registrationEmail?: string;
  pocEmail?: string;
  schoolId?: string;
  checkoutSecret?: string;
  schoolName?: string;
  planName?: string;
  planPriceInr?: number;
};

type PaymentStep = 'email' | 'confirm' | 'checkout' | 'complete';

const SchoolPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const navState = (location.state as PaymentLocationState | null) ?? {};

  const initialRegistrationEmail = navState.registrationEmail ?? navState.pocEmail ?? '';
  const canStartAtConfirm = Boolean(
    initialRegistrationEmail && navState.schoolId && navState.schoolName && navState.planName
  );

  const [step, setStep] = useState<PaymentStep>(canStartAtConfirm ? 'confirm' : 'email');
  const [lookupEmail, setLookupEmail] = useState(initialRegistrationEmail);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [registrationEmail, setRegistrationEmail] = useState(initialRegistrationEmail);
  const [schoolId, setSchoolId] = useState<string | null>(navState.schoolId ?? null);
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(navState.checkoutSecret ?? null);
  const [schoolName, setSchoolName] = useState(navState.schoolName ?? '');
  const [pocEmail, setPocEmail] = useState(navState.pocEmail ?? initialRegistrationEmail);
  const [planName, setPlanName] = useState(navState.planName ?? '');
  const [planPriceInr, setPlanPriceInr] = useState(navState.planPriceInr ?? 0);

  const institutionalCheckoutSummary = useMemo(
    () =>
      planPriceInr > 0
        ? schoolRegistrationCheckoutSummaryFromBaseInr(planPriceInr)
        : null,
    [planPriceInr]
  );

  const resetToEmailStep = () => {
    setStep('email');
    setLookupError(null);
    setCheckoutSecret(null);
    setSchoolId(null);
    setSchoolName('');
    setPlanName('');
    setPlanPriceInr(0);
  };

  const lookupRegistration = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setLookupError('Enter the email address used during school registration.');
      return;
    }
    if (!razorpayEmailOk(trimmed)) {
      setLookupError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setLookupError(null);
    try {
      const result = await lookupSchoolRegistrationPayment(trimmed);
      setRegistrationEmail(result.registrationEmail);
      setSchoolId(result.schoolId);
      setSchoolName(result.schoolName);
      setPocEmail(result.pocEmail);
      setPlanName(result.planName);
      setPlanPriceInr(result.planPriceInr);
      setCheckoutSecret(null);
      setStep('confirm');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not find your registration.';
      setLookupError(message);
      toast({ variant: 'destructive', title: 'Registration not found', description: message });
    } finally {
      setLoading(false);
    }
  };

  const confirmAndLoadCheckout = async () => {
    if (!registrationEmail || !schoolId) return;

    if (checkoutSecret) {
      setStep('checkout');
      return;
    }

    setLoading(true);
    try {
      const result = await resumeSchoolCheckout(registrationEmail, schoolId);
      setCheckoutSecret(result.checkoutSecret);
      setPocEmail(result.pocEmail);
      setStep('checkout');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not start payment.';
      toast({ variant: 'destructive', title: 'Could not start payment', description: message });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Header onBack={() => navigate('/for-schools')} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-md ring-1 ring-slate-100 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Payment complete</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Thank you. Payment for <span className="font-semibold">{schoolName}</span> on the{' '}
              <span className="font-semibold">{planName}</span> plan was recorded. A receipt was
              emailed to your contact addresses.
            </p>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold">Next:</span> set up your school dashboard. Go to the
              sign-in page, choose <span className="font-semibold">School official</span>, enter your
              school email, and follow the password-setup link.
            </p>
            <button
              type="button"
              onClick={() => navigate('/for-schools')}
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all duration-200"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Back to For Schools
            </button>
          </div>
        </main>
        <PageFooter />
      </div>
    );
  }

  if (step === 'checkout' && schoolId && checkoutSecret) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Header onBack={() => setStep('confirm')} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-md ring-1 ring-slate-100 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <span className="text-3xl">💳</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Complete payment</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold">{schoolName}</span> —{' '}
              <span className="font-semibold">{planName}</span> plan.
              {institutionalCheckoutSummary ? (
                <>
                  {' '}
                  Total due:{' '}
                  <span className="font-semibold">{institutionalCheckoutSummary.totalDisplay}</span>{' '}
                  for the first year.
                </>
              ) : null}
            </p>
            {institutionalCheckoutSummary ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Price summary
                </p>
                <div className="flex justify-between gap-3 text-sm font-semibold text-slate-900">
                  <span>Total due</span>
                  <span className="tabular-nums" style={{ color: GYS_BLUE }}>
                    {institutionalCheckoutSummary.totalDisplay}
                  </span>
                </div>
              </div>
            ) : null}
            <SchoolRazorpayCheckout
              schoolId={schoolId}
              checkoutSecret={checkoutSecret}
              schoolName={schoolName}
              pocEmail={pocEmail}
              planName={planName}
              onSuccess={() => setStep('complete')}
            />
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Problems with checkout? Email{' '}
              <a
                href="mailto:globalyoungscholar@argus.ai"
                className="font-medium underline underline-offset-2"
                style={{ color: GYS_BLUE }}
              >
                globalyoungscholar@argus.ai
              </a>
              .
            </p>
          </div>
        </main>
        <PageFooter />
      </div>
    );
  }

  if (step === 'confirm' && schoolName) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Header onBack={resetToEmailStep} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-md ring-1 ring-slate-100">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">Confirm your school</h1>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                We found a registration for{' '}
                <span className="font-semibold">{registrationEmail}</span>. Please confirm this is
                the correct school before proceeding to payment.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Registered school
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900 leading-snug">{schoolName}</p>
              <p className="mt-2 text-sm text-slate-700">
                Plan: <span className="font-semibold">{planName}</span>
                {institutionalCheckoutSummary ? (
                  <>
                    {' '}
                    ·{' '}
                    <span className="font-semibold">{institutionalCheckoutSummary.totalDisplay}</span>
                    /yr
                  </>
                ) : null}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => void confirmAndLoadCheckout()}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                style={{ backgroundColor: GYS_BLUE }}
              >
                {loading ? 'Loading…' : 'Yes, proceed to payment'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={resetToEmailStep}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition-all disabled:opacity-60"
              >
                No, use a different email
              </button>
            </div>
          </div>
        </main>
        <PageFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header onBack={() => navigate('/for-schools')} />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-md ring-1 ring-slate-100">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <span className="text-3xl">💳</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Proceed to payment</h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Enter any <span className="font-semibold">email address used during registration</span>
              — primary contact or any additional school official email you listed on the form.
            </p>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void lookupRegistration(lookupEmail);
            }}
          >
            <div>
              <label htmlFor="payment-registration-email" className="block text-sm font-bold text-slate-700">
                Registration email<span className="text-red-500"> *</span>
              </label>
              <input
                id="payment-registration-email"
                type="email"
                value={lookupEmail}
                onChange={(e) => {
                  setLookupEmail(e.target.value);
                  setLookupError(null);
                }}
                className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                  lookupError
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                    : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                }`}
                placeholder="principal@yourschool.edu.in"
                autoComplete="email"
                required
              />
              {lookupError ? (
                <p className="mt-1 text-xs text-red-600">{lookupError}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
              style={{ backgroundColor: GYS_BLUE }}
            >
              {loading ? 'Looking up…' : 'Find registration'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500 leading-relaxed">
            Haven&apos;t registered yet?{' '}
            <button
              type="button"
              onClick={() => navigate('/for-schools/register')}
              className="font-medium underline underline-offset-2"
              style={{ color: GYS_BLUE }}
            >
              Register your school first
            </button>
            .
          </p>
        </div>
      </main>
      <PageFooter />
    </div>
  );
};

const Header: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const navigate = useNavigate();
  const scrollProgress = useLandingScrollProgress();
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur relative">
      <LandingHeaderScrollProgress scrollProgress={scrollProgress} />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 sm:gap-6">
        <button
          type="button"
          onClick={onBack}
          className="group flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors duration-200 hover:bg-slate-100 rounded-lg px-1 py-0.5 -ml-1"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs transition-all duration-200 group-hover:border-slate-400">
            ←
          </span>
          <span className="inline">Back</span>
        </button>

        <div className="flex items-center gap-3">
          <div
            className="flex w-10 h-10 rounded items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: GYS_BLUE }}
          >
            GYS
          </div>
          <div>
            <h1 className="hidden sm:block font-bold text-lg text-gray-900 tracking-tight">
              Global Young Scholar
            </h1>
            <p className="hidden text-xs text-gray-500 sm:block">Powered by Argus, Access&nbsp;USA, EducationWorld</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <PublicHomeNavButton />
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-medium shrink-0 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 sm:px-5"
            style={{ borderColor: GYS_BLUE, color: GYS_BLUE }}
          >
            Log In
          </button>
        </div>
      </div>
    </header>
  );
};

export default SchoolPaymentPage;
