import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Box } from '@mui/material';
import { RootState } from '../../state_data/reducer';
import { auth } from '../../firebase/firebase';
import { canAccessPlatformAdminAnalytics } from '../../utils/platformAdminAnalyticsAccess';
import PlatformAdminRoute from './PlatformAdminRoute';

interface PlatformAdminAnalyticsRouteProps {
  children: ReactNode;
}

const PlatformAdminAnalyticsRoute: React.FC<PlatformAdminAnalyticsRouteProps> = ({ children }) => {
  const userEmail =
    useSelector((state: RootState) => state.auth.user?.email) ?? auth.currentUser?.email ?? '';

  return (
    <PlatformAdminRoute>
      {canAccessPlatformAdminAnalytics(userEmail) ? (
        children
      ) : (
        <Box sx={{ p: 4, maxWidth: 480, mx: 'auto', mt: 8 }}>
          <Alert severity="error">This Analytics section is restricted.</Alert>
        </Box>
      )}
    </PlatformAdminRoute>
  );
};

export default PlatformAdminAnalyticsRoute;
