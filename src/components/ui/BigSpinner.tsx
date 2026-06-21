import React from 'react';
import { Box, Typography } from '@mui/material';
import { LoadingSpinner } from './spinner';

type BigSpinnerProps = {
  label?: string;
  size?: number;
  /** Full-page centering for routes/layouts; inline for sections/widgets. */
  variant?: 'page' | 'inline';
};

const BigSpinner: React.FC<BigSpinnerProps> = ({
  label = 'Loading...',
  size = 72,
  variant = 'page',
}) => {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        color: 'rgba(255, 255, 255, 0.86)',
        textAlign: 'center',
        ...(variant === 'page'
          ? {
              minHeight: { xs: 'calc(100vh - 120px)', md: 'calc(100vh - 96px)' },
            }
          : {
              minHeight: 240,
              py: 4,
            }),
      }}
    >
      <LoadingSpinner size={size} />
      <Typography component="span" sx={{ fontWeight: 600, letterSpacing: '0.02em' }}>
        {label}
      </Typography>
    </Box>
  );
};

export default BigSpinner;
