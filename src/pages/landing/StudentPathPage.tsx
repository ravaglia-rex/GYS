import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import LandingFaq from '../../components/landing/LandingFaq';
import { studentFaqSections } from './faq/studentFaqSections';

const GYS_BLUE = '#1e3a8a';
const GYS_GOLD = '#fbbf24';

/** Landing copy — aligned with signup membership tiers (L1 / L2 / L3). */
const STUDENT_ASSESSMENTS = [
  {
    exam: 1,
    group: 'triad' as const,
    label: 'Pattern and Logic',
    shortName: 'Pattern & Logic',
    desc: 'Patterns, rules, and structured logic',
    icon: '🔢',
    inL1: true,
    inL2: true,
    inL3: true,
  },
  {
    exam: 2,
    group: 'triad' as const,
    label: 'Verbal Reasoning',
    shortName: 'Verbal',
    desc: 'Meaning, inference, and argument from text',
    icon: '📚',
    inL1: false,
    inL2: true,
    inL3: true,
  },
  {
    exam: 3,
    group: 'triad' as const,
    label: 'Mathematical Reasoning',
    shortName: 'Math',
    desc: 'Number sense, logic, and quantitative thinking',
    icon: '📐',
    inL1: false,
    inL2: true,
    inL3: true,
  },
  {
    exam: 4,
    group: 'depth' as const,
    label: 'English Proficiency (Advanced)',
    shortName: 'English (adv.)',
    desc: 'Listening, speaking, and conversational fluency — AI-assessed',
    icon: '💬',
    inL1: false,
    inL2: false,
    inL3: true,
  },
  {
    exam: 5,
    group: 'depth' as const,
    label: 'AI Literacy & Capability',
    shortName: 'AI literacy',
    desc: 'Skills for learning and working responsibly with AI',
    icon: '🤖',
    inL1: false,
    inL2: false,
    inL3: true,
  },
  {
    exam: 6,
    group: 'depth' as const,
    label: 'Comprehensive Personality',
    shortName: 'Personality (full)',
    desc: 'Deep profile across many dimensions (~30)',
    icon: '✨',
    inL1: false,
    inL2: false,
    inL3: true,
  },
] as const;

const TIER_HEADERS = [
  { key: 'L1' as const, title: 'Level 1', subtitle: 'Explore', tint: 'bg-sky-100 text-sky-950' },
  { key: 'L2' as const, title: 'Level 2', subtitle: 'Engage', tint: 'bg-amber-100 text-amber-950' },
  { key: 'L3' as const, title: 'Level 3', subtitle: 'Excel', tint: 'bg-purple-100 text-purple-950' },
];

const ASSESSMENT_SECTIONS: {
  group: (typeof STUDENT_ASSESSMENTS)[number]['group'];
  title: string;
  hint: string;
}[] = [
  { group: 'triad', title: 'Reasoning triad', hint: 'Pattern & logic · verbal · mathematical — unified report at Level 2' },
  { group: 'depth', title: 'English, AI & comprehensive personality', hint: 'Level 3 only' },
];

const StudentPathPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/90 border-b border-gray-200 backdrop-blur">
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

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <PublicHomeNavButton />
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-2.5 sm:px-5 rounded-xl text-white text-sm font-medium shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:brightness-110 active:scale-95 transition-all duration-200"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      <main className="pb-12">
        {/* Hero band - full width, matching landing page */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] px-6 py-10 text-white sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.12)_0%,_transparent_50%)] pointer-events-none" />
          <div className={`relative mx-auto max-w-4xl text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-3xl font-bold leading-snug sm:text-4xl">
              Discover Where You Stand on the{' '}
              <span className="inline-block transition-transform duration-300 hover:scale-105" style={{ color: GYS_GOLD }}>World Stage</span>
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-sm sm:text-base text-white/90">
              Take world-class assessments, get your global tier, and build a profile that top universities
              notice.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:flex-wrap">
              <button
                type="button"
                onClick={() =>
                  navigate('/students/preview/dashboard', {
                    state: { studentPreviewExitTo: '/students' },
                  })
                }
                className="w-full max-w-sm rounded-xl border-2 border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:border-white/60 sm:w-auto"
              >
                Try the sample dashboard - no account
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate('/for-schools/preview/assessment', {
                    state: { sampleAssessmentExitTo: '/students' },
                  })
                }
                className="w-full max-w-sm rounded-xl border-2 border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:border-white/60 sm:w-auto"
              >
                Try the sample assessment - no account
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/about/assessments')}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/95 underline-offset-4 transition hover:text-white hover:underline"
            >
              Explore all six assessments
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* What you get */}
        <section className="mt-12 text-center sm:mt-16">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What You Get</h2>
          <div className="mt-10 sm:mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: '🌍',
                title: 'Global Benchmarking',
                body: 'See where you rank among college-bound students worldwide - not just your school or city.',
              },
              {
                icon: '🧠',
                title: '6 Assessments',
                body: 'Six exams total: Level 2 is the full reasoning triad; Level 3 adds advanced English, AI literacy, and comprehensive personality — benchmarked globally.',
              },
              {
                icon: '📊',
                title: 'Detailed Reports',
                body: 'Subscore analysis, cross-domain insights, growth tracking, and personalized recommendations.',
              },
              {
                icon: '🎯',
                title: 'Course Recommendations',
                body: 'Targeted courses from Access USA to strengthen exactly the areas where you need to grow.',
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:px-5 sm:py-4 transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg hover:ring-slate-200 cursor-default"
                style={{
                  animation: 'fade-slide-in 0.5s ease-out both',
                  animationDelay: `${index * 80}ms`,
                }}
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

        {/* Assessments - full width grey band */}
        <section
          id="assessments"
          className="mt-12 bg-slate-100 border-y border-slate-200 py-8 text-center sm:mt-16 sm:py-10 relative left-1/2 right-1/2 -ml-[50vw] w-screen scroll-mt-20"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">The Assessments</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
              One map: each row is an exam (name + what it measures). Checkmarks show which membership unlocks it.
            </p>

            <div
              className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-md ring-1 ring-slate-100"
              role="region"
              aria-label="Assessments and membership levels"
            >
              {/* Column headers — compact */}
              <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,3.25rem)] gap-x-1 border-b border-slate-200 bg-slate-50 sm:grid-cols-[minmax(0,1fr)_repeat(3,4.5rem)] sm:gap-x-2">
                <div className="px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-2.5 sm:text-xs">
                  Assessment
                </div>
                {TIER_HEADERS.map((t) => (
                  <div
                    key={t.key}
                    className={`flex flex-col items-center justify-center px-0.5 py-2 text-center sm:py-2.5 ${t.tint}`}
                  >
                    <span className="text-[0.65rem] font-bold leading-none sm:text-xs">{t.title.replace('Level ', 'L')}</span>
                    <span className="mt-0.5 hidden text-[0.6rem] font-medium opacity-80 sm:inline sm:text-[0.65rem]">
                      {t.subtitle}
                    </span>
                  </div>
                ))}
              </div>

              {ASSESSMENT_SECTIONS.map((section) => {
                const rows = STUDENT_ASSESSMENTS.filter((a) => a.group === section.group);
                const triadBand =
                  section.group === 'triad'
                    ? 'bg-gradient-to-r from-sky-50 via-indigo-50/60 to-transparent border-l-[3px] sm:border-l-4'
                    : section.group === 'depth'
                      ? 'bg-gradient-to-r from-purple-50/90 via-transparent to-transparent border-l-[3px] border-l-purple-300/80 sm:border-l-4'
                      : 'bg-slate-50/80 border-l-[3px] border-l-slate-300/80 sm:border-l-4';

                return (
                  <div key={section.group}>
                    <div
                      className={`${triadBand} border-slate-200/80 px-3 py-2 sm:px-4`}
                      style={section.group === 'triad' ? { borderLeftColor: GYS_BLUE } : undefined}
                    >
                      <p className="text-xs font-bold text-slate-800 sm:text-sm">{section.title}</p>
                      <p className="text-[0.65rem] text-slate-600 sm:text-xs">{section.hint}</p>
                    </div>
                    {rows.map((row) => (
                      <div
                        key={row.exam}
                        className="grid grid-cols-[minmax(0,1fr)_repeat(3,3.25rem)] items-center gap-x-1 border-b border-slate-100 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_repeat(3,4.5rem)] sm:gap-x-2"
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
                        {[row.inL1, row.inL2, row.inL3].map((on, i) => (
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
                              {on ? '✓' : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}

              <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-center text-[0.65rem] leading-relaxed text-slate-600 sm:text-xs">
                Level 2 also includes the <span className="font-semibold text-slate-800">triad cross-synthesis</span>{' '}
                report when all three reasoning exams are complete. Prices below.
              </p>
            </div>
          </div>
        </section>

        {/* Membership levels */}
        <section className="mt-12 sm:mt-16">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl text-center">Membership Levels</h2>
          <p className="mt-2 text-center text-xs text-slate-600 sm:text-sm">
            Choose the depth of insight that&apos;s right for you.
          </p>

          <div className="mt-8 sm:mt-10 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
            {[
              {
                name: 'Level 1 - Explore',
                desc: 'Assessment 1 + basic report + tier placement',
                price: '₹499/yr',
                bg: 'bg-[#e5f3ff]',
              },
              {
                name: 'Level 2 - Engage',
                desc: 'Full reasoning triad (Exams 1–3) + triad cross-synthesis report',
                price: '₹1,299/yr',
                bg: 'bg-[#fff7e0]',
              },
              {
                name: 'Level 3 - Excel',
                desc: 'All 6 exams: English, AI, comprehensive personality + full guidance',
                price: '₹2,499/yr',
                bg: 'bg-[#f9e8ff]',
              },
            ].map((tier, index) => (
              <div
                key={index}
                className={`flex items-center justify-between rounded-2xl ${tier.bg} px-4 py-3 shadow-sm ring-1 ring-slate-100 sm:px-5 sm:py-4 transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-md hover:ring-2 hover:ring-[#1e3a8a]/30 cursor-default`}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 sm:text-base">{tier.name}</p>
                    <p className="mt-1 text-xs text-slate-600 sm:text-sm">{tier.desc}</p>
                  </div>
                </div>
                <div
                  className="ml-4 text-sm font-semibold sm:text-base"
                  style={{ color: GYS_BLUE }}
                >
                  {tier.price}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EducationWorld — students & parents (aligned with main landing) */}
        <section className="mt-10 sm:mt-12">
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
                  Trusted by over 5,000 schools and millions of parents nationwide for its credible,
                  comprehensive and in-depth school rankings on a wide range of parameters including
                  academic reputation, teacher competence, co-curricular and sports education. For the
                  past 20 years, the annual EducationWorld India School Rankings — the world&apos;s
                  largest and most comprehensive schools survey — has aided and enabled parents to select
                  the most aptitudinally suitable school for their children.
                </p>
              </div>
            </div>
          </div>
        </section>

        <LandingFaq
          id="faq"
          title="GYS — Frequently Asked Questions"
          sections={studentFaqSections}
          className="mt-12 sm:mt-16"
        />

        {/* Final CTAs */}
        <section className="mt-12 sm:mt-16">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
            <button
              type="button"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-200 px-14 py-3.5 text-sm font-semibold text-slate-500 shadow-none sm:text-base"
              aria-label="Student sign up (temporarily unavailable)"
            >
              Sign up — Coming soon!
            </button>
            <p className="text-center text-sm text-slate-600 sm:text-base">
              Student registration is paused for a short time. Try the sample dashboard above to explore the
              experience, or check back soon.
            </p>
          </div>
        </section>
        </div>
      </main>

      {/* Footer (same as first landing page) */}
      <footer className="bg-white border-t border-gray-200 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => navigate('/for-schools')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              For Schools
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              For Students
            </button>
            <button
              type="button"
              onClick={() => navigate('/about/assessments')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Assessments
            </button>
            <button
              type="button"
              onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              FAQ
            </button>
            <a
              href="mailto:schools@globalyoungscholar.com"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Contact
            </a>
          </nav>
          <p className="mt-6 text-center text-sm text-gray-500">
            © 2026 Global Young Scholar. A joint initiative of Access USA, Argus, and EducationWorld.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StudentPathPage;

