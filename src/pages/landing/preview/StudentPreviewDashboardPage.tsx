import React from 'react';
import { Box, Typography } from '@mui/material';
import DashboardOverview from '../../../components/dashboard/DashboardOverview';
import { EnhancedAssessmentCardsGroup } from '../../../components/dashboard/EnhancedAssessmentCardsGroup';
import {
  PREVIEW_STUDENT_PROFILE,
  PREVIEW_DASHBOARD_STATS,
  getPreviewAssessmentBestTierChartData,
  PREVIEW_ASSESSMENT_TYPES,
  PREVIEW_ASSESSMENT_PROGRESS,
  PREVIEW_MEMBERSHIP_LEVEL,
} from '../../../data/studentPreviewMock';
import { isAssessmentFullyComplete } from '../../../utils/assessmentGating';
import {
  DASHBOARD_NOTIFICATION_COLORS,
  type CompletedAssessmentNotificationSource,
  type DashboardNotificationEventSource,
  type UnlockedAssessmentNotificationSource,
} from '../../../utils/dashboardNotifications';
import {
  getPreviewSampleAssessmentPath,
  DEFAULT_PREVIEW_SAMPLE_EXAM_ID,
} from '../../../data/previewSampleAssessments';

const SAMPLE_ASSESSMENT_PATH = getPreviewSampleAssessmentPath(DEFAULT_PREVIEW_SAMPLE_EXAM_ID);
const SAMPLE_ASSESSMENT_EXIT = '/students/preview/dashboard';
const HIDE_SAMPLE_CTA_ASSESSMENT_IDS = ['english_proficiency', 'ai_literacy'] as const;
const PREVIEW_NOTIFICATION_TIMESTAMP = '2026-05-01T04:30:00.000Z';

const PREVIEW_BACKEND_NOTIFICATION_EVENTS: DashboardNotificationEventSource[] = [
  {
    id: 'preview-monthly-leaderboard-updated-2026-05',
    type: 'info',
    title: 'Monthly Leaderboard Updated',
    message: 'The school leaderboard has been refreshed for this month. Check out the leaderboard to see the top 10 students at your school.',
    created_at_iso: PREVIEW_NOTIFICATION_TIMESTAMP,
    category: 'leaderboard',
    color: DASHBOARD_NOTIFICATION_COLORS.leaderboard,
  },
  {
    id: 'preview-monthly-badges-updated-2026-05',
    type: 'success',
    title: 'Monthly Badges Updated',
    message: 'Percentiles and badges have been refreshed. Check your percentile and badge to see if your status updated.',
    created_at_iso: '2026-05-01T04:25:00.000Z',
    category: 'badge',
    color: DASHBOARD_NOTIFICATION_COLORS.badge,
  },
  {
    id: 'preview-report-ready-milestone-3',
    type: 'success',
    title: 'Milestone 3 Report Ready',
    message: 'Your milestone report PDF is ready. Open Reports to download and review your progress summary.',
    created_at_iso: '2026-05-01T04:20:00.000Z',
    category: 'report',
    color: DASHBOARD_NOTIFICATION_COLORS.report,
  },
  {
    id: 'preview-payment-confirmed-pay-demo-001',
    type: 'success',
    title: 'Membership Upgrade Confirmed',
    message: 'Your membership upgrade to Reasoning + Skills is confirmed. Your new access is available now.',
    created_at_iso: '2026-05-01T04:15:00.000Z',
    category: 'payment',
    color: DASHBOARD_NOTIFICATION_COLORS.payment,
  },
  {
    id: 'preview-membership-expiring-30-2027-03-15',
    type: 'info',
    title: 'Membership Expires in 30 Days',
    message: 'Your membership is set to expire on 15 Mar 2027. Renew from Billing & Payments to keep access uninterrupted.',
    created_at_iso: '2026-05-01T04:10:00.000Z',
    category: 'payment',
    color: DASHBOARD_NOTIFICATION_COLORS.membershipExpiringSoon,
  },
];

