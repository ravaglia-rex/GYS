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
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import axios from 'axios';
import * as Sentry from '@sentry/react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/spinner';
import { useQod, useInvalidateStudentQueries } from '../../query/hooks';
import { submitQodAnswer, type QodResponse } from '../../db/gamificationCollection';
import { queryKeys } from '../../query/queryKeys';
import { studentPageSubtitleSx, studentPageTitleSx } from '../../styles/studentTypography';
import { auth } from '../../firebase/firebase';
import type { ExamQuestion } from '../../db/assessmentCollection';
import { ExamQuestionStimulus } from '../../components/assessment/ExamQuestionBody';

const EXAM_LABELS: Record<string, string> = {
  symbolic_reasoning: 'Pattern & Logic',
  verbal_reasoning: 'Verbal Reasoning',
  mathematical_reasoning: 'Mathematical Reasoning',
  ai_literacy: 'AI Literacy',
};

function getQodPassageText(question: ExamQuestion): string {
  const direct = typeof question.passage === 'string' ? question.passage.trim() : '';
  if (direct) return direct;

  const legacy = (question as { reading_passage?: unknown }).reading_passage;
  if (typeof legacy === 'string' && legacy.trim()) return legacy.trim();

  const stimulus = question.stimulus;
  if (stimulus && typeof stimulus === 'object' && !Array.isArray(stimulus)) {
    const obj = stimulus as Record<string, unknown>;
    for (const key of ['passage', 'reading_passage'] as const) {
      const value = obj[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }

  return '';
}

function splitPassageParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n+/g, ' ').trim())
    .filter(Boolean);
}

const QuestionOfTheDayPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQod();
  const invalidateStudent = useInvalidateStudentQueries();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    coins_awarded: number;
    correct_option_index: number | null;
    solution_steps?: string[] | null;
  } | null>(null);
  const [submitError, setSubmitError] = useState('');

  const alreadyAnswered = Boolean(data?.already_answered);
  const persistedResult = data?.last_result ?? null;
  const showResult = alreadyAnswered ? persistedResult : result;
  const solutionSteps = result?.solution_steps ?? persistedResult?.solution_steps ?? null;
  const correctOptionIndex = result?.correct_option_index ?? persistedResult?.correct_option_index ?? null;

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
            solution_steps: res.solution_steps ?? null,
          },
        };
      });

      const uid = auth.currentUser?.uid;
      if (uid) invalidateStudent(uid);
      try {
        await refetch();
      } catch (refetchErr) {
        Sentry.captureException(refetchErr);
      }
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
  const options = question?.options ?? [];
  const passageText = question ? getQodPassageText(question) : '';
  const renderMath = data?.exam_id === 'mathematical_reasoning';

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: '#a855f7', width: 56, height: 56 }}>
            <LightbulbIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={studentPageTitleSx}>
              Question of the Day
            </Typography>
            <Typography variant="body1" sx={studentPageSubtitleSx}>
              One fresh challenge every day - earn Argus Coins and build your streak.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
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
          <Chip
            label={`${(data?.argus_coins ?? 0).toLocaleString()} Argus Coins`}
            sx={{
              bgcolor: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.45)',
              color: '#fde68a',
              fontWeight: 800,
            }}
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

              {passageText && (
                <Box
                  sx={{
                    mt: 2,
                    mb: 2.5,
                    borderLeft: '4px solid #a855f7',
                    bgcolor: 'rgba(168, 85, 247, 0.08)',
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.25,
                    }}
                  >
                    {splitPassageParagraphs(passageText).map((paragraph, index) => (
                      <Typography
                        key={index}
                        sx={{
                          fontSize: '0.92rem',
                          color: 'rgba(255, 255, 255, 0.85)',
                          fontStyle: 'italic',
                          lineHeight: 1.65,
                          m: 0,
                        }}
                      >
                        {paragraph}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {question.instruction && (
                <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
                  {question.instruction}
                </Typography>
              )}

              <Typography variant="h6" sx={{ mt: passageText ? 0 : 1, mb: 2, fontWeight: 600, lineHeight: 1.5 }}>
                {question.prompt}
              </Typography>

              {!passageText && (
                <ExamQuestionStimulus
                  q={question}
                  border="rgba(168, 85, 247, 0.25)"
                  renderMath={renderMath}
                  variant="dark"
                />
              )}

              {question.image_url && (
                <Box
                  sx={{
                    mb: 2.5,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    bgcolor: 'rgba(168, 85, 247, 0.08)',
                    display: 'grid',
                    placeItems: 'center',
                    minHeight: 200,
                  }}
                >
                  <img
                    src={question.image_url}
                    alt=""
                    style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }}
                  />
                </Box>
              )}

              {!showResult && !alreadyAnswered && (
                <>
                  <RadioGroup
                    value={selected ?? ''}
                    onChange={(e) => setSelected(Number(e.target.value))}
                  >
                    {options.map((opt, idx) => (
                      <FormControlLabel
                        key={idx}
                        value={idx}
                        control={<Radio sx={{ color: '#a855f7' }} />}
                        label={opt}
                        sx={{ color: 'white', mb: 0.5 }}
                      />
                    ))}
                  </RadioGroup>
                  <Button
                    variant="contained"
                    disabled={selected === null || submitting}
                    onClick={() => void handleSubmit()}
                    sx={{ mt: 2, bgcolor: '#a855f7', fontWeight: 700 }}
                  >
                    {submitting ? <CircularProgress size={22} color="inherit" /> : 'Submit answer'}
                  </Button>
                </>
              )}

              {showResult && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity={showResult.correct ? 'success' : 'info'} sx={{ mb: 2 }}>
                    {showResult.correct
                      ? `Correct! You earned ${showResult.coins_awarded ?? data?.last_result?.coins_awarded ?? 0} Argus Coins.`
                      : `Not quite - you still earned ${showResult.coins_awarded ?? data?.last_result?.coins_awarded ?? 5} Argus Coins for trying. Come back tomorrow!`}
                  </Alert>
                  {!showResult.correct && correctOptionIndex != null && options[correctOptionIndex] && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                      Correct answer: {options[correctOptionIndex]}
                    </Typography>
                  )}
                  {solutionSteps && solutionSteps.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Solution
                      </Typography>
                      {solutionSteps.length === 1 ? (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
                          {solutionSteps[0]}
                        </Typography>
                      ) : (
                        <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                          {solutionSteps.map((step, i) => (
                            <Typography
                              key={i}
                              component="li"
                              variant="body2"
                              sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.55, mb: 0.5 }}
                            >
                              {step}
                            </Typography>
                          ))}
                        </Box>
                      )}
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
};

export default QuestionOfTheDayPage;
