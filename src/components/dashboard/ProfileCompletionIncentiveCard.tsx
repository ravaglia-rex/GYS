import React from 'react';
import { Box, Button, Card, CardContent, LinearProgress, Typography } from '@mui/material';
import { Coins, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ProfileCompletionSnapshot } from '../../utils/profileCompletion';

type ProfileCompletionIncentiveCardProps = {
  completion: ProfileCompletionSnapshot;
  /** Preview / sample dashboards should not navigate to live profile. */
  preview?: boolean;
};

const ProfileCompletionIncentiveCard: React.FC<ProfileCompletionIncentiveCardProps> = ({
  completion,
  preview = false,
}) => {
  const navigate = useNavigate();

  if (completion.complete) return null;

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(16,185,129,0.08) 100%)',
        border: '1px solid rgba(234,179,8,0.32)',
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: '1 1 240px' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'rgba(234,179,8,0.18)',
              border: '1px solid rgba(253,224,71,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fde68a',
              flexShrink: 0,
            }}
          >
            <UserRound size={22} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', fontSize: '1.05rem' }}>
              Profile {completion.percent}% complete
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mb: 1.25 }}>
              Complete your details to earn{' '}
              <Box component="span" sx={{ color: '#fde68a', fontWeight: 700 }}>
                {completion.reward_coins} Argus Coins
              </Box>
              .
            </Typography>
            <LinearProgress
              variant="determinate"
              value={completion.percent}
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: 'rgba(255,255,255,0.12)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #eab308 0%, #10b981 100%)',
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.55)', mt: 0.75, display: 'block' }}
            >
              {completion.filled} of {completion.total} fields filled · Reach 100% for{' '}
              {completion.reward_coins} coins
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Coins size={16} />}
          disabled={preview}
          onClick={() => navigate('/profile')}
          sx={{
            bgcolor: 'rgba(234,179,8,0.9)',
            color: '#111827',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            '&:hover': { bgcolor: 'rgba(202,138,4,0.95)', boxShadow: 'none' },
            '&.Mui-disabled': { bgcolor: 'rgba(234,179,8,0.4)', color: 'rgba(17,24,39,0.6)' },
          }}
        >
          Complete profile
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionIncentiveCard;
