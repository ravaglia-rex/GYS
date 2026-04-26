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
            Global Young Scholar (GYS) is a sequential assessment and guidance program for students in Classes 6–12. It helps identify students who show exceptional promise for higher education while giving schools a clearer view of student performance — individually, by class, and in aggregate — against national and international benchmarks.

The GYS suite includes seven assessments across three tracks: Reasoning, Skills, and Insights. These assess symbolic reasoning, verbal reasoning, mathematical reasoning, English and communication skills, AI proficiency, personality, interests, and career discovery.

Students earn GYS Performance Tiers that signal academic readiness, growth, and potential, while schools receive reporting that can support academic planning, student guidance, and EducationWorld ranking participation.
          </p>
        ),
      },
      {
        question: 'How does GYS relate to the EducationWorld School Rankings?',
        answer: (
          <p>
            GYS assessment data contributes approximately 15% to a school’s EducationWorld India School Ranking, serving as an assessment-backed input into the ranking methodology.

EducationWorld considers both participation — how many eligible students complete GYS assessments — and performance — how students perform across the assessment suite. Participating schools receive a GYS performance designation, updated periodically, that feeds into the EducationWorld rankings framework.

For schools seeking to improve or maintain their ranking position, GYS provides a clear, actionable way to demonstrate student achievement through structured, comparable assessment data.
          </p>
        ),
      },
      
    
      {
        question: 'What do we need to do to get started?',
        answer: (
          <p>
            Visit the GYS website, select your institutional package, and complete school registration and payment.

Once your school is enrolled, we provide defined options for registering students, including school-provided student lists and school-specific registration links. Students then verify their email addresses and begin assessments from their own devices, including mobile phones.

There is no need to schedule classroom exam sessions, install software, or allocate instructional time.


          </p>
        ),
      },
      {
        question: 'How much time does this take from our school day?',
        answer: (
          <p>
            GYS is designed to require minimal school-day disruption. Students complete assessments independently, on their own devices and at their own pace, including from home.

Your school’s primary role is to communicate the opportunity to students and families. GYS provides the materials needed to support that communication.


          </p>
        ),
      },
      {
        question: 'What reports does our school receive?',
        answer: (
          <p>
            Participating schools receive access to a school dashboard and downloadable reports showing student participation, performance distributions, and class-level insights.

Reports may include grade-wise or class-wise performance patterns, student engagement data, and institutional summaries that help school leaders understand strengths and growth areas across their student population.

For example, reports can help identify how many students are performing at advanced levels, how many are developing, and where additional support may be useful.
          </p>
        ),
      },
      {
        question: 'Can we start with just one grade or a small group of students?',
        answer: (
          <p>
           Yes. Many schools begin with a specific class band or student group before expanding participation.

Classes 8–10 are often a strong starting point because GYS insights can support stream-selection conversations, including PCM, PCB, Commerce, Humanities, and other academic pathways. Schools may then expand participation to additional classes in future cycles.
          </p>
        ),
      },
      {
        question: 'Is the assessment proctored?',
        answer: (
          <p>
           In the first year, GYS uses layered assessment-integrity measures rather than formal live proctoring.

Questions are drawn from a large bank, each question has its own time limit, students cannot return to previous questions, and post-submission analysis may flag irregular response patterns. This approach supports accessibility, flexible participation, and broad student reach.

A certified proctored version may be introduced in the future if needed.
          </p>
        ),
      },
      {
        question: "What if our students don't have school email addresses?",
        answer: (
          <p>
           Students can register using personal email addresses, including Gmail or other commonly used accounts.

Schools can provide a list of student email addresses — school-issued or personal — so registered students can be associated with the correct school. Alternatively, GYS can provide a school-specific tagged registration link to share with families. Students who register through that link are automatically associated with your school.
          </p>
        ),
      },
      {
        question: 'Do we control what data is shared?',
        answer: (
          <p>
            For students whose assessment access is provided through your school’s institutional package, your school receives reporting on Reasoning and Skills assessments, including scores, subscores, performance tiers, and aggregate/class-level insights.

The Insights assessments — including personality, interests, motivations, and career-discovery information — are private to students by default. Students may choose to share this information with their school, parents, or counselors, but it is not automatically included in school-facing reports.

For students who subscribe independently through their families, school-level attribution may still count toward participation and recognition where applicable, but individual student data is not shared with the school unless the student or family has provided the required consent.

This approach allows schools to understand academic readiness and skill development for institutionally sponsored students while preserving student privacy for more personal guidance-related insights.
          </p>
        ),
      },
      {
        question: 'Is there a free trial or sample?',
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
        question: 'What does it cost for our school?',
        answer: (
          <>
            <p>GYS offers three institutional packages:</p>
            <ul>
              <li>
                <strong>Pilot</strong> - ₹2 lakh per year (up to ~200 students). Includes Exam 1
                (Symbolic Reasoning) for all students, basic institutional reporting, and quarterly
                performance updates.
              </li>
              <li>
                <strong>Standard</strong> - ₹3 lakh per year (up to ~500 students). Includes Exams
                1–3 (the full reasoning triad), detailed analytics, comparative peer analysis, and
                student-level and class-level breakdowns.
              </li>
              <li>
                <strong>Partner/Flagship</strong> - ₹5 lakh per year (no student cap). Same assessment
                access as Standard, plus stream-selection insights, dedicated support, and
                implementation assistance.
              </li>
            </ul>
          </>
        ),
      },
      {
        question: 'Is this a subscription or a one-time payment?',
        answer: (
          <p>
            For schools, GYS is offered as an annual institutional program fee. The fee covers access to the assessments and reporting included in the selected school package for the applicable academic year.

Family-paid subscriptions are available separately for students whose schools are not purchasing an institutional package.
          </p>
        ),
      },
      {
        question: 'What payment methods are accepted?',
        answer: (
          <p>
            GYS uses Razorpay for online payments, including UPI and credit/debit cards.

For schools joining at the Partner / Flagship level, wire transfer may also be available upon request.


          </p>
        ),
      },
      {
        question: 'What is the refund policy?',
        answer: (
          <p>GYS institutional program fees are non-refundable and non-transferable once school registration and payment are completed.

          </p>
        ),
      },
   
    ],
  },
];
