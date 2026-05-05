import React, { useCallback, useState } from 'react';
import ResendVerificationButton from './ResendVerificationButton';
import { UserCredential, reload, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../firebase/firebase';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { checkSchoolEmail, verifySchoolEmail } from '../../db/schoolAdminCollection';
import { checkUserRole } from '../../state_data/authSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../state_data/reducer';


import authTokenHandler from '../../functions/auth_token/auth_token_handler';

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import { useToast } from '../ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  createFreshStudentSession,
  clearLocalSessionId,
  getLocalSessionId,
  readRemoteSessionId,
  setLocalSessionId,
  takeoverRemoteSession,
} from '../../services/studentActiveSession';

const signinSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

/** Firestore client errors from user_sessions read/write during student sign-in. */
function describeSignInError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';
  const message = error instanceof Error ? error.message : '';
  if (
    code === 'permission-denied' ||
    /missing or insufficient permissions/i.test(message)
  ) {
    return 'Your account signed in, but the app could not read or write the session document in Firestore. Deploy Firestore rules that allow user_sessions/{uid} for request.auth.uid == uid, and ensure the web app uses the same Firebase project as that database.';
  }
  return message || 'An error occurred. Please try again.';
}

async function revertPartialStudentSignIn(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    /* ignore */
  }
  authTokenHandler.clearToken();
  clearLocalSessionId();
}

