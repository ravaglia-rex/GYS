import React from 'react';
import { ArrowRight, GraduationCap, School } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LandingPublicHeader from '../../components/layout/LandingPublicHeader';
import LandingSiteFooter from '../../components/layout/LandingSiteFooter';
import { GYS_BLUE, GYS_GOLD } from '../../constants/gysBrand';

const SignupChoicePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <LandingPublicHeader scrollProgress={0} signUp={{ show: false }} />

      <main className="flex flex-1 items-center px-4 py-10 sm:px-6">
        <section className="mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GYS_BLUE }}>
              Create your GYS account
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Are you signing up as a student or a school?
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
              Choose the path that matches you, and we&apos;ll take you to the right registration flow.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 sm:gap-6">
            <button
              type="button"
              onClick={() => navigate('/students/register')}
              className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-150 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg active:translate-y-0"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{ backgroundColor: GYS_BLUE }}
              >
                <GraduationCap className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-slate-950">I&apos;m a Student</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Register for assessments, pick your membership, and start your student dashboard.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: GYS_BLUE }}>
                Continue as student
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/for-schools/register')}
              className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-150 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg active:translate-y-0"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-950 shadow-sm"
                style={{ backgroundColor: GYS_GOLD }}
              >
                <School className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-slate-950">I&apos;m a School</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Register your institution, choose a school plan, and set up your cohort.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: GYS_BLUE }}>
                Continue as school
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </button>
          </div>
        </section>
      </main>

      <LandingSiteFooter />
    </div>
  );
};

export default SignupChoicePage;
