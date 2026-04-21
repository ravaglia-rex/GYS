import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardCheck,
  Globe2,
  Layers,
  MonitorPlay,
  RotateCw,
  ShieldCheck,
  TrendingUp,
  Unlock,
} from 'lucide-react';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';

const GYS_BLUE = '#1e3a8a';
const GYS_GOLD = '#fbbf24';

const ASSESSMENTS = [
  {
    n: 1,
    title: 'Pattern and Logic',
    tag: 'Reasoning Triad',
    desc: 'Patterns, rules, and structured logic — foundation for quantitative and analytical thinking.',
    icon: '🔢',
    stripe: '#3b82f6',
    band: 'from-sky-50 to-white',
  },
  {
    n: 2,
    title: 'Verbal Reasoning',
    tag: 'Reasoning Triad',
    desc: 'Meaning, inference, and argument from text — aligned with college-readiness expectations.',
    icon: '📚',
    stripe: '#6366f1',
    band: 'from-indigo-50 to-white',
  },
  {
    n: 3,
    title: 'Mathematical Reasoning',
    tag: 'Reasoning Triad',
    desc: 'Number sense, logic, and quantitative thinking — not drill math, but reasoning under pressure.',
    icon: '📐',
    stripe: '#8b5cf6',
    band: 'from-violet-50 to-white',
  },
  {
    n: 4,
    title: 'English Proficiency (Advanced)',
    tag: 'Depth Bundle',
    desc: 'Listening, speaking, and conversational fluency — AI-assessed for real-world communication.',
    icon: '💬',
    stripe: '#14b8a6',
    band: 'from-teal-50 to-white',
  },
  {
    n: 5,
    title: 'AI Literacy & Capability',
    tag: 'Depth Bundle',
    desc: 'Skills for learning and working responsibly with AI tools in school and beyond.',
    icon: '🤖',
    stripe: '#f59e0b',
    band: 'from-amber-50 to-white',
  },
  {
    n: 6,
    title: 'Comprehensive Personality',
    tag: 'Depth Bundle',
    desc: 'A deep profile across many dimensions — insights for guidance, growth, and fit.',
    icon: '✨',
    stripe: '#ec4899',
    band: 'from-pink-50 to-white',
  },
] as const;

