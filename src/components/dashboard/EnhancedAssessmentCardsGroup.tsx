import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Button, LinearProgress, Tooltip } from '@mui/material';
import {
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Mic as MicIcon,
  LaptopMac as LaptopMacIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getStudent } from '../../db/studentCollection';
import { getAssessmentConfig, AssessmentType } from '../../db/assessmentCollection';
import BigSpinner from '../ui/BigSpinner';
import * as Sentry from '@sentry/react';
import type { AssessmentProgress, GateResult } from '../../utils/assessmentGating';
import {
  ASSESSMENT_ORDER,
  ASSESSMENT_NAMES,
  computeGate,
  normalizeMembershipLevel,
  defaultAssessmentProgress,
  MEMBERSHIP_LEVEL_LABELS,
  isAssessmentFullyComplete,
} from '../../utils/assessmentGating';

// ─── Assessment metadata ──────────────────────────────────────────────────────

const ASSESSMENT_META: Record<string, {
  assessmentNumber: number;
  color: string;
  gradient: string;
  icon: string;
  description: string;
  languages: string[];
  needsMic?: boolean;
  needsLaptop?: boolean;
}> = {
  symbolic_reasoning: {
    assessmentNumber: 1,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    icon: '🧩',
    description: 'Pattern recognition, logical deduction, sequences, and abstract problem-solving.',
    languages: [],
  },
  verbal_reasoning: {
    assessmentNumber: 2,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    icon: '📚',
    description: 'Analytical language use, argument structure, inference, and reading comprehension.',
    languages: [],
  },
  mathematical_reasoning: {
    assessmentNumber: 3,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    icon: '∑',
    description: 'Non-routine problems, quantitative logic, and mathematical thinking beyond computation.',
    languages: [],
  },
  personality_assessment: {
    assessmentNumber: 4,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    icon: '🧠',
    description: '8 general personality dimensions including goal setting, persistence, and learning orientation.',
    languages: [],
  },
  english_proficiency: {
    assessmentNumber: 5,
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    icon: '✍️',
    description: 'Full four-skills assessment: reading, writing, listening, and speaking.',
    languages: [],
    needsMic: true,
  },
  ai_literacy: {
    assessmentNumber: 6,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
    icon: '🤖',
    description: '4 sections: AI concepts, evaluating AI outputs, live AI task (sandboxed), and reflection. 60 minutes.',
    languages: [],
    needsLaptop: true,
  },
  comprehensive_personality: {
    assessmentNumber: 7,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    icon: '🌐',
    description: '~30 college-specific dimensions. ~200 questions, 45–60 minutes. The capstone assessment.',
    languages: [],
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnhancedAssessmentCardsGroupProps {
  uid: string;
  filterType?: 'available' | 'completed' | 'all';
  showDashboardOverview?: boolean;
  description?: string;
}

// ─── Single Assessment Card ───────────────────────────────────────────────────

interface AssessmentCardProps {
  assessment: AssessmentType;
  progress: AssessmentProgress;
  gate: GateResult;
  onStart: (assessmentId: string, tier: number) => void;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({ assessment, progress, gate, onStart }) => {
  const navigate = useNavigate();
  const meta = ASSESSMENT_META[assessment.id] ?? {
    assessmentNumber: 0, color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #374151)',
    icon: '📋', description: '', languages: [], needsMic: false, needsLaptop: false,
  };

  const isLocked = gate.locked;
  const currentTier = progress.proficiency_tier; // 1-indexed: 1 = take tier 1, 2 = take tier 2, 3 = all done
  const bestScore = progress.best_score;
  const attemptsCount = progress.attempts_count;
  const totalTiers = assessment.tiers.length;
  const tiersDone = currentTier >= 1 ? Math.min(currentTier - 1, totalTiers) : 0;
  const tierProgress = totalTiers > 0 ? (tiersDone / totalTiers) * 100 : 0;
  const allTiersComplete = currentTier > totalTiers && totalTiers > 0;
  const canStart = !isLocked && !allTiersComplete;

  const reqLevel = gate.requiredMembershipLevel ?? 3;
  const lockLabel = gate.reason === 'membership'
    ? `⭐ Level ${reqLevel} required — ${MEMBERSHIP_LEVEL_LABELS[reqLevel] ?? ''}`
    : gate.reason === 'prerequisite'
    ? `Unlocks after ${ASSESSMENT_NAMES[gate.missingPrerequisite ?? ''] ?? gate.missingPrerequisite}`
    : '';

  const isL3Exclusive = assessment.id === 'comprehensive_personality';
  const membershipLocked = gate.reason === 'membership';
  const isPurpleTier = isL3Exclusive && membershipLocked;

  return (
    <Card sx={{
      bgcolor: isPurpleTier ? 'rgba(88, 28, 135, 0.08)' : '#1e293b',
      border: isPurpleTier
        ? '1px solid rgba(168, 85, 247, 0.4)'
        : `1px solid ${isLocked ? '#334155' : `${meta.color}40`}`,
      borderRadius: 3,
      transition: 'all 0.2s',
      opacity: isLocked ? (gate.reason === 'membership' ? (isPurpleTier ? 0.52 : 0.58) : 0.65) : 1,
      '&:hover': !isLocked ? {
        border: `1px solid ${meta.color}80`,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 30px ${meta.color}20`,
      } : {},
    }}>
      <CardContent sx={{ p: '24px !important' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 2,
              background: isLocked ? 'rgba(100,116,139,0.2)' : meta.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0, position: 'relative',
            }}>
              {isLocked ? '🔒' : meta.icon}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.2 }}>
                <Typography variant="caption" sx={{ color: meta.color, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Assessment {meta.assessmentNumber}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, lineHeight: 1.2, fontSize: '0.95rem' }}>
                {assessment.name}
              </Typography>
            </Box>
          </Box>

          {/* Status chip */}
          {isLocked ? (
            <Chip
              icon={<LockIcon sx={{ fontSize: '0.7rem !important' }} />}
              label="Locked"
              size="small"
              sx={{ bgcolor: 'rgba(100,116,139,0.15)', color: '#64748b', fontSize: '0.65rem', height: 20 }}
            />
          ) : allTiersComplete ? (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '0.7rem !important', color: '#10b981 !important' }} />}
              label="Done"
              size="small"
              sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.65rem', height: 20, border: '1px solid rgba(16,185,129,0.25)' }}
            />
          ) : attemptsCount > 0 ? (
            <Chip
              label={`Tier ${currentTier}`}
              size="small"
              sx={{ bgcolor: `${meta.color}18`, color: meta.color, fontSize: '0.65rem', height: 20, border: `1px solid ${meta.color}35` }}
            />
          ) : null}
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.76rem', mb: 2, lineHeight: 1.5 }}>
          {meta.description}
        </Typography>

        {/* Device warnings */}
        {(meta.needsMic || meta.needsLaptop) && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
            {meta.needsMic && (
              <Tooltip title="Listening & speaking components require a microphone">
                <Chip
                  icon={<MicIcon sx={{ fontSize: '0.65rem !important' }} />}
                  label="Mic required"
                  size="small"
                  sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.6rem', height: 18, border: '1px solid rgba(239,68,68,0.2)' }}
                />
              </Tooltip>
            )}
            {meta.needsLaptop && (
              <Tooltip title="Section 3 (Live AI Task) works best on a laptop or desktop">
                <Chip
                  icon={<LaptopMacIcon sx={{ fontSize: '0.65rem !important' }} />}
                  label="Laptop recommended"
                  size="small"
                  sx={{ bgcolor: 'rgba(6,182,212,0.1)', color: '#67e8f9', fontSize: '0.6rem', height: 18, border: '1px solid rgba(6,182,212,0.2)' }}
                />
              </Tooltip>
            )}
          </Box>
        )}

        {/* Tier progress */}
        {!isLocked && totalTiers > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem' }}>Tier progress</Typography>
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem' }}>{tiersDone} / {totalTiers}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={tierProgress}
              sx={{
                height: 5, borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.05)',
                '& .MuiLinearProgress-bar': { bgcolor: meta.color, borderRadius: 3 },
              }}
            />
          </Box>
        )}

        {/* Stats */}
        {!isLocked && attemptsCount > 0 && (
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            {bestScore !== null && (
              <Box>
                <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.62rem', display: 'block', textTransform: 'uppercase', letterSpacing: 0.4 }}>Best Score</Typography>
                <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>
                  {Math.round(bestScore * 100)}%
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.62rem', display: 'block', textTransform: 'uppercase', letterSpacing: 0.4 }}>Attempts</Typography>
              <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>{attemptsCount}</Typography>
            </Box>
          </Box>
        )}

        {/* Lock reason */}
        {isLocked && lockLabel && (
          <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', display: 'block', mb: 1.5, fontStyle: 'italic' }}>
            {lockLabel}
          </Typography>
        )}

        {/* CTA */}
        {isLocked ? (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LockIcon />}
            onClick={() => navigate(`/assessments/${assessment.id}/tier/1/detail`)}
            sx={{
              borderColor: isPurpleTier ? 'rgba(168, 85, 247, 0.55)' : '#475569',
              color: isPurpleTier ? 'rgba(196, 181, 253, 0.95)' : '#94a3b8',
              borderRadius: 1.5,
              fontSize: '0.78rem',
            }}
          >
            View details
          </Button>
        ) : allTiersComplete ? (
          <Button fullWidth variant="outlined" startIcon={<TrendingUpIcon />} disabled
            sx={{ borderColor: '#1e3a2f', color: '#10b981', borderRadius: 1.5, fontSize: '0.78rem' }}>
            All Tiers Completed
          </Button>
        ) : canStart ? (
          <Button
            fullWidth variant="contained"
            startIcon={attemptsCount > 0 ? <RefreshIcon /> : <PlayArrowIcon />}
            onClick={() => onStart(assessment.id, currentTier)}
            sx={{
              background: meta.gradient, color: '#fff', fontWeight: 700,
              borderRadius: 1.5, fontSize: '0.8rem', '&:hover': { opacity: 0.88 },
            }}
          >
            {attemptsCount > 0 ? `Retake Tier ${currentTier}` : `Start Assessment ${meta.assessmentNumber}`}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const EnhancedAssessmentCardsGroup: React.FC<EnhancedAssessmentCardsGroupProps> = ({
  uid,
  filterType = 'all',
  description,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, AssessmentProgress>>({});
  const [membershipLevel, setMembershipLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        setLoading(true);
        const [studentData, configFromBackend] = await Promise.all([
          getStudent(uid),
          getAssessmentConfig(),
        ]);
        setMembershipLevel(normalizeMembershipLevel(studentData?.membership_level));
        setProgressMap(studentData?.assessment_progress ?? {});

        // Sort returned config by the canonical assessment order
        const sorted = [...configFromBackend].sort((a, b) => {
          const ia = ASSESSMENT_ORDER.indexOf(a.id as (typeof ASSESSMENT_ORDER)[number]);
          const ib = ASSESSMENT_ORDER.indexOf(b.id as (typeof ASSESSMENT_ORDER)[number]);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        setAssessmentTypes(sorted);
      } catch (err) {
        Sentry.captureException(err);
        setError('Failed to load assessments. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid]);

  const handleStart = (assessmentId: string, tierNumber: number) => {
    navigate(`/assessments/${assessmentId}/tier/${tierNumber}/detail`);
  };

  // Build gated assessments
  const gatedAssessments = assessmentTypes.map((a) => {
    const progress = progressMap[a.id] ?? defaultAssessmentProgress;
    const gate = computeGate(a.id, membershipLevel, progressMap);
    return { assessment: a, progress, gate };
  });

  // Apply filterType — "available" lists every assessment not yet fully completed (including locked cards)
  const filtered = gatedAssessments.filter(({ assessment, progress }) => {
    const fullyComplete = isAssessmentFullyComplete(assessment, progress);
    if (filterType === 'available') return !fullyComplete;
    if (filterType === 'completed') return progress.attempts_count > 0;
    return true;
  });

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <BigSpinner />
    </Box>
  );

  if (error) return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Typography sx={{ color: '#ef4444' }}>{error}</Typography>
    </Box>
  );

  return (
    <Box>
      {description && (
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>{description}</Typography>
      )}

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
            {filterType === 'completed' ? 'No assessments taken yet' : 'No assessments available'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            {filterType === 'completed'
              ? 'Complete your first assessment to see results here.'
              : 'Complete the required sequence or upgrade your membership to unlock more.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2.5,
        }}>
          {filtered.map(({ assessment, progress, gate }) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              progress={progress}
              gate={gate}
              onStart={handleStart}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export { EnhancedAssessmentCardsGroup };
export default EnhancedAssessmentCardsGroup;
