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
import { sendEmailVerification, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { useToast } from '../ui/use-toast';

// Define the props using an interface
interface VerifyEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;  // Function to handle closing the dialog
}

// Apply the interface to the component function
const VerifyEmailDialog: React.FC<VerifyEmailDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const handleResendVerificationEmail = async () => {
    setIsSending(true);
    try {
      await sendEmailVerification(auth.currentUser!);
      toast({
        variant: 'default',
        title: 'Verification email sent',
        description: 'Please check your inbox for the verification email.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error sending email',
        description: 'There was an issue sending the verification email. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isOpen) {
      timer = setTimeout(() => {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            await user.reload();
            if (user.emailVerified) {
              navigate('/dashboard');
            } else {
              await signOut(auth);
              navigate('/');
            }
          }
        });
      }, 30000); // 30 seconds
    }

    return () => clearTimeout(timer);
  }, [isOpen, navigate]);

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
        <DialogFooter>
          <Button onClick={handleResendVerificationEmail} disabled={isSending}>
            {isSending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyEmailDialog;
