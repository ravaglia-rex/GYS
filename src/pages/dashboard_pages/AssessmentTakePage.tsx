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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  abandonExam,
  getAssessmentConfig,
  ExamQuestion,
  AssessmentType,
} from '../../db/assessmentCollection';
import { MathJaxContext } from 'better-react-mathjax';
import { getAssessmentFlowDefinition } from '../../config/assessmentFlowUI';
import { EXAM_MATHJAX_CONFIG } from '../../components/assessment/examMathJaxConfig';
import { ExamQuestionBody, inferQuestionInteraction } from '../../components/assessment/ExamQuestionBody';
import { useExamIntegrity } from '../../hooks/useExamIntegrity';
import * as Sentry from '@sentry/react';

const NEEDS_MIC = new Set(['english_proficiency']);
const NEEDS_LAPTOP = new Set(['ai_literacy']);

const EXAM_BEFORE_UNLOAD_HINT =
  'Leaving or refreshing will end this exam attempt. You cannot continue until you start again (timer resets). Repeated interruptions may suspend your account.';

const EXAM_LEAVE_DIALOG_COPY =
  'If you leave or refresh now, this exam attempt will be terminated. You will not be able to resume; you may start again only when you begin a new attempt (your timer resets). Each time you leave, go back, or refresh this way, it counts toward a limit. After 3 such events, your account will be temporarily suspended from starting new assessments.';

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
                Level {tierNumber}
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

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={700} gutterBottom>
              Exam integrity
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.82rem', lineHeight: 1.55 }}>
              Copy, cut, and paste are disabled during the exam. Leaving this tab in the background for too long will end your attempt. Fullscreen is recommended; screenshots may violate assessment policy.
            </Typography>
          </Alert>

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

