import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/use-toast';
import {
  amendSchoolRegistration,
  registerSchool,
  // resumeSchoolCheckout, // used only when embedded Razorpay is enabled (see below)
} from '../../db/schoolCollection';
import {
  partyNameLengthOk,
  shipLine1Ok,
  cityOk,
  RAZORPAY_PARTY_NAME_MIN,
  RAZORPAY_PARTY_NAME_MAX,
  RAZORPAY_SHIP_LINE1_MIN,
  RAZORPAY_SHIP_LINE1_MAX,
  RAZORPAY_SHIP_LINE2_MAX,
  RAZORPAY_CITY_MIN,
  RAZORPAY_CITY_MAX,
} from '../../utils/schoolRegistrationPaymentRules';
import * as Sentry from '@sentry/react';
import PageFooter from '../../components/layout/LandingSiteFooter';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { LandingHeaderScrollProgress } from '../../components/landing/LandingScrollChrome';
import { useLandingScrollProgress } from '../../hooks/useLandingPageScroll';
// import SchoolRazorpayCheckout from '../../components/school-registration/SchoolRazorpayCheckout';
import {
  SCHOOL_REGISTRATION_PLANS as PLANS,
  schoolPlanAnnualLabel,
  schoolPlanPriceQualifierAfterAmount,
} from '../../utils/schoolRegistrationPlans';

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
  'Delhi NCT',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

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

const MAX_EMAILS = 5;
const TOTAL_STEPS = 4;

/** When true: skip embedded Razorpay; onboarding emails a payment link. Set false for Razorpay checkout after submit. */
const SCHOOL_SIGNUP_TEMP_PAYMENT_LINK = true;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Single stored `school_name`: official name + optional ", Branch" (not a separate DB field). */
function buildStoredSchoolName(base: string, branch: string): string {
  const b = base.trim();
  const br = branch.trim();
  if (!br) return b;
  return `${b}, ${br}`;
}

const SchoolRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredSchoolId, setRegisteredSchoolId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- read by embedded Razorpay block when that section is uncommented
  const [registeredPocEmail, setRegisteredPocEmail] = useState<string | null>(null);
  const [registeredCheckoutSecret, setRegisteredCheckoutSecret] = useState<string | null>(null);
  // const [paymentComplete, setPaymentComplete] = useState(false); // with embedded Razorpay only
  // const [resumingCheckout, setResumingCheckout] = useState(false); // resumeSchoolCheckout UI only

  // Step 1: School Identity
  const [schoolName, setSchoolName] = useState('');
  const [confirmSchoolName, setConfirmSchoolName] = useState('');
  /** Optional campus / city for multi-branch chains (stored appended to school name only). */
  const [schoolBranch, setSchoolBranch] = useState('');

  // Step 2: School Details + Address
  const [udiseCode, setUdiseCode] = useState('');
  const [boards, setBoards] = useState<string[]>([]);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const boardDropdownRef = useRef<HTMLDivElement>(null);
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

  const storedSchoolName = useMemo(
    () => buildStoredSchoolName(schoolName, schoolBranch),
    [schoolName, schoolBranch]
  );

  useEffect(() => {
    if (!boardDropdownOpen) return;
    const closeOnOutside = (e: MouseEvent | TouchEvent) => {
      const el = boardDropdownRef.current;
      if (el && !el.contains(e.target as Node)) setBoardDropdownOpen(false);
    };
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBoardDropdownOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('touchstart', closeOnOutside, { passive: true });
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('touchstart', closeOnOutside);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [boardDropdownOpen]);

  const toggleBoardOption = (b: string) => {
    const next = boards.includes(b) ? boards.filter((x) => x !== b) : [...boards, b];
    setBoards(next);
    if (!next.includes('State Board')) setStateBoardState('');
    clearError('board');
    clearError('stateBoardState');
  };

  // ── Step 1 ───────────────────────────────────────────────────────────────

  const getStep1Errors = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    const trimmed = schoolName.trim();
    const stored = buildStoredSchoolName(schoolName, schoolBranch);
    if (!trimmed) {
      newErrors.schoolName = 'Please enter your school name.';
    } else if (!partyNameLengthOk(stored)) {
      if (schoolBranch.trim()) {
        newErrors.schoolBranch =
          `School name and branch together must be ${RAZORPAY_PARTY_NAME_MIN}–${RAZORPAY_PARTY_NAME_MAX} characters (payment partner). Shorten the name or branch.`;
      } else {
        newErrors.schoolName = `School name must be ${RAZORPAY_PARTY_NAME_MIN}–${RAZORPAY_PARTY_NAME_MAX} characters (required by our payment partner for billing).`;
      }
    }
    if (!confirmSchoolName.trim()) {
      newErrors.confirmSchoolName = 'Please re-type your school name to confirm.';
    } else if (schoolName.trim() !== confirmSchoolName.trim()) {
      newErrors.confirmSchoolName =
        'School names do not match. Please type the name exactly as above.';
    }
    return newErrors;
  };

  const validateStep1 = (): boolean => {
    const newErrors = getStep1Errors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Step 2 ───────────────────────────────────────────────────────────────

  const getStep2Errors = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (boards.length === 0)
      newErrors.board = 'Please select at least one board / curriculum.';
    if (boards.includes('State Board') && !stateBoardState)
      newErrors.stateBoardState = 'Please select your state board.';
    if (!referralSource) newErrors.referralSource = 'Please let us know how you heard about GYS.';
    const line1 = addressLine1.trim();
    if (!line1) {
      newErrors.addressLine1 = 'Address line 1 is required.';
    } else if (!shipLine1Ok(line1)) {
      newErrors.addressLine1 = `Address line 1 must be ${RAZORPAY_SHIP_LINE1_MIN}–${RAZORPAY_SHIP_LINE1_MAX} characters (payment partner requirement).`;
    }
    const line2 = addressLine2.trim();
    if (line2.length > RAZORPAY_SHIP_LINE2_MAX) {
      newErrors.addressLine2 = `Address line 2 must be at most ${RAZORPAY_SHIP_LINE2_MAX} characters.`;
    }
    const cityTrim = city.trim();
    if (!cityTrim) {
      newErrors.city = 'City is required.';
    } else if (!cityOk(cityTrim)) {
      newErrors.city = `City must be ${RAZORPAY_CITY_MIN}–${RAZORPAY_CITY_MAX} characters.`;
    }
    if (!addressState) newErrors.addressState = 'Please select your state.';
    if (!zipCode.trim()) {
      newErrors.zipCode = 'PIN code is required.';
    } else if (!/^\d{6}$/.test(zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid 6-digit PIN code.';
    }
    return newErrors;
  };

  const validateStep2 = (): boolean => {
    const newErrors = getStep2Errors();
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

  const getStep3Errors = (): Record<string, string> => {
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
    return newErrors;
  };

  const validateStep3 = (): boolean => {
    const newErrors = getStep3Errors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Step 4 ───────────────────────────────────────────────────────────────

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!commitToPay) {
      newErrors.commitToPay = SCHOOL_SIGNUP_TEMP_PAYMENT_LINK
        ? 'Please confirm that your institution will complete payment using the link we email you.'
        : 'Please confirm that your institution will complete payment (secure checkout on the next step).';
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

    const e1 = getStep1Errors();
    const e2 = getStep2Errors();
    const e3 = getStep3Errors();
    const merged = { ...e1, ...e2, ...e3 };
    if (Object.keys(merged).length > 0) {
      setErrors(merged);
      setCurrentStep(
        Object.keys(e1).length > 0 ? 1 : Object.keys(e2).length > 0 ? 2 : 3
      );
      toast({
        variant: 'destructive',
        title: 'Check your details',
        description:
          'Fix the highlighted fields. Your school name and address must match what our payment partner accepts before we can create the order.',
      });
      return;
    }

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

    const filledEmails = emails
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    try {
      setIsSubmitting(true);
      const payload = {
        school_name: storedSchoolName,
        confirm_school_name: storedSchoolName,
        abbreviations: [],
        udise_code: udiseCode.trim(),
        boards,
        state_board_state: boards.includes('State Board') ? stateBoardState : '',
        referral_source: referralSource,
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim(),
        city: city.trim(),
        state: addressState,
        postal_code: zipCode.trim(),
        contact_emails: filledEmails,
        selected_plan_id: selectedPlan,
        commit_to_pay: commitToPay,
      };
      const amending = Boolean(registeredSchoolId && registeredCheckoutSecret);
      const result = amending
        ? await amendSchoolRegistration({
            ...payload,
            school_id: registeredSchoolId!,
            checkout_secret: registeredCheckoutSecret!,
          })
        : await registerSchool(payload);
      setRegisteredSchoolId(result.schoolId);
      setRegisteredPocEmail(result.pocEmail);
      setRegisteredCheckoutSecret(
        result.checkoutSecret ||
          registeredCheckoutSecret ||
          ''
      );
      setSubmitted(true);
    } catch (err: unknown) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'SchoolRegistrationPage.handleSubmit');
        Sentry.captureException(err);
      });
      const message = err instanceof Error ? err.message : 'Registration failed.';
      toast({
        variant: 'destructive',
        title:
          registeredSchoolId && registeredCheckoutSecret
            ? 'Could not update registration'
            : 'Could not register',
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

  // ── Post-submit: payment link (temporary) or Razorpay checkout ───────────────

  if (submitted && SCHOOL_SIGNUP_TEMP_PAYMENT_LINK && registeredSchoolId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Header onBack={() => navigate('/for-schools')} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-md ring-1 ring-slate-100 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <span className="text-3xl" aria-hidden>
                ✉️
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Registration received</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Thank you. <span className="font-semibold">{storedSchoolName}</span> is recorded for the{' '}
              <span className="font-semibold">{currentPlan.name}</span> plan (
              <span className="font-semibold">{currentPlan.price}</span>
              {schoolPlanPriceQualifierAfterAmount()} + GST as applicable).{' '}
              <span className="font-semibold">
                We will email a secure Razorpay payment link
              </span>{' '}
              to your point-of-contact address(es) so you can complete payment online (UPI, cards, net
              banking).
            </p>
            {registeredSchoolId && (
              <p className="mt-3 text-xs text-slate-500 font-mono break-all">
                Reference: {registeredSchoolId}
              </p>
            )}
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              Didn&apos;t get the email? Check spam, or write to{' '}
              <a
                href="mailto:schools@globalyoungscholar.com"
                className="font-medium underline underline-offset-2"
                style={{ color: GYS_BLUE }}
              >
                schools@globalyoungscholar.com
              </a>{' '}
              with your school name and reference.
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

  /*
  ── Embedded Razorpay (disabled while SCHOOL_SIGNUP_TEMP_PAYMENT_LINK is true) ──
  if (
    !SCHOOL_SIGNUP_TEMP_PAYMENT_LINK &&
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
              <span className="font-semibold">{storedSchoolName}</span> is registered for the{' '}
              <span className="font-semibold">{currentPlan.name}</span> plan (
              <span className="font-semibold">{currentPlan.price}</span>
              {schoolPlanPriceQualifierAfterAmount()} + GST as applicable). Pay below with UPI, cards, or net
              banking.
            </p>
            {SCHOOL_PAY_TEST && (
              <div className="mt-2 space-y-2 text-left">
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950 leading-relaxed">
                  <span className="font-semibold">Sandbox mode:</span> these amounts are test-only (
                  {schoolSandboxPlanAmountsSummary()}). Use Razorpay&apos;s India test guides -{' '}
                  <a
                    href="https://razorpay.com/docs/payments/payments/test-card-details/?preferred-country=IN"
                    className="font-medium underline underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Cards
                  </a>
                  {' • '}
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
                    test: <span className="text-slate-900">SCHOOL_RAZORPAY_MICRO_TEST=true</span> on API +{' '}
                    <span className="text-slate-900">REACT_APP_SCHOOL_RAZORPAY_MICRO_TEST=false</span> on this app.
                    Production prices:{' '}
                    <span className="text-slate-900">SCHOOL_RAZORPAY_TEST_AMOUNTS=false</span> + unset{' '}
                    <span className="text-slate-900">REACT_APP_SCHOOL_RAZORPAY_TEST_AMOUNTS</span> /{' '}
                    <span className="text-slate-900">REACT_APP_SCHOOL_RAZORPAY_MICRO_TEST</span>. US/cross-border: no
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
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setCurrentStep(1);
              }}
              className="mt-4 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition-all"
            >
              Edit registration details
            </button>
            <p className="mt-2 text-left text-xs text-slate-500 leading-relaxed">
              Opens the registration form again with your answers preserved. Update any field, go through to step 4,
              and submit; we&apos;ll save changes to this school reference (same checkout token) before you pay.
            </p>

            <SchoolRazorpayCheckout
              schoolId={registeredSchoolId}
              checkoutSecret={registeredCheckoutSecret}
              schoolName={storedSchoolName}
              pocEmail={registeredPocEmail ?? ''}
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

  // ── Success Screen (Razorpay payment verified) ─

  if (!SCHOOL_SIGNUP_TEMP_PAYMENT_LINK && submitted && paymentComplete) {
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
              Thank you. <span className="font-semibold">{storedSchoolName}</span> is on the{' '}
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

  if (submitted && !SCHOOL_SIGNUP_TEMP_PAYMENT_LINK) {
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
  */

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
                  <p className="mt-1 text-xs text-slate-500">
                  
                    <span className="font-medium text-slate-700">
                      {RAZORPAY_PARTY_NAME_MIN}–{RAZORPAY_PARTY_NAME_MAX} characters
                    </span>
                    .{' '}
                    <span className="text-slate-400">
                      ({storedSchoolName.length}/{RAZORPAY_PARTY_NAME_MAX})
                    </span>
                  </p>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => { setSchoolName(e.target.value); clearError('schoolName'); clearError('schoolBranch'); }}
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                      errors.schoolName
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                    placeholder="e.g. Delhi Public School"
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
                    Type the school name again exactly as above.
                    
                  </p>
                  <input
                    type="text"
                    value={confirmSchoolName}
                    maxLength={RAZORPAY_PARTY_NAME_MAX}
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

                {/* Optional branch / campus (stored as part of school name only) */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    Branch or campus
                    <span className="ml-1 text-slate-400 font-normal">(optional)</span>
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    For schools with multiple locations, add your branch name. If you have already mentioned the branch name in the school name field, please do not add it here.
                   
                  </p>
                  <input
                    type="text"
                    value={schoolBranch}
                    maxLength={RAZORPAY_PARTY_NAME_MAX}
                    onChange={(e) => {
                      setSchoolBranch(e.target.value);
                      clearError('schoolBranch');
                      clearError('schoolName');
                    }}
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                      errors.schoolBranch
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                    placeholder="e.g. Gurgaon, Kolkata, Borivalli"
                    autoComplete="off"
                  />
                  {errors.schoolBranch && (
                    <p className="mt-1 text-xs text-red-600">{errors.schoolBranch}</p>
                  )}
                </div>

                {/* Abbreviations / aliases */}
                {/* <div>
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
                </div> */}
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

                {/* Board / Curriculum — dropdown + checkboxes (mobile-friendly) */}
                <div className="relative" ref={boardDropdownRef}>
                  <span
                    id="school-registration-boards-label"
                    className="block text-xs sm:text-sm font-bold text-slate-700"
                  >
                    Board / Curriculum<span className="text-red-500"> *</span>
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Tap the field below and check all that apply (at least one).
                  </p>
                  <button
                    type="button"
                    id="school-registration-boards-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={boardDropdownOpen}
                    aria-labelledby="school-registration-boards-label school-registration-boards-trigger"
                    onClick={() => setBoardDropdownOpen((o) => !o)}
                    className={`mt-1.5 flex min-h-[2.75rem] w-full items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-1 ${
                      errors.board
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    } ${boards.length === 0 ? 'text-slate-400' : ''}`}
                  >
                    <span className="min-w-0 flex-1 break-words">
                      {boards.length === 0
                        ? 'Select board / curriculum'
                        : boards.join(', ')}
                    </span>
                    <svg
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
                        boardDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {boardDropdownOpen && (
                    <div
                      role="listbox"
                      aria-multiselectable="true"
                      aria-labelledby="school-registration-boards-label"
                      className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[min(320px,calc(100vh-12rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
                    >
                      {BOARDS.map((b) => {
                        const checked = boards.includes(b);
                        return (
                          <label
                            key={b}
                            className={`flex cursor-pointer items-start gap-3 px-3 py-3.5 text-sm text-slate-900 active:bg-slate-50 sm:py-3 ${
                              checked ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a]"
                              checked={checked}
                              onChange={() => toggleBoardOption(b)}
                            />
                            <span className="leading-snug">{b}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {errors.board && <p className="mt-1 text-xs text-red-600">{errors.board}</p>}

                  {/* State Board sub-selector */}
                  {boards.includes('State Board') && (
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
                  <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                      Payment checkout uses this address
                    </p>
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] text-slate-600 leading-snug">
                      <li>
                        Address line 1: {RAZORPAY_SHIP_LINE1_MIN}–{RAZORPAY_SHIP_LINE1_MAX} characters
                      </li>
                      <li>Address line 2 (optional): up to {RAZORPAY_SHIP_LINE2_MAX} characters</li>
                      <li>
                        City: {RAZORPAY_CITY_MIN}–{RAZORPAY_CITY_MAX} characters
                      </li>
                      <li>PIN: exactly 6 digits</li>
                    </ul>
                  </div>

                  {/* Address line 1 */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Address Line 1<span className="text-red-500"> *</span>
                      </label>
                      <input
                        type="text"
                        value={addressLine1}
                        maxLength={RAZORPAY_SHIP_LINE1_MAX}
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
                        maxLength={RAZORPAY_SHIP_LINE2_MAX}
                        onChange={(e) => {
                          setAddressLine2(e.target.value);
                          clearError('addressLine2');
                        }}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                          errors.addressLine2
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                        }`}
                        placeholder="Locality / area / landmark"
                        autoComplete="off"
                      />
                      {errors.addressLine2 && (
                        <p className="mt-1 text-xs text-red-600">{errors.addressLine2}</p>
                      )}
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
                          maxLength={RAZORPAY_CITY_MAX}
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
                Choose the institutional package that fits your school. After you submit this form,
                {SCHOOL_SIGNUP_TEMP_PAYMENT_LINK
                  ? ' we will email you a secure payment link to complete checkout (UPI, cards, net banking).'
                  : ' you will complete payment securely via Razorpay (UPI, cards, net banking).'}
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
                      {plan.popular && (
                        <span className="absolute -top-2.5 right-3 rounded-full bg-[#fbbf24] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-sm">
                          Popular
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
                    {storedSchoolName} - {currentPlan.name} Plan
                  </span>
                  <span className="font-bold" style={{ color: GYS_BLUE }}>
                    {schoolPlanAnnualLabel(currentPlan)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {boards.includes('State Board') && stateBoardState
                    ? [...boards.filter((b) => b !== 'State Board'), `State Board (${stateBoardState})`].join(', ')
                    : boards.join(', ')}
                </p>
                {udiseCode && (
                  <p className="mt-1 text-xs text-slate-500">UDISE: {udiseCode}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {addressLine1}{addressLine2 ? `, ${addressLine2}` : ''}, {city}, {addressState} - {zipCode}
                </p>
                <div className="mt-2 border-t border-slate-200 pt-2 flex justify-between text-sm font-semibold text-slate-900">
                  <span>Annual fee (excl. GST)</span>
                  <span style={{ color: GYS_BLUE }}>{schoolPlanAnnualLabel(currentPlan)} + GST</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3">
                <p className="text-xs text-amber-950 leading-relaxed">
                  <span className="font-semibold">Payment</span>{' '}
                  {SCHOOL_SIGNUP_TEMP_PAYMENT_LINK ? (
                    <>
                      Submitting registers your school and chosen plan. Our team will send a Razorpay
                      payment link to your contact email(s) for the plan fee (plus GST as shown on the
                      link).
                    </>
                  ) : (
                    <>
                      Submitting registers your school and chosen plan. The next screen opens Razorpay
                      checkout for the plan fee (plus GST as shown at payment). You can use test cards in
                      Razorpay test mode.
                    </>
                  )}
                </p>
              </div>

              <div className="mt-5 flex gap-3 items-start">
                <input
                  id="commit-to-pay"
                  type="checkbox"
                  required
                  aria-required="true"
                  checked={commitToPay}
                  onChange={(e) => {
                    setCommitToPay(e.target.checked);
                    clearError('commitToPay');
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a]"
                />
                <label htmlFor="commit-to-pay" className="text-xs sm:text-sm text-slate-700 leading-relaxed cursor-pointer">
                  <span className="font-semibold text-slate-900">Required.</span>{' '}
                  On behalf of our institution, we confirm that we intend to subscribe at the plan
                  selected above and{' '}
                  <span className="font-semibold">will complete payment</span>{' '}
                  {SCHOOL_SIGNUP_TEMP_PAYMENT_LINK
                    ? 'using the secure payment link we receive by email.'
                    : 'on the Razorpay step that follows this form.'}
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
                  disabled={isSubmitting || !commitToPay}
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

export default SchoolRegistrationPage;
