import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as Sentry from '@sentry/react';
import { reportQuestionProblem, type QuestionReportPayload } from '../../db/assessmentCollection';

export type QuestionReportFrame =
  | { kind: 'official'; uid: string; attemptId: string }
  | { kind: 'practice'; uid: string; examId: string; level: 1 | 2 | 3 };

export interface QuestionProblemReportProps {
  frame: QuestionReportFrame;
  itemId: string;
  /** Muted accent for link style */
  accent?: string;
}

const MAX_LEN = 4000;

const REPORT_CATEGORIES = [
  { id: 'wrong_key', label: 'Wrong answer key or scoring' },
  { id: 'typo', label: 'Typo or grammar mistake' },
  { id: 'unclear', label: 'Unclear wording or instructions' },
  { id: 'media', label: 'Broken image, diagram, or audio/video' },
  { id: 'technical', label: 'Technical problem (layout, buttons, no response)' },
  { id: 'other', label: 'Something else' },
] as const;

type ReportCategoryId = (typeof REPORT_CATEGORIES)[number]['id'];

function buildReportBody(categoryLabel: string, details: string): string {
  const d = details.trim();
  if (!d) return categoryLabel;
  const combined = `${categoryLabel}\n\n${d}`;
  if (combined.length <= MAX_LEN) return combined;
  const overhead = categoryLabel.length + 2;
  const maxDetails = Math.max(0, MAX_LEN - overhead);
  return `${categoryLabel}\n\n${d.slice(0, maxDetails)}`;
}

