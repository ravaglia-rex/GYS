import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LandingSiteFooter from '../../components/layout/LandingSiteFooter';
import PublicSamplesNavMenu from '../../components/layout/PublicSamplesNavMenu';
import LandingFaq from '../../components/landing/LandingFaq';
import { LandingHeaderScrollProgress, LandingSectionRail } from '../../components/landing/LandingScrollChrome';
import { GYS_BLUE, GYS_GOLD } from '../../constants/gysBrand';
import {
  useLandingRevealInContainer,
  useLandingScrollProgress,
  useLandingSectionSpy,
} from '../../hooks/useLandingPageScroll';
import { schoolFaqSections } from './faq/schoolFaqSections';
import {
  INSTITUTIONAL_LANDING_PLAN_CARD_BLURBS,
  INSTITUTIONAL_PLAN_STUDENT_LIMIT,
  SCHOOL_INSTITUTIONAL_PLAN_MATRIX,
  SCHOOL_INSTITUTIONAL_PRICE_LANDING,
  type RegisterPlanId,
} from '../../utils/schoolRegistrationPlans';

/** Background / popular ribbon — layout only; caps & prices come from {@link SCHOOL_INSTITUTIONAL_PLAN_MATRIX}. */
const INSTITUTIONAL_PLAN_CARD_UI: Record<RegisterPlanId, { bg: string; popular: boolean }> = {
  entry: { bg: 'bg-[#e5f3ff]', popular: false },
  standard: { bg: 'bg-[#fff7e0]', popular: true },
  premium: { bg: 'bg-[#f9e8ff]', popular: false },
};

const FOR_SCHOOLS_NAV = [
  { id: 'schools-hero', label: 'Home' },
  { id: 'schools-stats', label: 'At a glance' },
  { id: 'schools-benefits', label: 'Benefits' },
  { id: 'institutional-packages', label: 'Plans' },
  { id: 'consumer-recognition-pass-through', label: 'Recognition' },
  { id: 'schools-ew', label: 'Partners' },
  { id: 'schools-quote', label: 'Voices' },
  { id: 'faq', label: 'FAQ' },
  { id: 'for-schools-next-step', label: 'Next step' },
] as const;

const FOR_SCHOOLS_SECTION_IDS_JOIN = FOR_SCHOOLS_NAV.map((s) => s.id).join('|');

/** Align with StudentPathPage plans matrix: tinted column headers for Entry / Standard / Premium */
const SCHOOL_PLAN_TIER_HEADERS = [
  { key: 'entry' as const, title: 'Entry', tint: 'bg-sky-100 text-sky-950' },
  { key: 'standard' as const, title: 'Standard', tint: 'bg-amber-100 text-amber-950' },
  { key: 'premium' as const, title: 'Premium', tint: 'bg-purple-100 text-purple-950' },
];

type SchoolComparisonRow =
  | {
      label: string;
      desc?: string;
      /** Entry, Standard, Premium — ✓ / − */
      inPlan: [boolean, boolean, boolean];
    }
  | {
      label: string;
      desc?: string;
      /** Entry, Standard, Premium — short text (e.g. roster caps) */
      tierText: [string, string, string];
    };

type SchoolComparisonSection = {
  group: 'assessments' | 'analytics' | 'premium';
  title: string;
  hint: string;
  rows: SchoolComparisonRow[];
};

