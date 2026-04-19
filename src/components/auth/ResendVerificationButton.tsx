import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { sendEmailVerification } from 'firebase/auth';
import { UserCredential } from 'firebase/auth';
import { auth, getAuthActionCodeSettings } from '../../firebase/firebase';
import { useToast } from '../ui/use-toast';
import * as Sentry from '@sentry/react';

interface ResendVerificationButtonProps {
  userCredential?: UserCredential|null;
}

const ResendVerificationButton: React.FC<ResendVerificationButtonProps> = ({userCredential}) => {
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(100); // For the progress bar
    const [cooldown, setCooldown] = useState<number | null>(null);
    
    const handleResendVerificationEmail = async () => {
        setIsSending(true);
        try {
          const user = auth.currentUser||userCredential?.user;
          if (user) {
            await sendEmailVerification(user, getAuthActionCodeSettings());
            const cooldownEndTime = Date.now() + 60000; // Set cooldown for 1 minute
            localStorage.setItem('emailResendCooldown', cooldownEndTime.toString());
            setCooldown(cooldownEndTime);
            setProgress(100); // Reset progress bar to full
            toast({
              variant: 'default',
              title: 'Verification email sent',
              description: 'Please check your inbox for the verification email.',
            });
          } else {
            Sentry.withScope((scope) => {
              scope.setTag('location', 'VerifyEmailDialog.handleResendVerificationEmail');
              Sentry.captureException(new Error('User not authenticated'));
            });
            toast({
              variant: 'destructive',
              title: 'User not authenticated',
              description: 'Interesting... You clearly haven\'t registered yet. Please sign up first.',
            });
          }
        } catch (error: any) {
          Sentry.withScope((scope) => {
            scope.setTag('location', 'VerifyEmailDialog.handleResendVerificationEmail');
            Sentry.captureException(error);
          });
          if (error.code === 'auth/too-many-requests') {
            const cooldownEndTime = Date.now() + 60000; // Set cooldown for 1 minute
            localStorage.setItem('emailResendCooldown', cooldownEndTime.toString());
            setCooldown(cooldownEndTime);
            setProgress(100); // Reset progress bar to full
            Sentry.withScope((scope) => {
              scope.setTag('location', 'VerifyEmailDialog.handleResendVerificationEmail');
              Sentry.captureMessage('Resend email cooldown triggered');
            });
            toast({
              variant: 'destructive',
              title: 'Not so fast friend!⏱️',
              description: 'You can only resend the verification email once per minute.',
              duration: 20000,
            });
          } else {
            Sentry.withScope((scope) => {
              scope.setTag('location', 'VerifyEmailDialog.handleResendVerificationEmail');
              Sentry.captureException(error);
            });
            toast({
              variant: 'destructive',
              title: 'Error sending email',
              description: 'There was an issue sending the verification email. Please try again.',
            });
          }
        } finally {
          setIsSending(false);
        }
    };
    
    useEffect(() => {
    const savedCooldown = localStorage.getItem('emailResendCooldown');
    if (savedCooldown) {
        const cooldownEndTime = parseInt(savedCooldown, 10);
        if (cooldownEndTime > Date.now()) {
        setCooldown(cooldownEndTime);
        } else {
        localStorage.removeItem('emailResendCooldown');
        }
    }
    }, []);

    useEffect(() => {
    if (cooldown !== null) {
        const interval = setInterval(() => {
        const remainingTime = cooldown - Date.now();
        if (remainingTime <= 0) {
            setCooldown(null);
            localStorage.removeItem('emailResendCooldown');
            setProgress(0);
        } else {
            setProgress((remainingTime / 60000) * 100);
        }
        }, 100);

        return () => clearInterval(interval);
        }
    }, [cooldown]);

    const isCooldownActive = cooldown !== null && Date.now() < cooldown;
    return (
        <div className="relative w-full">
            <Button onClick={handleResendVerificationEmail} disabled={isSending || isCooldownActive} className="relative z-10 w-full bg-blue-500 hover:bg-blue-600 text-white">
              {isSending ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            {isCooldownActive && (
              <div className="absolute top-0 left-0 h-full bg-blue-400 bg-opacity-50 pointer-events-none rounded-md" style={{ width: `${progress}%`, transition: 'width 1s linear' }}></div>
            )}
        </div>
    );
}

export default ResendVerificationButton;