interface SignInFormProps {
    email: string;
    isSchoolAdmin?: boolean;
    schoolInfo?: { schoolId: string; schoolName: string; verified?: boolean };
}
const SignInForm: React.FC<SignInFormProps> = ({ email, isSchoolAdmin, schoolInfo }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            password: '',
        },
    });
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [loadResendVerification, setLoadResendVerification] = useState<boolean>(false);
    const [userCred, setUserCredential] = useState<UserCredential | null>(null);
    const [sessionTakeoverOpen, setSessionTakeoverOpen] = useState(false);
    const [pendingCredential, setPendingCredential] = useState<UserCredential | null>(null);
    const dispatch = useDispatch<AppDispatch>();

    const completeStudentSignIn = useCallback(
      async (userCredential: UserCredential) => {
        await dispatch(checkUserRole(userCredential.user.email || ''));
        toast({
          variant: 'default',
          title: 'Signed in successfully!',
          description: `Welcome back, ${userCredential.user.email}`,
        });
        navigate('/dashboard');
      },
      [dispatch, navigate, toast]
    );

    const signIn = async (data: z.infer<typeof signinSchema>) => {
        setIsSubmitted(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, data.password);
            setUserCredential(userCredential);
            const authToken = await userCredential.user.getIdToken();
            authTokenHandler.setAuthToken(authToken);
            
            // For school admins, require either Firebase emailVerified OR school marked verified in
            // Firestore. If the POC completed password reset only on Firebase's default handler page,
            // neither flag is set until verifySchoolEmail runs (normally from /auth/action).
            if (isSchoolAdmin) {
              const signedInEmail = userCredential.user.email || email;
              const schoolCheck = await checkSchoolEmail(signedInEmail);

              if (!schoolCheck || schoolCheck.registrationPaymentComplete !== true) {
                toast({
                  variant: 'destructive',
                  title: 'Payment required',
                  description:
                    'School dashboard unlocks after your registration payment completes. Finish checkout using the link in your confirmation email.',
                });
                await signOut(auth);
                setIsSubmitted(false);
                return;
              }

              let firebaseEmailOk = userCredential.user.emailVerified;
              let schoolRecordOk = schoolCheck?.verified === true;

              if (!firebaseEmailOk && !schoolRecordOk && schoolCheck) {
                try {
                  await verifySchoolEmail(signedInEmail);
                  await reload(userCredential.user);
                  firebaseEmailOk = userCredential.user.emailVerified;
                  schoolRecordOk = true;
                } catch (err: unknown) {
                  const message =
                    err instanceof Error ? err.message : 'Could not complete school account verification.';
                  toast({
                    variant: 'destructive',
                    title: 'Account setup incomplete',
                    description: message,
                  });
                  await signOut(auth);
                  setIsSubmitted(false);
                  return;
                }
              }

              if (!firebaseEmailOk && !schoolRecordOk) {
                toast({
                  variant: 'destructive',
                  title: 'Email not verified',
                  description: 'Please verify your email to continue.',
                });
                await signOut(auth);
                setIsSubmitted(false);
                return;
              }
    
              // Use schoolInfo.schoolId directly - no need for user selection
              // schoolInfo is already validated from email check
    
              // Check user role and redirect
              await dispatch(checkUserRole(userCredential.user.email || ''));
              navigate('/school-admin/dashboard');
              return;
            }
    
            // Existing student flow...
            if (!userCredential.user.emailVerified) {
                toast({
                    variant: 'destructive',
                    title: 'Email not verified',
                    description: 'Please verify your email to continue.',
                });
                setLoadResendVerification(true);
                setIsSubmitted(false);
                return;
            }
            
            const uid = userCredential.user.uid;
            const remote = await readRemoteSessionId(uid);
            const local = getLocalSessionId();
            if (remote && remote !== local) {
              setPendingCredential(userCredential);
              setSessionTakeoverOpen(true);
              setIsSubmitted(false);
              return;
            }
            if (!remote) {
              await createFreshStudentSession(uid);
            } else {
              setLocalSessionId(remote);
            }
            await completeStudentSignIn(userCredential);
        } catch (error: unknown) {
            console.error('Sign in error:', error);
            await revertPartialStudentSignIn();
            toast({
                variant: 'destructive',
                title: 'Sign in failed',
                description: describeSignInError(error),
            });
            setIsSubmitted(false);
        }
    };

    const onSessionTakeoverConfirm = async () => {
      if (!pendingCredential) return;
      setIsSubmitted(true);
      try {
        const cred = pendingCredential;
        await takeoverRemoteSession(cred.user.uid);
        setSessionTakeoverOpen(false);
        setPendingCredential(null);
        await completeStudentSignIn(cred);
      } catch (e: unknown) {
        await revertPartialStudentSignIn();
        toast({
          variant: 'destructive',
          title: 'Session error',
          description: describeSignInError(e),
        });
      } finally {
        setIsSubmitted(false);
      }
    };

    const onSessionTakeoverCancel = async () => {
      setSessionTakeoverOpen(false);
      setPendingCredential(null);
      try {
        await signOut(auth);
        authTokenHandler.clearToken();
        clearLocalSessionId();
      } catch {
        /* ignore */
      }
      setIsSubmitted(false);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-lg sm:px-7 sm:py-8">
            <Dialog open={sessionTakeoverOpen} onOpenChange={(open) => !open && void onSessionTakeoverCancel()}>
              <DialogContent
                className="sm:max-w-md [&>button.absolute]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle>Account already active elsewhere</DialogTitle>
                  <DialogDescription className="text-left space-y-3 pt-2">
                    <span className="block text-slate-700">
                      This account has an open session in another tab or device. If you continue here, that
                      session will end immediately. Unsaved progress (including work in an assessment) may be
                      lost, and repeated or suspicious session switching may be treated as a policy violation.
                    </span>
                    <span className="block font-medium text-slate-900">
                      Do you want to sign in here and end the other session?
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => void onSessionTakeoverCancel()} disabled={isSubmitted}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                    onClick={() => void onSessionTakeoverConfirm()}
                    disabled={isSubmitted}
                  >
                    {isSubmitted ? <Spinner /> : 'Yes, sign in here'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <h2 className="text-2xl font-semibold text-center mb-6 text-slate-900">Sign in to Argus</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(signIn)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm text-slate-900">Password</FormLabel>
                                <FormControl>
                                    <Input className="bg-white border-slate-300 focus-visible:ring-blue-600 placeholder:text-slate-400 text-slate-900" type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormDescription className="text-xs text-slate-500">Minimum of 6 characters</FormDescription>
                                <FormMessage className="text-red-500">{form.formState.errors.password?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button 
                        type="submit" 
                        disabled={isSubmitted} 
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md font-semibold transition-all duration-300"
                    >
                        {isSubmitted ? <Spinner /> : 'Sign In'}
                    </Button>
                </form>
            </Form>
            
            <div className='text-center mt-4'>
                {loadResendVerification && <ResendVerificationButton userCredential={userCred}/>}
                <Link to='/reset-password' className='text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-300'>
                    Forgot password?
                </Link>
            </div>
        </div>
    );
};


export default SignInForm;
