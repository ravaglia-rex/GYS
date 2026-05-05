import type { LandingFaqItem } from '../../../components/landing/LandingFaq';
import {
  FaqLink,
  FAQ_PREVIEW_HUB,
  FAQ_STUDENT_DASHBOARD_PREVIEW,
  FAQ_SAMPLE_ASSESSMENT,
} from './previewFaqLinks';

export const studentFaqSections: { heading: string; items: LandingFaqItem[] }[] = [
  {
    heading: 'Student / Family FAQs',
    items: [
      {
        question: 'What is GYS?',
        answer: (
          <>
            <p>
              Global Young Scholar (GYS) is an assessment and guidance program for students in Classes 6–12. It
              helps students understand their reasoning ability, academic readiness, English and AI proficiency,
              personality, interests, and possible career pathways.
            </p>
            <p className="mt-3">
              GYS is different from a regular school exam because it does not only measure what a student has
              memorized. It helps students and families understand how the student thinks, where they are strong,
              where they can grow, and what academic or career directions may fit them best.
            </p>
          </>
        ),
      },
      {
        question: 'What does my child get from GYS?',
        answer: (
          <>
            <p>
              Your child receives detailed reports showing their performance across different reasoning and skill
              areas, along with strengths, growth areas, and guidance on possible next steps.
            </p>
            <p className="mt-3">Depending on the membership, students may receive:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Category-level score reports</li>
              <li>National performance tiers</li>
              <li>Reasoning profile analysis</li>
              <li>English and AI proficiency insights</li>
              <li>Stream-selection guidance</li>
              <li>Career discovery insights</li>
              <li>University-fit recommendations</li>
              <li>Ongoing AI-supported guidance through the Guided Decision membership</li>
            </ul>
            <p className="mt-3">
              For students in Classes 8–10, GYS can be especially helpful for stream-selection conversations,
              including PCM, PCB, Commerce, Humanities, and related academic pathways.
            </p>
          </>
        ),
      },
      {
        question: 'How much does GYS cost?',
        answer: (
          <>
            <p>GYS offers one entry-level option and three annual memberships:</p>
            <ul className="mt-3 list-disc pl-5 space-y-2">
              <li>
                <strong>Discovery</strong> - ₹299 one-time. Includes Exam 1: Symbolic Reasoning. This is a limited
                entry option and does not include the full Reasoning Triad or a national performance tier.
              </li>
              <li>
                <strong>Reasoning Triad</strong> - ₹899/year. Includes Exams 1–3: Symbolic, Verbal, and Mathematical
                Reasoning. Students who complete the triad may earn a national GYS Performance Tier.
              </li>
              <li>
                <strong>Reasoning + Skills</strong> - ₹1,799/year. Includes Exams 1–5, adding English &amp;
                Communication and AI Proficiency.
              </li>
              <li>
                <strong>Guided Decision</strong> - ₹2,699/year. Includes all seven exams, including personality,
                interests, career discovery, and ongoing AI-supported guidance.
              </li>
            </ul>
            <p className="mt-3">
              If your child&apos;s school has purchased an institutional GYS package, your child may already have
              access to some assessments at no additional family cost. Please check with your school.
            </p>
          </>
        ),
      },
      {
        question: 'Can my child upgrade later?',
        answer: (
          <>
            <p>
              Yes. Students can start with a lower package and upgrade later. Discovery is credited toward annual
              memberships, so families pay only the difference in list price when upgrading.
            </p>
            <p className="mt-3">
              The same applies when upgrading from one annual membership to another. Your child is not penalized
              for starting with a lower package.
            </p>
            <p className="mt-3">Applicable taxes may be added at checkout.</p>
          </>
        ),
      },
      {
        question: 'Can my child take the exams on a phone?',
        answer: (
          <p>
            Yes. GYS assessments can be taken on mobile phones, tablets, laptops, or desktops. The English &amp;
            Communication assessment includes speaking components, so it works best on a device with a working
            microphone. Other assessments can be completed on any supported device.
          </p>
        ),
      },
      {
        question: 'How long do the exams take?',
        answer: (
          <p>
            Each Symbolic, Verbal, and Mathematical Reasoning exam has a 40-minute time limit. Other timed assessments
            vary. The Personality assessment is
            untimed and typically takes about 30–45 minutes. Students do not need to complete all assessments in one
            sitting. They can complete the assessments included in their membership at their own pace over days or
            weeks.
          </p>
        ),
      },
      {
        question: 'Can my child retake exams?',
        answer: (
          <p>
            Yes. Students are encouraged to retake assessments over time to track growth and improve their
            performance. When students retake assessments, they may begin from the appropriate difficulty level based
            on prior performance, rather than repeating introductory content unnecessarily. Practice questions are
            also available to help students build familiarity between official attempts.
          </p>
        ),
      },
      {
        question: 'Is this just another coaching exam?',
        answer: (
          <p>
            No. GYS is not a coaching exam and does not teach students to memorize answers for a test. GYS measures
            reasoning, communication, AI proficiency, personality, and interests. It is designed to help students
            and families understand how the student thinks, where they are strong, and what academic or career paths
            may fit them best. The goal is not just a score or rank. The goal is better guidance.
          </p>
        ),
      },
      {
        question: 'How does GYS help with stream selection and college planning?',
        answer: (
          <p>
            GYS helps students understand their strengths across reasoning, skills, personality, and interests.
            These results can support decisions about academic streams, career pathways, and possible university
            fit. At the Guided Decision level, students receive deeper career and university guidance. As students
            add more information about their experiences, interests, courses, internships, or activities, their
            profile can become more useful over time. GYS does not guarantee admission to any university, but it
            can help students build a clearer, more evidence-based picture of their strengths and future options.
          </p>
        ),
      },
      {
        question: "Is my child's data safe?",
        answer: (
          <p>
            Yes. GYS collects only the information needed to provide assessments, reports, and guidance. Personal
            data is not sold. GYS does not share student data with third parties without appropriate consent.
            Counseling and Insights data - including personality, interests, motivations, and career-discovery
            information - is private to the student by default and is shared only when the student or family chooses
            to share it. If your child participates through a school institutional package, the school may receive
            Reasoning and Skills assessment data for students in that program. Insights data remains private to the
            student unless the student or family chooses to share it.
          </p>
        ),
      },
      {
        question: "My child's school is offering GYS. Do I still need to buy it separately?",
        answer: (
          <p>
            Maybe not. If your school has purchased an institutional GYS package, your child may already have
            access to some assessments at no additional family cost. Please check with your school to understand which
            GYS package they have selected. Families may be able to upgrade individually if they want access to
            additional assessments or the full Guided Decision experience.
          </p>
        ),
      },
    ],
  },
  {
    heading: 'About pricing & payment',
    items: [
      {
        question: 'Is this a subscription or a one-time payment?',
        answer: (
          <p>
            Discovery is a one-time purchase. Reasoning Triad, Reasoning + Skills, and Guided Decision are annual
            memberships. During the membership year, your child has access to the assessments and features
            included in the selected package.
          </p>
        ),
      },
      {
        question: 'What payment methods are accepted?',
        answer: (
          <p>
            GYS uses Razorpay for online payments. Families can typically pay using UPI, credit cards, or debit cards.
          </p>
        ),
      },
      {
        question: 'What is the refund policy?',
        answer: <p>GYS memberships are non-refundable and non-transferable once payment is completed.</p>,
      },
      {
        question: 'Is there a free sample?',
        answer: (
          <p>
            Yes. Families can try a{' '}
            <FaqLink to={FAQ_SAMPLE_ASSESSMENT}>live sample assessment</FaqLink> of approximately 10 questions and
            view a <FaqLink to={FAQ_STUDENT_DASHBOARD_PREVIEW}>sample student dashboard</FaqLink> - or use the{' '}
            <FaqLink to={FAQ_PREVIEW_HUB}>interactive preview hub</FaqLink> for all preview options. No account or
            payment is required. The sample helps students and families understand the exam format and reporting
            experience before choosing a package.
          </p>
        ),
      },
    ],
  },
];
