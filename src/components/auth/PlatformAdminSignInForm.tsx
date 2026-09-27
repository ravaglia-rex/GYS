import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { checkPlatformAdminAccess } from '../../db/platformAdminCollection';
import { setRole } from '../../state_data/authSlice';
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
import { PasswordInput } from '../ui/password-input';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import { useToast } from '../ui/use-toast';

const signinSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

interface PlatformAdminSignInFormProps {
  email: string;
  /** When sign-in fails because no personal password exists yet, return to the setup-email flow. */
  onNeedsPasswordSetup?: () => void;
}

function getFirebaseAuthErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
}

const PlatformAdminSignInForm: React.FC<PlatformAdminSignInFormProps> = ({
  email,
  onNeedsPasswordSetup,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const form = useForm({
    resolver: zodResolver(signinSchema),
    defaultValues: { password: '' },
  });

  const signIn = async (data: z.infer<typeof signinSchema>) => {
    setIsSubmitted(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, data.password);
      const authToken = await userCredential.user.getIdToken();
      authTokenHandler.setAuthToken(authToken);

      const isPlatformAdmin = await checkPlatformAdminAccess();
      if (!isPlatformAdmin) {
        await signOut(auth);
        authTokenHandler.clearToken();
        toast({
          variant: 'destructive',
          title: 'Access denied',
          description: 'This account is not authorized for the admin portal.',
        });
        setIsSubmitted(false);
        return;
      }

      dispatch(setRole('platformadmin'));
      toast({
        title: 'Signed in successfully',
        description: 'Welcome to the Argus admin portal.',
      });
      navigate('/platform-admin/schools');
    } catch (error: unknown) {
      // Transient /me failures after Firebase sign-in — do not treat as wrong password
      if (
        error instanceof Error &&
        (error.message.includes('Could not verify admin access') ||
          error.message.includes('Too many requests'))
      ) {
        await signOut(auth).catch(() => undefined);
        authTokenHandler.clearToken();
        toast({
          variant: 'destructive',
          title: 'Could not verify access',
          description: error.message,
        });
        setIsSubmitted(false);
        return;
      }

      const code = getFirebaseAuthErrorCode(error);
      // Only route to setup when the Auth user truly does not exist.
      // Wrong password / invalid-credential must stay on this form (Firebase often
      // returns invalid-credential for both wrong password and missing user on newer SDKs,
      // but user-not-found is the only unambiguous "no password set" signal).
      if (code === 'auth/user-not-found' && onNeedsPasswordSetup) {
        toast({
          variant: 'destructive',
          title: 'No password set yet',
          description:
            'This admin account does not have a personal password. Use “Send password setup link” - that is what emails you the create-password link.',
        });
        onNeedsPasswordSetup();
        setIsSubmitted(false);
        return;
      }

      const wrongPassword = [
        'auth/invalid-credential',
        'auth/invalid-login-credentials',
        'auth/wrong-password',
      ].includes(code);

      toast({
        variant: 'destructive',
        title: wrongPassword ? 'Wrong password' : 'Sign in failed',
        description: wrongPassword
          ? 'That password is incorrect. Try again, use Forgot password, or send a new setup link if you have not created one yet.'
          : error instanceof Error
            ? error.message
            : 'Invalid admin credentials.',
      });
      setIsSubmitted(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-lg sm:px-7 sm:py-8">
      <h2 className="text-2xl font-semibold text-center mb-2 text-slate-900">Admin sign in</h2>
      <p className="text-center text-sm text-slate-600 mb-6">{email}</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(signIn)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-slate-900">Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    className="bg-white border-slate-300 focus-visible:ring-blue-600 placeholder:text-slate-400 text-slate-900"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-slate-500">Minimum of 6 characters</FormDescription>
                <FormMessage className="text-red-500">{form.formState.errors.password?.message}</FormMessage>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitted}
            className="w-full py-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white rounded-md font-semibold"
          >
            {isSubmitted ? <Spinner /> : 'Sign in to admin portal'}
          </Button>
        </form>
      </Form>
      <div className="text-center mt-4 space-y-2">
        <Link to="/reset-password" className="block text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-300">
          Forgot password?
        </Link>
        {onNeedsPasswordSetup && (
          <button
            type="button"
            className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
            onClick={onNeedsPasswordSetup}
          >
            Send password setup link instead
          </button>
        )}
      </div>
    </div>
  );
};

export default PlatformAdminSignInForm;
