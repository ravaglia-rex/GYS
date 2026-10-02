import React from 'react';
import { Box, Typography } from '@mui/material';

const ClearedAchievementBanner: React.FC<{ label: string }> = ({ label }) => (
  <Box
    sx={{
      mb: 2,
      px: 2,
      py: 1.75,
      borderRadius: 2.5,
      display: 'flex',
      alignItems: 'center',
      gap: 1.75,
      background:
        'radial-gradient(circle at 12% 0%, rgba(253, 224, 71, 0.34), transparent 46%), linear-gradient(135deg, rgba(120, 53, 15, 0.72) 0%, rgba(15, 23, 42, 0.35) 58%, rgba(6, 95, 70, 0.55) 100%)',
      border: '1px solid rgba(251, 191, 36, 0.72)',
      boxShadow: '0 10px 28px rgba(245, 158, 11, 0.16)',
    }}
  >
    <Box
      aria-hidden
      sx={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.85rem',
        lineHeight: 1,
        background: 'linear-gradient(160deg, #fef3c7 0%, #fbbf24 48%, #d97706 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 6px 14px rgba(245, 158, 11, 0.4)',
      }}
    >
      👑
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: '#fcd34d',
          fontWeight: 800,
          fontSize: '0.72rem',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        Achievement
      </Typography>
      <Typography sx={{ color: '#fffbeb', fontWeight: 900, fontSize: '1.08rem', lineHeight: 1.3, mt: 0.2 }}>
        You cleared {label}!
      </Typography>
      <Typography sx={{ color: '#fde68a', fontSize: '0.86rem', fontWeight: 700, mt: 0.3 }}>
        Nice work! You earned this. Be proud of it.
      </Typography>
    </Box>
  </Box>
);

export default ClearedAchievementBanner;
