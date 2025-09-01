import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import BigSpinner from '../ui/BigSpinner';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import { checkUserRole, setUser } from '../../state_data/authSlice';
import { AppDispatch } from '../../state_data/reducer';

interface SchoolAdminRouteProps {
  children: ReactNode;
}

const SchoolAdminRoute: React.FC<SchoolAdminRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(true);
  const { user, role, loading: authLoading } = useSelector((state: RootState) => state.auth);

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
    // Special case: if we're accessing school admin routes directly, bypass auth
    // This allows direct access to school admin dashboard without authentication
    setLoading(false);
  }, []);

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
