import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  revealPracticeSolutions,
} from '../../db/practiceBank';
import type { ExamQuestion } from '../../db/assessmentCollection';
import { ExamQuestionBody, inferQuestionInteraction } from '../../components/assessment/ExamQuestionBody';
import { getAssessmentFlowDefinition } from '../../config/assessmentFlowUI';
import { EXAM_MATHJAX_CONFIG } from '../../components/assessment/examMathJaxConfig';
import {
  buildPracticeSessionResults,
  clearActivePracticeSession,
  clearPracticeTakeSession,
  dedupePracticePendingOutcomes,
  isInteractivePracticeExam,
  loadPracticeTakeSession,
  recordPracticeQuestionsCompleted,
  resolvePracticeItemId,
  saveLastPracticeSelection,
  savePracticeTakeSession,
  upsertPracticePendingOutcome,
  type PracticeTakePendingOutcome,
} from '../../components/practice/practiceModeConfig';

function parsePracticeLevel(raw: string | undefined): 1 | 2 | 3 | null {
  const n = parseInt(raw ?? '', 10);
  if (n === 1 || n === 2 || n === 3) return n;
  return null;
}

interface PracticeQuestionPage {
  passageId?: string;
  passage?: string;
  questions: ExamQuestion[];
}

function getPracticePassageId(q: ExamQuestion): string {
  return typeof q.passage_id === 'string' ? q.passage_id.trim() : '';
}

function stringFromUnknown(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getPracticePassageText(q: ExamQuestion): string {
  const direct = stringFromUnknown(q.passage);
  if (direct) return direct;

  const legacy = stringFromUnknown((q as { reading_passage?: unknown }).reading_passage);
  if (legacy) return legacy;

  const stimulus = q.stimulus;
  if (stimulus && typeof stimulus === 'object' && !Array.isArray(stimulus)) {
    const obj = stimulus as Record<string, unknown>;
    return (
      stringFromUnknown(obj.passage) ||
      stringFromUnknown(obj.reading_passage) ||
      stringFromUnknown(obj.text) ||
      stringFromUnknown(obj.setup)
    );
  }

  return '';
}

function buildPracticeQuestionPages(questions: ExamQuestion[], groupedByPassage: boolean): PracticeQuestionPage[] {
  if (!groupedByPassage) {
    return questions.map((q) => ({ questions: [q], passage: getPracticePassageText(q) }));
  }

  const pages: PracticeQuestionPage[] = [];
  const byPassage = new Map<string, PracticeQuestionPage>();
  for (const q of questions) {
    const passage = getPracticePassageText(q);
    const passageId = getPracticePassageId(q) || resolvePracticeItemId(q) || `question_${pages.length}`;
    const existing = byPassage.get(passageId);
    if (existing) {
      existing.questions.push(q);
      if (!existing.passage && passage) existing.passage = passage;
      continue;
    }
    const page = {
      passageId,
      passage,
      questions: [q],
    };
    byPassage.set(passageId, page);
    pages.push(page);
  }
  return pages;
}

/** MM:SS for question timer (hours omitted unless needed). */
const QuestionStopwatch: React.FC<{ startedAt: number }> = React.memo(({ startedAt }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    setElapsedMs(0);
    const id = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 200);
    return () => clearInterval(id);
  }, [startedAt]);
  return <Typography component="span">{formatQuestionElapsed(elapsedMs)}</Typography>;
});

function formatQuestionElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** `Step 1` / `step 2` (any case) and whole word `Answer` / `answer` in solution copy - rendered bold. */
function solutionStepLineWithBoldStepLabels(text: string, lineKey: string | number): React.ReactNode {
  const re = /\b(step\s+\d+|answer)\b/gi;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let frag = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <Box component="strong" key={`${lineKey}-b${frag++}`} sx={{ fontWeight: 800 }}>
        {m[0]}
      </Box>
    );
    last = m.index + m[0].length;
  }
  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/**
 * Full-page practice session - same chrome as {@link AssessmentTakePage} “taking” stage,
 * without fullscreen, integrity hooks, or exam timer.
 */
