import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {
  estimatedPercentileFromScore,
  performanceTierFromScore,
  getAssessmentFlowDefinition,
} from '../../config/assessmentFlowUI';
import {
  buildSubscores,
  strengthAndGrowth,
  nextAssessmentNudge,
} from '../../config/assessmentResultDetail';

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

const barColor = (pct: number) => (pct >= 75 ? '#2e7d32' : pct >= 55 ? '#f9a825' : '#ef6c00');

const AssessmentResultDetailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | undefined;

  if (!state) {
    navigate('/assessments', { replace: true });
    return null;
  }

  const { assessmentId, scorePercent, passed, completedAt } = state;
  const flow = getAssessmentFlowDefinition(assessmentId);
  const displayScore = Math.round(scorePercent);
  const pct = estimatedPercentileFromScore(scorePercent);
  const tierPerf = performanceTierFromScore(displayScore);
  const rows = buildSubscores(assessmentId, scorePercent);
  const { strength, growth } = strengthAndGrowth(rows);
  const nudge = passed ? nextAssessmentNudge(assessmentId) : null;

  const dateLabel = completedAt
    ? new Date(completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  const tryShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${flow.examTitleShort} results`,
          text: `${tierPerf.label} - about ${pct}th percentile`,
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
        <Box
          sx={{
            bgcolor: '#e8f5e9',
            borderRadius: 2,
            p: 2.5,
            mb: 2,
            border: '1px solid #a5d6a7',
          }}
        >
          <Typography sx={{ fontWeight: 800, color: '#1b5e20', fontSize: '1.15rem', mb: 0.5 }}>
            🥇 {tierPerf.label}
          </Typography>
          <Typography sx={{ color: '#2e7d32', fontWeight: 600, fontSize: '0.9rem' }}>
            {pct}th percentile - indicative global ranking
          </Typography>
          <Typography sx={{ color: '#558b2f', fontSize: '0.78rem', mt: 1 }}>
            Completed {dateLabel}
          </Typography>
        </Box>

        <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5, fontSize: '0.95rem' }}>
          Score breakdown
        </Typography>
        {rows.map((r) => (
          <Box key={r.id} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{r.label}</Typography>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: barColor(r.percentile) }}>
                {r.percentile}th percentile
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={r.percentile}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': { bgcolor: barColor(r.percentile), borderRadius: 4 },
              }}
            />
          </Box>
        ))}

        <Box sx={{ bgcolor: '#e3f2fd', borderRadius: 2, p: 2, mb: 2, display: 'flex', gap: 1.5 }}>
          <LightbulbOutlinedIcon sx={{ color: '#1565c0', mt: 0.2 }} />
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#0d47a1', fontSize: '0.85rem' }}>Strength</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#37474f', lineHeight: 1.5 }}>{strength}</Typography>
          </Box>
        </Box>

        <Box sx={{ bgcolor: '#e3f2fd', borderRadius: 2, p: 2, mb: 3, display: 'flex', gap: 1.5 }}>
          <TrendingUpIcon sx={{ color: '#1565c0', mt: 0.2 }} />
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#0d47a1', fontSize: '0.85rem' }}>Growth area</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#37474f', lineHeight: 1.5 }}>
              {growth} - keep practicing; small gains compound quickly.
            </Typography>
          </Box>
        </Box>

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

        <Button fullWidth variant="contained" sx={{ bgcolor: '#0d47a1', fontWeight: 800, py: 1.25, mb: 1.5 }} onClick={() => navigate('/assessments/available')}>
          Back to dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default AssessmentResultDetailPage;