const SCHOOL_PACKAGE_COMPARISON: SchoolComparisonSection[] = [
  {
    group: 'assessments',
    title: 'Roster & assessments',
    hint: 'Participation limits and which assessments each annual license unlocks',
    rows: [
      {
        label: 'Participating students (annual license)',
        desc: '',
        tierText: [
          INSTITUTIONAL_PLAN_STUDENT_LIMIT.entry,
          INSTITUTIONAL_PLAN_STUDENT_LIMIT.standard,
          INSTITUTIONAL_PLAN_STUDENT_LIMIT.premium,
        ],
      },
      {
        label: 'Assessment 1 (Pattern & Logic)',
        desc: 'Symbolic reasoning baseline for your cohort',
        inPlan: [true, true, true],
      },
      {
        label: 'Assessments 1–3 (full reasoning triad)',
        desc: 'Symbolic, Verbal, and Mathematical reasoning',
        inPlan: [false, true, true],
      },
      {
        label: 'Assessments 4–5 (English & AI proficiency)',
        desc: 'Skills track for institutional cohorts',
        inPlan: [false, false, true],
      },
    ],
  },
  {
    group: 'analytics',
    title: 'Institutional analytics',
    hint: 'Benchmarks, reporting depth, growth, and priorities',
    rows: [
      {
        label: 'Headline performance & tier distribution',
        inPlan: [true, true, true],
      },
      {
        label: 'Full analytics & subscore breakdowns',
        inPlan: [false, true, true],
      },
      {
        label: 'Grade-level analysis',
        inPlan: [false, true, true],
      },
      {
        label: 'Comparative benchmarks (national, regional)',
        inPlan: [false, true, true],
      },
      {
        label: 'Quarterly growth tracking',
        inPlan: [false, true, true],
      },
      {
        label: 'Prioritized recommendations',
        inPlan: [false, true, true],
      },
    ],
  },
  {
    group: 'premium',
    title: 'Premium services',
    hint: 'Standard plus cohort depth & partnership',
    rows: [
      
      {
        label: 'Cohort analysis & cluster insights',
        inPlan: [false, false, true],
      },
      {
        label: 'Consulting-style action plans',
        inPlan: [false, false, true],
      },
      {
        label: 'Dedicated account manager',
        inPlan: [false, false, true],
      },
      {
        label: 'Marketing toolkit (tier badges, parent comms)',
        inPlan: [false, false, true],
      },
    ],
  },
];

const ForSchoolsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageRootRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useLandingScrollProgress();
  const activeSectionId = useLandingSectionSpy(FOR_SCHOOLS_SECTION_IDS_JOIN);
  useLandingRevealInContainer(pageRootRef);

  useEffect(() => {
    const scrollToId = (location.state as { scrollToId?: string } | null)?.scrollToId;
    if (!scrollToId) return;
    const t = window.setTimeout(() => {
      document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 175);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.state]);

  return (
    <div
      ref={pageRootRef}
      className="flex min-h-screen flex-col overflow-x-clip bg-slate-50 text-slate-900"
    >
      <LandingSectionRail sections={FOR_SCHOOLS_NAV} activeSectionId={activeSectionId} />
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur relative">
        <LandingHeaderScrollProgress scrollProgress={scrollProgress} />
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
          <nav className="hidden md:flex items-center gap-8 text-base font-semibold">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              For Students
            </button>
            <button
              type="button"
              onClick={() => navigate('/for-schools')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              For Schools
            </button>
            <PublicSamplesNavMenu />
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/for-schools/register')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium shrink-0 border-2 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-150"
              style={{ borderColor: GYS_BLUE, color: GYS_BLUE }}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl border-2 border-transparent text-white text-sm font-medium shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-150"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-14">
        {/* Hero band */}
        <section
          id="schools-hero"
          className="relative overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] px-6 pb-20 pt-12 text-white sm:pb-24 sm:pt-16"
        >
          <div className="landing-hero-mesh" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.14)_0%,_transparent_55%)]" />
          <div className="relative z-[1] mx-auto max-w-4xl text-center">
            <p className="landing-hero-enter-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">
              For schools &amp; institutions
            </p>
            <h2 className="landing-hero-enter-2 mt-3 text-3xl font-bold leading-snug sm:text-4xl">
              Give Your School a{' '}
              <span
                className="inline-block transition-transform duration-300 hover:scale-105"
                style={{ color: GYS_GOLD }}
              >
                Global Benchmark
              </span>
            </h2>
            <p className="landing-hero-enter-3 mx-auto mt-4 max-w-2xl text-sm text-white/90 sm:text-base">
              See how your students compare worldwide. Identify gaps. Track growth.
              Demonstrate excellence to parents, boards, and accreditors.
            </p>
            <div className="landing-hero-enter-4 mx-auto mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              <span className="landing-hero-chip rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                Practice Tests
              </span>
              <span className="landing-hero-chip rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                Grades 6–12
              </span>
              <span className="landing-hero-chip rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                Global norms
              </span>
            </div>
            <div className="landing-hero-enter-4 mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate('/for-schools/preview')}
                className="rounded-xl border-2 border-white/80 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.99]"
              >
                Try interactive preview
              </button>
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById('for-schools-next-step')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="rounded-xl px-6 py-3 text-sm font-semibold shadow-md transition hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99]"
                style={{ backgroundColor: GYS_GOLD, color: '#0f172a' }}
              >
                Take the next step →
              </button>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 text-slate-50" aria-hidden>
            <svg className="landing-section-wave block w-full" viewBox="0 0 1440 96" preserveAspectRatio="none">
              <path
                fill="currentColor"
                d="M0,96 L0,28 C240,8 480,88 720,48 C960,8 1200,72 1440,36 L1440,96 Z"
              />
            </svg>
          </div>
        </section>

        {/* Stats strip below hero */}
        <section id="schools-stats" data-landing-reveal className="bg-slate-50 pb-12 pt-8">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5">
              {[
                {
                  icon: '📊',
                  value: '7',
                  label: 'Assessments',
                },
                {
                  icon: '🌍',
                  value: 'Global',
                  label: 'Partnerships',
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
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/about/assessments')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
              >
                Explore the full assessment suite
                <span aria-hidden className="text-lg leading-none">
                  →
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Main body container */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* What your school gets */}
          <section id="schools-benefits" data-landing-reveal className="mt-0 sm:mt-2">
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
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:px-5 sm:py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-slate-200"
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

        

          <div id="institutional-packages" className="scroll-mt-28">
          <section
            data-landing-reveal
            className="relative left-1/2 right-1/2 -ml-[50vw] mt-8 w-screen border-y border-slate-200 bg-slate-100 py-8 text-center sm:mt-10 sm:py-10"
          >
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h3 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Institutional packages
            </h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
               Roster limits and annual fees are in{' '}
                <span className="font-medium text-slate-800">Plans &amp; pricing</span> below.
              </p>

              <div
                className="mx-auto mt-6 max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-md ring-1 ring-slate-100"
                role="region"
                aria-label="Institutional plans comparison"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,4.75rem))] gap-x-0.5 border-b border-slate-200 bg-slate-50 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,6rem))] sm:gap-x-1">
                  <div className="px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-2.5 sm:text-xs">
                    Capability
                  </div>
                  {SCHOOL_PLAN_TIER_HEADERS.map((t) => (
                    <div
                      key={t.key}
                      className={`flex flex-col items-center justify-center px-0.5 py-1.5 text-center sm:py-2.5 ${t.tint}`}
                    >
                      <span className="hyphens-auto text-[0.6rem] font-bold leading-tight sm:text-[0.65rem]">
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>

                {SCHOOL_PACKAGE_COMPARISON.map((section) => {
                  const groupBand =
                    section.group === 'assessments'
                      ? 'bg-gradient-to-r from-sky-50 via-indigo-50/60 to-transparent border-l-[3px] sm:border-l-4'
                      : section.group === 'analytics'
                        ? 'bg-gradient-to-r from-teal-50/90 via-transparent to-transparent border-l-[3px] border-l-teal-300/80 sm:border-l-4'
                        : 'bg-gradient-to-r from-purple-50/90 via-transparent to-transparent border-l-[3px] border-l-purple-300/80 sm:border-l-4';

                  return (
                    <div key={section.group}>
                      <div
                        className={`${groupBand} border-slate-200/80 px-3 py-2 sm:px-4`}
                        style={section.group === 'assessments' ? { borderLeftColor: GYS_BLUE } : undefined}
                      >
                        <p className="text-xs font-bold text-slate-800 sm:text-sm">{section.title}</p>
                        <p className="text-[0.65rem] text-slate-600 sm:text-xs">{section.hint}</p>
                      </div>
                      {section.rows.map((row) => (
                        <div
                          key={row.label}
                          className="grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,4.75rem))] items-center gap-x-0.5 border-b border-slate-100 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,6rem))] sm:gap-x-1"
                        >
                          <div className="min-w-0 px-3 py-2 sm:px-4 sm:py-2">
                            <span className="text-sm font-semibold leading-tight text-slate-900">{row.label}</span>
                            {row.desc ? (
                              <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-500 sm:text-xs">
                                {row.desc}
                              </p>
                            ) : null}
                          </div>
                          {'tierText' in row
                            ? row.tierText.map((text, i) => (
                                <div
                                  key={SCHOOL_PLAN_TIER_HEADERS[i].key}
                                  className="flex h-full min-h-[2.75rem] items-center justify-center px-0.5 sm:min-h-0 sm:py-2 sm:px-1"
                                  aria-label={`${row.label} for ${SCHOOL_PLAN_TIER_HEADERS[i].title}: ${text}`}
                                >
                                  <span className="hyphens-auto text-center text-[0.62rem] font-semibold leading-tight text-slate-800 sm:text-[0.7rem]">
                                    {text}
                                  </span>
                                </div>
                              ))
                            : row.inPlan.map((on, i) => (
                                <div
                                  key={SCHOOL_PLAN_TIER_HEADERS[i].key}
                                  className="flex h-full min-h-[2.75rem] items-center justify-center sm:min-h-0 sm:py-2"
                                  aria-label={
                                    on
                                      ? `${row.label} included in ${SCHOOL_PLAN_TIER_HEADERS[i].title}`
                                      : `${row.label} not in ${SCHOOL_PLAN_TIER_HEADERS[i].title}`
                                  }
                                >
                                  <span
                                    className={`text-lg font-bold sm:text-xl ${on ? 'text-emerald-600' : 'text-slate-200'}`}
                                    aria-hidden="true"
                                  >
                                    {on ? '✓' : '-'}
                                  </span>
                                </div>
                              ))}
                        </div>
                      ))}
                    </div>
                  );
                })}

                <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-center text-[0.65rem] leading-relaxed text-slate-600 sm:text-xs">
                  <span className="font-semibold text-slate-800">Premium</span> includes everything in{' '}
                  <span className="font-semibold text-slate-800">Standard</span>, plus Assessments 4–5, cohort depth,
                  consulting-style support, and partnership benefits listed above.
                </p>
              </div>
            </div>
          </section>

          <section data-landing-reveal className="mt-10 sm:mt-12">
            <h4 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Plans &amp; pricing</h4>
            <p className="mx-auto mt-2 max-w-xl text-center text-xs text-slate-600 sm:text-sm">
              Three annual tiers. Higher plans unlock more assessments, analytics, and institutional support.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {SCHOOL_INSTITUTIONAL_PLAN_MATRIX.map((row) => {
                const ui = INSTITUTIONAL_PLAN_CARD_UI[row.id];
                return (
                <div
                  key={row.id}
                  className={`relative flex h-full min-h-0 flex-col rounded-2xl px-4 py-3 shadow-sm ring-1 ring-slate-100 transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-md hover:ring-2 hover:ring-[#1e3a8a]/30 sm:px-5 sm:py-4 ${ui.bg} ${
                    ui.popular ? 'ring-2 ring-[#1e3a8a]/50 shadow-md' : ''
                  }`}
                >
                  {ui.popular ? (
                    <div className="absolute -top-3 right-4 rounded-full bg-[#fbbf24] px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-900 shadow">
                      Popular
                    </div>
                  ) : null}
                  <div>
                    <p className="text-sm font-semibold text-slate-900 sm:text-base">{row.name}</p>
                    <p className="mt-1 text-xs text-slate-600 sm:text-sm">{INSTITUTIONAL_PLAN_STUDENT_LIMIT[row.id]}</p>
                  </div>
                  <p className="mt-3 text-base font-semibold sm:text-lg" style={{ color: GYS_BLUE }}>
                    {SCHOOL_INSTITUTIONAL_PRICE_LANDING[row.id]}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {INSTITUTIONAL_LANDING_PLAN_CARD_BLURBS[row.id]}
                  </p>
                </div>
                );
              })}
            </div>
            <p className="mt-6 text-center text-xs text-slate-500 sm:text-sm">
              Applicable taxes may be added at checkout. Final roster terms are confirmed during registration.
            </p>
          </section>
          </div>

         

          {/* EducationWorld strip */}
          <section id="schools-ew" data-landing-reveal className="mt-10 sm:mt-12">
            <div className="rounded-2xl bg-[#eef4ff] px-4 py-4 shadow-sm sm:px-5 sm:py-4 md:px-6 md:py-5">
              <div className="flex items-center gap-4 sm:gap-5">
                <img
                  src="/EW%20logo.png"
                  alt="EducationWorld"
                  className="h-24 w-auto max-w-[11rem] shrink-0 object-contain sm:h-28 sm:max-w-[13rem]"
                />
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-slate-900 sm:text-base">
                    Presented by EducationWorld
                  </p>
                  <p className="mt-1.5 text-xs leading-snug text-slate-700 sm:text-sm sm:leading-relaxed">
                    India&apos;s most trusted name in school assessment and ranking. Your data, our
                    expertise. For the past 20 years, the annual EducationWorld India School Rankings,
                    the world&apos;s largest and most comprehensive schools survey, has stimulated and
                    motivated institutional managements to strive for delivering balanced holistic
                    education and benchmark themselves with globally admired schools.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Partner quote */}
          <section id="schools-quote" data-landing-reveal className="mt-8 sm:mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              From Our Partners
            </p>
            <div className="mt-3 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100 sm:px-6 sm:py-5">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                “Indian schools are world-class but have never had a way to prove it on the
                global stage. GYS gives every school in our network the data to demonstrate
                what we&apos;ve always known - that our students compete with the best
                anywhere.”
              </p>
              <p className="mt-3 text-xs font-semibold text-slate-600 sm:text-sm">
                - Bhavin Shah, CEO, EducationWorld
              </p>
            </div>
          </section>

          <div data-landing-reveal>
            <LandingFaq
              id="faq"
              title="GYS - Frequently Asked Questions"
              sections={schoolFaqSections}
              className="mt-12 sm:mt-14"
            />
          </div>

          {/* Final CTAs */}
          <section
            id="for-schools-next-step"
            data-landing-reveal
            className="mt-10 scroll-mt-28 sm:mt-12"
          >
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
                onClick={() => navigate('/for-schools/register')}
                className="flex w-full items-center justify-center rounded-2xl border-2 border-[#1e3a8a] bg-white px-4 py-3 text-sm font-semibold text-[#1e3a8a] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[#f8fafc] active:scale-[0.98] transition-all duration-200 sm:text-base"
              >
                Register Your School →
              </button>
            </div>
            <p className="pt-4 text-center text-xs text-slate-500 sm:text-sm">
              Already registered? School administrators can log in with the school email addresses you
              provided at registration and complete password setup from the secure link in their
              inbox.
            </p>
          </section>
        </div>
      </main>

      <LandingSiteFooter />
    </div>
  );
};

export default ForSchoolsPage;