export default function PracticeTakePage() {
  const { examId = '', level: levelParam } = useParams<{ examId: string; level: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  /** Subscribed - `auth.currentUser` alone does not re-render when auth restores from persistence. */
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
  const supported = isInteractivePracticeExam(examId);

  const goToPracticeHub = useCallback((coinsFeedback?: { coins_awarded?: number; coins_reason?: string | null }) => {
    if (examId && practiceLevel) {
      saveLastPracticeSelection(storageScope, { examId, level: practiceLevel });
    }
    navigate('/practice-test', {
      replace: true,
      state: {
        ...(examId && practiceLevel ? { examId, level: practiceLevel } : {}),
        ...(coinsFeedback ? { coinsFeedback } : {}),
      },
    });
  }, [examId, practiceLevel, navigate, storageScope]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [poolCap, setPoolCap] = useState<number | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [selectedOptionsById, setSelectedOptionsById] = useState<Record<string, number>>({});
  /** After first primary-button press: show correct/incorrect + explanation; second press advances. */
  const [answerChecked, setAnswerChecked] = useState(false);
  const [revealingSolutions, setRevealingSolutions] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  /** Outcomes for the current batch; synced to Firestore once when the session completes. */
  const pendingOutcomesRef = useRef<PracticeTakePendingOutcome[]>([]);
  const sessionIdRef = useRef<string>('');
  const advancingQuestionRef = useRef(false);
  const sessionSubmitInFlightRef = useRef(false);
  const [sessionSubmitting, setSessionSubmitting] = useState(false);
  const [sessionSubmitError, setSessionSubmitError] = useState<string | null>(null);
  /** Wall-clock start of current question (for analytics: time until first “Check answer”). */
  const questionWallClockStartRef = useRef(0);
  const timeToFirstCheckMsRef = useRef(0);

  const flow = getAssessmentFlowDefinition(examId);
  const mathExam = examId === 'mathematical_reasoning';
  const groupedPassagePractice = examId === 'verbal_reasoning';
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
      pendingOutcomesRef.current = dedupePracticePendingOutcomes(
        saved.pendingOutcomes.map((r) => ({ ...r }))
      );
      sessionIdRef.current = saved.sessionId || crypto.randomUUID();
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
        sessionIdRef.current = crypto.randomUUID();
        setQuestions(res.questions);
        setPoolCap(typeof res.total_in_level === 'number' ? res.total_in_level : undefined);
        setIndex(0);
        if (res.questions.length === 0) {
          const seenCount = typeof res.draw_seen_count === 'number' ? res.draw_seen_count : 0;
          setError(
            seenCount > 0
              ? 'You have completed all unseen questions for this level. Reset progress from Practice Mode to draw from the full pool again.'
              : 'No practice questions are available for this level right now. Try another level, or ask your school to contact support if this continues.'
          );
        }
      })
      .catch((e) => {
        Sentry.captureException(e);
        if (cancelled) return;
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setError('No practice questions are available for this level yet.');
          return;
        }
        setError('Could not load practice questions. Try again later.');
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
    setSelectedOptionsById({});
    setSessionSubmitError(null);
    questionWallClockStartRef.current = Date.now();
    timeToFirstCheckMsRef.current = 0;
  }, [index]);

  // Elapsed timer lives in QuestionStopwatch leaf so ticks don't re-render ExamQuestionBody.

  useEffect(() => {
    if (!supported || !practiceLevel || loading || questions.length === 0) return;
    savePracticeTakeSession(storageScope, examId, practiceLevel, {
      questions,
      index,
      totalInLevel: poolCap,
      pendingOutcomes: pendingOutcomesRef.current.slice(),
      sessionId: sessionIdRef.current || undefined,
    });
  }, [supported, practiceLevel, loading, questions, index, poolCap, storageScope, examId]);

  const questionPages = useMemo(
    () => buildPracticeQuestionPages(questions, groupedPassagePractice),
    [questions, groupedPassagePractice]
  );
  const currentPage = useMemo(() => questionPages[index] ?? null, [questionPages, index]);
  const currentQuestions = useMemo(() => currentPage?.questions ?? [], [currentPage]);
  const q = currentQuestions[0] ?? null;
  const totalQuestions = questions.length;
  const totalPages = questionPages.length;
  const answeredBeforeCurrentPage = questionPages
    .slice(0, index)
    .reduce((sum, page) => sum + page.questions.length, 0);
  const questionNumber = answeredBeforeCurrentPage + 1;
  const currentQuestionEndNumber = answeredBeforeCurrentPage + currentQuestions.length;

  const getSelectedOption = useCallback(
    (question: ExamQuestion): number | null => {
      const itemId = resolvePracticeItemId(question);
      if (!itemId) return null;
      const selected = selectedOptionsById[itemId];
      return typeof selected === 'number' ? selected : null;
    },
    [selectedOptionsById]
  );

  const setQuestionSelectedOption = useCallback((question: ExamQuestion, selected: number) => {
    const itemId = resolvePracticeItemId(question);
    if (!itemId) return;
    setSelectedOptionsById((prev) => ({ ...prev, [itemId]: selected }));
  }, []);

  const allCurrentQuestionsSelected =
    currentQuestions.length > 0 && currentQuestions.every((question) => getSelectedOption(question) !== null);

  const advanceToNextQuestion = useCallback(() => {
    if (
      !allCurrentQuestionsSelected ||
      !practiceLevel ||
      !supported ||
      sessionSubmitting ||
      advancingQuestionRef.current ||
      sessionSubmitInFlightRef.current
    ) {
      return;
    }
    advancingQuestionRef.current = true;
    try {
      const rows: PracticeTakePendingOutcome[] = [];
      for (const currentQ of currentQuestions) {
        const itemId = resolvePracticeItemId(currentQ);
        const selectedOption = getSelectedOption(currentQ);
        if (!itemId || selectedOption === null) {
          setError('This question is missing an answer or identifier. Exit and start the session again.');
          return;
        }
        rows.push({
          itemId,
          selectedOptionIndex: selectedOption,
          timeToFirstCheckMs: Math.max(0, Math.round(timeToFirstCheckMsRef.current)),
        });
      }
      const isLast = index >= totalPages - 1;

      pendingOutcomesRef.current = rows.reduce(
        (outcomes, row) => upsertPracticePendingOutcome(outcomes, row),
        pendingOutcomesRef.current
      );

      const persistTake = () => {
        savePracticeTakeSession(storageScope, examId, practiceLevel, {
          questions,
          index: isLast ? index : index + 1,
          totalInLevel: poolCap,
          pendingOutcomes: pendingOutcomesRef.current.slice(),
          sessionId: sessionIdRef.current || undefined,
        });
      };

      const finishLocal = (
        completedDelta: number,
        coinsFeedback?: { coins_awarded?: number; coins_reason?: string | null }
      ) => {
        recordPracticeQuestionsCompleted(storageScope, examId, practiceLevel, completedDelta, poolCap);
        clearPracticeTakeSession(storageScope, examId, practiceLevel);
        clearActivePracticeSession(storageScope);
        goToPracticeHub(coinsFeedback);
      };

      if (!isLast) {
        persistTake();
        setIndex((i) => i + 1);
        setSelectedOptionsById({});
        setAnswerChecked(false);
        return;
      }

      persistTake();

      const results = buildPracticeSessionResults(questions, pendingOutcomesRef.current);
      if (results.length > PRACTICE_SESSION_BATCH_SIZE) {
        setSessionSubmitError(
          'Could not save: too many answers recorded for this set. Exit and start a new practice session.'
        );
        return;
      }

      if (!authUid.trim()) {
        finishLocal(results.length);
        return;
      }

      sessionSubmitInFlightRef.current = true;
      setSessionSubmitting(true);
      setSessionSubmitError(null);
      if (!sessionIdRef.current) {
        sessionIdRef.current = crypto.randomUUID();
      }
      recordPracticeSessionOutcomes({
        examId,
        level: practiceLevel,
        results,
        sessionId: sessionIdRef.current,
      })
        .then((resp) => {
          finishLocal(results.length, {
            coins_awarded: resp.coins_awarded,
            coins_reason: resp.coins_reason ?? null,
          });
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
          sessionSubmitInFlightRef.current = false;
          setSessionSubmitting(false);
        });
    } finally {
      advancingQuestionRef.current = false;
    }
  }, [
    allCurrentQuestionsSelected,
    practiceLevel,
    supported,
    storageScope,
    examId,
    poolCap,
    index,
    totalPages,
    goToPracticeHub,
    authUid,
    questions,
    currentQuestions,
    getSelectedOption,
    sessionSubmitting,
  ]);

  const handlePrimaryAction = useCallback(async () => {
    if (!allCurrentQuestionsSelected || !practiceLevel || !supported || sessionSubmitting || revealingSolutions) {
      return;
    }
    if (!answerChecked) {
      timeToFirstCheckMsRef.current = Date.now() - questionWallClockStartRef.current;
      const itemIds = currentQuestions
        .map((question) => resolvePracticeItemId(question))
        .filter((id): id is string => Boolean(id));
      if (itemIds.length > 0) {
        setRevealingSolutions(true);
        try {
          const solutions = await revealPracticeSolutions({
            examId,
            level: practiceLevel,
            itemIds,
          });
          setQuestions((prev) =>
            prev.map((question) => {
              const id = resolvePracticeItemId(question);
              const revealed = id ? solutions[id] : undefined;
              if (!revealed) return question;
              return {
                ...question,
                correct_option_index: revealed.correct_option_index ?? question.correct_option_index,
                solution_steps: revealed.solution_steps ?? question.solution_steps,
              };
            })
          );
        } catch (e) {
          console.error('revealPracticeSolutions:', e);
          setSessionSubmitError('Could not load answer feedback. Please try again.');
          return;
        } finally {
          setRevealingSolutions(false);
        }
      }
      setAnswerChecked(true);
      return;
    }
    advanceToNextQuestion();
  }, [
    allCurrentQuestionsSelected,
    practiceLevel,
    supported,
    answerChecked,
    advanceToNextQuestion,
    sessionSubmitting,
    revealingSolutions,
    currentQuestions,
    examId,
  ]);

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
      if (e.key === 'Enter' && allCurrentQuestionsSelected) {
        handlePrimaryAction();
        return;
      }
      if (answerChecked) return;
      const targetQuestion = groupedPassagePractice
        ? currentQuestions.find((question) => getSelectedOption(question) === null) ?? q
        : q;
      const mode = inferQuestionInteraction(examId, targetQuestion);
      if (mode === 'likert' && targetQuestion.options?.length >= 5) {
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          setQuestionSelectedOption(targetQuestion, parseInt(e.key, 10) - 1);
        }
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const max = Math.min(4, targetQuestion.options?.length ?? 4);
        const idx = parseInt(e.key, 10) - 1;
        if (idx < max) setQuestionSelectedOption(targetQuestion, idx);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    q,
    examId,
    allCurrentQuestionsSelected,
    answerChecked,
    handlePrimaryAction,
    sessionSubmitting,
    groupedPassagePractice,
    currentQuestions,
    getSelectedOption,
    setQuestionSelectedOption,
  ]);

  const progressPercent =
    totalQuestions > 0
      ? ((answeredBeforeCurrentPage +
          (answerChecked
            ? currentQuestions.length
            : currentQuestions.filter((question) => getSelectedOption(question) !== null).length * 0.45)) /
          totalQuestions) *
        100
      : 0;

  const confirmLeave = () => {
    setLeaveOpen(false);
    goToPracticeHub();
  };

  const questionReport = useMemo(
    () =>
      authUid.trim().length > 0 && practiceLevel && supported
        ? { kind: 'practice' as const, uid: authUid, examId, level: practiceLevel }
        : null,
    [authUid, practiceLevel, supported, examId]
  );

  const inlineRenderCacheRef = useRef(new Map<string, ExamQuestion>());
  const getQuestionForInlineRender = useCallback((question: ExamQuestion, itemId: string) => {
    const cached = inlineRenderCacheRef.current.get(itemId);
    // Reuse prior stripped object when the source question identity is unchanged.
    if (cached && (cached as ExamQuestion & { __src?: ExamQuestion }).__src === question) {
      return cached;
    }
    const stripped: ExamQuestion & { __src?: ExamQuestion } = {
      ...question,
      passage: undefined,
      stimulus: undefined,
      stimulus_type: undefined,
      question_type: undefined,
    };
    stripped.__src = question;
    inlineRenderCacheRef.current.set(itemId, stripped);
    return stripped;
  }, []);

  if (!supported || !practiceLevel) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
        <Alert severity="info" sx={{ maxWidth: 480 }}>
          This exam does not have an interactive practice session yet, or the link is invalid.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => goToPracticeHub()} sx={{ color: '#475569' }}>
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
        <Button startIcon={<ArrowBackIcon />} onClick={() => goToPracticeHub()} sx={{ color: '#475569' }}>
          Back to practice hub
        </Button>
      </Box>
    );
  }

  const correctIndexForQuestion = (question: ExamQuestion): number | null =>
    typeof question.correct_option_index === 'number' &&
    question.correct_option_index >= 0 &&
    question.correct_option_index <= 3
      ? question.correct_option_index
      : null;

  const answerStateForQuestion = (question: ExamQuestion): boolean | null => {
    const correctIdx = correctIndexForQuestion(question);
    const selected = getSelectedOption(question);
    return answerChecked && correctIdx !== null && selected !== null ? selected === correctIdx : null;
  };

  const feedbackForQuestion = (question: ExamQuestion) => {
    const correctIdx = correctIndexForQuestion(question);
    const selected = getSelectedOption(question);
    return answerChecked && correctIdx !== null && selected !== null
      ? { correctIndex: correctIdx, selectedIndex: selected }
      : null;
  };

  const checkedCorrectCount = answerChecked
    ? currentQuestions.filter((question) => answerStateForQuestion(question) === true).length
    : 0;

  const renderQuestionFeedback = (question: ExamQuestion, keyPrefix: string) => {
    if (!answerChecked) return null;
    const isQuestionCorrect = answerStateForQuestion(question);
    const solutionSteps = question.solution_steps ?? [];
    return (
      <Alert
        severity={isQuestionCorrect === true ? 'success' : isQuestionCorrect === false ? 'error' : 'info'}
        sx={{
          mt: 1.5,
          mb: groupedPassagePractice ? 2.5 : 0,
          borderRadius: 2,
          ...(isQuestionCorrect === true && {
            bgcolor: 'rgba(5, 150, 105, 0.1)',
            color: '#065f46',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            '& .MuiAlert-icon': { color: '#059669' },
          }),
          ...(isQuestionCorrect === false && {
            bgcolor: 'rgba(220, 38, 38, 0.06)',
            color: '#7f1d1d',
            border: '1px solid rgba(248, 113, 113, 0.45)',
            '& .MuiAlert-icon': { color: '#dc2626' },
          }),
          ...(isQuestionCorrect === null && {
            bgcolor: '#f1f5f9',
            color: '#334155',
            border: '1px solid #e2e8f0',
            '& .MuiAlert-icon': { color: '#64748b' },
          }),
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Typography sx={{ fontWeight: 800, mb: solutionSteps.length > 0 ? 1 : 0 }}>
          {isQuestionCorrect === true ? 'Correct!' : isQuestionCorrect === false ? 'Not quite.' : 'Answer recorded.'}
        </Typography>
        {solutionSteps.length === 1 ? (
          <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'inherit' }}>
            {solutionStepLineWithBoldStepLabels(solutionSteps[0], keyPrefix)}
          </Typography>
        ) : solutionSteps.length > 1 ? (
          <Box component="ul" sx={{ m: 0, pl: 2.25, mb: 0 }}>
            {solutionSteps.map((step, i) => (
              <Typography component="li" key={`${keyPrefix}-${i}`} sx={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'inherit' }}>
                {solutionStepLineWithBoldStepLabels(step, `${keyPrefix}-${i}`)}
              </Typography>
            ))}
          </Box>
        ) : isQuestionCorrect === null ? (
          <Typography sx={{ fontSize: '0.88rem', mt: 0.5 }}>
            Step-by-step explanation is not available for this item.
          </Typography>
        ) : null}
      </Alert>
    );
  };

  const questionBodyEl =
    groupedPassagePractice && currentPage ? (
      <Box sx={{ width: '100%' }}>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}
        >
          Passage {index + 1} of {totalPages} · Questions {questionNumber}
          {currentQuestionEndNumber > questionNumber ? `-${currentQuestionEndNumber}` : ''} of {totalQuestions}
        </Typography>
        {currentPage.passage ? (
          <Box sx={{ borderLeft: `4px solid ${primaryBtn}`, bgcolor: 'rgba(13,71,161,0.06)', borderRadius: 2, p: 2, mb: 3 }}>
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
              {currentPage.passage}
            </Typography>
          </Box>
        ) : null}
        {answerChecked ? (
          <Alert
            severity={checkedCorrectCount === currentQuestions.length ? 'success' : checkedCorrectCount === 0 ? 'error' : 'info'}
            sx={{ mb: 2.5, borderRadius: 2 }}
          >
            {checkedCorrectCount} of {currentQuestions.length} correct for this passage.
          </Alert>
        ) : null}
        {currentQuestions.map((question, offset) => {
          const itemId = resolvePracticeItemId(question) ?? `${currentPage.passageId ?? 'passage'}_${offset}`;
          const questionForInlineRender = getQuestionForInlineRender(question, itemId);
          return (
            <Box key={itemId} sx={{ pb: offset === currentQuestions.length - 1 ? 0 : 3, mb: offset === currentQuestions.length - 1 ? 0 : 3, borderBottom: offset === currentQuestions.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
              <ExamQuestionBody
                assessmentId={examId}
                question={questionForInlineRender}
                questionNumber={questionNumber + offset}
                totalQuestions={totalQuestions}
                selectedOption={getSelectedOption(question)}
                onSelectOption={(selected) => setQuestionSelectedOption(question, selected)}
                theme={flow.theme}
                renderMath={mathExam}
                questionReport={questionReport}
                selectionLocked={answerChecked}
                answerFeedback={feedbackForQuestion(question)}
              />
              {renderQuestionFeedback(question, itemId)}
            </Box>
          );
        })}
      </Box>
    ) : (
      <ExamQuestionBody
        assessmentId={examId}
        question={q}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        selectedOption={getSelectedOption(q)}
        onSelectOption={(selected) => setQuestionSelectedOption(q, selected)}
        theme={flow.theme}
        renderMath={mathExam}
        questionReport={questionReport}
        selectionLocked={answerChecked}
        answerFeedback={feedbackForQuestion(q)}
      />
    );

  return (
    <Box
      sx={{
        height: '100dvh',
        maxHeight: '100dvh',
        bgcolor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
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
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: { xs: 2, sm: 1 },
              WebkitBoxOrient: 'vertical',
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
              {groupedPassagePractice ? 'This passage' : 'This question'}
            </Typography>
            <QuestionStopwatch startedAt={questionWallClockStartRef.current || Date.now()} />
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.78rem', sm: '0.82rem' },
              fontVariantNumeric: 'tabular-nums',
              opacity: 0.95,
            }}
          >
            {groupedPassagePractice && currentQuestionEndNumber > questionNumber
              ? `${questionNumber}-${currentQuestionEndNumber} / ${totalQuestions}`
              : `${questionNumber} / ${totalQuestions}`}
          </Typography>
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={Math.min(100, progressPercent)}
        sx={{
          flexShrink: 0,
          height: 4,
          bgcolor: 'rgba(0,0,0,0.08)',
          '& .MuiLinearProgress-bar': { bgcolor: progressColor },
        }}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
          py: { xs: 3, md: 5 },
          px: { xs: 2, md: 4 },
        }}
      >
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
          {!groupedPassagePractice ? renderQuestionFeedback(q, resolvePracticeItemId(q) ?? 'question') : null}
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
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
          {groupedPassagePractice
            ? 'Answer every question under this passage, then press Check answers.'
            : inferQuestionInteraction(examId, q) === 'likert'
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
            endIcon={
              sessionSubmitting || revealingSolutions ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <ArrowForwardIcon />
              )
            }
            disabled={!allCurrentQuestionsSelected || sessionSubmitting || revealingSolutions}
            onClick={() => {
              void handlePrimaryAction();
            }}
            sx={{
              bgcolor: primaryBtn,
              color: '#fff',
              fontWeight: 800,
              px: 3,
              minWidth: { xs: 0, sm: 140 },
              flex: { xs: '1 1 auto', md: '0 0 auto' },
              '&:hover': { bgcolor: flow.theme === 'purple' ? '#6a1b9a' : '#1565c0' },
              '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#64748b' },
            }}
          >
            {revealingSolutions
              ? 'Checking…'
              : !answerChecked
                ? groupedPassagePractice
                  ? 'Check answers'
                  : 'Check answer'
                : index + 1 >= totalPages
                  ? 'Done'
                  : 'Next'}
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
