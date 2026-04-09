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
import { MEMBERSHIP_ALLOWED } from '../../../utils/assessmentGating';

const SAMPLE_ASSESSMENT_PATH = '/for-schools/preview/assessment';

const StudentPreviewDashboardPage: React.FC = () => {
  const inScope = MEMBERSHIP_ALLOWED[PREVIEW_MEMBERSHIP_LEVEL] ?? [];
  let scopeCompleted = 0;
  for (const id of inScope) {
    const p = PREVIEW_ASSESSMENT_PROGRESS[id];
    const a = PREVIEW_ASSESSMENT_TYPES.find((x) => x.id === id);
    if (p && a && p.proficiency_tier > a.tiers.length) scopeCompleted++;
  }
  const scopeTotal = inScope.length;
  const assessmentScopeLine = `${scopeCompleted} of ${scopeTotal} complete (Level ${PREVIEW_MEMBERSHIP_LEVEL})`;

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
        }}
        previewNavTargets={{
          available: SAMPLE_ASSESSMENT_PATH,
          completed: '/students/preview/dashboard#your-assessments',
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
          All assessments are listed below. Complete them in sequence where your membership allows - Level 2 covers Exams 1 - 4; Level 3 unlocks Exams 5 - 7 (advanced English, AI, comprehensive personality).
        </Typography>
        <EnhancedAssessmentCardsGroup
          uid=""
          filterType="all"
          previewBundle={{
            assessments: PREVIEW_ASSESSMENT_TYPES,
            progress: PREVIEW_ASSESSMENT_PROGRESS,
            membershipLevel: PREVIEW_MEMBERSHIP_LEVEL,
            previewAssessmentPath: SAMPLE_ASSESSMENT_PATH,
            previewGrade: PREVIEW_STUDENT_PROFILE.grade,
            previewDisableStartNavigation: true,
          }}
        />
      </Box>
    </Box>
  );
};

export default StudentPreviewDashboardPage;
