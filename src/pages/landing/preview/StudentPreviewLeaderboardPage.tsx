import React from 'react';
import { Box, Typography } from '@mui/material';
import StudentLeaderboardPanel from '../../../components/dashboard/StudentLeaderboardPanel';
import { clampToLeaderboardGrade } from '../../../data/leaderboardMock';
import { PREVIEW_STUDENT_PROFILE } from '../../../data/studentPreviewMock';

const StudentPreviewLeaderboardPage: React.FC = () => {
  const initial = clampToLeaderboardGrade(PREVIEW_STUDENT_PROFILE.grade);

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
        Leaderboard
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 2.5, maxWidth: 640 }}>
        Sample standings for each programme exam — same layout as the signed-in portal. Grade defaults to the preview
        profile (Grade {initial}).
      </Typography>
      <StudentLeaderboardPanel initialGrade={initial} />
    </Box>
  );
};

export default StudentPreviewLeaderboardPage;
