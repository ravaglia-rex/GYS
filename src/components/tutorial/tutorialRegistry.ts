import type { TutorialPageKey, TutorialStepDefinition } from './types';

export const TUTORIAL_REGISTRY: Record<TutorialPageKey, TutorialStepDefinition[]> = {
  'student.dashboard': [
    {
      targetId: 'student-nav-dashboard',
      title: 'Your home base',
      body: 'The Dashboard is where you see progress at a glance - stats, your latest scores, and what to do next.',
      placement: 'right',
    },
    {
      targetId: 'student-dashboard-stats',
      title: 'Quick stats',
      body: 'These cards summarize how many assessments you have completed, your average score, and what is available to take next.',
      placement: 'bottom',
    },
    {
      targetId: 'student-dashboard-chart',
      title: 'Score by assessment',
      body: 'This chart shows your latest level score for each program assessment so you can spot strengths and gaps.',
      placement: 'right',
    },
    {
      targetId: 'student-dashboard-assessments',
      scrollTargetId: 'student-dashboard-assessments-heading',
      scrollBlock: 'center',
      title: 'Your assessments',
      body: 'Scroll here to open or continue official exams. Locked items unlock as you progress and your membership allows.',
      placement: 'top',
    },
    {
      targetId: 'student-dashboard-notifications',
      title: 'Notifications',
      body: 'New results, available exams, and reminders appear here. Dismiss individual items when you are done with them.',
      placement: 'left',
    },
  ],
  'student.leaderboard': [
    {
      targetId: 'student-nav-leaderboard',
      title: 'School leaderboard',
      body: 'This page shows the top performing students in your school for each exam and level.',
      placement: 'right',
    },
    {
      targetId: 'student-leaderboard-panel',
      title: 'Ranked exam sections',
      body: 'Open each exam section to see rankings, scores, and where your current performance sits in the cohort.',
      placement: 'top',
    },
  ],
  'student.assessments': [
    {
      targetId: 'student-nav-assessments',
      title: 'Assessments hub',
      body: 'Use this section for all official program exams - available now and ones you have already finished.',
      placement: 'right',
    },
    {
      targetId: 'student-assessments-tabs',
      title: 'Available vs completed',
      body: 'Switch tabs to see exams you can start now, or review completed attempts and results.',
      placement: 'bottom',
    },
    {
      targetId: 'student-assessments-cards',
      title: 'Exam cards',
      body: 'Each card shows status, tier, and actions to start or view results. Complete exams in order where gating applies.',
      placement: 'top',
    },
  ],
  'student.practice': [
    {
      targetId: 'student-nav-practice',
      title: 'Practice Mode',
      body: 'This is where you can practice for free without affecting your official scores or leaderboard standing.',
      placement: 'right',
    },
    {
      targetId: 'student-practice-purpose',
      title: 'What practice is for',
      body: 'Practice helps you learn the format, pacing, and skills for each exam. It never changes official scores or rankings.',
      placement: 'bottom',
    },
    {
      targetId: 'student-practice-exam-picker',
      title: 'Pick an exam to practice',
      body: 'Choose the assessment you want to drill. Locked exams follow the same unlock rules as your official dashboard.',
      placement: 'top',
    },
    {
      targetId: 'student-practice-level-picker',
      title: 'Choose a difficulty level',
      body: 'Pick an unlocked level for the selected exam. Higher practice levels unlock as your official progress advances.',
      placement: 'top',
    },
    {
      targetId: 'student-practice-start-card',
      title: 'Start or reset practice',
      body: 'This card shows the selected pool, your progress, and the button to start a practice session.',
      placement: 'top',
    },
  ],
  'student.reports': [
    {
      targetId: 'student-nav-reports',
      title: 'Reports',
      body: 'Milestone PDF reports unlock based on your package. National percentiles and PDFs refresh on a weekly Monday run.',
      placement: 'right',
    },
    {
      targetId: 'student-reports-list',
      title: 'Your report history',
      body: 'Each row is a milestone PDF you can download once the weekly generation run has completed.',
      placement: 'top',
    },
  ],
  'student.payments': [
    {
      targetId: 'student-nav-settings',
      title: 'Billing & payments',
      body: 'Open Profile, then Billing & Payment, to view membership charges, invoices, and payment history.',
      placement: 'right',
    },
    {
      targetId: 'student-payments-upgrade',
      title: 'Membership upgrades',
      body: 'Review membership options here when you want to unlock more assessments, reports, or guidance features.',
      placement: 'top',
    },
    {
      targetId: 'student-payments-tabs',
      title: 'Payment history',
      body: 'Use these tabs to see pending payments, previous transactions, and any payee details tied to checkout.',
      placement: 'top',
    },
  ],
  'student.settings': [
    {
      targetId: 'student-nav-settings',
      title: 'Profile',
      body: 'Profile is where you manage account details, billing, password, and privacy options.',
      placement: 'right',
    },
    {
      targetId: 'student-settings-account-card',
      title: 'Account summary',
      body: 'This card shows the signed-in account, email, and your account status.',
      placement: 'bottom',
    },
    {
      targetId: 'student-settings-tabs',
      title: 'About, billing, and security',
      body: 'Switch between About, Billing & Payment, and Security & Privacy depending on what you need to update.',
      placement: 'bottom',
    },
    {
      targetId: 'student-settings-content',
      title: 'Editable settings',
      body: 'The active tab content is where you make changes. Save profile updates before leaving the page.',
      placement: 'top',
    },
  ],
  'school.dashboard': [
    {
      targetId: 'school-nav-overview',
      title: 'Institution overview',
      body: 'Your dashboard summarizes school tier, rank, and headline performance metrics for the current term.',
      placement: 'right',
    },
    {
      targetId: 'school-dashboard-hero',
      scrollBlock: 'nearest',
      title: 'School identity',
      body: 'This shows your school name, plan, institutional tier, and school rank.',
      placement: 'bottom',
    },
    {
      targetId: 'school-dashboard-stats',
      title: 'Live metrics',
      body: 'Track enrollment, completion, percentile movement, and tier distribution without leaving the overview.',
      placement: 'bottom',
    },
    {
      targetId: 'school-dashboard-quick-actions',
      title: 'Quick actions',
      body: 'Jump to Analytics or email support from here when you need deeper views or help.',
      placement: 'top',
    },
  ],
  'school.students': [
    {
      targetId: 'school-nav-students',
      title: 'Student roster',
      body: 'Manage everyone invited or registered under your institution from this page.',
      placement: 'right',
    },
    {
      targetId: 'school-students-add',
      title: 'Invite students',
      body: 'Add emails individually or in bulk so students can register with your school pre-approved.',
      placement: 'bottom',
    },
    {
      targetId: 'school-students-filters',
      title: 'Search and filters',
      body: 'Find students by name or email, filter by status or class, and sort the table to review progress.',
      placement: 'bottom',
    },
    {
      targetId: 'school-students-table',
      title: 'Roster table',
      body: 'Each row shows the student\'s details including their registration status, tier, and assessments completed. View a student for their complete profile and progress.',
      placement: 'top',
    },
  ],
  'school.studentDetail': [
    {
      targetId: 'school-student-detail-header',
      title: 'Student detail',
      body: 'This page gives you one student’s profile, membership, and assessment status in one place.',
      placement: 'bottom',
    },
    {
      targetId: 'school-student-detail-profile',
      title: 'Profile snapshot',
      body: 'Confirm identity details like email, class, and registration status before reviewing performance.',
      placement: 'bottom',
    },
    {
      targetId: 'school-student-detail-billing',
      title: 'Membership and access',
      body: 'This section shows the student’s membership level and access-related information.',
      placement: 'bottom',
    },
    {
      targetId: 'school-student-detail-assessments',
      title: 'Assessment progress',
      body: 'Review scores and completion status across assessments for this individual student.',
      placement: 'top',
    },
  ],
  'school.analytics': [
    {
      targetId: 'school-nav-analytics',
      title: 'Analytics',
      body: 'School-wide charts for scores, class mix, and proficiency tiers across assessments.',
      placement: 'right',
    },
    {
      targetId: 'school-analytics-exam-select',
      title: 'Pick an assessment',
      body: 'Choose which exam to analyze-charts and tables update for that assessment across your roster.',
      placement: 'bottom',
    },
    {
      targetId: 'school-analytics-charts',
      title: 'Performance charts',
      body: 'Compare average scores, tier breakdowns, and national performance bands for your students.',
      placement: 'top',
    },
  ],
  'school.reports': [
    {
      targetId: 'school-nav-reports',
      title: 'Quarterly reports',
      body: 'Institutional PDF reports are published each quarter when your data is ready.',
      placement: 'right',
    },
    {
      targetId: 'school-reports-list',
      title: 'Download reports',
      body: 'Open or download the latest quarterly report. Older quarters stay listed for your records.',
      placement: 'top',
    },
  ],
  'school.alerts': [
    {
      targetId: 'school-nav-alerts',
      title: 'Alerts',
      body: 'New report-ready notices and system messages appear here first.',
      placement: 'right',
    },
    {
      targetId: 'school-alerts-list',
      title: 'Alert feed',
      body: 'Dismiss alerts you have handled, or mark them read so your team knows what is still outstanding.',
      placement: 'top',
    },
  ],
  'school.settings': [
    {
      targetId: 'school-nav-settings',
      title: 'School settings',
      body: 'Settings is where your institution keeps profile, registration, contact, and account information up to date.',
      placement: 'right',
    },
    {
      targetId: 'school-settings-school-info',
      title: 'School information',
      body: 'This card shows the core identity information for your institution, including the primary POC email.',
      placement: 'bottom',
    },
    {
      targetId: 'school-settings-registration',
      title: 'Registration details',
      body: 'Update operational details like boards, contact emails, website, address, and referral information here.',
      placement: 'top',
    },
    {
      targetId: 'school-settings-save',
      title: 'Save changes',
      body: 'Use these actions to save profile edits or cancel changes before they update the school record.',
      placement: 'top',
    },
  ],
  'school.subscription': [
    {
      targetId: 'school-nav-subscription',
      title: 'Subscription',
      body: 'Subscription is where you review your current plan, upgrade options, and billing history.',
      placement: 'right',
    },
    {
      targetId: 'school-subscription-current-plan',
      title: 'Current plan',
      body: 'This section summarizes the package your school is currently using and the student capacity included.',
      placement: 'bottom',
    },
    {
      targetId: 'school-subscription-plans',
      title: 'Available plans',
      body: 'Compare plans and choose an upgrade when your school needs more student seats or features.',
      placement: 'top',
    },
    {
      targetId: 'school-subscription-billing',
      title: 'Billing history',
      body: 'Find payment records, invoice details, and download actions for institutional billing.',
      placement: 'top',
    },
  ],
};

export function getTutorialSteps(pageKey: TutorialPageKey): TutorialStepDefinition[] {
  return TUTORIAL_REGISTRY[pageKey] ?? [];
}
