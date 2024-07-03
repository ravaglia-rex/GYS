import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { useToast } from '../ui/use-toast';

interface VerifyEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const VerifyEmailDialog: React.FC<VerifyEmailDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [dialogOpenTime, setDialogOpenTime] = useState<number | null>(null);
  const [progress, setProgress] = useState(100); // For the progress bar
  const cooldownRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cooldownEnd = localStorage.getItem('emailResendCooldown');
      if (cooldownEnd) {
        const cooldownEndTime = parseInt(cooldownEnd, 10);
        if (Date.now() < cooldownEndTime) {
          cooldownRef.current = cooldownEndTime;
          const remainingTime = cooldownEndTime - Date.now();
          setProgress((remainingTime / 60000) * 100);
        }
      } else {
        setDialogOpenTime(Date.now());
        setProgress(100); // Reset progress bar to full
      }
    } else {
      setDialogOpenTime(null);
      setProgress(100); // Reset progress bar to full
    }
  }, [isOpen]);

  const handleResendVerificationEmail = async () => {
    setIsSending(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        const cooldownEndTime = Date.now() + 60000; // Set cooldown for 1 minute
        localStorage.setItem('emailResendCooldown', cooldownEndTime.toString());
        cooldownRef.current = cooldownEndTime;
        setProgress(100); // Reset progress bar to full
        toast({
          variant: 'default',
          title: 'Verification email sent',
          description: 'Please check your inbox for the verification email.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'User not authenticated',
          description: 'Please sign in again.',
        });
      }
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        const cooldownEndTime = Date.now() + 60000; // Set cooldown for 1 minute
        localStorage.setItem('emailResendCooldown', cooldownEndTime.toString());
        cooldownRef.current = cooldownEndTime;
        setProgress(100); // Reset progress bar to full
        toast({
          variant: 'destructive',
          title: 'Not so fast friend!⏱️',
          description: 'You can only resend the verification email once per minute',
        });
      } else {
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await user.reload();
          if (user.emailVerified) {
            localStorage.removeItem('emailResendCooldown');
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error reloading user:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (cooldownRef.current !== null) {
      const interval = setInterval(() => {
        const remainingTime = cooldownRef.current! - Date.now();
        if (remainingTime <= 0) {
          cooldownRef.current = null;
          localStorage.removeItem('emailResendCooldown');
          setProgress(0);
        } else {
          setProgress((remainingTime / 60000) * 100);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [cooldownRef]);

  const currentCooldown = cooldownRef.current || (dialogOpenTime !== null ? dialogOpenTime + 60000 : null);
  const isCooldownActive = currentCooldown !== null && Date.now() < currentCooldown;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Verification Required</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <p>To continue, please verify your email address.</p>
          <p>We have sent a verification link to your email. Please check your inbox and follow the instructions in the email to verify your account.</p>
          <p>If you did not receive the email, please check your spam folder or click the button below to resend the verification email.</p>
        </DialogDescription>
        <DialogFooter className="relative">
          <div className="relative w-full">
            <Button onClick={handleResendVerificationEmail} disabled={isSending || isCooldownActive} className="relative z-10" style={{ width: '100%' }}>
              {isSending ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            {isCooldownActive && (
              <div
                className="absolute top-0 left-0 h-full bg-green-400 bg-opacity-50 pointer-events-none rounded-md"
                style={{
                  width: `${progress}%`,
                  transition: 'width 1s linear',
                }}
              />
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyEmailDialog;
