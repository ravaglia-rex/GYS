import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  keyframes,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export type StreakBrokenModalProps = {
  open: boolean;
  previousStreak: number;
  onClose: () => void;
};

const fireBounce = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1) rotate(-6deg);
  }
  25% {
    transform: translateY(-14px) scale(1.12) rotate(6deg);
  }
  50% {
    transform: translateY(-4px) scale(1.04) rotate(-4deg);
  }
  75% {
    transform: translateY(-12px) scale(1.1) rotate(5deg);
  }
`;

const fireGlow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 6px rgba(251, 146, 60, 0.55));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(249, 115, 22, 0.95));
  }
`;

const sparkFloat = keyframes`
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.6);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-28px) scale(1.1);
  }
`;

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
          backgroundImage:
            'linear-gradient(160deg, rgba(249,115,22,0.16) 0%, rgba(15,23,42,0.98) 45%)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          overflow: 'visible',
        },
      }}
    >
      <DialogTitle sx={{ color: '#fff', fontWeight: 800, pb: 0.5, pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              position: 'relative',
              width: 72,
              height: 72,
              display: 'grid',
              placeItems: 'center',
              '@media (prefers-reduced-motion: reduce)': {
                '& .streak-fire-emoji, & .streak-fire-spark': {
                  animation: 'none !important',
                },
              },
            }}
          >
            {[
              { left: 8, delay: '0s' },
              { left: 36, delay: '0.35s' },
              { left: 54, delay: '0.7s' },
            ].map((spark) => (
              <Box
                key={spark.left}
                className="streak-fire-spark"
                aria-hidden
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  left: spark.left,
                  fontSize: '0.7rem',
                  lineHeight: 1,
                  animation: `${sparkFloat} 3s ease-out infinite`,
                  animationDelay: spark.delay,
                  pointerEvents: 'none',
                }}
              >
                ✨
              </Box>
            ))}
            <Box
              className="streak-fire-emoji"
              component="span"
              role="img"
              aria-label="fire"
              sx={{
                fontSize: '3rem',
                lineHeight: 1,
                display: 'inline-block',
                transformOrigin: 'center bottom',
                animation: `${fireBounce} 3s ease-in-out infinite, ${fireGlow} 3s ease-in-out infinite`,
              }}
            >
              🔥
            </Box>
          </Box>
          <Typography component="span" sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>
            Streak interrupted
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 1.5, lineHeight: 1.55 }}>
          You missed a day - your{' '}
          <Box component="span" sx={{ color: '#fdba74', fontWeight: 800 }}>
            {days}-day
          </Box>{' '}
          login streak is going to reset.
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.55, fontSize: '0.95rem' }}>
          Restore it today with a Streak Freeze (300 Argus Coins) in the Rewards Shop. Buy in advance
          next time and it auto-saves you when you miss one day.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: 'center' }}>
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
