import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const GYS_BLUE = '#1e3a8a';

const StudentWelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const membershipName = (state as any).membershipName || 'Level 2 — Engage';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-white/90 border-b border-gray-200 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-center px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: GYS_BLUE }}
            >
              GYS
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 tracking-tight">
                Global Young Scholar
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-4 pb-12 pt-8 sm:px-6">
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-md ring-1 ring-slate-100">
          <div className="flex justify-center">
            <span className="text-4xl" aria-hidden="true">
              🎉
            </span>
          </div>
          <h2 className="mt-4 text-center text-2xl sm:text-3xl font-semibold text-slate-900">
            Welcome to GYS!
          </h2>
          <p className="mt-2 text-center text-sm sm:text-base text-slate-600">
            Your {membershipName} membership is active. You&apos;re ready to begin your first
            assessment.
          </p>

          <div className="mt-5 rounded-2xl bg-sky-50 px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-3">
              Your membership includes
            </p>
            <ul className="space-y-1.5 text-sm sm:text-base text-slate-800">
              <li className="flex items-center gap-2">
                <span aria-hidden="true">🧠</span>
                <span>Symbolic Reasoning Assessment</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">📚</span>
                <span>Verbal Reasoning Assessment</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">📐</span>
                <span>Mathematical Reasoning Assessment</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">🧩</span>
                <span>Personality Profile</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">💬</span>
                <span>Conversational English Fluency</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">📊</span>
                <span>Cross-Synthesis Reports</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">📈</span>
                <span>Year-over-Year Growth Tracking</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-4 py-3 text-sm sm:text-base font-semibold text-slate-900 shadow-md hover:bg-amber-500 transition-colors duration-200"
          >
            Go to Dashboard →
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm sm:text-base font-semibold text-slate-500 hover:bg-slate-50"
          >
            Back to Home
          </button>
        </section>
      </main>
    </div>
  );
};

export default StudentWelcomePage;

