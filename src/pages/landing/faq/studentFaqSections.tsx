import type { LandingFaqItem } from '../../../components/landing/LandingFaq';
import {
  FaqLink,
  FAQ_PREVIEW_HUB,
  FAQ_STUDENT_DASHBOARD_PREVIEW,
  FAQ_SAMPLE_ASSESSMENT,
} from './previewFaqLinks';

export const studentFaqSections: { heading: string; items: LandingFaqItem[] }[] = [
  {
    heading: 'For Parents & Students',
    items: [
      {
        question: 'What is GYS?',
        answer: (
          <>
            <p>
            GYS assessment data contributes approximately 15% to a school’s EducationWorld India School Ranking, serving as an assessment-backed input into the ranking methodology.

EducationWorld considers both participation — how many eligible students complete GYS assessments — and performance — how students perform across the assessment suite. Participating schools receive a GYS performance designation, updated periodically, that feeds into the EducationWorld rankings framework.

For schools seeking to improve or maintain their ranking position, GYS provides a clear, actionable way to demonstrate student achievement through structured, comparable assessment data.
            </p>
          </>
        ),
      },
      {
        question: 'What does my child actually get from this?',
        answer: (
          <p>
            After completing the assessments, your child receives a detailed score report showing
            where they stand across reasoning dimensions, how they compare to other students
            nationally, and specific guidance on strengths and areas to develop. At the Reasoning
            Reasoning Triad package and above, students in Grades 8–9 receive AI-driven guidance on which academic
            stream to pursue (PCM, PCB, Commerce, or Humanities), one of the most consequential
            decisions in an Indian student&apos;s academic career.{' '}
            <strong>Practice Mode</strong> is available for format familiarity: it uses a separate question pool and
            does not affect official scores or tiers.
          </p>
        ),
      },
      {
        question: 'How much does it cost?',
        answer: (
          <>
            <p>
              There are <strong>three annual packages</strong>, each billed annually (Rev 13, April 2026).{' '}
              <strong>Discovery (₹299)</strong> is a separate, limited-time <strong>one-time entry offer</strong>;
              we don&apos;t count it as an annual package; it&apos;s an on-ramp you can upgrade from.
              Within Reasoning, students progress through three difficulty levels as they achieve mastery. After
              the official triad, a <strong>nationwide Performance Tier</strong> (Explorer → Diamond) describes
              absolute positioning vs a national norm, separate from the <strong>school leaderboard</strong>, which
              highlights top students <em>per exam, per grade, at that school</em> (monthly, parent opt-in). Retakes
              follow the published cadence.
            </p>
            <ul>
              <li>
                <strong>Discovery - Early offer</strong> - ₹299 one-time. Exam 1 (Symbolic Reasoning)
                only. No performance tier or school leaderboard; dashboard shows locked previews of higher
                packages. Per-exam score report with category-level breakdowns.
              </li>
              <li>
                <strong>Membership 1 • Reasoning Triad</strong> - ₹899/year. Full Reasoning group: Exams 1–3.
                Unlocks national Performance Tier after official triad runs, plus optional school leaderboard
                visibility (parent opt-in; top performers per exam per grade at the school). Light stream/career
                signaling from triad performance.
              </li>
              <li>
                <strong>Membership 2 • Reasoning + Skills</strong> - ₹1,799/year. Reasoning group plus Skills
                group: Exams 1–5 (adds English Proficiency and AI Proficiency).
              </li>
              <li>
                <strong>Membership 3 • Guided Decision</strong> - ₹2,699/year. Full program including Insight
                (e.g. comprehensive personality and career-discovery flows). AI career counseling is an ongoing
                relationship that begins after that Insight baseline: students return to log experiences (labs,
                internships, classes, talks) so the profile gets richer; this is the package&apos;s main long-term renewal
                driver. Counseling-related data is available to third parties working with your child when your child
                chooses to share it; the data travels with the student.
              </li>
            </ul>
            <p>
              If your child&apos;s school has an institutional package, your child may already have
              access at no additional family cost. Check with your school.
            </p>
          </>
        ),
      },
      {
        question: 'Can my child upgrade later?',
        answer: (
          <>
            <p>
              Yes. <strong>Discovery is credited</strong> toward any annual package: you pay only
              the difference in <strong>list price</strong> when you move up (18% GST is applied on the
              upgrade payment at checkout). The same rule applies between the three annual packages. Your
              child is never penalized for starting lower.
            </p>
            <p className="mt-3 text-sm">
              Rev 13 upgrade deltas (list price, before GST):
            </p>
            <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[280px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 font-semibold text-slate-800">Upgrade</th>
                    <th className="px-3 py-2 font-semibold text-slate-800">Delta</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {[
                    ['Discovery → Reasoning Triad', '₹600'],
                    ['Discovery → Reasoning + Skills', '₹1,500'],
                    ['Discovery → Guided Decision', '₹2,400'],
                    ['Reasoning Triad → Reasoning + Skills', '₹900'],
                    ['Reasoning Triad → Guided Decision', '₹1,800'],
                    ['Reasoning + Skills → Guided Decision', '₹900'],
                  ].map(([path, delta]) => (
                    <tr key={path} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2">{path}</td>
                      <td className="px-3 py-2 font-medium tabular-nums">{delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ),
      },
      {
        question: 'Can my child take the exams on a phone?',
        answer: (
          <p>
            Yes. All assessments are accessible on mobile phones, tablets, laptops, and desktops. Exam
            4 (English Proficiency) includes a speaking component that works best on a device with a
            microphone, but all other exams work on any device.
          </p>
        ),
      },
      {
        question: 'How long do the exams take?',
        answer: (
          <p>
            Each reasoning exam (Symbolic, Verbal, Mathematical) is individually timed per question;
            most students complete each exam in 45–60 minutes. The Personality Assessment is untimed and
            takes approximately 30–45 minutes. Students can complete their purchased exams at their own
            pace over days or weeks; there is no requirement to finish everything in one sitting.
          </p>
        ),
      },
      {
        question: 'Can my child retake exams?',
        answer: (
          <p>
            Yes. Students are encouraged to retake assessments annually to track growth and improve
            their performance tier. On retake, students start at the highest difficulty level they
            previously cleared; they don&apos;t repeat introductory content. Practice questions are
            available to help your child prepare between attempts.
          </p>
        ),
      },
      {
        question: 'Is this just another coaching exam? How is GYS different?',
        answer: (
          <p>
            GYS is not a coaching product and does not teach to a test. It is a reasoning assessment;
            it measures how your child thinks, not what they&apos;ve been drilled on. Unlike
            Olympiads or entrance exams that reward subject-specific preparation, GYS measures abstract
            reasoning, analytical thinking, and personality traits that predict long-term academic
            success. The results feed into personalized guidance: stream selection, college matching,
            and career exploration, not just a score and a rank.
          </p>
        ),
      },
      {
        question: 'How does GYS help with college admissions?',
        answer: (
          <p>
            GYS performance is one of the factors that colleges evaluate when reviewing candidates for
            admission. Because the GYS scores correlate highly with academic success, they are a
            reliable measure, especially when other aspects of a student&apos;s application might not be
            obvious. At the Guided Decision level, students receive specific university matching:
            &quot;Based on your profile, here are universities where you&apos;d be competitive.&quot; GYS
            guidance layers on an ongoing counseling relationship after the Insight baseline; when families choose to
            share the counseling profile, that information is available to universities or other partners the student
            involves, always under the student&apos;s control.
          </p>
        ),
      },
      {
        question: "Is my child's data safe?",
        answer: (
          <p>
            Yes. GYS collects only the information necessary to deliver assessments and guidance.
            Personal data is not shared with third parties without appropriate consent. Counseling outputs are shared
            outward only when the student or family opts in. If your child&apos;s school has an
            institutional package, the school sees assessment performance only for students in
            their program. We do not sell student data and we will never contact your child with
            unrelated marketing.
          </p>
        ),
      },
      {
        question: "My child's school is offering GYS. Do I still need to buy it separately?",
        answer: (
          <p>
            If your school has an institutional package, your child likely has access to Exams
            1–3 at no additional cost to your family. Check with your school which package
            they&apos;ve selected. If you want access to the full assessment suite (including
            Insight exams, English and AI proficiency, and ongoing AI career counseling after the Insight baseline),
            you can upgrade
            individually to Guided Decision and pay only the difference beyond what your school&apos;s
            package covers.
          </p>
        ),
      },
    ],
  },
  {
    heading: 'About Pricing & Payment',
    items: [
      {
        question: 'Is this a subscription or a one-time payment?',
        answer: (
          <p>
            For families, Discovery is a one-time purchase; Reasoning Triad, Reasoning + Skills, and
            Guided Decision renew annually. During the subscription year, your child has access to the
            assessments and features included in that package. For schools, the institutional fee is annual.
          </p>
        ),
      },
      {
        question: 'What payment methods are accepted?',
        answer: (
          <p>
            GYS uses Razorpay for all payments. UPI and credit/debit cards. Wire payments are also
            accepted from schools joining at the Partner/Flagship level.
          </p>
        ),
      },
      {
        question: 'What is the refund policy?',
        answer: (
          <p>Membership in GYS is non-refundable and non-transferable.</p>
        ),
      },
      {
        question: 'Is there a free trial or sample?',
        answer: (
          <p>
            Yes. Open the <FaqLink to={FAQ_PREVIEW_HUB}>interactive preview hub</FaqLink> for sample
            data, a <FaqLink to={FAQ_STUDENT_DASHBOARD_PREVIEW}>sample student dashboard</FaqLink>, and
            a <FaqLink to={FAQ_SAMPLE_ASSESSMENT}>live sample assessment</FaqLink> (~10 questions) that
            demonstrates the exam experience. No payment or account creation is required. This lets
            you experience the format and see what the results look like before committing.
          </p>
        ),
      },
    ],
  },
];
