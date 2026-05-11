import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Typography,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import axios from 'axios';
import * as Sentry from '@sentry/react';
import { MathJaxContext } from 'better-react-mathjax';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import {
  fetchPracticeQuestions,
  PRACTICE_SESSION_BATCH_SIZE,
  recordPracticeSessionOutcomes,
} from '../../db/practiceBank';
import type { ExamQuestion } from '../../db/assessmentCollection';
import { ExamQuestionBody, inferQuestionInteraction } from '../../components/assessment/ExamQuestionBody';
import { getAssessmentFlowDefinition } from '../../config/assessmentFlowUI';
import { EXAM_MATHJAX_CONFIG } from '../../components/assessment/examMathJaxConfig';
import {
  clearActivePracticeSession,
  clearPracticeTakeSession,
  loadPracticeTakeSession,
  recordPracticeQuestionsCompleted,
  resolvePracticeItemId,
  savePracticeTakeSession,
  type PracticeTakePendingOutcome,
} from '../../components/practice/practiceModeConfig';

const INTERACTIVE_PRACTICE_EXAMS = new Set(['symbolic_reasoning']);

function parsePracticeLevel(raw: string | undefined): 1 | 2 | 3 | null {
  const n = parseInt(raw ?? '', 10);
  if (n === 1 || n === 2 || n === 3) return n;
  return null;
}

/** MM:SS for question timer (hours omitted unless needed). */
function formatQuestionElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Full-page practice session — same chrome as {@link AssessmentTakePage} “taking” stage,
 * without fullscreen, integrity hooks, or exam timer.
 */
