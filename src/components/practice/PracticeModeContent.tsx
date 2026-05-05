import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Lock as LockIcon,
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import type { AssessmentProgress } from '../../utils/assessmentGating';
import type { PracticeAssessmentGateInput, PracticeLevel } from './practiceModeConfig';
import {
  PRACTICE_ELIGIBLE_EXAM_IDS,
  PRACTICE_EXAM_CARD_STYLE,
  firstUnlockedPracticeEligibleExamId,
  maxUnlockedPracticeLevel,
  practiceExamGate,
  practiceExamIsUnlocked,
  practiceExamLockedTooltip,
  getAssessmentDisplayName,
  getPracticeStats,
  recommendedLevelLabel,
  recommendedPracticeLevel,
  setActivePracticeSession,
} from './practiceModeConfig';
import { fetchPracticePoolCounts } from '../../db/practiceBank';

/** Official exam progress + tier counts - used to cap practice difficulty per exam. */
export interface PracticeUnlockContext {
  progressByExam: Record<string, AssessmentProgress | { proficiency_tier?: number }>;
  officialTierCountByExam: Record<string, number>;
  /** When set, only exams that are unlocked on the real dashboard can be chosen for practice. */
  assessmentGate?: PracticeAssessmentGateInput;
}

export interface PracticeModeContentProps {
  /** `preview` for interactive demo; signed-in user's uid for the real dashboard. */
  storageScope: string;
  grade: number;
  /** When true, omit outer max-width padding tweaks used inside preview layout. */
  embedded?: boolean;
  /**
   * When omitted, only Level 1 practice is offered (safe default). Pass profile + config tier
   * counts so unlock matches official tier progression for each exam.
   */
  practiceUnlock?: PracticeUnlockContext;
}

const LEVELS: PracticeLevel[] = [1, 2, 3];

