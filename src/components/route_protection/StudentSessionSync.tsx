import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import {
  getLocalSessionId,
  signOutFromStaleSession,
  subscribeRemoteSession,
  syncSessionOnAppLoad,
} from '../../services/studentActiveSession';
import { useToast } from '../ui/use-toast';

/**
 * Keeps student accounts to a single active session via Firestore `user_sessions/{uid}`.
 * If another login replaces the session id, this client signs out.
 */
const StudentSessionSync: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubRef.current?.();
      unsubRef.current = null;

      if (!user) {
        return;
      }

      void (async () => {
        try {
          const outcome = await syncSessionOnAppLoad(user.uid);
          if (cancelled) return;
          if (outcome === 'kicked') {
            toast({
              variant: 'destructive',
              title: 'Signed in elsewhere',
              description:
                'This account was opened in another tab or device. This session has ended.',
            });
            await signOutFromStaleSession();
            navigate('/', { replace: true });
            return;
          }
          if (cancelled) return;

          unsubRef.current = subscribeRemoteSession(user.uid, (remoteId) => {
            const local = getLocalSessionId();
            if (remoteId == null) {
              if (local) {
                toast({
                  variant: 'destructive',
                  title: 'Session ended',
                  description: 'You were signed out (for example from another tab or device).',
                });
                void (async () => {
                  await signOutFromStaleSession();
                  navigate('/', { replace: true });
                })();
              }
              return;
            }
            if (local && remoteId !== local) {
              toast({
                variant: 'destructive',
                title: 'Signed in elsewhere',
                description:
                  'This account was opened in another tab or device. This session has ended.',
              });
              void (async () => {
                await signOutFromStaleSession();
                navigate('/', { replace: true });
              })();
            }
          });
        } catch (e) {
          console.error('Student session sync failed:', e);
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribeAuth();
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [navigate, toast]);

  return null;
};

export default StudentSessionSync;
