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

const SAMPLE_ASSESSMENT_PATH = '/for-schools/preview/assessment';
const SAMPLE_ASSESSMENT_EXIT = '/students/preview/dashboard';

const StudentPreviewDashboardPage: React.FC = () => {
  let listedCompleted = 0;
  for (const a of PREVIEW_ASSESSMENT_TYPES) {
    const p = PREVIEW_ASSESSMENT_PROGRESS[a.id];
    if (p && p.proficiency_tier > a.tiers.length) listedCompleted++;
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
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', mb: 2, maxWidth: 720 }}>
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
          }}
        />
      </Box>
    </Box>
  );
};

export default StudentPreviewDashboardPage;
