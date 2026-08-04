import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';

/** Legacy /settings → Profile. */
const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let tab = params.get('tab') || 'about';
    if (tab === 'profile') tab = 'about';
    navigate(`/profile?tab=${tab}${location.hash || ''}`, { replace: true });
  }, [navigate, location.search, location.hash]);

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#8b5cf6' }} />
      </Box>
    </DashboardLayout>
  );
};

export default SettingsPage;
