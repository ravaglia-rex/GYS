import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Globe2,
  MonitorPlay,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import LandingSiteFooter from '../../components/layout/LandingSiteFooter';
import PublicSamplesNavMenu from '../../components/layout/PublicSamplesNavMenu';
import { LandingHeaderScrollProgress, LandingSectionRail } from '../../components/landing/LandingScrollChrome';
import { GYS_BLUE, GYS_GOLD } from '../../constants/gysBrand';
import {
  useLandingRevealInContainer,
  useLandingScrollProgress,
  useLandingSectionSpy,
} from '../../hooks/useLandingPageScroll';

const PA_NAV = [
  { id: 'pa-hero', label: 'Home' },
  { id: 'pa-measure', label: 'Suite' },
  { id: 'pa-adaptive', label: 'Adaptive' },
  { id: 'pa-grow', label: 'Levels' },
  { id: 'performance-tiers', label: 'Tiers' },
  { id: 'school-leaderboard', label: 'Leaderboard' },
  { id: 'pa-integrity', label: 'Integrity' },
  { id: 'pa-cta', label: 'Next' },
] as const;

const PA_SECTION_IDS_JOIN = PA_NAV.map((s) => s.id).join('|');

/** Rev 13 - three groupings: Reasoning (1–3), Skills (4–5), Insight (6–7). */
const ASSESSMENTS = [
  {
    n: 1,
    title: 'Symbolic Reasoning',
    tag: 'Group A • Reasoning',
    desc: 'The entry point for every GYS student. Measures non-verbal pattern recognition, sequence completion, and abstract logical reasoning: the kind of thinking that underlies all higher-order problem solving.',
    highlights: ['Patterns', 'Abstract logic', 'Visual reasoning'],
    icon: '🔢',
    stripe: '#3b82f6',
    band: 'from-sky-50 to-white',
  },
  {
    n: 2,
    title: 'Verbal Reasoning',
    tag: 'Group A • Reasoning',
    desc: 'Evaluates language-based logic: analogies, reading comprehension, inference, and argument analysis. Not a vocabulary test, but a test of how precisely a student can read and think in English.',
    highlights: ['Analogies', 'Comprehension', 'Argument analysis'],
    icon: '📚',
    stripe: '#6366f1',
    band: 'from-indigo-50 to-white',
  },
  {
    n: 3,
    title: 'Mathematical Reasoning',
    tag: 'Group A • Reasoning',
    desc: 'Quantitative problem-solving, data interpretation, and mathematical logic. Focuses on how students reason with numbers and structured information, not whether they have memorized a formula.',
    highlights: ['Quantitative', 'Data interpretation', 'Logic'],
    icon: '📐',
    stripe: '#8b5cf6',
    band: 'from-violet-50 to-white',
  },
  {
    n: 4,
    title: 'English Proficiency',
    tag: 'Group B • Skills',
    desc: 'Evaluates reading, writing, listening, and comprehension for academic and professional English fluency. Designed to reflect the communication demands of top universities and the workplace.',
    highlights: ['Reading', 'Writing', 'Listening', 'Comprehension'],
    icon: '💬',
    stripe: '#14b8a6',
    band: 'from-teal-50 to-white',
  },
  {
    n: 5,
    title: 'AI Proficiency',
    tag: 'Group B • Skills',
    desc: 'Measures understanding of AI concepts, computational thinking, and the ability to interact productively with AI tools. Scenario-based, not a coding test. Built independently by the GYS team for the India context.',
    highlights: ['AI concepts', 'Computational thinking', 'Scenario-based'],
    icon: '🤖',
    stripe: '#f59e0b',
    band: 'from-amber-50 to-white',
  },
  {
    n: 6,
    title: 'Comprehensive Personality Assessment',
    tag: 'Group C • Insight',
    desc: 'A psychometric evaluation across roughly 30 personality dimensions using self-report and situational judgment. There are no right or wrong answers; the result is a multi-dimensional behavioral profile. Results are private to the student and their family.',
    highlights: ['~30 dimensions', 'No right answers', 'Private to family'],
    icon: '✨',
    stripe: '#ec4899',
    band: 'from-pink-50 to-white',
  },
  {
    n: 7,
    title: 'Comprehensive Interest Inventory & Career Discovery',
    tag: 'Group C • Insight',
    desc:
      'Maps interests and career themes to support stream exploration and establish the Insight baseline for ongoing AI career counseling. Pairs with personality and reasoning signals; after Guided Decision, students keep enriching the counseling profile by logging real-world experiences.',
    highlights: ['Interests', 'Career themes', 'Baseline for counseling'],
    icon: '🧭',
    stripe: '#a855f7',
    band: 'from-purple-50 to-white',
  },
] as const;

const PublicAssessmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const pageRootRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useLandingScrollProgress();
  const activeSectionId = useLandingSectionSpy(PA_SECTION_IDS_JOIN);
  useLandingRevealInContainer(pageRootRef);

  const goToHomepage = () => {
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate('/');
  };

  const goInstitutionalSubscriptions = () =>
    navigate('/for-schools', { state: { scrollToId: 'institutional-packages' } });

  return (
    <div ref={pageRootRef} className="min-h-screen overflow-x-clip bg-slate-50 text-slate-900">
      <LandingSectionRail sections={PA_NAV} activeSectionId={activeSectionId} />
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur relative">
        <LandingHeaderScrollProgress scrollProgress={scrollProgress} />
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-3 sm:gap-6">
          <button
            type="button"
            onClick={goToHomepage}
            className="flex items-center gap-3 text-left group"
            aria-label="Go to homepage"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-sm font-bold text-white transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md"
              style={{ backgroundColor: GYS_BLUE }}
            >
              GYS
            </div>
            <div>
              <h1 className="hidden font-bold tracking-tight text-gray-900 sm:block sm:text-lg">
                Global Young Scholar
              </h1>
              <p className="text-xs text-gray-500">
                Powered by Argus, Access USA, EducationWorld
              </p>
            </div>
          </button>
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
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-medium shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-150"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      <main>
        <section
          id="pa-hero"
          className="relative overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] px-6 pb-20 pt-12 text-white sm:pb-24 sm:pt-16"
        >
          <div className="landing-hero-mesh" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-6 top-10 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl md:left-20" />
            <div className="absolute bottom-0 right-6 h-56 w-56 rounded-full bg-indigo-400/10 blur-2xl md:right-24" />
          </div>
          <div className="relative z-[1] mx-auto max-w-3xl text-center">
            <p className="landing-hero-enter-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Assessment Suite
            </p>
            <h2 className="landing-hero-enter-2 mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-[2.35rem]">
              Seven Exams.{' '}
              <span style={{ color: GYS_GOLD }}>One Global Benchmark.</span>
            </h2>
            <p className="landing-hero-enter-3 mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/88 sm:text-base">
              Three exam groups (Reasoning, Skills, and Insight) for grades 6–12, normed globally. Profiles for
              students; cohort insight for schools.
            </p>
            <div className="landing-hero-enter-4 mx-auto mt-5 flex max-w-lg flex-wrap justify-center gap-2">
              <span className="landing-hero-chip rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                Practice Mode
              </span>
              <span className="landing-hero-chip rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                Grades 6–12
              </span>
              <span className="landing-hero-chip rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                Global benchmark
              </span>
            </div>
            <div className="landing-hero-enter-4 mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/students')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:text-base"
                style={{ backgroundColor: GYS_GOLD }}
              >
                I&apos;m a Student
                <ArrowRight className="h-5 w-5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={goInstitutionalSubscriptions}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/70 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:text-base"
              >
                I&apos;m a School
                <ArrowRight className="h-5 w-5 shrink-0" />
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

        <section
          id="pa-measure"
          data-landing-reveal
          className="mx-auto max-w-5xl px-6 py-12 sm:py-14"
        >
          <div className="flex flex-col gap-3 text-center sm:gap-4">
            <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">What We Measure</h3>
            <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
              <span className="font-semibold text-slate-800">Group A - Reasoning</span> (Exams 1–3) is the Reasoning Triad.
              <span className="font-semibold text-slate-800"> Group B - Skills</span> adds English and AI Proficiency (4–5).
              <span className="font-semibold text-slate-800"> Group C - Insight</span> (6–7) unlocks with Guided Decision and
              establishes the baseline for ongoing AI career counseling; the relationship continues as students log new experiences on the platform.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {ASSESSMENTS.map((a) => (
              <article
                key={a.n}
                className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br ${a.band} p-5 pl-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div
                  className="absolute bottom-0 left-0 top-0 w-[5px] rounded-l-2xl"
                  style={{ backgroundColor: a.stripe }}
                  aria-hidden
                />
                <div className="pl-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xl" aria-hidden>
                      {a.icon}
                    </span>
                    <span
                      className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded px-1.5 text-[0.65rem] font-bold text-white"
                      style={{ backgroundColor: GYS_BLUE }}
                    >
                      {a.n}
                    </span>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                      {a.tag}
                    </span>
                  </div>
                  <h4 className="mt-3 text-lg font-bold text-slate-900">{a.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.highlights.map((h) => (
                      <span
                        key={h}
                        className="rounded-full bg-white/90 px-2.5 py-1 text-[0.7rem] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/90"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="pa-adaptive"
          data-landing-reveal
          className="border-y border-slate-200 bg-white py-12 sm:py-14"
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Adaptive Exams</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Difficulty responds as you answer: harder items when you’re strong, reinforcement when you need
                it. Fair, comparable sessions.
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-sm font-semibold text-[#1e3a8a] ring-1 ring-[#1e3a8a]/15">
                <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
                Calibrated Difficulty • Fewer Wasted Questions • Precise Tier Placement
              </span>
            </div>
          </div>
        </section>

        <section
          id="pa-grow"
          data-landing-reveal
          className="mx-auto max-w-5xl px-6 py-12 sm:py-14"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">Designed to grow with you</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Each reasoning domain has three difficulty levels. As students master one, the next unlocks, with
              harder questions written for older, more advanced students. High scorers keep moving forward, all
              within the same subscription year.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                level: 'Level 1',
                stripe: '#3b82f6',
                body: 'Entry-level questions calibrated for younger and newer students. Where most students begin.',
              },
              {
                level: 'Level 2',
                stripe: '#6366f1',
                body: 'Unlocked by strong performance at Level 1. Harder questions appropriate for older or more advanced students.',
              },
              {
                level: 'Level 3',
                stripe: '#8b5cf6',
                body: 'The highest challenge level. Reserved for students who demonstrate exceptional mastery at Level 2.',
              },
            ].map(({ level, stripe, body }) => (
              <div
                key={level}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6"
                style={{ borderLeftWidth: 5, borderLeftColor: stripe }}
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Difficulty</p>
                <h4 className="mt-2 text-lg font-bold text-slate-900">{level}</h4>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="pa-how"
          data-landing-reveal
          className="border-y border-slate-200 bg-white py-12 sm:py-14"
        >
          <div className="mx-auto max-w-3xl px-6">
            <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">How It Works</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Browser-based, integrity-ready. Students test on their schedule; schools get cohort exports and
              dashboards.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                {
                  Icon: MonitorPlay,
                  title: 'Online, Structured Sessions',
                  text: 'Clear pacing, autosave, and accessibility-aware layouts.',
                },
                {
                  Icon: ShieldCheck,
                  title: 'Proctoring-Ready',
                  text: 'Designed for fair, comparable results across environments.',
                },
                {
                  Icon: Globe2,
                  title: 'Global Norms',
                  text: 'Scores interpreted against international college-bound cohorts.',
                },
                {
                  Icon: ClipboardCheck,
                  title: 'Actionable Reporting',
                  text: 'Subscores, growth signals, and guidance, not just a percentile.',
                },
              ].map(({ Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#1e3a8a]"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Performance Tiers - national-normed (aligned with LandingPage Rev 13) */}
        <section
          id="performance-tiers"
          data-landing-reveal
          className="scroll-mt-20 bg-white pb-10 pt-10 md:pb-12 md:pt-12"
        >
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h3 className="text-2xl font-bold text-gray-900 md:text-3xl">Performance Tiers</h3>
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-gray-200 bg-slate-50/80 p-5 text-left shadow-sm md:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Two lenses: leaderboard vs Performance Tier
              </p>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700">
                <p>
                  <strong>School leaderboard:</strong> per exam, per grade, within the school. School leaderboards show who are the top performers by grade on each official exam at that school.
                  <p className="shrink-0 font-semibold text-gray-900">Trial Membership
                <span> is excluded. Eligibility starts at <strong>Reasoning Triad</strong>{' '}
                  and above.
                </span></p>
                </p>
                <p>
                  <strong>Performance Tier:</strong> Performance Tier is the nationwide read. After the official Reasoning Triad, each student receives a band from Explorer (baseline) through Bronze, Silver, Gold, Platinum, and Diamond. Bands are national-normed against a growing reference cohort.
                </p>
              </div>
            </div>
            <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:mt-10 lg:grid-cols-6">
              {[
                {
                  name: 'Explorer',
                  bg: 'bg-[#F0E9F8]',
                  text: 'text-[#5E35B1]',
                  border: 'border-[#D1C4E9]',
                  icon: <span className="text-2xl md:text-3xl">🧭</span>,
                },
                {
                  name: 'Bronze',
                  bg: 'bg-[#ffe4d6]',
                  text: 'text-[#b5561c]',
                  border: 'border-[#ea580c]',
                  icon: <span className="text-2xl md:text-3xl">🥉</span>,
                },
                {
                  name: 'Silver',
                  bg: 'bg-[#f3f4f6]',
                  text: 'text-gray-700',
                  border: 'border-gray-400',
                  icon: <span className="text-2xl md:text-3xl">🥈</span>,
                },
                {
                  name: 'Gold',
                  bg: 'bg-[#fef3c7]',
                  text: 'text-[#b45309]',
                  border: 'border-[#f59e0b]',
                  icon: <span className="text-2xl md:text-3xl">🥇</span>,
                },
                {
                  name: 'Platinum',
                  bg: 'bg-[#e0f2fe]',
                  text: 'text-[#0369a1]',
                  border: 'border-sky-400',
                  icon: <span className="text-2xl md:text-3xl">✦</span>,
                },
                {
                  name: 'Diamond',
                  bg: 'bg-[#ede9fe]',
                  text: 'text-[#5b21b6]',
                  border: 'border-violet-400',
                 
                  icon: <span className="text-2xl md:text-3xl">💎</span>,
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`flex min-h-[100px] flex-col items-center justify-center rounded-xl border p-4 shadow-sm transition-all duration-150 hover:-translate-y-1 hover:shadow-md md:min-h-[120px] md:p-5 ${tier.border} ${tier.bg} ${tier.text}`}
                >
                  {tier.icon && <span className="mb-1 md:mb-2">{tier.icon}</span>}
                  <span className="text-sm font-bold md:text-lg">{tier.name}</span>
                </div>
              ))}
            </div>
           
          </div>
        </section>

    

        <section id="pa-integrity" data-landing-reveal className="bg-white py-12 sm:py-14">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md ring-1 ring-slate-100 sm:p-8 md:p-10">
              <div className="grid gap-10 md:grid-cols-2 md:gap-12 md:items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Built for integrity</h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                    A GYS credential is only valuable if it&apos;s trusted. Our AI-driven assessment integrity system
                    protects the results without requiring students to sit for a test in a specific location or on
                    a specific device.
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                    The system works quietly in the background. Students focus on the questions.
                  </p>
                </div>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/80">
                  {[
                    'Adaptive sampling: every student sees a unique mix of questions from a large bank.',
                    'Pattern analysis of response timing and answer-change behavior.',
                    'AI inference to flag statistical irregularities in real time.',
                    'No question is ever shown to the same student twice.',
                    'Continuous monitoring: confidence in every score we report.',
                  ].map((line) => (
                    <li key={line} className="flex gap-3 px-4 py-3.5 text-sm text-slate-700 sm:text-[0.9375rem]">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="pa-cta" data-landing-reveal className="mx-auto max-w-3xl px-6 py-14 text-center">
          <p className="text-lg font-semibold text-slate-900 sm:text-xl">Ready to Go Deeper?</p>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Students: pricing & levels. Schools: Entry / Standard / Premium, or book a walkthrough.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="rounded-xl border-2 px-6 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:text-base"
              style={{ borderColor: GYS_BLUE, color: GYS_BLUE }}
            >
              For Students - Pricing &amp; Levels
            </button>
            <button
              type="button"
              onClick={goInstitutionalSubscriptions}
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:text-base"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Institutional Subscriptions
            </button>
          </div>
        </section>
      </main>

      <LandingSiteFooter />
    </div>
  );
};

export default PublicAssessmentsPage;
