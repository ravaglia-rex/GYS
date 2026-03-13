import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import EmailEntryForm from '../../components/auth/EmailForm';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'LoginPage');
      }}
    >
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {/* Top nav */}
        <header className="sticky top-0 z-20 bg-white/90 border-gray-200 border-b backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 sm:gap-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="group flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors duration-200 hover:bg-slate-100 rounded-lg px-1 py-0.5 -ml-1"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs transition-all duration-200 group-hover:border-slate-400">
                ←
              </span>
              <span className="hidden xs:inline">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <img
                src="/argus_A_logo.png"
                alt="Argus"
                className="h-10 w-10 rounded items-center justify-center text-white font-bold text-sm shrink-0"
              />
              <div className="flex flex-col">
                <span className="hidden sm:block font-bold text-lg text-gray-900 tracking-tight">
                  Global Young Scholar
                </span>
                <span className="text-xs text-gray-500">
                  Powered by Argus, Access USA, EducationWorld
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/for-schools')}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-medium shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:brightness-110 active:scale-95 transition-all duration-200"
            >
              For Schools
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mt-8 grid gap-8 sm:grid-cols-2 sm:items-start lg:gap-12">
              {/* Left hero copy */}
              <section className="flex flex-col justify-center">
                <div className="space-y-4 sm:space-y-5">
                  <p className="inline-flex items-center rounded-full border border-blue-500/10 bg-blue-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-blue-700 shadow-sm w-fit">
                    Exam Portal Login
                  </p>
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

                  <div className="mt-4 grid grid-cols-2 gap-3 max-w-md text-xs text-slate-700">
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                      <p className="font-semibold text-slate-900">Students</p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Use your school email ID to register, attempt the Talent Search, and track your
                        results.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                      <p className="font-semibold text-slate-900">School Admins</p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Log in with your verified institutional email to access the School Admin Portal.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Right auth card */}
              <section className="flex items-start justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 px-5 py-6 sm:px-6 sm:py-7">
                  <EmailEntryForm />
                  <p className="mt-4 text-center text-[11px] text-slate-500">
                    By continuing, you agree to the exam rules and honor code shared with your school.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8 mt-8">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-center text-xs text-gray-500 sm:text-sm">
              © 2026 Global Young Scholar. A joint initiative of Access USA, Argus, and EducationWorld.
            </p>
          </div>
        </footer>
      </div>
    </Sentry.ErrorBoundary>
  );
};

export default LoginPage;

