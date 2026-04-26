import { initializeApp } from 'firebase/app';
import type { ActionCodeSettings } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * URL passed as `continueUrl` when sending password-reset / verify-email actions.
 * Also use this exact path (on your **deployed** web origin) in Firebase Console:
 * Authentication → Templates → (Password reset / Email verification) → Customize action URL,
 * e.g. `https://your-portal.example.com/auth/action`. If the template still points at
 * `*.firebaseapp.com`, users complete reset on Firebase’s page (oob code consumed) and land
 * on your app without a valid code - `/auth/action` cannot finish school POC setup.
 */
export function getAuthActionContinueUrl(): string {
  const fromEnv = process.env.REACT_APP_AUTH_CONTINUE_URL?.trim();
  if (fromEnv) return fromEnv;
  return `${window.location.origin}/auth/action`;
}

/** @deprecated Use getAuthActionContinueUrl - same value, kept for existing imports. */
export const getPasswordResetContinueUrl = getAuthActionContinueUrl;

export function getAuthActionCodeSettings(): ActionCodeSettings {
  return {
    url: getAuthActionContinueUrl(),
    handleCodeInApp: false,
  };
}

