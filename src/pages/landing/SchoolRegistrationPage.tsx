import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/use-toast';
import { registerSchool, resumeSchoolCheckout } from '../../db/schoolCollection';
import * as Sentry from '@sentry/react';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import SchoolRazorpayCheckout from '../../components/school-registration/SchoolRazorpayCheckout';

const GYS_BLUE = '#1e3a8a';

const BOARDS = [
  'CBSE',
  'ICSE / ISC',
  'IB (International Baccalaureate)',
  'Cambridge (IGCSE / A-Level)',
  'NIOS',
  'State Board',
  'Other',
];

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

/**
 * Match backend `SCHOOL_RAZORPAY_TEST_AMOUNTS` + default (non-micro) test prices.
 * Default test charges are ₹100 / ₹200 / ₹300 (see `SCHOOL_RAZORPAY_MICRO_TEST` on API for ₹1/₹2/₹3).
 */
const SCHOOL_PAY_TEST = process.env.REACT_APP_SCHOOL_RAZORPAY_TEST_AMOUNTS === 'true';

const REFERRAL_SOURCES = [
  'EducationWorld Magazine / Website',
  'Another school recommended it',
  'Student or parent recommendation',
  'Social media (Instagram / LinkedIn / Facebook)',
  'Google or online search',
  'Education conference or event',
  'Email or newsletter',
  'Other',
];

const PLANS = [
  {
    id: 'entry',
    name: 'Entry',
    price: SCHOOL_PAY_TEST ? '₹100' : '₹2,00,000',
    priceNum: SCHOOL_PAY_TEST ? 100 : 200000,
    period: '/yr',
    tagline: 'Core benchmarking for one assessment',
    features: [
      'Assessment 1 (Symbolic Reasoning)',
      'Headline performance report',
      'Tier distribution analysis',
      'Path to next tier',
    ],
    recommended: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: SCHOOL_PAY_TEST ? '₹200' : '₹3,00,000',
    priceNum: SCHOOL_PAY_TEST ? 200 : 300000,
    period: '/yr',
    tagline: 'Reasoning triad, basic personality & deep analytics',
    features: [
      'Assessments 1 - 4 (reasoning triad + basic personality)',
      'Full analytics & subscore breakdowns',
      'Grade-level analysis',
      'Comparative benchmarks (national, regional)',
      'Quarterly growth tracking',
      'Prioritised recommendations',
    ],
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: SCHOOL_PAY_TEST ? '₹300' : '₹5,00,000',
    priceNum: SCHOOL_PAY_TEST ? 300 : 500000,
    period: '/yr',
    tagline: 'Everything in Standard, plus consulting',
    features: [
      'Everything in Standard',
      'All grades & custom cohorts',
      'Cohort analysis & cluster insights',
      'Faculty training workshops',
      'Consulting-style action plans',
      'Dedicated account manager',
      'Marketing toolkit (tier badges, parent comms)',
    ],
    recommended: false,
  },
];

