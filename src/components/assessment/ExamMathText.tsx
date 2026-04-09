import React from 'react';
import { MathJax } from 'better-react-mathjax';
import { Box, type SxProps, type Theme } from '@mui/material';

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
  if (!text.trim()) return null;

  return (
    <MathJax inline={inline} dynamic>
      <Box
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
    </MathJax>
  );
};

export const ExamMathBlock: React.FC<{ children: string; sx?: SxProps<Theme> }> = ({ children, sx }) => (
  <Box sx={{ overflowX: 'auto', ...sx }}>
    <MathJax dynamic>
      <Box
        component="div"
        sx={{ fontSize: '0.92rem', lineHeight: 1.65, color: '#334155', fontStyle: 'italic' }}
      >
        {children}
      </Box>
    </MathJax>
  </Box>
);
