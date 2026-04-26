import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LandingSiteFooter from '../../components/layout/LandingSiteFooter';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { LandingHeaderScrollProgress, LandingSectionRail } from '../../components/landing/LandingScrollChrome';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { GYS_BLUE, GYS_GOLD } from '../../constants/gysBrand';
import { useLandingScrollProgress, useLandingSectionSpy } from '../../hooks/useLandingPageScroll';

const DIFFERENTIATORS = [
  {
    emoji: '🌍',
    title: 'Global Context',
    body: 'GYS places student performance in a broader context, comparing results against a growing population of high-performing, college-bound students. Schools and families can see readiness beyond the classroom, the school, or the local cohort.',
  },
  {
    emoji: '🎯',
    title: 'Adaptive by Design',
    body: 'Each official exam adjusts difficulty in real time. Stronger students keep moving into more challenging material, while every student receives a more accurate measure of ability instead of being limited by a fixed test ceiling.',
  },
  {
    emoji: '📋',
    title: 'Practice Without Penalty',
    body: 'Students can take optional practice tests before official attempts. Practice uses a separate question pool, so students can build confidence without affecting official scores, performance tiers, school reports, or EducationWorld ranking inputs.',
  },
  {
    emoji: '🧭',
    title: 'Guidance, Not Just Grades',
    body: 'GYS combines reasoning, English and communication, AI proficiency, personality, interests, and career discovery to support recommendations for stream selection, career exploration, and university fit.',
  },
  {
    emoji: '🏫',
    title: 'Connected to EducationWorld Rankings',
    body: 'GYS participation contributes to the EducationWorld school rankings framework, giving schools a credible assessment-backed signal of student excellence, readiness, and growth.',
  },
  {
    emoji: '🔁',
    title: 'Designed to Grow With Students',
    body: 'Each exam includes three levels of difficulty within the program year. As students master one level, the next level unlocks, allowing advanced students to keep progressing while younger students build toward more challenging work.',
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
    body: 'A recognized designation from Explorer through Diamond, earned from exam performances and benchmarked against college-bound peers worldwide.',
  },
  {
    emoji: '📊',
    title: 'Category-level reports',
    body: 'Clear strengths and growth areas by question category, not just a single score, thus providing a clear roadmap for improvement.',
  },
  {
    emoji: '🧭',
    title: 'Stream & career guidance',
    body: 'Recommendations that deepen as you complete more of the suite; at Guided Decision, counseling continues even after completing all the exams as students add real-world experiences.',
  },
  {
    emoji: '🎓',
    title: 'University-ready credential',
    body: "A GYS profile framed for universities in India and the US and for schools in EducationWorld's rankings universe, globally legible and locally relevant.",
  },
] as const;

