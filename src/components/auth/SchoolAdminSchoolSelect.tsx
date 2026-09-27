import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import { useToast } from '../ui/use-toast';
import SignInForm from './SignInForm';
import { verifySchoolAdminAndSendPasswordSetup } from '../../db/schoolAdminCollection';

const schoolSelectSchema = z.object({
  school: z.string().min(1, 'School is required'),
});

interface SchoolAdminSchoolSelectProps {
  email: string;
  schoolInfo: { schoolId: string; schoolName: string; verified?: boolean };
}

function describeSetupError(error: unknown): { title: string; description: string } {
  const message =
    error instanceof Error && error.message.trim()
      ? error.message
      : 'An error occurred. Please try again.';
  const lower = message.toLowerCase();
  if (lower.includes('payment')) {
    return { title: 'Payment required', description: message };
  }
  if (lower.includes('too many') || lower.includes('rate')) {
    return { title: 'Too many attempts', description: message };
  }
  if (lower.includes('does not match')) {
    return { title: 'Email mismatch', description: message };
  }
  if (lower.includes('could not send') || lower.includes('password link')) {
    return { title: 'Could not send email', description: message };
  }
  return { title: 'Could not send link', description: message };
}

const SchoolAdminSchoolSelect: React.FC<SchoolAdminSchoolSelectProps> = ({ email, schoolInfo }) => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [cooldownOnly, setCooldownOnly] = useState(false);
  const [showSignInInstead, setShowSignInInstead] = useState(false);

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

      // Single atomic call: Auth user + password-setup email
      const result = await verifySchoolAdminAndSendPasswordSetup(email, data.school);
      const wasCooldown = result.cooldown === true || result.sent === false;

      setCooldownOnly(wasCooldown);
      setLinkSent(true);
      toast({
        variant: 'default',
        title: wasCooldown ? 'Link already sent' : 'Verification Link Sent',
        description: wasCooldown
          ? 'A setup link was recently emailed. Check inbox and spam — you can request a new one after about 30 seconds.'
          : 'Please check your email for the verification link to continue.',
      });
    } catch (error: unknown) {
      console.error('Error sending verification email:', error);
      const { title, description } = describeSetupError(error);
      toast({
        variant: 'destructive',
        title,
        description,
      });
      setIsSubmitted(false);
      setIsVerifying(false);
    }
  };

  const cardClass =
    'rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-lg sm:px-7 sm:py-9';

  if (showSignInInstead) {
    return (
      <SignInForm
        email={email}
        isSchoolAdmin
        schoolInfo={{
          schoolId: schoolInfo.schoolId,
          schoolName: schoolInfo.schoolName,
          verified: schoolInfo.verified,
        }}
      />
    );
  }

  if (linkSent) {
    return (
      <div className={cardClass}>
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
              <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">Check your email</h2>
          <p className="mx-auto mb-6 max-w-md text-base leading-relaxed text-slate-600">
            {cooldownOnly ? (
              <>
                A password setup link was recently sent to{' '}
                <strong className="font-semibold text-slate-900">{email}</strong>. Check inbox and spam —
                you can request a new link after about 30 seconds if needed.
              </>
            ) : (
              <>
                We&apos;ve sent a verification link to{' '}
                <strong className="font-semibold text-slate-900">{email}</strong>. Click the link in the
                email to set up your password and complete your account setup.
              </>
            )}
          </p>
          <p className="mx-auto max-w-md border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-600">
            Didn&apos;t receive the email? Check your spam folder, mark the email as not spam if it lands there, or contact us at{' '}
            <a
              href="mailto:globalyoungscholar@argus.ai"
              className="font-medium text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline"
            >
              globalyoungscholar@argus.ai
            </a>
          </p>
          <p className="mx-auto mt-6 max-w-md text-center text-sm text-slate-600">
            Already set a password (for example on the Firebase reset page)?{' '}
            <button
              type="button"
              className="font-medium text-blue-700 underline-offset-2 hover:underline"
              onClick={() => setShowSignInInstead(true)}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Let&apos;s get your account set up</h2>
        <p className="mt-3 text-sm text-slate-600">Your school has been identified</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="school"
            render={() => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-900">School</FormLabel>
                <FormControl>
                  <Input
                    className="h-10 rounded-md border-slate-300 bg-slate-50 text-sm text-slate-900 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-100"
                    value={schoolInfo.schoolName}
                    disabled={true}
                    readOnly
                  />
                </FormControl>
                <FormMessage className="text-red-600" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitted || isVerifying}
            className="h-10 w-full rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 py-2 font-semibold text-white transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
          >
            {isVerifying ? <Spinner /> : isSubmitted ? <Spinner /> : 'Send verification link'}
          </Button>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already set a password?{' '}
            <button
              type="button"
              className="font-medium text-blue-700 underline-offset-2 hover:underline"
              onClick={() => setShowSignInInstead(true)}
            >
              Sign in
            </button>
          </p>
        </form>
      </Form>
    </div>
  );
};

export default SchoolAdminSchoolSelect;
