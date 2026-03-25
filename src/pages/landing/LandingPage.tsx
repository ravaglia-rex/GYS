import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const GYS_BLUE = '#1e3a8a';
const GYS_GOLD = '#fbbf24'; // brighter, radiant gold (amber-400)

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
  const [howVisible, setHowVisible] = useState(false);
  const [tiersVisible, setTiersVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const howRef = useRef<HTMLDivElement | null>(null);
  const tiersRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === statsRef.current && entry.isIntersecting) {
            setStatsVisible(true);
          }
          if (entry.target === howRef.current && entry.isIntersecting) {
            setHowVisible(true);
          }
          if (entry.target === tiersRef.current && entry.isIntersecting) {
            setTiersVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    if (howRef.current) observer.observe(howRef.current);
    if (tiersRef.current) observer.observe(tiersRef.current);

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 border-b border-gray-200 backdrop-blur">
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
              onClick={() => scrollToSection('how-it-works')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('for-schools')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              For Schools
            </button>
            <a href="#for-students" className="text-gray-600 hover:text-gray-900 transition-colors duration-150">
              For Students
            </a>
            <button
              type="button"
              onClick={() => scrollToSection('performance-tiers')}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
            >
              Pricing
            </button>
          </nav>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-150"
            style={{ backgroundColor: GYS_BLUE }}
          >
            Log In
          </button>
        </div>
      </header>

      {/* Hero */}
      <section
        className="px-6 pt-16 pb-10 md:pt-24 md:pb-12 relative overflow-hidden bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a]"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-10 left-4 md:left-16 w-56 h-56 rounded-full bg-blue-400/10 hero-orb-a" />
          <div className="absolute bottom-4 right-4 md:right-16 w-64 h-64 rounded-full bg-indigo-400/5 hero-orb-b" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-blue-300/5 hero-orb-c" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Where Do Your Students Stand Among the{' '}
            <span style={{ color: GYS_GOLD }}>World&apos;s Best?</span>
          </h2>
          <p className="mt-6 text-lg text-white/90 max-w-2xl mx-auto">
            India&apos;s premier global benchmarking program for college-bound students.
            Reasoning. Personality. English fluency. Five assessments that place students
            on the world stage.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white text-sm backdrop-blur-sm hover:bg-white/20 transition-colors duration-150">
              <span className="text-base">🎓</span>
              <span>Grades 6-12</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white text-sm backdrop-blur-sm hover:bg-white/20 transition-colors duration-150">
              <span className="text-base">🌍</span>
              <span>Global Norms</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white text-sm backdrop-blur-sm hover:bg-white/20 transition-colors duration-150">
              <span className="text-base">📝</span>
              <span>5 Assessments</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white text-sm backdrop-blur-sm hover:bg-white/20 transition-colors duration-150">
              <span className="text-base">🏫</span>
              <span>500+ Partner Schools</span>
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-slate-900 font-semibold text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cta-pulse"
              style={{ backgroundColor: GYS_GOLD }}
            >
              I&apos;m a Student
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/for-schools')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white font-semibold text-base border-2 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
              style={{ borderColor: GYS_BLUE, color: GYS_BLUE }}
            >
              I&apos;m a School / Institution
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div
          ref={statsRef}
          className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <StatItem
            target={50000}
            suffix="+"
            label="Students Assessed Globally"
            trigger={statsVisible}
          />
          <StatItem
            target={30}
            suffix="+"
            label="Countries Represented"
            trigger={statsVisible}
          />
          <StatItem
            target={500}
            suffix="+"
            label="Partner Schools"
            trigger={statsVisible}
          />
          <StatItem
            target={95}
            suffix="%"
            label="Parent Satisfaction"
            trigger={statsVisible}
          />
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        ref={howRef}
        className={`bg-white py-14 md:py-16 scroll-mt-20 transition-all duration-700 ${
          howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            How It Works
          </h3>
          <p className="text-gray-600 mt-2">Three steps to a global profile</p>
          <div className="mt-10 md:mt-12 grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="rounded-2xl border border-gray-200 border-t-4 p-6 md:p-7 relative bg-slate-50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-150"
              style={{ borderTopColor: GYS_BLUE }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg absolute -top-3 left-6"
                style={{ backgroundColor: GYS_BLUE }}
              >
                1
              </div>
              <h4 className="font-bold text-lg text-gray-900 mt-4">Take Assessments</h4>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                World-class reasoning, personality, and English fluency assessments - online,
                proctored, on your schedule.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 border-t-4 p-6 md:p-7 relative bg-slate-50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-150"
              style={{ borderTopColor: GYS_BLUE }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg absolute -top-3 left-6"
                style={{ backgroundColor: GYS_BLUE }}
              >
                2
              </div>
              <h4 className="font-bold text-lg text-gray-900 mt-4">Get Your Tier</h4>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                Earn Diamond, Platinum, Gold, Silver, or Bronze – benchmarked against
                college-bound students worldwide.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 border-t-4 p-6 md:p-7 relative bg-slate-50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-150"
              style={{ borderTopColor: GYS_BLUE }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg absolute -top-3 left-6"
                style={{ backgroundColor: GYS_BLUE }}
              >
                3
              </div>
              <h4 className="font-bold text-lg text-gray-900 mt-4">Build Your Path</h4>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                Personalized reports, course recommendations, and college mapping to help
                you get where you&apos;re going.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Tiers */}
      <section
        id="performance-tiers"
        ref={tiersRef}
        className={`bg-white pt-0 pb-10 md:pt-0 md:pb-12 scroll-mt-20 transition-all duration-700 ${
          tiersVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            Performance Tiers
          </h3>
          <p className="text-gray-600 mt-2">Where will you land?</p>
          <div className="mt-8 md:mt-10 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5">
            {[
              {
                name: 'Diamond',
                bg: 'bg-[#e5f3ff]',
                text: 'text-[#0060df]',
                border: 'border-[#0060df]',
                icon: <span className="text-3xl">💎</span>,
              },
              {
                name: 'Platinum',
                bg: 'bg-[#f3f4f6]',
                text: 'text-gray-800',
                border: 'border-gray-400',
                icon: <span className="text-3xl">⬜️</span>,
              },
              {
                name: 'Gold',
                bg: 'bg-[#fef3c7]', // amber-100
                text: 'text-[#b45309]', // warm amber
                border: 'border-[#f59e0b]', // amber-500
                icon: <span className="text-3xl">🥇</span>,
              },
              {
                name: 'Silver',
                bg: 'bg-[#f3f4f6]',
                text: 'text-gray-700',
                border: 'border-gray-400',
                icon: <span className="text-3xl">🥈</span>,
              },
              {
                name: 'Bronze',
                bg: 'bg-[#ffe4d6]',
                text: 'text-[#b5561c]',
                border: 'border-[#ea580c]',
                icon: <span className="text-3xl">🥉</span>,
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl p-5 border ${tier.border} ${tier.bg} ${tier.text} flex flex-col items-center justify-center min-h-[120px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-150`}
              >
                {tier.icon && <span className="mb-2">{tier.icon}</span>}
                <span className="font-bold text-lg">{tier.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section
        id="for-schools"
        className="bg-slate-100 border-t border-gray-200 pb-10 md:pb-12 pt-6 md:pt-10 scroll-mt-20"
      >
        <div className="max-w-5xl mx-auto px-6 space-y-6">
          {/* EducationWorld — full-width card */}
          <div>
           
            <div className="rounded-2xl bg-[#e0edff] px-6 py-5 shadow-sm sm:px-8 sm:py-6">
              <div className="flex items-center gap-5">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl px-2 text-[11px] font-semibold leading-tight text-white sm:h-20 sm:w-20 sm:text-xs"
                  style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}
                >
                  Education
                  <br />
                  World
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 sm:text-base">
                    Presented by EducationWorld
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700 sm:text-sm sm:leading-relaxed">
                    India&apos;s #1 education media platform.
                    <br />
                    Trusted by 500+ schools and millions of parents nationwide.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* In Partnership With — below, full-width */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-3 text-center">
              In partnership with
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Access USA', 'Argus'].map((partner) => (
                <span
                  key={partner}
                  className="px-6 py-3 rounded-xl bg-white text-slate-700 text-sm font-semibold shadow-sm ring-1 ring-slate-100 hover:shadow-md hover:ring-slate-200 transition-all duration-150"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
            <button type="button" onClick={() => scrollToSection('for-schools')} className="text-gray-600 hover:text-gray-900">
              For Schools
            </button>
            <a href="#for-students" className="text-gray-600 hover:text-gray-900">For Students</a>
            <a href="#assessments" className="text-gray-600 hover:text-gray-900">Assessments</a>
            <a href="#privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</a>
            <a href="#terms" className="text-gray-600 hover:text-gray-900">Terms of Service</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
          </nav>
          <p className="text-center text-gray-500 text-sm mt-6">
            © 2026 Global Young Scholar. A joint initiative of Access USA, Argus, and
            EducationWorld.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
