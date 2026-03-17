import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import EmailEntryForm from '../../components/auth/EmailForm';

const GYS_BLUE = '#1e3a8a';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'LoginPage');
      }}
    >
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {/* Top nav – match LandingPage */}
        <header className="bg-white/90 border-b border-gray-200 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-3 group">
              <div
                className="flex w-10 h-10 rounded items-center justify-center text-white font-bold text-sm shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md"
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
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-medium shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-150"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Back to Home
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 w-full">
            <div className="w-full grid gap-8 sm:grid-cols-2 sm:items-start lg:gap-14">
              {/* Auth card – appears first on mobile, second on desktop */}
              <section className="flex items-start justify-center order-first sm:order-last">
                <div className="w-full max-w-md">
                  <EmailEntryForm />
                  <p className="mt-4 text-center text-[11px] text-slate-500">
                    By continuing, you agree to the exam rules and honor code shared with your school.
                  </p>
                </div>
              </section>

              {/* Hero copy – appears second on mobile, first on desktop */}
              <section className="flex flex-col justify-center order-last sm:order-first">
                <div className="space-y-4 sm:space-y-5">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-snug text-slate-900">
                    Sign in to continue your{' '}
                    <span className="inline-block" style={{ color: '#1e3a8a' }}>
                      Global Young Scholar
                    </span>{' '}
                    journey
                  </h1>
                  <p className="max-w-xl text-sm sm:text-base text-slate-700">
                    Access your exam schedule, practice sets, and performance insights in one secure
                    dashboard—built for ambitious students and school leaders.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-4 max-w-lg text-xs text-slate-700">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">Students</p>
                      <p className="mt-1 text-[12px] text-slate-600 leading-snug">
                        Use your school email ID to register, attempt the Talent Search, and track your
                        results.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">School Admins</p>
                      <p className="mt-1 text-[12px] text-slate-600 leading-snug">
                        Log in with your verified institutional email to access the School Admin Portal.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        {/* Footer – match LandingPage height */}
        <footer className="bg-white border-t border-gray-200 py-10">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-center text-gray-500 text-sm">
              © 2026 Global Young Scholar. A joint initiative of Access USA, Argus, and EducationWorld.
            </p>
          </div>
        </footer>
      </div>
    </Sentry.ErrorBoundary>
  );
};

export default LoginPage;

