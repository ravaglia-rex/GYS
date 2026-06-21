import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import BigSpinner from '../ui/BigSpinner';
import { useDispatch } from 'react-redux';
import { checkPlatformAdminAccess } from '../../db/platformAdminCollection';
import { setRole, setUser } from '../../state_data/authSlice';
import { AppDispatch } from '../../state_data/reducer';
import authTokenHandler from '../../functions/auth_token/auth_token_handler';
import { Alert, Box } from '@mui/material';

interface PlatformAdminRouteProps {
  children: ReactNode;
}

const PlatformAdminRoute: React.FC<PlatformAdminRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        navigate('/login?redirect=/platform-admin/dashboard');
        return;
      }

      dispatch(
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
        })
      );

      const token = await firebaseUser.getIdToken();
      authTokenHandler.setAuthToken(token);

      const isAdmin = await checkPlatformAdminAccess();
      if (!isAdmin) {
        setForbidden(true);
        setLoading(false);
        return;
      }

      dispatch(setRole('platformadmin'));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch, navigate]);

  if (loading) {
    return <BigSpinner />;
  }

  if (forbidden) {
    return (
      <Box sx={{ p: 4, maxWidth: 480, mx: 'auto', mt: 8 }}>
        <Alert severity="error">
          You don&apos;t have access to the platform admin portal. Sign in with an authorized admin account.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};

export default PlatformAdminRoute;
