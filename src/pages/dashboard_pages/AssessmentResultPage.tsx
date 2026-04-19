import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Chip } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import {
  getAssessmentFlowDefinition,
  estimatedPercentileFromScore,
  performanceTierFromScore,
  unlockNoticeForAssessment,
} from '../../config/assessmentFlowUI';

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
    navigate('/assessments', { replace: true });
    return null;
  }

  const { assessmentId, tierNumber, scorePercent, correct, total, passed, nextTier, completedAt } = state;
  const isAiLiteracy = assessmentId === 'ai_literacy';
  const flow = getAssessmentFlowDefinition(assessmentId);
  const displayScore = Math.round(scorePercent);
  const percentile = estimatedPercentileFromScore(scorePercent);
  const perfTier = performanceTierFromScore(displayScore);
  const unlock = unlockNoticeForAssessment(assessmentId, passed);
  const primary = flow.theme === 'purple' ? '#7b1fa2' : '#0d47a1';

  const detailState = { ...state };

  if (isAiLiteracy) {
    const grade = aiProficiencyLevel(displayScore);
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 5, px: 2 }}>
        <Box sx={{ maxWidth: 520, mx: 'auto' }}>
          <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 800, color: '#334155', mb: 3 }}>
            Results
          </Typography>
          <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <Box sx={{ background: `linear-gradient(135deg, ${grade.color}, #263238)`, px: 3, py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🤖</Typography>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>{flow.examTitleShort}</Typography>
              <Chip label={`Tier ${tierNumber}`} size="small" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
            </Box>
            <Box sx={{ px: 3, py: 3, textAlign: 'center' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: `${grade.color}18`, border: `1px solid ${grade.color}44`, borderRadius: 10, px: 2, py: 0.75, mb: 2 }}>
                <CheckCircleIcon sx={{ color: grade.color, fontSize: '1.1rem' }} />
                <Typography sx={{ color: grade.color, fontWeight: 800, fontSize: '0.9rem' }}>{grade.label}</Typography>
              </Box>
              <Typography variant="h2" sx={{ color: grade.color, fontWeight: 900, fontSize: '3.2rem', lineHeight: 1 }}>
                {displayScore}%
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 2 }}>
                {correct} correct out of {total}
              </Typography>
              <Box sx={{ textAlign: 'left', bgcolor: '#f1f5f9', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 700, color: grade.color, fontSize: '0.85rem', mb: 0.5 }}>{grade.label}</Typography>
                <Typography sx={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.55 }}>{grade.description}</Typography>
              </Box>
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, mb: 2, textAlign: 'left' }}>
                {passed
                  ? nextTier != null
                    ? `You unlocked Tier ${nextTier}. Continue from Assessments when you are ready.`
                    : 'You have completed all tiers for this assessment.'
                  : 'Review the material and retake the tier to reach the next proficiency band.'}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {passed && nextTier != null && (
                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(`/assessments/${assessmentId}/tier/${nextTier}/detail`)}
                    sx={{ bgcolor: '#06b6d4', fontWeight: 800, py: 1.3, textTransform: 'none' }}
                  >
                    Continue to Tier {nextTier}
                  </Button>
                )}
                {!passed && (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ReplayIcon />}
                    onClick={() => navigate(`/assessments/${assessmentId}/tier/${tierNumber}/detail`)}
                    sx={{ bgcolor: '#06b6d4', fontWeight: 800, py: 1.3, textTransform: 'none' }}
                  >
                    Retake Tier {tierNumber}
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<HomeOutlinedIcon />}
                  onClick={() => navigate('/assessments/available')}
                  sx={{ borderColor: '#cbd5e1', color: '#475569', py: 1.2, textTransform: 'none' }}
                >
                  Back to Assessments
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4, px: 2, pb: 8 }}>
      <Box sx={{ maxWidth: 520, mx: 'auto' }}>
        <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 800, color: '#334155', mb: 2 }}>
          Results
        </Typography>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: '3rem', lineHeight: 1, mb: 1 }}>🎉</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 0.5 }}>
            Assessment complete!
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.55, px: 1 }}>
            Your {flow.examTitleShort} run has been scored. Here is a quick snapshot
            {completedAt ? ` (${new Date(completedAt).toLocaleDateString()})` : ''}.
          </Typography>
        </Box>

        {passed ? (
          <Box
            sx={{
              bgcolor: '#e8f5e9',
              borderRadius: 2,
              p: 2.5,
              mb: 2,
              border: '1px solid #a5d6a7',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: '1.75rem', mb: 0.5 }}>🥇</Typography>
            <Typography sx={{ fontWeight: 900, color: '#1b5e20', fontSize: '1.2rem' }}>{perfTier.label}</Typography>
            <Typography sx={{ color: '#2e7d32', fontWeight: 700, fontSize: '0.95rem', mt: 0.5 }}>
              {percentile}th percentile - indicative global ranking
            </Typography>
            <Typography sx={{ color: '#558b2f', fontSize: '0.8rem', mt: 1 }}>
              Score {displayScore}% · {correct} / {total} items
            </Typography>
          </Box>
        ) : (
          <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 2, p: 2.5, mb: 2, border: '1px solid #cbd5e1', textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', mb: 0.5 }}>Your score</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#334155', fontSize: '2.5rem' }}>
              {displayScore}%
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mt: 0.5 }}>
              {correct} / {total} items - keep going; retakes are unlimited.
            </Typography>
          </Box>
        )}

        {!passed && (
          <Box sx={{ bgcolor: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 2, p: 2, mb: 2, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
              <CancelIcon sx={{ color: '#c62828' }} />
              <Typography sx={{ fontWeight: 800, color: '#b71c1c' }}>Tier not passed</Typography>
            </Box>
            <Typography sx={{ color: '#616161', fontSize: '0.85rem' }}>
              Reach the passing threshold to unlock the next tier.
            </Typography>
          </Box>
        )}

        {unlock && passed && (
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
            <Box>
              <Typography sx={{ fontWeight: 900, color: '#0d47a1', fontSize: '0.95rem', mb: 0.5 }}>
                New assessments unlocked!
              </Typography>
              <Typography sx={{ color: '#37474f', fontSize: '0.85rem', lineHeight: 1.55 }}>{unlock}</Typography>
              <Typography sx={{ color: '#78909c', fontSize: '0.72rem', mt: 1, lineHeight: 1.45 }}>
                Higher membership levels include additional instruments. Level 2 is the full reasoning triad (Exams 1–3); Level 3 includes all six exams (adds English, AI, and comprehensive personality).
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Button
            fullWidth
            variant="contained"
            endIcon={<AnalyticsOutlinedIcon />}
            onClick={() => navigate(`/assessments/${assessmentId}/result/details`, { state: detailState })}
            sx={{ bgcolor: primary, fontWeight: 800, py: 1.4, textTransform: 'none', borderRadius: 2 }}
          >
            View detailed results
          </Button>

          {passed && nextTier != null && (
            <Button
              fullWidth
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(`/assessments/${assessmentId}/tier/${nextTier}/detail`)}
              sx={{
                bgcolor: '#f1f5f9',
                color: '#0f172a',
                fontWeight: 800,
                py: 1.4,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#e2e8f0' },
              }}
            >
              Next tier - start
            </Button>
          )}

          {!passed && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<ReplayIcon />}
              onClick={() => navigate(`/assessments/${assessmentId}/tier/${tierNumber}/detail`)}
              sx={{
                bgcolor: '#f1f5f9',
                color: '#0f172a',
                fontWeight: 800,
                py: 1.4,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: 'none',
              }}
            >
              Retake tier {tierNumber}
            </Button>
          )}

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
