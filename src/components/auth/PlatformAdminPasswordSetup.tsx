import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, getAuthActionCodeSettings } from '../../firebase/firebase';
import { Button } from '../ui/button';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import { useToast } from '../ui/use-toast';
import PlatformAdminSignInForm from './PlatformAdminSignInForm';
import { verifyPlatformAdminAndSendPasswordSetup } from '../../db/platformAdminCollection';

interface PlatformAdminPasswordSetupProps {
  email: string;
}

function getFirebaseAuthErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
}

function describeSendError(error: unknown): string {
  const code = getFirebaseAuthErrorCode(error);
  if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
    return 'Password setup URL is not allowed in Firebase Auth. Add this site’s domain under Authentication → Settings → Authorized domains, and set the email template action URL to /auth/action.';
  }
  if (code === 'auth/user-not-found') {
    return 'Auth user could not be prepared for this email. Confirm the backend verifyAndSendPasswordSetup call succeeded.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Wait a few minutes, then try again.';
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Could not send setup email. Please try again.';
}

const PlatformAdminPasswordSetup: React.FC<PlatformAdminPasswordSetupProps> = ({ email }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [showSignInInstead, setShowSignInInstead] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const sendSetupLink = async () => {
    try {
      setIsSubmitting(true);
      setLastError(null);
      await verifyPlatformAdminAndSendPasswordSetup(email);
      await sendPasswordResetEmail(auth, email, getAuthActionCodeSettings());
      setLinkSent(true);
      toast({
        title: 'Setup link sent',
        description: `Check inbox and spam for ${email}. The link is valid for about 1 hour — resend anytime if it expires.`,
      });
    } catch (error: unknown) {
      const message = describeSendError(error);
      setLastError(message);
      setLinkSent(false);
      toast({
        variant: 'destructive',
        title: 'Could not send email',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardClass =
    'rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-lg sm:px-7 sm:py-9';

  if (showSignInInstead) {
    return (
      <PlatformAdminSignInForm
        email={email}
        onNeedsPasswordSetup={() => setShowSignInInstead(false)}
      />
    );
  }

  if (linkSent) {
    return (
      <div className={cardClass}>
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
              <svg className="h-7 w-7 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">Check your email</h2>
          <p className="mx-auto mb-6 max-w-md text-base leading-relaxed text-slate-600">
            We&apos;ve sent a password setup link to{' '}
            <strong className="font-semibold text-slate-900">{email}</strong>. Open the link to create your
            password, then sign in to the admin portal.
          </p>
          <p className="mx-auto mb-4 max-w-md rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
            The link is valid for about <strong>1 hour</strong>. You can generate a new one any number of
            times with Resend below — there is no limit on how often you request it.
          </p>
          <p className="mx-auto max-w-md border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-600">
            Didn&apos;t get it? Check spam/junk. Firebase sends this from{' '}
            <span className="font-medium text-slate-800">noreply@argus-india-v2.firebaseapp.com</span> (or your
            custom SMTP sender).
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void sendSetupLink()}
              className="h-10 rounded-md bg-gradient-to-r from-slate-800 to-slate-900 px-5 font-semibold text-white hover:from-slate-900 hover:to-black disabled:opacity-60"
            >
              {isSubmitting ? <Spinner /> : 'Resend setup link'}
            </Button>
            <p className="text-sm text-slate-600">
              Already set a password?{' '}
              <button
                type="button"
                className="font-medium text-blue-700 underline-offset-2 hover:underline"
                onClick={() => setShowSignInInstead(true)}
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Create your admin account</h2>
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{email}</span> is on the Argus admin list. Send yourself a
          link to create a password — signing in with the shared env password will not work.
        </p>
      </div>
      {lastError && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">
          {lastError}
        </p>
      )}
      <Button
        type="button"
        disabled={isSubmitting}
        onClick={() => void sendSetupLink()}
        className="h-10 w-full rounded-md bg-gradient-to-r from-slate-800 to-slate-900 py-2 font-semibold text-white hover:from-slate-900 hover:to-black disabled:opacity-60"
      >
        {isSubmitting ? <Spinner /> : 'Send password setup link'}
      </Button>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already set a password?{' '}
        <button
          type="button"
          className="font-medium text-blue-700 underline-offset-2 hover:underline"
          onClick={() => setShowSignInInstead(true)}
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

export default PlatformAdminPasswordSetup;
