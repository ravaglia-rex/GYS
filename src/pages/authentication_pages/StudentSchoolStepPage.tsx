import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCredential, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { fetchSchoolNamesAndIds, resolveRegistrationSchool } from '../../db/schoolCollection';
import SchoolsInput from '../../components/autocomplete/SchoolsInput';
import * as Sentry from '@sentry/react';
import { auth } from '../../firebase/firebase';
import { runSignUpTransaction } from '../../db/signupTransaction';
import { addEmailMapping } from '../../db/emailMappingCollection';
import { useToast } from '../../components/ui/use-toast';
import { LoadingSpinner as Spinner } from '../../components/ui/spinner';
import analytics from '../../segment/segment';

const GYS_BLUE = '#1e3a8a';

interface LocationState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  grade: string;
  dob: string;
  cityState: string;
}

const StudentSchoolStepPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as Partial<LocationState>;

  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [lockedSchool, setLockedSchool] = useState<{ id: string; name: string } | null>(null);
  const [homeLanguage, setHomeLanguage] = useState('');
  const [aspiration, setAspiration] = useState('');
  const [heardFrom, setHeardFrom] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const loadSchools = async () => {
      const email = (state.email ?? '').trim();
      if (!email) {
        setIsLoading(false);
        return;
      }
      try {
        const [data, resolved] = await Promise.all([
          fetchSchoolNamesAndIds(),
          resolveRegistrationSchool(email).catch(() => ({ schoolId: null as string | null, schoolName: null as string | null })),
        ]);
        setSchools(data);
        if (resolved.schoolId && resolved.schoolName) {
          setLockedSchool({ id: resolved.schoolId, name: resolved.schoolName });
          setSelectedSchoolId(resolved.schoolId);
        }
      } catch (error: any) {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'StudentSchoolStepPage.loadSchools');
          Sentry.captureException(error);
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSchools();
  }, [state.email]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSchoolId || isSubmitted) return;

    const {
      firstName,
      lastName,
      email,
      password,
      grade,
      dob,
      cityState,
    } = state as LocationState;

    if (!email || !password || !firstName || !lastName || !grade) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please complete Step 1 again.',
      });
      navigate('/students/register');
      return;
    }

    try {
      setIsSubmitted(true);

      const normalizedEmail = email.trim().toLowerCase();
      const numericGrade = grade ? parseInt(grade, 10) : 0;

      // Step 1: Create the user in Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      // Step 2: Build student object using collected data
      const newStudent = {
        uid: userCredential.user.uid,
        first_name: firstName,
        last_name: lastName,
        school_id: selectedSchoolId,
        grade: numericGrade,
        parent_name: '',
        parent_email: '',
        parent_phone: '',
      };

      // Step 3: Run the signup transaction
      await runSignUpTransaction({ ...newStudent, email: normalizedEmail });

      // Step 3a: Add email mapping (used for uniqueness checks & admin tools)
      try {
        await addEmailMapping(userCredential.user.uid, normalizedEmail);
      } catch (mappingError) {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'StudentSchoolStepPage.addEmailMapping');
          scope.setExtra('uid', userCredential.user.uid);
          scope.setExtra('email', normalizedEmail);
          Sentry.captureException(mappingError);
        });
      }

      // Step 4: Send email verification
      await sendEmailVerification(userCredential.user);

      // Step 5: Track analytics event
      analytics.track('[CREATE] New User Added', {
        email: normalizedEmail,
        first_name: firstName,
        last_name: lastName,
        school_id: selectedSchoolId,
        grade: numericGrade,
        homeLanguage,
        aspiration,
        heardFrom,
      });

      toast({
        variant: 'default',
        title: 'Account created successfully!',
        description: `Welcome to Argus, ${firstName}! A verification email has been sent to ${normalizedEmail}.`,
      });

      navigate('/students/register/membership', {
        state: {
          firstName,
          lastName,
          email: normalizedEmail,
          grade,
          dob,
          cityState,
          schoolId: selectedSchoolId,
          homeLanguage,
          aspiration,
          heardFrom,
        },
      });
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        navigate('/students/register', {
          state: {
            prefill: {
              firstName,
              lastName,
              email,
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
        scope.setTag('location', 'StudentSchoolStepPage.handleSubmit');
        scope.setExtra('first_name', state.firstName);
        scope.setExtra('last_name', state.lastName);
        scope.setExtra('email', state.email);
        scope.setExtra('grade', state.grade);
        scope.setExtra('schoolId', selectedSchoolId);
        Sentry.captureException(error);
      });
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error?.message || 'An error occurred while creating your account. Please try again.',
      });
    } finally {
      setIsSubmitted(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
        <div className="mb-5 sm:mb-6">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-wide text-slate-500">
            Step 2 of 3 • Student Profile
          </p>
          <div className="mt-2 flex h-1.5 sm:h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="w-1/3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <div className="w-1/3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <div className="w-1/3 rounded-full" style={{ backgroundColor: GYS_BLUE }} />
          </div>
        </div>

        <section className="mt-2 rounded-2xl bg-white p-5 sm:p-7 shadow-md ring-1 ring-slate-100">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
             Tell us more about you 
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            {/* This helps us calibrate assessments and personalize reports. */}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                School<span className="text-red-500"> *</span>
              </label>
              <SchoolsInput
                schools={schools}
                onSelect={(id) => setSelectedSchoolId(id)}
                lockedSelection={lockedSchool}
                className="mt-1.5 bg-white border border-slate-200 focus-visible:ring-slate-500 rounded-lg w-full text-slate-900"
                loading={isLoading}
              />
            </div>
            {lockedSchool && (
              <p className="text-xs text-slate-600">
                Your email is on this school&apos;s registration list, so your school is set automatically.
              </p>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                Primary Language at Home
              </label>
              <select
                value={homeLanguage}
                onChange={(event) => setHomeLanguage(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 bg-white focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">Select Language</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Marathi">Marathi</option>
                <option value="Bengali">Bengali</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                Educational Aspirations
              </label>
              <select
                value={aspiration}
                onChange={(event) => setAspiration(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 bg-white focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">Select Primary Goal</option>
                <option value="STUDY_ABROAD">Study abroad (US/UK/Canada/Australia)</option>
                <option value="TOP_INDIAN">
                  Top Indian university (IIT/IIM/AIIMS/etc.)
                </option>
                <option value="BOTH">Both international and Indian options</option>
                <option value="EXPLORING">Still exploring</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                How Did You Hear About GYS?
              </label>
              <select
                value={heardFrom}
                onChange={(event) => setHeardFrom(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-base text-slate-900 bg-white focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">Select</option>
                <option value="SCHOOL">My school</option>
                <option value="FRIEND_FAMILY">Friend or family</option>
                <option value="ACCESS_USA">Access USA</option>
                <option value="EDUCATIONWORLD">EducationWorld</option>
                <option value="SOCIAL_MEDIA">Social media</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedSchoolId || isSubmitted}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm sm:text-base font-semibold text-white shadow-md hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:bg-slate-400"
              style={{ backgroundColor: selectedSchoolId ? GYS_BLUE : undefined }}
            >
              {isSubmitted ? <Spinner /> : 'Continue →'}
            </button>

            <p className="pt-1 text-center text-[11px] sm:text-xs text-slate-500">
              You can update this later from your dashboard.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
};

export default StudentSchoolStepPage;

