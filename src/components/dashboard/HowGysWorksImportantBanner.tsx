import React from 'react';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';
import { useHowGysWorksAck } from '../../utils/howGysWorksAck';

type HowGysWorksImportantBannerProps = {
  uid: string;
};

const HowGysWorksImportantBanner: React.FC<HowGysWorksImportantBannerProps> = ({ uid }) => {
  const navigate = useNavigate();
  const { showBanner, visited, acknowledge, pending } = useHowGysWorksAck(uid);

  if (!showBanner) return null;

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(251,146,60,0.10) 0%, rgba(239,68,68,0.06) 100%)',
        border: '1px solid rgba(251,146,60,0.28)',
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'rgba(251,146,60,0.18)',
              border: '1px solid rgba(253,186,116,0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fdba74',
              flexShrink: 0,
            }}
          >
            <ErrorOutlineIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
              Important
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Please read the How GYS Works section before continuing.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/how-it-works')}
            sx={{
              bgcolor: 'rgba(234,88,12,0.85)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: 'none',
              '&:hover': { bgcolor: 'rgba(194,65,12,0.95)', boxShadow: 'none' },
            }}
          >
            Read How GYS Works
          </Button>
          <Button
            variant="outlined"
            disabled={!visited || pending}
            onClick={() => void acknowledge()}
            sx={{
              fontWeight: 700,
              whiteSpace: 'nowrap',
              borderColor: visited ? 'rgba(253,186,116,0.45)' : 'rgba(255,255,255,0.12)',
              color: visited ? '#fdba74' : 'rgba(255,255,255,0.35)',
              '&.Mui-disabled': {
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.28)',
              },
              '&:hover': {
                borderColor: 'rgba(253,186,116,0.7)',
                bgcolor: 'rgba(251,146,60,0.08)',
              },
            }}
          >
            I&apos;ve read it
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HowGysWorksImportantBanner;
