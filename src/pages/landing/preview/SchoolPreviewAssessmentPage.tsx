import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Replay as ReplayIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import BlockIcon from '@mui/icons-material/Block';
import BoltIcon from '@mui/icons-material/Bolt';
import BarChartIcon from '@mui/icons-material/BarChart';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MicIcon from '@mui/icons-material/Mic';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import {
  DEFAULT_PREVIEW_SAMPLE_EXAM_ID,
  PREVIEW_SAMPLE_EXAM_IDS,
  PREVIEW_SAMPLE_LEVELS,
  getPreviewSampleAssessmentPath,
  getPreviewSampleQuestionCount,
  getPreviewSampleQuestions,
  isPreviewSampleExamId,
  type PreviewSampleExamId,
  type PreviewSampleLevel,
  type PreviewSampleQuestion,
} from '../../../data/previewSampleAssessments';
import {
  getAssessmentFlowDefinition,
  type BeforeBeginIconKey,
  type BeforeBeginItem,
} from '../../../config/assessmentFlowUI';
import { mergeStatGridWithTier } from '../../../components/assessment/mergeStatGridWithTier';
import { ExamQuestionBody, inferQuestionInteraction } from '../../../components/assessment/ExamQuestionBody';
import { ExamMathText } from '../../../components/assessment/ExamMathText';
import { EXAM_MATHJAX_CONFIG } from '../../../components/assessment/examMathJaxConfig';
import type { ExamQuestion } from '../../../db/assessmentCollection';

type SampleAssessmentLocationState = { sampleAssessmentExitTo?: string };

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
    case 'star':
      return <StarIcon sx={sx} />;
    case 'headphones':
      return <HeadphonesIcon sx={sx} />;
    case 'mic':
      return <MicIcon sx={sx} />;
    case 'seat':
      return <EventSeatIcon sx={sx} />;
    case 'help':
      return <HelpOutlineIcon sx={sx} />;
    default:
      return <AccessTimeIcon sx={sx} />;
  }
}
const SAMPLE_TIMER_START_SEC = 10 * 60;
const SAMPLE_BANNER_PT = 2.75; // rem, matches the fixed sample banner height

