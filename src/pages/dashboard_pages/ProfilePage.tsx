import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Box, Typography, Button, Avatar } from '@mui/material';
import { User, Settings } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to settings page
    navigate('/settings', { replace: true });
  }, [navigate]);

  // Fallback content while redirecting
  return (
    <DashboardLayout>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <Avatar sx={{
          width: 120,
          height: 120,
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          color: 'white',
          fontSize: '3rem',
          fontWeight: 600,
          mb: 3
        }}>
          <User size={48} />
        </Avatar>
        
        <Typography variant="h4" sx={{ 
          color: 'white', 
          fontWeight: 600, 
          mb: 2,
          background: 'linear-gradient(45deg, #10b981, #3b82f6)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Profile Management
        </Typography>
        
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3, maxWidth: 500 }}>
          Your profile has been moved to our new comprehensive settings system. 
          You'll be redirected there automatically.
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<Settings size={16} />}
          onClick={() => navigate('/settings')}
          sx={{
            backgroundColor: '#8b5cf6',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            '&:hover': { backgroundColor: '#7c3aed' }
          }}
        >
          Go to Settings
        </Button>
      </Box>
    </DashboardLayout>
  );
};

export default ProfilePage;
