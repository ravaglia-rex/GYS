import React from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { useExamMathTypeset } from './useExamMathTypeset';

type ExamMathTextProps = {
  children: string;
  inline?: boolean;
  sx?: SxProps<Theme>;
};

/**
 * Renders plain text or TeX when wrapped in \( \) or $ $ delimiters.
 * Must be under MathJaxContext (see AssessmentTakePage for mathematical_reasoning).
 *
 * Text is applied via textContent (not React children) so parent re-renders cannot
 * wipe MathJax output and leave raw `$...$` visible.
 */
export const ExamMathText: React.FC<ExamMathTextProps> = ({ children, inline = true, sx }) => {
  const text = children ?? '';
  const mathRef = useExamMathTypeset(text, Boolean(text.trim()));
  if (!text.trim()) return null;

  return (
    <Box
      ref={mathRef}
      component="span"
      data-exam-math-own="1"
      sx={{
        color: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        lineHeight: 1.45,
        display: inline ? 'inline' : 'block',
        ...sx,
      }}
    />
  );
};

export const ExamMathBlock: React.FC<{ children: string; sx?: SxProps<Theme> }> = ({ children, sx }) => {
  const text = children ?? '';
  const mathRef = useExamMathTypeset(text, Boolean(text.trim()));
  if (!text.trim()) return null;

  return (
    <Box sx={{ overflowX: 'auto', ...sx }}>
      <Box
        ref={mathRef}
        component="div"
        data-exam-math-own="1"
        sx={{ fontSize: '0.92rem', lineHeight: 1.65, color: '#334155' }}
      />
    </Box>
  );
};