function formatMmSs(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ensureSentencePeriod(text: string): string {
  const t = text.trim();
  if (!t || /[.!?]$/.test(t)) return t;
  return `${t}.`;
}

function toInlineTex(text: string): string {
  const tex = text
    .replace(/\s+vs\s+/gi, ' \\; \\mathrm{vs} \\; ')
    .replace(/->/g, '\\to')
    .replace(/>=/g, '\\ge')
    .replace(/\*/g, '\\cdot');
  return `\\(${tex}\\)`;
}

function parseMathComparisonSolution(text: string): string[] | null {
  const match = text.match(
    /^Cross-multiply:\s+(.+?)\s+->\s+(.+?)\.\s+Difference:\s+(.+?)\.\s+For\s+n\s+>=\s+2,\s+\(n\s+-\s+1\)\^2\s+>\s+0,\s+so\s+A\s+>\s+B\.?$/i
  );
  if (!match) return null;

  return [
    `Cross-multiply to compare the two quantities:\n${toInlineTex(match[1])}`,
    `Expand both sides:\n${toInlineTex(match[2])}`,
    `Subtract the right side from the left:\n${toInlineTex(match[3])}`,
    `Since ${toInlineTex('n >= 2')}, ${toInlineTex('(n - 1)^2 > 0')}. So Quantity A is greater than Quantity B.`,
  ];
}

/** Turn bank `structured_solution` prose into learner-facing steps with sensible line breaks. */
function parseStructuredSolution(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const mathComparisonSteps = parseMathComparisonSolution(trimmed);
  if (mathComparisonSteps) return mathComparisonSteps;

  if (trimmed.includes('\n')) {
    return trimmed
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const stepParts = trimmed.split(/(?=Step\s+\d+:)/i).map((s) => s.trim()).filter(Boolean);
  if (stepParts.length > 1) return stepParts;

  const semiParts = trimmed.split(/;\s+/).map((s) => s.trim()).filter(Boolean);
  if (semiParts.length > 1) return semiParts.map(ensureSentencePeriod);

  const clauseBoundary =
    /[.!?]\s+(?=Odd positions|Even positions|Position \d|Constraint \d|Clue \d|According to|According |Therefore|Hence,|Hence |Next,|Applying |Evaluating |Transferring |Continuing |Following |Minimize|Smaller number|Larger number|Quantity [AB]:|Step \d|The rule|The sequence|In options|In option |At this |Post-|Try b=|Try the|For n|Cross-multiply|Acid mass|Blue token|Initial:|Removal of|First differences|Second differences|Loaves produced|Total pieces|Potatoes needed|Rice needed|Mangoes|Apples|Bananas)/i;

  const clauseParts = trimmed.split(clauseBoundary).map((s) => s.trim()).filter(Boolean);
  if (clauseParts.length > 1) return clauseParts.map(ensureSentencePeriod);

  const sentenceParts = trimmed.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  if (sentenceParts.length > 1) return sentenceParts;

  return [trimmed];
}

function getSampleSolutionSteps(q: PreviewSampleQuestion | null): string[] {
  if (!q || !q.stimulus || typeof q.stimulus !== 'object') return [];
  const stimulus = q.stimulus as {
    structured_solution?: unknown;
    solution_steps?: unknown;
    expected_answer?: unknown;
    evidence_spans?: unknown;
  };
  if (Array.isArray(stimulus.solution_steps) && stimulus.solution_steps.length > 0) {
    return stimulus.solution_steps
      .map((step) => String(step ?? '').trim())
      .filter(Boolean);
  }
  if (typeof stimulus.structured_solution === 'string' && stimulus.structured_solution.trim()) {
    return parseStructuredSolution(stimulus.structured_solution);
  }
  if (typeof stimulus.expected_answer === 'string' && stimulus.expected_answer.trim()) {
    return [`Answer: ${stimulus.expected_answer.trim()}`];
  }
  if (Array.isArray(stimulus.evidence_spans) && stimulus.evidence_spans.length > 0) {
    const firstEvidence = stimulus.evidence_spans.find(
      (span): span is { text: string } =>
        Boolean(span) &&
        typeof span === 'object' &&
        typeof (span as { text?: unknown }).text === 'string' &&
        Boolean((span as { text: string }).text.trim())
    );
    if (firstEvidence) return [`Evidence: ${firstEvidence.text.trim()}`];
  }
  const correctOption = q.options[q.correctIndex];
  if (typeof correctOption === 'string' && correctOption.trim()) {
    return [`Correct answer: ${correctOption.trim()}`];
  }
  return [];
}

function SolutionStepsList({ steps, renderMath }: { steps: string[]; renderMath: boolean }) {
  const list = (
    <Box
      component="ol"
      sx={{
        m: 0,
        pl: 2.5,
        mb: 0,
        '& li': { mb: 1.25, '&:last-child': { mb: 0 } },
      }}
    >
      {steps.map((line, i) => (
        <Typography
          component="li"
          key={i}
          sx={{
            fontSize: '0.9rem',
            lineHeight: 1.65,
            color: 'inherit',
            whiteSpace: 'pre-wrap',
          }}
        >
          {renderMath ? <ExamMathText>{line}</ExamMathText> : line}
        </Typography>
      ))}
    </Box>
  );

  return renderMath ? (
    <MathJaxContext version={3} config={EXAM_MATHJAX_CONFIG}>
      {list}
    </MathJaxContext>
  ) : (
    list
  );
}

type PreviewPhase = 'intro' | 'exam' | 'complete';

const DEFAULT_SAMPLE_EXIT = '/for-schools/preview';

function sampleAssessmentExitLabel(exitTo: string): string {
  if (exitTo === DEFAULT_SAMPLE_EXIT) return 'Back to preview hub';
  if (exitTo === '/students') return 'Back to students';
  if (exitTo.startsWith('/students/preview')) return 'Back to sample dashboard';
  return 'Back';
}

export default function SchoolPreviewAssessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { examId: examIdParam } = useParams<{ examId?: string }>();
  const routeExamId = examIdParam ?? '';
  const initialAssessmentId: PreviewSampleExamId = isPreviewSampleExamId(routeExamId)
    ? (routeExamId as PreviewSampleExamId)
    : DEFAULT_PREVIEW_SAMPLE_EXAM_ID;
  const sampleExitTo =
    (location.state as SampleAssessmentLocationState | null)?.sampleAssessmentExitTo ?? DEFAULT_SAMPLE_EXIT;
  const [selectedExamId, setSelectedExamId] = useState<PreviewSampleExamId>(initialAssessmentId);
  const [selectedLevel, setSelectedLevel] = useState<PreviewSampleLevel>(1);
  const flow = getAssessmentFlowDefinition(selectedExamId);
  const mathExam = selectedExamId === 'mathematical_reasoning';
  const sampleQuestions = useMemo(
    () => getPreviewSampleQuestions(selectedExamId, selectedLevel),
    [selectedExamId, selectedLevel]
  );
  const previewQuestionCount = sampleQuestions.length;
  const examChoices = useMemo(
    () =>
      PREVIEW_SAMPLE_EXAM_IDS.map((id) => ({
        id,
        flow: getAssessmentFlowDefinition(id),
      })),
    []
  );
  const levelChoices = useMemo(
    () =>
      PREVIEW_SAMPLE_LEVELS
        .map((level) => ({
          level,
          count: getPreviewSampleQuestionCount(selectedExamId, level),
        }))
        .filter(({ count }) => count > 0),
    [selectedExamId]
  );
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
        text: `This Level ${selectedLevel} sample has ${previewQuestionCount} practice questions and a 10-minute countdown (display only, not enforced). You can exit anytime; nothing is saved.`,
      },
      { icon: 'block', text: 'No calculators, notes, or outside help is allowed (same norms as the live exam). You can use pen and paper to scribble.' },
      { icon: 'chart', text: 'Scores here are for practice feedback only, not official benchmarking.' },
      { icon: 'phone', text: 'Find a quiet place with minimal distraction to get a feel for the real flow.' },
      { icon: 'bolt', text: 'The live exam adapts difficulty; this sample uses fixed practice items.' },
    ],
    [previewQuestionCount, selectedLevel]
  );
  const primary =
    flow.theme === 'purple'
      ? { main: '#7b1fa2', dark: '#4a148c', light: '#f3e5f5', border: '#ce93d8' }
      : { main: '#1565c0', dark: '#0d47a1', light: '#e3f2fd', border: '#90caf9' };
  const examLabel = `Exam ${flow.examOrdinal} of ${EXAM_TOTAL}`;
  const heroIcon = flow.theme === 'purple' ? '🧠' : flow.examOrdinal === 1 ? '🧩' : flow.examOrdinal === 3 ? '🧮' : '📋';
  const contentMaxWidth = { xs: 'min(100%, 520px)', md: 920, lg: 1040 } as const;

  const [phase, setPhase] = useState<PreviewPhase>('intro');
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SAMPLE_TIMER_START_SEC);

  const questions: ExamQuestion[] = useMemo(
    () =>
      sampleQuestions.map((q: PreviewSampleQuestion) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        stimulus: q.stimulus,
        stimulus_type: q.stimulus_type,
        correct_option_index: q.correctIndex,
      })),
    [sampleQuestions]
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
    setAnswerChecked(false);
  }, [step, currentQuestion, choices]);

  const score = useCallback(() => {
    let correct = 0;
    sampleQuestions.forEach((item) => {
      if (choices[item.id] === item.correctIndex) correct += 1;
    });
    return correct;
  }, [choices, sampleQuestions]);

  const handleNext = useCallback(() => {
    if (selectedOption === null || !currentQuestion) return;
    if (!answerChecked) {
      setAnswerChecked(true);
      return;
    }
    setChoices((c) => ({ ...c, [currentQuestion.id]: selectedOption }));
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      setPhase('complete');
    }
  }, [selectedOption, currentQuestion, answerChecked, step, total]);

  useEffect(() => {
    if (phase !== 'exam') return;
    const handleKey = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      if (answerChecked) {
        if (e.key === 'Enter' && selectedOption !== null) handleNext();
        return;
      }
      const mode = inferQuestionInteraction(selectedExamId, currentQuestion);
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
  }, [phase, handleNext, selectedOption, currentQuestion, selectedExamId, answerChecked]);

  const beginSample = () => {
    setSecondsLeft(SAMPLE_TIMER_START_SEC);
    setPhase('exam');
  };

  const reset = () => {
    setPhase('intro');
    setStep(0);
    setChoices({});
    setSelectedOption(null);
    setAnswerChecked(false);
    setSecondsLeft(SAMPLE_TIMER_START_SEC);
  };

  useEffect(() => {
    setSelectedExamId(initialAssessmentId);
    reset();
  }, [initialAssessmentId]);

  const selectExam = (examId: PreviewSampleExamId) => {
    setSelectedExamId(examId);
    const firstAvailableLevel =
      PREVIEW_SAMPLE_LEVELS.find((level) => getPreviewSampleQuestionCount(examId, level) > 0) ?? 1;
    setSelectedLevel(firstAvailableLevel);
    reset();
    navigate(getPreviewSampleAssessmentPath(examId), {
      replace: true,
      state: location.state,
    });
  };

  const selectLevel = (level: PreviewSampleLevel) => {
    setSelectedLevel(level);
    reset();
  };

  const confirmExit = () => {
    setExitOpen(false);
    navigate(sampleExitTo);
  };

  const headerBg = flow.theme === 'purple' ? '#6a1b9a' : '#0d47a1';
  const progressColor = '#ffc107';
  const primaryBtn = primary.main;
  const examShortTitle = flow.examTitleShort;
  const progressPercent =
    total > 0 ? ((step + (answerChecked ? 0.85 : selectedOption !== null ? 0.45 : 0)) / total) * 100 : 0;

  const goPreviewHub = () => navigate(sampleExitTo);

  const handleFooterBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      return;
    }
    setExitOpen(true);
  };

  const currentSampleQuestion = sampleQuestions[step] ?? null;
  const correctIdx = currentSampleQuestion?.correctIndex ?? null;
  const isCorrect =
    answerChecked && correctIdx !== null && selectedOption !== null ? selectedOption === correctIdx : null;
  const answerFeedback =
    answerChecked && correctIdx !== null && selectedOption !== null
      ? { correctIndex: correctIdx, selectedIndex: selectedOption }
      : null;
  const solutionSteps = getSampleSolutionSteps(currentSampleQuestion);

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
            Sample Assessments
          </Typography>
          <Tooltip title="Marketing home">
            <IconButton onClick={() => navigate('/')} aria-label="Home" size="small">
              <HomeIcon sx={{ color: primary.main }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ maxWidth: contentMaxWidth, mx: 'auto', px: { xs: 2, md: 4, lg: 5 }, pt: { xs: 3, md: 4 } }}>
        
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
              bgcolor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 3,
              p: { xs: 2, md: 3 },
              mb: { xs: 2.5, md: 3 },
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 0.75, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
              Choose Sample
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: { xs: '0.82rem', md: '0.9rem' }, mb: 2, lineHeight: 1.55 }}>
              Pick one of the first three exams, then choose the level you want to preview. The instructions below update to match your selection.
            </Typography>

            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', mb: 1 }}>
              Exam
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1, mb: 2.25 }}>
              {examChoices.map(({ id, flow: optionFlow }) => {
                const active = id === selectedExamId;
                return (
                  <Button
                    key={id}
                    variant={active ? 'contained' : 'outlined'}
                    onClick={() => selectExam(id)}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      py: 1.25,
                      px: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 800,
                      bgcolor: active ? primary.main : '#fff',
                      color: active ? '#fff' : '#334155',
                      borderColor: active ? primary.main : '#cbd5e1',
                      '&:hover': {
                        bgcolor: active ? primary.dark : '#f8fafc',
                        borderColor: active ? primary.dark : primary.main,
                      },
                    }}
                  >
                    Exam {optionFlow.examOrdinal}: {optionFlow.examTitleShort}
                  </Button>
                );
              })}
            </Box>

            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', letterSpacing: 0.6, textTransform: 'uppercase', mb: 1 }}>
              Level
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', md: 'repeat(3, 160px)' }, gap: 1 }}>
              {levelChoices.map(({ level, count }) => {
                const active = level === selectedLevel;
                return (
                  <Button
                    key={level}
                    variant={active ? 'contained' : 'outlined'}
                    onClick={() => selectLevel(level)}
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'center',
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 800,
                      bgcolor: active ? primary.main : '#fff',
                      color: active ? '#fff' : '#334155',
                      borderColor: active ? primary.main : '#cbd5e1',
                      '&:hover': {
                        bgcolor: active ? primary.dark : '#f8fafc',
                        borderColor: active ? primary.dark : primary.main,
                      },
                    }}
                  >
                    Level {level}
                    <Typography component="span" sx={{ fontSize: '0.68rem', fontWeight: 600, color: active ? 'rgba(255,255,255,0.78)' : '#94a3b8' }}>
                      {count} questions
                    </Typography>
                  </Button>
                );
              })}
            </Box>
          </Box>

          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            {flow.measuresBullets.length > 0 && (
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#94a3b8',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    mb: 1,
                  }}
                >
                  {flow.measuresTitle}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {flow.measuresBullets.map((bullet) => (
                    <Chip
                      key={bullet}
                      label={bullet}
                      size="small"
                      sx={{
                        height: 'auto',
                        py: 0.65,
                        px: 0.25,
                        fontSize: { xs: '0.78rem', md: '0.82rem' },
                        fontWeight: 600,
                        lineHeight: 1.35,
                        bgcolor: flow.theme === 'purple' ? '#f3e5f5' : primary.light,
                        color: flow.theme === 'purple' ? '#4a148c' : primary.dark,
                        border: `1px solid ${flow.theme === 'purple' ? '#ce93d8' : primary.border}`,
                        '& .MuiChip-label': {
                          whiteSpace: 'normal',
                          px: 1,
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Typography
              sx={{
                color: '#334155',
                fontSize: { xs: '0.9rem', md: '1rem' },
                lineHeight: 1.7,
                mt: flow.measuresBullets.length > 0 ? 1.5 : 0,
              }}
            >
              {flow.bodyDescription}
            </Typography>
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
              disabled={previewQuestionCount === 0}
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
              Begin {flow.examTitleShort} Level {selectedLevel} →
            </Button>
          
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
            You answered {s} of {total} practice items correctly. The live {flow.examTitleShort} exam uses adaptive difficulty,
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
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{ borderColor: '#cbd5e1', color: '#475569', fontWeight: 700 }}
            >
              Home
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
          bgcolor: '#b45309',
          color: '#fff',
          px: 2,
          py: { xs: 0.7, sm: 0.85 },
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: '0.76rem', sm: '0.88rem' },
            letterSpacing: 0.3,
            lineHeight: 1.35,
          }}
        >
          SAMPLE ASSESSMENT
        </Typography>
      </Box>
      <Box
        sx={{
          bgcolor: headerBg,
          color: '#fff',
          px: { xs: 1.25, sm: 2 },
          py: { xs: 0.75, sm: 0.875 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 2 },
          minHeight: 0,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15, minWidth: 0, flex: '1 1 auto' }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.72rem', sm: '0.82rem' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.25,
            }}
          >
            Sample Practice · Exam {flow.examOrdinal}: {examShortTitle}
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', opacity: 0.88, fontWeight: 600, lineHeight: 1.2 }}>
            Level {selectedLevel}
            <Box component="span" sx={{ opacity: 0.75, mx: 0.75 }}>
              ·
            </Box>
            Demo only, not saved
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.25, sm: 2 },
            flexShrink: 0,
          }}
        >
          <Box
            aria-live="polite"
            aria-atomic="true"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.45,
              fontWeight: 700,
              fontSize: { xs: '0.78rem', sm: '0.82rem' },
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <AccessTimeIcon sx={{ fontSize: { xs: 17, sm: 18 }, opacity: 0.95 }} aria-hidden />
            <Typography component="span" sx={{ opacity: 0.82, fontWeight: 600, fontSize: '0.62rem', display: { xs: 'none', sm: 'inline' } }}>
              Sample timer
            </Typography>
            <Typography component="span">{formatMmSs(secondsLeft)}</Typography>
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.78rem', sm: '0.82rem' },
              fontVariantNumeric: 'tabular-nums',
              opacity: 0.95,
            }}
          >
            {questionNumber} / {total}
          </Typography>
        </Box>
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
          {currentQuestion &&
            (mathExam ? (
              <MathJaxContext version={3} config={EXAM_MATHJAX_CONFIG}>
                <ExamQuestionBody
                  assessmentId={selectedExamId}
                  question={currentQuestion}
                  questionNumber={questionNumber}
                  totalQuestions={total}
                  selectedOption={selectedOption}
                  onSelectOption={setSelectedOption}
                  theme={flow.theme}
                  renderMath
                  selectionLocked={answerChecked}
                  answerFeedback={answerFeedback}
                />
              </MathJaxContext>
            ) : (
              <ExamQuestionBody
                assessmentId={selectedExamId}
                question={currentQuestion}
                questionNumber={questionNumber}
                totalQuestions={total}
                selectedOption={selectedOption}
                onSelectOption={setSelectedOption}
                theme={flow.theme}
                selectionLocked={answerChecked}
                answerFeedback={answerFeedback}
              />
            ))}
          {answerChecked && (
            <Alert
              severity={isCorrect === true ? 'success' : isCorrect === false ? 'error' : 'info'}
              sx={{
                mt: 2.5,
                borderRadius: 2,
                ...(isCorrect === true && {
                  bgcolor: 'rgba(5, 150, 105, 0.1)',
                  color: '#065f46',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  '& .MuiAlert-icon': { color: '#059669' },
                }),
                ...(isCorrect === false && {
                  bgcolor: 'rgba(220, 38, 38, 0.06)',
                  color: '#7f1d1d',
                  border: '1px solid rgba(248, 113, 113, 0.45)',
                  '& .MuiAlert-icon': { color: '#dc2626' },
                }),
              }}
            >
              <Typography sx={{ fontWeight: 800, mb: solutionSteps.length > 0 ? 1 : 0 }}>
                {isCorrect === true ? 'Correct!' : isCorrect === false ? 'Not quite.' : 'Answer recorded.'}
              </Typography>
              {solutionSteps.length > 0 ? (
                <SolutionStepsList steps={solutionSteps} renderMath={mathExam} />
              ) : null}
            </Alert>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          borderTop: '1px solid #e2e8f0',
          px: { xs: 2, md: 4 },
          py: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 1.5, md: 2 },
          justifyContent: 'space-between',
          bgcolor: '#f8fafc',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Button
          variant="outlined"
          onClick={() => setExitOpen(true)}
          sx={{
            borderColor: '#cbd5e1',
            color: '#475569',
            fontWeight: 700,
            textTransform: 'none',
            px: 2,
            alignSelf: { xs: 'stretch', md: 'auto' },
            '&:hover': { borderColor: '#94a3b8', bgcolor: 'rgba(148,163,184,0.08)' },
          }}
        >
          Exit sample
        </Button>
        <Typography
          variant="caption"
          sx={{
            color: '#94a3b8',
            textAlign: 'center',
            flex: { md: 1 },
            minWidth: 0,
            lineHeight: 1.45,
            px: { xs: 0, md: 1 },
          }}
        >
          Sample practice only. Pick an option or use keys 1-4, press Check answer or Enter, then Next or Finish.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            flexWrap: 'wrap',
            justifyContent: { xs: 'stretch', md: 'flex-end' },
            alignSelf: { xs: 'stretch', md: 'auto' },
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleFooterBack}
            sx={{
              borderWidth: 2,
              borderColor: '#64748b',
              color: '#0f172a',
              bgcolor: '#fff',
              fontWeight: 700,
              boxShadow: 'none',
              flex: { xs: '1 1 auto', md: '0 0 auto' },
              '&:hover': {
                borderColor: primaryBtn,
                color: primaryBtn,
                bgcolor: flow.theme === 'purple' ? 'rgba(123, 31, 162, 0.06)' : 'rgba(13, 71, 161, 0.06)',
              },
            }}
          >
            Back
          </Button>
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
            {!answerChecked ? 'Check answer' : step + 1 >= total ? 'Finish' : 'Next'}
          </Button>
        </Box>
      </Box>

      <Dialog
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        aria-labelledby="preview-exit-title"
        PaperProps={{
          sx: {
            bgcolor: '#fff',
            color: '#0f172a',
            maxWidth: 420,
            width: 'calc(100% - 40px)',
            opacity: 1,
            p: 0,
          },
        }}
      >
        <DialogTitle id="preview-exit-title" sx={{ px: 3, pt: 2.5, pb: 1, fontWeight: 800 }}>
          Leave sample exam?
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 0, pb: 1 }}>
          <DialogContentText sx={{ color: '#334155', m: 0, typography: 'body2', lineHeight: 1.5 }}>
            This is a demo only - nothing is saved. You can try the sample again anytime from the student or school preview.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pt: 0.5, pb: 2 }}>
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
}
