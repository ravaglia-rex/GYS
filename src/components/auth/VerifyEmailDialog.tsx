import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { sendEmailVerification } from 'firebase/auth';
import { auth, getAuthActionCodeSettings } from '../../firebase/firebase';
import { useToast } from '../ui/use-toast';
import * as Sentry from '@sentry/react';

interface VerifyEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const VerifyEmailDialog: React.FC<VerifyEmailDialogProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(100); // For the progress bar
  const [cooldown, setCooldown] = useState<number | null>(null);

  const handleResendVerificationEmail = async () => {
    setIsSending(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, getAuthActionCodeSettings());
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Verification Required</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <p>To continue, please verify your email address.</p>
          <p>We have sent a verification link to your email. Please check your inbox and follow the instructions in the email to verify your account.</p>
          <p>If you did not receive the email, please check your spam folder or click the button after <b>a minute</b> below to resend the verification email.</p>
        </DialogDescription>
        <DialogFooter className="relative">
          <div className="relative w-full">
            <Button onClick={handleResendVerificationEmail} disabled={isSending || isCooldownActive} className="relative z-10 w-full">
              {isSending ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            {isCooldownActive && (
              <div className="absolute top-0 left-0 h-full bg-green-400 bg-opacity-50 pointer-events-none rounded-md" style={{ width: `${progress}%`, transition: 'width 1s linear' }}></div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyEmailDialog;
