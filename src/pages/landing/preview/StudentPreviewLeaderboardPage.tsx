import React from 'react';
import { Box, Typography } from '@mui/material';
import StudentLeaderboardPanel from '../../../components/dashboard/StudentLeaderboardPanel';
import { MOCK_LEADERBOARD_BY_GRADE, MOCK_LEADERBOARD_LAST_UPDATED } from '../../../data/leaderboardMock';
import { clampToLeaderboardGrade } from '../../../utils/leaderboard';
import { PREVIEW_STUDENT_PROFILE } from '../../../data/studentPreviewMock';

const StudentPreviewLeaderboardPage: React.FC = () => {
  const initial = clampToLeaderboardGrade(PREVIEW_STUDENT_PROFILE.grade);

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
        School Leaderboard
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 2.5 }}>
        Sample school leaderboard: standings for each exam at{' '}
        <Box component="span" sx={{ fontWeight: 700, color: '#e9d5ff' }}>
          your school
        </Box>{' '}
        only (not national).
      </Typography>
      <StudentLeaderboardPanel
        initialGrade={initial}
        sections={MOCK_LEADERBOARD_BY_GRADE[initial]}
        sectionsByGrade={MOCK_LEADERBOARD_BY_GRADE}
        lastUpdatedISO={MOCK_LEADERBOARD_LAST_UPDATED.toISOString()}
        showGradeToggle
        gradeToggleDisabled
      />
    </Box>
  );
};

export default StudentPreviewLeaderboardPage;
