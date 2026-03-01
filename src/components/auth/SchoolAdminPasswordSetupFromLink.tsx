import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import { useToast } from '../ui/use-toast';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';
import { checkSchoolEmail, verifySchoolEmail } from '../../db/schoolAdminCollection';
import authTokenHandler from '../../functions/auth_token/auth_token_handler';

const passwordSetupSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

interface SchoolAdminPasswordSetupFromLinkProps {
  actionCode: string;
}

const SchoolAdminPasswordSetupFromLink: React.FC<SchoolAdminPasswordSetupFromLinkProps> = ({ actionCode }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: {
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof passwordSetupSchema>) => {
    try {
      setIsSubmitted(true);

      // Confirm password reset (this sets the password)
      await confirmPasswordReset(auth, actionCode, data.password);

      // After password is set, check if this is a school admin and update verified status
      // Note: After confirmPasswordReset, the user is automatically signed in
      const user = auth.currentUser;
      if (user?.email) {
        try {
          const schoolInfo = await checkSchoolEmail(user.email);
          if (schoolInfo && !schoolInfo.verified) {
            const authToken = await user.getIdToken();
            authTokenHandler.setAuthToken(authToken);
            await verifySchoolEmail(user.email);
          }
        } catch (error) {
          console.error('Error verifying school email:', error);
        }
      }

      toast({
        variant: 'default',
        title: 'Password Set Successfully',
        description: 'Your account has been created. Redirecting to login...',
      });

      // Sign out and redirect to login
      await auth.signOut();
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      console.error('Error setting password:', error);
      
      Sentry.withScope((scope) => {
        scope.setTag('location', 'SchoolAdminPasswordSetupFromLink.onSubmit');
        scope.setExtra('error', error);
        scope.setExtra('errorCode', error.code);
        scope.setExtra('errorMessage', error.message);
        Sentry.captureException(error);
      });

      let errorMessage = 'An error occurred. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      setIsSubmitted(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-8 shadow-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-300">Password</FormLabel>
                <FormControl>
                  <Input
                    className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white"
                    type="password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-gray-500">Minimum of 6 characters</FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-300">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white"
                    type="password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitted}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            {isSubmitted ? <Spinner /> : 'Set Password'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SchoolAdminPasswordSetupFromLink;