const PREVIEW_COMPLETED_ASSESSMENT_NOTIFICATIONS: CompletedAssessmentNotificationSource[] = [
  {
    assessmentId: 'mathematical_reasoning_preview',
    assessmentName: 'Mathematical Reasoning',
  },
];

const PREVIEW_UNLOCKED_ASSESSMENT_NOTIFICATIONS: UnlockedAssessmentNotificationSource[] = [
  {
    assessmentId: 'ai_literacy_preview',
    assessmentName: 'AI Proficiency',
  },
];

const StudentPreviewDashboardPage: React.FC = () => {
  let listedCompleted = 0;
  for (const a of PREVIEW_ASSESSMENT_TYPES) {
    const p = PREVIEW_ASSESSMENT_PROGRESS[a.id];
    if (p && isAssessmentFullyComplete(a, p)) listedCompleted++;
  }
  const listedTotal = PREVIEW_ASSESSMENT_TYPES.length;
  const assessmentScopeLine =
    `${listedCompleted} of ${listedTotal} complete`;

  return (
    <Box sx={{ p: 0 }}>
      <DashboardOverview
        stats={{
          totalAssessments: PREVIEW_DASHBOARD_STATS.totalAssessments,
          completedAssessments: PREVIEW_DASHBOARD_STATS.completedAssessments,
          averageScore: PREVIEW_DASHBOARD_STATS.averageScore,
          availableAssessments: PREVIEW_DASHBOARD_STATS.availableAssessments,
        }}
        latestAssessmentResults={getPreviewAssessmentBestTierChartData()}
        completedAssessments={PREVIEW_COMPLETED_ASSESSMENT_NOTIFICATIONS}
        unlockedAssessments={PREVIEW_UNLOCKED_ASSESSMENT_NOTIFICATIONS}
        backendNotificationEvents={PREVIEW_BACKEND_NOTIFICATION_EVENTS}
        defaultEntryTier={false}
        previewProfile={{
          userName: PREVIEW_STUDENT_PROFILE.firstName,
          grade: PREVIEW_STUDENT_PROFILE.grade,
          schoolName: PREVIEW_STUDENT_PROFILE.schoolName,
          membershipLevel: PREVIEW_STUDENT_PROFILE.membershipLevelLabel,
          membershipExpiry: PREVIEW_STUDENT_PROFILE.membershipExpiryLabel,
          achievementTierId: 'gold',
        }}
        previewNavTargets={{
          available: SAMPLE_ASSESSMENT_PATH,
          completed: '/students/preview/dashboard#your-assessments',
          sampleAssessmentExitTo: SAMPLE_ASSESSMENT_EXIT,
        }}
        previewDisableAssessmentStatClicks
        persistNotificationDismissals={false}
        previewGamification={{
          argus_coins: 1250,
          login_streak: 5,
          qotd_streak: 3,
          qotd_answered_today: false,
        }}
      />
      <Box id="your-assessments" sx={{ mt: 4, ml: 1, scrollMarginTop: 100 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 2 }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
            Your Assessments
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.55)' }}>
            {assessmentScopeLine}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', mb: 2 }}>
          All assessments are listed below. Complete them in sequence where your membership allows: Reasoning Triad is Exams 1–3; Reasoning + Skills adds 4–5; Guided Decision adds Insight (6–7) and counseling features.
        </Typography>
        <EnhancedAssessmentCardsGroup
          uid=""
          filterType="all"
          previewBundle={{
            assessments: PREVIEW_ASSESSMENT_TYPES,
            progress: PREVIEW_ASSESSMENT_PROGRESS,
            membershipLevel: PREVIEW_MEMBERSHIP_LEVEL,
            previewAssessmentPath: SAMPLE_ASSESSMENT_PATH,
            previewSampleExitTo: SAMPLE_ASSESSMENT_EXIT,
            previewGrade: PREVIEW_STUDENT_PROFILE.grade,
            previewDisableStartNavigation: true,
            previewHideSampleCtaForIds: HIDE_SAMPLE_CTA_ASSESSMENT_IDS,
          }}
        />
      </Box>
    </Box>
  );
};

export default StudentPreviewDashboardPage;
