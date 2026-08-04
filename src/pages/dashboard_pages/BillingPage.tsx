import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';

/** Legacy /payments → Profile → Billing & Payment. */
const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    navigate(`/profile?tab=billing${location.hash || ''}`, { replace: true });
  }, [navigate, location.hash]);

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#8b5cf6' }} />
      </Box>
    </DashboardLayout>
  );
};

export default BillingPage;
