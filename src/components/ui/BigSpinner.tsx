import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { LoadingSpinner } from './spinner';

type BigSpinnerProps = {
  label?: string;
  size?: number;
  /** Full-page centering for routes/layouts; inline for sections/widgets. */
  variant?: 'page' | 'inline';
  /** After this many ms on a page spinner, show an explicit Reload control. */
  slowMs?: number;
};

const BigSpinner: React.FC<BigSpinnerProps> = ({
  label = 'Loading...',
  size = 72,
  variant = 'page',
  slowMs = 8000,
}) => {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if (variant !== 'page') return;
    const t = window.setTimeout(() => setShowReload(true), slowMs);
    return () => window.clearTimeout(t);
  }, [variant, slowMs]);

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
        textAlign: 'center',
        px: 3,
        ...(variant === 'page'
          ? {
              minHeight: '100vh',
              bgcolor: '#0f172a',
              color: 'rgba(255, 255, 255, 0.9)',
            }
          : {
              // Brand purple stays visible on light and dark section backgrounds.
              minHeight: 240,
              py: 4,
              color: '#8b5cf6',
            }),
      }}
    >
      <LoadingSpinner size={size} />
      <Typography component="span" sx={{ fontWeight: 600, letterSpacing: '0.02em', color: 'inherit' }}>
        {label}
      </Typography>
      {variant === 'page' && showReload && (
        <>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 360 }}>
            This is taking longer than usual. Reloading often fixes it.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#8b5cf6',
              '&:hover': { bgcolor: '#7c3aed' },
            }}
          >
            Reload page
          </Button>
        </>
      )}
    </Box>
  );
};

export default BigSpinner;
