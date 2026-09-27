import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import BigSpinner from '../ui/BigSpinner';
import { useDispatch } from 'react-redux';
import { getPlatformAdminMe } from '../../db/platformAdminCollection';
import { setRole, setPlatformAdminRole, setPlatformAdminPermissions, setUser } from '../../state_data/authSlice';
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
  const [transientError, setTransientError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        navigate('/login?redirect=/platform-admin/schools');
        return;
      }

      try {
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

        const me = await getPlatformAdminMe();
        if (!me?.ok) {
          setForbidden(true);
          return;
        }

        dispatch(setRole('platformadmin'));
        dispatch(setPlatformAdminRole(me.role));
        dispatch(setPlatformAdminPermissions(Array.isArray(me.permissions) ? me.permissions : []));
        setTransientError(null);
        setForbidden(false);
      } catch (err) {
        console.error('PlatformAdminRoute auth check failed:', err);
        // Transient API failures must not look like "access denied"
        setTransientError(
          err instanceof Error && err.message.trim()
            ? err.message
            : 'Could not verify admin access. Please refresh and try again.'
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [dispatch, navigate]);

  if (loading) {
    return <BigSpinner />;
  }

  if (transientError) {
    return (
      <Box sx={{ p: 4, maxWidth: 480, mx: 'auto', mt: 8 }}>
        <Alert severity="warning">{transientError}</Alert>
      </Box>
    );
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