const MAX_ABBREVIATIONS = 5;
const MAX_EMAILS = 5;
const TOTAL_STEPS = 4;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const SchoolRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredSchoolId, setRegisteredSchoolId] = useState<string | null>(null);
  const [registeredPocEmail, setRegisteredPocEmail] = useState<string | null>(null);
  const [registeredCheckoutSecret, setRegisteredCheckoutSecret] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [resumingCheckout, setResumingCheckout] = useState(false);

  // Step 1: School Identity
  const [schoolName, setSchoolName] = useState('');
  const [confirmSchoolName, setConfirmSchoolName] = useState('');
  const [abbreviations, setAbbreviations] = useState<string[]>(['']);

  // Step 2: School Details + Address
  const [udiseCode, setUdiseCode] = useState('');
  const [board, setBoard] = useState('');
  const [stateBoardState, setStateBoardState] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Step 3: Point of Contact Emails
  const [emails, setEmails] = useState<string[]>(['']);

  // Step 4: Plan + payment intent (invoice / details sent later)
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [commitToPay, setCommitToPay] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Helpers ──────────────────────────────────────────────────────────────

  const clearError = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  // ── Step 1 ───────────────────────────────────────────────────────────────

  const handleAbbreviationChange = (index: number, value: string) => {
    setAbbreviations((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const addAbbreviation = () => {
    if (abbreviations.length < MAX_ABBREVIATIONS) {
      setAbbreviations((prev) => [...prev, '']);
    }
  };

  const removeAbbreviation = (index: number) => {
    setAbbreviations((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const trimmed = schoolName.trim();
    if (!trimmed) {
      newErrors.schoolName = 'Please enter your school name.';
    } else if (trimmed.length < 2) {
      newErrors.schoolName = 'School name must be at least 2 characters.';
    }
    if (!confirmSchoolName.trim()) {
      newErrors.confirmSchoolName = 'Please re-type your school name to confirm.';
    } else if (schoolName.trim() !== confirmSchoolName.trim()) {
      newErrors.confirmSchoolName =
        'School names do not match. Please type the name exactly as above.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Step 2 ───────────────────────────────────────────────────────────────

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!board) newErrors.board = 'Please select your school board / curriculum.';
    if (board === 'State Board' && !stateBoardState)
      newErrors.stateBoardState = 'Please select your state board.';
    if (!referralSource) newErrors.referralSource = 'Please let us know how you heard about GYS.';
    if (!addressLine1.trim()) newErrors.addressLine1 = 'Address line 1 is required.';
    if (!city.trim()) newErrors.city = 'City is required.';
    if (!addressState) newErrors.addressState = 'Please select your state.';
    if (!zipCode.trim()) {
      newErrors.zipCode = 'PIN code is required.';
    } else if (!/^\d{6}$/.test(zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid 6-digit PIN code.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Step 3 ───────────────────────────────────────────────────────────────

  const handleEmailChange = (index: number, value: string) => {
    setEmails((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
    clearError(`email_${index}`);
  };

  const addEmail = () => {
    if (emails.length < MAX_EMAILS) setEmails((prev) => [...prev, '']);
  };

  const removeEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
    clearError(`email_${index}`);
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const filled = emails.filter((e) => e.trim() !== '');
    if (filled.length === 0) {
      newErrors.emails = 'At least one point-of-contact email is required.';
    }
    emails.forEach((email, i) => {
      if (email.trim() && !isValidEmail(email))
        newErrors[`email_${i}`] = 'Please enter a valid email address.';
    });
    const trimmed = filled.map((e) => e.trim().toLowerCase());
    if (new Set(trimmed).size !== trimmed.length)
      newErrors.emails = 'Please remove duplicate email addresses.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Step 4 ───────────────────────────────────────────────────────────────

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!commitToPay) {
      newErrors.commitToPay =
        'Please confirm that your institution will complete payment (secure checkout on the next step).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
    else if (currentStep === 3 && validateStep3()) setCurrentStep(4);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    else navigate(-1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateStep4()) return;

    const sn = schoolName.trim();
    const cn = confirmSchoolName.trim();
    if (!sn || !cn) {
      toast({
        variant: 'destructive',
        title: 'School name missing',
        description:
          'Your form may have reset (e.g. refresh or hot reload). Go back to Step 1 and re-enter your school name, then continue through the steps.',
      });
      return;
    }
    if (sn.length < 2) {
      toast({
        variant: 'destructive',
        title: 'School name too short',
        description: 'Use at least 2 characters for the official school name (Step 1).',
      });
      return;
    }

    const filledEmails = emails
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    const abbrevList = abbreviations.map((a) => a.trim()).filter((a) => a.length > 0);

    try {
      setIsSubmitting(true);
      const result = await registerSchool({
        school_name: schoolName.trim(),
        confirm_school_name: confirmSchoolName.trim(),
        abbreviations: abbrevList,
        udise_code: udiseCode.trim(),
        board,
        state_board_state: board === 'State Board' ? stateBoardState : '',
        referral_source: referralSource,
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim(),
        city: city.trim(),
        state: addressState,
        postal_code: zipCode.trim(),
        contact_emails: filledEmails,
        selected_plan_id: selectedPlan,
        commit_to_pay: commitToPay,
      });
      setRegisteredSchoolId(result.schoolId);
      setRegisteredPocEmail(result.pocEmail);
      setRegisteredCheckoutSecret(result.checkoutSecret);
      setSubmitted(true);
    } catch (err: unknown) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'SchoolRegistrationPage.handleSubmit');
        Sentry.captureException(err);
      });
      const message = err instanceof Error ? err.message : 'Registration failed.';
      toast({
        variant: 'destructive',
        title: 'Could not register',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Progress bar ─────────────────────────────────────────────────────────

  const stepLabels = ['School Identity', 'School Details', 'Contact Emails', 'Plan & confirmation'];

  const ProgressBar = () => (
    <div className="mb-5 sm:mb-6">
      <p className="text-xs sm:text-sm font-medium uppercase tracking-wide text-slate-500">
        Step {currentStep} of {TOTAL_STEPS} •{' '}
        <span className="font-semibold text-slate-700">{stepLabels[currentStep - 1]}</span>
      </p>
      <div className="mt-2 flex h-1.5 sm:h-2 overflow-hidden rounded-full bg-slate-200 gap-0.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-500"
            style={{ backgroundColor: i < currentStep ? '#22c55e' : '#e2e8f0' }}
          />
        ))}
      </div>
    </div>
  );

  const currentPlan = PLANS.find((p) => p.id === selectedPlan)!;

  // ── Post-submit: Razorpay checkout (until payment verified) ────────────────

  if (
    submitted &&
    !paymentComplete &&
    registeredSchoolId &&
    registeredPocEmail &&
    registeredCheckoutSecret
  ) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Header onBack={() => navigate('/for-schools')} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-md ring-1 ring-slate-100 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <span className="text-3xl">💳</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Complete payment</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold">{schoolName}</span> is registered for the{' '}
              <span className="font-semibold">{currentPlan.name}</span> plan (
              <span className="font-semibold">{currentPlan.price}</span>
              {SCHOOL_PAY_TEST ? ' sandbox test charge' : '/yr'} + GST as applicable). Pay below with UPI, cards, or net
              banking.
            </p>
            {SCHOOL_PAY_TEST && (
              <div className="mt-2 space-y-2 text-left">
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950 leading-relaxed">
                  <span className="font-semibold">Sandbox mode:</span> these amounts are test-only (Entry ₹100, Standard
                  ₹200, Premium ₹300). Use Razorpay&apos;s India test guides -{' '}
                  <a
                    href="https://razorpay.com/docs/payments/payments/test-card-details/?preferred-country=IN"
                    className="font-medium underline underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Cards
                  </a>
                  {' · '}
                  <a
                    href="https://razorpay.com/docs/payments/payments/test-card-upi-details/?preferred-country=IN"
                    className="font-medium underline underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    UPI
                  </a>
                  . If a card fails, try UPI or another method from the same pages. When Checkout asks for a mobile
                  number, use a <span className="font-semibold">real-looking</span> one (not all identical digits) -
                  Razorpay can block dummy contact data on cross-border INR flows. US merchants: see also{' '}
                  <a
                    href="https://razorpay.com/docs/payments/international-payments/?preferred-country=US"
                    className="font-medium underline underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    International payments (US)
                  </a>
                  .
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="rounded-lg border border-amber-200/80 bg-white px-3 py-2 text-[11px] text-slate-700 leading-relaxed font-mono">
                    Dev: Checkout uses <span className="text-slate-900">key_id</span> from{' '}
                    <span className="text-slate-900">createSchoolOrder</span> (<span className="text-slate-900">
                      RAZORPAY_KEY_ID
                    </span>
                    /SECRET on the API), not <span className="text-slate-900">REACT_APP_RAZORPAY_KEY_ID</span>. ₹1/2/3
                    test: <span className="text-slate-900">SCHOOL_RAZORPAY_MICRO_TEST=true</span>. Production prices:{' '}
                    <span className="text-slate-900">SCHOOL_RAZORPAY_TEST_AMOUNTS=false</span> + unset{' '}
                    <span className="text-slate-900">REACT_APP_SCHOOL_RAZORPAY_TEST_AMOUNTS</span>. US/cross-border: no
                    dummy phone in Checkout prefill (Razorpay intl docs); enter a real-looking mobile in the Razorpay
                    modal. <span className="text-slate-900">rzp_test_us_*</span> keys are normal for that product.
                    Optional: <span className="text-slate-900">RAZORPAY_CHECKOUT_CONFIG_ID</span> on API (Dashboard
                    payment config) - echoed to Checkout when set.
                  </p>
                )}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500 font-mono break-all">
              Reference: {registeredSchoolId}
            </p>
            <SchoolRazorpayCheckout
              schoolId={registeredSchoolId}
              checkoutSecret={registeredCheckoutSecret}
              schoolName={schoolName.trim()}
              pocEmail={registeredPocEmail}
              planName={currentPlan.name}
              onSuccess={() => setPaymentComplete(true)}
            />
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              Problems with checkout? Email{' '}
              <a
                href="mailto:schools@globalyoungscholar.com"
                className="font-medium underline underline-offset-2"
                style={{ color: GYS_BLUE }}
              >
                schools@globalyoungscholar.com
              </a>{' '}
              with your school name and reference.
            </p>
          </div>
        </main>
        <PageFooter />
      </div>
    );
  }

  // ── Success Screen (payment done, or fallback if checkout state incomplete) ─

  if (submitted && paymentComplete) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Header onBack={() => navigate('/for-schools')} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-md ring-1 ring-slate-100 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Registration &amp; payment complete</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Thank you. <span className="font-semibold">{schoolName}</span> is on the{' '}
              <span className="font-semibold">{currentPlan.name}</span> plan and your Razorpay
              payment was recorded. Our team may follow up with onboarding and GST documentation.
            </p>
            {registeredSchoolId && (
              <p className="mt-2 text-xs text-slate-500 font-mono break-all">
                School reference: {registeredSchoolId}
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Questions?{' '}
              <a
                href="mailto:schools@globalyoungscholar.com"
                className="font-medium underline underline-offset-2"
                style={{ color: GYS_BLUE }}
              >
                schools@globalyoungscholar.com
              </a>
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

  if (submitted) {
    const canResumePayment = Boolean(registeredSchoolId && registeredPocEmail);

    const handleResumeCheckout = async () => {
      if (!registeredSchoolId || !registeredPocEmail) return;
      setResumingCheckout(true);
      try {
        const { checkoutSecret } = await resumeSchoolCheckout(
          registeredSchoolId,
          registeredPocEmail
        );
        setRegisteredCheckoutSecret(checkoutSecret);
        toast({
          title: 'Ready for payment',
          description: 'Open Razorpay below to complete checkout.',
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not resume checkout.';
        toast({ variant: 'destructive', title: 'Could not load payment', description: message });
      } finally {
        setResumingCheckout(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Header onBack={() => navigate('/for-schools')} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-md ring-1 ring-slate-100 text-center">
            <h2 className="text-lg font-semibold text-slate-900">Payment step needs a refresh</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Your school registration was saved, but this browser session did not keep the secure
              payment token (for example after a refresh, or if the API response was trimmed).
            </p>
            {registeredSchoolId && (
              <p className="mt-3 text-xs text-slate-500 font-mono break-all">
                Reference: {registeredSchoolId}
              </p>
            )}
            {canResumePayment ? (
              <button
                type="button"
                disabled={resumingCheckout}
                onClick={() => void handleResumeCheckout()}
                className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                style={{ backgroundColor: GYS_BLUE }}
              >
                {resumingCheckout ? 'Loading…' : 'Continue to payment'}
              </button>
            ) : null}
            <p className="mt-4 text-xs text-slate-500">
              If this keeps failing, ensure the Functions emulator or deployed API includes{' '}
              <span className="font-mono text-[11px]">resumeSchoolCheckout</span> and your latest{' '}
              <span className="font-mono text-[11px]">registerSchool</span> code, then try again. Or
              contact{' '}
              <a href="mailto:schools@globalyoungscholar.com" className="underline" style={{ color: GYS_BLUE }}>
                schools@globalyoungscholar.com
              </a>
              .
            </p>
          </div>
        </main>
        <PageFooter />
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header onBack={handleBack} />

      <main className="mx-auto flex w-full max-w-lg flex-col px-4 pb-12 pt-6 sm:px-6">
        <ProgressBar />

        <form onSubmit={handleSubmit}>

          {/* ── STEP 1: School Identity ──────────────────────────────────── */}
          {currentStep === 1 && (
            <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-md ring-1 ring-slate-100">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                Register Your School
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Let's start with your school's official name. Type carefully - this is how your
                school will appear across the GYS platform and to students selecting their school.
              </p>

              <div className="mt-5 space-y-5">
                {/* School name */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    Official School Name<span className="text-red-500"> *</span>
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Use the full, official name as it appears on your school's certificate or
                    letterhead.
                  </p>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => { setSchoolName(e.target.value); clearError('schoolName'); }}
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                      errors.schoolName
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                    placeholder="e.g. Delhi Public School, R.K. Puram"
                    autoComplete="off"
                    required
                  />
                  {errors.schoolName && (
                    <p className="mt-1 text-xs text-red-600">{errors.schoolName}</p>
                  )}
                </div>

                {/* Confirm school name - no copy-paste */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    Confirm School Name<span className="text-red-500"> *</span>
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Type the school name again exactly as above. Copy-paste is disabled to prevent
                    typos.
                  </p>
                  <input
                    type="text"
                    value={confirmSchoolName}
                    onChange={(e) => { setConfirmSchoolName(e.target.value); clearError('confirmSchoolName'); }}
                    onPaste={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                      errors.confirmSchoolName
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : confirmSchoolName && schoolName && confirmSchoolName === schoolName
                        ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                    placeholder="Type the school name again"
                    autoComplete="off"
                    required
                  />
                  {confirmSchoolName && schoolName && confirmSchoolName === schoolName && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium">Names match ✓</p>
                  )}
                  {errors.confirmSchoolName && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirmSchoolName}</p>
                  )}
                </div>

                {/* Abbreviations / aliases */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    School Abbreviations / Common Names
                    <span className="ml-1 text-slate-400 font-normal">(optional)</span>
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    Add any short names, abbreviations, or aliases students commonly use - for
                    example <span className="font-medium">DPS RK Puram</span>,{' '}
                    <span className="font-medium">DPS-R</span>, or{' '}
                    <span className="font-medium">Delhi Public RKP</span>. These help students find
                    and correctly identify your school from a dropdown. Up to {MAX_ABBREVIATIONS}.
                  </p>
                  <div className="mt-2 space-y-2">
                    {abbreviations.map((abbr, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={abbr}
                          onChange={(e) => handleAbbreviationChange(i, e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          placeholder={`Abbreviation ${i + 1}`}
                          autoComplete="off"
                          maxLength={60}
                        />
                        {abbreviations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAbbreviation(i)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {abbreviations.length < MAX_ABBREVIATIONS && (
                    <button
                      type="button"
                      onClick={addAbbreviation}
                      className="mt-2 text-xs sm:text-sm font-medium hover:underline"
                      style={{ color: GYS_BLUE }}
                    >
                      + Add another abbreviation
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm sm:text-base font-semibold text-white shadow-md hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                style={{ backgroundColor: GYS_BLUE }}
              >
                Continue →
              </button>
            </section>
          )}

          {/* ── STEP 2: School Details + Address ────────────────────────── */}
          {currentStep === 2 && (
            <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-md ring-1 ring-slate-100">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">School Details</h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Details about your school's board, location, and how you found us.
              </p>

              <div className="mt-5 space-y-5">
                {/* UDISE Code */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    UDISE Code
                    <span className="ml-1 text-slate-400 font-normal">(optional)</span>
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    The 11-digit code assigned by the Ministry of Education. Found on your school's
                    UDISE certificate.
                  </p>
                  <input
                    type="text"
                    value={udiseCode}
                    onChange={(e) =>
                      setUdiseCode(e.target.value.replace(/\D/g, '').slice(0, 11))
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    placeholder="e.g. 09041400302"
                    autoComplete="off"
                    inputMode="numeric"
                    maxLength={11}
                  />
                </div>

                {/* Board / Curriculum */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    Board / Curriculum<span className="text-red-500"> *</span>
                  </label>
                  <select
                    value={board}
                    onChange={(e) => {
                      setBoard(e.target.value);
                      setStateBoardState('');
                      clearError('board');
                      clearError('stateBoardState');
                    }}
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-1 ${
                      errors.board
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                    required
                  >
                    <option value="">Select board / curriculum</option>
                    {BOARDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {errors.board && <p className="mt-1 text-xs text-red-600">{errors.board}</p>}

                  {/* State Board sub-selector */}
                  {board === 'State Board' && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Which state board?<span className="text-red-500"> *</span>
                      </label>
                      <select
                        value={stateBoardState}
                        onChange={(e) => {
                          setStateBoardState(e.target.value);
                          clearError('stateBoardState');
                        }}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-1 ${
                          errors.stateBoardState
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                        }`}
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors.stateBoardState && (
                        <p className="mt-1 text-xs text-red-600">{errors.stateBoardState}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* How did you hear about GYS */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    How did you hear about GYS?<span className="text-red-500"> *</span>
                  </label>
                  <select
                    value={referralSource}
                    onChange={(e) => { setReferralSource(e.target.value); clearError('referralSource'); }}
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-1 ${
                      errors.referralSource
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                    required
                  >
                    <option value="">Select an option</option>
                    {REFERRAL_SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.referralSource && (
                    <p className="mt-1 text-xs text-red-600">{errors.referralSource}</p>
                  )}
                </div>

                {/* ── School Address ─────────────────────────────────────── */}
                <div className="pt-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mb-3">
                    School Address<span className="text-red-500"> *</span>
                  </p>

                  {/* Address line 1 */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Address Line 1<span className="text-red-500"> *</span>
                      </label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => { setAddressLine1(e.target.value); clearError('addressLine1'); }}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                          errors.addressLine1
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                        }`}
                        placeholder="Building / house no., street name"
                        autoComplete="off"
                      />
                      {errors.addressLine1 && (
                        <p className="mt-1 text-xs text-red-600">{errors.addressLine1}</p>
                      )}
                    </div>

                    {/* Address line 2 */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Address Line 2
                        <span className="ml-1 text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                        placeholder="Locality / area / landmark"
                        autoComplete="off"
                      />
                    </div>

                    {/* City + State */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          City<span className="text-red-500"> *</span>
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => { setCity(e.target.value); clearError('city'); }}
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                            errors.city
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                              : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                          }`}
                          placeholder="e.g. New Delhi"
                          autoComplete="off"
                        />
                        {errors.city && (
                          <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          State<span className="text-red-500"> *</span>
                        </label>
                        <select
                          value={addressState}
                          onChange={(e) => { setAddressState(e.target.value); clearError('addressState'); }}
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 ${
                            errors.addressState
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                              : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                          }`}
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {errors.addressState && (
                          <p className="mt-1 text-xs text-red-600">{errors.addressState}</p>
                        )}
                      </div>
                    </div>

                    {/* PIN Code */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        PIN Code<span className="text-red-500"> *</span>
                      </label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => {
                          setZipCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                          clearError('zipCode');
                        }}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                          errors.zipCode
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                        }`}
                        placeholder="6-digit PIN code"
                        autoComplete="off"
                        inputMode="numeric"
                        maxLength={6}
                      />
                      {errors.zipCode && (
                        <p className="mt-1 text-xs text-red-600">{errors.zipCode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all duration-200"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                  style={{ backgroundColor: GYS_BLUE }}
                >
                  Continue →
                </button>
              </div>
            </section>
          )}

          {/* ── STEP 3: Points of Contact ────────────────────────────────── */}
          {currentStep === 3 && (
            <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-md ring-1 ring-slate-100">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                Points of Contact
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Add <span className="font-semibold">1 - 5 email addresses</span> for school officials
                who should have access to your school's reports and data on the GYS portal.
              </p>

              <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <span className="font-semibold block mb-1">What these emails are for</span>
                  These can be a shared generic inbox that multiple senior school officials use
                  (e.g.{' '}
                  <span className="font-medium">principal@yourschool.edu.in</span>), or individual
                  addresses for the principal or administrator. Each address you add will be able to
                  use the school admin login flow: after registration is processed, they can sign in
                  with their school email and set a password (we send a secure link via Firebase
                  Auth) to access your institution&apos;s dashboard and reports.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {emails.map((email, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: GYS_BLUE }}
                      >
                        {i + 1}
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(i, e.target.value)}
                        className={`flex-1 rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                          errors[`email_${i}`]
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                        }`}
                        placeholder={
                          i === 0
                            ? 'principal@yourschool.edu.in'
                            : `contact${i + 1}@yourschool.edu.in`
                        }
                        autoComplete="off"
                      />
                      {emails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmail(i)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          aria-label="Remove email"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {errors[`email_${i}`] && (
                      <p className="mt-1 pl-8 text-xs text-red-600">{errors[`email_${i}`]}</p>
                    )}
                  </div>
                ))}

                {errors.emails && (
                  <p className="text-xs text-red-600">{errors.emails}</p>
                )}

                {emails.length < MAX_EMAILS ? (
                  <button
                    type="button"
                    onClick={addEmail}
                    className="mt-1 text-xs sm:text-sm font-medium hover:underline"
                    style={{ color: GYS_BLUE }}
                  >
                    + Add another email{' '}
                    <span className="text-slate-400 font-normal">
                      ({emails.length}/{MAX_EMAILS})
                    </span>
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Maximum of {MAX_EMAILS} emails reached.
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all duration-200"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                  style={{ backgroundColor: GYS_BLUE }}
                >
                  Continue →
                </button>
              </div>
            </section>
          )}

          {/* ── STEP 4: Plan & pay-later acknowledgement ───────────────── */}
          {currentStep === 4 && (
            <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-md ring-1 ring-slate-100">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                Select a plan
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Choose the institutional subscription that fits your school. After you submit this
                form, you will complete payment securely via Razorpay (UPI, cards, net banking).
              </p>

              {/* Plan cards */}
              <div className="mt-5 space-y-3">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#1e3a8a] bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {plan.recommended && (
                        <span className="absolute -top-2.5 right-3 rounded-full bg-[#fbbf24] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-sm">
                          Recommended
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 rounded-full border-2 items-center justify-center transition-colors ${
                              isSelected ? 'border-[#1e3a8a]' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && (
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: GYS_BLUE }}
                              />
                            )}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {plan.tagline}
                            </p>
                            {isSelected && (
                              <ul className="mt-2 space-y-0.5">
                                {plan.features.map((f) => (
                                  <li
                                    key={f}
                                    className="flex items-start gap-1 text-xs text-slate-600"
                                  >
                                    <span className="text-emerald-600 mt-px">✓</span>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                        <p
                          className="shrink-0 text-base sm:text-lg font-bold"
                          style={{ color: GYS_BLUE }}
                        >
                          {plan.price}
                          <span className="text-xs font-normal text-slate-500">{plan.period}</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Order summary */}
              <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Order Summary
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">
                    {schoolName} - {currentPlan.name} Plan
                  </span>
                  <span className="font-bold" style={{ color: GYS_BLUE }}>
                    {currentPlan.price}/yr
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {board === 'State Board' && stateBoardState
                    ? `State Board - ${stateBoardState}`
                    : board}
                </p>
                {udiseCode && (
                  <p className="mt-1 text-xs text-slate-500">UDISE: {udiseCode}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {addressLine1}{addressLine2 ? `, ${addressLine2}` : ''}, {city}, {addressState} - {zipCode}
                </p>
                <div className="mt-2 border-t border-slate-200 pt-2 flex justify-between text-sm font-semibold text-slate-900">
                  <span>Annual fee (excl. GST)</span>
                  <span style={{ color: GYS_BLUE }}>{currentPlan.price}/yr + GST</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3">
                <p className="text-xs text-amber-950 leading-relaxed">
                  <span className="font-semibold">Payment</span>{' '}
                  Submitting registers your school and chosen plan. The next screen opens Razorpay
                  checkout for the plan fee (plus GST as shown at payment). You can use test cards in
                  Razorpay test mode.
                </p>
              </div>

              <div className="mt-5 flex gap-3 items-start">
                <input
                  id="commit-to-pay"
                  type="checkbox"
                  checked={commitToPay}
                  onChange={(e) => {
                    setCommitToPay(e.target.checked);
                    clearError('commitToPay');
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a]"
                />
                <label htmlFor="commit-to-pay" className="text-xs sm:text-sm text-slate-700 leading-relaxed cursor-pointer">
                  On behalf of our institution, we confirm that we intend to subscribe at the plan
                  selected above and{' '}
                  <span className="font-semibold">will complete payment</span> on the Razorpay step
                  that follows this form.
                </label>
              </div>
              {errors.commitToPay && (
                <p className="mt-2 text-xs text-red-600">{errors.commitToPay}</p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all duration-200"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
                  style={{ backgroundColor: GYS_BLUE }}
                >
                  {isSubmitting ? 'Submitting…' : 'Complete registration'}
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-slate-500">
                All prices are exclusive of applicable GST. Annual institutional license.
              </p>
            </section>
          )}

        </form>
      </main>

      <PageFooter />
    </div>
  );
};

// ── Shared sub-components ────────────────────────────────────────────────────

const Header: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 bg-white/90 border-b border-gray-200 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 sm:gap-6">
        <button
          type="button"
          onClick={onBack}
          className="group flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors duration-200 hover:bg-slate-100 rounded-lg px-1 py-0.5 -ml-1"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs transition-all duration-200 group-hover:border-slate-400">
            ←
          </span>
          <span className="hidden xs:inline">Back</span>
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
            <p className="text-xs text-gray-500">Powered by Argus, Access USA, EducationWorld</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <PublicHomeNavButton />
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2.5 sm:px-5 rounded-xl text-white text-sm font-medium shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:brightness-110 active:scale-95 transition-all duration-200"
            style={{ backgroundColor: GYS_BLUE }}
          >
            Log In
          </button>
        </div>
      </div>
    </header>
  );
};

const PageFooter: React.FC = () => (
  <footer className="bg-white border-t border-gray-200 py-8">
    <div className="mx-auto max-w-5xl px-6">
      <p className="text-center text-xs text-gray-500 sm:text-sm">
        © 2026 Global Young Scholar. A joint initiative of Access USA, Argus, and EducationWorld.
      </p>
    </div>
  </footer>
);

export default SchoolRegistrationPage;
