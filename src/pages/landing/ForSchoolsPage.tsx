import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GYS_BLUE = '#1e3a8a';
const GYS_GOLD = '#fbbf24';

const ForSchoolsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [pricingVisible, setPricingVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target.getAttribute('data-section');
          if (section === 'features') setFeaturesVisible(true);
          if (section === 'pricing') setPricingVisible(true);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    const featuresEl = document.querySelector('[data-section="features"]');
    const pricingEl = document.querySelector('[data-section="pricing"]');

    if (featuresEl) observer.observe(featuresEl);
    if (pricingEl) observer.observe(pricingEl);

    return () => {
      if (featuresEl) observer.unobserve(featuresEl);
      if (pricingEl) observer.unobserve(pricingEl);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/90 border-gray-200 border-b backdrop-blur">
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

      <main className="flex-1 pb-14">
        {/* Hero band */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] px-4 py-10 text-white sm:px-6 sm:py-12 lg:px-12 xl:px-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.14)_0%,_transparent_55%)] pointer-events-none" />
          <div
            className={`relative mx-auto max-w-4xl text-center transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <h2 className="mt-3 text-3xl font-bold leading-snug sm:text-4xl">
              Give Your School a{' '}
              <span
                className="inline-block transition-transform duration-300 hover:scale-105"
                style={{ color: GYS_GOLD }}
              >
                Global Benchmark
              </span>
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-sm sm:text-base text-white/90">
              See how your students compare worldwide. Identify gaps. Track growth.
              Demonstrate excellence to parents, boards, and accreditors.
            </p>
          </div>
        </section>

        {/* Stats strip below hero */}
        <section className="bg-slate-50 pb-12 pt-8">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5">
              {[
                {
                  icon: '📊',
                  value: '5',
                  label: 'Assessments',
                },
                {
                  icon: '🌍',
                  value: '30+',
                  label: 'Countries',
                },
                {
                  icon: '📈',
                  value: 'Q/Q',
                  label: 'Growth Data',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="group relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-100 sm:px-5 sm:py-5 transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg hover:ring-slate-200 cursor-default"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className="text-2xl sm:text-3xl leading-none transition-transform duration-300 group-hover:scale-110 inline-block"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-slate-900">
                      {item.value}
                    </span>
                    <span className="text-[11px] sm:text-xs uppercase tracking-[0.16em] text-slate-500">
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main body container */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* What your school gets */}
          <section
            data-section="features"
            className={`mt-0 sm:mt-2 transition-all duration-700 ${
              featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="mx-auto max-w-5xl">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 text-left">
                What Your School Gets
              </h3>

              <div className="mt-6 space-y-3">
              {[
                {
                  title: 'Institutional Performance Reports',
                  body: 'Aggregate data across grades and cohorts. Distribution analysis, subscore breakdowns, comparative benchmarks.',
                  iconBg: 'bg-blue-50',
                  icon: '📊',
                },
                {
                  title: 'Quarter-over-Quarter Growth Tracking',
                  body: 'Measure the impact of curriculum changes. See which interventions are working, in which grades, over time.',
                  iconBg: 'bg-emerald-50',
                  icon: '📈',
                },
                {
                  title: 'Tier Certification & Recognition',
                  body: 'Earn institutional tier status for your school. Use it in admissions marketing, parent communications, and accreditation.',
                  iconBg: 'bg-amber-50',
                  icon: '🏆',
                },
                {
                  title: 'Actionable Recommendations',
                  body: 'Prioritized, data-driven suggestions for curriculum enhancement, enrichment programs, and student development.',
                  iconBg: 'bg-rose-50',
                  icon: '🎯',
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:px-5 sm:py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-slate-200"
                  style={{
                    animation: 'fade-slide-in 0.5s ease-out both',
                    animationDelay: `${index * 90}ms`,
                  }}
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-lg shrink-0 ${item.iconBg}`}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </section>

          {/* Institutional subscriptions / pricing */}
          <section
            data-section="pricing"
            className={`mt-10 sm:mt-12 transition-all duration-700 ${
              pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Institutional Subscriptions
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Annual institutional license. All students in selected grades included.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {/* Entry */}
              <div className="flex flex-col rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200 sm:px-5 sm:py-5">
                <h4 className="text-sm font-semibold text-slate-900 sm:text-base">Entry</h4>
                <div className="mt-1 flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Exam 1 (Symbolic Reasoning)</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Headline performance report</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Tier distribution analysis</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Path to next tier</span>
                  </span>
                </div>
                <p
                  className="mt-3 text-base sm:text-lg font-bold"
                  style={{ color: GYS_BLUE }}
                >
                  ₹2,00,000/yr
                </p>
              </div>

              {/* Standard - recommended */}
              <div className="relative flex flex-col rounded-2xl bg-white px-4 py-4 text-slate-900 shadow-md ring-2 ring-[#1e3a8a]/70 sm:px-5 sm:py-5">
                <div className="absolute -top-3 right-4 rounded-full bg-[#fbbf24] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-900 shadow">
                  Recommended
                </div>
                <h4 className="text-sm font-semibold sm:text-base">Standard</h4>
                <div className="mt-1 flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Exams 1–3 (reasoning triad)</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Full analytics &amp; subscore breakdowns</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Grade-level analysis</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Comparative benchmarks (national, regional)</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Quarterly growth tracking</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Prioritized recommendations</span>
                  </span>
                </div>
                <p
                  className="mt-3 text-base sm:text-lg font-bold"
                  style={{ color: GYS_BLUE }}
                >
                  ₹3,00,000/yr
                </p>
              </div>

              {/* Premium */}
              <div className="flex flex-col rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200 sm:px-5 sm:py-5">
                <h4 className="text-sm font-semibold text-slate-900 sm:text-base">Premium</h4>
                <div className="mt-1 flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Everything in Standard</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>All grades &amp; custom cohorts</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Cohort analysis &amp; cluster insights</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Faculty training workshops</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Consulting-style action plans</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Dedicated account manager</span>
                  </span>
                  <span className="flex items-start gap-1">
                    <span className="mt-[2px] text-emerald-600 text-xs">✓</span>
                    <span>Marketing toolkit (tier badges, parent comms)</span>
                  </span>
                </div>
                <p
                  className="mt-3 text-base sm:text-lg font-bold"
                  style={{ color: GYS_BLUE }}
                >
                  ₹5,00,000/yr
                </p>
              </div>
            </div>
          </section>

          {/* EducationWorld strip */}
          <section className="mt-12 sm:mt-14">
            <div className="rounded-2xl bg-[#e0edff] px-5 py-4 shadow-sm sm:px-6 sm:py-5">
              <div className="flex flex-row items-center gap-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl px-2 text-[10px] font-semibold leading-tight text-white sm:h-16 sm:w-16 sm:text-[11px]"
                  style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}
                >
                  Education
                  <br />
                  World
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                    Presented by EducationWorld
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-800 sm:text-sm">
                    India&apos;s most trusted name in school assessment and ranking. Your
                    data, our expertise.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Partner quote */}
          <section className="mt-8 sm:mt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              From Our Partners
            </p>
            <div className="mt-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100 sm:px-6 sm:py-5">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                “Indian schools are world-class but have never had a way to prove it on the
                global stage. GYS gives every school in our network the data to demonstrate
                what we&apos;ve always known — that our students compete with the best
                anywhere.”
              </p>
              <p className="mt-3 text-xs font-semibold text-slate-600 sm:text-sm">
                — Bhavin Shah, CEO, EducationWorld
              </p>
            </div>
          </section>

          {/* Final CTAs */}
          <section className="mt-10 sm:mt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
              onClick={() => navigate('/for-schools/demo-request')}
                className="flex w-full items-center justify-center rounded-2xl bg-[#fbbf24] px-4 py-3 text-sm font-semibold text-slate-900 shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 sm:text-base"
              >
                Request a Demo →
              </button>
              <button
                type="button"
                onClick={() => window.open('#', '_blank')}
                className="flex w-full items-center justify-center rounded-2xl border-2 border-[#1e3a8a] bg-white px-4 py-3 text-sm font-semibold text-[#1e3a8a] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[#f8fafc] active:scale-[0.98] transition-all duration-200 sm:text-base"
              >
                Download the School Brochure
              </button>
            </div>
            <p className="pt-4 text-center text-xs text-slate-500 sm:text-sm">
              We&apos;ll schedule a 20-minute walkthrough with your leadership team.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs text-gray-500 sm:text-sm">
            © 2026 Global Young Scholar. A joint initiative of Access USA, Argus, and
            EducationWorld.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ForSchoolsPage;
