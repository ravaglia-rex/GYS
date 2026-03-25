import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Mic as MicIcon,
  LaptopMac as LaptopMacIcon,
  PlayArrow as PlayArrowIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { auth } from '../../firebase/firebase';
import {
  initializeExam,
  recordAnswer,
  completeExam,
  getAssessmentConfig,
  ExamQuestion,
  AssessmentType,
} from '../../db/assessmentCollection';
import { getAssessmentFlowDefinition } from '../../config/assessmentFlowUI';
import { inferQuestionInteraction } from '../../components/assessment/ExamQuestionBody';
import { ExamQuestionBody } from '../../components/assessment/ExamQuestionBody';
import * as Sentry from '@sentry/react';

const NEEDS_MIC = new Set(['english_proficiency']);
const NEEDS_LAPTOP = new Set(['ai_literacy']);

type PageStage = 'pre_exam' | 'taking' | 'complete';

function formatMmSs(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PreExamStepProps {
  assessmentId: string;
  tierNumber: number;
  onConfirm: () => void;
  onBack: () => void;
}

const PreExamStep: React.FC<PreExamStepProps> = ({ assessmentId, tierNumber, onConfirm, onBack }) => {
  const needsMic = NEEDS_MIC.has(assessmentId);
  const needsLaptop = NEEDS_LAPTOP.has(assessmentId);
  const flow = getAssessmentFlowDefinition(assessmentId);
  const [micOk, setMicOk] = useState(false);
  const [micErr, setMicErr] = useState<string | null>(null);
  const [audioPlayed, setAudioPlayed] = useState(false);

  const testMic = async () => {
    setMicErr(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      setMicOk(true);
    } catch {
      setMicErr('Microphone access was denied or unavailable.');
      setMicOk(false);
    }
  };

  const playTestTone = () => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 440;
      g.gain.value = 0.08;
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
        setAudioPlayed(true);
      }, 200);
    } catch {
      setAudioPlayed(true);
    }
  };

  const primary = flow.theme === 'purple' ? '#7b1fa2' : '#0d47a1';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Box sx={{ maxWidth: 480, width: '100%' }}>
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0', p: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <PlayArrowIcon sx={{ color: primary, fontSize: '1.5rem' }} />
            <Box>
              <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800, fontSize: '1.05rem' }}>
                {flow.examTitleShort}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Tier {tierNumber}
              </Typography>
            </Box>
          </Box>

          {needsMic && (
            <Alert severity="warning" sx={{ mb: 2 }} icon={<MicIcon />}>
              <Typography variant="body2" fontWeight={700} gutterBottom>
                Microphone & audio
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
                This exam includes listening and speaking. Use a laptop or desktop when possible, allow microphone permission, and use headphones for listening sections.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                <Button size="small" variant="outlined" onClick={testMic}>
                  Test microphone
                </Button>
                <Button size="small" variant="outlined" startIcon={<VolumeUpIcon />} onClick={playTestTone}>
                  Test speakers
                </Button>
              </Box>
              {micOk && <Typography sx={{ mt: 1, fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>Microphone OK</Typography>}
              {micErr && <Typography sx={{ mt: 1, fontSize: '0.8rem', color: '#dc2626' }}>{micErr}</Typography>}
              {audioPlayed && <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: '#64748b' }}>If you heard a brief tone, audio output is working.</Typography>}
            </Alert>
          )}

          {needsLaptop && (
            <Alert severity="info" sx={{ mb: 2 }} icon={<LaptopMacIcon />}>
              <Typography variant="body2" fontWeight={700} gutterBottom>
                Laptop or desktop recommended
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
                The live AI task works best on a larger screen. Mobile is supported but may be limited.
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ borderColor: '#cbd5e1', color: '#475569' }}>
              Back
            </Button>
            <Button
              fullWidth
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={onConfirm}
              disabled={needsMic && !micOk}
              sx={{ bgcolor: primary, fontWeight: 800, '&:hover': { bgcolor: flow.theme === 'purple' ? '#6a1b9a' : '#1565c0' } }}
            >
              Start assessment
            </Button>
          </Box>
          {needsMic && !micOk && (
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', mt: 1 }}>
              Run the microphone test before starting.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const AssessmentTakePage: React.FC = () => {
  const { assessmentId, tierNumber } = useParams<{ assessmentId: string; tierNumber: string }>();
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid ?? '';

  const tier = parseInt(tierNumber ?? '1', 10);
  const needsPreExamStep = assessmentId ? NEEDS_MIC.has(assessmentId) || NEEDS_LAPTOP.has(assessmentId) : false;

  const [stage, setStage] = useState<PageStage>(needsPreExamStep ? 'pre_exam' : 'taking');
  const [configTypes, setConfigTypes] = useState<AssessmentType[]>([]);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ExamQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  const flow = assessmentId ? getAssessmentFlowDefinition(assessmentId) : getAssessmentFlowDefinition('');
  const assessmentConfig = configTypes.find((a) => a.id === assessmentId);
  const adaptiveNoBack = flow.adaptiveForwardOnly || !!assessmentConfig?.is_adaptive;

  useEffect(() => {
    getAssessmentConfig()
      .then(setConfigTypes)
      .catch(() => {});
  }, []);

  const doInitialize = useCallback(async () => {
    if (!uid || !assessmentId) return;
    setIsInitializing(true);

    try {
      const result = await initializeExam(uid, assessmentId, tier);
      setAttemptId(result.attempt_id);
      setCurrentQuestion(result.question);
      setCurrentIndex(result.current_index);
      setTotalQuestions(result.total_questions);
      questionStartTimeRef.current = Date.now();
    } catch (err: any) {
      Sentry.captureException(err);
      const status = err?.response?.status;
      if (status === 403) {
        setError(err?.response?.data?.error ?? 'This assessment is not available for your membership level.');
      } else if (status === 503) {
        setError('Not enough questions available for this tier. Please try again later.');
      } else {
        setError('Failed to start assessment. Please go back and try again.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [uid, assessmentId, tier]);

  useEffect(() => {
    if (!attemptId) return;
    if (!flow.useTimer) {
      setSecondsLeft(null);
      return;
    }
    const ac = configTypes.find((a) => a.id === assessmentId);
    if (!ac) return;
    const tc = ac.tiers.find((t) => t.tier_number === tier);
    const lim = tc?.time_limit_minutes;
    if (lim != null && lim > 0) setSecondsLeft(lim * 60);
    else setSecondsLeft(null);
  }, [attemptId, assessmentId, tier, configTypes, flow.useTimer]);

  useEffect(() => {
    if (!needsPreExamStep && stage === 'taking' && !attemptId && uid && assessmentId) {
      doInitialize();
    }
  }, [needsPreExamStep, stage, attemptId, uid, assessmentId, doInitialize]);

  useEffect(() => {
    if (secondsLeft === null || stage !== 'taking') return;
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s === null ? s : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft, stage]);

  const handlePreExamConfirm = useCallback(() => {
    setStage('taking');
    doInitialize();
  }, [doInitialize]);

  const handleNext = useCallback(async () => {
    if (selectedOption === null || !attemptId || !currentQuestion) return;

    const timeSpentMs = Date.now() - questionStartTimeRef.current;
    setIsSubmitting(true);

    try {
      const response = await recordAnswer(uid, attemptId, currentQuestion.id, selectedOption, timeSpentMs);

      if (response.done) {
        const result = await completeExam(uid, attemptId);
        setStage('complete');
        navigate(`/assessments/${assessmentId}/result`, {
          state: {
            attemptId,
            assessmentId,
            tierNumber: tier,
            scorePercent: result.score_percent,
            correct: result.correct,
            total: result.total,
            passed: result.passed,
            nextTier: result.next_tier,
            completedAt: new Date().toISOString(),
          },
          replace: true,
        });
        return;
      }

      setSelectedOption(null);
      setCurrentQuestion(response.next_question);
      setCurrentIndex(response.current_index ?? currentIndex + 1);
      questionStartTimeRef.current = Date.now();
    } catch (err) {
      Sentry.captureException(err);
      setError('Failed to submit answer. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOption, attemptId, currentQuestion, uid, assessmentId, tier, currentIndex, navigate]);

  useEffect(() => {
    if (stage !== 'taking') return;
    const handleKey = (e: KeyboardEvent) => {
      if (isSubmitting || isInitializing || !currentQuestion || !assessmentId) return;
      const mode = inferQuestionInteraction(assessmentId, currentQuestion);
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
  }, [stage, handleNext, isSubmitting, isInitializing, selectedOption, currentQuestion, assessmentId]);

  const examShortTitle = flow.examTitleShort;
  const headerBg = flow.theme === 'purple' ? '#6a1b9a' : '#0d47a1';
  const progressColor = '#ffc107';
  const primaryBtn = flow.theme === 'purple' ? '#7b1fa2' : '#0d47a1';

  if (!assessmentId) {
    navigate('/assessments');
    return null;
  }

  if (stage === 'pre_exam') {
    return (
      <PreExamStep
        assessmentId={assessmentId}
        tierNumber={tier}
        onConfirm={handlePreExamConfirm}
        onBack={() => navigate(`/assessments/${assessmentId}/tier/${tier}/detail`)}
      />
    );
  }

  if (isInitializing) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress sx={{ color: primaryBtn }} size={48} />
        <Typography variant="h6" sx={{ color: '#334155', fontWeight: 700 }}>
          Preparing your assessment…
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Selecting questions from the item bank
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 500, width: '100%' }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/assessments/${assessmentId}/tier/${tier}/detail`)} sx={{ color: '#475569' }}>
          Back
        </Button>
      </Box>
    );
  }

  if (stage === 'complete') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CheckCircleIcon sx={{ color: '#059669', fontSize: '4rem' }} />
        <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 800 }}>
          Submitted
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Taking you to results…
        </Typography>
        <CircularProgress size={28} sx={{ color: primaryBtn }} />
      </Box>
    );
  }

  const progressPercent = totalQuestions > 0 ? ((currentIndex + (selectedOption !== null ? 0.5 : 0)) / totalQuestions) * 100 : 0;
  const questionNumber = currentIndex + 1;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
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
            onClick={() => navigate(`/assessments/${assessmentId}/tier/${tier}/detail`)}
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
          {flow.useTimer && secondsLeft !== null ? (
            <>
              <AccessTimeIcon sx={{ fontSize: '1rem', opacity: 0.95 }} />
              <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontSize: '0.9rem' }}>
                {formatMmSs(secondsLeft)}
              </Typography>
            </>
          ) : (
            <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', opacity: 0.95 }}>No time limit</Typography>
          )}
        </Box>
        <Typography sx={{ fontWeight: 700, textAlign: 'right', fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
          {questionNumber} / {totalQuestions}
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

      {secondsLeft === 0 && flow.useTimer && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          Time is up — submit your answer and finish remaining questions promptly.
        </Alert>
      )}

      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', py: { xs: 3, md: 5 }, px: { xs: 2, md: 4 } }}>
        <Box sx={{ width: '100%', maxWidth: 720 }}>
          <ExamQuestionBody
            assessmentId={assessmentId}
            question={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            theme={flow.theme}
          />
          <Typography variant="caption" sx={{ color: '#94a3b8', mt: 2, display: 'block', textAlign: 'center' }}>
            {inferQuestionInteraction(assessmentId, currentQuestion) === 'likert'
              ? 'Keys 1–5 to select · Enter to continue'
              : 'Keys 1–4 for options · Enter to continue'}
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
        <Tooltip title={adaptiveNoBack ? 'Previous is not available while the exam adapts to your answers.' : 'Not available in this build'}>
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
          endIcon={isSubmitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <ArrowForwardIcon />}
          disabled={selectedOption === null || isSubmitting}
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
          {currentIndex + 1 >= totalQuestions ? 'Submit' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default AssessmentTakePage;