/** Bold step label + title used for Step 1 / Step 2 section rails */
function PracticeSectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        flexWrap: 'wrap',
        mb: 1.25,
      }}
    >
      <Box
        aria-hidden
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 1.35,
          py: 0.45,
          borderRadius: 999,
          fontSize: '0.7rem',
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#0f172a',
          background: 'linear-gradient(100deg, #c4b5fd 0%, #7dd3fc 100%)',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        Step {step}
      </Box>
      <Typography
        variant="h6"
        component="h2"
        sx={{
          m: 0,
          fontWeight: 800,
          fontSize: { xs: '1.15rem', sm: '1.28rem' },
          letterSpacing: 0.03,
          color: 'white',
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}

const PracticeModeContent: React.FC<PracticeModeContentProps> = ({
  storageScope,
  grade,
  embedded = false,
  practiceUnlock,
}) => {
  const recLevel = useMemo(() => recommendedPracticeLevel(grade), [grade]);
  const assessmentGate = practiceUnlock?.assessmentGate;

  const [selectedExamId, setSelectedExamId] = useState<string>(() =>
    firstUnlockedPracticeEligibleExamId(practiceUnlock?.assessmentGate)
  );
  const [selectedLevel, setSelectedLevel] = useState<PracticeLevel>(() => {
    const exam = firstUnlockedPracticeEligibleExamId(practiceUnlock?.assessmentGate);
    const max0 =
      practiceUnlock != null
        ? maxUnlockedPracticeLevel(
            practiceUnlock.progressByExam[exam],
            practiceUnlock.officialTierCountByExam[exam] ?? 3
          )
        : 1;
    return Math.min(recommendedPracticeLevel(grade), max0) as PracticeLevel;
  });

  useEffect(() => {
    if (!assessmentGate) return;
    if (!practiceExamIsUnlocked(selectedExamId, assessmentGate)) {
      const next = firstUnlockedPracticeEligibleExamId(assessmentGate);
      setSelectedExamId(next);
    }
  }, [assessmentGate, selectedExamId]);
  const [sessionRev, setSessionRev] = useState(0);
  /** Pattern & Logic: live counts from Firestore `practice_bank` (when API succeeds). */
  const [livePoolByLevel, setLivePoolByLevel] = useState<Partial<
    Record<PracticeLevel, number>
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (selectedExamId !== 'symbolic_reasoning') {
      setLivePoolByLevel(null);
      return () => {
        cancelled = true;
      };
    }
    fetchPracticePoolCounts('symbolic_reasoning')
      .then((res) => {
        if (cancelled) return;
        const c = res.counts ?? {};
        setLivePoolByLevel({
          1: Number(c['1'] ?? 0),
          2: Number(c['2'] ?? 0),
          3: Number(c['3'] ?? 0),
        });
      })
      .catch(() => {
        if (!cancelled) setLivePoolByLevel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedExamId]);

  const maxUnlocked = useMemo((): PracticeLevel => {
    if (!practiceUnlock) return 1;
    const officialTiers = practiceUnlock.officialTierCountByExam[selectedExamId] ?? 3;
    const prog = practiceUnlock.progressByExam[selectedExamId];
    return maxUnlockedPracticeLevel(prog, officialTiers);
  }, [practiceUnlock, selectedExamId]);

  useEffect(() => {
    const rec = recommendedPracticeLevel(grade);
    setSelectedLevel(Math.min(rec, maxUnlocked) as PracticeLevel);
  }, [selectedExamId, grade, maxUnlocked]);

  const stats = useMemo(() => {
    void sessionRev;
    return getPracticeStats(
      storageScope,
      selectedExamId,
      selectedLevel,
      selectedExamId === 'symbolic_reasoning' ? livePoolByLevel : null
    );
  }, [storageScope, selectedExamId, selectedLevel, sessionRev, livePoolByLevel]);

  const refreshStorage = useCallback(() => setSessionRev((x) => x + 1), []);

  const canResume =
    stats.activeSession != null &&
    stats.activeSession.examId === selectedExamId &&
    stats.activeSession.level === selectedLevel &&
    selectedLevel <= maxUnlocked;

  const progressRatio = stats.pool > 0 ? Math.min(1, stats.completed / stats.pool) : 0;

  const [toast, setToast] = useState<string | null>(null);

  const handleStart = () => {
    if (selectedLevel > maxUnlocked) return;
    setActivePracticeSession(storageScope, {
      examId: selectedExamId,
      level: selectedLevel,
      startedAt: new Date().toISOString(),
    });
    refreshStorage();
    setToast(
      'Practice session saved. The interactive question experience will open here in a future update - your progress is stored locally for now.'
    );
  };

  const handleResume = () => {
    setToast(
      'Resuming your saved session. Questions will load here when the practice engine is connected.'
    );
  };

  return (
    <Box sx={{ maxWidth: embedded ? 'none' : '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Avatar
          sx={{
            width: embedded ? 52 : 64,
            height: embedded ? 52 : 64,
            background: 'linear-gradient(135deg, #a78bfa, #38bdf8)',
            color: 'white',
          }}
        >
          <ScienceIcon sx={{ fontSize: embedded ? 26 : 32 }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography
            variant={embedded ? 'h5' : 'h4'}
            sx={{
              color: 'white',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #a78bfa, #38bdf8)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Practice Mode
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255, 255, 255, 0.72)', mt: 0.5, maxWidth: 720 }}
          >
            Build familiarity with questions and testing patterns similar to the official exam.
          </Typography>
        </Box>
        <Chip
          icon={<SchoolIcon sx={{ fontSize: '1rem !important' }} />}
          label={`Your grade: ${grade}`}
          sx={{
            borderColor: 'rgba(167, 139, 250, 0.45)',
            color: 'rgba(255,255,255,0.88)',
            bgcolor: 'rgba(99, 102, 241, 0.15)',
            fontWeight: 600,
          }}
          variant="outlined"
        />
      </Box>

      <Alert
        severity="info"
        sx={{
          mb: 2.5,
          bgcolor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          color: 'rgba(255,255,255,0.92)',
          '& .MuiAlert-icon': { color: '#38bdf8' },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
          What practice is for
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.55 }}>
          Use practice to learn the format, pacing, and skills each exam targets. Nothing here affects your official
          scores, school reports, or rankings. There is{' '}
          <strong>no overall time limit</strong> for a practice session. Each question shows a{' '}
          <strong>per-question timer</strong> so you can notice how long you spend thinking. It is for your
          awareness only. 
        </Typography>
      </Alert>

      <PracticeSectionHeading step={1} title="Choose an exam" />
      <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.45)', mb: 1.75, maxWidth: 720 }}>
        Select one assessment below (same unlock rules as your official exams). The highlighted card is your current
        choice - other available exams look muted until you click them.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          mb: 3,
          alignItems: 'stretch',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {PRACTICE_ELIGIBLE_EXAM_IDS.map((id) => {
          const meta = PRACTICE_EXAM_CARD_STYLE[id];
          const selected = selectedExamId === id;
          const gateResult = assessmentGate ? practiceExamGate(id, assessmentGate) : null;
          /** No gate payload (e.g. profile error): only Exam 1 - Pattern and Logic - is practiceable. */
          const lockedByProgram = assessmentGate
            ? Boolean(gateResult?.locked)
            : id !== PRACTICE_ELIGIBLE_EXAM_IDS[0];
          const canSelect = !lockedByProgram;
          const lockTooltipText =
            lockedByProgram && assessmentGate && gateResult
              ? practiceExamLockedTooltip(gateResult)
              : lockedByProgram && !assessmentGate
                ? 'Assessment unlocks could not be loaded - you can still practice Pattern and Logic (Exam 1). Open Practice Mode again after your profile loads for the full list.'
                : '';
          const showTooltip = Boolean(lockTooltipText);

          const card = (
            <Card
              elevation={0}
              onClick={() => {
                if (canSelect) setSelectedExamId(id);
              }}
              sx={{
                position: 'relative',
                height: '100%',
                borderRadius: 2,
                cursor: canSelect ? 'pointer' : 'not-allowed',
                overflow: 'visible',
                border:
                  selected && canSelect
                    ? `2px solid ${meta.accent}`
                    : '1px solid rgba(255,255,255,0.1)',
                boxShadow:
                  selected && canSelect
                    ? `0 0 0 1px ${meta.accent}55, 0 12px 40px -8px ${meta.accent}50, 0 4px 20px rgba(0,0,0,0.45)`
                    : 'none',
                transform: selected && canSelect ? 'scale(1.02)' : 'scale(1)',
                zIndex: selected && canSelect ? 2 : 0,
                opacity: lockedByProgram ? 0.38 : selected ? 1 : 0.55,
                filter: lockedByProgram
                  ? 'grayscale(0.75) brightness(0.7)'
                  : selected
                    ? 'none'
                    : 'grayscale(0.5) brightness(0.88)',
                background: selected
                  ? `linear-gradient(150deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.92) 50%, rgba(15,23,42,0.88) 100%)`
                  : 'linear-gradient(160deg, rgba(15,23,42,0.55) 0%, rgba(30,41,59,0.4) 100%)',
                transition:
                  'transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, filter 0.18s ease, border-color 0.18s ease',
                '&:hover':
                  canSelect && !selected
                    ? {
                        opacity: 0.82,
                        filter: 'grayscale(0.25) brightness(0.95)',
                        transform: 'scale(1.01)',
                        borderColor: `${meta.accent}66`,
                        boxShadow: `0 8px 24px -6px ${meta.accent}33`,
                      }
                    : canSelect && selected
                      ? {
                          boxShadow: `0 0 0 2px ${meta.accent}77, 0 14px 44px -6px ${meta.accent}55`,
                        }
                      : {},
              }}
            >
              <Box
                sx={{
                  height: selected && canSelect ? 5 : 4,
                  borderRadius: '8px 8px 0 0',
                  background: meta.gradient,
                  opacity: selected ? 1 : lockedByProgram ? 0.35 : 0.55,
                  transition: 'opacity 0.18s ease',
                }}
              />
              <CardContent sx={{ pt: 2, pb: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Chip
                    size="small"
                    label={`Exam ${meta.examNumber}`}
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      bgcolor: `${meta.accent}${selected ? '33' : '18'}`,
                      color: selected ? meta.accent : 'rgba(255,255,255,0.55)',
                      border: 'none',
                    }}
                  />
                  {lockedByProgram ? (
                    <Chip
                      size="small"
                      icon={<LockIcon sx={{ fontSize: '1rem !important' }} />}
                      label="Locked"
                      sx={{
                        height: 22,
                        fontWeight: 600,
                        bgcolor: 'rgba(0,0,0,0.25)',
                        color: 'rgba(255,255,255,0.45)',
                        border: 'none',
                      }}
                    />
                  ) : selected ? (
                    <Chip
                      size="small"
                      icon={<CheckCircleOutlineIcon sx={{ fontSize: '1rem !important' }} />}
                      label="Selected"
                      sx={{
                        height: 22,
                        fontWeight: 700,
                        bgcolor: `${meta.accent}28`,
                        color: meta.accent,
                        border: `1px solid ${meta.accent}55`,
                      }}
                    />
                  ) : null}
                </Stack>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: selected ? 'white' : 'rgba(255,255,255,0.82)',
                    fontWeight: selected ? 800 : 600,
                    mt: 1.25,
                    lineHeight: 1.3,
                  }}
                >
                  {getAssessmentDisplayName(id)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', mt: 0.75 }}>
                  Skill-based · Adaptive-Style Pool
                </Typography>
              </CardContent>
            </Card>
          );

          return showTooltip ? (
            <Tooltip key={id} title={lockTooltipText} arrow placement="top">
              <span style={{ display: 'block', height: '100%' }}>{card}</span>
            </Tooltip>
          ) : (
            <Box key={id} sx={{ minWidth: 0 }}>
              {card}
            </Box>
          );
        })}

        <Alert
          severity="warning"
          sx={{
            height: '100%',
            minHeight: { xs: 0, md: '100%' },
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'flex-start',
            bgcolor: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 2,
            color: 'rgba(255,255,255,0.88)',
            py: 1.5,
            '& .MuiAlert-icon': {
              color: '#fbbf24',
              alignSelf: 'flex-start',
              pt: 0.25,
            },
            '& .MuiAlert-message': {
              width: '100%',
              py: 0,
            },
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75, lineHeight: 1.35 }}>
              Exams 6 &amp; 7 - No Practice Pool
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, fontSize: '0.8rem' }}>
              These last two focus on personality and career interests, not skill drills, so there is no practice bank.
              You&apos;ll complete them once in your official flow when your membership unlocks them.
            </Typography>
          </Box>
        </Alert>
      </Box>

      <PracticeSectionHeading step={2} title="Difficulty level" />
      {practiceUnlock && maxUnlocked < 3 && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            bgcolor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(129, 140, 248, 0.28)',
            color: 'rgba(255,255,255,0.88)',
            '& .MuiAlert-icon': { color: '#a5b4fc' },
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
            For <strong>{getAssessmentDisplayName(selectedExamId)}</strong>, you can practice official difficulty levels{' '}
            <strong>1 through {maxUnlocked}</strong> - matching what you&apos;ve unlocked on the real exam. Advance your
            official level to unlock the next practice level (you can still practice every unlocked level even before you
            attempt the next level officially).
          </Typography>
        </Alert>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 1,
          mb: 2,
          width: '100%',
        }}
      >
        {LEVELS.map((lvl) => {
          const isRec = lvl === recLevel;
          const selected = selectedLevel === lvl;
          const locked = lvl > maxUnlocked;
          const btn = (
            <Button
              fullWidth
              variant={selected ? 'contained' : 'outlined'}
              disabled={locked}
              onClick={() => {
                if (!locked) setSelectedLevel(lvl);
              }}
              sx={{
                minWidth: 0,
                width: '100%',
                height: '100%',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                px: { xs: 0.75, sm: 1.25 },
                py: 1.25,
                borderColor: selected ? 'transparent' : 'rgba(255,255,255,0.2)',
                color: selected ? '#0f172a' : locked ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.85)',
                bgcolor: selected ? 'linear-gradient(90deg, #a78bfa, #38bdf8)' : 'transparent',
                background: selected ? 'linear-gradient(90deg, #c4b5fd, #7dd3fc)' : undefined,
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.35)',
                  bgcolor: selected ? undefined : 'rgba(255,255,255,0.06)',
                },
              }}
            >
              <Stack alignItems="center" spacing={0.35} sx={{ width: '100%', minWidth: 0, textAlign: 'center', py: 0.25 }}>
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    lineHeight: 1.2,
                    color: selected ? '#0f172a' : locked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.88)',
                  }}
                >
                  Level {lvl}
                </Typography>
                {locked && (
                  <Chip
                    size="small"
                    label="Locked"
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(0,0,0,0.25)',
                      color: 'rgba(255,255,255,0.45)',
                      maxWidth: '100%',
                    }}
                  />
                )}
                {isRec && !locked && (
                  <Tooltip title="We suggest this level based on your grade; you can still pick any unlocked level." arrow>
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        lineHeight: 1.2,
                        letterSpacing: 0.03,
                        textTransform: 'uppercase',
                        color: selected ? 'rgba(15,23,42,0.65)' : '#7dd3fc',
                        cursor: 'help',
                        borderBottom: selected ? '1px dotted rgba(15,23,42,0.35)' : '1px dotted rgba(125,211,252,0.45)',
                      }}
                    >
                      Suggested for you
                    </Typography>
                  </Tooltip>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 500,
                    fontSize: '0.62rem',
                    lineHeight: 1.25,
                    px: 0.25,
                    color: selected ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.48)',
                  }}
                >
                  {recommendedLevelLabel(lvl)}
                </Typography>
              </Stack>
            </Button>
          );
          return locked ? (
            <Tooltip
              key={lvl}
              title="Unlock this practice level by advancing your official level on this exam (same progression as your dashboard)."
              arrow
              placement="top"
            >
              <Box component="span" sx={{ display: 'block', minWidth: 0, width: '100%' }}>
                {btn}
              </Box>
            </Tooltip>
          ) : (
            <Box key={lvl} sx={{ minWidth: 0, width: '100%', display: 'flex' }}>
              {btn}
            </Box>
          );
        })}
      </Box>

      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'linear-gradient(160deg, rgba(30,41,59,0.65) 0%, rgba(15,23,42,0.85) 100%)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>
                Question pool · selected focus
              </Typography>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mt: 0.5 }}>
                {getAssessmentDisplayName(selectedExamId)} · Level {selectedLevel}
              </Typography>
              <Stack direction="row" spacing={3} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    In pool
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#7dd3fc', fontWeight: 800 }}>
                    {stats.pool}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    You&apos;ve completed
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#a7f3d0', fontWeight: 800 }}>
                    {stats.completed}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                    Progress through pool
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                    {stats.completed} / {stats.pool}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progressRatio * 100}
                  sx={{
                    height: 8,
                    borderRadius: 99,
                    bgcolor: 'rgba(255,255,255,0.06)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 99,
                      background: 'linear-gradient(90deg, #8b5cf6, #38bdf8)',
                    },
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.38)', display: 'block', mt: 1.5 }}>
                {selectedExamId === 'symbolic_reasoning' && livePoolByLevel != null
                  ? 'Pool size is the live count from your Pattern & Logic practice bank in Firebase. Completed items are tracked locally until the full practice player ships.'
                  : selectedExamId === 'symbolic_reasoning'
                    ? 'Upload items to practice_bank (see backend script) to show live pool sizes. Completed items are tracked locally for now.'
                    : 'Pool sizes are placeholders until each exam has a practice bank wired; completed count updates when you finish items (stored locally for now).'}
              </Typography>
            </Box>
            <Stack spacing={1.25} sx={{ minWidth: { sm: 220 } }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                disabled={!canResume}
                onClick={handleResume}
                sx={{
                  py: 1.25,
                  fontWeight: 700,
                  borderRadius: 2,
                  background: canResume
                    ? 'linear-gradient(90deg, #6366f1, #38bdf8)'
                    : 'rgba(255,255,255,0.12)',
                  color: canResume ? 'white' : 'rgba(255,255,255,0.35)',
                }}
              >
                Resume practice
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleStart}
                disabled={selectedLevel > maxUnlocked}
                sx={{
                  py: 1.25,
                  fontWeight: 700,
                  borderRadius: 2,
                  borderColor: 'rgba(167, 139, 250, 0.55)',
                  color: 'rgba(255,255,255,0.92)',
                  '&:hover': { borderColor: '#a78bfa', bgcolor: 'rgba(167, 139, 250, 0.08)' },
                }}
              >
                Start / restart
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        <Card
          elevation={0}
          sx={{
            height: '100%',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
            bgcolor: 'rgba(15, 23, 42, 0.35)',
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <ScheduleIcon sx={{ color: '#38bdf8', fontSize: '1.35rem' }} />
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700 }}>
                Timers
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              No countdown for the whole session. Work at a thoughtful pace. Each item can show how long you&apos;ve
              been on that question so you build awareness for exam day.
            </Typography>
          </CardContent>
        </Card>
        <Card
          elevation={0}
          sx={{
            height: '100%',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.1)',
            bgcolor: 'rgba(15, 23, 42, 0.35)',
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <AssignmentIcon sx={{ color: '#a78bfa', fontSize: '1.35rem' }} />
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700 }}>
                Rules snapshot
              </Typography>
            </Stack>
            <Stack spacing={1} component="ul" sx={{ pl: 2.25, m: 0, color: 'rgba(255,255,255,0.75)' }}>
              <Typography component="li" variant="body2">
                Practice draws from a <strong>separate pool</strong>, outcomes stay out of official scoring.
              </Typography>
              <Typography component="li" variant="body2">
                Levels <strong>1 - 3</strong> align broadly with {recommendedLevelLabel(1)},{' '}
                {recommendedLevelLabel(2)}, and {recommendedLevelLabel(3)} respectively; you may choose any level.
              </Typography>
             
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={6000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity="info"
          variant="filled"
          sx={{
            width: '100%',
            maxWidth: 480,
            bgcolor: 'rgba(30, 41, 59, 0.98)',
            color: 'white',
            border: '1px solid rgba(56, 189, 248, 0.35)',
          }}
        >
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PracticeModeContent;
