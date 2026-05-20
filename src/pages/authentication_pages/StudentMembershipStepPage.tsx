import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PublicHomeNavButton from '../../components/layout/PublicHomeNavButton';
import { useStudentSignupExit } from '../../contexts/StudentSignupExitContext';
import { useStudentSignupExitGuard } from '../../hooks/useStudentSignupExitGuard';
import {
  formatInrFromPaise,
  MEMBERSHIP_LEVEL_LABEL,
  normalizeStudentMembershipLevel,
  studentMembershipUpgradeAmountPaise,
} from '../../utils/studentMembershipPricing';
import { mergeSignupState, writeSignupDraft } from '../../utils/studentSignupDraft';

const GYS_BLUE = '#1e3a8a';

type MembershipLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';

function membershipCodeToNumericLevel(code: MembershipLevel): 1 | 2 | 3 | 4 {
  if (code === 'LEVEL_1') return 1;
  if (code === 'LEVEL_2') return 2;
  if (code === 'LEVEL_3') return 3;
  return 4;
}

function numericLevelToMembershipCode(level: 1 | 2 | 3 | 4): MembershipLevel {
  if (level === 1) return 'LEVEL_1';
  if (level === 2) return 'LEVEL_2';
  if (level === 3) return 'LEVEL_3';
  return 'LEVEL_4';
}

const StudentMembershipStepPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const merged = useMemo(
    () =>
      mergeSignupState(location.state) as {
        membershipLevel?: MembershipLevel;
        schoolCoveredMembershipLevel?: number;
        schoolPaymentComplete?: boolean;
        schoolName?: string;
      },
    [location]
  );
  const schoolCoveredLevel = normalizeStudentMembershipLevel(merged.schoolCoveredMembershipLevel);
  const effectiveCoveredLevel = merged.schoolPaymentComplete === true ? schoolCoveredLevel : 0;
  const savedMembershipLevel: MembershipLevel | undefined =
    merged.membershipLevel === 'LEVEL_1' ||
    merged.membershipLevel === 'LEVEL_2' ||
    merged.membershipLevel === 'LEVEL_3' ||
    merged.membershipLevel === 'LEVEL_4'
      ? merged.membershipLevel
      : undefined;

  const defaultLevel: MembershipLevel =
    savedMembershipLevel &&
    (effectiveCoveredLevel < 1 || membershipCodeToNumericLevel(savedMembershipLevel) >= effectiveCoveredLevel)
      ? savedMembershipLevel
      : effectiveCoveredLevel >= 1
      ? numericLevelToMembershipCode(effectiveCoveredLevel as 1 | 2 | 3 | 4)
      : 'LEVEL_3';

  const [selectedLevel, setSelectedLevel] = useState<MembershipLevel>(defaultLevel);

  useEffect(() => {
    setSelectedLevel(defaultLevel);
  }, [defaultLevel, location]);
  const [showComparison, setShowComparison] = useState(true);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    if (
      effectiveCoveredLevel >= 1 &&
      membershipCodeToNumericLevel(selectedLevel) < effectiveCoveredLevel
    ) {
      setSelectedLevel(numericLevelToMembershipCode(effectiveCoveredLevel as 1 | 2 | 3 | 4));
    }
  }, [effectiveCoveredLevel, selectedLevel]);

  const { requestLeave } = useStudentSignupExit();

  useStudentSignupExitGuard(true);

  const levels = [
    {
      id: 'LEVEL_1' as MembershipLevel,
      numericLevel: 1 as const,
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
      numericLevel: 2 as const,
      label: 'Membership 1',
      name: 'Reasoning Triad',
      price: '₹899',
      priceSuffix: 'per year',
      oneTime: false,
      badge: null as string | null,
      borderColor: 'border-slate-200',
      background: 'bg-white',
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
      numericLevel: 3 as const,
      label: 'Membership 2',
      name: 'Reasoning + Skills',
      price: '₹1,799',
      priceSuffix: 'per year',
      oneTime: false,
      badge: 'Most Popular',
      borderColor: 'border-slate-200',
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
      numericLevel: 4 as const,
      label: 'Membership 3',
      name: 'Guided Decision',
      price: '₹2,699',
      priceSuffix: 'per year',
      oneTime: false,
      badge: null as string | null,
      borderColor: 'border-slate-200',
      background: 'bg-white',
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

  const visibleLevels = levels;
  const selected = levels.find((l) => l.id === selectedLevel)!;
  const selectedNumericLevel = membershipCodeToNumericLevel(selected.id);
  const selectedCoveredBySchool =
    effectiveCoveredLevel >= 1 && selectedNumericLevel <= effectiveCoveredLevel;
  const selectedUpgradeAmountPaise =
    effectiveCoveredLevel >= 1 && selectedNumericLevel > effectiveCoveredLevel
      ? studentMembershipUpgradeAmountPaise(effectiveCoveredLevel, selectedNumericLevel)
      : null;
  const coveredLabel =
    effectiveCoveredLevel >= 1
      ? MEMBERSHIP_LEVEL_LABEL[effectiveCoveredLevel as 1 | 2 | 3 | 4]
      : null;

  const persistMembershipSelection = (level: (typeof levels)[number]) => {
    const numericLevel = level.numericLevel;
    const coveredBySchool =
      effectiveCoveredLevel >= 1 && numericLevel <= effectiveCoveredLevel;
    const upgradeAmountPaise =
      effectiveCoveredLevel >= 1 && numericLevel > effectiveCoveredLevel
        ? studentMembershipUpgradeAmountPaise(effectiveCoveredLevel, numericLevel)
        : null;

    setSelectedLevel(level.id);
    writeSignupDraft({
      membershipLevel: level.id,
      membershipName: level.name,
      membershipPrice: level.price,
      schoolCoveredMembershipLevel: effectiveCoveredLevel,
      membershipCoveredBySchool: coveredBySchool,
      membershipUpgradeAmountPaise: upgradeAmountPaise,
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsContinuing(true);
    const base = mergeSignupState(location.state) as Record<string, unknown>;
    const nextState = {
      ...base,
      membershipLevel: selected.id,
      membershipName: selected.name,
      membershipPrice: selected.price,
      schoolCoveredMembershipLevel: effectiveCoveredLevel,
      membershipCoveredBySchool: selectedCoveredBySchool,
      membershipUpgradeAmountPaise: selectedUpgradeAmountPaise,
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
          {coveredLabel && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              <p className="font-semibold">Your school has already paid for {coveredLabel}.</p>
              <p className="mt-1 text-xs leading-relaxed sm:text-sm">
                You can continue with this school-covered package at no cost, or choose a higher
                package and pay only the difference now.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:space-y-5">
            <div className="space-y-3">
              {visibleLevels.map((level) => {
                const isSelected = selectedLevel === level.id;
                const includedBySchool =
                  effectiveCoveredLevel >= 1 && level.numericLevel <= effectiveCoveredLevel;
                const isLowerIncludedTier =
                  effectiveCoveredLevel >= 1 && level.numericLevel < effectiveCoveredLevel;
                const isCurrentSchoolPackage =
                  effectiveCoveredLevel >= 1 && level.numericLevel === effectiveCoveredLevel;
                const upgradeAmount =
                  effectiveCoveredLevel >= 1 && level.numericLevel > effectiveCoveredLevel
                    ? studentMembershipUpgradeAmountPaise(effectiveCoveredLevel, level.numericLevel)
                    : null;
                const priceLabel = includedBySchool
                  ? 'Included'
                  : upgradeAmount != null
                    ? formatInrFromPaise(upgradeAmount)
                    : level.price;
                const priceSuffix = includedBySchool
                  ? 'by school'
                  : upgradeAmount != null
                    ? 'upgrade'
                    : level.priceSuffix;

                return (
                  <button
                    key={level.id}
                    type="button"
                    disabled={isLowerIncludedTier}
                    onClick={() => persistMembershipSelection(level)}
                    className={`relative w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-[#1e3a8a] bg-blue-50 shadow-sm'
                        : isLowerIncludedTier
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-75'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {level.badge && (
                      <span className="absolute -top-2.5 right-3 rounded-full bg-[#fbbf24] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-sm">
                        Popular
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            isSelected ? 'border-[#1e3a8a]' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && (
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: GYS_BLUE }}
                            />
                          )}
                        </span>
                        <div>
                          <p
                            className={`text-xs font-semibold uppercase tracking-wide ${
                              isSelected ? 'text-blue-800' : 'text-slate-500'
                            }`}
                          >
                            {level.label}
                          </p>
                          <p className="text-sm font-bold text-slate-900 sm:text-base">
                            {level.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {level.oneTime ? 'One-time entry plan' : 'Annual membership'}
                          </p>
                          {isCurrentSchoolPackage && (
                            <p className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                              Current school package
                            </p>
                          )}
                          {isLowerIncludedTier && (
                            <p className="mt-1 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                              Included in school package
                            </p>
                          )}
                          <div
                            className={`grid transition-all duration-300 ease-out ${
                              isSelected
                                ? 'mt-2 grid-rows-[1fr] opacity-100'
                                : 'mt-0 grid-rows-[0fr] opacity-0'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <ul className="mt-2 space-y-0.5">
                                {level.features.filter((feature) => feature.included).map((feature) => (
                                  <li
                                    key={feature.text}
                                    className="flex items-start gap-1 text-xs text-slate-600"
                                  >
                                    <span className="mt-px text-emerald-600">
                                      ✓
                                    </span>
                                    {feature.text}
                                  </li>
                                ))}
                              </ul>
                              {level.footer && (
                                <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-slate-800 ring-1 ring-blue-100">
                                  {level.footer}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p
                        className="shrink-0 text-base font-bold sm:text-lg"
                        style={{ color: GYS_BLUE }}
                      >
                        {priceLabel}
                        <span className="block text-right text-xs font-normal text-slate-500">
                          {priceSuffix}
                        </span>
                      </p>
                    </div>
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

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={goBackToSchoolStep}
                className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-sm sm:text-base font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 active:scale-95"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isContinuing}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm sm:text-base font-semibold text-white shadow-md transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isContinuing ? 'Loading...' : 'Continue →'}
              </button>
            </div>

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

