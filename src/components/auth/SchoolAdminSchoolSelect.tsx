import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail, ActionCodeSettings } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import { useToast } from '../ui/use-toast';
import { verifySchoolAdminAndSendPasswordSetup } from '../../db/schoolAdminCollection';

const schoolSelectSchema = z.object({
  school: z.string().min(1, 'School is required'),
});

interface SchoolAdminSchoolSelectProps {
  email: string;
  schoolInfo: { schoolId: string; schoolName: string };
  onSchoolSelected: (selectedSchoolId: string) => void;
}

const SchoolAdminSchoolSelect: React.FC<SchoolAdminSchoolSelectProps> = ({ email, schoolInfo, onSchoolSelected }) => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const form = useForm({
    resolver: zodResolver(schoolSelectSchema),
    defaultValues: {
      school: schoolInfo.schoolId,
    },
  });

  // Set the form value when component mounts
  useEffect(() => {
    form.setValue('school', schoolInfo.schoolId);
  }, [schoolInfo.schoolId, form]);

  const onSubmit = async (data: z.infer<typeof schoolSelectSchema>) => {
    try {
      setIsSubmitted(true);
      setIsVerifying(true);

      // Backend validates email + schoolId and ensures user exists in Firebase Auth
      await verifySchoolAdminAndSendPasswordSetup(email, data.school);

      // Send password setup email via Firebase Auth (same as student reset flow)
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/auth/action`,
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);

      setLinkSent(true);
      toast({
        variant: 'default',
        title: 'Verification Link Sent',
        description: 'Please check your email for the verification link to continue.',
      });
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred. Please try again.',
      });
      setIsSubmitted(false);
      setIsVerifying(false);
    }
  };

  if (linkSent) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-8 shadow-2xl">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-center mb-4">Check Your Email</h2>
          <p className="text-gray-300 mb-6">
            We've sent a verification link to <strong>{email}</strong>. Click the link in the email to set up your password and complete your account setup.
          </p>
          <p className="text-sm text-gray-400">
            Didn't receive the email? Check your spam folder or contact us at talentsearch@argus.ai
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-center mb-2">Let's Get Your Account Set Up</h2>
        <p className="text-sm text-gray-400 text-center">Your school has been identified</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="school"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-300">School</FormLabel>
                <FormControl>
                  <Input
                    className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white cursor-not-allowed"
                    value={schoolInfo.schoolName}
                    disabled={true}
                    readOnly
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitted || isVerifying}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            {isVerifying ? <Spinner /> : isSubmitted ? <Spinner /> : 'Send Verification Link'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SchoolAdminSchoolSelect;
