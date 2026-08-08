import React from 'react';
import { Box, Button, Typography } from '@mui/material';

type RouteErrorFallbackProps = {
  error?: unknown;
  resetError?: () => void;
};

/** Visible recovery UI when a route/render crash would otherwise leave a blank page. */
const RouteErrorFallback: React.FC<RouteErrorFallbackProps> = ({ resetError }) => {
  const reload = () => {
    if (resetError) resetError();
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 3,
        bgcolor: '#0f172a',
        color: '#e2e8f0',
        textAlign: 'center',
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
        Something went wrong loading this page
      </Typography>
      <Typography sx={{ color: '#94a3b8', maxWidth: 420, fontSize: '0.95rem' }}>
        This can happen after an update. Reloading usually fixes it.
      </Typography>
      <Button
        variant="contained"
        onClick={reload}
        sx={{
          mt: 1,
          textTransform: 'none',
          fontWeight: 700,
          bgcolor: '#8b5cf6',
          '&:hover': { bgcolor: '#7c3aed' },
        }}
      >
        Reload page
      </Button>
    </Box>
  );
};

export default RouteErrorFallback;
