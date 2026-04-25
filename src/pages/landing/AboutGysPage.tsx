import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LandingSiteFooter from '../../components/layout/LandingSiteFooter';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { LandingHeaderScrollProgress, LandingSectionRail } from '../../components/landing/LandingScrollChrome';
import { GYS_BLUE, GYS_GOLD } from '../../constants/gysBrand';
import { useLandingScrollProgress, useLandingSectionSpy } from '../../hooks/useLandingPageScroll';

const DIFFERENTIATORS = [
  {
    emoji: '🌍',
    title: 'Globally benchmarked',
    body: 'Scores are calibrated against a growing normative population of college-bound students worldwide. You see readiness in global context, not only relative to classmates.',
  },
  {
    emoji: '🎯',
    title: 'Adaptive by design',
    body: 'Each counted exam adjusts difficulty in real time. Strong students keep moving forward; everyone finishes with a measure of ability instead of stalling on an artificial ceiling.',
  },
  {
    emoji: '📋',
    title: 'Practice Mode',
    body: 'Optional familiarity runs draw from a separate question pool (same adaptive feel). They do not affect official scores, performance tiers, or reports; only counted exams do.',
  },
  {
    emoji: '🧭',
    title: 'Guidance, not just grades',
    body: 'Reasoning, English and AI proficiency, personality, and career discovery combine into stream and career direction. After the Insight baseline, Guided Decision is built around an ongoing AI counseling relationship, not a one-off report dump.',
  },
  {
    emoji: '🏫',
    title: 'Recognized by schools',
    body: "GYS connects with EducationWorld's school rankings ecosystem, so participation aligns with how serious schools already measure excellence, not a disconnected one-off.",
  },
  {
    emoji: '🔁',
    title: 'Designed to grow with you',
    body: 'Each reasoning domain spans three difficulty levels within the program year. Master one level and the next unlocks, with harder prompts written for older, more advanced students.',
  },
  
] as const;

const AUDIENCES = [
  {
    grades: '6–8',
    title: 'Middle School',
    subtitle: 'Start exploring',
    body: 'Begin with Symbolic Reasoning. Practice Mode helps you learn adaptive pacing and screen logistics before counted exams (familiarity only); it does not change official scores.',
    tint: 'from-sky-50 to-white border-sky-200',
  },
  {
    grades: '8–12',
    title: 'Secondary',
    subtitle: 'Benchmark your reasoning',
    body: 'Complete the Reasoning Triad. Earn a performance tier. Get your first aptitude-based stream suggestions before Class 11 choices matter.',
    tint: 'from-amber-50/90 to-white border-amber-200',
  },
  {
    grades: '9–12',
    title: 'Senior Secondary',
    subtitle: 'Make informed decisions',
    body: 'Full assessment suite: after the Insight baseline, an ongoing AI-powered career counseling relationship, where students return to log labs, internships, classes, and other experiences so guidance stays current. Combine reasoning, skills, and insight into a holistic path forward.',
    tint: 'from-violet-50 to-white border-violet-200',
  },
] as const;

const OUTCOMES = [
  {
    emoji: '🏅',
    title: 'Performance tier',
    body: 'A recognized designation from Explorer through Gold, earned from official Reasoning Triad performance and benchmarked against college-bound peers worldwide.',
  },
  {
    emoji: '📊',
    title: 'Category-level reports',
    body: 'Clear strengths and growth areas by question category, not a single opaque score, so improvement has a map families and teachers can act on.',
  },
  {
    emoji: '🧭',
    title: 'Stream & career guidance',
    body: 'Recommendations that deepen as you complete more of the suite; at Guided Decision, counseling continues after exams as students add real-world experiences, so guidance stays current when they keep using the platform.',
  },
  {
    emoji: '🎓',
    title: 'University-ready credential',
    body: "A GYS profile framed for universities in India and the US and for schools in EducationWorld's rankings universe, globally legible and locally relevant.",
  },
] as const;

