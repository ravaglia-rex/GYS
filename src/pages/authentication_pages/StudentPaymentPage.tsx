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

const GYS_BLUE = '#1e3a8a';
const STUDENT_SIGNUP_GST_RATE = 0.18;

type MembershipLevelCode = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';

interface SignupFlowState {
  firstName?: string;
  lastName?: string;
  email?: string;
  whatsappPhone?: string;
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
}

function membershipCodeToNumericLevel(code: MembershipLevelCode | undefined): 1 | 2 | 3 | 4 | null {
  if (code === 'LEVEL_1') return 1;
  if (code === 'LEVEL_2') return 2;
  if (code === 'LEVEL_3') return 3;
  if (code === 'LEVEL_4') return 4;
  return null;
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

  useStudentSignupExitGuard(true);

  useEffect(() => {
    writeSignupDraft(mergeSignupState(locationState));
  }, [locationState]);

  const completeSignupAfterPayment = async (razorpayPaymentId?: string) => {
    const {
      firstName,
      lastName,
      email,
      whatsappPhone,
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

    if (!email || !firstName || !lastName || !whatsappPhone || !grade || !schoolId || !numericLevel) {
      toast({
        variant: 'destructive',
        title: 'Session expired',
        description: 'Please start registration again from step 1.',
      });
      navigate('/students/register');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedWhatsappPhone = normalizeIndiaMobileE164(whatsappPhone);
    if (!normalizedWhatsappPhone) {
      toast({
        variant: 'destructive',
        title: 'Invalid WhatsApp number',
        description: 'Please go back and enter a valid India WhatsApp number.',
      });
      navigate('/students/register');
      return;
    }
    const numericGrade = parseInt(grade, 10);
    if (Number.isNaN(numericGrade)) {
      toast({
        variant: 'destructive',
        title: 'Invalid class',
        description: 'Please go back and correct your class.',
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
        phone_number: normalizedWhatsappPhone,
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
        description: `Welcome to Argus, ${firstName}! A password setup email has been sent to ${normalizedEmail}. Please check your spam folder and mark the email as not spam if it lands there.`,
      });

      clearSignupDraft();
      navigate('/students/register/welcome', {
        state: {
          membershipName,
        },
      });
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const errMessage = typeof err?.message === 'string' ? err.message : '';

      if (err?.code === 'auth/email-already-in-use') {
        navigate('/students/register', {
          state: {
            prefill: {
              firstName,
              lastName,
              email: state.email,
              whatsappPhone,
              grade,
              dob,
              cityState,
            },
            emailInUse: true,
          },
        });
        return;
      }

      if (
        /already exists/i.test(errMessage) ||
        /already registered/i.test(errMessage)
      ) {
        toast({
          variant: 'destructive',
          title: 'Email already registered',
          description: 'This email already has a student account. Log in or use a different email.',
        });
        navigate('/students/register', {
          state: {
            prefill: { email: normalizedEmail },
            emailInUse: true,
          },
        });
        return;
      }

      if (/payment for this signup is already recorded/i.test(errMessage)) {
        toast({
          variant: 'default',
          title: 'Signup already completed',
          description: 'Your payment was recorded. Log in to access your account.',
        });
        clearSignupDraft();
        navigate('/login');
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

  const completePaidSignupAfterPayment = async (razorpayPaymentId: string) => {
    analytics.track('[CREATE] New User Added', {
      email: state.email?.trim().toLowerCase(),
      first_name: state.firstName,
      last_name: state.lastName,
      school_id: state.schoolId,
      grade: state.grade ? parseInt(state.grade, 10) : null,
      homeLanguage: state.homeLanguage,
      aspiration: state.aspiration,
      heardFrom: state.heardFrom,
      membershipLevel: state.membershipLevel ?? null,
      razorpay: true,
      razorpayPaymentId,
      schoolCovered: false,
    });

    toast({
      variant: 'default',
      title: 'Account created successfully!',
      description: `Welcome to Argus, ${state.firstName}! A password setup email has been sent to ${state.email}. Please check your spam folder and mark the email as not spam if it lands there.`,
    });

    clearSignupDraft();
    navigate('/students/register/welcome', {
      state: {
        membershipName,
      },
    });
  };

  if (!numericLevel) {
    return <Navigate to="/students/register/membership" replace state={location.state} />;
  }
  if (!state.email) {
    return <Navigate to="/students/register" replace />;
  }

  const signupState = mergeSignupState(location.state);
  const studentName = [state.firstName, state.lastName].filter(Boolean).join(' ') || 'Not provided';
  const normalizedWhatsappPhoneForPayload = normalizeIndiaMobileE164(state.whatsappPhone || '') || '';
  const signupStudentPayload = {
    first_name: state.firstName || '',
    last_name: state.lastName || '',
    email: (state.email || '').trim().toLowerCase(),
    school_id: state.schoolId || '',
    grade: state.grade ? parseInt(state.grade, 10) : 0,
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    phone_number: normalizedWhatsappPhoneForPayload,
    ...(state.dob && { date_of_birth: state.dob }),
    ...(state.cityState && { city_state: state.cityState }),
    ...(state.homeLanguage && { home_language: state.homeLanguage }),
    ...(state.aspiration && { aspiration: state.aspiration }),
    ...(state.heardFrom && { heard_from: state.heardFrom }),
    ...(state.signupSchoolName?.trim() && { signup_school_name: state.signupSchoolName.trim() }),
    membership_level: numericLevel,
  };
  const normalizedRazorpayContact =
    normalizeIndiaMobileE164(state.billingPhone || state.whatsappPhone || '') || '';
  const razorpayBillingDetails = {
    ...(normalizedRazorpayContact ? { contact: normalizedRazorpayContact } : {}),
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
          whatsappPhone: state.whatsappPhone,
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
            <span className="inline">Back</span>
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
              <p className="hidden text-xs text-gray-500 sm:block">Powered by Argus, Access&nbsp;USA, EducationWorld</p>
            </div>
          </div>

          <div className="flex shrink-0 justify-end">
            <PublicHomeNavButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col px-4 pb-12 pt-6 sm:px-6">
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
                      {state.email} · Class {state.grade || 'not provided'}
                    </p>
                    <p className="text-xs text-slate-600">
                      WhatsApp: {state.whatsappPhone || 'not provided'}
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
                  student={signupStudentPayload}
                  membershipLevel={numericLevel}
                  planLabel={upgradeAmountDisplay ? `${membershipName} upgrade` : membershipName}
                  billingDetails={razorpayBillingDetails}
                  onPaymentVerified={completePaidSignupAfterPayment}
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
