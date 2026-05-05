import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
  type User,
} from 'firebase/auth';
import * as Sentry from '@sentry/react';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { useStudentSignupExitGuard } from '../../hooks/useStudentSignupExitGuard';
import { clearSignupDraft, mergeSignupState, writeSignupDraft } from '../../utils/studentSignupDraft';
import StudentRegistrationRazorpayCheckout from '../../components/authentication/StudentRegistrationRazorpayCheckout';
import { auth, getAuthActionCodeSettings } from '../../firebase/firebase';
import { runSignUpTransaction } from '../../db/signupTransaction';
import { useToast } from '../../components/ui/use-toast';
import { LoadingSpinner as Spinner } from '../../components/ui/spinner';
import analytics from '../../segment/segment';

const GYS_BLUE = '#1e3a8a';

const studentSignupRazorpayDevBypassOn = ['true', '1', 'yes'].includes(
  (process.env.REACT_APP_DEV_BYPASS_STUDENT_RAZORPAY ?? '').trim().toLowerCase()
);

type MembershipLevelCode = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';

interface SignupFlowState {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  grade?: string;
  dob?: string;
  cityState?: string;
  schoolId?: string;
  /** Free-text school from step 2 when email did not match any school list (school_id is not-listed). */
  signupSchoolName?: string;
  homeLanguage?: string;
  aspiration?: string;
  heardFrom?: string;
  membershipLevel?: MembershipLevelCode;
  membershipName?: string;
  membershipPrice?: string;
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
  const state = (locationState || {}) as SignupFlowState;
  const { toast } = useToast();

  const membershipName = state.membershipName || 'Reasoning Triad';
  const membershipPrice = state.membershipPrice || '₹899';
  const membershipLevelCode = state.membershipLevel;
  const numericLevel = useMemo(
    () => membershipCodeToNumericLevel(membershipLevelCode),
    [membershipLevelCode]
  );

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useStudentSignupExitGuard(true);

  useEffect(() => {
    writeSignupDraft(mergeSignupState(locationState));
  }, [locationState]);

  const completeSignupAfterPayment = async (razorpayPaymentId: string) => {
    const {
      firstName,
      lastName,
      email,
      password,
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

    if (!email || !password || !firstName || !lastName || !grade || !schoolId || !numericLevel) {
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
    let createdUser: User | null = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      createdUser = userCredential.user;

      const membership_level = membershipCodeToNumericLevel(membershipLevel);
      if (!membership_level) {
        throw new Error('Invalid membership level');
      }

      await runSignUpTransaction({
        uid: userCredential.user.uid,
        first_name: firstName,
        last_name: lastName,
        email: normalizedEmail,
        school_id: schoolId,
        grade: numericGrade,
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        ...(dob && { date_of_birth: dob }),
        ...(cityState && { city_state: cityState }),
        ...(homeLanguage && { home_language: homeLanguage }),
        ...(aspiration && { aspiration }),
        ...(heardFrom && { heard_from: heardFrom }),
        ...(signupSchoolName?.trim() && { signup_school_name: signupSchoolName.trim() }),
        membership_level,
        razorpay_payment_id: razorpayPaymentId,
      });

      await sendEmailVerification(userCredential.user, getAuthActionCodeSettings());

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
        razorpay: true,
      });

      toast({
        variant: 'default',
        title: 'Account created successfully!',
        description: `Welcome to Argus, ${firstName}! A verification email has been sent to ${normalizedEmail}.`,
      });

      clearSignupDraft();
      navigate('/students/register/welcome', {
        state: {
          membershipName,
        },
      });
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };

      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (delErr) {
          Sentry.withScope((scope) => {
            scope.setTag('location', 'StudentPaymentPage.deleteUserAfterSignupFailure');
            Sentry.captureException(delErr);
          });
        }
      }

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
  if (!state.email || !state.password) {
    return <Navigate to="/students/register" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 bg-white/90 border-b border-gray-200 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() =>
              navigate('/students/register/membership', {
                state: mergeSignupState(location.state),
              })
            }
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

      <main className="mx-auto flex max-w-3xl flex-col px-4 pb-12 pt-6 sm:px-6">
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
        <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-md ring-1 ring-slate-100">
          <p className="text-sm sm:text-base font-semibold uppercase tracking-wide text-slate-500">
            Order summary
          </p>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 sm:px-7 sm:py-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base sm:text-xl font-semibold text-slate-900">{membershipName}</p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  {numericLevel === 1
                    ? 'One-time purchase (non-renewable) • Charged in INR (includes 18% GST at checkout)'
                    : 'Annual subscription • Charged in INR (includes 18% GST at checkout)'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-semibold" style={{ color: GYS_BLUE }}>
                  {membershipPrice}
                </p>
                <p className="text-xs text-slate-500 mt-1">+ GST in Razorpay total</p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-sm text-slate-600 leading-relaxed">
            Pay with Razorpay (UPI, cards, net banking). After payment succeeds, we create your account with the email
            you used in step 1: <span className="font-medium text-slate-800">{state.email}</span>
          </p>

          {isCreatingAccount ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-8">
              <Spinner />
              <p className="text-sm text-slate-600">Creating your account…</p>
            </div>
          ) : (
            <StudentRegistrationRazorpayCheckout
              email={state.email}
              membershipLevel={numericLevel}
              planLabel={membershipName}
              onPaymentVerified={completeSignupAfterPayment}
            />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-slate-200 pt-3 text-xs sm:text-sm text-slate-500">
            <span>🔒 SSL Encrypted</span>
            <span>🛡️ Razorpay Secure</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentPaymentPage;
