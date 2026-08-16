import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import {
  formatDateTime,
  getPlatformAdminTestStudentDayQuestions,
  listPlatformAdminTrackedTestEmails,
  type TestDayQuestionRow,
  type TestStudentDayQuestionsPayload,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminFilterSelectSx,
  platformAdminOutlinedButtonSx,
  platformAdminPageContainerSx,
  platformAdminPrimaryButtonSx,
  platformAdminSelectMenuPaperSx,
} from './platformAdminPageStyles';
import { PlatformAdminPageHeader } from './platformAdminComponents';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { ExamQuestionStimulus } from '../../components/assessment/ExamQuestionStimulus';
import {
  ExamMarkdown,
  ExamRichPrompt,
  looksLikeExamMarkdown,
  shouldRenderStructuredStimulus,
} from '../../components/assessment/ExamMarkdown';
import type { ExamQuestion } from '../../db/assessmentCollection';

function toExamQuestionForStimulus(q: TestDayQuestionRow): ExamQuestion {
  return {
    id: q.item_id,
    prompt: q.prompt,
    options: q.options.map((o) => o.text),
    stimulus: q.stimulus,
    stimulus_type: q.stimulus_type ?? undefined,
  };
}

function todayIstDateInput(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shortExamLabel(id: string): string {
  return id.replace(/_reasoning$/i, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const PlatformAdminTestResultsPage: React.FC = () => {
  const [emails, setEmails] = useState<string[]>(['srishti2k1@gmail.com']);
  const [email, setEmail] = useState('srishti2k1@gmail.com');
  const [customEmail, setCustomEmail] = useState('');
  const [date, setDate] = useState(todayIstDateInput);
  const [loading, setLoading] = useState(false);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TestStudentDayQuestionsPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setEmailsLoading(true);
      try {
        const list = await listPlatformAdminTrackedTestEmails();
        if (cancelled) return;
        if (list.length > 0) {
          setEmails(list);
          setEmail((prev) => (list.includes(prev) ? prev : list[0]));
        }
      } catch {
        /* keep default */
      } finally {
        if (!cancelled) setEmailsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    const target = (customEmail.trim() || email).trim().toLowerCase();
    if (!target.includes('@')) {
      setError('Enter a valid student email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getPlatformAdminTestStudentDayQuestions({ email: target, date });
      setReport(data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error || err?.message || 'Failed to load test results');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [customEmail, email, date]);

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Test Results"
        subtitle="Question-level review for QA / demo accounts (IST calendar day). Same allowlist as Analytics."
      />

      <Card sx={{ ...platformAdminCardSx, mb: 2.5 }}>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr auto' },
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            <FormControl size="small" sx={platformAdminFilterSelectSx(280)} disabled={emailsLoading}>
              <InputLabel id="test-email">Tracked account</InputLabel>
              <Select
                labelId="test-email"
                label="Tracked account"
                value={emails.includes(email) ? email : emails[0] || ''}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setCustomEmail('');
                }}
                MenuProps={{ PaperProps: { sx: platformAdminSelectMenuPaperSx } }}
              >
                {emails.map((em) => (
                  <MenuItem key={em} value={em}>
                    {em}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Or other email"
              placeholder="optional override"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
            />
            <TextField
              size="small"
              label="Date (IST)"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={() => void load()}
              disabled={loading}
              sx={platformAdminPrimaryButtonSx}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ScienceOutlinedIcon />}
            >
              {loading ? 'Loading…' : 'Load day'}
            </Button>
          </Box>
          <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 1.5 }}>
            Add more emails to the tracked list in backend `TRACKED_TEST_STUDENT_EMAILS` when you need
            them regularly.
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !report ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: ip.navy }} />
        </Box>
      ) : null}

      {report && (
        <>
          <Typography sx={{ fontWeight: 700, color: ip.heading, mb: 0.5 }}>
            {report.student_name} · {report.email}
          </Typography>
          <Typography sx={{ color: '#475569', display: 'block', mb: 2, fontSize: 13 }}>
            IST day {report.date_ist} · uid {report.uid} · generated {formatDateTime(report.generated_at)}
          </Typography>

          <Typography sx={{ fontWeight: 800, color: ip.heading, mb: 1.5 }}>
            Official exams ({report.attempts.length})
          </Typography>
          {report.attempts.length === 0 ? (
            <Typography variant="body2" sx={{ color: ip.subtext, mb: 3 }}>
              No official attempts completed/failed this IST day.
            </Typography>
          ) : (
            report.attempts.map((att) => (
              <Card key={att.attempt_id} sx={{ ...platformAdminCardSx, mb: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      alignItems: 'center',
                      mb: 1.5,
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, color: ip.heading }}>
                      {shortExamLabel(att.assessment_id)} · Level {att.proficiency_tier ?? '-'}
                    </Typography>
                    <Chip
                      size="small"
                      label={att.status}
                      sx={{ bgcolor: '#e2e8f0', color: ip.heading, fontWeight: 600 }}
                    />
                    {att.passed === true && (
                      <Chip
                        size="small"
                        label="Passed"
                        sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }}
                      />
                    )}
                    {att.passed === false && (
                      <Chip
                        size="small"
                        label="Failed"
                        sx={{ bgcolor: '#ffedd5', color: '#9a3412', fontWeight: 700 }}
                      />
                    )}
                    {att.score_points != null && (
                      <Chip
                        size="small"
                        label={`${att.score_pct}% (${att.score_points}/1000)`}
                        sx={{
                          bgcolor: '#fff',
                          color: ip.heading,
                          fontWeight: 700,
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: '#475569', display: 'block', mb: 2, fontSize: 13 }}
                  >
                    {formatDateTime(att.completed_at)} · attempt {att.attempt_id}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {att.questions.map((q) => (
                      <Box
                        key={`${att.attempt_id}-${q.item_id}-${q.index}`}
                        sx={{
                          borderTop: '1px solid #e2e8f0',
                          pt: 1.5,
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, color: ip.heading, fontSize: 15, mb: 0.25 }}>
                          Q{q.index}
                        </Typography>
                        <Typography sx={{ color: '#475569', fontSize: 12, mb: 0.75 }}>
                          {q.item_id}
                          {q.family || q.subconstruct
                            ? ` · ${[q.family, q.subconstruct].filter(Boolean).join(' · ')}`
                            : ''}
                        </Typography>
                        <Box sx={{ mb: 1.25 }}>
                          <ExamRichPrompt
                            prompt={q.prompt || ''}
                            stimulus={q.stimulus}
                            stimulusType={q.stimulus_type}
                          />
                        </Box>
                        {shouldRenderStructuredStimulus(q.stimulus, q.stimulus_type) ? (
                          <Box sx={{ mb: 1.25 }}>
                            <ExamQuestionStimulus
                              q={toExamQuestionForStimulus(q)}
                              border="#cbd5e1"
                              variant="light"
                            />
                          </Box>
                        ) : null}
                        {q.options.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1 }}>
                            {q.options.map((opt, optIdx) => {
                              const picked = q.selected_index === optIdx;
                              const keyCorrect = q.correct_index === optIdx;
                              return (
                                <Box
                                  key={`${q.item_id}-${opt.letter}`}
                                  sx={{
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'flex-start',
                                    px: 1.25,
                                    py: 0.85,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: picked
                                      ? q.is_correct === false
                                        ? '#f97316'
                                        : '#16a34a'
                                      : keyCorrect && q.is_correct === false
                                        ? '#86efac'
                                        : '#e2e8f0',
                                    bgcolor: picked
                                      ? q.is_correct === false
                                        ? '#fff7ed'
                                        : '#f0fdf4'
                                      : keyCorrect && q.is_correct === false
                                        ? '#f0fdf4'
                                        : '#f8fafc',
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontWeight: 800,
                                      color: ip.heading,
                                      minWidth: 18,
                                      fontSize: 13,
                                    }}
                                  >
                                    {opt.letter}.
                                  </Typography>
                                  {looksLikeExamMarkdown(opt.text) ? (
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <ExamMarkdown compact>{opt.text}</ExamMarkdown>
                                    </Box>
                                  ) : (
                                    <Typography
                                      sx={{
                                        color: ip.heading,
                                        fontSize: 18,
                                        lineHeight: 1.35,
                                        flex: 1,
                                        letterSpacing: '0.04em',
                                      }}
                                    >
                                      {opt.text}
                                    </Typography>
                                  )}
                                  {picked && (
                                    <Typography
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: 12,
                                        color: q.is_correct === false ? '#c2410c' : '#166534',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      picked
                                    </Typography>
                                  )}
                                  {keyCorrect && !picked && q.is_correct === false && (
                                    <Typography
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: 12,
                                        color: '#166534',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      correct
                                    </Typography>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        ) : (
                          <Typography sx={{ color: '#64748b', fontSize: 13, mb: 1 }}>
                            (No option text stored on this item - often image-only.)
                          </Typography>
                        )}
                        <Typography sx={{ color: '#334155', fontSize: 13, fontWeight: 600 }}>
                          Result:{' '}
                          {q.is_correct === true
                            ? '✓ correct'
                            : q.is_correct === false
                              ? `✗ wrong (picked ${q.selected_letter}${
                                  q.correct_letter ? `, key ${q.correct_letter}` : ''
                                })`
                              : `answered ${q.selected_letter}`}
                          {q.time_spent_sec != null ? ` · ${q.time_spent_sec}s` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}

          <Typography sx={{ fontWeight: 800, color: ip.heading, mb: 1, mt: 1 }}>
            Practice ({report.practice.length})
          </Typography>
          {report.practice.length === 0 ? (
            <Typography variant="body2" sx={{ color: ip.subtext }}>
              No practice outcomes this IST day.
            </Typography>
          ) : (
            <Card sx={platformAdminCardSx}>
              <CardContent>
                {report.practice.map((p, i) => (
                  <Typography
                    key={`${p.exam_id}-${p.item_id}-${i}`}
                    variant="body2"
                    sx={{ color: ip.heading, mb: 0.75 }}
                  >
                    <strong>{shortExamLabel(p.exam_id)}</strong> L{p.level} · {p.item_id} ·{' '}
                    {p.correct === true ? '✓' : p.correct === false ? '✗' : '?'} ·{' '}
                    {formatDateTime(p.occurred_at)}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          )}

          <Button
            sx={{ ...platformAdminOutlinedButtonSx, mt: 2 }}
            onClick={() => void load()}
            disabled={loading}
          >
            Reload
          </Button>
        </>
      )}
    </Box>
  );
};

export default PlatformAdminTestResultsPage;
