import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { useStudentSignupExitGuard } from '../../hooks/useStudentSignupExitGuard';
import { clearSignupDraft, mergeSignupState, writeSignupDraft } from '../../utils/studentSignupDraft';
import StudentRegistrationRazorpayCheckout from '../../components/authentication/StudentRegistrationRazorpayCheckout';
import { runSignUpTransaction } from '../../db/signupTransaction';
import { useToast } from '../../components/ui/use-toast';
import { LoadingSpinner as Spinner } from '../../components/ui/spinner';
import analytics from '../../segment/segment';
import { normalizeIndiaMobileE164 } from '../../utils/indiaMobile';
import {
  formatInrFromPaise,
  normalizeStudentMembershipLevel,
  STUDENT_SIGNUP_BASE_INR,
} from '../../utils/studentMembershipPricing';
import {
  cityOk,
  sanitizeLatinNameInput,
  sanitizeShipLineInput,
  shipLine1Ok,
  shipLine2Ok,
  shipLineCharsError,
  stateOk,
  RAZORPAY_CITY_MAX,
  RAZORPAY_CITY_MIN,
  RAZORPAY_SHIP_LINE1_MAX,
  RAZORPAY_SHIP_LINE1_MIN,
  RAZORPAY_SHIP_LINE2_MAX,
  RAZORPAY_SHIP_LINE2_MIN,
} from '../../utils/schoolRegistrationPaymentRules';

const GYS_BLUE = '#1e3a8a';
const STUDENT_SIGNUP_GST_RATE = 0.18;

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

const studentSignupRazorpayDevBypassOn = ['true', '1', 'yes'].includes(
  (process.env.REACT_APP_DEV_BYPASS_STUDENT_RAZORPAY ?? '').trim().toLowerCase()
);

type MembershipLevelCode = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';

interface SignupFlowState {
  firstName?: string;
  lastName?: string;
  email?: string;
  grade?: string;
  dob?: string;
  cityState?: string;
  schoolId?: string;
  schoolName?: string;
  /** Free-text school from step 2 when email did not match any school list (school_id is not-listed). */
  signupSchoolName?: string;
  homeLanguage?: string;
  aspiration?: string;
  heardFrom?: string;
  membershipLevel?: MembershipLevelCode;
  membershipName?: string;
  membershipPrice?: string;
  schoolCoveredMembershipLevel?: number;
  membershipCoveredBySchool?: boolean;
  membershipUpgradeAmountPaise?: number | null;
  billingPhone?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
}

type BillingDetails = {
  billingPhone: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
};

type BillingErrors = Partial<Record<keyof BillingDetails, string>>;

function membershipCodeToNumericLevel(code: MembershipLevelCode | undefined): 1 | 2 | 3 | 4 | null {
  if (code === 'LEVEL_1') return 1;
  if (code === 'LEVEL_2') return 2;
  if (code === 'LEVEL_3') return 3;
  if (code === 'LEVEL_4') return 4;
  return null;
}

function FormFieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{children}</p>;
}

function FormFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
      {message}
    </p>
  );
}

