import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { getAssessmentFlowDefinition } from '../../config/assessmentFlowUI';
import { nextAssessmentNudge } from '../../config/assessmentResultDetail';
import {
  EXAM_MAX_SCORE_POINTS,
  isLevelBasedAssessment,
  tierPercentToExamPoints,
} from '../../utils/assessmentGating';

interface ResultState {
  attemptId: string;
  assessmentId: string;
  tierNumber: number;
  scorePercent: number;
  correct: number;
  total: number;
  passed: boolean;
  nextTier?: number | null;
  completedAt?: string;
}

const AssessmentResultDetailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | undefined;

  if (!state) {
    navigate('/assessments', { replace: true });
    return null;
  }

  const { assessmentId, tierNumber, scorePercent, correct, total, passed, completedAt } = state;
  const flow = getAssessmentFlowDefinition(assessmentId);
  const levelBased = isLevelBasedAssessment(assessmentId);
  const displayScore = Math.round(scorePercent);
  const scorePoints = tierPercentToExamPoints(displayScore);
  const nudge = passed ? nextAssessmentNudge(assessmentId) : null;

  const dateLabel = completedAt
    ? new Date(completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  const tryShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${flow.examTitleShort} results`,
          text: `Score ${scorePoints} / ${EXAM_MAX_SCORE_POINTS} on ${flow.examTitleShort}`,
        });
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 10 }}>
      <Box
        sx={{
          bgcolor: '#fff',
          borderBottom: '1px solid #e2e8f0',
          px: 1,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <IconButton onClick={() => navigate(-1)} aria-label="Back">
          <ArrowBackIcon sx={{ color: '#0d47a1' }} />
        </IconButton>
        <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>
          Exam {flow.examOrdinal} Results
        </Typography>
        <IconButton aria-label="Share" onClick={tryShare} sx={{ color: '#64748b' }}>
          <ShareIcon />
        </IconButton>
      </Box>

      <Box sx={{ maxWidth: 520, mx: 'auto', px: 2, pt: 3 }}>
        {!levelBased ? (
          <Box
            sx={{
              bgcolor: '#f3e5f5',
              borderRadius: 2,
              p: 2.5,
              mb: 2,
              border: '1px solid #ce93d8',
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#4a148c', fontSize: '1.15rem', mb: 0.5 }}>
              Profile assessment submitted
            </Typography>
            <Typography sx={{ color: '#6a1b9a', fontSize: '0.9rem' }}>
              Completed {dateLabel}. This insight assessment does not use skill levels, percentiles, or level-by-level scoring.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: passed ? '#e8f5e9' : '#f1f5f9',
              borderRadius: 2,
              p: 2.5,
              mb: 2,
              border: passed ? '1px solid #a5d6a7' : '1px solid #cbd5e1',
            }}
          >
            <Typography
              sx={{
                fontWeight: 800,
                color: passed ? '#1b5e20' : '#0f172a',
                fontSize: '1.15rem',
                mb: 0.5,
              }}
            >
              {passed ? `Level ${tierNumber} cleared` : `Level ${tierNumber} score`}
            </Typography>
            <Typography
              sx={{
                color: passed ? '#1b5e20' : '#334155',
                fontWeight: 800,
                fontSize: '1.5rem',
              }}
            >
              {scorePoints} / {EXAM_MAX_SCORE_POINTS}
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mt: 0.75 }}>
              {correct} / {total} items · Completed {dateLabel}
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.78rem', mt: 1.5, lineHeight: 1.5 }}>
              National performance tier and percentile refresh weekly on Monday. Until then, your
              badge stays Explorer unless a prior Monday run already set one.
            </Typography>
          </Box>
        )}

        {nudge && (
          <Box
            onClick={() => navigate(nudge.path)}
            sx={{
              bgcolor: '#e8eaf6',
              borderRadius: 2,
              p: 2,
              mb: 3,
              cursor: 'pointer',
              border: '1px solid #9fa8da',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <MenuBookIcon sx={{ color: '#3949ab' }} />
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#283593', fontSize: '0.9rem' }}>{nudge.title}</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#5c6bc0' }}>{nudge.subtitle}</Typography>
            </Box>
          </Box>
        )}

        <Button
          fullWidth
          variant="contained"
          sx={{ bgcolor: '#0d47a1', fontWeight: 800, py: 1.25, mb: 1.5 }}
          onClick={() => navigate('/assessments/available')}
        >
          Back to dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default AssessmentResultDetailPage;
