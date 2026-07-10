import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Box } from '@mui/material';
import { RootState } from '../../state_data/reducer';
import PlatformAdminRoute from './PlatformAdminRoute';

interface PlatformAdminSuperRouteProps {
  children: ReactNode;
}

const PlatformAdminSuperRoute: React.FC<PlatformAdminSuperRouteProps> = ({ children }) => {
  const platformAdminRole = useSelector((state: RootState) => state.auth.platformAdminRole);

  return (
    <PlatformAdminRoute>
      {platformAdminRole === 'super' ? (
        children
      ) : (
        <Box sx={{ p: 4, maxWidth: 480, mx: 'auto', mt: 8 }}>
          <Alert severity="error">
            This section is restricted to the platform head admin.
          </Alert>
        </Box>
      )}
    </PlatformAdminRoute>
  );
};

export default PlatformAdminSuperRoute;
