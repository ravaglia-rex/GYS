import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/use-toast';
import {
  amendSchoolRegistration,
  registerSchool,
} from '../../db/schoolCollection';
import {
  partyNameLengthOk,
  cityOk,
  stateOk,
  razorpayEmailOk,
  partyNameCharsOk,
  partyNameCharsError,
  sanitizePartyNameInput,
  sanitizeLatinNameInput,
  RAZORPAY_PARTY_NAME_MIN,
  RAZORPAY_PARTY_NAME_MAX,
  RAZORPAY_CITY_MIN,
  RAZORPAY_CITY_MAX,
  RAZORPAY_STATE_MIN,
  RAZORPAY_STATE_MAX,
  RAZORPAY_EMAIL_LOCAL_MAX,
} from '../../utils/schoolRegistrationPaymentRules';
import * as Sentry from '@sentry/react';
import PageFooter from '../../components/layout/LandingSiteFooter';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { LandingHeaderScrollProgress } from '../../components/landing/LandingScrollChrome';
import { useLandingScrollProgress } from '../../hooks/useLandingPageScroll';
import {
  SCHOOL_REGISTRATION_PLANS as PLANS,
  schoolRegistrationCheckoutSummaryFromBaseInr,
} from '../../utils/schoolRegistrationPlans';
import {
  isValidIndiaMobile,
  toIndiaMobileNationalDigits,
  withIndiaCountryCode,
} from '../../utils/indiaMobile';

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
type GstRegistrationStatus = '' | 'yes' | 'no' | 'not_sure';

const STEP1_FIELD_ORDER = ['schoolName', 'schoolBranch', 'confirmSchoolName'] as const;
const STEP2_FIELD_ORDER = [
  'board',
  'stateBoardState',
  'city',
  'addressState',
  'referralSource',
] as const;
const STEP3_FIELD_ORDER = [
  'registrantFirstName',
  'registrantLastName',
  'registrantDesignation',
  'registrantPhone',
  'emails',
] as const;
const STEP4_FIELD_ORDER = ['gstRegistrationStatus', 'gstin', 'commitToPay'] as const;

