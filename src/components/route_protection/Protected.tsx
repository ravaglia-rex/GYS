import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import BigSpinner from '../ui/BigSpinner';
import IdleTimeoutGuard from '../auth/IdleTimeoutGuard';
import analytics from '../../segment/segment';
import authTokenHandler from '../../functions/auth_token/auth_token_handler';
import { recordDailyLogin } from '../../db/gamificationCollection';
import StreakBrokenModal from '../gamification/StreakBrokenModal';

interface ProtectedProps {
  children: ReactNode;
}

const Protected: React.FC<ProtectedProps> = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [streakBreak, setStreakBreak] = useState<{ previous_streak: number } | null>(null);
  const loginCalledRef = useRef(false);

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          authTokenHandler.setAuthToken(token);
        } catch {
          /* Handler refresh on API calls still works via getAuthToken */
        }
        analytics.identify(user.uid, {
          email: user.email,
        });
        if (!loginCalledRef.current) {
          loginCalledRef.current = true;
          try {
            const result = await recordDailyLogin();
            if (result.streak_break && typeof result.streak_break.previous_streak === 'number') {
              setStreakBreak({ previous_streak: result.streak_break.previous_streak });
            }
          } catch {
            /* non-blocking streak update */
          }
        }
        setLoading(false);
      } else {
        authTokenHandler.clearToken();
        loginCalledRef.current = false;
        setStreakBreak(null);
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      navigate('/local-storage-error');
    }
  }, [navigate]);

  if (loading) {
    return <BigSpinner />;
  }

  return (
    <IdleTimeoutGuard enabled>
      {children}
      <StreakBrokenModal
        open={Boolean(streakBreak)}
        previousStreak={streakBreak?.previous_streak ?? 0}
        onClose={() => setStreakBreak(null)}
      />
    </IdleTimeoutGuard>
  );
};

export default Protected;
