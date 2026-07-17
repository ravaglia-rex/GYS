import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { clearSignupDraft } from '../../utils/studentSignupDraft';

const GYS_BLUE = '#1e3a8a';

const StudentWelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  useEffect(() => {
    clearSignupDraft();
  }, []);

  const membershipName = (state as any).membershipName || 'Reasoning Triad';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-white/90 border-b border-gray-200 backdrop-blur">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
          <div className="flex justify-start">
            <PublicHomeNavButton />
          </div>
          <div className="flex items-center gap-3 justify-center">
            <div
              className="w-9 h-9 rounded flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: GYS_BLUE }}
            >
              GYS
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-gray-900 tracking-tight">
                Global Young Scholar
              </h1>
            </div>
          </div>
          <div />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col justify-center px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-2xl bg-white p-5 sm:p-6 shadow-md ring-1 ring-slate-100">
          <div className="flex justify-center">
            <span className="text-2xl" aria-hidden="true">
              🎉
            </span>
          </div>
          <h2 className="mt-2 text-center text-xl sm:text-2xl font-semibold text-slate-900">
            Setup complete
          </h2>
          <p className="mt-2 text-center text-sm leading-snug text-slate-600">
            Your {membershipName} membership is ready. We&apos;ve sent an email with your
            account confirmation, payment details if applicable, and a secure link to set
            your password. Please check your spam folder and mark the email as not spam if
            it lands there.
          </p>

          <div className="mt-4 rounded-xl bg-sky-50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-800 mb-1.5">Next steps</p>
            <ol className="list-decimal space-y-1 pl-4 text-sm text-slate-800">
              <li>Open the email we sent to your registered email address.</li>
              <li>Use the secure password setup link to create your password.</li>
              <li>Sign in and start using your student dashboard.</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-md hover:bg-amber-500 transition-colors duration-200"
          >
            Go to Sign In →
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-2 inline-flex w-full items-center justify-center px-4 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Back to Home
          </button>
        </section>
      </main>
    </div>
  );
};

export default StudentWelcomePage;
