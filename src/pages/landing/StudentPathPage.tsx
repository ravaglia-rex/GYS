import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';

const GYS_BLUE = '#1e3a8a';
const GYS_GOLD = '#fbbf24';

const StudentPathPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [assessmentsVisible, setAssessmentsVisible] = useState(false);
  const [membershipVisible, setMembershipVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.getAttribute('data-section') === 'assessments') {
              setAssessmentsVisible(true);
            } else if (entry.target.getAttribute('data-section') === 'membership') {
              setMembershipVisible(true);
            }
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    const el1 = document.querySelector('[data-section="assessments"]');
    const el2 = document.querySelector('[data-section="membership"]');
    if (el1) observer.observe(el1);
    if (el2) observer.observe(el2);
    return () => {
      if (el1) observer.unobserve(el1);
      if (el2) observer.unobserve(el2);
    };
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
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate('/students/preview/dashboard')}
                className="w-full max-w-sm rounded-xl border-2 border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:border-white/60 sm:w-auto"
              >
                Try the sample dashboard - no account
              </button>
            </div>
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
                title: '7 Assessments',
                body: 'Reasoning triad, personality profiles, English fluency, AI literacy, and comprehensive personality—benchmarked globally.',
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
          data-section="assessments"
          className={`mt-12 bg-slate-100 border-y border-slate-200 py-8 text-center sm:mt-16 sm:py-10 relative left-1/2 right-1/2 -ml-[50vw] w-screen scroll-mt-20 transition-all duration-600 ${assessmentsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">The Assessments</h2>
            <div className="mt-10 sm:mt-12">
            {(() => {
              const cards = [
                {
                  label: 'Symbolic Reasoning',
                  desc: 'Patterns, rules, and structured logic',
                  icon: '🔢',
                },
                {
                  label: 'Verbal Reasoning',
                  desc: 'Meaning, inference, and argument from text',
                  icon: '📚',
                },
                {
                  label: 'Mathematical Reasoning',
                  desc: 'Number sense, logic, and quantitative thinking',
                  icon: '📐',
                },
                {
                  label: 'Personality Profile',
                  desc: '8 dimensions of how you learn',
                  icon: '🧩',
                },
                {
                  label: 'English Fluency',
                  desc: 'AI-assessed conversational English',
                  icon: '💬',
                },
                {
                  label: 'AI Literacy',
                  desc: 'Skills for learning and working with AI',
                  icon: '🤖',
                },
                {
                  label: 'Comprehensive Personality',
                  desc: 'Deep profile across many dimensions',
                  icon: '✨',
                },
              ];

              const renderCard = (card: { label: string; desc: string; icon: string }) => (
                <div
                  key={card.label}
                  className="rounded-2xl px-3 py-4 text-center shadow-sm sm:px-4 sm:py-5 transition-all duration-300 ease-out hover:scale-[1.04] hover:-translate-y-1 hover:shadow-xl cursor-default"
                  style={{ backgroundColor: 'rgba(30, 58, 138, 0.8)' }}
                >
                  <span className="block text-2xl leading-none sm:text-3xl" aria-hidden="true">
                    {card.icon}
                  </span>
                  <p className="mt-2 text-xs font-semibold text-white sm:text-sm">{card.label}</p>
                  <p className="mt-1 text-xs text-white/80 sm:text-xs">{card.desc}</p>
                </div>
              );

              return (
                <>
                  {/* Phone: 2+2+2+1 layout */}
                  <div className="grid grid-cols-2 gap-3 sm:hidden">
                    {cards.slice(0, 6).map(renderCard)}
                    <div className="col-span-2 flex justify-center">
                      {renderCard(cards[6])}
                    </div>
                  </div>
                  {/* Tablet+: three rows of three + three + one (centered) */}
                  <div className="hidden sm:block">
                    <div className="grid grid-cols-6 gap-3">
                      {cards.slice(0, 3).map((card) => (
                        <div key={card.label} className="col-span-2">
                          {renderCard(card)}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-6 gap-3">
                      {cards.slice(3, 6).map((card) => (
                        <div key={card.label} className="col-span-2">
                          {renderCard(card)}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-6 gap-3">
                      <div className="col-span-2 col-start-3">
                        {renderCard(cards[6])}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
            </div>
          </div>
        </section>

        {/* Membership levels */}
        <section
          data-section="membership"
          className={`mt-12 sm:mt-16 transition-all duration-600 ${membershipVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl text-center">Membership Levels</h2>
          <p className="mt-2 text-center text-xs text-slate-600 sm:text-sm">
            Choose the depth of insight that&apos;s right for you.
          </p>

          <div className="mt-8 sm:mt-10 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
            {[
              {
                name: 'Level 1 - Explore',
                desc: 'Assessment 1 + basic report + tier placement',
                price: '₹999/yr',
                bg: 'bg-[#e5f3ff]',
              },
              {
                name: 'Level 2 - Engage',
                desc: 'Assessments 1–3 (reasoning triad) + cross-synthesis',
                price: '₹4,999/yr',
                bg: 'bg-[#fff7e0]',
              },
              {
                name: 'Level 3 - Excel',
                desc: 'All assessments + personality + English + college guidance',
                price: '₹9,999/yr',
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

        {/* Final CTAs */}
        <section className="mt-12 sm:mt-16">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
            <div
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 px-14 py-3.5 text-sm font-semibold text-slate-500 sm:text-base"
              role="status"
              aria-label="Student signup coming soon"
            >
              Sign Up - Coming soon!
            </div>
            <p className="text-center text-sm text-slate-600 sm:text-base">
              Keep an eye out, student signup isn&apos;t open yet. Try the sample dashboard above to explore
              the experience!
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
              onClick={() => document.getElementById('assessments')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Assessments
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