function scrollToFirstError(
  errorRecord: Record<string, string>,
  order: readonly string[]
): void {
  const key = order.find((k) => Boolean(errorRecord[k]));
  if (!key) return;
  const el = document.getElementById(`field-${key}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable = el?.querySelector<HTMLElement>(
    'input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
  );
  focusable?.focus({ preventScroll: true });
}

/** Single stored `school_name`: official name + optional branch, space-separated (not a separate DB field). */
function buildStoredSchoolName(base: string, branch: string): string {
  const b = base.trim();
  const br = branch.trim();
  if (!br) return b;
  return `${b} ${br}`;
}

function sanitizeGstinInput(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
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

  // Step 1: School Identity
  const [schoolName, setSchoolName] = useState('');
  const [confirmSchoolName, setConfirmSchoolName] = useState('');
  /** Optional campus / city for multi-branch chains (stored appended to school name only). */
  const [schoolBranch, setSchoolBranch] = useState('');

  // Step 2: School Details
  const [udiseCode, setUdiseCode] = useState('');
  const [boards, setBoards] = useState<string[]>([]);
  const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
  const boardDropdownRef = useRef<HTMLDivElement>(null);
  const [stateBoardState, setStateBoardState] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [referralSource, setReferralSource] = useState('');

  // Step 3: Registrant details + Point of Contact Emails
  const [registrantFirstName, setRegistrantFirstName] = useState('');
  const [registrantLastName, setRegistrantLastName] = useState('');
  const [registrantDesignation, setRegistrantDesignation] = useState('');
  const [registrantPhone, setRegistrantPhone] = useState('');
  const [emails, setEmails] = useState<string[]>(['']);

  // Step 4: Plan + payment intent (invoice / details sent later)
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [gstRegistrationStatus, setGstRegistrationStatus] = useState<GstRegistrationStatus>('');
  const [gstin, setGstin] = useState('');
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
    } else if (!partyNameCharsOk(trimmed)) {
      newErrors.schoolName = partyNameCharsError('School name');
    } else if (schoolBranch.trim() && !partyNameCharsOk(schoolBranch.trim())) {
      newErrors.schoolBranch = partyNameCharsError('Branch or campus');
    }
    if (!confirmSchoolName.trim()) {
      newErrors.confirmSchoolName = 'Please re-type your school name to confirm.';
    } else if (schoolName.trim() !== confirmSchoolName.trim()) {
      newErrors.confirmSchoolName =
        'School names do not match. Please type the name exactly as above.';
    }
    return newErrors;
  };

  // ── Step 2 ───────────────────────────────────────────────────────────────

  const getStep2Errors = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (boards.length === 0)
      newErrors.board = 'Please select at least one board / curriculum.';
    if (boards.includes('State Board') && !stateBoardState)
      newErrors.stateBoardState = 'Please select your state board.';
    const cityTrim = city.trim();
    if (!cityTrim) {
      newErrors.city = 'City is required.';
    } else if (cityTrim.length < RAZORPAY_CITY_MIN || cityTrim.length > RAZORPAY_CITY_MAX) {
      newErrors.city = `City must be ${RAZORPAY_CITY_MIN}-${RAZORPAY_CITY_MAX} characters.`;
    } else if (!cityOk(cityTrim)) {
      newErrors.city = 'City may only contain English letters and spaces.';
    }
    if (!addressState) {
      newErrors.addressState = 'Please select your state.';
    } else if (!stateOk(addressState)) {
      newErrors.addressState = `State must be ${RAZORPAY_STATE_MIN}-${RAZORPAY_STATE_MAX} English letters and spaces.`;
    }
    if (!referralSource) newErrors.referralSource = 'Please let us know how you heard about GYS.';
    return newErrors;
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
    if (!registrantFirstName.trim()) {
      newErrors.registrantFirstName = 'Please enter your first name.';
    }
    if (!registrantLastName.trim()) {
      newErrors.registrantLastName = 'Please enter your last name.';
    }
    if (!registrantDesignation.trim()) {
      newErrors.registrantDesignation = 'Please enter your designation.';
    }
    if (!registrantPhone.trim()) {
      newErrors.registrantPhone = 'Please enter your mobile number.';
    } else if (!isValidIndiaMobile(registrantPhone)) {
      newErrors.registrantPhone = 'Enter a valid 10-digit Indian mobile number starting with 6–9.';
    }
    const filled = emails.filter((e) => e.trim() !== '');
    if (filled.length === 0) {
      newErrors.emails = 'At least one point-of-contact email is required.';
    }
    emails.forEach((email, i) => {
      const trimmed = email.trim();
      if (!trimmed) return;
      if (!razorpayEmailOk(trimmed)) {
        const local = trimmed.split('@')[0] ?? '';
        newErrors[`email_${i}`] =
          local.length > RAZORPAY_EMAIL_LOCAL_MAX
            ? `Email username must be at most ${RAZORPAY_EMAIL_LOCAL_MAX} characters (payment partner limit).`
            : 'Please enter a valid email address.';
      }
    });
    const trimmed = filled.map((e) => e.trim().toLowerCase());
    if (new Set(trimmed).size !== trimmed.length)
      newErrors.emails = 'Please remove duplicate email addresses.';
    return newErrors;
  };

  // ── Step 4 ───────────────────────────────────────────────────────────────

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!gstRegistrationStatus) {
      newErrors.gstRegistrationStatus = 'Please select whether your institution is registered under Indian GST.';
    }
    if (gstRegistrationStatus === 'yes' && gstin.trim().length !== 15) {
      newErrors.gstin = 'GSTIN must be 15 characters.';
    }
    if (!commitToPay) {
      newErrors.commitToPay =
        'Please confirm that your institution intends to subscribe and will complete payment separately.';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      scrollToFirstError(newErrors, STEP4_FIELD_ORDER);
    }
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleNext = () => {
    if (currentStep === 1) {
      const stepErrors = getStep1Errors();
      if (Object.keys(stepErrors).length === 0) {
        setCurrentStep(2);
        return;
      }
      setErrors(stepErrors);
      scrollToFirstError(stepErrors, STEP1_FIELD_ORDER);
    } else if (currentStep === 2) {
      const stepErrors = getStep2Errors();
      if (Object.keys(stepErrors).length === 0) {
        setCurrentStep(3);
        return;
      }
      setErrors(stepErrors);
      scrollToFirstError(stepErrors, STEP2_FIELD_ORDER);
    } else if (currentStep === 3) {
      const stepErrors = getStep3Errors();
      if (Object.keys(stepErrors).length === 0) {
        setCurrentStep(4);
        return;
      }
      setErrors(stepErrors);
      const keys = Object.keys(stepErrors);
      const emailKey = keys.find((k) => k.startsWith('email_'));
      scrollToFirstError(
        stepErrors,
        emailKey ? ([...STEP3_FIELD_ORDER, emailKey] as string[]) : STEP3_FIELD_ORDER
      );
    }
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
        description: 'Fix the highlighted fields before submitting registration.',
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
    const validatedGstRegistrationStatus: 'yes' | 'no' | 'not_sure' =
      gstRegistrationStatus === '' ? 'not_sure' : gstRegistrationStatus;

    try {
      setIsSubmitting(true);
      const payload = {
        school_name: storedSchoolName,
        confirm_school_name: storedSchoolName,
        abbreviations: [],
        udise_code: udiseCode.trim(),
        boards,
        state_board_state: boards.includes('State Board') ? stateBoardState : '',
        city: city.trim(),
        state: addressState,
        referral_source: referralSource,
        registrant_first_name: registrantFirstName.trim(),
        registrant_last_name: registrantLastName.trim(),
        registrant_designation: registrantDesignation.trim(),
        poc_phone: withIndiaCountryCode(registrantPhone),
        contact_emails: filledEmails,
        selected_plan_id: selectedPlan,
        gst_registration_status: validatedGstRegistrationStatus,
        gstin: validatedGstRegistrationStatus === 'yes' ? gstin.trim().toUpperCase() : '',
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
  const institutionalCheckoutSummary = useMemo(
    () => schoolRegistrationCheckoutSummaryFromBaseInr(currentPlan.priceNum),
    [currentPlan.priceNum]
  );

  // ── Post-submit: registration complete (payment is a separate step) ────────

  if (submitted && registeredSchoolId) {
    const primaryEmail = registeredPocEmail ?? emails.find((e) => e.trim())?.trim().toLowerCase() ?? '';

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Header onBack={() => navigate('/for-schools')} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-md ring-1 ring-slate-100 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <span className="text-3xl" aria-hidden>
                ✓
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Registration complete</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Thank you. <span className="font-semibold">{storedSchoolName}</span> is registered for
              the <span className="font-semibold">{currentPlan.name}</span> plan (
              <span className="font-semibold">{institutionalCheckoutSummary.totalDisplay}</span>
              /yr).
            </p>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              A confirmation email has been sent to your point-of-contact address
              {primaryEmail ? (
                <>
                  {' '}
                  (<span className="font-semibold">{primaryEmail}</span>)
                </>
              ) : null}
              . It includes your registration summary and next steps.
            </p>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Payment can be completed by a different person — share the payment page with your
              accounts or finance team when ready.
            </p>
            <button
              type="button"
              onClick={() =>
                navigate('/for-schools/payment', {
                  state: {
                    registrationEmail: primaryEmail,
                    pocEmail: primaryEmail,
                    schoolId: registeredSchoolId,
                    checkoutSecret: registeredCheckoutSecret ?? undefined,
                    schoolName: storedSchoolName,
                    planName: currentPlan.name,
                    planPriceInr: currentPlan.priceNum,
                  },
                })
              }
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all duration-200"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Proceed to payment →
            </button>
            <button
              type="button"
              onClick={() => navigate('/for-schools')}
              className="mt-3 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition-all"
            >
              Back to For Schools
            </button>
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              Didn&apos;t get the email? Check spam, or write to{' '}
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
                    . English letters and spaces only; no commas or punctuation.{' '}
                    <span className="text-slate-400">
                      ({storedSchoolName.length}/{RAZORPAY_PARTY_NAME_MAX})
                    </span>
                  </p>
                  <input
                    type="text"
                    value={schoolName}
                    maxLength={RAZORPAY_PARTY_NAME_MAX}
                    onChange={(e) => { setSchoolName(sanitizePartyNameInput(e.target.value)); clearError('schoolName'); clearError('schoolBranch'); }}
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
                    onChange={(e) => { setConfirmSchoolName(sanitizePartyNameInput(e.target.value)); clearError('confirmSchoolName'); }}
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
                      setSchoolBranch(sanitizePartyNameInput(e.target.value));
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

          {/* ── STEP 2: School Details ──────────────────────────────────── */}
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

                {/* Board / Curriculum - dropdown + checkboxes (mobile-friendly) */}
                <div id="field-board" className="relative" ref={boardDropdownRef}>
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

                {/* Location */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div id="field-city">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700">
                      City<span className="text-red-500"> *</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(sanitizeLatinNameInput(e.target.value));
                        clearError('city');
                      }}
                      className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                        errors.city
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                          : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                      }`}
                      placeholder="City"
                      autoComplete="address-level2"
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div id="field-addressState">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700">
                      State / Union Territory<span className="text-red-500"> *</span>
                    </label>
                    <select
                      value={addressState}
                      onChange={(e) => {
                        setAddressState(e.target.value);
                        clearError('addressState');
                      }}
                      className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-1 ${
                        errors.addressState
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                          : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                      }`}
                      autoComplete="address-level1"
                      required
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

                {/* How did you hear about GYS */}
                <div id="field-referralSource">
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
                Tell us who is filling out this registration, then add{' '}
                <span className="font-semibold">1 - 5 email addresses</span> for school officials who
                should have access to your school's reports and data on the GYS portal.
              </p>

              <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <span className="font-semibold block mb-1">What these emails are for</span>
                  These can be a shared generic inbox that multiple senior school officials use
                  (e.g.{' '}
                  <span className="font-medium">principal@yourschool.edu.in</span>), or individual
                  addresses for the principal or administrator. Each address you add will be able to
                  use the school admin login flow: after registration is processed, they can sign in
                  with their school email and set a password to access your institution&apos;s dashboard and reports.
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div id="field-registrantFirstName">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    Your first name<span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="text"
                    value={registrantFirstName}
                    onChange={(e) => {
                      setRegistrantFirstName(e.target.value);
                      clearError('registrantFirstName');
                    }}
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                      errors.registrantFirstName
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                  {errors.registrantFirstName && (
                    <p className="mt-1 text-xs text-red-600">{errors.registrantFirstName}</p>
                  )}
                </div>

                <div id="field-registrantLastName">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    Your last name<span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="text"
                    value={registrantLastName}
                    onChange={(e) => {
                      setRegistrantLastName(e.target.value);
                      clearError('registrantLastName');
                    }}
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                      errors.registrantLastName
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                  {errors.registrantLastName && (
                    <p className="mt-1 text-xs text-red-600">{errors.registrantLastName}</p>
                  )}
                </div>

                <div id="field-registrantDesignation" className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    Your designation<span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="text"
                    value={registrantDesignation}
                    onChange={(e) => {
                      setRegistrantDesignation(e.target.value);
                      clearError('registrantDesignation');
                    }}
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                      errors.registrantDesignation
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                    placeholder="Principal, school administrator, coordinator, etc."
                    autoComplete="organization-title"
                  />
                  {errors.registrantDesignation && (
                    <p className="mt-1 text-xs text-red-600">{errors.registrantDesignation}</p>
                  )}
                </div>

                <div id="field-registrantPhone" className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    Your mobile number<span className="text-red-500"> *</span>
                  </label>
                  <div
                    className={`mt-1.5 flex w-full overflow-hidden rounded-lg border bg-white text-sm sm:text-base focus-within:outline-none focus-within:ring-1 ${
                      errors.registrantPhone
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
                      value={registrantPhone}
                      onChange={(e) => {
                        setRegistrantPhone(toIndiaMobileNationalDigits(e.target.value));
                        clearError('registrantPhone');
                      }}
                      className="w-full px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      placeholder="98765 43210"
                      autoComplete="tel-national"
                      maxLength={10}
                    />
                  </div>
                  {errors.registrantPhone && (
                    <p className="mt-1 text-xs text-red-600">{errors.registrantPhone}</p>
                  )}
                </div>
              </div>

              <div id="field-emails" className="mt-6 space-y-3">
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  School point-of-contact emails<span className="text-red-500"> *</span>
                </p>
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
                Choose the institutional package that fits your school. 
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
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
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                            <p className="mt-0.5 max-w-[12rem] text-xs leading-snug text-slate-500 sm:max-w-none">
                              {plan.tagline}
                            </p>
                            {isSelected && (
                              <ul className="mt-2 hidden space-y-0.5 sm:block">
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
                          className="shrink-0 text-right text-base font-bold leading-tight sm:text-lg"
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
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-slate-700">
                    {storedSchoolName} - {currentPlan.name} Plan
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
                  {city}, {addressState}
                </p>
                <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-2 text-sm">
                  <div className="flex justify-between gap-3 text-slate-700">
                    <span>Annual package fee</span>
                    <span className="font-medium tabular-nums">{institutionalCheckoutSummary.totalDisplay}</span>
                  </div>
                  <div className="flex justify-between gap-3 pt-1 text-sm font-semibold text-slate-900">
                    <span>Total due</span>
                    <span className="tabular-nums" style={{ color: GYS_BLUE }}>
                      {institutionalCheckoutSummary.totalDisplay}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div id="field-gstRegistrationStatus">
                  <label className="block text-xs sm:text-sm font-bold text-slate-700">
                    Are you registered under Indian GST?<span className="text-red-500"> *</span>
                  </label>
                  <select
                    value={gstRegistrationStatus}
                    onChange={(e) => {
                      const next = e.target.value as GstRegistrationStatus;
                      setGstRegistrationStatus(next);
                      if (next !== 'yes') setGstin('');
                      clearError('gstRegistrationStatus');
                      clearError('gstin');
                    }}
                    className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-1 ${
                      errors.gstRegistrationStatus
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                    }`}
                    required
                  >
                    <option value="">Select one</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="not_sure">Not sure</option>
                  </select>
                  {errors.gstRegistrationStatus && (
                    <p className="mt-1 text-xs text-red-600">{errors.gstRegistrationStatus}</p>
                  )}
                </div>

                {gstRegistrationStatus === 'yes' && (
                  <div id="field-gstin" className="mt-4">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700">
                      GSTIN<span className="text-red-500"> *</span>
                    </label>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Enter your institution's 15-character GST registration number.
                    </p>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => {
                        setGstin(sanitizeGstinInput(e.target.value));
                        clearError('gstin');
                      }}
                      className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm sm:text-base tracking-wide text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                        errors.gstin
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                          : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                      }`}
                      placeholder="15-Character GSTIN"
                      autoComplete="off"
                      maxLength={15}
                      required
                    />
                    {errors.gstin && (
                      <p className="mt-1 text-xs text-red-600">{errors.gstin}</p>
                    )}
                  </div>
                )}
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
                  selected above. Payment will be completed separately on the school payment page.
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

export default SchoolRegistrationPage;
