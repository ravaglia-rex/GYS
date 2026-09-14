import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import BigSpinner from '../ui/BigSpinner';
import IdleTimeoutGuard from '../auth/IdleTimeoutGuard';
import { useDispatch } from 'react-redux';
import { checkUserRole, setUser } from '../../state_data/authSlice';
import { AppDispatch } from '../../state_data/reducer';

interface SchoolAdminRouteProps {
  children: ReactNode;
}

const SchoolAdminRoute: React.FC<SchoolAdminRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(true);

  const isLocalStorageAvailable = () => {
    try {
      const key = '__some_random_key__';
      localStorage.setItem(key, key);
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        dispatch(setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
        }));

        if (firebaseUser.email) {
          const result = await dispatch(checkUserRole(firebaseUser.email));
          if (
            !checkUserRole.fulfilled.match(result) ||
            result.payload.role !== 'schooladmin'
          ) {
            navigate('/dashboard');
            return;
          }
        } else {
          navigate('/dashboard');
          return;
        }

        setLoading(false);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [dispatch, navigate]);

  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      navigate('/local-storage-error');
    }
  }, [navigate]);

  if (loading) {
    return <BigSpinner />;
  }

  return <IdleTimeoutGuard enabled>{children}</IdleTimeoutGuard>;
};

export default SchoolAdminRoute;
