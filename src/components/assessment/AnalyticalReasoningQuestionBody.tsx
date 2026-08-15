import React from 'react';
import { Box, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import type { ExamQuestion } from '../../db/assessmentCollection';
import { ExamMarkdown } from './ExamMarkdown';

interface AnalyticalReasoningQuestionBodyProps {
  question: ExamQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | null;
  onSelectOption: (i: number) => void;
  theme: 'blue' | 'purple';
  footer?: React.ReactNode;
  selectionLocked?: boolean;
  /** When true (adaptive exams), omit "of N" because length can change mid-attempt. */
  hideQuestionTotal?: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

/**
 * Markdown + SVG renderer for Analytical Reasoning items.
 * Option figures are baked into body_markdown; the control below is a
 * letter picker only - never shuffle these options.
 */
export const AnalyticalReasoningQuestionBody: React.FC<AnalyticalReasoningQuestionBodyProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  theme,
  footer,
  selectionLocked = false,
  hideQuestionTotal = false,
}) => {
  const primary = theme === 'purple' ? '#7b1fa2' : '#0d47a1';
  const primarySoft = theme === 'purple' ? 'rgba(123,31,162,0.08)' : 'rgba(13,71,161,0.06)';
  const borderMuted = '#e2e8f0';
  const optionIds =
    question.option_ids && question.option_ids.length >= 2
      ? question.option_ids
      : question.options && question.options.length >= 2
        ? question.options
        : [...OPTION_LETTERS];
  const markdown = question.body_markdown ?? question.prompt ?? '';

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="caption"
        sx={{
          color: '#64748b',
          fontWeight: 700,
          letterSpacing: 1,
          display: 'block',
          mb: 1.5,
          textTransform: 'uppercase',
          fontSize: '0.68rem',
        }}
      >
        {hideQuestionTotal ? `Question ${questionNumber}` : `Question ${questionNumber} of ${totalQuestions}`}
      </Typography>
      <Box sx={{ mb: 2.5 }}>
        <ExamMarkdown>{markdown}</ExamMarkdown>
      </Box>
      <FormControl component="fieldset" fullWidth>
        <RadioGroup
          value={selectedOption !== null ? String(selectedOption) : ''}
          onChange={(e) => {
            if (selectionLocked) return;
            onSelectOption(parseInt(e.target.value, 10));
          }}
        >
          {optionIds.map((label, idx) => {
            const selected = selectedOption === idx;
            const rowBorder = selected ? primary : borderMuted;
            const rowBg = selected ? primarySoft : '#fff';
            const letterBg = selected ? primary : '#f1f5f9';
            const letterBorder = selected ? primary : borderMuted;
            const letterFg = selected ? '#fff' : '#64748b';
            const letter = String.fromCharCode(65 + idx);
            return (
              <FormControlLabel
                key={`${label}-${idx}`}
                value={String(idx)}
                control={<Radio sx={{ display: 'none' }} />}
                onClick={() => {
                  if (selectionLocked) return;
                  onSelectOption(idx);
                }}
                aria-label={`Option ${letter}`}
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
                        {letter}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: selected ? '#0f172a' : '#475569',
                        fontSize: '0.92rem',
                        fontWeight: selected ? 700 : 500,
                        lineHeight: 1.45,
                      }}
                    >
                      Option {letter}
                    </Typography>
                  </Box>
                }
                sx={{
                  m: 0,
                  mb: 1.25,
                  p: '14px 16px',
                  borderRadius: 2,
                  border: `2px solid ${rowBorder}`,
                  bgcolor: rowBg,
                  cursor: selectionLocked ? 'default' : 'pointer',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                  '&:hover': selectionLocked ? {} : { borderColor: `${primary}99` },
                }}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
      {footer}
    </Box>
  );
};
