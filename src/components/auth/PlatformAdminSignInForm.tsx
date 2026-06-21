import React, { useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { authenticatePlatformAdmin } from '../../db/platformAdminCollection';
import { setRole } from '../../state_data/authSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../state_data/reducer';
import authTokenHandler from '../../functions/auth_token/auth_token_handler';
import {
  Form,
  FormControl,
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
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

interface PlatformAdminSignInFormProps {
  email: string;
}

const PlatformAdminSignInForm: React.FC<PlatformAdminSignInFormProps> = ({ email }) => {
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
      const customToken = await authenticatePlatformAdmin(email, data.password);
      const userCredential = await signInWithCustomToken(auth, customToken);
      const authToken = await userCredential.user.getIdToken();
      authTokenHandler.setAuthToken(authToken);
      dispatch(setRole('platformadmin'));
      toast({
        title: 'Signed in successfully',
        description: 'Welcome to the Argus admin portal.',
      });
      navigate('/platform-admin/dashboard');
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: msg || 'Invalid admin credentials.',
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
                <FormLabel className="text-sm text-slate-900">Admin password</FormLabel>
                <FormControl>
                  <PasswordInput
                    className="bg-white border-slate-300 focus-visible:ring-blue-600 placeholder:text-slate-400 text-slate-900"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
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
    </div>
  );
};

export default PlatformAdminSignInForm;
