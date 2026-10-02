import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
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
import { areExamScoresVisible } from '../../constants/constants';
import {
  EXAM_MAX_SCORE_POINTS,
  isLevelBasedAssessment,
  tierPercentToExamPoints,
} from '../../utils/assessmentGating';

interface ResultState {
  attemptId: string;
  assessmentId: string;
  tierNumber: number;
  scorePercent?: number;
  correct?: number;
  total?: number;
  passed?: boolean;
  nextTier?: number | null;
  completedAt?: string;
  resultsPending?: boolean;
  coinsAwarded?: number;
}

const AssessmentResultDetailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | undefined;

  if (!state) {
    return <Navigate to="/assessments" replace />;
  }

  if (!areExamScoresVisible(state.assessmentId) || state.resultsPending === true) {
    return (
      <Navigate
        to={`/assessments/${state.assessmentId}/result`}
        replace
        state={state}
      />
    );
  }

  const { assessmentId, tierNumber, scorePercent = 0, correct = 0, total = 0, passed = false, completedAt } = state;
  const flow = getAssessmentFlowDefinition(assessmentId);
  const levelBased = isLevelBasedAssessment(assessmentId);
  const scorePoints = tierPercentToExamPoints(scorePercent);
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
              bgcolor: passed ? undefined : '#f1f5f9',
              background: passed
                ? 'radial-gradient(circle at 12% 0%, rgba(253, 224, 71, 0.5), transparent 40%), linear-gradient(165deg, #ecfdf5 0%, #fffbeb 100%)'
                : undefined,
              borderRadius: passed ? 3 : 2,
              p: passed ? 3 : 2.5,
              mb: 2,
              textAlign: passed ? 'center' : 'left',
              border: passed ? '1px solid #6ee7b7' : '1px solid #cbd5e1',
              boxShadow: passed ? '0 12px 28px rgba(16, 185, 129, 0.14)' : 'none',
            }}
          >
            {passed ? (
              <Typography sx={{ fontSize: '2.2rem', lineHeight: 1, mb: 0.75 }} aria-hidden>
                🎉
              </Typography>
            ) : null}
            <Typography
              sx={{
                fontWeight: 900,
                color: passed ? '#065f46' : '#0f172a',
                fontSize: passed ? '1.45rem' : '1.15rem',
                mb: 0.5,
                letterSpacing: passed ? -0.3 : 0,
              }}
            >
              {passed ? `You cleared Level ${tierNumber}!` : `Level ${tierNumber} score`}
            </Typography>
            <Typography
              sx={{
                color: passed ? '#065f46' : '#334155',
                fontWeight: 900,
                fontSize: passed ? '2.6rem' : '1.5rem',
                lineHeight: 1.05,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {scorePoints}
              <Typography
                component="span"
                sx={{
                  color: passed ? '#059669' : '#64748b',
                  fontWeight: 800,
                  fontSize: passed ? '1.05rem' : '1rem',
                  ml: 0.75,
                }}
              >
                / {EXAM_MAX_SCORE_POINTS}
              </Typography>
            </Typography>
            <Typography sx={{ color: passed ? '#047857' : '#64748b', fontSize: '0.85rem', mt: 1, fontWeight: passed ? 700 : 400 }}>
              {correct} / {total} items · Completed {dateLabel}
            </Typography>
            {passed ? (
              <Typography sx={{ color: '#047857', fontSize: '0.92rem', fontWeight: 700, mt: 1.25 }}>
                That level is done. Nice work.
              </Typography>
            ) : null}
            <Typography
              sx={{
                color: '#64748b',
                fontSize: '0.78rem',
                mt: 1.5,
                lineHeight: 1.5,
              }}
            >
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
