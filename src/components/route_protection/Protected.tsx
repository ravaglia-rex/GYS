import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import BigSpinner from '../ui/BigSpinner';
import IdleTimeoutGuard from '../auth/IdleTimeoutGuard';
import analytics from '../../segment/segment';
import authTokenHandler from '../../functions/auth_token/auth_token_handler';
import { recordDailyLogin } from '../../db/gamificationCollection';
import StreakBrokenModal from '../gamification/StreakBrokenModal';
import { hasRecordedDailyLoginToday, markDailyLoginRecorded } from '../../utils/dailyLoginGuard';
import { getStudent, StudentProfileError } from '../../db/studentCollection';
import { toast } from '../ui/use-toast';
import {
  isStudentLoginBlockedEmail,
  isStudentLoginBlockedStudent,
  STUDENT_LOGIN_BLOCKED_BODY,
  STUDENT_LOGIN_BLOCKED_TITLE,
} from '../../utils/studentLoginSchoolBlocks';

interface ProtectedProps {
  children: ReactNode;
}

const Protected: React.FC<ProtectedProps> = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [streakBreak, setStreakBreak] = useState<{ previous_streak: number } | null>(null);
  const loginCalledRef = useRef(false);
  const schoolBlockCheckedRef = useRef<string | null>(null);

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

        // Kick out students from login-blocked schools / QA emails (existing sessions included).
        if (schoolBlockCheckedRef.current !== user.uid) {
          schoolBlockCheckedRef.current = user.uid;
          if (isStudentLoginBlockedEmail(user.email)) {
            toast({
              variant: 'destructive',
              title: STUDENT_LOGIN_BLOCKED_TITLE,
              description: STUDENT_LOGIN_BLOCKED_BODY,
            });
            try {
              await signOut(auth);
            } catch {
              /* ignore */
            }
            authTokenHandler.clearToken();
            navigate('/login');
            setLoading(false);
            return;
          }
          try {
            const student = await getStudent(user.uid);
            if (isStudentLoginBlockedStudent(student as Record<string, unknown>)) {
              toast({
                variant: 'destructive',
                title: STUDENT_LOGIN_BLOCKED_TITLE,
                description: STUDENT_LOGIN_BLOCKED_BODY,
              });
              try {
                await signOut(auth);
              } catch {
                /* ignore */
              }
              authTokenHandler.clearToken();
              navigate('/login');
              setLoading(false);
              return;
            }
          } catch (err) {
            if (
              err instanceof StudentProfileError &&
              err.code === 'SCHOOL_ACCESS_SUSPENDED'
            ) {
              toast({
                variant: 'destructive',
                title: err.title || STUDENT_LOGIN_BLOCKED_TITLE,
                description: err.message || STUDENT_LOGIN_BLOCKED_BODY,
              });
              try {
                await signOut(auth);
              } catch {
                /* ignore */
              }
              authTokenHandler.clearToken();
              navigate('/login');
              setLoading(false);
              return;
            }
          }
        }

        analytics.identify(user.uid, {
          email: user.email,
        });
        if (!loginCalledRef.current && !hasRecordedDailyLoginToday(user.uid)) {
          loginCalledRef.current = true;
          try {
            const result = await recordDailyLogin();
            markDailyLoginRecorded(user.uid);
            if (result.streak_break && typeof result.streak_break.previous_streak === 'number') {
              setStreakBreak({ previous_streak: result.streak_break.previous_streak });
            }
          } catch {
            loginCalledRef.current = false;
            /* non-blocking streak update; retry on next protected mount */
          }
        } else if (!loginCalledRef.current) {
          loginCalledRef.current = true;
        }
        setLoading(false);
      } else {
        authTokenHandler.clearToken();
        loginCalledRef.current = false;
        schoolBlockCheckedRef.current = null;
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
