import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import { useToast } from '../ui/use-toast';
import { createSchoolAdmin } from '../../db/schoolAdminCollection';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, getAuthActionCodeSettings } from '../../firebase/firebase';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';
import VerifyEmailDialog from './VerifyEmailDialog';

const passwordSetupSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

interface SchoolAdminPasswordSetupProps {
  email: string;
  schoolId: string;
  schoolInfo: { schoolId: string; schoolName: string };
}

const SchoolAdminPasswordSetup: React.FC<SchoolAdminPasswordSetupProps> = ({ email, schoolId, schoolInfo }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVerifyDialogOpen, setVerifyDialogOpen] = useState(false);

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

      // Step 1: Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, data.password);

      // Step 2: Create school admin document
      await createSchoolAdmin(email, schoolId, data.password);

      // Step 3: Send email verification
      await sendEmailVerification(userCredential.user, getAuthActionCodeSettings());

      // Step 4: Sign out and show verification dialog
      await signOut(auth);
      setVerifyDialogOpen(true);

      toast({
        variant: 'default',
        title: 'Account Created',
        description: 'Please verify your email to complete registration.',
      });
    } catch (error: any) {
      console.error('Error creating school admin account:', error);
      
      Sentry.withScope((scope) => {
        scope.setTag('location', 'SchoolAdminPasswordSetup.onSubmit');
        scope.setExtra('error', error);
        scope.setExtra('errorCode', error.code);
        scope.setExtra('errorMessage', error.message);
        scope.setExtra('email', email);
        scope.setExtra('schoolId', schoolId);
        Sentry.captureException(error);
      });

      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
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
      <h2 className="text-2xl font-semibold text-center mb-6">Set Up Your Password</h2>
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
            {isSubmitted ? <Spinner /> : 'Create Account'}
          </Button>
        </form>
      </Form>
      <VerifyEmailDialog
        isOpen={isVerifyDialogOpen}
        onClose={() => {
          setVerifyDialogOpen(false);
          navigate('/');
        }}
      />
    </div>
  );
};

export default SchoolAdminPasswordSetup;
