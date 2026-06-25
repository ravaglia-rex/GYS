import React, { useMemo } from 'react';
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
import { StudentProfileError } from '../../db/studentCollection';
import { AssessmentType } from '../../db/assessmentCollection';
import { useAssessmentConfig, useStudent } from '../../query/hooks';
import BigSpinner from '../ui/BigSpinner';
import * as Sentry from '@sentry/react';
import type { AssessmentProgress, GateResult } from '../../utils/assessmentGating';
import {
  ASSESSMENT_ORDER,
  ASSESSMENT_NAMES,
  computeGate,
  membershipLevelForAssessmentGate,
  defaultAssessmentProgress,
  isAssessmentFullyComplete,
  EXAM_MAX_SCORE_POINTS,
  tierPercentToExamPoints,
  pickLatestOrBestAssessmentScore,
  isLevelBasedAssessment,
  buildAssessmentLevelScoreBreakdown,
} from '../../utils/assessmentGating';
import { countClearedTiersFromProgress } from '../../utils/tierProgression';
import { getReasoningExamSubcategories } from '../../data/reasoningExamSubcategories';
import { STUDENT_OFFICIAL_ASSESSMENTS_ENABLED } from '../../constants/constants';
import { formatCooldownDate, nextEligibleAtMsForLevel } from '../../utils/examAttemptCooldown';
import {
  getPreviewSampleAssessmentPath,
  isPreviewSampleExamId,
} from '../../data/previewSampleAssessments';

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
  comprehensive_personality: {
    assessmentNumber: 4,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    icon: '🌐',
    description: '~30 dimensions for early stream recommendations. ~200 questions, 45 - 60 minutes.',
    languages: [],
  },
  ai_literacy: {
    assessmentNumber: 5,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
    icon: '🤖',
    description: 'AI Proficiency - concepts, evaluating outputs, live sandboxed task, and reflection. 60 minutes.',
    languages: [],
    needsLaptop: true,
  },
  english_proficiency: {
    assessmentNumber: 6,
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    icon: '✍️',
    description: 'Advanced English - reading, writing, listening, and speaking (Career Ready and above).',
    languages: [],
    needsMic: true,
  },
  career_interest_inventory: {
    assessmentNumber: 7,
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)',
    icon: '🧭',
    description: 'Career Discovery - Career Ready; completes after English Proficiency.',
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
    /** Return path for `/for-schools/preview/assessment` back / exit (student preview) */
    previewSampleExitTo?: string;
    /** Class for tier-progression gating (defaults to 8) */
    previewGrade?: number;
    /** When true, Start / Retake on every card is a no-op (dashboard preview only) */
    previewDisableStartNavigation?: boolean;
    /** Assessment IDs whose primary Start CTA stays visible but does not navigate (preview only) */
    previewBlockStartForIds?: readonly string[];
    /** Assessment IDs whose preview sample CTA should be hidden */
    previewHideSampleCtaForIds?: readonly string[];
  };
}

// ─── Single Assessment Card ───────────────────────────────────────────────────

