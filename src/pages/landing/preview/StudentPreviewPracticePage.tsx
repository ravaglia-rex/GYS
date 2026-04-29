import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { FlaskConical } from 'lucide-react';

const StudentPreviewPracticePage: React.FC = () => {
  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #a78bfa, #38bdf8)',
            color: 'white',
          }}
        >
          <FlaskConical size={28} />
        </Avatar>
        <Box>
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #a78bfa, #38bdf8)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Practice Mode
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', mt: 0.5, maxWidth: 640 }}>
            Same &quot;coming soon&quot; state as the signed-in portal. After registration, use Practice Mode from your
            dashboard to warm up with a separate question pool (no effect on official scores).
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          borderRadius: 2,
          p: 3,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1.5 }}>
          Coming soon
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          We are building practice modes so you can build confidence at your own pace. Check back after your next
          portal update.
        </Typography>
      </Box>
    </Box>
  );
};

export default StudentPreviewPracticePage;