export default function AssessmentTakePage() {
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
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [showOfflineBar, setShowOfflineBar] = useState(false);
  const [integrityGateOk, setIntegrityGateOk] = useState(needsPreExamStep);
  const [screenshotNudge, setScreenshotNudge] = useState(false);
  const questionStartTimeRef = useRef<number>(Date.now());

  const flow = assessmentId ? getAssessmentFlowDefinition(assessmentId) : getAssessmentFlowDefinition('');
  const assessmentConfig = configTypes.find((a) => a.id === assessmentId);
  const adaptiveNoBack = flow.adaptiveForwardOnly || !!assessmentConfig?.is_adaptive;
  const mathExam = assessmentId === 'mathematical_reasoning';

  const endAttemptForIntegrity = useCallback(
    async (message: string) => {
      if (!attemptId || !uid) return;
      try {
        const res = await abandonExam(uid, attemptId, 'extended_background');
        if (res.suspended && res.suspended_until_ms) {
          window.alert(
            `Your account is temporarily suspended from starting new assessments until ${new Date(res.suspended_until_ms).toLocaleString()}.`
          );
        } else {
          window.alert(message);
        }
      } catch (e) {
        Sentry.captureException(e);
        window.alert(message);
      }
      navigate(`/assessments/${assessmentId}/tier/${tier}/detail`, { replace: true });
    },
    [attemptId, uid, assessmentId, tier, navigate]
  );

  const { leftFullscreen, tryEnterFullscreen, dismissFullscreenWarning } = useExamIntegrity({
    active: Boolean(attemptId && stage === 'taking'),
    onBackgroundTooLong: () =>
      endAttemptForIntegrity('This attempt ended because the exam stayed in the background too long.'),
    onPrintScreen: () => setScreenshotNudge(true),
  });

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
      if (result.seconds_remaining != null) {
        setSecondsLeft(result.seconds_remaining);
      } else {
        setSecondsLeft(null);
      }
    } catch (err: any) {
      Sentry.captureException(err);
      const status = err?.response?.status;
      if (status === 403) {
        const code = err?.response?.data?.code;
        const untilMs = err?.response?.data?.suspended_until_ms;
        if (code === 'exam_suspended' && typeof untilMs === 'number') {
          setError(
            `${err?.response?.data?.error ?? 'Assessments are temporarily suspended.'} Suspension ends: ${new Date(untilMs).toLocaleString()}.`
          );
        } else {
          setError(err?.response?.data?.error ?? 'This assessment is not available for your membership level.');
        }
      } else if (status === 503) {
        setError('Not enough questions available for this level. Please try again later.');
      } else if (status === 409) {
        setError(err?.response?.data?.error ?? 'Could not resume your attempt. Please go back and try again.');
      } else {
        setError('Failed to start assessment. Please go back and try again.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [uid, assessmentId, tier]);

  const mayStartExam = needsPreExamStep ? stage === 'taking' : integrityGateOk && stage === 'taking';

  useEffect(() => {
    if (!mayStartExam || !uid || !assessmentId || attemptId || isInitializing) return;
    void doInitialize();
  }, [mayStartExam, uid, assessmentId, attemptId, isInitializing, doInitialize]);

  useEffect(() => {
    if (secondsLeft === null || stage !== 'taking') return;
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s === null ? s : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft, stage]);

  // Trap browser Back: without an extra same-URL history entry, one Back leaves /take, this page
  // unmounts, and popstate never shows our dialog. Push a sentinel so the first Back stays on /take.
  useEffect(() => {
    if (stage !== 'taking' || !attemptId || !assessmentId || !tierNumber) return;
    const examPath = `/assessments/${assessmentId}/tier/${tierNumber}/take`;
    window.history.pushState({ argusExamTakeTrap: true }, '', examPath);

    const onPopState = () => {
      window.history.pushState({ argusExamTakeTrap: true }, '', examPath);
      setLeaveDialogOpen(true);
      queueMicrotask(() => {
        navigate(examPath, { replace: true });
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [stage, attemptId, assessmentId, tierNumber, navigate]);

  useEffect(() => {
    if (stage !== 'taking' || !attemptId) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = EXAM_BEFORE_UNLOAD_HINT;
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [stage, attemptId]);

  // Keyboard refresh (F5, Ctrl/Cmd+R, hard reload) → same leave dialog. Toolbar refresh only hits beforeunload (browser-native prompt).
  useEffect(() => {
    if (stage !== 'taking' || !attemptId) return;
    const isReloadChord = (e: KeyboardEvent) => {
      if (e.code === 'F5') return true;
      if (e.code === 'KeyR' && (e.ctrlKey || e.metaKey)) return true;
      return false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isReloadChord(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveDialogOpen(true);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [stage, attemptId]);

  useEffect(() => {
    if (stage !== 'taking' || !attemptId) return;
    const onOffline = () => setShowOfflineBar(true);
    const onOnline = () => setShowOfflineBar(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    if (!navigator.onLine) setShowOfflineBar(true);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [stage, attemptId]);

  const confirmLeaveExam = useCallback(async () => {
    if (!attemptId || !uid) {
      setLeaveDialogOpen(false);
      return;
    }
    setAbandoning(true);
    try {
      const res = await abandonExam(uid, attemptId, 'user_confirmed_exit');
      setLeaveDialogOpen(false);
      if (res.suspended && res.suspended_until_ms) {
        window.alert(
          `Your account is temporarily suspended from starting new assessments until ${new Date(res.suspended_until_ms).toLocaleString()}.`
        );
      }
      navigate(`/assessments/${assessmentId}/tier/${tier}/detail`, { replace: true });
    } catch (e) {
      Sentry.captureException(e);
      setLeaveDialogOpen(false);
      navigate(`/assessments/${assessmentId}/tier/${tier}/detail`, { replace: true });
    } finally {
      setAbandoning(false);
    }
  }, [attemptId, uid, assessmentId, tier, navigate]);

  const handlePreExamConfirm = useCallback(() => {
    void document.documentElement.requestFullscreen?.().catch(() => {});
    setStage('taking');
  }, []);

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

  if (stage === 'taking' && !needsPreExamStep && !integrityGateOk && !attemptId) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Dialog open maxWidth="sm" fullWidth disableEscapeKeyDown>
          <DialogTitle sx={{ fontWeight: 800 }}>Exam integrity</DialogTitle>
          <DialogContent>
            <DialogContentText component="div" sx={{ color: 'text.primary', typography: 'body2', lineHeight: 1.65 }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                This exam uses standard integrity measures: copy, cut, and paste are disabled; context menus are limited; and staying away from this tab for too long will end your attempt.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                Fullscreen is recommended (your browser may ask for permission). Screenshots and sharing content may violate assessment rules.
              </Typography>
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => navigate(`/assessments/${assessmentId}/tier/${tier}/detail`)} color="inherit">
              Back
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                void document.documentElement.requestFullscreen?.().catch(() => {});
                setIntegrityGateOk(true);
              }}
            >
              I understand - begin
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  if (isInitializing) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress sx={{ color: primaryBtn }} size={48} />
        <Typography variant="h6" sx={{ color: '#334155', fontWeight: 700 }}>
          Preparing your assessment…
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

  const questionBodyEl = (
    <ExamQuestionBody
      assessmentId={assessmentId}
      question={currentQuestion}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      selectedOption={selectedOption}
      onSelectOption={setSelectedOption}
      theme={flow.theme}
      renderMath={mathExam}
    />
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          bgcolor: headerBg,
          color: '#fff',
          px: { xs: 1.5, sm: 2.5 },
          py: 1.5,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr auto', sm: '1fr auto auto' },
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
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

      {showOfflineBar && (
        <Alert severity="warning" sx={{ borderRadius: 0 }} onClose={() => setShowOfflineBar(false)}>
          You appear to be offline. If you leave or refresh, this exam attempt may end and cannot be resumed (timer resets). Repeated interruptions can lead to a temporary account suspension.
        </Alert>
      )}

      {secondsLeft === 0 && flow.useTimer && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          Time is up - submit your answer and finish remaining questions promptly.
        </Alert>
      )}

      {leftFullscreen && (
        <Alert
          severity="warning"
          sx={{ borderRadius: 0 }}
          onClose={dismissFullscreenWarning}
          action={
            <Button color="inherit" size="small" onClick={tryEnterFullscreen}>
              Enter Fullscreen
            </Button>
          }
        >
          Fullscreen was exited. Re-enter for the best secure exam experience (optional on some devices).
        </Alert>
      )}

      {screenshotNudge && (
        <Alert severity="warning" sx={{ borderRadius: 0 }} onClose={() => setScreenshotNudge(false)}>
          Screenshots and sharing items may violate assessment integrity. Please keep the exam to yourself.
        </Alert>
      )}

      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', py: { xs: 3, md: 5 }, px: { xs: 2, md: 4 } }}>
        <Box sx={{ width: '100%', maxWidth: 720 }}>
          {mathExam ? (
            <MathJaxContext version={3} config={EXAM_MATHJAX_CONFIG}>
              {questionBodyEl}
            </MathJaxContext>
          ) : (
            questionBodyEl
          )}
          <Typography variant="caption" sx={{ color: '#94a3b8', mt: 2, display: 'block', textAlign: 'center' }}>
            {inferQuestionInteraction(assessmentId, currentQuestion) === 'likert'
              ? 'Keys 1 - 5 to select • Enter to continue'
              : 'Keys 1 - 4 for options • Enter to continue'}
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

      <Dialog
        open={leaveDialogOpen}
        onClose={() => !abandoning && setLeaveDialogOpen(false)}
        disableEscapeKeyDown={abandoning}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#1e293b',
              backgroundImage: 'none',
              color: '#f8fafc',
              maxWidth: 520,
              width: '100%',
              opacity: 1,
              p: 0,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            },
          },
        }}
      >
        <DialogTitle sx={{ px: { xs: 2.5, sm: 3.5 }, pt: { xs: 3, sm: 3.5 }, pb: 2, fontWeight: 800, fontSize: '1.2rem' }}>
          Leave this exam?
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 0, pb: 2 }}>
          <DialogContentText
            component="div"
            sx={{
              m: 0,
              color: 'rgba(248, 250, 252, 0.98)',
              typography: 'body2',
              lineHeight: 1.65,
            }}
          >
            {EXAM_LEAVE_DIALOG_COPY}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, pb: { xs: 3, sm: 3.5 }, pt: 0, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setLeaveDialogOpen(false)} disabled={abandoning} sx={{ color: '#f8fafc' }}>
            Stay in exam
          </Button>
          <Button onClick={confirmLeaveExam} disabled={abandoning} color="error" variant="contained">
            {abandoning ? 'Ending…' : 'End attempt & leave'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
