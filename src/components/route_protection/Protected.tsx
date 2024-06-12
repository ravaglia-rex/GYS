import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { LoadingSpinner } from '../ui/spinner';
import { signOut } from 'firebase/auth';
import { checkSingleTab } from './sessionHandler';

interface ProtectedProps {
  children: ReactNode;
}

const Protected: React.FC<ProtectedProps> = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const handleTabClose = async () => {
    const user = auth.currentUser;
    if (user) {
      await signOut(auth);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      }
      setLoading(false); // Authentication check is done
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    checkSingleTab();
    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);

  if (loading) {
    // Render nothing or a loading spinner while checking authentication status
    return <LoadingSpinner className='loading-spinner-protected'/>;
  }

  return <>{children}</>;
};

export default Protected;
