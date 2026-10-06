import React, { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import axios from 'axios';
import * as Sentry from '@sentry/react';
import { useQueryClient } from '@tanstack/react-query';
import { MathJaxContext } from 'better-react-mathjax';
import DashboardLayout from '../../layouts/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/spinner';
import { useQod, useInvalidateStudentProfile } from '../../query/hooks';
import { submitQodAnswer, type QodResponse } from '../../db/gamificationCollection';
import { queryKeys } from '../../query/queryKeys';
import { studentPageSubtitleSx, studentPageTitleSx } from '../../styles/studentTypography';
import { auth } from '../../firebase/firebase';
import { ASSESSMENT_NAMES } from '../../utils/assessmentGating';
import { ExamQuestionBody } from '../../components/assessment/ExamQuestionBody';
import { ExamMarkdown, looksLikeExamMarkdown } from '../../components/assessment/ExamMarkdown';
import { ExamMathText } from '../../components/assessment/ExamMathText';
import { EXAM_MATHJAX_CONFIG } from '../../components/assessment/examMathJaxConfig';

const EXAM_LABELS: Record<string, string> = {
  analytical_reasoning: ASSESSMENT_NAMES.analytical_reasoning,
  verbal_reasoning: ASSESSMENT_NAMES.verbal_reasoning,
  mathematical_reasoning: ASSESSMENT_NAMES.mathematical_reasoning,
  ai_literacy: ASSESSMENT_NAMES.ai_literacy,
};

const QuestionOfTheDayPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQod();
  const invalidateStudentProfile = useInvalidateStudentProfile();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    coins_awarded: number;
    correct_option_index: number | null;
    selected_option_index?: number | null;
    solution_steps?: string[] | null;
  } | null>(null);
  const [submitError, setSubmitError] = useState('');

  const alreadyAnswered = Boolean(data?.already_answered);
  const persistedResult = data?.last_result ?? null;
  const showResult = alreadyAnswered ? persistedResult : result;
  const solutionSteps = result?.solution_steps ?? persistedResult?.solution_steps ?? null;
  const correctOptionIndex = result?.correct_option_index ?? persistedResult?.correct_option_index ?? null;
  const selectedOptionIndex =
    result?.selected_option_index ??
    persistedResult?.selected_option_index ??
    selected;

  const handleSubmit = async () => {
    if (selected === null || alreadyAnswered) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await submitQodAnswer(selected);
      const nextResult = {
        correct: res.correct,
        coins_awarded: res.coins_awarded,
        correct_option_index: res.correct_option_index,
        selected_option_index: res.selected_option_index ?? selected,
        solution_steps: res.solution_steps,
      };
      setResult(nextResult);

      queryClient.setQueryData<QodResponse>(queryKeys.qod(), (old) => {
        if (!old) return old;
        return {
          ...old,
          already_answered: true,
          argus_coins: res.argus_coins,
          qod_streak: res.qod_streak,
          qod_attempted_total: res.qod_attempted_total,
          qod_correct_total: res.qod_correct_total,
          qod_accuracy_pct: res.qod_accuracy_pct,
          last_result: {
            correct: res.correct,
            coins_awarded: res.coins_awarded,
            correct_option_index: res.correct_option_index,
            selected_option_index: res.selected_option_index ?? selected,
            solution_steps: res.solution_steps ?? null,
          },
        };
      });

      const uid = auth.currentUser?.uid;
      if (uid) invalidateStudentProfile(uid);
    } catch (e) {
      Sentry.captureException(e);
      const message =
        axios.isAxiosError(e) && e.response?.data && typeof e.response.data === 'object' && 'error' in e.response.data
          ? String((e.response.data as { error?: string }).error ?? '')
          : '';
      setSubmitError(message || 'Could not submit your answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const question = data?.question;
  const renderMath = data?.exam_id === 'mathematical_reasoning';
  const locked = Boolean(showResult || alreadyAnswered);
  const chosen =
    locked && typeof selectedOptionIndex === 'number' ? selectedOptionIndex : locked ? null : selected;
  const answerFeedback =
    showResult && typeof correctOptionIndex === 'number'
      ? {
          correctIndex: correctOptionIndex,
          selectedIndex: typeof selectedOptionIndex === 'number' ? selectedOptionIndex : -1,
        }
      : null;

  const page = (
    <DashboardLayout>
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: '#a855f7',
                color: 'white',
                flexShrink: 0,
              }}
            >
              <LightbulbIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ ...studentPageTitleSx, minWidth: 0 }}>
                Question of the Day
              </Typography>
              <Typography variant="h6" sx={studentPageSubtitleSx}>
                One fresh challenge every day - earn Argus Coins and build your streak.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            mb: 2,
            overflowX: { md: 'auto' },
          }}
        >
          <Chip label={`Login streak: ${data?.login_streak?.current ?? 0} days`} color="warning" variant="outlined" />
          <Chip label={`QoD streak: ${data?.qod_streak?.current ?? 0} days`} color="secondary" variant="outlined" />
          <Chip
            label={`QoD answered: ${data?.qod_attempted_total ?? 0}`}
            variant="outlined"
            sx={{ color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.25)' }}
          />
          <Chip
            label={`QoD accuracy: ${data?.qod_accuracy_pct ?? 0}%`}
            variant="outlined"
            sx={{ color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.25)' }}
          />
        </Box>

        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

        {isLoading ? (
          <Box
            sx={{
              minHeight: { xs: 360, md: 'calc(100vh - 320px)' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              color: 'rgba(255, 255, 255, 0.86)',
              textAlign: 'center',
            }}
          >
            <LoadingSpinner size={72} />
            <Typography sx={{ fontWeight: 600, letterSpacing: '0.02em' }}>
              Loading today&apos;s question...
            </Typography>
          </Box>
        ) : (
          <>
            {error && <Alert severity="error">Could not load today&apos;s question.</Alert>}

            {question && (
              <Card sx={{ borderRadius: 3, bgcolor: 'rgba(30,41,59,0.85)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Typography variant="overline" sx={{ color: '#a855f7', fontWeight: 700 }}>
                    {EXAM_LABELS[data?.exam_id ?? ''] ?? data?.exam_id}
                  </Typography>

                  <Box sx={{ mt: 1.5 }}>
                    <ExamQuestionBody
                      assessmentId={data?.exam_id ?? ''}
                      question={question}
                      questionNumber={1}
                      totalQuestions={1}
                      selectedOption={chosen}
                      onSelectOption={(index) => {
                        if (locked) return;
                        setSelected(index);
                      }}
                      theme="purple"
                      renderMath={renderMath}
                      selectionLocked={locked}
                      answerFeedback={answerFeedback}
                      hideQuestionCaption
                      surface="dark"
                    />
                  </Box>

                  {!showResult && !alreadyAnswered && (
                    <Button
                      variant="contained"
                      disabled={selected === null || submitting}
                      onClick={() => void handleSubmit()}
                      sx={{ mt: 2, bgcolor: '#a855f7', fontWeight: 700 }}
                    >
                      {submitting ? <CircularProgress size={22} color="inherit" /> : 'Submit answer'}
                    </Button>
                  )}

                  {showResult && (
                    <Box sx={{ mt: 2 }}>
                      <Alert severity={showResult.correct ? 'success' : 'info'} sx={{ mb: 2 }}>
                        {showResult.correct
                          ? `Correct! You earned ${showResult.coins_awarded ?? data?.last_result?.coins_awarded ?? 0} Argus Coins.`
                          : `Not quite - you still earned ${showResult.coins_awarded ?? data?.last_result?.coins_awarded ?? 5} Argus Coins for trying. Come back tomorrow!`}
                      </Alert>
                      {solutionSteps && solutionSteps.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            Solution
                          </Typography>
                          <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                            {solutionSteps.map((step, i) => (
                              <Box key={i} component="li" sx={{ mb: 0.75 }}>
                                {looksLikeExamMarkdown(step) ? (
                                  <Box sx={{ bgcolor: '#fff', color: '#334155', borderRadius: 1, p: 1.5 }}>
                                    <ExamMarkdown renderMath={renderMath}>{step}</ExamMarkdown>
                                  </Box>
                                ) : renderMath ? (
                                  <ExamMathText
                                    inline={false}
                                    sx={{
                                      display: 'block',
                                      color: 'rgba(255,255,255,0.8)',
                                      fontSize: '0.875rem',
                                      lineHeight: 1.55,
                                    }}
                                  >
                                    {step}
                                  </ExamMathText>
                                ) : (
                                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
                                    {step}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                      <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.6)' }}>
                        You&apos;ve completed today&apos;s Question of the Day. See you tomorrow!
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Box>
    </DashboardLayout>
  );

  if (!renderMath) return page;

  return (
    <MathJaxContext version={3} config={EXAM_MATHJAX_CONFIG}>
      {page}
    </MathJaxContext>
  );
};

export default QuestionOfTheDayPage;
