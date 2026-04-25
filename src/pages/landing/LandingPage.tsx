import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LandingSiteFooter from '../../components/layout/LandingSiteFooter';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { LandingHeaderScrollProgress } from '../../components/landing/LandingScrollChrome';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  scrollToLandingSectionId,
  useLandingScrollProgress,
  useLandingSectionSpy,
} from '../../hooks/useLandingPageScroll';

const GYS_BLUE = '#1e3a8a';
const GYS_GOLD = '#fbbf24'; // brighter, radiant gold (amber-400)

const LANDING_SECTIONS = [
  { id: 'landing-hero', label: 'Home' },
  { id: 'landing-stats', label: 'Impact' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'performance-tiers', label: 'Tiers' },
] as const;

const LANDING_SECTION_IDS_JOIN = LANDING_SECTIONS.map((s) => s.id).join('|');

function HowItWorksFlowChevron() {
  return (
    <span
      className="pointer-events-none flex w-7 shrink-0 items-center justify-center text-slate-400 sm:w-9"
      aria-hidden
    >
      <svg
        className="h-9 w-5 sm:h-10 sm:w-6"
        viewBox="0 0 20 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 10 L14 24 L4 38"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

interface StatItemProps {
  target: number;
  suffix?: string;
  label: string;
  trigger: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ target, suffix = '', label, trigger }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let frameId: number;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, trigger]);

  return (
    <div className="transition-transform duration-150 hover:-translate-y-1">
      <p className="text-2xl md:text-3xl font-bold text-gray-900">
        {value.toLocaleString()}
        {suffix}
      </p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [statsVisible, setStatsVisible] = useState(false);
  const scrollProgress = useLandingScrollProgress();
  const activeSectionId = useLandingSectionSpy(LANDING_SECTION_IDS_JOIN);
  const statsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === statsRef.current && entry.isIntersecting) {
            setStatsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (statsRef.current) observer.observe(statsRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll('[data-landing-reveal]');
    if (nodes.length === 0) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('landing-reveal-visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <div className="overflow-x-hidden bg-white text-gray-900">
      {/* Header + scroll progress (same chrome as /about, /students, etc.) */}
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
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              type="button"
              onClick={() => navigate('/about')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => navigate('/for-schools')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              For Schools
            </button>
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              For Students
            </button>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <PublicHomeNavButton />
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

      {/* Desktop: jump-to-section rail (same pattern as LandingSectionRail) */}
      <nav
        className="landing-scroll-rail fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center xl:flex"
        aria-label="Jump to section on this page"
        title="Jump to a section"
      >
        <ul className="flex flex-col items-center gap-y-2 rounded-full border border-white/25 bg-slate-950/35 px-2 py-3 shadow-lg backdrop-blur-md ring-1 ring-white/10">
          {LANDING_SECTIONS.map(({ id, label }) => {
            const active = activeSectionId === id;
            return (
              <li key={id} className="flex flex-col items-center">
                <button
                  type="button"
                  aria-label={`Go to ${label}`}
                  aria-current={active ? 'location' : undefined}
                  onClick={() => scrollToLandingSectionId(id)}
                  className={`landing-scroll-rail__dot flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full border border-white/50 outline-none transition focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900/80 ${
                    active
                      ? 'landing-scroll-rail__dot--active border-amber-100 bg-amber-50 shadow-sm'
                      : 'bg-white/35 hover:bg-white/60'
                  }`}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Hero */}
      <section
        id="landing-hero"
        className="relative overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] px-6 pb-20 pt-12 sm:pb-24 sm:pt-16"
      >
        <div className="landing-hero-mesh" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-10 left-4 md:left-16 w-56 h-56 rounded-full bg-blue-400/10 hero-orb-a" />
          <div className="absolute bottom-4 right-4 md:right-16 w-64 h-64 rounded-full bg-indigo-400/5 hero-orb-b" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-blue-300/5 hero-orb-c" />
        </div>
        <div className="relative z-[1] mx-auto max-w-6xl text-center">
          <p className="landing-hero-enter-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">
            Global Young Scholar
          </p>
          <h2 className="landing-hero-enter-2 mt-3 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
            Where Do Your Students Stand Among the{' '}
            <span style={{ color: GYS_GOLD }}>World&apos;s Best?</span>
          </h2>
          <p className="landing-hero-enter-3 mx-auto mt-6 max-w-2xl text-lg text-white/90">
            India&apos;s premier global benchmarking program for college-bound students.
            Reasoning, skills, and insight. Seven exams and practice tests that place students
            on the world stage.
          </p>
          <div className="landing-hero-enter-4 mx-auto mt-8 flex w-full max-w-full flex-nowrap justify-center gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 md:gap-3 md:overflow-x-visible md:px-0 [&::-webkit-scrollbar]:hidden">
            <div className="landing-hero-chip flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-[0.7rem] text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/20 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm">
              <span className="text-sm sm:text-base">🎓</span>
              <span>Grades 6-12</span>
            </div>
            <div className="landing-hero-chip flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-[0.7rem] text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/20 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm">
              <span className="text-sm sm:text-base">🌍</span>
              <span>Global Norms</span>
            </div>
            <div className="landing-hero-chip flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-[0.7rem] text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/20 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm">
              <span className="text-sm sm:text-base">📝</span>
              <span>7 exams</span>
            </div>
            <div className="landing-hero-chip flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-[0.7rem] text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/20 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm">
              <span className="text-sm sm:text-base">📋</span>
              <span>Practice Mode</span>
            </div>
            <div className="landing-hero-chip flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-[0.7rem] text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/20 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm">
              <span className="text-sm sm:text-base">🏫</span>
              <span className="max-[380px]:hidden">500+ Partner Schools</span>
              <span className="hidden max-[380px]:inline">500+ schools</span>
            </div>
          </div>
          <div className="landing-hero-enter-4 mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="cta-pulse inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold text-slate-900 shadow-md transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: GYS_GOLD }}
            >
              I&apos;m a Student
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/for-schools')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 bg-white px-8 py-4 text-center text-base font-semibold shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              style={{ borderColor: GYS_BLUE, color: GYS_BLUE }}
            >
              I&apos;m a School / Institution
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Wave: visually links hero → next section */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 text-white" aria-hidden>
          <svg
            className="landing-section-wave block w-full"
            viewBox="0 0 1440 96"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,96 L0,28 C240,8 480,88 720,48 C960,8 1200,72 1440,36 L1440,96 Z"
            />
          </svg>
        </div>
      </section>

      {/* Stats bar */}
      <section
        id="landing-stats"
        data-landing-reveal
        className="border-b border-gray-100 bg-white py-12"
      >
        <div
          ref={statsRef}
          className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 text-center md:grid-cols-4"
        >
          <div className="landing-reveal-child">
            <StatItem
              target={50000}
              suffix="+"
              label="Students Assessed Globally"
              trigger={statsVisible}
            />
          </div>
          <div className="landing-reveal-child">
            <StatItem
              target={30}
              suffix="+"
              label="Countries Represented"
              trigger={statsVisible}
            />
          </div>
          <div className="landing-reveal-child">
            <StatItem
              target={500}
              suffix="+"
              label="Partner Schools"
              trigger={statsVisible}
            />
          </div>
          <div className="landing-reveal-child">
            <StatItem
              target={95}
              suffix="%"
              label="Parent Satisfaction"
              trigger={statsVisible}
            />
          </div>
        </div>
      </section>

      <div
        className="pointer-events-none relative -mt-px h-px overflow-visible bg-gradient-to-r from-transparent via-amber-200/50 to-transparent"
        aria-hidden
      />


      {/* How It Works */}
      <section
        id="how-it-works"
        data-landing-reveal
        className="scroll-mt-20 bg-white pt-12 pb-5 md:pt-14 md:pb-6"
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            How It Works
          </h3>
          <p className="text-gray-600 mt-2">Three steps to a global profile; tap each step to explore</p>
          <div className="mt-10 md:mt-12 text-left">
            <Tabs defaultValue="1" className="mx-auto w-full max-w-3xl">
              <TabsList className="flex h-auto w-full flex-nowrap items-stretch gap-0 rounded-xl bg-slate-100 p-1.5 text-slate-600">
                <TabsTrigger
                  value="1"
                  className="min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-semibold leading-tight data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm sm:px-3 sm:text-sm"
                >
                  Assessments
                </TabsTrigger>
                <HowItWorksFlowChevron />
                <TabsTrigger
                  value="2"
                  className="min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-semibold leading-tight data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm sm:px-3 sm:text-sm"
                >
                  Your tier
                </TabsTrigger>
                <HowItWorksFlowChevron />
                <TabsTrigger
                  value="3"
                  className="min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-semibold leading-tight data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm sm:px-3 sm:text-sm"
                >
                  Your path
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="1"
                className="mt-6 animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-gray-200 border-t-4 bg-slate-50 p-6 shadow-sm duration-500 md:p-8"
                style={{ borderTopColor: GYS_BLUE }}
              >
                <h4 className="font-bold text-lg text-gray-900">Take assessments</h4>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  Seven exams across Reasoning, Skills, and Insight, online, integrity-aware, on your schedule.
                </p>
              </TabsContent>
              <TabsContent
                value="2"
                className="mt-6 animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-gray-200 border-t-4 bg-slate-50 p-6 shadow-sm duration-500 md:p-8"
                style={{ borderTopColor: GYS_BLUE }}
              >
                <h4 className="font-bold text-lg text-gray-900">Get your tier</h4>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  Most families first see how students compare <strong>inside their school</strong>: for each
                  official exam, leaderboards highlight <strong>top performers by grade</strong>. 
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  After the official <strong>Reasoning Triad</strong>, GYS assigns a{' '}
                  <strong>Performance Tier</strong> band (Explorer at the baseline, then Bronze through Diamond).
                  Every student&apos;s tier <strong>updates periodically</strong> from official exam results. It is{' '}
                  <strong>percentile- and exam-based within grade</strong> against a growing national reference cohort. Students can improve their tier by taking the exams and earning higher scores.
                </p>
              </TabsContent>
              <TabsContent
                value="3"
                className="mt-6 animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-gray-200 border-t-4 bg-slate-50 p-6 shadow-sm duration-500 md:p-8"
                style={{ borderTopColor: GYS_BLUE }}
              >
                <h4 className="font-bold text-lg text-gray-900">Build your path</h4>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  Personalized reports, course recommendations, and college mapping to help you get where
                  you&apos;re going.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <div className="pointer-events-none bg-white leading-none" aria-hidden>
        <svg
          className="landing-section-wave landing-section-wave--compact block w-full text-white"
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0,0 L0,40 C320,64 640,0 960,32 C1280,64 1440,24 1440,8 L1440,0 Z" />
        </svg>
      </div>

      {/* Performance Tiers (Section 3 - national-normed) */}
      <section
        id="performance-tiers"
        data-landing-reveal
        className="scroll-mt-20 bg-slate-50/80 pb-6 pt-10 md:pb-8 md:pt-12"
      >
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            Performance Tiers and Leaderboard
          </h3>
          <p className="text-gray-600 mt-2 max-w-3xl mx-auto text-sm leading-relaxed">
            Performance Tiers are the nationwide lens: every student earns a band that reflects their performance
           on the exams against a growing national cohort (Explorer → Diamond). Students can improve their tier by taking the exams and earning higher scores.
          </p>
          <p className="text-gray-600 mt-2 max-w-3xl mx-auto text-sm leading-relaxed"> 
          A <strong>school-level</strong> view for each grade, families can see the
            <strong> top ten students per exam</strong> per grade at the school. Leaderboard is updated periodically. Over time, students will also see how they stand nationally, and top performers can earn paths to grade-level opportunities alongside other nationwide toppers.
  
      </p>
          <div className="mx-auto mt-8 max-w-5xl md:mt-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 md:gap-4">
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
                icon: <span className="text-2xl md:text-3xl">💎</span>,
              },
              {
                name: 'Diamond',
                bg: 'bg-[#ede9fe]',
                text: 'text-[#5b21b6]',
                border: 'border-violet-400',
                icon: <span className="text-2xl md:text-3xl">✦</span>,
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`landing-tier-card flex min-h-[100px] flex-col items-center justify-center rounded-xl border p-4 shadow-sm transition-all duration-300 md:min-h-[120px] md:p-5 hover:-translate-y-1 hover:shadow-md ${tier.border} ${tier.bg} ${tier.text}`}
              >
                {tier.icon && <span className="mb-1 md:mb-2">{tier.icon}</span>}
                <span className="text-sm font-bold md:text-lg">{tier.name}</span>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      <div className="pointer-events-none bg-slate-50/80 leading-none" aria-hidden>
        <svg
          className="landing-section-wave landing-section-wave--compact block w-full rotate-180 text-white"
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0,0 L0,40 C320,64 640,0 960,32 C1280,64 1440,24 1440,8 L1440,0 Z" />
        </svg>
      </div>

      {/* Trust section */}
      <section
        id="for-schools"
        data-landing-reveal
        className="scroll-mt-20 bg-white pb-6 pt-4 md:pb-8 md:pt-6"
      >
        <div className="max-w-5xl mx-auto px-6">
          {/* EducationWorld - full-width card */}
          <div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-4 md:px-6 md:py-5">
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
                    past 20 years, the annual EducationWorld India School Rankings, the world&apos;s
                    largest and most comprehensive schools survey, has aided and enabled parents to
                    select the most aptitudinally suitable school for their children.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingSiteFooter />
    </div>
  );
};

export default LandingPage;