export const QuestionProblemReport: React.FC<QuestionProblemReportProps> = ({
  frame,
  itemId,
  accent = '#64748b',
}) => {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<ReportCategoryId | ''>('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => REPORT_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId]
  );

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setDone(false);
    setText('');
    setCategoryId('');
  };

  const handleClose = () => {
    if (sending) return;
    setOpen(false);
  };

  const handleCategoryChange = (id: ReportCategoryId) => {
    setCategoryId(id);
    setError(null);
  };

  const formValid = Boolean(categoryId) && (categoryId !== 'other' || text.trim().length > 0);

  const submit = async () => {
    if (!categoryId || !selectedCategory) {
      setError('Choose the option that best describes the issue.');
      return;
    }
    if (categoryId === 'other' && !text.trim()) {
      setError('Please describe the issue for “Something else”.');
      return;
    }
    const body = buildReportBody(selectedCategory.label, text);
    if (!body.trim()) {
      setError('Please describe the issue briefly.');
      return;
    }
    setSending(true);
    setError(null);
    let payload: QuestionReportPayload;
    if (frame.kind === 'official') {
      payload = {
        source: 'official',
        uid: frame.uid,
        attempt_id: frame.attemptId,
        item_id: itemId,
        text: body,
      };
    } else {
      payload = {
        source: 'practice',
        uid: frame.uid,
        exam_id: frame.examId,
        level: frame.level,
        item_id: itemId,
        text: body,
      };
    }
    try {
      await reportQuestionProblem(payload);
      setDone(true);
    } catch (e) {
      Sentry.captureException(e);
      setError('Could not send your report. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed rgba(148,163,184,0.45)' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}>
          Something wrong with this item?
        </Typography>
        <Link
          component="button"
          type="button"
          variant="caption"
          onClick={handleOpen}
          sx={{
            cursor: 'pointer',
            color: accent,
            fontWeight: 600,
            textDecoration: 'underline',
            textUnderlineOffset: 2,
            border: 'none',
            background: 'none',
            p: 0,
            font: 'inherit',
          }}
        >
          Report a problem
        </Link>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        slotProps={{
          backdrop: {
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.72)' },
          },
          paper: {
            sx: {
              bgcolor: '#1e293b',
              backgroundImage: 'none',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)',
            },
          },
        }}
      >
        {!done && (
          <DialogTitle sx={{ fontWeight: 800, color: 'text.primary', pb: 1 }}>Report a problem</DialogTitle>
        )}
        <DialogContent
          sx={
            done
              ? {
                  pt: 2,
                  pb: 1.25,
                }
              : undefined
          }
        >
          {done ? (
            <>
              <Typography
                component="h2"
                variant="h6"
                sx={{ fontWeight: 800, color: 'text.primary', m: 0, mb: 1.25, fontSize: '1.25rem', lineHeight: 1.3 }}
              >
                Thanks!
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.75,
                  py: 2.75,
                  borderRadius: 1,
                  bgcolor: 'rgba(34, 197, 94, 0.14)',
                  border: '1px solid rgba(74, 222, 128, 0.35)',
                }}
              >
                <CheckCircleIcon sx={{ color: '#4ade80', fontSize: 26, flexShrink: 0 }} aria-hidden />
                <Typography variant="body2" component="p" sx={{ color: '#d1fae5', lineHeight: 1.55, m: 0 }}>
                  Thanks — your report was submitted. Your feedback is saved on this question for review.
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
                Pick the main issue, then add optional details. Your feedback is saved on this question for review.
              </Typography>
              <FormControl component="fieldset" variant="standard" fullWidth sx={{ mb: 2 }}>
                <FormLabel component="legend" sx={{ color: 'text.primary', fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
                  What kind of issue is it?
                </FormLabel>
                <RadioGroup
                  name="report-category"
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value as ReportCategoryId)}
                >
                  {REPORT_CATEGORIES.map((opt) => (
                    <FormControlLabel
                      key={opt.id}
                      value={opt.id}
                      control={
                        <Radio
                          size="small"
                          color="primary"
                          sx={{
                            p: 1,
                            alignSelf: 'center',
                            '& .MuiSvgIcon-root': { fontSize: 20 },
                          }}
                        />
                      }
                      label={opt.label}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mx: 0,
                        mb: 1,
                        py: 1.25,
                        px: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: categoryId === opt.id ? 'primary.main' : 'rgba(255, 255, 255, 0.12)',
                        bgcolor: categoryId === opt.id ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'border-color 0.15s ease, background-color 0.15s ease',
                        '&:hover': {
                          borderColor: categoryId === opt.id ? 'primary.main' : 'rgba(255, 255, 255, 0.22)',
                        },
                        '& .MuiFormControlLabel-label': {
                          color: 'text.primary',
                          fontSize: '0.9375rem',
                          lineHeight: 1.45,
                          paddingTop: 0,
                          paddingBottom: 0,
                        },
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                {categoryId === 'other'
                  ? 'Describe what’s wrong (required for this option).'
                  : 'Optional: specifics help us fix it faster.'}
              </Typography>
              <TextField
                autoFocus={categoryId === 'other'}
                fullWidth
                multiline
                minRows={3}
                placeholder={categoryId === 'other' ? 'Describe the issue…' : 'Add details (optional)…'}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                disabled={sending || !categoryId}
                inputProps={{ maxLength: MAX_LEN }}
                sx={{
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  },
                }}
              />
            </>
          )}
          {error && !done && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {!done && categoryId ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Details: {text.length} / {MAX_LEN}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            gap: 1,
            justifyContent: 'flex-end',
            ...(done ? { pt: 0.75, pb: 2 } : { pb: 2 }),
          }}
        >
          <Button
            onClick={handleClose}
            disabled={sending}
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 1,
              ...(done
                ? {
                    color: 'text.primary',
                    bgcolor: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)' },
                  }
                : {
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                  }),
            }}
          >
            {done ? 'Close' : 'Cancel'}
          </Button>
          {!done && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => void submit()}
              disabled={sending || !formValid}
              sx={{
                fontWeight: 700,
                '&.Mui-disabled': {
                  bgcolor: 'rgba(139, 92, 246, 0.35)',
                  color: 'rgba(255, 255, 255, 0.88)',
                },
              }}
            >
              {sending ? <CircularProgress size={22} color="inherit" /> : 'Submit report'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
