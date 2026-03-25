import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { checkEmailExists } from '../../db/emailMappingCollection';
import { auth } from '../../firebase/firebase';

const GYS_BLUE = '#1e3a8a';

const StudentRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state || {}) as any;

  const [firstName, setFirstName] = useState(locationState?.prefill?.firstName || '');
  const [lastName, setLastName] = useState(locationState?.prefill?.lastName || '');
  const [email, setEmail] = useState(locationState?.prefill?.email || '');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState(locationState?.prefill?.grade || '');
  const [dob, setDob] = useState(locationState?.prefill?.dob || '');
  const [cityState, setCityState] = useState(locationState?.prefill?.cityState || '');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [emailInUseOpen, setEmailInUseOpen] = useState<boolean>(!!locationState?.emailInUse);

  useEffect(() => {
    if (locationState?.emailInUse) {
      window.history.replaceState({}, document.title);
    }
  }, [locationState?.emailInUse]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!acceptedTerms) return;

    const normalizedEmail = email.trim().toLowerCase();

    let exists = false;

    // Check Firebase Auth directly
    try {
      const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      if (methods && methods.length > 0) {
        exists = true;
      }
    } catch (error) {
      // ignore and fall back to Firestore mapping check
    }

    // Check our email mapping collections as well
    if (!exists) {
      try {
        const emailCheck = await checkEmailExists(normalizedEmail);
        exists = emailCheck.exists;
      } catch (error) {
        // On error, be conservative and treat as "exists" so we don't create duplicates silently
        exists = true;
      }
    }

    if (exists) {
      setEmailInUseOpen(true);
      return;
    }

    navigate('/students/register/school', {
      state: {
        firstName,
        lastName,
        email: normalizedEmail,
        password,
        grade,
        dob,
        cityState,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top nav - match /students page */}
      <header className="sticky top-0 z-50 bg-white/90 border-b border-gray-200 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 sm:gap-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
              <p className="text-xs text-gray-500">
                Powered by Argus, Access USA, EducationWorld
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:brightness-110 active:scale-95 transition-all duration-200"
            style={{ backgroundColor: GYS_BLUE }}
          >
            Log In
          </button>
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
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="arjun@example.com"
                required
              />
              <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                Please use your <span className="font-semibold">school email ID</span>. Parent&apos;s school email
                is recommended for students under 16.
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                Password<span className="text-red-500"> *</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="Password"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  Student Grade<span className="text-red-500"> *</span>
                </label>
                <select
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(event) => setDob(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700">City / State</label>
              <input
                type="text"
                value={cityState}
                onChange={(event) => setCityState(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="Bangalore, Karnataka"
              />
            </div>

            <label className="mt-1 flex items-start gap-2 text-[11px] sm:text-xs text-slate-600">
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

            <button
              type="submit"
              disabled={!acceptedTerms}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm sm:text-base font-semibold text-white shadow-md hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:bg-slate-400"
              style={{ backgroundColor: acceptedTerms ? GYS_BLUE : undefined }}
            >
              Create Account →
            </button>

            <p className="pt-3 text-center text-[11px] sm:text-xs text-slate-500">
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
              An account already exists for <span className="font-medium">{email}</span>. Please log
              in instead, or use a different school email address.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEmailInUseOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Use different email
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
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

