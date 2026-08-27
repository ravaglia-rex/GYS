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
 */
export const ExamMathText: React.FC<ExamMathTextProps> = ({ children, inline = true, sx }) => {
  const text = children ?? '';
  const mathRef = useExamMathTypeset(text, Boolean(text.trim()));
  if (!text.trim()) return null;

  return (
    <Box
      ref={mathRef}
      component="span"
      sx={{
        color: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        lineHeight: 1.45,
        display: inline ? 'inline' : 'block',
        ...sx,
      }}
    >
      {text}
    </Box>
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
        sx={{ fontSize: '0.92rem', lineHeight: 1.65, color: '#334155', fontStyle: 'italic' }}
      >
        {text}
      </Box>
    </Box>
  );
};
