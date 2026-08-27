import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { checkEmailExists } from '../../db/emailMappingCollection';
import { auth } from '../../firebase/firebase';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { useStudentSignupExit } from '../../contexts/StudentSignupExitContext';
import { useStudentSignupExitGuard } from '../../hooks/useStudentSignupExitGuard';
import { mergeSignupState, writeSignupDraft } from '../../utils/studentSignupDraft';
import { normalizeIndiaMobileE164 } from '../../utils/indiaMobile';
import {
  normalizeStudentSection,
  STUDENT_SECTION_OTHER,
  STUDENT_SECTION_PRESETS,
  studentSectionFromUi,
  studentSectionToUi,
  type StudentSectionUiChoice,
} from '../../utils/studentSection';
import SignupSelect from '../../components/authentication/SignupSelect';

const GYS_BLUE = '#1e3a8a';

function toIndiaMobileLocalDigits(raw: unknown): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length >= 12) return digits.slice(2, 12);
  if (digits.startsWith('0') && digits.length >= 11) return digits.slice(1, 11);
  return digits.slice(0, 10);
}

function inviteEmailFromSearchParams(searchParams: URLSearchParams): string {
  const raw = searchParams.get('email');
  if (!raw) return '';
  try {
    return decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

const StudentRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = (location.state || {}) as any;
  const inviteEmail = useMemo(
    () => inviteEmailFromSearchParams(searchParams),
    [searchParams]
  );

  const regInitial = useMemo(() => {
    const m = mergeSignupState(location.state) as Record<string, unknown>;
    const p = (m.prefill || {}) as Record<string, unknown>;
    // Invite-link ?email= wins so roster email cannot be overwritten by a stale draft typo.
    const emailFromState = String(m.email ?? p.email ?? '');
    const lockedFromState = m.emailLockedFromInvite === true;
    return {
      firstName: String(m.firstName ?? p.firstName ?? ''),
      lastName: String(m.lastName ?? p.lastName ?? ''),
      email: inviteEmail || emailFromState,
      emailLockedFromInvite: Boolean(inviteEmail) || lockedFromState,
      whatsappPhone: toIndiaMobileLocalDigits(m.whatsappPhone ?? p.whatsappPhone),
      grade: String(m.grade ?? p.grade ?? ''),
      section: normalizeStudentSection(m.section ?? p.section),
    };
  }, [location.state, inviteEmail]);

  const emailLockedFromInvite = regInitial.emailLockedFromInvite;

  const [firstName, setFirstName] = useState(regInitial.firstName);
  const [lastName, setLastName] = useState(regInitial.lastName);
  const [email, setEmail] = useState(regInitial.email);
  const [whatsappPhone, setWhatsappPhone] = useState(regInitial.whatsappPhone);
  const [grade, setGrade] = useState(regInitial.grade);
  const [sectionChoice, setSectionChoice] = useState<StudentSectionUiChoice>(
    () => studentSectionToUi(regInitial.section).choice
  );
  const [sectionOther, setSectionOther] = useState(
    () => studentSectionToUi(regInitial.section).otherText
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [whatsappPhoneError, setWhatsappPhoneError] = useState('');

  useEffect(() => {
    setFirstName(regInitial.firstName);
    setLastName(regInitial.lastName);
    setEmail(regInitial.email);
    setWhatsappPhone(regInitial.whatsappPhone);
    setGrade(regInitial.grade);
    const ui = studentSectionToUi(regInitial.section);
    setSectionChoice(ui.choice);
    setSectionOther(ui.otherText);
  }, [
    location.key,
    regInitial.firstName,
    regInitial.lastName,
    regInitial.email,
    regInitial.whatsappPhone,
    regInitial.grade,
    regInitial.section,
  ]);
  const [emailInUseOpen, setEmailInUseOpen] = useState<boolean>(!!locationState?.emailInUse);
  /** Which check blocked signup production Auth/Firestore are used even when the API runs on localhost. */
  const [emailInUseReason, setEmailInUseReason] = useState<
    'auth' | 'student' | 'schooladmin' | null
  >(() => (locationState?.emailInUse ? 'auth' : null));

  const { requestLeave } = useStudentSignupExit();

  useStudentSignupExitGuard(true);

  useEffect(() => {
    if (locationState?.emailInUse) {
      window.history.replaceState({}, document.title);
    }
  }, [locationState?.emailInUse]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!acceptedTerms) return;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedWhatsappPhone = normalizeIndiaMobileE164(`+91${whatsappPhone}`);
    if (!normalizedWhatsappPhone) {
      setWhatsappPhoneError('Enter a valid 10-digit India WhatsApp number starting with 6-9.');
      return;
    }
    setWhatsappPhoneError('');

    setIsContinuing(true);
    let didNavigate = false;

    try {
      let blockReason: 'auth' | 'student' | 'schooladmin' | null = null;

      const emailCheck = await checkEmailExists(normalizedEmail);
      if (emailCheck.exists && emailCheck.registrationStatus !== 'pending_payment') {
        blockReason = emailCheck.type === 'schooladmin' ? 'schooladmin' : 'student';
      }

      // A pending paid signup owns a Firebase Auth user before payment completes.
      // Let that email continue the register flow so users can finish checkout.
      if (!blockReason && emailCheck.registrationStatus !== 'pending_payment') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
          if (methods && methods.length > 0) {
            blockReason = 'auth';
          }
        } catch {
          // ignore and fall back to API check
        }
      }

      if (blockReason) {
        setEmailInUseReason(blockReason);
        setEmailInUseOpen(true);
        return;
      }

      const normalizedSection = studentSectionFromUi(sectionChoice, sectionOther);
      const nextState = {
        firstName,
        lastName,
        email: normalizedEmail,
        emailLockedFromInvite,
        whatsappPhone: normalizedWhatsappPhone,
        grade,
        section: normalizedSection,
        dob: undefined,
        cityState: undefined,
      };
      writeSignupDraft(nextState as Record<string, unknown>);
      didNavigate = true;
      navigate('/students/register/school', { state: nextState });
    } finally {
      if (!didNavigate) {
        setIsContinuing(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top nav - match /students page */}
      <header className="sticky top-0 z-50 bg-white/90 border-b border-gray-200 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 sm:gap-6">
          <button
            type="button"
            onClick={handleBack}
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
              <p className="hidden text-xs text-gray-500 sm:block">
                Powered by Argus, Access&nbsp;USA, EducationWorld
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <PublicHomeNavButton />
            <button
              type="button"
              onClick={() => requestLeave(() => navigate('/login'))}
              className="rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-medium shrink-0 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 sm:px-5"
              style={{ borderColor: GYS_BLUE, color: GYS_BLUE }}
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col px-4 pb-12 pt-6 sm:px-6">
        {/* Step indicator */}
        <div className="mb-5 sm:mb-6">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-wide text-slate-500">
            Step 1 of 3 • Create Account
          </p>
          <div className="mt-2 flex h-1.5 sm:h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="w-1/3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <div className="w-1/3 rounded-full" style={{ backgroundColor: GYS_BLUE }} />
            <div className="w-1/3 rounded-full" style={{ backgroundColor: GYS_BLUE }} />
          </div>
        </div>

        {/* Card */}
        <section className="mt-2 rounded-2xl bg-white p-5 sm:p-7 shadow-md ring-1 ring-slate-100">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Create Your Account
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Set up your GYS profile using your <span className="font-semibold">school email address</span>.
            You&apos;ll choose a membership level after registration.
          </p>

          {/* Manual form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  First Name<span className="text-red-500"> *</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="Arjun"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  Last Name<span className="text-red-500"> *</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="Mehta"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                Email Address<span className="text-red-500"> *</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  if (emailLockedFromInvite) return;
                  setEmail(event.target.value);
                }}
                readOnly={emailLockedFromInvite}
                className={`mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                  emailLockedFromInvite ? 'bg-slate-50 text-slate-700 cursor-default' : ''
                }`}
                placeholder="arjun@example.com"
                required
                autoComplete="email"
              />
              <p className="mt-1 text-xs text-slate-500">
                {emailLockedFromInvite ? (
                  <>
                    This email came from your school invitation and cannot be changed here.
                    Contact support if it looks wrong.
                  </>
                ) : (
                  <>
                    Please use your <span className="font-semibold">school email ID</span>.
                  </>
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                WhatsApp Phone Number<span className="text-red-500"> *</span>
              </label>
              <div
                className={`mt-1.5 flex w-full overflow-hidden rounded-lg border bg-white text-sm sm:text-base focus-within:outline-none focus-within:ring-1 ${
                  whatsappPhoneError
                    ? 'border-red-400 bg-red-50/50 focus:border-red-400 focus:ring-red-300'
                    : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
                }`}
              >
                <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3.5 py-2.5 font-medium text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={whatsappPhone}
                  onChange={(event) => {
                    setWhatsappPhone(event.target.value.replace(/\D/g, '').slice(0, 10));
                    if (whatsappPhoneError) setWhatsappPhoneError('');
                  }}
                  aria-invalid={Boolean(whatsappPhoneError)}
                  className="w-full px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  placeholder="98765 43210"
                  autoComplete="tel-national"
                  maxLength={10}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                If the student doesn&apos;t have a WhatsApp number, please share a parent&apos;s number.
              </p>
              {whatsappPhoneError && (
                <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
                  {whatsappPhoneError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-4">
              <div className="min-w-0">
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  Student Class<span className="text-red-500"> *</span>
                </label>
                <SignupSelect
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  required
                  aria-label="Student class"
                >
                  <option value="">Select class</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </SignupSelect>
              </div>
              <div className="min-w-0">
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  Section{' '}
                  <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <SignupSelect
                  value={sectionChoice}
                  onChange={(event) => {
                    const next = event.target.value as StudentSectionUiChoice;
                    setSectionChoice(next);
                    if (next !== STUDENT_SECTION_OTHER) setSectionOther('');
                  }}
                  aria-label="Section"
                >
                  <option value="">Select section</option>
                  {STUDENT_SECTION_PRESETS.map((letter) => (
                    <option key={letter} value={letter}>
                      {letter}
                    </option>
                  ))}
                  <option value={STUDENT_SECTION_OTHER}>Other</option>
                </SignupSelect>
                {sectionChoice === STUDENT_SECTION_OTHER && (
                  <input
                    type="text"
                    value={sectionOther}
                    onChange={(event) =>
                      setSectionOther(normalizeStudentSection(event.target.value))
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                    placeholder="Enter section"
                    autoComplete="off"
                    maxLength={12}
                  />
                )}
              </div>
            </div>

            <label className="mt-1 flex items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                required
              />
              <span>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => navigate('/#terms')}
                  className="font-medium text-slate-900 underline underline-offset-2"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => navigate('/#privacy')}
                  className="font-medium text-slate-900 underline underline-offset-2"
                >
                  Privacy Policy
                </button>
                . I confirm that a parent/guardian consents to this registration.
              </span>
            </label>

            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm sm:text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={!acceptedTerms || isContinuing}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm sm:text-base font-semibold text-white shadow-md hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:bg-slate-400"
                style={{ backgroundColor: acceptedTerms && !isContinuing ? GYS_BLUE : undefined }}
              >
                {isContinuing ? 'Loading...' : 'Continue →'}
              </button>
            </div>

            <p className="pt-3 text-center text-xs text-slate-500">
              Your account is free. You&apos;ll select a membership level next.
            </p>
          </form>
        </section>
      </main>

      {emailInUseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Email already in use</h2>
            <p className="mt-2 text-sm text-slate-600">
              {emailInUseReason === 'auth' && (
                <>
                  Sign-in is already enabled for{' '}
                  <span className="font-medium">{email}</span> in Argus (Firebase Authentication), even
                  if you do not see a student document in Firestore. Use <span className="font-medium">Log in</span>{' '}
                  or choose another email for a new student account.
                </>
              )}
              {emailInUseReason === 'schooladmin' && (
                <>
                  <span className="font-medium">{email}</span> is already registered as a{' '}
                  <span className="font-medium">school portal</span> contact for a school on Argus.
                  Student signup must use a different email address.
                </>
              )}
              {(emailInUseReason === 'student' || emailInUseReason === null) && (
                <>
                  A student profile already exists for <span className="font-medium">{email}</span>.
                  Please log in instead, or use a different school email address.
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmailInUseOpen(false);
                  setEmailInUseReason(null);
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Use different email
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-lg border bg-white px-3.5 py-1.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
                style={{ borderColor: GYS_BLUE, color: GYS_BLUE }}
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistrationPage;

