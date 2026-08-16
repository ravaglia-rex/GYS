import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Box } from '@mui/material';
import { RootState } from '../../state_data/reducer';
import { auth } from '../../firebase/firebase';
import { canAccessPlatformAdminAnalytics } from '../../utils/platformAdminAnalyticsAccess';
import PlatformAdminRoute from './PlatformAdminRoute';

interface PlatformAdminAnalyticsRouteProps {
  children: ReactNode;
  /** Parent already mounted PlatformAdminRoute (nested layout shell). */
  nested?: boolean;
}

const PlatformAdminAnalyticsRoute: React.FC<PlatformAdminAnalyticsRouteProps> = ({
  children,
  nested = false,
}) => {
  const userEmail =
    useSelector((state: RootState) => state.auth.user?.email) ?? auth.currentUser?.email ?? '';

  const content = canAccessPlatformAdminAnalytics(userEmail) ? (
    children
  ) : (
    <Box sx={{ p: 4, maxWidth: 480, mx: 'auto', mt: 8 }}>
      <Alert severity="error">This Analytics section is restricted.</Alert>
    </Box>
  );

  if (nested) return content;
  return <PlatformAdminRoute>{content}</PlatformAdminRoute>;
};

export default PlatformAdminAnalyticsRoute;
