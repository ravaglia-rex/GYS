import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import authTokenHandler from '../functions/auth_token/auth_token_handler';

export const STUDENT_SESSION_STORAGE_KEY = 'argus_student_session_id';

export function getUserSessionDocRef(uid: string) {
  return doc(db, 'user_sessions', uid);
}

export async function readRemoteSessionId(uid: string): Promise<string | null> {
  const s = await getDoc(getUserSessionDocRef(uid));
  if (!s.exists()) return null;
  const id = s.data()?.sessionId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export function getLocalSessionId(): string | null {
  try {
    const v = localStorage.getItem(STUDENT_SESSION_STORAGE_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setLocalSessionId(id: string): void {
  localStorage.setItem(STUDENT_SESSION_STORAGE_KEY, id);
}

export function clearLocalSessionId(): void {
  try {
    localStorage.removeItem(STUDENT_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

/** Ensures a session document exists; returns canonical session id from server. */
export async function ensureSessionDocument(uid: string): Promise<string> {
  return runTransaction(db, async (txn) => {
    const ref = getUserSessionDocRef(uid);
    const snap = await txn.get(ref);
    if (!snap.exists()) {
      const sid = generateSessionId();
      txn.set(ref, { sessionId: sid, updatedAt: serverTimestamp() });
      return sid;
    }
    const raw = snap.data()?.sessionId;
    if (typeof raw === 'string' && raw.length > 0) {
      return raw;
    }
    const sid = generateSessionId();
    txn.update(ref, { sessionId: sid, updatedAt: serverTimestamp() });
    return sid;
  });
}

export async function writeRemoteSession(uid: string, sessionId: string): Promise<void> {
  await runTransaction(db, async (txn) => {
    const ref = getUserSessionDocRef(uid);
    txn.set(
      ref,
      {
        sessionId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

/** Replace remote session (after user confirms taking over from another device/tab). */
export async function takeoverRemoteSession(uid: string): Promise<string> {
  const sid = generateSessionId();
  await writeRemoteSession(uid, sid);
  setLocalSessionId(sid);
  return sid;
}

/** First login when no active remote session (e.g. after sign-out cleared the doc). */
export async function createFreshStudentSession(uid: string): Promise<string> {
  const sid = generateSessionId();
  await writeRemoteSession(uid, sid);
  setLocalSessionId(sid);
  return sid;
}

export async function deleteRemoteStudentSession(uid: string): Promise<void> {
  await deleteDoc(getUserSessionDocRef(uid));
}

/**
 * Voluntary sign-out: remove server session + local marker so the next login is not treated as a takeover.
 */
export async function signOutStudentAndClearSession(): Promise<void> {
  const u = auth.currentUser;
  if (u) {
    try {
      await deleteRemoteStudentSession(u.uid);
    } catch (e) {
      console.warn('Failed to clear user_sessions doc:', e);
    }
  }
  clearLocalSessionId();
  authTokenHandler.clearToken();
  await signOut(auth);
}

/** Signed in elsewhere - keep Firestore as-is; only clear client auth. */
export async function signOutFromStaleSession(): Promise<void> {
  clearLocalSessionId();
  authTokenHandler.clearToken();
  await signOut(auth);
}

export type RemoteSessionListener = () => void;

export function subscribeRemoteSession(
  uid: string,
  onSessionId: (sessionId: string | null) => void
): RemoteSessionListener {
  return onSnapshot(
    getUserSessionDocRef(uid),
    (snap) => {
      if (!snap.exists()) {
        onSessionId(null);
        return;
      }
      const id = snap.data()?.sessionId;
      onSessionId(typeof id === 'string' && id.length > 0 ? id : null);
    },
    (err) => {
      console.error('user_sessions listener error:', err);
    }
  );
}

export async function syncSessionOnAppLoad(uid: string): Promise<'ok' | 'kicked'> {
  const canonical = await ensureSessionDocument(uid);
  const local = getLocalSessionId();
  if (local && local !== canonical) {
    return 'kicked';
  }
  if (!local) {
    setLocalSessionId(canonical);
  }
  return 'ok';
}
