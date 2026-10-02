import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Box, Typography, Button, Chip } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import {
  getAssessmentFlowDefinition,
  unlockedItemsAfterAttempt,
} from '../../config/assessmentFlowUI';
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
  coinsAwarded?: number;
  resultsPending?: boolean;
}

const AI_PROFICIENCY_LEVELS = [
  { min: 80, label: 'AI Proficient', color: '#2e7d32', description: 'Strong conceptual understanding, critical evaluation, effective AI tool use, and responsible practice.' },
  { min: 60, label: 'AI Competent', color: '#1565c0', description: 'Solid understanding; can use AI tools with some iteration but may miss subtle issues.' },
  { min: 40, label: 'AI Developing', color: '#f9a825', description: 'Basic conceptual awareness but struggles with critical evaluation or effective tool use.' },
  { min: 0, label: 'AI Emerging', color: '#c62828', description: 'Needs foundational exposure. Resources will be provided to help build your baseline.' },
];

const aiProficiencyLevel = (pct: number) => AI_PROFICIENCY_LEVELS.find((l) => pct >= l.min) ?? AI_PROFICIENCY_LEVELS[3];

const AssessmentResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | undefined;

  if (!state) {
    return <Navigate to="/assessments" replace />;
  }

  const {
    assessmentId,
    tierNumber,
    scorePercent = 0,
    correct = 0,
    total = 0,
    passed = false,
    nextTier = null,
    coinsAwarded,
  } = state;
  const isAiLiteracy = assessmentId === 'ai_literacy';
  const levelBased = isLevelBasedAssessment(assessmentId);
  const flow = getAssessmentFlowDefinition(assessmentId);
  const examLabel = levelBased
    ? `${flow.examTitleShort} Level ${tierNumber}`
    : flow.examTitleShort;

  if (!areExamScoresVisible(assessmentId) || state.resultsPending === true) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: 520, width: '100%', mx: 'auto', textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', lineHeight: 1, mb: 1.5 }}>🎉</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
            Thank you — and congratulations!
          </Typography>
          <Typography sx={{ color: '#334155', fontSize: '1.05rem', fontWeight: 700, mb: 1.25 }}>
            {examLabel} is complete.
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, px: 1, mb: 3 }}>
            We have saved your answers. Keep an eye out for your results — they will show up in the
            student portal when they are ready.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/assessments/available')}
              sx={{ bgcolor: '#0d47a1', fontWeight: 800, py: 1.4, textTransform: 'none', borderRadius: 2 }}
            >
              Back to Assessments
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<HomeOutlinedIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{ borderColor: '#cbd5e1', color: '#475569', py: 1.3, textTransform: 'none', borderRadius: 2 }}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  const displayScore = Math.round(scorePercent);
  const scorePoints = tierPercentToExamPoints(scorePercent);
  const clearedLabel = levelBased ? `Level ${tierNumber}` : flow.examTitleShort;
  const unlockItems = unlockedItemsAfterAttempt({
    assessmentId,
    completedTier: tierNumber,
    passed,
    nextTier,
  });

  if (isAiLiteracy) {
    const grade = aiProficiencyLevel(displayScore);
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 5,
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: 520, width: '100%', mx: 'auto' }}>
          <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 800, color: '#334155', mb: 3 }}>
            Results
          </Typography>
          <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <Box sx={{ background: `linear-gradient(135deg, ${grade.color}, #263238)`, px: 3, py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🤖</Typography>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>{flow.examTitleShort}</Typography>
              <Chip label={`Level ${tierNumber}`} size="small" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
            </Box>
            <Box sx={{ px: 3, py: 3, textAlign: 'center' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: `${grade.color}18`, border: `1px solid ${grade.color}44`, borderRadius: 10, px: 2, py: 0.75, mb: 2 }}>
                <CheckCircleIcon sx={{ color: grade.color, fontSize: '1.1rem' }} />
                <Typography sx={{ color: grade.color, fontWeight: 800, fontSize: '0.9rem' }}>{grade.label}</Typography>
              </Box>
              <Typography variant="h2" sx={{ color: grade.color, fontWeight: 900, fontSize: '3.2rem', lineHeight: 1 }}>
                {scorePoints}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 2 }}>
                out of {EXAM_MAX_SCORE_POINTS} • {correct} correct out of {total}
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<HomeOutlinedIcon />}
                onClick={() => navigate('/assessments/completed')}
                sx={{ borderColor: '#cbd5e1', color: '#475569', py: 1.2, textTransform: 'none' }}
              >
                View Completed &amp; Results
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: passed ? '#f0fdf4' : '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 520, width: '100%', mx: 'auto' }}>
        {passed ? null : (
          <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 800, color: '#334155', mb: 2 }}>
            Results
          </Typography>
        )}

        {passed ? (
          <Box
            sx={{
              textAlign: 'center',
              mb: 2.5,
              borderRadius: 3,
              px: 2.5,
              py: 3.25,
              background:
                'radial-gradient(circle at 18% 0%, rgba(253, 224, 71, 0.55), transparent 42%), linear-gradient(165deg, #ecfdf5 0%, #fffbeb 52%, #f0fdf4 100%)',
              border: '1px solid #6ee7b7',
              boxShadow: '0 14px 36px rgba(16, 185, 129, 0.16)',
            }}
          >
            <Typography sx={{ fontSize: '2.85rem', lineHeight: 1, mb: 1 }} aria-hidden>
              🎉
            </Typography>
            <Typography
              variant="overline"
              sx={{ color: '#047857', fontWeight: 800, letterSpacing: 1.2, display: 'block', mb: 0.5 }}
            >
              {flow.examTitleShort}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#065f46', letterSpacing: -0.4, mb: 0.5 }}>
              You cleared {clearedLabel}!
            </Typography>
            <Typography sx={{ color: '#047857', fontSize: '0.98rem', fontWeight: 700, mb: 2 }}>
              That level is done. Nice work.
            </Typography>
            <Typography
              sx={{
                color: '#065f46',
                fontWeight: 900,
                fontSize: '3.4rem',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {scorePoints}
            </Typography>
            <Typography sx={{ color: '#059669', fontWeight: 800, fontSize: '0.95rem', mt: 0.5 }}>
              out of {EXAM_MAX_SCORE_POINTS}
              {total > 0 ? ` · ${correct} correct out of ${total}` : ''}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', mb: 2.5 }}>
            <Typography sx={{ fontSize: '3rem', lineHeight: 1, mb: 1 }}>🎉</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 0.75 }}>
              Assessment complete!
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.55, px: 1 }}>
              {levelBased
                ? `${flow.examTitleShort} Level ${tierNumber} has now been scored.`
                : `${flow.examTitleShort} has now been scored.`}
            </Typography>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, mt: 1.25, px: 1 }}>
              Open Completed &amp; Results to see your score and attempt details.
            </Typography>
          </Box>
        )}

        {(coinsAwarded ?? 0) > 0 && (
          <Box
            sx={{
              bgcolor: '#fef3c7',
              borderRadius: 2,
              p: 2,
              mb: 2,
              border: '1px solid #fcd34d',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#92400e' }}>
              You earned {coinsAwarded} Argus Coins!
            </Typography>
            <Typography sx={{ color: '#b45309', fontSize: '0.85rem', mt: 0.5 }}>
              Open Completed &amp; Results anytime, or visit the Rewards Shop to redeem.
            </Typography>
          </Box>
        )}

        {unlockItems.length > 0 && (
          <Box
            sx={{
              bgcolor: '#e3f2fd',
              border: '2px solid #64b5f6',
              borderRadius: 2,
              p: 2,
              mb: 2,
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
            }}
          >
            <LockOpenIcon sx={{ color: '#1565c0', mt: 0.2 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, color: '#0d47a1', fontSize: '0.95rem', mb: 0.75 }}>
                New assessments unlocked!
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                {unlockItems.map((item) => (
                  <Typography
                    key={item}
                    component="li"
                    sx={{ color: '#37474f', fontSize: '0.88rem', lineHeight: 1.55, display: 'list-item' }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/assessments/completed')}
            sx={{ bgcolor: '#0d47a1', fontWeight: 800, py: 1.4, textTransform: 'none', borderRadius: 2 }}
          >
            View Completed &amp; Results
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<HomeOutlinedIcon />}
            onClick={() => navigate('/assessments/available')}
            sx={{ borderColor: '#cbd5e1', color: '#475569', py: 1.3, textTransform: 'none', borderRadius: 2 }}
          >
            Back to Assessments
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AssessmentResultPage;
