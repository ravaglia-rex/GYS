import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LandingPublicHeader from '../../components/layout/LandingPublicHeader';
import LandingSiteFooter from '../../components/layout/LandingSiteFooter';
import LandingFaq from '../../components/landing/LandingFaq';
import { LandingSectionRail } from '../../components/landing/LandingScrollChrome';
import { GYS_BLUE, GYS_GOLD } from '../../constants/gysBrand';
import {
  useLandingRevealInContainer,
  useLandingScrollProgress,
  useLandingSectionSpy,
} from '../../hooks/useLandingPageScroll';
import { studentFaqSections } from './faq/studentFaqSections';
import { getPreviewSampleAssessmentPath, DEFAULT_PREVIEW_SAMPLE_EXAM_ID } from '../../data/previewSampleAssessments';

const STUDENT_NAV = [
  { id: 'sp-hero', label: 'Home' },
  { id: 'sp-get', label: 'Benefits' },
  { id: 'argus-coins', label: 'Argus Coins' },
  { id: 'assessments', label: 'Exams' },
  { id: 'sp-plans', label: 'Plans' },
  { id: 'sp-economics', label: 'Upgrades' },
  { id: 'sp-ew', label: 'Partners' },
  { id: 'student-faq', label: 'FAQ' },
] as const;

const MEMBERSHIP_TIER_LABELS = [
  'Discovery',
  'Reasoning Triad',
  'Stream Ready',
  'Career Ready',
] as const;

const STUDENT_SECTION_IDS_JOIN = STUDENT_NAV.map((s) => s.id).join('|');

/** Discovery + three annual memberships; exams in Reasoning / Profile / Pathways tracks. */
const STUDENT_ASSESSMENTS = [
  {
    exam: 1,
    group: 'reasoning' as const,
    label: 'Symbolic Reasoning',
    shortName: 'Symbolic',
    desc: 'Patterns, rules, and structured logic (also shown as Pattern & Logic)',
    icon: '🔢',
    inL1: true,
    inL2: true,
    inL3: true,
    inL4: true,
  },
  {
    exam: 2,
    group: 'reasoning' as const,
    label: 'Verbal Reasoning',
    shortName: 'Verbal',
    desc: 'Meaning, inference, and argument from text',
    icon: '📚',
    inL1: false,
    inL2: true,
    inL3: true,
    inL4: true,
  },
  {
    exam: 3,
    group: 'reasoning' as const,
    label: 'Mathematical Reasoning',
    shortName: 'Math',
    desc: 'Number sense, logic, and quantitative thinking',
    icon: '📐',
    inL1: false,
    inL2: true,
    inL3: true,
    inL4: true,
  },
  {
    exam: 4,
    group: 'profile' as const,
    label: 'Personality and Interest',
    shortName: 'Personality',
    desc: 'Deep profile across many dimensions (~30) for early stream recommendations',
    icon: '✨',
    inL1: false,
    inL2: false,
    inL3: true,
    inL4: true,
  },
  {
    exam: 5,
    group: 'profile' as const,
    label: 'AI Proficiency',
    shortName: 'AI',
    desc: 'Concepts, evaluation, and responsible use of AI tools',
    icon: '🤖',
    inL1: false,
    inL2: false,
    inL3: true,
    inL4: true,
  },
  {
    exam: 6,
    group: 'pathways' as const,
    label: 'English Proficiency',
    shortName: 'English',
    desc: 'Listening, speaking, reading, writing, AI-assessed where applicable',
    icon: '💬',
    inL1: false,
    inL2: false,
    inL3: false,
    inL4: true,
  },
  {
    exam: 7,
    group: 'pathways' as const,
    label: 'Career Discovery',
    shortName: 'Career',
    desc: 'Interest themes and career discovery; establishes the baseline for ongoing AI career counseling',
    icon: '🧭',
    inL1: false,
    inL2: false,
    inL3: false,
    inL4: true,
  },
] as const;

const TIER_HEADERS = [
  { key: 'L1' as const, title: MEMBERSHIP_TIER_LABELS[0], tint: 'bg-sky-100 text-sky-950' },
  { key: 'L2' as const, title: MEMBERSHIP_TIER_LABELS[1], tint: 'bg-amber-100 text-amber-950' },
  { key: 'L3' as const, title: MEMBERSHIP_TIER_LABELS[2], tint: 'bg-sky-100 text-sky-950' },
  { key: 'L4' as const, title: MEMBERSHIP_TIER_LABELS[3], tint: 'bg-purple-100 text-purple-950' },
];