const PublicAssessmentsPage: React.FC = () => {
  const navigate = useNavigate();

  const goInstitutionalSubscriptions = () =>
    navigate('/for-schools', { state: { scrollToId: 'institutional-subscriptions' } });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 sm:gap-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group -ml-1 flex items-center gap-1 rounded-lg px-1 py-0.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs transition-all duration-200 group-hover:border-slate-400">
              ←
            </span>
            <span className="hidden xs:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-sm font-bold text-white"
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
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <PublicHomeNavButton />
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:brightness-110 active:scale-95 sm:px-5"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] px-6 pb-14 pt-12 text-white sm:pb-16 sm:pt-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-6 top-10 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl md:left-20" />
            <div className="absolute bottom-0 right-6 h-56 w-56 rounded-full bg-indigo-400/10 blur-2xl md:right-24" />
          </div>
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Assessment Suite</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-[2.35rem]">
              Six Assessments.{' '}
              <span style={{ color: GYS_GOLD }}>One Global Benchmark.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/88 sm:text-base">
              Reasoning, English fluency, AI literacy, and personality — designed for students in grades 6–12
              and normed against college-bound peers worldwide. Schools get aggregate insight; students get a
              profile that travels with them.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
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
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12 sm:py-14">
          <div className="flex flex-col gap-3 text-center sm:gap-4">
            <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">What We Measure</h3>
            <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
              The first three exams form the <span className="font-semibold text-slate-800">Reasoning Triad</span>
              — a unified view of analytical ability. Levels 2 and 3 unlock the full triad report. Level 3 adds
              advanced English, AI literacy, and a comprehensive personality profile.
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
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-12 sm:py-14">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Adaptive Exams</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Item difficulty adjusts as students respond — similar in spirit to computer-adaptive testing.
                The engine routes learners through content that stays appropriately challenging: strong
                performance surfaces harder items; when someone needs support, the path reinforces
                fundamentals before moving on. Forward-only flows on many exams keep the experience fair and
                comparable across sessions.
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-sm font-semibold text-[#1e3a8a] ring-1 ring-[#1e3a8a]/15">
                <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
                Calibrated Difficulty · Fewer Wasted Questions · Precise Tier Placement
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Three Tiers Per Exam — Then the Next Exam Unlocks
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Each assessment is organized into{' '}
              <span className="font-semibold text-slate-800">three proficiency tiers</span> (Tier 1 through
              Tier 3). Students clear tiers by meeting score thresholds that are{' '}
              <span className="font-semibold text-slate-800">set by grade band</span> — middle school,
              early high school, and senior grades each use calibrated cutoffs so “passing” reflects age-appropriate expectations, not a single bar for everyone.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                Icon: Layers,
                title: 'All Tiers Included With Access',
                body: 'When your membership covers an exam, you can work through every proficiency tier on that exam — not just one shot. Paid access is to the assessment area; tiers are stages inside it.',
              },
              {
                Icon: Unlock,
                title: 'Sequential Unlock Across Exams',
                body: 'Exams unlock in program order once prerequisites are satisfied: e.g. progress deeply enough on Pattern & Logic before Verbal and Math open; deeper bundles (English, AI, personality) follow their own chain. If your plan does not include the next exam, it stays gated until you upgrade.',
              },
              {
                Icon: RotateCw,
                title: 'Multiple Attempts Where Your Plan Allows',
                body: 'Example: a Level 2 (Engage) subscription includes the full reasoning triad. Students may sit each reasoning exam more than once across the subscription window to improve — always climbing tiers within those exams while preparing for the next unlock.',
              },
            ].map(({ Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#1e3a8a]" aria-hidden>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h4 className="mt-4 text-base font-bold text-slate-900">{title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-slate-500 sm:text-sm">
            Exact percentage bands and how many tiers must be cleared before the next exam opens are defined
            in program rules and may evolve; your dashboard always shows what&apos;s available, what&apos;s
            locked, and why.
          </p>
        </section>

        <section className="border-y border-slate-200 bg-white py-12 sm:py-14">
          <div className="mx-auto grid max-w-5xl gap-8 px-6 md:grid-cols-2 md:gap-12 md:items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">How It Works</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Assessments run in the browser with integrity checks suited to high-stakes use. Students
                complete sections on their schedule where your program allows; schools receive exports and
                dashboards aligned to cohorts and terms.
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
                    text: 'Performance tiers (Gold, Silver, Bronze), subscores, and guidance — not just a percentile.',
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm ring-1 ring-slate-100">
              <h4 className="text-sm font-semibold text-slate-500">Global Performance Tiers</h4>
              <p className="mt-2 text-sm text-slate-600">
                Separately from the three <span className="font-medium text-slate-700">in-exam</span>{' '}
                proficiency tiers, each assessment feeds an overall recognition band — Gold, Silver, or
                Bronze — benchmarked globally so students and schools share a simple signal of standing.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { name: 'Gold', emoji: '🥇', bg: 'bg-[#fef3c7]', ring: 'ring-amber-400/40' },
                  { name: 'Silver', emoji: '🥈', bg: 'bg-[#f3f4f6]', ring: 'ring-slate-400/40' },
                  { name: 'Bronze', emoji: '🥉', bg: 'bg-[#ffe4d6]', ring: 'ring-orange-400/40' },
                ].map((t) => (
                  <div
                    key={t.name}
                    className={`flex flex-col items-center rounded-xl ${t.bg} px-3 py-4 text-center shadow-sm ring-1 ${t.ring}`}
                  >
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="mt-2 text-sm font-bold text-slate-900">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-14 text-center">
          <p className="text-lg font-semibold text-slate-900 sm:text-xl">Ready to Go Deeper?</p>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Students can explore membership levels on the For Students page. Schools can compare Entry,
            Standard, and Premium institutional licenses — or book a walkthrough with our team.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="rounded-xl border-2 px-6 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:text-base"
              style={{ borderColor: GYS_BLUE, color: GYS_BLUE }}
            >
              For Students — Pricing &amp; Levels
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

      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-5xl px-6">
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="transition-colors hover:text-gray-900"
            >
              Home
            </button>
            <button
              type="button"
              onClick={goInstitutionalSubscriptions}
              className="transition-colors hover:text-gray-900"
            >
              For Schools
            </button>
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="transition-colors hover:text-gray-900"
            >
              For Students
            </button>
            <span className="font-semibold text-[#1e3a8a]">Assessments</span>
            <a href="mailto:schools@globalyoungscholar.com" className="transition-colors hover:text-gray-900">
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

export default PublicAssessmentsPage;