const ABOUT_NAV = [
  { id: 'about-hero', label: 'Home' },
  { id: 'about-what', label: 'What is GYS' },
  { id: 'about-practice', label: 'Practice' },
  { id: 'about-different', label: 'Difference' },
  { id: 'about-partnership', label: 'Mission' },
  { id: 'about-audience', label: 'Who it is for' },
  { id: 'about-outcomes', label: 'Outcomes' },
  { id: 'about-cta', label: 'Try' },
] as const;

const ABOUT_SECTION_IDS_JOIN = ABOUT_NAV.map((s) => s.id).join('|');

const AboutGysPage: React.FC = () => {
  const navigate = useNavigate();
  const scrollProgress = useLandingScrollProgress();
  const activeSectionId = useLandingSectionSpy(ABOUT_SECTION_IDS_JOIN);

  return (
    <div className="overflow-x-clip bg-slate-50 text-slate-900">
      <LandingSectionRail sections={ABOUT_NAV} activeSectionId={activeSectionId} />
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur relative">
        <LandingHeaderScrollProgress scrollProgress={scrollProgress} />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 sm:gap-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group -ml-1 flex items-center gap-1 rounded-lg px-1 py-0.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs transition-all duration-200 group-hover:border-slate-400">
              ←
            </span>
            <span className="hidden xs:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
              style={{ backgroundColor: GYS_BLUE }}
            >
              GYS
            </div>
            <div>
              <h1 className="hidden font-bold tracking-tight text-gray-900 sm:block sm:text-base">
                Global Young Scholar
              </h1>
              <p className="text-xs text-gray-500">
                Powered by Argus, Access USA, EducationWorld
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <PublicHomeNavButton />
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="shrink-0 rounded-xl px-4 py-2.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:brightness-110 active:scale-95 sm:px-5 sm:text-sm"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      <main>
        <section id="about-hero" className="bg-white">
          <div className="relative overflow-x-clip bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] px-6 pb-20 pt-12 text-white sm:pb-24 sm:pt-16">
            <div className="landing-hero-mesh" />
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-6 top-10 h-52 w-52 rounded-full bg-blue-400/10 blur-xl md:left-20" />
              <div className="absolute bottom-0 right-6 h-64 w-64 rounded-full bg-indigo-400/10 blur-xl md:right-24" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.12)_0%,_transparent_50%)]" />
            <div className="relative z-[1] mx-auto max-w-3xl text-center">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-[0.65rem]">
                About Global Young Scholar
              </p>
              <h2 className="mt-3 text-2xl font-bold leading-snug sm:mt-4 sm:text-3xl md:text-4xl md:leading-tight">
                <span className="text-white">Helping India&apos;s next generation</span>
                <br />
                <span
                  className="inline-block transition-transform duration-300 hover:scale-105"
                  style={{ color: GYS_GOLD }}
                >
                  discover what they&apos;re capable of.
                </span>
              </h2>
              <p className="mx-auto mt-8 max-w-2xl text-xs leading-relaxed text-white sm:text-sm md:mt-10">
                A rigorous, research-backed program for Grades 6–12: reveal strengths, guide stream and university
                decisions, and benchmark thinking against college-bound peers worldwide. Optional practice from a
                separate pool lets students settle into adaptive pacing; Practice Mode does not change official scores or tiers.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 md:mt-8">
                <span className="landing-hero-chip rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                  Practice Tests
                </span>
                <span className="landing-hero-chip rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                  Separate practice pool
                </span>
                <span className="landing-hero-chip rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                  Adaptive exams
                </span>
                <span className="landing-hero-chip rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                  Grades 6–12
                </span>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 leading-none text-white" aria-hidden>
              <svg className="landing-section-wave block w-full" viewBox="0 0 1440 96" preserveAspectRatio="none">
                <path
                  fill="currentColor"
                  d="M0,96 L0,28 C240,8 480,88 720,48 C960,8 1200,72 1440,36 L1440,96 Z"
                />
              </svg>
            </div>
          </div>

          <div
            id="about-initiative"
            className="relative z-[1] -mt-px bg-white px-6 py-5 sm:py-6"
          >
            <div className="mx-auto flex max-w-4xl flex-row flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center sm:gap-x-14 md:gap-x-16">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-[0.65rem] sm:tracking-[0.18em]">
                A Joint Initiative Of
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 sm:gap-x-14 md:gap-x-16">
                {['Access USA', 'Argus', 'Education World'].map((name) => (
                  <span key={name} className="text-sm font-bold text-[#1a2b4c] sm:text-base">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="about-what" className="mx-auto max-w-3xl px-6 py-14 sm:py-16">
          <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">What Is GYS?</h3>
          <div className="mt-6 space-y-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
            <p>
              <span className="font-semibold text-slate-800">Global Young Scholar (GYS)</span> is an AI-driven
              assessment platform for understanding aptitudes, personality, and readiness. Across up to seven
              adaptive assessments it builds a multi-dimensional picture of each student, then translates
              results into clear guidance on streams, careers, and university fit.
            </p>
            <p>
              The <span className="font-semibold text-slate-800">Reasoning Triad</span> (Symbolic, Verbal, and
              Mathematical Reasoning) benchmarks core thinking. After official triad runs, students earn a{' '}
              <span className="font-semibold text-slate-800">Performance Tier</span> band (Explorer as baseline,
              then Bronze through Diamond), normed nationally so it describes absolute positioning, not a single
              class rank. Separately, participating schools can surface{' '}
              <span className="font-semibold text-slate-800">top performers per exam and per grade</span> on a
              monthly school leaderboard so families see who is leading <em>at that school</em> before they read
              the nationwide tier.
            </p>
            <p>
              <span className="font-semibold text-slate-800">Practice Mode</span> draws from its own item
              bank: same adaptive rhythm and families of items you will see on counted exams, but exploratory
              only, with no impact on official scores or tiers. That keeps rehearsal separate from the benchmark schools and universities take seriously.
            </p>
            <p className="font-medium text-slate-800">
              GYS is for students who want more than marks, who want to know where they stand, what they are
              good at, and what comes next.
            </p>
          </div>
        </section>

        <section
          id="about-practice"
          className="border-t border-slate-200 bg-slate-50 py-12 sm:py-14"
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Practice Mode, on purpose</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Optional runs before official attempts use the same adaptive engine but a separate question pool so students build confidence while the credential
                stays about true readiness, not first-day nerves.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  t: 'Separate pool',
                  d: 'Practice content is drawn from a bank apart from the items that feed scored attempts and tier calculations.',
                },
                {
                  t: 'Tier-neutral',
                  d: 'Exploratory results stay out of your official tier and the school-facing benchmark signal.',
                },
                {
                  t: 'Same adaptive rhythm',
                  d: 'Difficulty still responds in real time, so you learn the feel of the exam before it counts toward reports.',
                },
              ].map((row) => (
                <div
                  key={row.t}
                  className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm ring-1 ring-slate-100"
                >
                  <p className="text-sm font-bold text-slate-900">{row.t}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{row.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="about-different"
          className="border-y border-slate-200 bg-white py-14 sm:py-16"
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">What Makes GYS Different</h3>
              <p className="mt-3 text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
                Most tests stop at pass or fail. GYS is built to answer what you are ready for next, with global
                norms, depth across domains, optional practice that does not pollute the benchmark, and a
                scoreline schools and families can trust.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {DIFFERENTIATORS.map(({ emoji, title, body }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {emoji}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about-partnership" className="bg-slate-50 py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">The partnership behind GYS</h3>
              <p className="mt-3 text-xs text-slate-600 sm:text-sm">
                Built by people who have spent decades helping students find the right path.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-slate-200/80 bg-white p-8 shadow-md sm:p-10 lg:p-12">
              <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 sm:text-base">
                    Three organizations. One mission.
                  </p>
                  <p className="mt-5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    GYS is a joint initiative of{' '}
                    <span className="font-semibold text-slate-900">Access USA</span>, a US-based education
                    advisory firm with deep experience in college admissions and student assessment;{' '}
                    <span className="font-semibold text-slate-900">Argus</span>, our assessment and analytics
                    partner; and <span className="font-semibold text-slate-900">Education World</span>,
                    India&apos;s leading school leadership publication and publisher of India&apos;s
                    longest-running school rankings.
                  </p>
                  <p className="mt-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    Together we combine rigorous psychometrics with what Indian families, schools, and
                    universities actually need: a credential that is globally benchmarked and locally
                    relevant.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {[
                    {
                      name: 'Access USA',
                      text: 'Assessment design, psychometrics, and US university recognition, with decades of experience with high-achieving students worldwide.',
                    },
                    {
                      name: 'Argus',
                      text: 'Assessment and analytics partner: the measurement and platform expertise behind GYS delivery and reporting.',
                    },
                    {
                      name: 'Education World',
                      text: "India's leading school ranking publication; GYS integrates with the EW rankings framework trusted by school leaders nationwide.",
                    },
                  ].map((partner) => (
                    <div
                      key={partner.name}
                      className="rounded-r-xl border border-slate-100 border-l-[5px] bg-slate-50/90 py-4 pl-5 pr-4 shadow-sm"
                      style={{ borderLeftColor: GYS_BLUE }}
                    >
                      <h4 className="text-sm font-bold" style={{ color: GYS_BLUE }}>
                        {partner.name}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{partner.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="about-audience"
          className="border-t border-slate-200 bg-slate-50 py-14 sm:py-16"
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Who GYS Is For</h3>
              <p className="mt-3 text-xs text-slate-600 sm:text-sm">
                Designed for students in Grades 6 through 12, with a plan for every stage of the journey.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {AUDIENCES.map((a) => (
                <div
                  key={a.grades}
                  className={`flex flex-col rounded-2xl border bg-gradient-to-b p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${a.tint}`}
                >
                  <span
                    className="inline-flex w-fit rounded-lg px-2 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: GYS_BLUE }}
                  >
                    {a.grades}
                  </span>
                  <h4 className="mt-4 text-base font-bold text-slate-900">{a.title}</h4>
                  <p className="mt-1 text-xs font-semibold sm:text-sm" style={{ color: GYS_BLUE }}>
                    {a.subtitle}
                  </p>
                  <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about-outcomes" className="border-t border-slate-200 bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-xl font-bold text-[#1a2744] sm:text-2xl">
                What students walk away with
              </h3>
              <p className="mt-3 text-sm text-slate-500 sm:text-base">
                Every GYS student receives more than a score.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {OUTCOMES.map(({ emoji, title, body }) => (
                <div
                  key={title}
                  className="flex flex-col items-center rounded-xl border border-slate-200/90 bg-white px-5 py-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-4xl leading-none sm:text-[2.75rem]" aria-hidden>
                    {emoji}
                  </span>
                  <h4 className="mt-5 text-sm font-bold leading-snug sm:text-base" style={{ color: GYS_BLUE }}>
                    {title}
                  </h4>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="about-cta"
          className="border-y border-slate-200 bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] px-6 py-14 text-white sm:py-16"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-lg font-bold sm:text-xl">See What GYS Feels Like.</h3>
            <p className="mt-4 text-xs leading-relaxed text-white/85 sm:text-sm">
              No account, no cost, just a quick feel for how GYS reasons about you.
              When you are ready, move on to practice tests and the full assessment suite.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() =>
                  navigate('/for-schools/preview/assessment', {
                    state: { sampleAssessmentExitTo: '/about' },
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-3 text-xs font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:text-sm"
                style={{ backgroundColor: GYS_GOLD }}
              >
                Try a Sample
                <ArrowRight className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/students')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/70 bg-white/10 px-8 py-3 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:text-sm"
              >
                See Pricing
              </button>
            </div>
          </div>
        </section>
      </main>

      <LandingSiteFooter />
    </div>
  );
};

export default AboutGysPage;
