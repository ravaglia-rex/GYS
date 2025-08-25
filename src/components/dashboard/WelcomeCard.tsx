import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

interface WelcomeCardProps {
  userName?: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ userName = 'Student' }) => {
  return (
    <Card 
      sx={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                color: 'white', 
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Welcome back 👋
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'white', 
                fontWeight: 600,
                mb: 2
              }}
            >
              {userName}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.1rem',
                lineHeight: 1.6
              }}
            >
              Ready to take your next exam? View available assessments, track your progress, 
              and manage your exam schedule all in one place.
            </Typography>
          </Box>
          <Box sx={{ ml: 3 }}>
            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(45deg, #059669, #2563eb)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              View Exams
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;