const ASSESSMENT_SECTIONS: {
  group: (typeof STUDENT_ASSESSMENTS)[number]['group'];
  title: string;
  hint: string;
}[] = [
  {
    group: 'reasoning',
    title: 'Reasoning',
    hint: 'Exams 1–3',
  },
  {
    group: 'profile',
    title: 'Profile',
    hint: 'Exams 4–5',
  },
  {
    group: 'pathways',
    title: 'Pathways',
    hint: 'Exams 6–7',
  },
];

const StudentPathPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageRootRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useLandingScrollProgress();
  const activeSectionId = useLandingSectionSpy(STUDENT_SECTION_IDS_JOIN);
  useLandingRevealInContainer(pageRootRef);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    const target = document.getElementById(hash);
    if (!target) return;
    // Delay to allow lazy-loaded content/layout to settle before scrolling.
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

  return (
    <div ref={pageRootRef} className="min-h-screen overflow-x-clip bg-slate-50 text-slate-900">
      <LandingSectionRail sections={STUDENT_NAV} activeSectionId={activeSectionId} />
      <LandingPublicHeader
        scrollProgress={scrollProgress}
        signUp={{ show: true, path: '/signup', variant: 'filled' }}
      />

      <main className="pb-12">
        {/* Hero band - full width, matching landing page */}
        <section
          id="sp-hero"
          className="relative overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] px-6 pb-20 pt-12 text-white sm:pb-24 sm:pt-16"
        >
          <div className="landing-hero-mesh" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.14)_0%,_transparent_55%)]" />
          <div className="relative z-[1] mx-auto max-w-4xl text-center">
            <p className="landing-hero-enter-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">
              For students &amp; families
            </p>
            <h1 className="landing-hero-enter-2 mt-3 text-3xl font-bold leading-snug sm:text-4xl">
              Discover Your Strengths.{' '}
              <span
                className="inline-block transition-transform duration-300 hover:scale-105"
                style={{ color: GYS_GOLD }}
              >
                Build Your Future.
              </span>
            </h1>
            <p className="landing-hero-enter-3 mx-auto mt-4 max-w-2xl text-center text-sm text-white/90 sm:text-base">
              GYS helps students in Classes 6–12 understand how they think, where they stand, and what they may be
              ready for next. Through official assessments in reasoning, English, AI proficiency, personality, and
              career discovery, students receive clear reports, performance tiers, guidance for stream selection,
              career exploration, and university fit.
            </p>
            <div className="landing-hero-enter-4 mx-auto mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              <span className="landing-hero-chip rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                Practice Mode
              </span>
              <span className="landing-hero-chip rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                Classes 6–12
              </span>
              <span className="landing-hero-chip rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                National norms
              </span>
            </div>
            <div className="landing-hero-enter-4 mt-8 flex max-w-xl flex-col items-stretch justify-center gap-3 sm:mx-auto sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() =>
                  navigate('/students/preview/dashboard', {
                    state: { studentPreviewExitTo: '/students' },
                  })
                }
                className="rounded-xl border-2 border-white/80 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.99]"
              >
                Try sample dashboard
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(getPreviewSampleAssessmentPath(DEFAULT_PREVIEW_SAMPLE_EXAM_ID), {
                    state: { sampleAssessmentExitTo: '/students' },
                  })
                }
                className="rounded-xl border-2 border-white/80 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.99]"
              >
                Try sample assessments - no account
              </button>
            </div>
         
            <button
              type="button"
              onClick={() => navigate('/about/assessments')}
              className="landing-hero-enter-4 mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/95 underline-offset-4 transition hover:text-white hover:underline"
            >
              Learn more about the assessments
              <ArrowRight className="h-4 w-4" />
            </button>
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

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* What you get */}
        <section id="sp-get" data-landing-reveal className="mt-12 text-center sm:mt-16">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What You Get</h2>
          <div className="mt-10 sm:mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {[
              {
                icon: '🌍',
                title: 'National & Global Benchmarking',
                body:
                  'See how your performance compares with students across India and with a broader population of college-bound students internationally.',
              },
              {
                icon: '🧠',
                title: 'Seven Assessments Across Three Tracks',
                body:
                  'GYS includes three tracks: Reasoning, Profile, and Pathways. Higher memberships unlock deeper assessments and more personalized guidance.',
              },
              {
                icon: '📊',
                title: 'Detailed Reports',
                body:
                  'Receive score reports with category-level breakdowns, strengths, growth areas, and recommendations for what to focus on next.',
              },
              {
                icon: '🧭',
                title: 'Stream, Career & University Guidance',
                body:
                  'Use your results to support important decisions about academic streams, career pathways, and future university fit.',
              },
              {
                icon: '🎯',
                title: 'Targeted Learning Recommendations',
                body:
                  'Where relevant, GYS may recommend courses or learning resources from Access USA to help students strengthen specific areas.',
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className={[
                  'group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:px-5 sm:py-4 transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg hover:ring-slate-200 cursor-default',
                  'lg:col-span-2',
                  index === 3 ? 'lg:col-start-2' : '',
                  index === 4 ? 'lg:col-start-4' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="absolute inset-x-0 top-0 h-1 transition-all duration-300 group-hover:h-1.5" style={{ backgroundColor: GYS_BLUE }} />
                <div className="pt-3 text-center sm:pt-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base leading-none sm:text-lg transition-transform duration-300 group-hover:scale-110 inline-block" aria-hidden="true">
                      {item.icon}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{item.title}</h3>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 sm:text-sm">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="argus-coins" data-landing-reveal className="mt-12 scroll-mt-20 text-center sm:mt-16">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Earn Argus Coins, Build Streaks, Win Rewards</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Stay engaged every day with Question of the Day, login streaks, and Argus Coins you can redeem for gift cards from Amazon, Starbucks, Flipkart, and more.
          </p>
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: '🪙', title: 'Earn Coins', body: 'Complete exams, practice thoughtfully, and solve the daily question to earn Argus Coins.' },
              { icon: '🔥', title: 'Daily Streaks', body: 'Log in and answer Question of the Day every day to build login and QotD streaks with milestone bonuses.' },
              { icon: '🎁', title: 'Redeem Rewards', body: 'Trade coins for gift cards and perks in the Rewards Shop - the more consistent you are, the bigger the payoff.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-100">
                <div className="text-3xl">{item.icon}</div>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Assessments - full width grey band */}
        <section
          id="assessments"
          data-landing-reveal
          className="relative left-1/2 right-1/2 -ml-[50vw] mt-12 w-screen scroll-mt-20 border-y border-slate-200 bg-slate-100 py-8 text-center sm:mt-16 sm:py-10"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">The Assessments</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              GYS includes seven official assessments across three tracks. Each row is an exam (name + what it
              measures). Checkmarks show which membership includes it.{' '}
             
            </p>

            <div className="mx-auto mt-6 space-y-3 text-left sm:hidden">
              {ASSESSMENT_SECTIONS.map((section) => {
                const rows = STUDENT_ASSESSMENTS.filter((a) => a.group === section.group);
                const accent =
                  section.group === 'reasoning'
                    ? GYS_BLUE
                    : section.group === 'profile'
                      ? '#ec4899'
                      : '#14b8a6';

                return (
                  <div key={section.group} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-l-4 bg-slate-50 px-4 py-3" style={{ borderLeftColor: accent }}>
                      <p className="text-sm font-bold text-slate-900">{section.title}</p>
                      <p className="text-xs text-slate-600">{section.hint}</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {rows.map((row) => {
                        const includedTiers = [row.inL1, row.inL2, row.inL3, row.inL4]
                          .map((included, i) => (included ? TIER_HEADERS[i] : null))
                          .filter((tier): tier is (typeof TIER_HEADERS)[number] => tier !== null);

                        return (
                          <article key={row.exam} className="px-4 py-4">
                            <div className="flex gap-3">
                              <span className="mt-0.5 shrink-0 text-xl leading-none" aria-hidden="true">
                                {row.icon}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded px-1 text-[0.65rem] font-bold text-white"
                                    style={{ backgroundColor: GYS_BLUE }}
                                  >
                                    {row.exam}
                                  </span>
                                  <h3 className="text-base font-bold leading-tight text-slate-900">{row.label}</h3>
                                </div>
                                <p className="mt-1 text-sm leading-relaxed text-slate-600">{row.desc}</p>
                                <div className="mt-3">
                                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">
                                    Included in
                                  </p>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {includedTiers.map((tier) => (
                                      <span
                                        key={tier.key}
                                        className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold leading-none ${tier.tint}`}
                                      >
                                        {tier.title}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xs leading-relaxed text-slate-600 shadow-sm">
                <span className="font-semibold text-slate-800">Reasoning Triad</span> and above include the{' '}
                <span className="font-semibold text-slate-800">triad cross-synthesis</span> report when all three
                reasoning exams are complete.
              </p>
            </div>

            <div
              className="mx-auto mt-6 hidden max-w-4xl overflow-x-auto rounded-2xl border border-slate-200 bg-white text-left shadow-md ring-1 ring-slate-100 [-ms-overflow-style:none] [scrollbar-width:thin] sm:block"
              role="region"
              aria-label="Assessments and membership levels"
            >
              <div className="min-w-[320px]">
              {/* Column headers - compact */}
              <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,4.25rem))] gap-x-0.5 border-b border-slate-200 bg-slate-50 sm:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,5.25rem))] sm:gap-x-1">
                <div className="px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-2.5 sm:text-xs">
                  Assessment
                </div>
                {TIER_HEADERS.map((t) => (
                  <div
                    key={t.key}
                    className={`flex flex-col items-center justify-center px-0.5 py-1.5 text-center sm:py-2.5 ${t.tint}`}
                  >
                    <span className="text-[0.6rem] font-bold leading-tight sm:text-[0.65rem] hyphens-auto">
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>

              {ASSESSMENT_SECTIONS.map((section) => {
                const rows = STUDENT_ASSESSMENTS.filter((a) => a.group === section.group);
                const groupBand =
                  section.group === 'reasoning'
                    ? 'bg-gradient-to-r from-sky-50 via-indigo-50/60 to-transparent border-l-[3px] sm:border-l-4'
                    : section.group === 'profile'
                      ? 'bg-gradient-to-r from-pink-50/90 via-transparent to-transparent border-l-[3px] border-l-pink-300/80 sm:border-l-4'
                      : 'bg-gradient-to-r from-teal-50/90 via-transparent to-transparent border-l-[3px] border-l-teal-300/80 sm:border-l-4';

                return (
                  <div key={section.group}>
                    <div
                      className={`${groupBand} border-slate-200/80 px-3 py-2 sm:px-4`}
                      style={section.group === 'reasoning' ? { borderLeftColor: GYS_BLUE } : undefined}
                    >
                      <p className="text-xs font-bold text-slate-800 sm:text-sm">{section.title}</p>
                      <p className="text-[0.65rem] text-slate-600 sm:text-xs">{section.hint}</p>
                    </div>
                    {rows.map((row) => (
                      <div
                        key={row.exam}
                        className="grid grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,4.25rem))] items-center gap-x-0.5 border-b border-slate-100 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,5.25rem))] sm:gap-x-1"
                      >
                        <div className="flex min-w-0 gap-2.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2">
                          <span className="shrink-0 text-lg leading-none sm:text-xl" aria-hidden="true">
                            {row.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span
                                className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded px-1 text-[0.6rem] font-bold text-white sm:h-5 sm:text-[0.65rem]"
                                style={{ backgroundColor: GYS_BLUE }}
                              >
                                {row.exam}
                              </span>
                              <span className="text-sm font-semibold leading-tight text-slate-900">{row.label}</span>
                            </div>
                            <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-500 sm:text-xs">{row.desc}</p>
                          </div>
                        </div>
                        {[row.inL1, row.inL2, row.inL3, row.inL4].map((on, i) => (
                          <div
                            key={TIER_HEADERS[i].key}
                            className="flex h-full min-h-[2.75rem] items-center justify-center sm:min-h-0 sm:py-2"
                            aria-label={
                              on
                                ? `${row.label} included in ${TIER_HEADERS[i].title}`
                                : `${row.label} not in ${TIER_HEADERS[i].title}`
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
                <span className="font-semibold text-slate-800">Reasoning Triad</span> and above include the{' '}
                <span className="font-semibold text-slate-800">triad cross-synthesis</span> report when all three
                reasoning exams are complete.
              </p>
              </div>
            </div>
          </div>
        </section>

        {/* Membership levels */}
        <section id="sp-plans" data-landing-reveal className="mt-12 sm:mt-16">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl text-center">Plans &amp; Pricing</h2>
          <p className="mt-2 text-center text-xs text-slate-600 sm:text-sm max-w-xl mx-auto">
            One entry option and three annual memberships. Higher plans unlock more exams and guidance.
          </p>

          <div className="mt-8 sm:mt-10 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            {[
              {
                name: 'Discovery',
                subLabel: 'Exam 1 only · One-time entry',
                price: '₹299',
                blurb: 'A low-cost way to try GYS through the Symbolic Reasoning assessment.',
                bg: 'bg-[#e5f3ff]',
              },
              {
                name: 'Reasoning Triad',
                subLabel: 'Exams 1–3 · Annual membership',
                price: '₹899/year',
                blurb: 'Includes the full Reasoning track: Symbolic, Verbal, and Mathematical Reasoning.',
                bg: 'bg-[#fff7e0]',
              },
              {
                name: 'Stream Ready',
                subLabel: 'Exams 1–5 · Annual membership',
                price: '₹1,799/year',
                blurb: 'Includes the Reasoning track plus Personality and Interest and AI Proficiency for early stream recommendations.',
                bg: 'bg-[#e0f2fe]',
              },
              {
                name: 'Career Ready',
                subLabel: 'All seven exams · Annual membership',
                price: '₹2,699/year',
                blurb:
                  'Includes the full GYS suite - English Proficiency, Career Discovery, and ongoing AI-supported guidance.',
                bg: 'bg-[#f9e8ff]',
              },
            ].map((tier, index) => (
              <div
                key={index}
                className={`flex h-full min-h-0 flex-col rounded-2xl ${tier.bg} px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:px-5 sm:py-4 transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-md hover:ring-2 hover:ring-[#1e3a8a]/30 cursor-default`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 sm:text-base">{tier.name}</p>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm">{tier.subLabel}</p>
                </div>
                <p
                  className="mt-3 text-base font-semibold sm:text-lg"
                  style={{ color: GYS_BLUE }}
                >
                  {tier.price}
                </p>
                <p className="mt-2 text-xs text-slate-600 sm:text-sm leading-relaxed">{tier.blurb}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upgrade deltas (Rev 13 - Discovery credited; list price before applicable charges) */}
        <section id="sp-economics" data-landing-reveal className="mt-10 sm:mt-12">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl text-center">Upgrade Anytime</h2>
          <p className="mt-2 text-center text-xs text-slate-600 sm:text-sm max-w-xl mx-auto">
            If you upgrade after purchase, you pay only the difference in list
            price. Similarly, if your school paid for a particular membership level, you can upgrade to a higher level by paying the difference.
          </p>
          <div className="mt-4 mx-auto max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2 font-semibold text-slate-800">Upgrade</th>
                  <th className="px-3 py-2 font-semibold text-slate-800 text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {[
                  ['Discovery → Reasoning Triad', '₹600'],
                  ['Discovery → Stream Ready', '₹1,500'],
                  ['Discovery → Career Ready', '₹2,400'],
                  ['Reasoning Triad → Stream Ready', '₹900'],
                  ['Reasoning Triad → Career Ready', '₹1,800'],
                  ['Stream Ready → Career Ready', '₹900'],
                ].map(([u, d]) => (
                  <tr key={u} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2">{u}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Any applicable taxes, duties, or compliance charges are included unless separately stated at checkout.
          </p>
        </section>

        {/* EducationWorld - students & parents (aligned with main landing) */}
        <section id="sp-ew" data-landing-reveal className="mt-10 sm:mt-12">
          <div className="rounded-2xl bg-[#eef4ff] px-4 py-4 shadow-sm sm:px-5 sm:py-4 md:px-6 md:py-5">
            <div className="flex flex-col items-center gap-4 text-center md:grid md:grid-cols-[6.5rem_minmax(0,1fr)] md:items-center md:gap-4 md:text-left">
              <img
                src="/EW%20logo.png"
                alt="EducationWorld"
                className="h-24 w-auto max-w-[11rem] shrink-0 object-contain md:h-28 md:max-w-[8rem] md:-ml-5 md:justify-self-start"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 sm:text-base">
                  Presented by EducationWorld
                </p>
                <p className="mt-1.5 text-justify text-xs leading-snug text-slate-700 sm:text-sm sm:leading-relaxed">
                  Trusted by over 5,000 schools and millions of parents nationwide for its credible,
                  comprehensive and in-depth school rankings on a wide range of parameters including
                  academic reputation, teacher competence, co-curricular and sports education. For the
                  past 20 years, the annual EducationWorld India School Rankings, the world&apos;s
                  largest and most comprehensive schools survey, has aided and enabled parents to select
                  the most aptitudinally suitable school for their children.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div data-landing-reveal>
          <LandingFaq
            id="student-faq"
            title="Student / Family FAQs"
            sections={studentFaqSections}
            className="mt-12 sm:mt-16"
          />
        </div>

        {/* Final CTAs */}
        <section id="sp-signup" data-landing-reveal className="mt-12 sm:mt-16">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/students/register')}
              className="inline-flex w-full items-center justify-center rounded-2xl px-14 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] sm:text-base"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Sign up now
            </button>
            <p className="text-center text-sm text-slate-600 sm:text-base">
              Create your GYS student account, choose a membership, and complete secure payment to begin.
            </p>
          </div>
        </section>
        </div>
      </main>

      <LandingSiteFooter />
    </div>
  );
};

export default StudentPathPage;

