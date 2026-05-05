import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import PracticeModeContent from '../../../components/practice/PracticeModeContent';
import {
  PREVIEW_ASSESSMENT_PROGRESS,
  PREVIEW_ASSESSMENT_TYPES,
  PREVIEW_MEMBERSHIP_LEVEL,
  PREVIEW_STUDENT_PROFILE,
} from '../../../data/studentPreviewMock';

const PREVIEW_PRACTICE_SCOPE = 'student_preview';

const StudentPreviewPracticePage: React.FC = () => {
  const practiceUnlock = useMemo(
    () => ({
      progressByExam: PREVIEW_ASSESSMENT_PROGRESS,
      officialTierCountByExam: Object.fromEntries(
        PREVIEW_ASSESSMENT_TYPES.map((a) => [a.id, a.tiers.length])
      ),
      assessmentGate: {
        membershipLevel: PREVIEW_MEMBERSHIP_LEVEL,
        grade: PREVIEW_STUDENT_PROFILE.grade,
        assessments: PREVIEW_ASSESSMENT_TYPES,
        progress: PREVIEW_ASSESSMENT_PROGRESS,
      },
    }),
    []
  );

  return (
    <Box sx={{ p: 0 }}>
      <PracticeModeContent
        storageScope={PREVIEW_PRACTICE_SCOPE}
        grade={PREVIEW_STUDENT_PROFILE.grade}
        embedded
        practiceUnlock={practiceUnlock}
      />
    </Box>
  );
};

export default StudentPreviewPracticePage;
