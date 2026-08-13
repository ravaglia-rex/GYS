import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import WhatshotIcon from '@mui/icons-material/Whatshot';

export type StreakBrokenModalProps = {
  open: boolean;
  previousStreak: number;
  onClose: () => void;
};

const StreakBrokenModal: React.FC<StreakBrokenModalProps> = ({
  open,
  previousStreak,
  onClose,
}) => {
  const navigate = useNavigate();
  const days = Math.max(0, Math.floor(previousStreak));

  const goToShop = () => {
    onClose();
    navigate('/rewards');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: '#0f172a',
          border: '1px solid rgba(249, 115, 22, 0.45)',
          backgroundImage: 'linear-gradient(160deg, rgba(249,115,22,0.16) 0%, rgba(15,23,42,0.98) 45%)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        },
      }}
    >
      <DialogTitle sx={{ color: '#fff', fontWeight: 800, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(249, 115, 22, 0.2)',
              border: '1px solid rgba(249, 115, 22, 0.5)',
            }}
          >
            <WhatshotIcon sx={{ color: '#fb923c' }} />
          </Box>
          Streak interrupted
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 1.5, lineHeight: 1.55 }}>
          You missed a day — your{' '}
          <Box component="span" sx={{ color: '#fdba74', fontWeight: 800 }}>
            {days}-day
          </Box>{' '}
          login streak reset.
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.55, fontSize: '0.95rem' }}>
          Restore it today with a Streak Freeze (300 Argus Coins) in the Rewards Shop. Buy in advance
          next time and it auto-saves you when you miss one day.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Dismiss
        </Button>
        <Button
          variant="contained"
          onClick={goToShop}
          sx={{
            bgcolor: '#ea580c',
            fontWeight: 700,
            '&:hover': { bgcolor: '#c2410c' },
          }}
        >
          Go to Rewards Shop
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StreakBrokenModal;
