import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Box } from '@mui/material';
import { auth } from '../../firebase/firebase';
import { RootState } from '../../state_data/reducer';
import { isPlatformAdminHeadEmail } from '../../utils/platformAdminAccess';
import PlatformAdminRoute from './PlatformAdminRoute';

interface PlatformAdminHeadRouteProps {
  children: ReactNode;
  nested?: boolean;
}

/** Admin Management — `srishti@argus.ai` only. */
const PlatformAdminHeadRoute: React.FC<PlatformAdminHeadRouteProps> = ({
  children,
  nested = false,
}) => {
  const userEmail =
    useSelector((state: RootState) => state.auth.user?.email) ?? auth.currentUser?.email ?? '';

  const content = isPlatformAdminHeadEmail(userEmail) ? (
    children
  ) : (
    <Box sx={{ p: 4, maxWidth: 480, mx: 'auto', mt: 8 }}>
      <Alert severity="error">This section is restricted to the platform head admin.</Alert>
    </Box>
  );

  if (nested) return content;
  return <PlatformAdminRoute>{content}</PlatformAdminRoute>;
};

export default PlatformAdminHeadRoute;
