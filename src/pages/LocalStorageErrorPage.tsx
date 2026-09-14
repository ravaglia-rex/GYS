import React from 'react';
import { Box, Typography, Button } from '@mui/material';

/**
 * Shown when the browser blocks localStorage (e.g. Safari private mode).
 * Route guards redirect here instead of continuing with a broken session.
 */
const LocalStorageErrorPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 480, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
          Browser storage is unavailable
        </Typography>
        <Typography sx={{ color: '#475569', mb: 3 }}>
          Argus needs local storage to keep you signed in. This often happens in private /
          incognito browsing or when storage is blocked. Please switch to a normal browser
          window and try again.
        </Typography>
        <Button variant="contained" href="/" sx={{ textTransform: 'none' }}>
          Go to home
        </Button>
      </Box>
    </Box>
  );
};

export default LocalStorageErrorPage;
