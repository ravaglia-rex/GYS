import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Replay as ReplayIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import BlockIcon from '@mui/icons-material/Block';
import BoltIcon from '@mui/icons-material/Bolt';
import BarChartIcon from '@mui/icons-material/BarChart';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MicIcon from '@mui/icons-material/Mic';
import { useNavigate, useLocation } from 'react-router-dom';
import { PREVIEW_PATTERN_LOGIC_SAMPLE_QUESTIONS } from '../../../data/schoolPreviewMock';
import {
  getAssessmentFlowDefinition,
  type BeforeBeginIconKey,
  type BeforeBeginItem,
} from '../../../config/assessmentFlowUI';
import { mergeStatGridWithTier } from '../../../components/assessment/mergeStatGridWithTier';
import { ExamQuestionBody, inferQuestionInteraction } from '../../../components/assessment/ExamQuestionBody';
import type { ExamQuestion } from '../../../db/assessmentCollection';

type SampleAssessmentLocationState = { sampleAssessmentExitTo?: string };

const ASSESSMENT_ID = 'symbolic_reasoning';
const EXAM_TOTAL = 7;

function PreviewBeforeBeginIcon({ k }: { k: BeforeBeginIconKey }) {
  const sx = { fontSize: '1.1rem', color: '#b45309', opacity: 0.95 };
  switch (k) {
    case 'clock':
      return <AccessTimeIcon sx={sx} />;
    case 'phone':
      return <SmartphoneIcon sx={sx} />;
    case 'block':
      return <BlockIcon sx={sx} />;
    case 'bolt':
      return <BoltIcon sx={sx} />;
    case 'chart':
      return <BarChartIcon sx={sx} />;
    case 'headphones':
      return <HeadphonesIcon sx={sx} />;
    case 'mic':
      return <MicIcon sx={sx} />;
    default:
      return <AccessTimeIcon sx={sx} />;
  }
}
const SAMPLE_TIMER_START_SEC = 10 * 60;
const SAMPLE_BANNER_PT = 5.5; // rem ≈ 88px including padding

