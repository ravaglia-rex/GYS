import type { LandingFaqItem } from '../../../components/landing/LandingFaq';
import {
  FaqLink,
  FAQ_PREVIEW_HUB,
  FAQ_SCHOOL_DASHBOARD_PREVIEW,
  FAQ_SAMPLE_ASSESSMENT,
} from './previewFaqLinks';

export const schoolFaqSections: { heading: string; items: LandingFaqItem[] }[] = [
  {
    heading: 'For Schools & Institutions',
    items: [
      {
        question: 'What is GYS?',
        answer: (
          <p>
            Global Young Scholar (GYS) provides a sequential reasoning and proficiency assessment
            program for students in Grades 6–12 to identify those who show exceptional promise for
            success in higher education and also for helping schools understand the performance of
            their students, individually and in aggregate, in comparison to domestic and
            international populations. The GYS exams measure symbolic reasoning, verbal reasoning,
            mathematical reasoning, personality, English proficiency, and AI literacy through six
            progressively deeper assessments. GYS classifies students into internationally recognized
            performance tiers that signal academic readiness and potential.
          </p>
        ),
      },
      {
        question: 'How does GYS relate to the EducationWorld School Rankings?',
        answer: (
          <p>
            GYS assessment data contributes approximately 15% to a school&apos;s EducationWorld India
            School Ranking, serving as an input value for several categories. Schools that administer
            GYS receive a performance tier designation — updated quarterly — that feeds directly into
            the ranking methodology. The ranking considers both participation (how many of your
            students take the assessments) and performance (how your top students score). This is the
            most actionable lever available to schools seeking to improve or maintain their ranking
            position.
          </p>
        ),
      },
      {
        question: 'What does it cost for our school?',
        answer: (
          <>
            <p>GYS offers three institutional tiers:</p>
            <ul>
              <li>
                <strong>Pilot</strong> — ₹2 lakh per year (up to ~200 students). Includes Exam 1
                (Symbolic Reasoning) for all students, basic institutional reporting, and quarterly
                performance updates.
              </li>
              <li>
                <strong>Standard</strong> — ₹3 lakh per year (up to ~500 students). Includes Exams
                1–3 (the full reasoning triad), detailed analytics, comparative peer analysis, and
                student-level and class-level breakdowns.
              </li>
              <li>
                <strong>Partner/Flagship</strong> — ₹5 lakh per year (no student cap). Same assessment
                access as Standard, plus stream-selection insights, dedicated support, and
                implementation assistance.
              </li>
            </ul>
          </>
        ),
      },
      {
        question: 'What do we need to do to get started?',
        answer: (
          <p>
            Visit the GYS website, select your institutional tier, and complete payment. Once enrolled,
            you can follow several defined procedures to register your students. Once registered,
            students verify their email, and begin assessments from any device — including mobile
            phones. There is no need to schedule exam sessions, allocate classroom time, or install
            any software.
          </p>
        ),
      },
      {
        question: 'How much time does this take from our school day?',
        answer: (
          <p>
            None. All assessments are completed by students independently, on their own devices, at
            their own pace. Students can take exams from home. Your only administrative task is
            facilitating communication to students and parents — we provide all the materials for
            that.
          </p>
        ),
      },
      {
        question: 'What reports does our school receive?',
        answer: (
          <p>
            Your school dashboard displays grade-wise performance distributions (what percentage of
            students in each grade have reached each difficulty tier), your school&apos;s
            EducationWorld ranking position, and detailed analytics on student engagement.
            Downloadable institutional reports provide class-level breakdowns that are actionable for
            school leadership — for example: &quot;20% of your 8th graders are performing at a level
            expected of strong college candidates. 40% are developing. 40% need support.&quot;
          </p>
        ),
      },
      {
        question: 'Can we start with just one grade or a small group of students?',
        answer: (
          <p>
            Yes. Many schools begin with Grades 8–9, where the stream-selection guidance (PCM vs.
            PCB vs. Commerce vs. Humanities) is most immediately valuable. You can expand to
            additional grades in subsequent years.
          </p>
        ),
      },
      {
        question: 'Is the assessment proctored?',
        answer: (
          <p>
            Not in Year 1. GYS uses layered integrity measures instead of formal proctoring:
            questions are drawn randomly from a large bank, each question has its own time limit,
            students cannot go back to previous questions, and AI-driven pattern analysis flags
            irregularities after submission. This approach prioritizes accessibility and
            participation volume. A certified proctored version may be introduced in the future if
            warranted by data.
          </p>
        ),
      },
      {
        question: "What if our students don't have school email addresses?",
        answer: (
          <p>
            Students can register with personal email addresses (Gmail, etc.). Schools must supply us
            with a student email list — whether school-issued or personal. We automatically associate
            those students with your school when they register. Alternatively, we can provide your
            school with a unique tagged link to forward to families; any student who registers through
            that link is automatically associated with your school.
          </p>
        ),
      },
      {
        question: 'Do we control what data is shared?',
        answer: (
          <p>
            For students whose assessment access comes through your institutional subscription, you
            have full visibility into individual scores, subscores, and reports.
          </p>
        ),
      },
      {
        question: 'Can we see the assessment before committing?',
        answer: (
          <p>
            Yes. Open the <FaqLink to={FAQ_PREVIEW_HUB}>interactive preview hub</FaqLink> to explore the{' '}
            <FaqLink to={FAQ_SCHOOL_DASHBOARD_PREVIEW}>school dashboard</FaqLink> with sample data, or try
            a <FaqLink to={FAQ_SAMPLE_ASSESSMENT}>live sample assessment</FaqLink> (~10 questions) that
            demonstrates the exam experience. No account or payment is required.
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
            For families, membership in the Global Young Scholar program is by annual subscription.
            During your child&apos;s membership, your child has access to the assessments included in
            their subscription. For schools, the institutional fee is annual.
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
            Yes. Use the <FaqLink to={FAQ_PREVIEW_HUB}>interactive preview hub</FaqLink> for a free
            walkthrough: <FaqLink to={FAQ_SCHOOL_DASHBOARD_PREVIEW}>school dashboard</FaqLink> with
            sample data and a <FaqLink to={FAQ_SAMPLE_ASSESSMENT}>live sample assessment</FaqLink> (~10
            questions) that demonstrates the exam experience. No payment or account creation is
            required. This lets you experience the format and see what the results look like before
            committing.
          </p>
        ),
      },
    ],
  },
];
