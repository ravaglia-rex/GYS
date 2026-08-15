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
import { useQod, useInvalidateStudentProfile } from '../../query/hooks';
import { submitQodAnswer, type QodResponse } from '../../db/gamificationCollection';
import { queryKeys } from '../../query/queryKeys';
import { studentPageSubtitleSx, studentPageTitleSx } from '../../styles/studentTypography';
import { auth } from '../../firebase/firebase';
import type { ExamQuestion } from '../../db/assessmentCollection';
import { ASSESSMENT_NAMES } from '../../utils/assessmentGating';
import { ExamQuestionStimulus } from '../../components/assessment/ExamQuestionBody';

const EXAM_LABELS: Record<string, string> = {
  analytical_reasoning: ASSESSMENT_NAMES.analytical_reasoning,
  verbal_reasoning: ASSESSMENT_NAMES.verbal_reasoning,
  mathematical_reasoning: ASSESSMENT_NAMES.mathematical_reasoning,
  ai_literacy: ASSESSMENT_NAMES.ai_literacy,
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
  const options = question?.options ?? [];
  const passageText = question ? getQodPassageText(question) : '';
  const renderMath = data?.exam_id === 'mathematical_reasoning';

  return (
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

              <RadioGroup
                value={showResult ? (selectedOptionIndex ?? '') : (selected ?? '')}
                onChange={(e) => {
                  if (showResult || alreadyAnswered) return;
                  setSelected(Number(e.target.value));
                }}
                sx={{ mt: 0.5 }}
              >
                {options.map((opt, idx) => {
                  const isCorrect = showResult && correctOptionIndex === idx;
                  const isWrongPick =
                    showResult &&
                    selectedOptionIndex === idx &&
                    correctOptionIndex != null &&
                    selectedOptionIndex !== correctOptionIndex;
                  const isSelected = !showResult && selected === idx;

                  let borderColor = 'rgba(255,255,255,0.18)';
                  let bg = 'transparent';
                  let letterBg = 'rgba(255,255,255,0.08)';
                  let letterBorder = 'rgba(255,255,255,0.25)';
                  let letterFg = 'rgba(255,255,255,0.7)';
                  let labelColor = 'rgba(255,255,255,0.9)';
                  let statusLabel: string | null = null;

                  if (isCorrect) {
                    borderColor = '#34d399';
                    bg = 'rgba(16, 185, 129, 0.14)';
                    letterBg = '#059669';
                    letterBorder = '#059669';
                    letterFg = '#fff';
                    labelColor = '#d1fae5';
                    statusLabel = 'Correct';
                  } else if (isWrongPick) {
                    borderColor = '#f87171';
                    bg = 'rgba(239, 68, 68, 0.12)';
                    letterBg = '#dc2626';
                    letterBorder = '#dc2626';
                    letterFg = '#fff';
                    labelColor = '#fecaca';
                    statusLabel = 'Your answer';
                  } else if (isSelected) {
                    borderColor = '#a855f7';
                    bg = 'rgba(168, 85, 247, 0.12)';
                    letterBg = '#a855f7';
                    letterBorder = '#a855f7';
                    letterFg = '#fff';
                    labelColor = '#fff';
                  }

                  return (
                    <FormControlLabel
                      key={idx}
                      value={idx}
                      disabled={Boolean(showResult || alreadyAnswered)}
                      control={<Radio sx={{ display: 'none' }} />}
                      onClick={() => {
                        if (showResult || alreadyAnswered) return;
                        setSelected(idx);
                      }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: letterBg,
                              border: `2px solid ${letterBorder}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: letterFg }}>
                              {String.fromCharCode(65 + idx)}
                            </Typography>
                          </Box>
                          <Typography
                            sx={{
                              color: labelColor,
                              fontSize: '0.95rem',
                              fontWeight: isCorrect || isWrongPick || isSelected ? 700 : 500,
                              lineHeight: 1.45,
                              flex: 1,
                            }}
                          >
                            {opt}
                          </Typography>
                          {statusLabel && (
                            <Typography
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                color: isCorrect ? '#6ee7b7' : '#fca5a5',
                                flexShrink: 0,
                              }}
                            >
                              {statusLabel}
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{
                        m: 0,
                        mb: 1.25,
                        p: '12px 14px',
                        borderRadius: 2,
                        border: `2px solid ${borderColor}`,
                        bgcolor: bg,
                        cursor: showResult || alreadyAnswered ? 'default' : 'pointer',
                        alignItems: 'center',
                        opacity: 1,
                        '&.Mui-disabled': { opacity: 1 },
                        transition: 'all 0.15s',
                        '&:hover': showResult || alreadyAnswered ? {} : { borderColor: 'rgba(168, 85, 247, 0.7)' },
                      }}
                    />
                  );
                })}
              </RadioGroup>

              {!showResult && !alreadyAnswered && (
                <Button
                  variant="contained"
                  disabled={selected === null || submitting}
                  onClick={() => void handleSubmit()}
                  sx={{ mt: 1, bgcolor: '#a855f7', fontWeight: 700 }}
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