const LANDING_SECTIONS = [
  { id: 'landing-hero', label: 'Home' },
  { id: 'landing-stats', label: 'Impact' },
  { id: 'landing-what-gys', label: 'What' },
  { id: 'how-it-works', label: 'How' },
  { id: 'performance-tiers', label: 'Tiers' },
  { id: 'landing-practice', label: 'Practice' },
  { id: 'landing-mission', label: 'About' },
  { id: 'landing-different', label: 'Diff' },
  { id: 'landing-partnership', label: 'Partners' },
  { id: 'landing-outcomes', label: 'Outcomes' },
  { id: 'landing-try', label: 'Try' },
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

  return (
    <div className="overflow-x-clip bg-white text-gray-900">
      <LandingSectionRail sections={LANDING_SECTIONS} activeSectionId={activeSectionId} />
      {/* Header + scroll progress (same chrome as other public marketing pages) */}
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
              onClick={() => navigate('/about/assessments')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              Assessments
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
            India&apos;s premier benchmarking and guidance program for schools and students in Classes 6–12.
            Seven official assessments, plus practice tests, help schools measure student readiness,
            support stream and career guidance, and strengthen their EducationWorld rankings profile.
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
       <section id="landing-what-gys" data-landing-reveal className="scroll-mt-20 mx-auto max-w-3xl bg-white px-6 pt-10 pb-5 sm:pt-12 sm:pb-6">
        <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">What Is GYS?</h3>
        <div className="mt-6 space-y-4 text-justify text-xs leading-relaxed text-slate-600 sm:text-sm">
          <p>
            <span className="font-semibold text-slate-800">Global Young Scholar (GYS)</span> is an assessment and guidance platform for schools and students in Classes 6–12. Across seven adaptive assessments, GYS builds a multi-dimensional profile of each student, measuring aptitude, academic readiness, personality, and future-facing skills — then translating those results into practical guidance on strengths, growth areas, streams, careers, and university fit.
          </p>
          <p>
            The seven assessments are grouped into three tracks: Reasoning, Skills, and Insights.
          </p>
          <p>
          <span className="font-semibold text-slate-800">Reasoning</span> includes Symbolic, Verbal, and Mathematical Reasoning, benchmarking the core thinking skills students need for advanced academic work.
          </p>
          <p>
            <span className="font-semibold text-slate-800">Skills</span> focuses on 21st-century capabilities, including English and Communication, as well as students’ understanding of and proficiency working with AI.
          </p>
          <p>
          <span className="font-semibold text-slate-800">Insights</span> helps students understand their personality, interests, motivations, and possible career pathways.
          </p>
          <p className="font-medium text-slate-800">
            GYS is for schools and families who want more than marks. It helps students see where they stand, what they are good at, where they can grow, and what comes next.
          </p>
        </div>
      </section>


      {/* How It Works */}
      <section
        id="how-it-works"
        data-landing-reveal
        className="scroll-mt-20 bg-white pt-6 pb-5 md:pt-8 md:pb-6"
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            How It Works
          </h3>
          <p className="text-gray-600 mt-2">Three steps to build a global profile; Tap each step to explore more.</p>
          <div className="mt-10 md:mt-12 text-left">
            <Tabs defaultValue="1" className="mx-auto w-full max-w-3xl">
              <TabsList className="flex h-auto w-full flex-nowrap items-stretch gap-0 rounded-xl bg-slate-100 p-1.5 text-slate-600">
                <TabsTrigger
                  value="1"
                  className="min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-semibold leading-tight data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm sm:px-3 sm:text-sm"
                >
                  Assess
                </TabsTrigger>
                <HowItWorksFlowChevron />
                <TabsTrigger
                  value="2"
                  className="min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-semibold leading-tight data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm sm:px-3 sm:text-sm"
                >
                  Benchmark
                </TabsTrigger>
                <HowItWorksFlowChevron />
                <TabsTrigger
                  value="3"
                  className="min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-semibold leading-tight data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm sm:px-3 sm:text-sm"
                >
                  Guide
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="1"
                className="mt-6 rounded-2xl border border-gray-200 border-t-4 bg-slate-50 p-6 shadow-sm md:p-8"
                style={{ borderTopColor: GYS_BLUE }}
              >
                <h4 className="font-bold text-lg text-gray-900">Assess</h4>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  Students complete official GYS assessments online through a secure platform. Across seven exams, GYS measures reasoning, communication, AI readiness, personality, interests, and career direction - helping schools and families understand each student&apos;s strengths and recommend next steps for stream selection, career exploration, and university fit.
                </p>
              </TabsContent>
              <TabsContent
                value="2"
                className="mt-6 rounded-2xl border border-gray-200 border-t-4 bg-slate-50 p-6 shadow-sm md:p-8"
                style={{ borderTopColor: GYS_BLUE }}
              >
                <h4 className="font-bold text-lg text-gray-900">Benchmark</h4>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Earn a performance tier (Explorer → Diamond) - benchmarked against students at each grade level worldwide. Students work their way up the leaderboard to unlock opportunities and recognition.
                </p>
              </TabsContent>
              <TabsContent
                value="3"
                className="mt-6 rounded-2xl border border-gray-200 border-t-4 bg-slate-50 p-6 shadow-sm md:p-8"
                style={{ borderTopColor: GYS_BLUE }}
              >
                <h4 className="font-bold text-lg text-gray-900">Guide</h4>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  Personalized reports, course recommendations, and college mapping to help students achieve their goals.
               
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
        <div className="relative mx-auto max-w-5xl px-6">
          <h3 className="text-center text-2xl md:text-3xl font-bold text-gray-900">
            Performance Tiers and Leaderboards
          </h3>
          <div className="mx-auto mt-2 max-w-3xl space-y-4 text-justify text-sm leading-relaxed text-gray-600">
            <p>
              Every student earns a GYS Performance Tier that reflects their achievement against a growing national cohort. Tiers give schools, students, and families a clear way to understand performance beyond raw marks — from Explorer through Diamond.
            </p>
            <p>
              Students can improve their tier over time by retaking assessments and demonstrating higher levels of mastery. School leaderboards highlight the top-performing students by exam and class, helping schools recognize excellence and celebrate student achievement.
            </p>
          </div>
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

     
      <section
        id="landing-practice"
        data-landing-reveal
        className="scroll-mt-20 border-t border-slate-200 bg-slate-50 py-12 sm:py-14"
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Practice Tests</h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Sample tests are available for students to practice before their official attempts. These tests use the same adaptive engine but a separate question pool so students build confidence.
              
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                t: 'Separate pool',
                d: 'Practice content is drawn from a separate question bank.',
              },
              {
                t: 'Tier-neutral',
                d: 'Exploratory results do not impact official tiers or the school-facing benchmark signal.',
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

      <section id="landing-mission" className="scroll-mt-20 bg-white">
        <div className="relative overflow-x-clip bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] px-6 pb-16 pt-10 text-white sm:pb-20 sm:pt-14">
          <div className="landing-hero-mesh" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-6 top-10 h-52 w-52 rounded-full bg-blue-400/10 blur-xl md:left-20" />
            <div className="absolute bottom-0 right-6 h-64 w-64 rounded-full bg-indigo-400/10 blur-xl md:right-24" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.12)_0%,_transparent_50%)]" />
          <div className="relative z-[1] mx-auto max-w-3xl text-center">
           
            <h3 className="mt-3 text-2xl font-bold leading-snug sm:mt-4 sm:text-3xl md:text-4xl md:leading-tight">
              <span className="text-white">Helping India&apos;s next generation</span>
              <br />
              <span
                className="inline-block transition-transform duration-300 hover:scale-105"
                style={{ color: GYS_GOLD }}
              >
                discover what they&apos;re capable of.
              </span>
            </h3>
          
          </div>
      
        </div>
       
      </section>
      <section
        id="landing-different"
        data-landing-reveal
        className="scroll-mt-20 border-y border-slate-200 bg-white py-14 sm:py-16"
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">What Makes GYS Different</h3>
            <p className="mt-3 text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
              Most assessments produce a score. GYS helps schools and families understand what that score means — and what students are ready for next. With adaptive exams, trusted norms, optional practice, and guidance across academics, skills, personality, and career direction, GYS gives schools a more complete picture of student readiness.
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
     
      <section id="landing-partnership" data-landing-reveal className="scroll-mt-20 bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">The partnership behind GYS</h3>
            <p className="mt-3 text-xs text-slate-600 sm:text-sm">
              Built by teams with decades of experience guiding students.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-slate-200/80 bg-white p-8 shadow-md sm:p-10 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 sm:text-base">
                  Three organizations. One mission.
                </p>
                <p className="mt-5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  GYS brings together <span className="font-semibold text-slate-900">Access USA</span>,{' '}
                  <span className="font-semibold text-slate-900">Argus</span>, and{' '}
                  <span className="font-semibold text-slate-900">EducationWorld</span> to combine
                  assessment expertise, AI-powered analytics, and India&apos;s most trusted school
                  rankings ecosystem.
                </p>
                <p className="mt-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  The result: a credential that is globally benchmarked and locally relevant.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  {
                    name: 'Access USA',
                    text: 'Assessment design, psychometrics, and US university recognition.',
                  },
                  {
                    name: 'Argus',
                    text: 'Assessment and analytics partner powering GYS delivery and reporting.',
                  },
                  {
                    name: 'Education World',
                    text: "India's leading school ranking publication; GYS aligns with its trusted EW framework.",
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

     
      <section id="landing-outcomes" data-landing-reveal className="scroll-mt-20 border-t border-slate-200 bg-white py-14 sm:py-16">
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
        id="landing-try"
        data-landing-reveal
        className="scroll-mt-20 border-y border-slate-200 bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] px-6 py-14 text-white sm:py-16"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="text-lg font-bold sm:text-xl">See how GYS works for your school</h3>
          <p className="mt-4 text-xs leading-relaxed text-white/85 sm:text-sm">
            Explore the assessment experience, review pricing, or register your school for the new academic year.
            
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/for-schools')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-3 text-xs font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:text-sm"
              style={{ backgroundColor: GYS_GOLD }}
            >
              Register Your School
              <ArrowRight className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/for-schools/preview')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/70 bg-white/10 px-8 py-3 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:text-sm"
            >
              Try Institutional Experience
              <ArrowRight className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            </button>
           
          </div>
        </div>
      </section>

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