function formatMmSs(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type PreviewPhase = 'intro' | 'exam' | 'complete';

const DEFAULT_SAMPLE_EXIT = '/for-schools/preview';

function sampleAssessmentExitLabel(exitTo: string): string {
  if (exitTo === DEFAULT_SAMPLE_EXIT) return 'Back to preview hub';
  if (exitTo === '/students') return 'Back to students';
  if (exitTo.startsWith('/students/preview')) return 'Back to sample dashboard';
  return 'Back';
}

const SchoolPreviewAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sampleExitTo =
    (location.state as SampleAssessmentLocationState | null)?.sampleAssessmentExitTo ?? DEFAULT_SAMPLE_EXIT;
  const flow = getAssessmentFlowDefinition(ASSESSMENT_ID);
  const previewQuestionCount = PREVIEW_PATTERN_LOGIC_SAMPLE_QUESTIONS.length;
  const statGrid = useMemo(() => {
    return mergeStatGridWithTier(flow, undefined).map((cell) => {
      const L = cell.label.toLowerCase();
      if (L === 'duration') return { ...cell, value: '10 min' };
      if (L === 'questions' || L.includes('question')) return { ...cell, value: String(previewQuestionCount) };
      return cell;
    });
  }, [flow, previewQuestionCount]);

  const previewBeforeBegin: BeforeBeginItem[] = useMemo(
    () => [
      {
        icon: 'clock',
        text: `This sample has ${previewQuestionCount} practice questions and a 10-minute countdown (display only - not enforced). You can exit anytime; nothing is saved.`,
      },
      { icon: 'block', text: 'No calculators, notes, or outside help (same norms as the live exam).' },
      { icon: 'chart', text: 'Scores here are for practice feedback only, not official benchmarking.' },
      { icon: 'phone', text: 'Find a quiet place with minimal distraction to get a feel for the real flow.' },
      { icon: 'bolt', text: 'The live exam adapts difficulty; this sample uses fixed practice items.' },
    ],
    [previewQuestionCount]
  );
  const primary =
    flow.theme === 'purple'
      ? { main: '#7b1fa2', dark: '#4a148c', light: '#f3e5f5', border: '#ce93d8' }
      : { main: '#1565c0', dark: '#0d47a1', light: '#e3f2fd', border: '#90caf9' };
  const examLabel = `Exam ${flow.examOrdinal} of ${EXAM_TOTAL}`;
  const heroIcon = flow.theme === 'purple' ? '🧠' : flow.examOrdinal === 1 ? '🧩' : '📋';
  const contentMaxWidth = { xs: 'min(100%, 520px)', md: 920, lg: 1040 } as const;

  const [phase, setPhase] = useState<PreviewPhase>('intro');
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SAMPLE_TIMER_START_SEC);

  const questions: ExamQuestion[] = useMemo(
    () =>
      PREVIEW_PATTERN_LOGIC_SAMPLE_QUESTIONS.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
      })),
    []
  );

  const total = questions.length;
  const currentQuestion = questions[step] ?? null;
  const questionNumber = step + 1;

  useEffect(() => {
    if (phase !== 'exam') return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!currentQuestion) return;
    const prev = choices[currentQuestion.id];
    setSelectedOption(typeof prev === 'number' ? prev : null);
  }, [step, currentQuestion, choices]);

  const score = useCallback(() => {
    let correct = 0;
    PREVIEW_PATTERN_LOGIC_SAMPLE_QUESTIONS.forEach((item) => {
      if (choices[item.id] === item.correctIndex) correct += 1;
    });
    return correct;
  }, [choices]);

  const handleNext = useCallback(() => {
    if (selectedOption === null || !currentQuestion) return;
    setChoices((c) => ({ ...c, [currentQuestion.id]: selectedOption }));
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      setPhase('complete');
    }
  }, [selectedOption, currentQuestion, step, total]);

  useEffect(() => {
    if (phase !== 'exam') return;
    const handleKey = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      const mode = inferQuestionInteraction(ASSESSMENT_ID, currentQuestion);
      if (mode === 'likert' && currentQuestion.options?.length >= 5) {
        if (['1', '2', '3', '4', '5'].includes(e.key)) setSelectedOption(parseInt(e.key, 10) - 1);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const max = Math.min(4, currentQuestion.options?.length ?? 4);
        const idx = parseInt(e.key, 10) - 1;
        if (idx < max) setSelectedOption(idx);
      }
      if (e.key === 'Enter' && selectedOption !== null) handleNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, handleNext, selectedOption, currentQuestion]);

  const beginSample = () => {
    setSecondsLeft(SAMPLE_TIMER_START_SEC);
    setPhase('exam');
  };

  const reset = () => {
    setPhase('intro');
    setStep(0);
    setChoices({});
    setSelectedOption(null);
    setSecondsLeft(SAMPLE_TIMER_START_SEC);
  };

  const confirmExit = () => {
    setExitOpen(false);
    navigate(sampleExitTo);
  };

  const headerBg = flow.theme === 'purple' ? '#6a1b9a' : '#0d47a1';
  const progressColor = '#ffc107';
  const primaryBtn = primary.main;
  const examShortTitle = flow.examTitleShort;
  const progressPercent = total > 0 ? ((step + (selectedOption !== null ? 0.5 : 0)) / total) * 100 : 0;
  const adaptiveNoBack = flow.adaptiveForwardOnly;

  const goPreviewHub = () => navigate(sampleExitTo);

  if (phase === 'intro') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: { xs: 14, md: 16 } }}>
        <Box
          sx={{
            bgcolor: '#fff',
            borderBottom: '1px solid #e2e8f0',
            px: { xs: 2, md: 3 },
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <IconButton onClick={goPreviewHub} aria-label="Back" size="small">
            <ArrowBackIcon sx={{ color: primary.main }} />
          </IconButton>
          <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 600, color: '#334155', fontSize: { xs: '0.95rem', md: '1rem' } }}>
            Assessment Detail
          </Typography>
          <Box sx={{ width: 40 }} />
        </Box>

        <Box sx={{ maxWidth: contentMaxWidth, mx: 'auto', px: { xs: 2, md: 4, lg: 5 }, pt: { xs: 3, md: 4 } }}>
          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', mb: 0.75, letterSpacing: 0.2 }}>
            Sample preview - practice only; not scored or saved
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '0.8rem', md: '0.85rem' },
              color: '#64748b',
              textAlign: 'center',
              mb: 1.5,
              maxWidth: 520,
              mx: 'auto',
              lineHeight: 1.55,
            }}
          >
            {previewQuestionCount} questions · about 10 minutes on the timer (demo only) · leave anytime via Exit or back
          </Typography>

          <Box
            sx={{
              borderRadius: 3,
              background:
                flow.theme === 'purple'
                  ? 'linear-gradient(180deg, #f3e5f5 0%, #fce4ec 100%)'
                  : `linear-gradient(180deg, ${primary.light} 0%, #fff 85%)`,
              pt: { xs: 3, md: 3.5 },
              pb: { xs: 2, md: 3 },
              px: { xs: 2, md: 4 },
              mb: { xs: 2, md: 3 },
              textAlign: { xs: 'center', md: 'left' },
              display: { md: 'flex' },
              flexDirection: { md: 'row' },
              alignItems: { md: 'center' },
              gap: { md: 3 },
            }}
          >
            <Box sx={{ flexShrink: 0, textAlign: { xs: 'center', md: 'left' } }}>
              {flow.levelExclusiveBadge && (
                <Typography
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.5,
                    py: 0.35,
                    borderRadius: 10,
                    bgcolor: '#7b1fa2',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    mb: 1.5,
                  }}
                >
                  <StarIcon sx={{ fontSize: '0.85rem !important' }} /> {flow.levelExclusiveBadge}
                </Typography>
              )}
              <Typography sx={{ fontSize: { xs: '2.75rem', md: '3.25rem' }, lineHeight: 1, mb: { xs: 1, md: 0 } }}>{heroIcon}</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: primary.dark,
                  mb: 0.5,
                  fontSize: { xs: '1.25rem', md: '1.75rem' },
                }}
              >
                {flow.examTitleShort}
              </Typography>
              <Typography sx={{ color: primary.main, fontSize: { xs: '0.88rem', md: '1rem' }, fontWeight: 500 }}>
                {examLabel} • {flow.heroSubtitle}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, minmax(0, 1fr))' },
              gap: { xs: 1.25, md: 1.5 },
              mb: { xs: 2.5, md: 3 },
            }}
          >
            {statGrid.map((cell) => (
              <Box
                key={cell.label}
                sx={{
                  bgcolor: '#fff',
                  borderRadius: 2,
                  p: { xs: 1.75, md: 2 },
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', mb: 0.5 }}>
                  {cell.label}
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>{cell.value}</Typography>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
              gap: { xs: 0, md: 3 },
              alignItems: 'start',
              mb: { xs: 2, md: 0 },
            }}
          >
            <Typography
              sx={{
                color: '#334155',
                fontSize: { xs: '0.9rem', md: '1rem' },
                lineHeight: 1.7,
                mb: { xs: 2.5, md: 0 },
              }}
            >
              {flow.bodyDescription}
            </Typography>

            <Box
              sx={{
                bgcolor: flow.theme === 'purple' ? '#f3e5f5' : '#ede7f6',
                borderRadius: 2,
                p: { xs: 2, md: 2.5 },
                mb: { xs: 2, md: 0 },
                height: 'fit-content',
              }}
            >
              <Typography sx={{ fontWeight: 800, color: flow.theme === 'purple' ? '#4a148c' : '#4527a0', mb: 1, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                {flow.measuresTitle}
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.2, color: '#37474f', fontSize: { xs: '0.88rem', md: '0.92rem' }, lineHeight: 1.7 }}>
                {flow.measuresBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              bgcolor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 2,
              p: { xs: 2, md: 3 },
              mb: 3,
              mt: { md: 3 },
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#b45309', mb: 1.25, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
              Before You Begin
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                columnGap: 3,
                rowGap: 0,
              }}
            >
              {previewBeforeBegin.map((row) => (
                <Box key={row.text} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', mb: 1.25 }}>
                  <PreviewBeforeBeginIcon k={row.icon} />
                  <Typography sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' }, color: '#78350f', lineHeight: 1.55, flex: 1 }}>{row.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: '#fff',
            borderTop: '1px solid #e2e8f0',
            py: { xs: 2, md: 2.25 },
            boxShadow: '0 -4px 24px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Box sx={{ maxWidth: contentMaxWidth, mx: 'auto', px: { xs: 2, md: 4, lg: 5 } }}>
            <Button
              fullWidth
              variant="contained"
              onClick={beginSample}
              sx={{
                py: { xs: 1.5, md: 1.65 },
                borderRadius: 2,
                fontWeight: 800,
                fontSize: { xs: '1rem', md: '1.05rem' },
                bgcolor: flow.theme === 'purple' ? '#7b1fa2' : primary.main,
                '&:hover': { bgcolor: flow.theme === 'purple' ? '#6a1b9a' : primary.dark },
                textTransform: 'none',
              }}
            >
              Begin assessment →
            </Button>
            <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', mt: 1.25, lineHeight: 1.5 }}>
              {previewQuestionCount} practice questions, 10-minute sample timer (not enforced). You can exit anytime - nothing is saved.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  if (phase === 'complete') {
    const s = score();
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            bgcolor: '#b45309',
            color: '#fff',
            px: 2,
            py: 1.25,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.8rem', sm: '0.9rem' }, letterSpacing: 0.3 }}>
            SAMPLE EXAM - Demonstration only. Not an official attempt; scores are for practice feedback only.
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, pt: `${SAMPLE_BANNER_PT}rem`, px: 2 }}>
          <CheckIcon sx={{ color: '#059669', fontSize: '4rem' }} />
          <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 800 }}>
            Sample complete
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', maxWidth: 420 }}>
            You answered {s} of {total} practice items correctly. The live Pattern and Logic exam uses adaptive difficulty,
            full timing rules, and proctoring where applicable.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(sampleExitTo)}
              sx={{ borderColor: '#cbd5e1', color: '#475569', fontWeight: 700 }}
            >
              {sampleAssessmentExitLabel(sampleExitTo)}
            </Button>
            <Button variant="contained" startIcon={<ReplayIcon />} onClick={reset} sx={{ bgcolor: primaryBtn, fontWeight: 700, '&:hover': { bgcolor: flow.theme === 'purple' ? '#6a1b9a' : '#1565c0' } }}>
              Try again
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          bgcolor: '#b45309',
          color: '#fff',
          px: 2,
          py: 1.25,
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.78rem', sm: '0.9rem' }, letterSpacing: 0.3, lineHeight: 1.35 }}>
          SAMPLE EXAM - Same look as Pattern and Logic; not scored or saved. You may exit anytime (top-left Exit).
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pt: `${SAMPLE_BANNER_PT}rem` }}>
        <Box
          sx={{
            bgcolor: headerBg,
            color: '#fff',
            px: { xs: 1.5, sm: 2.5 },
            py: 1.5,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr auto auto', sm: '1fr 1fr 1fr' },
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => setExitOpen(true)}
              sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', minWidth: 0, px: 0.5 }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Exit
              </Box>
            </Button>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.72rem', sm: '0.85rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Exam {flow.examOrdinal}: {examShortTitle}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: '1rem', opacity: 0.95 }} />
            <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontSize: '0.9rem' }}>
              {formatMmSs(secondsLeft)}
            </Typography>
            <Typography component="span" sx={{ fontWeight: 600, fontSize: '0.65rem', opacity: 0.85, display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>
              (10 min demo - not enforced)
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, textAlign: 'right', fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
            {questionNumber} / {total}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={Math.min(100, progressPercent)}
          sx={{
            height: 4,
            bgcolor: 'rgba(0,0,0,0.08)',
            '& .MuiLinearProgress-bar': { bgcolor: progressColor },
          }}
        />

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', py: { xs: 3, md: 5 }, px: { xs: 2, md: 4 } }}>
          <Box sx={{ width: '100%', maxWidth: 720 }}>
            {currentQuestion && (
              <ExamQuestionBody
                assessmentId={ASSESSMENT_ID}
                question={currentQuestion}
                questionNumber={questionNumber}
                totalQuestions={total}
                selectedOption={selectedOption}
                onSelectOption={setSelectedOption}
                theme={flow.theme}
              />
            )}
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 2, display: 'block', textAlign: 'center' }}>
              Keys 1 - 4 for options · Enter to continue
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            borderTop: '1px solid #e2e8f0',
            px: { xs: 2, md: 4 },
            py: 2,
            display: 'flex',
            gap: 1.5,
            justifyContent: 'space-between',
            bgcolor: '#f8fafc',
            maxWidth: 900,
            mx: 'auto',
            width: '100%',
          }}
        >
          <Tooltip title={adaptiveNoBack ? 'Previous is not available while the exam adapts to your answers.' : 'Not available'}>
            <span>
              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                disabled
                sx={{
                  bgcolor: '#e2e8f0',
                  color: '#475569',
                  fontWeight: 700,
                  boxShadow: 'none',
                  '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
                }}
              >
                Previous
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            disabled={selectedOption === null}
            onClick={handleNext}
            sx={{
              bgcolor: primaryBtn,
              color: '#fff',
              fontWeight: 800,
              px: 3,
              minWidth: 140,
              '&:hover': { bgcolor: flow.theme === 'purple' ? '#6a1b9a' : '#1565c0' },
              '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#64748b' },
            }}
          >
            {step + 1 >= total ? 'Finish' : 'Next'}
          </Button>
        </Box>
      </Box>

      <Dialog open={exitOpen} onClose={() => setExitOpen(false)} aria-labelledby="preview-exit-title">
        <DialogTitle id="preview-exit-title">Leave sample exam?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This is a demo only - nothing is saved. You can try the sample again anytime from the student or school preview.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExitOpen(false)} color="inherit">
            Stay
          </Button>
          <Button onClick={confirmExit} variant="contained" color="warning" sx={{ fontWeight: 700 }}>
            Exit sample
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SchoolPreviewAssessmentPage;