function billingInputClass(hasError: boolean, extra = ''): string {
  return [
    'mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1',
    hasError
      ? 'border-red-400 bg-red-50/50 focus:border-red-400 focus:ring-red-300'
      : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

function getBillingErrors(details: BillingDetails): BillingErrors {
  const errors: BillingErrors = {};
  const normalizedPhone = normalizeIndiaMobileE164(details.billingPhone);
  const line1 = details.billingAddressLine1.trim();
  const line2 = details.billingAddressLine2.trim();
  const city = details.billingCity.trim();
  const state = details.billingState.trim();
  const postalCode = details.billingPostalCode.trim();

  if (!normalizedPhone) {
    errors.billingPhone = 'Enter a valid India mobile number: 10 digits starting with 6-9, or +91 followed by 10 digits.';
  }
  if (!line1) {
    errors.billingAddressLine1 = 'Address line 1 is required.';
  } else if (!shipLine1Ok(line1)) {
    errors.billingAddressLine1 =
      line1.length < RAZORPAY_SHIP_LINE1_MIN || line1.length > RAZORPAY_SHIP_LINE1_MAX
        ? `Address line 1 must be ${RAZORPAY_SHIP_LINE1_MIN}-${RAZORPAY_SHIP_LINE1_MAX} characters.`
        : shipLineCharsError('Address line 1');
  }
  if (line2 && !shipLine2Ok(line2)) {
    errors.billingAddressLine2 =
      line2.length < RAZORPAY_SHIP_LINE2_MIN || line2.length > RAZORPAY_SHIP_LINE2_MAX
        ? `Address line 2 must be ${RAZORPAY_SHIP_LINE2_MIN}-${RAZORPAY_SHIP_LINE2_MAX} characters when provided.`
        : shipLineCharsError('Address line 2');
  }
  if (!city) {
    errors.billingCity = 'City is required.';
  } else if (!cityOk(city)) {
    errors.billingCity =
      city.length < RAZORPAY_CITY_MIN || city.length > RAZORPAY_CITY_MAX
        ? `City must be ${RAZORPAY_CITY_MIN}-${RAZORPAY_CITY_MAX} characters.`
        : 'City may only contain English letters and spaces.';
  }
  if (!state || !INDIAN_STATES.includes(state) || !stateOk(state)) {
    errors.billingState = 'Select the full Indian state or union territory name.';
  }
  if (!postalCode) {
    errors.billingPostalCode = 'PIN code is required.';
  } else if (!/^[1-9]\d{5}$/.test(postalCode)) {
    errors.billingPostalCode = 'PIN code must be 6 digits and cannot start with 0.';
  }

  return errors;
}

const StudentPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state;
  const state = useMemo(() => mergeSignupState(locationState) as SignupFlowState, [locationState]);
  const { toast } = useToast();

  const membershipName = state.membershipName || 'Reasoning Triad';
  const membershipPrice = state.membershipPrice || '₹899';
  const membershipLevelCode = state.membershipLevel;
  const schoolCoveredLevel = normalizeStudentMembershipLevel(state.schoolCoveredMembershipLevel);
  const numericLevel = useMemo(
    () => membershipCodeToNumericLevel(membershipLevelCode),
    [membershipLevelCode]
  );
  const coveredBySchool =
    Boolean(numericLevel) &&
    state.membershipCoveredBySchool === true &&
    schoolCoveredLevel >= (numericLevel ?? 0);
  const upgradeAmountDisplay =
    typeof state.membershipUpgradeAmountPaise === 'number'
      ? formatInrFromPaise(state.membershipUpgradeAmountPaise)
      : null;
  const taxableAmountPaise =
    !coveredBySchool && numericLevel
      ? (typeof state.membershipUpgradeAmountPaise === 'number'
        ? state.membershipUpgradeAmountPaise
        : STUDENT_SIGNUP_BASE_INR[numericLevel] * 100)
      : null;
  const gstAmountPaise =
    taxableAmountPaise != null ? Math.round(taxableAmountPaise * STUDENT_SIGNUP_GST_RATE) : null;
  const totalAmountPaise =
    taxableAmountPaise != null && gstAmountPaise != null ? taxableAmountPaise + gstAmountPaise : null;

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    billingPhone: state.billingPhone || '',
    billingAddressLine1: state.billingAddressLine1 || '',
    billingAddressLine2: state.billingAddressLine2 || '',
    billingCity: state.billingCity || '',
    billingState: state.billingState || '',
    billingPostalCode: state.billingPostalCode || '',
  });

  useStudentSignupExitGuard(true);

  useEffect(() => {
    writeSignupDraft(mergeSignupState(locationState));
  }, [locationState]);

  useEffect(() => {
    setBillingDetails({
      billingPhone: state.billingPhone || '',
      billingAddressLine1: state.billingAddressLine1 || '',
      billingAddressLine2: state.billingAddressLine2 || '',
      billingCity: state.billingCity || '',
      billingState: state.billingState || '',
      billingPostalCode: state.billingPostalCode || '',
    });
  }, [
    state.billingPhone,
    state.billingAddressLine1,
    state.billingAddressLine2,
    state.billingCity,
    state.billingState,
    state.billingPostalCode,
  ]);

  const updateBillingDetails =
    (field: keyof BillingDetails) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setBillingDetails((prev) => ({ ...prev, [field]: value }));
        writeSignupDraft({ [field]: value });
      };

  const updateBillingState = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setBillingDetails((prev) => ({ ...prev, billingState: value }));
    writeSignupDraft({ billingState: value });
  };

  const updateBillingAddressLine =
    (field: 'billingAddressLine1' | 'billingAddressLine2') =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = sanitizeShipLineInput(event.target.value);
        setBillingDetails((prev) => ({ ...prev, [field]: value }));
        writeSignupDraft({ [field]: value });
      };

  const updateBillingCity = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeLatinNameInput(event.target.value);
    setBillingDetails((prev) => ({ ...prev, billingCity: value }));
    writeSignupDraft({ billingCity: value });
  };

  const updateBillingPostalCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6);
    setBillingDetails((prev) => ({ ...prev, billingPostalCode: value }));
    writeSignupDraft({ billingPostalCode: value });
  };

  const completeSignupAfterPayment = async (razorpayPaymentId?: string) => {
    const {
      firstName,
      lastName,
      email,
      grade,
      dob,
      cityState,
      schoolId,
      signupSchoolName,
      homeLanguage,
      aspiration,
      heardFrom,
      membershipLevel,
    } = state;

    if (!email || !firstName || !lastName || !grade || !schoolId || !numericLevel) {
      toast({
        variant: 'destructive',
        title: 'Session expired',
        description: 'Please start registration again from step 1.',
      });
      navigate('/students/register');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const numericGrade = parseInt(grade, 10);
    if (Number.isNaN(numericGrade)) {
      toast({
        variant: 'destructive',
        title: 'Invalid grade',
        description: 'Please go back and correct your grade.',
      });
      navigate('/students/register');
      return;
    }

    setIsCreatingAccount(true);

    try {
      const membership_level = membershipCodeToNumericLevel(membershipLevel);
      if (!membership_level) {
        throw new Error('Invalid membership level');
      }

      await runSignUpTransaction({
        first_name: firstName,
        last_name: lastName,
        email: normalizedEmail,
        school_id: schoolId,
        grade: numericGrade,
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        ...(!coveredBySchool && {
          phone_number: normalizeIndiaMobileE164(billingDetails.billingPhone) || billingDetails.billingPhone.trim(),
        }),
        ...(dob && { date_of_birth: dob }),
        ...(cityState && { city_state: cityState }),
        ...(homeLanguage && { home_language: homeLanguage }),
        ...(aspiration && { aspiration }),
        ...(heardFrom && { heard_from: heardFrom }),
        ...(signupSchoolName?.trim() && { signup_school_name: signupSchoolName.trim() }),
        membership_level,
        ...(razorpayPaymentId && { razorpay_payment_id: razorpayPaymentId }),
      });

      analytics.track('[CREATE] New User Added', {
        email: normalizedEmail,
        first_name: firstName,
        last_name: lastName,
        school_id: schoolId,
        grade: numericGrade,
        homeLanguage,
        aspiration,
        heardFrom,
        membershipLevel: membershipLevel ?? null,
        razorpay: Boolean(razorpayPaymentId),
        schoolCovered: !razorpayPaymentId,
      });

      toast({
        variant: 'default',
        title: 'Account created successfully!',
        description: `Welcome to Argus, ${firstName}! A password setup email has been sent to ${normalizedEmail}.`,
      });

      clearSignupDraft();
      navigate('/students/register/welcome', {
        state: {
          membershipName,
        },
      });
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };

      if (err?.code === 'auth/email-already-in-use') {
        navigate('/students/register', {
          state: {
            prefill: {
              firstName,
              lastName,
              email: state.email,
              grade,
              dob,
              cityState,
            },
            emailInUse: true,
          },
        });
        return;
      }

      Sentry.withScope((scope) => {
        scope.setTag('location', 'StudentPaymentPage.completeSignupAfterPayment');
        scope.setExtra('email', normalizedEmail);
        scope.setExtra('schoolId', schoolId);
        Sentry.captureException(error);
      });

      toast({
        variant: 'destructive',
        title: 'Could not complete signup',
        description: err?.message || 'Something went wrong. If you were charged, contact support with your payment id.',
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (!numericLevel) {
    return <Navigate to="/students/register/membership" replace state={location.state} />;
  }
  if (!state.email) {
    return <Navigate to="/students/register" replace />;
  }

  const signupState = mergeSignupState(location.state);
  const studentName = [state.firstName, state.lastName].filter(Boolean).join(' ') || 'Not provided';
  const normalizedBillingPhone = normalizeIndiaMobileE164(billingDetails.billingPhone);
  const billingErrors = getBillingErrors(billingDetails);
  const billingReady = coveredBySchool || Object.keys(billingErrors).length === 0;
  const razorpayBillingDetails = {
    contact: normalizedBillingPhone || '',
    line1: billingDetails.billingAddressLine1.trim(),
    line2: billingDetails.billingAddressLine2.trim(),
    city: billingDetails.billingCity.trim(),
    state: billingDetails.billingState.trim(),
    zipcode: billingDetails.billingPostalCode.trim(),
    country: 'IND' as const,
  };
  const schoolName =
    state.schoolName || state.signupSchoolName || (state.schoolId === 'not-listed' ? 'Not listed' : 'Matched school');
  const heardFromLabel: Record<string, string> = {
    SCHOOL: 'My school',
    FRIEND_FAMILY: 'Friend or family',
    ACCESS_USA: 'Access USA',
    EDUCATIONWORLD: 'EducationWorld',
    SOCIAL_MEDIA: 'Social media',
    OTHER: 'Other',
  };

  const goEditAccountStep = () => {
    navigate('/students/register', {
      state: {
        ...signupState,
        prefill: {
          firstName: state.firstName,
          lastName: state.lastName,
          email: state.email,
          grade: state.grade,
        },
      },
    });
  };

  const goEditSchoolStep = () => {
    navigate('/students/register/school', {
      state: signupState,
    });
  };

  const goBackToMembershipStep = () => {
    navigate('/students/register/membership', {
      state: signupState,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 bg-white/90 border-b border-gray-200 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={goBackToMembershipStep}
            className="group flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors duration-200 hover:bg-slate-100 rounded-lg px-1 py-0.5 -ml-1"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs transition-all duration-200 group-hover:border-slate-400">
              ←
            </span>
            <span className="hidden xs:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: GYS_BLUE }}
            >
              GYS
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 tracking-tight">Global Young Scholar</h1>
              <p className="text-xs text-gray-500">Powered by Argus, Access USA, EducationWorld</p>
            </div>
          </div>

          <div className="flex shrink-0 justify-end">
            <PublicHomeNavButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col px-4 pb-12 pt-6 sm:px-6">
        {studentSignupRazorpayDevBypassOn ? (
          <div
            className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <strong className="font-semibold">Dev mode:</strong> Razorpay is bypassed for student signup. Turn off{' '}
            <code className="rounded bg-amber-100/80 px-1">REACT_APP_DEV_BYPASS_STUDENT_RAZORPAY</code> (frontend) and{' '}
            <code className="rounded bg-amber-100/80 px-1">DEV_BYPASS_RAZORPAY_STUDENT_SIGNUP</code> (functions{' '}
            <code className="rounded bg-amber-100/80 px-1">.env</code>) to test real checkout with Razorpay.
          </div>
        ) : null}
        <section className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-5 border-b border-slate-100 pb-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                  Review your details
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Check everything before we create your account.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{studentName}</p>
                    <p className="text-xs text-slate-600">
                      {state.email} · Grade {state.grade || 'not provided'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={goEditAccountStep}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      School
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{schoolName}</p>
                    <p className="text-xs text-slate-600">
                      Heard from: {state.heardFrom ? heardFromLabel[state.heardFrom] || state.heardFrom : 'Not selected'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={goEditSchoolStep}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Package
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{membershipName}</p>
                    <p className="text-xs text-slate-600">
                      {coveredBySchool ? 'Included by your school' : 'Payment required'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={goBackToMembershipStep}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Order summary
          </p>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{membershipName}</p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  {coveredBySchool
                    ? 'School-covered package • No payment due'
                    : upgradeAmountDisplay
                      ? 'School-covered upgrade • Pay only the difference'
                      : numericLevel === 1
                        ? 'One-time purchase (non-renewable)'
                        : 'Annual subscription'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold" style={{ color: GYS_BLUE }}>
                  {coveredBySchool
                    ? 'Included'
                    : totalAmountPaise != null
                      ? formatInrFromPaise(totalAmountPaise)
                      : upgradeAmountDisplay ?? membershipPrice}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {coveredBySchool
                    ? 'Paid by your school'
                    : 'Total incl. GST'}
                </p>
              </div>
            </div>
            {taxableAmountPaise != null && gstAmountPaise != null && totalAmountPaise != null && (
              <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-xs text-slate-600">
                <div className="flex justify-between gap-3">
                  <span>{upgradeAmountDisplay ? 'Upgrade amount' : 'Amount'} before GST</span>
                  <span className="font-medium tabular-nums text-slate-800">
                    {formatInrFromPaise(taxableAmountPaise)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>GST @ {Math.round(STUDENT_SIGNUP_GST_RATE * 100)}%</span>
                  <span className="font-medium tabular-nums text-slate-800">
                    {formatInrFromPaise(gstAmountPaise)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 border-t border-slate-200 pt-1.5 font-semibold text-slate-900">
                  <span>Total due</span>
                  <span className="tabular-nums" style={{ color: GYS_BLUE }}>
                    {formatInrFromPaise(totalAmountPaise)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!coveredBySchool && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Billing details
                </p>
             
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Mobile number<span className="text-red-500"> *</span>
                  </label>
                  <FormFieldHint>
                    10-digit India mobile number starting with 6-9, or +91 followed by 10 digits.
                  </FormFieldHint>
                  <input
                    type="tel"
                    value={billingDetails.billingPhone}
                    onChange={updateBillingDetails('billingPhone')}
                    aria-invalid={Boolean(billingDetails.billingPhone && billingErrors.billingPhone)}
                    className={billingInputClass(Boolean(billingDetails.billingPhone && billingErrors.billingPhone))}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                    required
                  />
                  <FormFieldError message={billingDetails.billingPhone ? billingErrors.billingPhone : undefined} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Address line 1<span className="text-red-500"> *</span>
                  </label>
                  <FormFieldHint>
                    {RAZORPAY_SHIP_LINE1_MIN}-{RAZORPAY_SHIP_LINE1_MAX} characters. English letters,
                    numbers, spaces, and standard symbols only.
                  </FormFieldHint>
                  <input
                    type="text"
                    value={billingDetails.billingAddressLine1}
                    maxLength={RAZORPAY_SHIP_LINE1_MAX}
                    aria-invalid={Boolean(billingDetails.billingAddressLine1 && billingErrors.billingAddressLine1)}
                    onChange={updateBillingAddressLine('billingAddressLine1')}
                    className={billingInputClass(Boolean(billingDetails.billingAddressLine1 && billingErrors.billingAddressLine1))}
                    placeholder="House / apartment, street"
                    autoComplete="address-line1"
                    required
                  />
                  <FormFieldError
                    message={billingDetails.billingAddressLine1 ? billingErrors.billingAddressLine1 : undefined}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Address line 2
                  </label>
                  <FormFieldHint>
                    Optional. If filled: {RAZORPAY_SHIP_LINE2_MIN}-{RAZORPAY_SHIP_LINE2_MAX} characters,
                    same character rules as line 1: English letters, numbers, spaces, and standard punctuation.
                  </FormFieldHint>
                  <input
                    type="text"
                    value={billingDetails.billingAddressLine2}
                    maxLength={RAZORPAY_SHIP_LINE2_MAX}
                    aria-invalid={Boolean(billingDetails.billingAddressLine2 && billingErrors.billingAddressLine2)}
                    onChange={updateBillingAddressLine('billingAddressLine2')}
                    className={billingInputClass(Boolean(billingDetails.billingAddressLine2 && billingErrors.billingAddressLine2))}
                    placeholder="Area / landmark"
                    autoComplete="address-line2"
                  />
                  <FormFieldError
                    message={billingDetails.billingAddressLine2 ? billingErrors.billingAddressLine2 : undefined}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      City<span className="text-red-500"> *</span>
                    </label>
                    <FormFieldHint>
                      {RAZORPAY_CITY_MIN}-{RAZORPAY_CITY_MAX} characters. English letters and spaces only.
                    </FormFieldHint>
                    <input
                      type="text"
                      value={billingDetails.billingCity}
                      minLength={RAZORPAY_CITY_MIN}
                      maxLength={RAZORPAY_CITY_MAX}
                      aria-invalid={Boolean(billingDetails.billingCity && billingErrors.billingCity)}
                      onChange={updateBillingCity}
                      className={billingInputClass(Boolean(billingDetails.billingCity && billingErrors.billingCity))}
                      placeholder="Bengaluru"
                      autoComplete="address-level2"
                      required
                    />
                    <FormFieldError message={billingDetails.billingCity ? billingErrors.billingCity : undefined} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      State<span className="text-red-500"> *</span>
                    </label>
                    <FormFieldHint>Select the full Indian state or union territory name.</FormFieldHint>
                    <select
                      value={billingDetails.billingState}
                      aria-invalid={Boolean(billingDetails.billingState && billingErrors.billingState)}
                      onChange={updateBillingState}
                      className={billingInputClass(Boolean(billingDetails.billingState && billingErrors.billingState))}
                      autoComplete="address-level1"
                      required
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((stateName) => (
                        <option key={stateName} value={stateName}>
                          {stateName}
                        </option>
                      ))}
                    </select>
                    <FormFieldError message={billingDetails.billingState ? billingErrors.billingState : undefined} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Country</label>
                  <FormFieldHint>India - required by Razorpay for this checkout.</FormFieldHint>
                  <input
                    type="text"
                    value="India"
                    readOnly
                    disabled
                    aria-label="Country - India only"
                    className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    PIN code<span className="text-red-500"> *</span>
                  </label>
                  <FormFieldHint>Exactly 6 digits (Indian PIN code).</FormFieldHint>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={billingDetails.billingPostalCode}
                    maxLength={6}
                    aria-invalid={Boolean(billingDetails.billingPostalCode && billingErrors.billingPostalCode)}
                    onChange={updateBillingPostalCode}
                    className={billingInputClass(Boolean(billingDetails.billingPostalCode && billingErrors.billingPostalCode))}
                    placeholder="560001"
                    autoComplete="postal-code"
                    required
                  />
                  <FormFieldError
                    message={billingDetails.billingPostalCode ? billingErrors.billingPostalCode : undefined}
                  />
                </div>
              </div>
            </div>
          )}

          {isCreatingAccount ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-8">
              <Spinner />
              <p className="text-sm text-slate-600">Creating your account…</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={goBackToMembershipStep}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.99]"
              >
                ← Back
              </button>
              {coveredBySchool ? (
                <button
                  type="button"
                  onClick={() => void completeSignupAfterPayment()}
                  className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
                  style={{ backgroundColor: GYS_BLUE }}
                >
                  Continue to account →
                </button>
              ) : (
                <StudentRegistrationRazorpayCheckout
                  email={state.email}
                  studentName={studentName}
                  membershipLevel={numericLevel}
                  planLabel={upgradeAmountDisplay ? `${membershipName} upgrade` : membershipName}
                  schoolId={state.schoolId}
                  billingDetails={razorpayBillingDetails}
                  disabled={!billingReady}
                  onPaymentVerified={completeSignupAfterPayment}
                />
              )}
            </div>
          )}

          {!coveredBySchool && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-slate-200 pt-3 text-xs sm:text-sm text-slate-500">
              <span>🔒 SSL Encrypted</span>
              <span>🛡️ Razorpay Secure</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default StudentPaymentPage;