export default function PracticeTakePage() {
  const { examId = '', level: levelParam } = useParams<{ examId: string; level: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  /** Subscribed — `auth.currentUser` alone does not re-render when auth restores from persistence. */
  const [authUid, setAuthUid] = useState(() => auth.currentUser?.uid ?? '');
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUid(user?.uid ?? '');
    });
    return () => unsub();
  }, []);
  const storageScope =
    (location.state as { storageScope?: string } | null)?.storageScope ?? (authUid || 'practice_session');

  const practiceLevel = parsePracticeLevel(levelParam);
  const supported = INTERACTIVE_PRACTICE_EXAMS.has(examId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [poolCap, setPoolCap] = useState<number | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  /** After first primary-button press: show correct/incorrect + explanation; second press advances. */
  const [answerChecked, setAnswerChecked] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [questionElapsedMs, setQuestionElapsedMs] = useState(0);
  /** Outcomes for the current batch; synced to Firestore once when the session completes. */
  const pendingOutcomesRef = useRef<PracticeTakePendingOutcome[]>([]);
  const [sessionSubmitting, setSessionSubmitting] = useState(false);
  const [sessionSubmitError, setSessionSubmitError] = useState<string | null>(null);
  /** Wall-clock start of current question (for analytics: time until first “Check answer”). */
  const questionWallClockStartRef = useRef(0);
  const timeToFirstCheckMsRef = useRef(0);

  const flow = getAssessmentFlowDefinition(examId);
  const mathExam = examId === 'mathematical_reasoning';
  const headerBg = flow.theme === 'purple' ? '#6a1b9a' : '#0d47a1';
  const progressColor = '#ffc107';
  const primaryBtn = flow.theme === 'purple' ? '#7b1fa2' : '#0d47a1';
  const examShortTitle = flow.examTitleShort;

  useEffect(() => {
    if (!supported || !practiceLevel) return;
    let cancelled = false;
    setError(null);

    const saved = loadPracticeTakeSession(storageScope, examId, practiceLevel);
    if (saved && saved.questions.length > 0 && saved.index < saved.questions.length) {
      pendingOutcomesRef.current = saved.pendingOutcomes.map((r) => ({ ...r }));
      setQuestions(saved.questions);
      setIndex(saved.index);
      setPoolCap(saved.totalInLevel);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchPracticeQuestions(examId, practiceLevel, PRACTICE_SESSION_BATCH_SIZE)
      .then((res) => {
        if (cancelled) return;
        pendingOutcomesRef.current = [];
        setQuestions(res.questions);
        setPoolCap(typeof res.total_in_level === 'number' ? res.total_in_level : undefined);
        setIndex(0);
        if (res.questions.length === 0) {
          setError('You have completed all unseen questions for this level. Reset progress from Practice Mode to draw from the full pool again.');
        }
      })
      .catch((e) => {
        Sentry.captureException(e);
        if (!cancelled) setError('Could not load practice questions. Try again later.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [examId, practiceLevel, supported, storageScope]);

  useEffect(() => {
    setAnswerChecked(false);
    setSelectedOption(null);
    setSessionSubmitError(null);
    questionWallClockStartRef.current = Date.now();
    timeToFirstCheckMsRef.current = 0;
  }, [index]);

  useEffect(() => {
    setQuestionElapsedMs(0);
    const t0 = Date.now();
    const id = window.setInterval(() => setQuestionElapsedMs(Date.now() - t0), 200);
    return () => clearInterval(id);
  }, [index, questions.length]);

  useEffect(() => {
    if (!supported || !practiceLevel || loading || questions.length === 0) return;
    savePracticeTakeSession(storageScope, examId, practiceLevel, {
      questions,
      index,
      totalInLevel: poolCap,
      pendingOutcomes: pendingOutcomesRef.current.slice(),
    });
  }, [supported, practiceLevel, loading, questions, index, poolCap, storageScope, examId]);

  const q = questions[index] ?? null;
  const totalQuestions = questions.length;
  const questionNumber = index + 1;

  const advanceToNextQuestion = useCallback(() => {
    if (selectedOption === null || !practiceLevel || !supported || sessionSubmitting) return;
    const currentQ = questions[index];
    const itemId = resolvePracticeItemId(currentQ);
    if (!itemId) {
      setError('This question is missing an identifier. Exit and start the session again.');
      return;
    }
    const row: PracticeTakePendingOutcome = {
      itemId,
      selectedOptionIndex: selectedOption,
      timeToFirstCheckMs: Math.max(0, Math.round(timeToFirstCheckMsRef.current)),
    };
    const isLast = index >= totalQuestions - 1;

    const persistTake = () => {
      savePracticeTakeSession(storageScope, examId, practiceLevel, {
        questions,
        index: isLast ? index : index + 1,
        totalInLevel: poolCap,
        pendingOutcomes: pendingOutcomesRef.current.slice(),
      });
    };

    const finishLocal = (completedDelta: number) => {
      recordPracticeQuestionsCompleted(storageScope, examId, practiceLevel, completedDelta, poolCap);
      clearPracticeTakeSession(storageScope, examId, practiceLevel);
      clearActivePracticeSession(storageScope);
      navigate('/practice-test', { replace: true });
    };

    if (!isLast) {
      pendingOutcomesRef.current = [...pendingOutcomesRef.current, row];
      persistTake();
      setIndex((i) => i + 1);
      setSelectedOption(null);
      setAnswerChecked(false);
      return;
    }

    const alreadyHas = pendingOutcomesRef.current.some((o) => o.itemId === itemId);
    if (!alreadyHas) {
      pendingOutcomesRef.current = [...pendingOutcomesRef.current, row];
    }
    persistTake();

    const results = pendingOutcomesRef.current.map((r) => ({
      item_id: r.itemId,
      selected_option_index: r.selectedOptionIndex,
      time_to_first_check_ms: r.timeToFirstCheckMs,
    }));

    if (!authUid.trim()) {
      finishLocal(results.length);
      return;
    }

    setSessionSubmitting(true);
    setSessionSubmitError(null);
    recordPracticeSessionOutcomes({ examId, level: practiceLevel, results })
      .then(() => {
        finishLocal(results.length);
      })
      .catch((e) => {
        Sentry.captureException(e);
        let msg = 'Could not save your practice session. Check your connection and tap Done again.';
        if (axios.isAxiosError(e) && e.response?.data && typeof e.response.data === 'object') {
          const err = (e.response.data as { error?: unknown }).error;
          if (typeof err === 'string' && err.trim()) {
            msg = `Could not save: ${err.trim()}`;
          }
        }
        setSessionSubmitError(msg);
      })
      .finally(() => {
        setSessionSubmitting(false);
      });
  }, [
    selectedOption,
    practiceLevel,
    supported,
    storageScope,
    examId,
    poolCap,
    index,
    totalQuestions,
    navigate,
    authUid,
    questions,
    sessionSubmitting,
  ]);

  const handlePrimaryAction = useCallback(() => {
    if (selectedOption === null || !practiceLevel || !supported || sessionSubmitting) return;
    if (!answerChecked) {
      timeToFirstCheckMsRef.current = Date.now() - questionWallClockStartRef.current;
      setAnswerChecked(true);
      return;
    }
    advanceToNextQuestion();
  }, [selectedOption, practiceLevel, supported, answerChecked, advanceToNextQuestion, sessionSubmitting]);

  const handleFooterBack = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      return;
    }
    setLeaveOpen(true);
  }, [index]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!q || !examId || sessionSubmitting) return;
      if (e.key === 'Enter' && selectedOption !== null) {
        handlePrimaryAction();
        return;
      }
      if (answerChecked) return;
      const mode = inferQuestionInteraction(examId, q);
      if (mode === 'likert' && q.options?.length >= 5) {
        if (['1', '2', '3', '4', '5'].includes(e.key)) setSelectedOption(parseInt(e.key, 10) - 1);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const max = Math.min(4, q.options?.length ?? 4);
        const idx = parseInt(e.key, 10) - 1;
        if (idx < max) setSelectedOption(idx);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [q, examId, selectedOption, answerChecked, handlePrimaryAction, sessionSubmitting]);

  const progressPercent =
    totalQuestions > 0
      ? ((index + (answerChecked ? 0.85 : selectedOption !== null ? 0.45 : 0)) / totalQuestions) * 100
      : 0;

  const confirmLeave = () => {
    setLeaveOpen(false);
    navigate('/practice-test', { replace: true });
  };

  const questionReport =
    authUid.trim().length > 0 && practiceLevel
      ? { kind: 'practice' as const, uid: authUid, examId, level: practiceLevel }
      : null;

  if (!supported || !practiceLevel) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
        <Alert severity="info" sx={{ maxWidth: 480 }}>
          This exam does not have an interactive practice session yet, or the link is invalid.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/practice-test')} sx={{ color: '#475569' }}>
          Back to practice hub
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress sx={{ color: primaryBtn }} size={48} />
        <Typography variant="h6" sx={{ color: '#334155', fontWeight: 700 }}>
          Loading practice…
        </Typography>
      </Box>
    );
  }

  if (error || !q) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 500, width: '100%' }}>
          {error ?? 'No items to show.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/practice-test')} sx={{ color: '#475569' }}>
          Back to practice hub
        </Button>
      </Box>
    );
  }

  const correctIdx =
    typeof q.correct_option_index === 'number' &&
    q.correct_option_index >= 0 &&
    q.correct_option_index <= 3
      ? q.correct_option_index
      : null;

  const isCorrect =
    answerChecked && correctIdx !== null && selectedOption !== null ? selectedOption === correctIdx : null;

  const feedbackForPicker =
    answerChecked && correctIdx !== null && selectedOption !== null
      ? { correctIndex: correctIdx, selectedIndex: selectedOption }
      : null;

  const solutionSteps = q.solution_steps ?? [];

  const questionBodyEl = (
    <ExamQuestionBody
      assessmentId={examId}
      question={q}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      selectedOption={selectedOption}
      onSelectOption={setSelectedOption}
      theme={flow.theme}
      renderMath={mathExam}
      questionReport={questionReport}
      selectionLocked={answerChecked}
      answerFeedback={feedbackForPicker}
    />
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
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
            Practice · Exam {flow.examOrdinal}: {examShortTitle}
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', opacity: 0.88, fontWeight: 600, lineHeight: 1.2 }}>
            Level {practiceLevel}
            <Box component="span" sx={{ opacity: 0.75, mx: 0.75 }}>
              ·
            </Box>
            No overall time limit
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
            <TimerOutlinedIcon sx={{ fontSize: { xs: 17, sm: 18 }, opacity: 0.95 }} aria-hidden />
            <Typography component="span" sx={{ opacity: 0.82, fontWeight: 600, fontSize: '0.62rem', display: { xs: 'none', sm: 'inline' } }}>
              This question
            </Typography>
            <Typography component="span">{formatQuestionElapsed(questionElapsedMs)}</Typography>
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.78rem', sm: '0.82rem' },
              fontVariantNumeric: 'tabular-nums',
              opacity: 0.95,
            }}
          >
            {questionNumber} / {totalQuestions}
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
          {mathExam ? (
            <MathJaxContext version={3} config={EXAM_MATHJAX_CONFIG}>
              {questionBodyEl}
            </MathJaxContext>
          ) : (
            questionBodyEl
          )}
          {sessionSubmitError ? (
            <Alert severity="warning" sx={{ mt: 2.5, borderRadius: 2 }}>
              {sessionSubmitError}
            </Alert>
          ) : null}
          {answerChecked && (
            <Alert
              severity={isCorrect === true ? 'success' : isCorrect === false ? 'error' : 'info'}
              sx={{
                mt: 2.5,
                borderRadius: 2,
                /* Light surfaces + explicit text (avoids dark-mode Alert looking black; matches correct-option tint) */
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
                ...(isCorrect === null && {
                  bgcolor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #e2e8f0',
                  '& .MuiAlert-icon': { color: '#64748b' },
                }),
              }}
            >
              <Typography sx={{ fontWeight: 800, mb: solutionSteps.length > 0 ? 1 : 0 }}>
                {isCorrect === true ? 'Correct!' : isCorrect === false ? 'Not quite.' : 'Answer recorded.'}
              </Typography>
              {solutionSteps.length > 0 ? (
                <Box component="ul" sx={{ m: 0, pl: 2.25, mb: 0 }}>
                  {solutionSteps.map((step, i) => (
                    <Typography component="li" key={i} sx={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'inherit' }}>
                      {step}
                    </Typography>
                  ))}
                </Box>
              ) : isCorrect === null ? (
                <Typography sx={{ fontSize: '0.88rem', mt: 0.5 }}>
                  Step-by-step explanation is not available for this item.
                </Typography>
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
          onClick={() => setLeaveOpen(true)}
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
          Exit practice
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
          Practice only.{' '}
          {inferQuestionInteraction(examId, q) === 'likert'
            ? 'Keys 1–5 to select • Enter to continue'
            : 'Pick an option or use keys 1–4, press Check answer or Enter, then Next or Done'}
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
            endIcon={sessionSubmitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
            disabled={selectedOption === null || sessionSubmitting}
            onClick={handlePrimaryAction}
            sx={{
              bgcolor: primaryBtn,
              color: '#fff',
              fontWeight: 800,
              px: 3,
              minWidth: 140,
              flex: { xs: '1 1 auto', md: '0 0 auto' },
              '&:hover': { bgcolor: flow.theme === 'purple' ? '#6a1b9a' : '#1565c0' },
              '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#64748b' },
            }}
          >
            {!answerChecked ? 'Check answer' : index + 1 >= totalQuestions ? 'Done' : 'Next'}
          </Button>
        </Box>
      </Box>

      <Dialog open={leaveOpen} onClose={() => setLeaveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Leave practice?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div" sx={{ color: 'text.primary', typography: 'body2', lineHeight: 1.65 }}>
            You can return anytime from Practice Mode.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLeaveOpen(false)} color="inherit">
            Stay
          </Button>
          <Button variant="contained" onClick={confirmLeave}>
            Exit to hub
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
