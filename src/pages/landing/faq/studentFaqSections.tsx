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
              Global Young Scholar (GYS) provides a sequential reasoning and proficiency assessment
              program for students in Grades 6–12 to identify those who show exceptional promise for
              success in higher education and also for helping students understand how their
              performance compares to domestic and international populations. The GYS exams measure
              symbolic reasoning, verbal reasoning, mathematical reasoning, personality, English
              proficiency, and AI literacy through six progressively deeper assessments. The exams help
              students in Grades 6–12 understand their academic strengths, identify areas for growth,
              and receive guidance on educational decisions. It measures how your child thinks — their
              reasoning ability, personality traits, English proficiency, and AI literacy — not just
              what they&apos;ve memorized.
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
            Triad tier and above, students in Grades 8–9 receive AI-driven guidance on which academic
            stream to pursue (PCM, PCB, Commerce, or Humanities) — one of the most consequential
            decisions in an Indian student&apos;s academic career. Practice questions are available for
            every exam type so your child can prepare and improve.
          </p>
        ),
      },
      {
        question: 'How much does it cost?',
        answer: (
          <>
            <p>
              Membership is on an annual subscription basis. Students can challenge exams at
              progressive performance tiers, progressing one-to-the-next as they achieve mastery.
            </p>
            <ul>
              <li>
                <strong>Discovery</strong> — ₹499. Exam 1 (Symbolic Reasoning). Score report with
                overall reasoning assessment and national percentile benchmarking.
              </li>
              <li>
                <strong>Reasoning Triad</strong> — ₹1,299. Exams 1–3 (Symbolic, Verbal, and
                Mathematical Reasoning).
              </li>
              <li>
                <strong>Guided Decision</strong> — ₹2,499. All six assessments including personality,
                English proficiency, and AI literacy. Full multi-domain report, detailed cross-synthesis
                report plus AI-driven stream-selection recommendation for Grades 8–9,
                college/university matching for students in Grades 10–12, one live counselor session,
                and access to the Launchpad Rankings College Guide.
              </li>
            </ul>
            <p>
              If your child&apos;s school has an institutional subscription, your child may already have
              access at no additional family cost. Check with your school.
            </p>
          </>
        ),
      },
      {
        question: 'Can my child upgrade later?',
        answer: (
          <p>
            Yes. You always pay only the difference. If your child starts at Discovery (₹499) and
            later upgrades to the full Reasoning Triad, you pay ₹800 — not ₹1,299. From the Reasoning
            Triad to Guided Decision, you pay ₹1,200. Your child is never penalized for starting at a
            lower tier.
          </p>
        ),
      },
      {
        question: 'Can my child take the exams on a phone?',
        answer: (
          <p>
            Yes. All assessments are accessible on mobile phones, tablets, laptops, and desktops. Exam
            5 (English Proficiency) includes a speaking component that works best on a device with a
            microphone, but all other exams work on any device.
          </p>
        ),
      },
      {
        question: 'How long do the exams take?',
        answer: (
          <p>
            Each reasoning exam (Symbolic, Verbal, Mathematical) is individually timed per question —
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
            their performance tier. On retake, students start at the highest difficulty tier they
            previously cleared — they don&apos;t repeat introductory content. Practice questions are
            available to help your child prepare between attempts.
          </p>
        ),
      },
      {
        question: 'Is this just another coaching exam? How is GYS different?',
        answer: (
          <p>
            GYS is not a coaching product and does not teach to a test. It is a reasoning assessment
            — it measures how your child thinks, not what they&apos;ve been drilled on. Unlike
            Olympiads or entrance exams that reward subject-specific preparation, GYS measures abstract
            reasoning, analytical thinking, and personality traits that predict long-term academic
            success. The results feed into personalized guidance: stream selection, college matching,
            and career exploration — not just a score and a rank.
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
            data, combined guidance and optional counselor sessions, creates a single pathway from
            early assessment through university admission.
          </p>
        ),
      },
      {
        question: "Is my child's data safe?",
        answer: (
          <p>
            Yes. GYS collects only the information necessary to deliver assessments and guidance.
            Personal data is not shared with third parties. If your child&apos;s school has an
            institutional subscription, the school sees assessment performance only for students in
            their program. We do not sell student data and we will never contact your child with
            unrelated marketing.
          </p>
        ),
      },
      {
        question: "My child's school is offering GYS. Do I still need to buy it separately?",
        answer: (
          <p>
            If your school has an institutional subscription, your child likely has access to Exams
            1–3 at no additional cost to your family. Check with your school about which tier
            they&apos;ve selected. If you want access to the full assessment suite (including
            personality, English proficiency, AI literacy, and college matching), you can upgrade
            individually to Guided Decision and pay only the difference beyond what your school&apos;s
            tier covers.
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
