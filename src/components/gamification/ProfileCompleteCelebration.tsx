import React, { useEffect } from 'react';
import { Box, Button, Modal, Typography, keyframes } from '@mui/material';
import { Coins } from 'lucide-react';

export type ProfileCompleteCelebrationProps = {
  open: boolean;
  coinsAwarded: number;
  onClose: () => void;
};

const backdropIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const orbPop = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(-12deg);
  }
  55% {
    opacity: 1;
    transform: scale(1.18) rotate(4deg);
  }
  75% {
    transform: scale(0.94) rotate(-2deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
`;

const ringPulse = keyframes`
  0% {
    opacity: 0.7;
    transform: scale(0.7);
  }
  100% {
    opacity: 0;
    transform: scale(1.85);
  }
`;

const coinBurst = keyframes`
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.35) rotate(0deg);
  }
  18% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), var(--dy)) scale(1.05) rotate(var(--spin));
  }
`;

const textRise = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0%, 100% { filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.45)); }
  50% { filter: drop-shadow(0 0 18px rgba(250, 204, 21, 0.9)); }
`;

const COIN_BURSTS: Array<{ dx: string; dy: string; spin: string; delay: string; size: number }> = [
  { dx: '-88px', dy: '-96px', spin: '-40deg', delay: '0.28s', size: 22 },
  { dx: '92px', dy: '-88px', spin: '48deg', delay: '0.34s', size: 20 },
  { dx: '-110px', dy: '12px', spin: '-70deg', delay: '0.4s', size: 18 },
  { dx: '108px', dy: '8px', spin: '62deg', delay: '0.36s', size: 19 },
  { dx: '-56px', dy: '92px', spin: '-28deg', delay: '0.44s', size: 17 },
  { dx: '60px', dy: '98px', spin: '34deg', delay: '0.48s', size: 18 },
  { dx: '0px', dy: '-118px', spin: '12deg', delay: '0.3s', size: 24 },
  { dx: '-34px', dy: '-70px', spin: '-18deg', delay: '0.5s', size: 15 },
  { dx: '40px', dy: '-74px', spin: '22deg', delay: '0.52s', size: 15 },
];

const ProfileCompleteCelebration: React.FC<ProfileCompleteCelebrationProps> = ({
  open,
  coinsAwarded,
  onClose,
}) => {
  const coins = Math.max(0, Math.floor(coinsAwarded));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="profile-complete-celebration-title"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(2, 6, 23, 0.72)',
            backdropFilter: 'blur(6px)',
            animation: `${backdropIn} 0.35s ease-out both`,
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          },
        },
      }}
    >
      <Box
        role="dialog"
        aria-modal="true"
        sx={{
          position: 'relative',
          outline: 'none',
          width: 'min(100%, 420px)',
          borderRadius: 4,
          px: { xs: 2.5, sm: 3.5 },
          py: { xs: 3.5, sm: 4 },
          textAlign: 'center',
          bgcolor: '#0b1220',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.22) 0%, transparent 55%), linear-gradient(165deg, rgba(16,185,129,0.12) 0%, rgba(11,18,32,0.98) 48%)',
          boxShadow: '0 28px 80px rgba(0,0,0,0.55)',
          overflow: 'visible',
          animation: `${textRise} 0.45s ease-out both`,
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            '& .pcc-orb, & .pcc-ring, & .pcc-coin, & .pcc-copy, & .pcc-cta': {
              animation: 'none !important',
              opacity: '1 !important',
              transform: 'none !important',
            },
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 120,
            height: 120,
            mx: 'auto',
            mb: 2.5,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {[0, 1].map((i) => (
            <Box
              key={i}
              className="pcc-ring"
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 8,
                borderRadius: '50%',
                border: '2px solid rgba(250, 204, 21, 0.55)',
                animation: `${ringPulse} 1.4s ease-out infinite`,
                animationDelay: `${0.35 + i * 0.45}s`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {COIN_BURSTS.map((burst, idx) => (
            <Box
              key={idx}
              className="pcc-coin"
              aria-hidden
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                ml: `-${burst.size / 2}px`,
                mt: `-${burst.size / 2}px`,
                width: burst.size,
                height: burst.size,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 30% 30%, #fef08a 0%, #eab308 45%, #ca8a04 100%)',
                border: '1px solid rgba(253, 224, 71, 0.85)',
                boxShadow: '0 2px 8px rgba(234, 179, 8, 0.45)',
                ['--dx' as string]: burst.dx,
                ['--dy' as string]: burst.dy,
                ['--spin' as string]: burst.spin,
                animation: `${coinBurst} 1.15s cubic-bezier(0.2, 0.8, 0.2, 1) both`,
                animationDelay: burst.delay,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          ))}

          <Box
            className="pcc-orb"
            sx={{
              position: 'relative',
              zIndex: 2,
              width: 88,
              height: 88,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background:
                'radial-gradient(circle at 35% 30%, #fde68a 0%, #eab308 42%, #059669 100%)',
              border: '2px solid rgba(253, 224, 71, 0.7)',
              boxShadow: '0 12px 40px rgba(234, 179, 8, 0.35)',
              animation: `${orbPop} 0.7s cubic-bezier(0.34, 1.45, 0.64, 1) both, ${shimmer} 2.2s ease-in-out 0.7s infinite`,
              color: '#111827',
            }}
          >
            <Coins size={40} strokeWidth={2.4} />
          </Box>
        </Box>

        <Typography
          id="profile-complete-celebration-title"
          className="pcc-copy"
          sx={{
            color: '#fff',
            fontWeight: 900,
            fontSize: { xs: '1.55rem', sm: '1.75rem' },
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            mb: 1,
            animation: `${textRise} 0.5s ease-out both`,
            animationDelay: '0.55s',
          }}
        >
          100% complete!
        </Typography>

        <Typography
          className="pcc-copy"
          sx={{
            color: 'rgba(255,255,255,0.78)',
            fontSize: '1rem',
            lineHeight: 1.5,
            mb: 1.25,
            animation: `${textRise} 0.5s ease-out both`,
            animationDelay: '0.7s',
          }}
        >
          Your profile is fully complete! Nice work!
        </Typography>

        <Box
          className="pcc-copy"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 1.75,
            py: 0.85,
            mb: 2.75,
            borderRadius: 999,
            bgcolor: 'rgba(234,179,8,0.16)',
            border: '1px solid rgba(234,179,8,0.45)',
            color: '#fde68a',
            fontWeight: 800,
            fontSize: '1.05rem',
            animation: `${textRise} 0.5s ease-out both`,
            animationDelay: '0.85s',
          }}
        >
          <Coins size={18} />
          +{coins.toLocaleString()} Argus Coins awarded
        </Box>

        <Box
          className="pcc-cta"
          sx={{
            animation: `${textRise} 0.45s ease-out both`,
            animationDelay: '1s',
          }}
        >
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              px: 3.5,
              py: 1.15,
              fontWeight: 800,
              borderRadius: 999,
              bgcolor: '#eab308',
              color: '#111827',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#ca8a04', boxShadow: 'none' },
            }}
          >
            Awesome
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ProfileCompleteCelebration;
