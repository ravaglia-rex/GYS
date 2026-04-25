import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { useStudentSignupExit } from '../../contexts/StudentSignupExitContext';
import { useStudentSignupExitGuard } from '../../hooks/useStudentSignupExitGuard';
import { mergeSignupState, writeSignupDraft } from '../../utils/studentSignupDraft';

const GYS_BLUE = '#1e3a8a';

type MembershipLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';

const StudentMembershipStepPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const merged = useMemo(
    () => mergeSignupState(location.state) as { membershipLevel?: MembershipLevel },
    [location]
  );

  const initialLevel: MembershipLevel =
    merged.membershipLevel === 'LEVEL_1' ||
    merged.membershipLevel === 'LEVEL_2' ||
    merged.membershipLevel === 'LEVEL_3' ||
    merged.membershipLevel === 'LEVEL_4'
      ? merged.membershipLevel
      : 'LEVEL_2';

  const [selectedLevel, setSelectedLevel] = useState<MembershipLevel>(initialLevel);

  useEffect(() => {
    const m = mergeSignupState(location.state) as { membershipLevel?: MembershipLevel };
    if (
      m.membershipLevel === 'LEVEL_1' ||
      m.membershipLevel === 'LEVEL_2' ||
      m.membershipLevel === 'LEVEL_3' ||
      m.membershipLevel === 'LEVEL_4'
    ) {
      setSelectedLevel(m.membershipLevel);
    }
  }, [location]);
  const [showComparison, setShowComparison] = useState(true);

  const { requestLeave } = useStudentSignupExit();

  useStudentSignupExitGuard(true);

  const levels = [
    {
      id: 'LEVEL_1' as MembershipLevel,
      label: 'Early offer',
      name: 'Discovery',
      price: '₹299',
      priceSuffix: 'one-time',
      oneTime: true,
      badge: null as string | null,
      borderColor: 'border-slate-200',
      background: 'bg-white',
      accent: 'bg-emerald-500',
      features: [
        { text: 'First look at GYS - Exam 1 (Symbolic Reasoning) only', included: true },
        { text: 'Per-exam score report + category breakdowns', included: true },
        { text: 'Dashboard shows locked previews of features in higher packages', included: true },
        { text: 'No national performance tier or school leaderboard', included: false },
        { text: 'Reasoning Exams 2–3, Skills & Insight groups', included: false },
      ],
      footer: 'Limited-time one-time entry: Not one of the three annual packages. Upgradable while active.',
    },
    {
      id: 'LEVEL_2' as MembershipLevel,
      label: 'Membership 1',
      name: 'Reasoning Triad',
      price: '₹899',
      priceSuffix: 'per year',
      oneTime: false,
      badge: 'Most Popular',
      borderColor: 'border-amber-400',
      background: 'bg-amber-50',
      accent: 'bg-emerald-500',
      features: [
        { text: 'Real talent positioning - full Reasoning group (Exams 1–3)', included: true },
        { text: 'National performance tier + school leaderboard', included: true },
        { text: 'Three-level difficulty progression within Reasoning', included: true },
        { text: 'Light stream/career signaling from triad performance', included: true },
        { text: 'Skills (Exams 4–5) & Insight (Exams 6–7)', included: false },
      ],
      footer: 'Annual subscription • Renews each year.',
    },
    {
      id: 'LEVEL_3' as MembershipLevel,
      label: 'Membership 2',
      name: 'Reasoning + Skills',
      price: '₹1,799',
      priceSuffix: 'per year',
      oneTime: false,
      badge: null as string | null,
      borderColor: 'border-sky-200',
      background: 'bg-white',
      accent: 'bg-sky-600',
      features: [
        { text: 'Talent + 21st-century skills - Reasoning + English + AI (Exams 1-5)', included: true },
        { text: 'Everything in Reasoning Triad', included: true },
        { text: 'Skills credentialing (English Proficiency, AI Proficiency)', included: true },
        { text: 'Insight group (personality & career discovery)', included: false },
      ],
      footer: 'Annual subscription • Insight stays locked until Guided Decision.',
    },
    {
      id: 'LEVEL_4' as MembershipLevel,
      label: 'Membership 3',
      name: 'Guided Decision',
      price: '₹2,699',
      priceSuffix: 'per year',
      oneTime: false,
      badge: null as string | null,
      borderColor: 'border-orange-200',
      background: 'bg-orange-50/80',
      accent: 'bg-orange-500',
      features: [
        {
          text: 'Ongoing AI career counseling after the Insight baseline, students log experiences so the profile deepens over time (primary renewal driver for this package)',
          included: true,
        },
        { text: 'Full program: Reasoning + Skills + Insight (incl. comprehensive personality)', included: true },
        {
          text: 'Counseling data available to third parties working with your student when your student chooses to share it,data travels with the student',
          included: true,
        },
        {
          text: 'Practice Mode (all levels): separate question pool for familiarity only; no impact on official scores • Retake every 4 months within the year',
          included: true,
        },
      ],
      footer: 'Annual subscription • Sustained value from the counseling relationship after Insight is complete.',
    },
  ];

  const selected = levels.find((l) => l.id === selectedLevel)!;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const base = mergeSignupState(location.state) as Record<string, unknown>;
    const nextState = {
      ...base,
      membershipLevel: selected.id,
      membershipName: selected.name,
      membershipPrice: selected.price,
    };
    writeSignupDraft(nextState);
    navigate('/students/register/payment', { state: nextState });
  };

  const goBackToSchoolStep = () => {
    navigate('/students/register/school', { state: mergeSignupState(location.state) });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 bg-white/90 border-b border-gray-200 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={goBackToSchoolStep}
            className="group flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors duration-200 hover:bg-slate-100 rounded-lg px-1 py-0.5 -ml-1"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs transition-all duration-200 group-hover:border-slate-400">
              ←
            </span>
            <span className="hidden xs:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: GYS_BLUE }}
            >
              GYS
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 tracking-tight">
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
              onClick={() => requestLeave(() => navigate('/login'))}
              className="px-4 py-2.5 sm:px-5 rounded-xl text-white text-sm font-medium shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:brightness-110 active:scale-95 transition-all duration-200"
              style={{ backgroundColor: GYS_BLUE }}
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-5 sm:mb-6">
          <p className="text-xs sm:text-sm font-medium uppercase tracking-wide text-slate-500">
            Step 3 of 3 • Choose plan
          </p>
          <div className="mt-2 flex h-1.5 sm:h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="w-1/3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <div className="w-1/3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <div className="w-1/3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
          </div>
        </div>

        <section className="mt-2 rounded-2xl bg-white p-5 sm:p-7 shadow-md ring-1 ring-slate-100">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Choose your plan
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            GYS has <span className="font-semibold text-slate-800">three annual packages</span>{' '}
            (Reasoning Triad, Reasoning + Skills, Guided Decision).{' '}
            <span className="font-semibold text-slate-800">Discovery </span> is a separate limited-time
            one-time entry, not counted as an annual package. You can upgrade anytime and pay only the
            difference.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:space-y-5">
            <div className="space-y-3">
              {levels.map((level) => {
                const isSelected = selectedLevel === level.id;
                const ringColor = isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-slate-200';

                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setSelectedLevel(level.id)}
                    className={`w-full text-left rounded-2xl border ${level.borderColor} ${level.background} ${ringColor} px-4 py-4 sm:px-5 sm:py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-400 bg-white'
                          }`}
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-white" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {level.label}
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-slate-900">
                            {level.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base sm:text-lg font-semibold text-slate-900">
                          {level.price}
                        </p>
                        <p className="text-xs text-slate-500">{level.priceSuffix}</p>
                      </div>
                    </div>
                    {level.badge && (
                      <div className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        {level.badge}
                      </div>
                    )}
                    <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
                      {level.features.map((feature) => (
                        <li key={feature.text} className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[11px] font-bold ${
                              feature.included ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'
                            }`}
                          >
                            {feature.included ? '✓' : ' - '}
                          </span>
                          <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {level.footer && (
                      <p className="mt-3 rounded-lg bg-slate-900/5 px-3 py-2 text-xs font-medium text-slate-800">
                        {level.footer}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
              You can always move up among the three annual packages (or from Discovery into them).
              You&apos;ll only pay the difference. No penalty, no lost data, your existing results carry
              forward.
            </div>

            <button
              type="button"
              onClick={() => setShowComparison((prev) => !prev)}
              className="mx-auto mt-4 flex items-center justify-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800 shadow-sm transition-colors text-center"
            >
              {showComparison ? 'Hide full feature comparison' : 'View full feature comparison'}
            </button>

            {showComparison && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-slate-700">Feature</th>
                      <th className="px-4 py-2 font-semibold text-slate-700 text-center">
                        <span className="block font-normal text-[0.65rem] text-slate-500">Discovery</span>
                        <span className="block text-xs text-slate-500">₹299 • once</span>
                      </th>
                      <th className="px-4 py-2 font-semibold text-slate-700 text-center">
                        M1
                        <span className="block font-normal text-[0.65rem] text-slate-500">annual</span>
                        <span className="block text-xs text-slate-500">₹899/yr</span>
                      </th>
                      <th className="px-4 py-2 font-semibold text-slate-700 text-center">
                        M2
                        <span className="block font-normal text-[0.65rem] text-slate-500">annual</span>
                        <span className="block text-xs text-slate-500">₹1,799/yr</span>
                      </th>
                      <th className="px-4 py-2 font-semibold text-slate-700 text-center">
                        M3
                        <span className="block font-normal text-[0.65rem] text-slate-500">annual</span>
                        <span className="block text-xs text-slate-500">₹2,699/yr</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Reasoning Exam 1 (Symbolic)', '✓', '✓', '✓', '✓'],
                      ['Reasoning Exams 2–3 (Verbal & Mathematical)', ' - ', '✓', '✓', '✓'],
                      ['Skills Exams 4–5 (English & AI)', ' - ', ' - ', '✓', '✓'],
                      ['Insight group, personality & career discovery (Exams 6–7)', ' - ', ' - ', ' - ', '✓'],
                      ['National performance tier (after triad)', ' - ', '✓', '✓', '✓'],
                      ['School leaderboard eligibility', ' - ', '✓', '✓', '✓'],
                      [
                        'Ongoing AI career counseling (after Insight baseline; grows with logged experiences)',
                        ' - ',
                        ' - ',
                        ' - ',
                        '✓',
                      ],
                      ['Practice Mode - separate pool, familiarity only, no official score impact', '✓', '✓', '✓', '✓'],
                    ].map(([feature, l1, l2, l3, l4]) => (
                      <tr key={feature} className="border-t border-slate-100">
                        <td className="px-4 py-2 text-slate-700">{feature}</td>
                        {[l1, l2, l3, l4].map((val, idx) => (
                          <td
                            key={idx}
                            className="px-4 py-2 text-center text-slate-700"
                          >
                            {val === '✓' ? (
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300"> - </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[0.65rem] leading-relaxed text-slate-600 sm:text-xs">
                  <strong>School Leaderboard:</strong> parent or guardian opt-in required (default-private).{' '}
                  <strong>Discovery </strong> is not eligible; leaderboard eligibility starts at Reasoning Triad.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm sm:text-base font-semibold text-white shadow-md hover:bg-blue-700 transition-colors duration-200"
            >
              Next: Payment - {selected.name} (
              {selected.oneTime ? selected.price : `${selected.price}/yr`}) →
            </button>

            <p className="pt-1 text-center text-xs text-slate-500">
              Secure payment via Razorpay, UPI, cards, and net banking accepted.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
};

export default StudentMembershipStepPage;

