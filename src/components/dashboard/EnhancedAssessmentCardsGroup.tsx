import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { getStudent, StudentProfileError } from '../../db/studentCollection';
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
import { countClearedTiersFromProgress } from '../../utils/tierProgression';
import { getReasoningExamSubcategories } from '../../data/reasoningExamSubcategories';

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
    description: 'Abstract patterns, rules, and structured problem-solving across visual and logical formats.',
    languages: [],
  },
  verbal_reasoning: {
    assessmentNumber: 2,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    icon: '📚',
    description: 'Comprehension, inference, and argument evaluation using written and contextual language.',
    languages: [],
  },
  mathematical_reasoning: {
    assessmentNumber: 3,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    icon: '∑',
    description: 'Quantitative reasoning, structure, and non-routine mathematical thinking beyond rote calculation.',
    languages: [],
  },
  personality_assessment: {
    assessmentNumber: 4,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    icon: '🧠',
    description: 'Basic profile: 8 general dimensions (goal setting, persistence, learning orientation). Included with Level 2.',
    languages: [],
  },
  english_proficiency: {
    assessmentNumber: 5,
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    icon: '✍️',
    description: 'Advanced English - reading, writing, listening, and speaking. Level 3.',
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
    description: '~30 college-specific dimensions. ~200 questions, 45 - 60 minutes. The capstone assessment.',
    languages: [],
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnhancedAssessmentCardsGroupProps {
  uid: string;
  filterType?: 'available' | 'completed' | 'all';
  showDashboardOverview?: boolean;
  description?: string;
  /** Mock assessments - skips Firestore; Start/Retake opens previewAssessmentPath unless previewDisableStartNavigation */
  previewBundle?: {
    assessments: AssessmentType[];
    progress: Record<string, AssessmentProgress>;
    membershipLevel: number;
    previewAssessmentPath: string;
    /** Grade for tier-progression gating (defaults to 8) */
    previewGrade?: number;
    /** When true, Start / Retake on every card is a no-op (dashboard preview only) */
    previewDisableStartNavigation?: boolean;
    /** Assessment IDs whose primary Start CTA stays visible but does not navigate (preview only) */
    previewBlockStartForIds?: readonly string[];
  };
}

// ─── Single Assessment Card ───────────────────────────────────────────────────

interface AssessmentCardProps {
  assessment: AssessmentType;
  progress: AssessmentProgress;
  gate: GateResult;
  onStart: (assessmentId: string, tier: number) => void;
  /** When set (preview mode), locked "View details" opens this path instead of live assessment routes */
  previewFallbackPath?: string;
  /** Preview: Start button shown but click is a no-op */
  previewStartBlocked?: boolean;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  progress,
  gate,
  onStart,
  previewFallbackPath,
  previewStartBlocked = false,
}) => {
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
  const tiersDone =
    progress.tiers_cleared && Object.keys(progress.tiers_cleared).length > 0
      ? countClearedTiersFromProgress(progress, totalTiers)
      : currentTier >= 1
        ? Math.min(currentTier - 1, totalTiers)
        : 0;
  /** Each cleared tier implies at least one successful attempt; show the larger of stored count vs that floor */
  const displayAttempts = Math.max(attemptsCount, tiersDone);
  const tierProgress = totalTiers > 0 ? (tiersDone / totalTiers) * 100 : 0;
  const allTiersComplete = currentTier > totalTiers && totalTiers > 0;
  const canStart = !isLocked && !allTiersComplete;

  const reqLevel = gate.requiredMembershipLevel ?? 3;
  const lockLabel = gate.reason === 'membership'
    ? `⭐ Level ${reqLevel} required - ${MEMBERSHIP_LEVEL_LABELS[reqLevel] ?? ''}`
    : gate.reason === 'prerequisite'
    ? `Unlocks after ${ASSESSMENT_NAMES[gate.missingPrerequisite ?? ''] ?? gate.missingPrerequisite}`
    : '';

  const isL3Exclusive = assessment.id === 'comprehensive_personality';
  const membershipLocked = gate.reason === 'membership';
  const isPurpleTier = isL3Exclusive && membershipLocked;
  const reasoningSubcategories = getReasoningExamSubcategories(assessment.id);

  /** Fixed slots so device chips, tier bar, and stats line up across cards in the same grid row */
  const DEVICE_CHIPS_SLOT_MIN = 40;
  const TIER_PROGRESS_SLOT_MIN = 46;
  const STATS_ROW_SLOT_MIN = 42;

  return (
    <Card sx={{
      flex: 1,
      height: '100%',
      width: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
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
      <CardContent
        sx={{
          flex: 1,
          minHeight: 0,
          p: '20px !important',
          display: 'flex',
          flexDirection: 'column',
          '&:last-child': { pb: '20px !important' },
        }}
      >
        {/* Never put header/description inside flex:1 + minHeight:0 - it can shrink to zero and overlap the footer */}
        <Box sx={{ flex: '0 0 auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 2,
              background: isLocked ? 'rgba(100,116,139,0.2)' : meta.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', flexShrink: 0, position: 'relative',
            }}>
              {isLocked ? '🔒' : meta.icon}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.2 }}>
                <Typography variant="caption" sx={{ color: meta.color, fontWeight: 700, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Assessment {meta.assessmentNumber}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, lineHeight: 1.2, fontSize: '1.05rem' }}>
                {assessment.name}
              </Typography>
            </Box>
          </Box>

          {/* Status chip */}
          {isLocked ? (
            <Chip
              icon={<LockIcon sx={{ fontSize: '0.78rem !important' }} />}
              label="Locked"
              size="small"
              sx={{ bgcolor: 'rgba(100,116,139,0.15)', color: '#64748b', fontSize: '0.73rem', height: 22 }}
            />
          ) : allTiersComplete ? (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '0.78rem !important', color: '#10b981 !important' }} />}
              label="Done"
              size="small"
              sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.73rem', height: 22, border: '1px solid rgba(16,185,129,0.25)' }}
            />
          ) : displayAttempts > 0 ? (
            <Chip
              label={`Tier ${currentTier}`}
              size="small"
              sx={{ bgcolor: `${meta.color}18`, color: meta.color, fontSize: '0.73rem', height: 22, border: `1px solid ${meta.color}35` }}
            />
          ) : null}
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem', mb: 1, lineHeight: 1.45 }}>
          {meta.description}
        </Typography>
        </Box>

        {/* Only this region uses flex:1 + minHeight:0 so equal-height cards get scrollable subcats without crushing the header */}
        {reasoningSubcategories.length > 0 ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75, flexShrink: 0 }}>
              Subcategories
            </Typography>
            <Box
              component="ul"
              sx={{
                flex: 1,
                minHeight: 0,
                m: 0,
                pl: 2,
                listStyleType: 'disc',
                overflowY: 'auto',
                pr: 0.5,
                scrollbarWidth: 'thin',
              }}
            >
              {reasoningSubcategories.map((line) => (
                <Typography
                  key={line}
                  component="li"
                  variant="caption"
                  sx={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.55, display: 'list-item' }}
                >
                  {line}
                </Typography>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0 }} />
        )}

        {isLocked && lockLabel && (
          <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.8rem', display: 'block', mb: 0, fontStyle: 'italic', flexShrink: 0 }}>
            {lockLabel}
          </Typography>
        )}

        <Box
          sx={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            width: '100%',
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              minHeight: DEVICE_CHIPS_SLOT_MIN,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            {meta.needsMic || meta.needsLaptop ? (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                {meta.needsMic && (
                  <Tooltip title="Listening & speaking components require a microphone">
                    <Chip
                      icon={<MicIcon sx={{ fontSize: '0.73rem !important' }} />}
                      label="Mic required"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(239,68,68,0.1)',
                        color: '#f87171',
                        fontSize: '0.68rem',
                        height: 20,
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    />
                  </Tooltip>
                )}
                {meta.needsLaptop && (
                  <Tooltip title="Section 3 (Live AI Task) works best on a laptop or desktop">
                    <Chip
                      icon={<LaptopMacIcon sx={{ fontSize: '0.73rem !important' }} />}
                      label="Laptop recommended"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(6,182,212,0.1)',
                        color: '#67e8f9',
                        fontSize: '0.68rem',
                        height: 20,
                        border: '1px solid rgba(6,182,212,0.2)',
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
            ) : null}
          </Box>

          <Box
            sx={{
              minHeight: TIER_PROGRESS_SLOT_MIN,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            {!isLocked && totalTiers > 0 ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.73rem' }}>
                    Tier progress
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.73rem' }}>
                    {tiersDone} / {totalTiers}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={tierProgress}
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& .MuiLinearProgress-bar': { bgcolor: meta.color, borderRadius: 3 },
                  }}
                />
              </Box>
            ) : null}
          </Box>

          <Box
            sx={{
              minHeight: STATS_ROW_SLOT_MIN,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            {!isLocked && (attemptsCount > 0 || tiersDone > 0) ? (
              <Box sx={{ display: 'flex', gap: 3 }}>
                {bestScore !== null && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#475569',
                        fontSize: '0.7rem',
                        display: 'block',
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                      }}
                    >
                      Best Score
                    </Typography>
                    <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.98rem' }}>
                      {Math.round(bestScore * 100)}%
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#475569',
                      fontSize: '0.7rem',
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                    }}
                  >
                    Attempts
                  </Typography>
                  <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.98rem' }}>
                    {displayAttempts}
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </Box>

        <Box>
        {isLocked ? (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LockIcon />}
            onClick={() =>
              previewFallbackPath
                ? navigate(previewFallbackPath)
                : navigate(`/assessments/${assessment.id}/tier/1/detail`)
            }
            sx={{
              borderColor: isPurpleTier ? 'rgba(168, 85, 247, 0.55)' : '#475569',
              color: isPurpleTier ? 'rgba(196, 181, 253, 0.95)' : '#94a3b8',
              borderRadius: 1.5,
              fontSize: '0.875rem',
            }}
          >
            View details
          </Button>
        ) : allTiersComplete ? (
          <Button fullWidth variant="outlined" startIcon={<TrendingUpIcon />} disabled
            sx={{ borderColor: '#1e3a2f', color: '#10b981', borderRadius: 1.5, fontSize: '0.875rem' }}>
            All Tiers Completed
          </Button>
        ) : canStart ? (
          <Button
            fullWidth
            variant="contained"
            startIcon={attemptsCount > 0 ? <RefreshIcon /> : <PlayArrowIcon />}
            aria-disabled={previewStartBlocked}
            onClick={() => {
              if (previewStartBlocked) return;
              onStart(assessment.id, currentTier);
            }}
            sx={{
              background: meta.gradient,
              color: '#fff',
              fontWeight: 700,
              borderRadius: 1.5,
              fontSize: '0.9rem',
              ...(previewStartBlocked
                ? {
                    cursor: 'default',
                    '&:hover': { opacity: 1 },
                  }
                : { '&:hover': { opacity: 0.88 } }),
            }}
          >
            {attemptsCount > 0 ? `Retake Tier ${currentTier}` : `Start Assessment ${meta.assessmentNumber}`}
          </Button>
        ) : null}
        </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const EnhancedAssessmentCardsGroup: React.FC<EnhancedAssessmentCardsGroupProps> = ({
  uid,
  filterType = 'all',
  description,
  previewBundle,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!previewBundle);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>(
    previewBundle?.assessments ?? []
  );
  const [progressMap, setProgressMap] = useState<Record<string, AssessmentProgress>>(
    previewBundle?.progress ?? {}
  );
  const [membershipLevel, setMembershipLevel] = useState(previewBundle?.membershipLevel ?? 0);
  const [studentGrade, setStudentGrade] = useState<number>(8);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (previewBundle) {
      setAssessmentTypes(previewBundle.assessments);
      setProgressMap(previewBundle.progress);
      setMembershipLevel(previewBundle.membershipLevel);
      setStudentGrade(
        typeof previewBundle.previewGrade === 'number' && !Number.isNaN(previewBundle.previewGrade)
          ? previewBundle.previewGrade
          : 8
      );
      setLoading(false);
      return;
    }
    if (!uid) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let configFromBackend: AssessmentType[];
        try {
          configFromBackend = await getAssessmentConfig();
        } catch (cfgErr) {
          Sentry.captureException(cfgErr);
          setError(
            cfgErr instanceof Error
              ? cfgErr.message
              : 'Could not load assessment configuration. Check the API URL and that functions are deployed.'
          );
          return;
        }

        let studentData: Awaited<ReturnType<typeof getStudent>>;
        try {
          studentData = await getStudent(uid);
        } catch (stuErr) {
          Sentry.captureException(stuErr);
          if (stuErr instanceof StudentProfileError) {
            setError(stuErr.message);
          } else {
            setError('Could not load your student profile. Please refresh or sign in again.');
          }
          return;
        }

        setMembershipLevel(normalizeMembershipLevel(studentData?.membership_level));
        setStudentGrade(
          typeof studentData?.grade === 'number' && !Number.isNaN(studentData.grade)
            ? studentData.grade
            : 8
        );
        setProgressMap(studentData?.assessment_progress ?? {});

        const sorted = [...configFromBackend].sort((a, b) => {
          const ia = ASSESSMENT_ORDER.indexOf(a.id as (typeof ASSESSMENT_ORDER)[number]);
          const ib = ASSESSMENT_ORDER.indexOf(b.id as (typeof ASSESSMENT_ORDER)[number]);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        setAssessmentTypes(sorted);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [uid, previewBundle]);

  const handleStart = (assessmentId: string, tierNumber: number) => {
    if (previewBundle?.previewDisableStartNavigation) {
      return;
    }
    if (previewBundle) {
      navigate(previewBundle.previewAssessmentPath);
      return;
    }
    navigate(`/assessments/${assessmentId}/tier/${tierNumber}/detail`);
  };

  // Build gated assessments
  const gatedAssessments = assessmentTypes.map((a) => {
    const progress = progressMap[a.id] ?? defaultAssessmentProgress;
    const gate = computeGate(a.id, membershipLevel, progressMap, studentGrade, assessmentTypes);
    return { assessment: a, progress, gate };
  });

  // Apply filterType - "available" lists every assessment not yet fully completed (including locked cards)
  const filtered = gatedAssessments.filter(({ assessment, progress }) => {
    const fullyComplete = isAssessmentFullyComplete(assessment, progress);
    if (filterType === 'available') return !fullyComplete;
    if (filterType === 'completed') return progress.attempts_count > 0;
    return true;
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const [uniformCardMinPx, setUniformCardMinPx] = useState<number | null>(null);
  const filteredLayoutKey = filtered.map(({ assessment }) => assessment.id).join('|');

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || filtered.length === 0) {
      setUniformCardMinPx(null);
      return;
    }

    const measure = () => {
      const kids = Array.from(grid.children).filter((n): n is HTMLElement => n instanceof HTMLElement);
      if (kids.length === 0) {
        setUniformCardMinPx(null);
        return;
      }
      const maxH = Math.max(...kids.map((k) => k.getBoundingClientRect().height));
      if (maxH <= 0) return;
      const next = Math.ceil(maxH);
      setUniformCardMinPx((prev) => (prev != null && Math.abs(prev - next) <= 1 ? prev : next));
    };

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      Array.from(grid.children).forEach((c) => ro!.observe(c));
    }

    schedule();
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [filtered.length, filteredLayoutKey, filterType]);

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
        <Box
          ref={gridRef}
          sx={{
            display: 'grid',
            alignItems: 'stretch',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {filtered.map(({ assessment, progress, gate }) => (
            <Box
              key={assessment.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                height: '100%',
                ...(uniformCardMinPx != null ? { minHeight: uniformCardMinPx } : {}),
              }}
            >
              <AssessmentCard
                assessment={assessment}
                progress={progress}
                gate={gate}
                onStart={handleStart}
                previewFallbackPath={previewBundle?.previewAssessmentPath}
                previewStartBlocked={Boolean(
                  previewBundle?.previewDisableStartNavigation ||
                    previewBundle?.previewBlockStartForIds?.includes(assessment.id)
                )}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export { EnhancedAssessmentCardsGroup };
export default EnhancedAssessmentCardsGroup;
