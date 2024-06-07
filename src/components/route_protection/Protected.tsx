import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebase/firebase';
import { LoadingSpinner } from '../ui/spinner';

interface ProtectedProps {
  children: ReactNode;
}

const Protected: React.FC<ProtectedProps> = ({ children }) => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      }
      setLoading(false); // Authentication check is done
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, navigate]);

  if (loading) {
    // Render nothing or a loading spinner while checking authentication status
    return <LoadingSpinner className='loading-spinner-protected'/>;
  }

  return <>{children}</>;
};

export default Protected;