interface AssessmentCardProps {
  assessment: AssessmentType;
  progress: AssessmentProgress;
  gate: GateResult;
  onStart: (assessmentId: string, tier: number) => void;
  /** When set (preview mode), locked "View details" is disabled instead of navigating */
  previewFallbackPath?: string;
  /** Preview: per-exam sample assessment path when available (reasoning triad) */
  previewSamplePath?: string;
  /** Passed as router state when opening preview sample assessment */
  previewSampleExitTo?: string;
  /** Preview: Start button shown but click is a no-op */
  previewStartBlocked?: boolean;
  /** Preview: hide the sample assessment CTA for this card */
  previewSampleCtaHidden?: boolean;
  /** Live student gate while official question banks are not ready */
  officialStartPaused?: boolean;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  progress,
  gate,
  onStart,
  previewFallbackPath,
  previewSamplePath,
  previewSampleExitTo,
  previewStartBlocked = false,
  previewSampleCtaHidden = false,
  officialStartPaused = false,
}) => {
  const navigate = useNavigate();
  const goPreviewSample = (path: string) =>
    navigate(path, previewSampleExitTo ? { state: { sampleAssessmentExitTo: previewSampleExitTo } } : undefined);
  const previewNavPath = previewSamplePath ?? previewFallbackPath;
  const meta = ASSESSMENT_META[assessment.id] ?? {
    assessmentNumber: 0, color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #374151)',
    icon: '📋', description: '', languages: [], needsMic: false, needsLaptop: false,
  };

  const isLocked = gate.locked;
  const levelBased = isLevelBasedAssessment(assessment.id);
  const currentTier = progress.proficiency_tier ?? 1; // 1-indexed for skill exams
  const scoreDisplay = pickLatestOrBestAssessmentScore(progress);
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
  const allTiersComplete = isAssessmentFullyComplete(assessment, progress);
  const canStart = !isLocked && !allTiersComplete;
  const cooldownNextEligibleMs = levelBased ? nextEligibleAtMsForLevel(progress, currentTier) : null;
  const cooldownActive = canStart && cooldownNextEligibleMs != null;
  const showLevelProgress = !isLocked && levelBased;
  const progressTotal = totalTiers > 0 ? totalTiers : Math.max(currentTier, 1);
  const progressDone = totalTiers > 0 ? tiersDone : Math.max(currentTier - 1, 0);
  const progressPercent = progressTotal > 0 ? Math.min(100, (progressDone / progressTotal) * 100) : 0;

  /** Tier of last graded attempt (when backend stores it). Used so “Start L3” vs “Retake L3” matches focus vs history. */
  const latestAttemptLevelNum =
    typeof progress.latest_attempt_level === 'number' && !Number.isNaN(progress.latest_attempt_level)
      ? progress.latest_attempt_level
      : null;
  /** First time opening the current focus tier (last graded attempt was an earlier tier). */
  const startCurrentTierFirstTime =
    attemptsCount > 0 &&
    latestAttemptLevelNum != null &&
    latestAttemptLevelNum < currentTier &&
    currentTier <= totalTiers;

  const reqLevel = gate.requiredMembershipLevel ?? 3;
  const requiredPackageLabel =
    reqLevel <= 1 ? 'Trial / Discovery' : `Membership ${Math.max(1, reqLevel - 1)}`;
  const lockLabel = gate.reason === 'membership'
    ? `⭐ ${requiredPackageLabel} required`
    : gate.reason === 'prerequisite'
    ? `Unlocks after ${ASSESSMENT_NAMES[gate.missingPrerequisite ?? ''] ?? gate.missingPrerequisite}`
    : '';

  const isCareerReadyExclusive =
    assessment.id === 'english_proficiency' || assessment.id === 'career_interest_inventory';
  const membershipLocked = gate.reason === 'membership';
  const isPurpleTier = isCareerReadyExclusive && membershipLocked;
  const reasoningSubcategories = getReasoningExamSubcategories(assessment.id);

  /** Fixed slots so device chips, tier bar, and stats line up across cards in the same grid row */
  const STATS_ROW_SLOT_MIN = 48;
  const hasStats = !isLocked && (attemptsCount > 0 || tiersDone > 0);
  const levelScoreBreakdown =
    !isLocked && levelBased
      ? buildAssessmentLevelScoreBreakdown(progress, totalTiers)
      : [];
  const visibleLevelScoreBreakdown = allTiersComplete
    ? levelScoreBreakdown
    : levelScoreBreakdown.filter((row) => row.score0to100 != null);
  const showLevelScoreBreakdown = visibleLevelScoreBreakdown.length > 0;
  const previewBlockedStartCtaLabel = `Start Assessment ${meta.assessmentNumber}`;

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
          p: '16px !important',
          display: 'flex',
          flexDirection: 'column',
          '&:last-child': { pb: '16px !important' },
        }}
      >
        {/* Never put header/description inside flex:1 + minHeight:0 - it can shrink to zero and overlap the footer */}
        <Box sx={{ flex: '0 0 auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.15 }}>
            <Box sx={{
              width: 42, height: 42, borderRadius: 2,
              background: isLocked ? 'rgba(100,116,139,0.2)' : meta.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.35rem', flexShrink: 0, position: 'relative',
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
              label={`Level ${currentTier}`}
              size="small"
              sx={{ bgcolor: `${meta.color}18`, color: meta.color, fontSize: '0.73rem', height: 22, border: `1px solid ${meta.color}35` }}
            />
          ) : null}
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', mb: 0.8, lineHeight: 1.35 }}>
          {meta.description}
        </Typography>
        </Box>

        {/* Keep subcategories natural-height so cards do not grow a large scrollable middle section. */}
        {reasoningSubcategories.length > 0 ? (
          <Box
            sx={{
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.35, flexShrink: 0 }}>
              Subcategories
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 1.6,
                listStyleType: 'disc',
              }}
            >
              {reasoningSubcategories.map((line) => (
                <Typography
                  key={line}
                  component="li"
                  variant="caption"
                  sx={{ color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.35, display: 'list-item' }}
                >
                  {line}
                </Typography>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0 }} />
        )}

        <Box
          sx={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: '100%',
            minWidth: 0,
            mt: 1,
            pt: 1,
          }}
        >
          <Box
            sx={{
              minHeight: hasStats ? STATS_ROW_SLOT_MIN : 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            {hasStats ? (
              <Box sx={{ display: 'flex', gap: 3 }}>
                {scoreDisplay !== null && (
                  <Box>
                    <Tooltip
                      title={
                        levelBased
                          ? 'Points are from your most recently graded attempt. The level line is that attempt’s tier - it can differ from “levels complete” until you submit your current tier.'
                          : 'This profile assessment has no skill levels; this is your latest submitted result.'
                      }
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#475569',
                          fontSize: '0.7rem',
                          display: 'block',
                          textTransform: 'uppercase',
                          letterSpacing: 0.4,
                          cursor: 'help',
                          borderBottom: '1px dotted rgba(71, 85, 105, 0.6)',
                          width: 'fit-content',
                          maxWidth: '100%',
                        }}
                      >
                        {levelBased ? 'Latest level score' : 'Latest result'}
                      </Typography>
                    </Tooltip>
                    <Typography
                      sx={{
                        color: '#e2e8f0',
                        fontWeight: 700,
                        fontSize: '0.98rem',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {tierPercentToExamPoints(scoreDisplay.score0to100)} on {EXAM_MAX_SCORE_POINTS}
                    </Typography>
                    {levelBased && scoreDisplay.chartLevel != null && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'rgba(147, 197, 253, 0.88)',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          mt: 0.35,
                          letterSpacing: 0.02,
                        }}
                      >
                        Level {scoreDisplay.chartLevel}
                      </Typography>
                    )}
                    {scoreDisplay.chartScoreIsBestFallback && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'rgba(148, 163, 184, 0.85)',
                          fontSize: '0.62rem',
                          fontWeight: 500,
                          mt: 0.35,
                        }}
                      >
                        Best overall
                      </Typography>
                    )}
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
        {showLevelProgress ? (
          <Box sx={{ mb: showLevelScoreBreakdown ? 1 : 1.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'baseline', gap: 1 }}>
              <Tooltip title="How many levels are complete in this assessment.">
                <Typography
                  variant="caption"
                  component="span"
                  sx={{
                    color: '#94a3b8',
                    fontSize: '0.73rem',
                    cursor: 'help',
                    borderBottom: '1px dotted rgba(148, 163, 184, 0.45)',
                  }}
                >
                  Levels complete
                </Typography>
              </Tooltip>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.73rem' }}>
                {progressDone} / {progressTotal}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.05)',
                '& .MuiLinearProgress-bar': { bgcolor: meta.color, borderRadius: 3 },
              }}
            />
          </Box>
        ) : null}
        {showLevelScoreBreakdown ? (
          <Box
            sx={{
              mb: 1.25,
              p: 1,
              borderRadius: 1.5,
              bgcolor: 'rgba(15, 23, 42, 0.52)',
              border: '1px solid rgba(148, 163, 184, 0.16)',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#94a3b8',
                fontSize: '0.7rem',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                mb: 0.5,
                fontWeight: 700,
              }}
            >
              {allTiersComplete ? 'Score by level' : 'Completed level scores'}
            </Typography>
            <Box sx={{ display: 'grid', gap: 0.35 }}>
              {visibleLevelScoreBreakdown.map((row) => (
                <Box
                  key={row.level}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '0.74rem', fontWeight: 600 }}>
                    Level {row.level}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: row.score0to100 == null ? '#64748b' : '#e2e8f0',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.score0to100 == null
                      ? 'No score recorded'
                      : `${tierPercentToExamPoints(row.score0to100)} / ${EXAM_MAX_SCORE_POINTS}`}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
        {meta.needsMic || meta.needsLaptop ? (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
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
        {isLocked && lockLabel && (
          <Typography
            variant="caption"
            sx={{
              color: '#475569',
              fontSize: '0.8rem',
              display: 'block',
              mb: 1,
              fontStyle: 'italic',
              flexShrink: 0,
            }}
          >
            {lockLabel}
          </Typography>
        )}
        {isLocked ? (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LockIcon />}
            disabled={Boolean(previewFallbackPath)}
            onClick={() => {
              if (previewFallbackPath) return;
              navigate(`/assessments/${assessment.id}/tier/1/detail`);
            }}
            sx={{
              borderColor: isPurpleTier ? 'rgba(168, 85, 247, 0.55)' : '#475569',
              color: isPurpleTier ? 'rgba(196, 181, 253, 0.95)' : '#94a3b8',
              borderRadius: 1.5,
              fontSize: '0.875rem',
              ...(previewFallbackPath && {
                '&.Mui-disabled': {
                  borderColor: isPurpleTier ? 'rgba(168, 85, 247, 0.35)' : '#334155',
                  color: isPurpleTier ? 'rgba(196, 181, 253, 0.5)' : '#64748b',
                },
              }),
            }}
          >
            View details
          </Button>
        ) : allTiersComplete ? (
          previewNavPath ? (
            previewSampleCtaHidden ? null : (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                onClick={() => goPreviewSample(previewNavPath)}
                sx={{
                  borderColor: `${meta.color}80`,
                  color: meta.color,
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  '&:hover': { borderColor: meta.color, bgcolor: `${meta.color}12` },
                }}
              >
                Try sample assessment
              </Button>
            )
          ) : (
            <Button fullWidth variant="outlined" startIcon={<TrendingUpIcon />} disabled
              sx={{ borderColor: '#1e3a2f', color: '#10b981', borderRadius: 1.5, fontSize: '0.875rem' }}>
              {levelBased ? 'All levels completed' : 'Assessment completed'}
            </Button>
          )
        ) : officialStartPaused ? (
          <Button
            fullWidth
            variant="outlined"
            disabled
            sx={{
              borderColor: '#475569',
              color: '#94a3b8',
              borderRadius: 1.5,
              fontSize: '0.875rem',
              '&.Mui-disabled': {
                borderColor: '#334155',
                color: '#64748b',
              },
            }}
          >
            Official exams coming soon
          </Button>
        ) : cooldownActive && cooldownNextEligibleMs != null ? (
          <Box>
            <Button
              fullWidth
              variant="outlined"
              disabled
              startIcon={<RefreshIcon />}
              sx={{
                borderColor: '#475569',
                color: '#94a3b8',
                borderRadius: 1.5,
                fontSize: '0.875rem',
                '&.Mui-disabled': {
                  borderColor: '#334155',
                  color: '#64748b',
                },
              }}
            >
              Available {formatCooldownDate(cooldownNextEligibleMs)}
            </Button>
            <Typography
              variant="caption"
              sx={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem', mt: 0.75 }}
            >
              Same level retakes open every 3 months.
            </Typography>
          </Box>
        ) : canStart ? (
          previewStartBlocked && previewNavPath ? (
            previewSampleCtaHidden ? (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                disabled
                sx={{
                  borderColor: '#475569',
                  color: '#94a3b8',
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  '&.Mui-disabled': {
                    borderColor: '#334155',
                    color: '#64748b',
                  },
                }}
              >
                {previewBlockedStartCtaLabel}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                onClick={() => goPreviewSample(previewNavPath)}
                sx={{
                  borderColor: `${meta.color}80`,
                  color: meta.color,
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  '&:hover': { borderColor: meta.color, bgcolor: `${meta.color}12` },
                }}
              >
                Try sample assessment
              </Button>
            )
          ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={
              attemptsCount > 0 && !startCurrentTierFirstTime ? <RefreshIcon /> : <PlayArrowIcon />
            }
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
            {!levelBased
              ? attemptsCount === 0
                ? `Start Assessment ${meta.assessmentNumber}`
                : 'Retake Assessment'
              : attemptsCount === 0
                ? `Start Assessment ${meta.assessmentNumber}`
                : startCurrentTierFirstTime
                  ? `Start Level ${currentTier}`
                  : `Retake Level ${currentTier}`}
          </Button>
          )
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
  const liveLoad = !previewBundle && Boolean(uid);
  const {
    data: configFromBackend,
    isLoading: configLoading,
    isError: configError,
    error: configErr,
  } = useAssessmentConfig(liveLoad);
  const {
    data: studentData,
    isLoading: studentLoading,
    isError: studentError,
    error: studentErr,
  } = useStudent(uid, liveLoad);

  const loading = previewBundle ? false : configLoading || studentLoading;

  const error = useMemo(() => {
    if (previewBundle || !liveLoad) return null;
    if (configError) {
      Sentry.captureException(configErr);
      return configErr instanceof Error
        ? configErr.message
        : 'Could not load assessment configuration. Check the API URL and that functions are deployed.';
    }
    if (studentError) {
      Sentry.captureException(studentErr);
      if (studentErr instanceof StudentProfileError) {
        return studentErr.message;
      }
      return 'Could not load your student profile. Please refresh or sign in again.';
    }
    return null;
  }, [previewBundle, liveLoad, configError, configErr, studentError, studentErr]);

  const assessmentTypes = useMemo(() => {
    if (previewBundle) return previewBundle.assessments;
    if (!configFromBackend) return [];
    return [...configFromBackend].sort((a, b) => {
      const ia = ASSESSMENT_ORDER.indexOf(a.id as (typeof ASSESSMENT_ORDER)[number]);
      const ib = ASSESSMENT_ORDER.indexOf(b.id as (typeof ASSESSMENT_ORDER)[number]);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [previewBundle, configFromBackend]);

  const progressMap = useMemo(
    () => (previewBundle ? previewBundle.progress : studentData?.assessment_progress ?? {}),
    [previewBundle, studentData]
  );

  const membershipLevel = useMemo(
    () =>
      previewBundle
        ? previewBundle.membershipLevel
        : membershipLevelForAssessmentGate(studentData),
    [previewBundle, studentData]
  );

  const studentGrade = useMemo(() => {
    if (previewBundle) {
      return typeof previewBundle.previewGrade === 'number' && !Number.isNaN(previewBundle.previewGrade)
        ? previewBundle.previewGrade
        : 8;
    }
    return typeof studentData?.grade === 'number' && !Number.isNaN(studentData.grade)
      ? studentData.grade
      : 8;
  }, [previewBundle, studentData]);

  const handleStart = (assessmentId: string, tierNumber: number) => {
    if (!STUDENT_OFFICIAL_ASSESSMENTS_ENABLED && !previewBundle) {
      return;
    }
    if (previewBundle?.previewDisableStartNavigation) {
      return;
    }
    if (previewBundle) {
      const exitTo = previewBundle.previewSampleExitTo;
      const path = isPreviewSampleExamId(assessmentId)
        ? getPreviewSampleAssessmentPath(assessmentId)
        : previewBundle.previewAssessmentPath;
      navigate(
        path,
        exitTo ? { state: { sampleAssessmentExitTo: exitTo } } : undefined
      );
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

  // Apply filterType - keep cards mutually exclusive between available and completed sections.
  const filtered = gatedAssessments.filter(({ assessment, progress }) => {
    const fullyComplete = isAssessmentFullyComplete(assessment, progress);
    if (filterType === 'available') return !fullyComplete;
    if (filterType === 'completed') return fullyComplete;
    return true;
  });

  if (loading) return <BigSpinner variant="inline" size={48} />;

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
          sx={{
            display: 'grid',
            alignItems: 'stretch',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gridAutoRows: { sm: '1fr' },
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
              }}
            >
              <AssessmentCard
                assessment={assessment}
                progress={progress}
                gate={gate}
                onStart={handleStart}
                previewFallbackPath={previewBundle?.previewAssessmentPath}
                previewSamplePath={
                  previewBundle && isPreviewSampleExamId(assessment.id)
                    ? getPreviewSampleAssessmentPath(assessment.id)
                    : undefined
                }
                previewSampleExitTo={previewBundle?.previewSampleExitTo}
                previewStartBlocked={Boolean(
                  previewBundle?.previewDisableStartNavigation ||
                    previewBundle?.previewBlockStartForIds?.includes(assessment.id)
                )}
                previewSampleCtaHidden={Boolean(
                  previewBundle?.previewHideSampleCtaForIds?.includes(assessment.id)
                )}
                officialStartPaused={!previewBundle && !STUDENT_OFFICIAL_ASSESSMENTS_ENABLED}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export { EnhancedAssessmentCardsGroup };
