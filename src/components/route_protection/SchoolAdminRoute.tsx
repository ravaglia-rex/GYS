import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import BigSpinner from '../ui/BigSpinner';
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
  // User, role, and authLoading are managed by Redux but not needed directly here
  // since we use onAuthStateChanged to handle auth state

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
    // Set up auth state listener to populate user in Redux
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Set user in Redux
        dispatch(setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
        }));
        
        // Check user role if not already set
        if (firebaseUser.email) {
          await dispatch(checkUserRole(firebaseUser.email));
        }
        
        setLoading(false);
      } else {
        // No user, redirect to home
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

  return <>{children}</>;
};

export default SchoolAdminRoute;
