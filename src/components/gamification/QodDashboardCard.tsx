import React from 'react';
import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { useNavigate } from 'react-router-dom';

type QodDashboardCardProps = {
  qodStreak: number;
  alreadyAnswered?: boolean;
  preview?: boolean;
};

const QodDashboardCard: React.FC<QodDashboardCardProps> = ({
  qodStreak,
  alreadyAnswered,
  preview = false,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.12) 100%)',
        border: '1px solid rgba(168,85,247,0.35)',
      }}
    >
      <CardContent sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <LightbulbIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
              Question of the Day
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              {alreadyAnswered
                ? 'Great job - you completed today\'s challenge!'
                : 'Answer today\'s question to earn Argus Coins and grow your streak.'}
            </Typography>
            <Chip label={`${qodStreak} day streak`} size="small" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.12)', color: 'white' }} />
          </Box>
        </Box>
        <Button
          variant="contained"
          disabled={preview}
          onClick={() => navigate('/question-of-the-day')}
          sx={{ bgcolor: '#a855f7', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          {alreadyAnswered ? 'View result' : 'Solve now'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QodDashboardCard;
