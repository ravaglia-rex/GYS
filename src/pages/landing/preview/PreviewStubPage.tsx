import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { institutionalPalette as ip } from '../../../theme/institutionalPalette';

export interface PreviewStubPageProps {
  title: string;
  body: string;
  backLabel?: string;
  backPath: string;
}

/**
 * Placeholder for preview routes that do not yet mirror a full signed-in page (same chrome as live: light background).
 */
const PreviewStubPage: React.FC<PreviewStubPageProps> = ({ title, body, backLabel = 'Back to Overview', backPath }) => {
  const navigate = useNavigate();
  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: ip.heading, mb: 1.5 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: ip.subtext, lineHeight: 1.7, mb: 3 }}>
        {body}
      </Typography>
      <Button
        variant="outlined"
        onClick={() => navigate(backPath)}
        sx={{ textTransform: 'none', fontWeight: 600, borderColor: ip.navy, color: ip.navy }}
      >
        {backLabel}
      </Button>
    </Box>
  );
};

export default PreviewStubPage;
