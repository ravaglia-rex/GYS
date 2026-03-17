
import React, { useState, useEffect } from 'react';
import { checkEmailExists } from '../../db/emailMappingCollection';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Checkbox } from '../ui/checkbox';
import { checkSchoolEmail, SchoolEmailCheck } from '../../db/schoolAdminCollection';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

import * as Sentry from '@sentry/react';
import analytics from '../../segment/segment';

import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import SchoolAdminSignUpForm from './SchoolAdminSignUpForm';
import SchoolAdminSchoolSelect from './SchoolAdminSchoolSelect';
import SchoolAdminPasswordSetup from './SchoolAdminPasswordSetup';

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.in',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
]);

const getEmailDomain = (email: string) => {
  const at = email.lastIndexOf('@');
  if (at === -1) return '';
  return email.slice(at + 1).trim().toLowerCase();
};

const EmailSchema = z.object({
  email: z
    .string()
    .email()
    .min(1, 'Email is required')
    .refine((value) => !PERSONAL_EMAIL_DOMAINS.has(getEmailDomain(value)), {
      message: 'Please use your school email address (not Gmail/Yahoo/etc.).',
    }),
  isSchoolOfficial: z.boolean().optional(),
});

const EmailEntryForm: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [emailExists, setEmailExists] = useState<boolean|null>(null);
  const [isSchoolOfficial, setIsSchoolOfficial] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolEmailCheck | null>(null);
  const [checkingSchool, setCheckingSchool] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [showNoAccountDialog, setShowNoAccountDialog] = useState(false);


  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(EmailSchema),
    defaultValues: { 
      email: '',
      isSchoolOfficial: false,
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate('/dashboard');
    });
    return () => unsubscribe();
  }, [navigate]);
  const onSubmit = async (data: z.infer<typeof EmailSchema>) => {
    // Never navigate to school-admin/dashboard from here. All users must go through SignInForm and enter password.
    setIsSubmitted(true);
    setCheckingSchool(false);

    try {
      // If school official checkbox is checked
      if (data.isSchoolOfficial) {
        setIsSchoolOfficial(true);
        setCheckingSchool(true);
        try {
          const schoolData = await checkSchoolEmail(data.email.toLowerCase());
          
          if (!schoolData) {
            toast({
              variant: 'destructive',
              title: 'Access Denied',
              description: 'You are not allowed to access this portal. Please contact us at talentsearch@argus.ai',
            });
            setIsSubmitted(false);
            setCheckingSchool(false);
            setIsSchoolOfficial(false);
            return;
          }
          
          setSchoolInfo(schoolData);
          setEmail(data.email.toLowerCase());
          setEmailExists(schoolData.verified);
          setCheckingSchool(false);
          return;
        } catch (error: any) {
          console.error('Error in checkSchoolEmail:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'There was an issue checking your email. Please try again later.',
          });
          setIsSubmitted(false);
          setCheckingSchool(false);
          setIsSchoolOfficial(false);
          return;
        }
      }
  
      // Normal student flow - reset school official state
      setIsSchoolOfficial(false);

      const normalizedEmail = data.email.toLowerCase().trim();
      const exists = await checkEmailExists(normalizedEmail);
      setEmail(normalizedEmail);
  
      if (!exists) {
        analytics.track('[DIRECT] New User Flow', { email: data.email });
        setShowNoAccountDialog(true);
      } else {
        setEmailExists(exists);
      }
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'EmailEntryForm.onSubmit');
        scope.setExtra('email', data.email);
        Sentry.captureException(error);
      });
      toast({
        variant: 'destructive',
        title: 'Whoops!',
        description: 'There was an issue checking your email. Please try again later.',
        duration: 2000,
      });
    } finally {
      setIsSubmitted(false);
      setCheckingSchool(false);
    }
  };
  if (emailExists === true) {
  if (isSchoolOfficial && schoolInfo) {
    return <SignInForm email={email} isSchoolAdmin={true} schoolInfo={schoolInfo} />;
  }
  return <SignInForm email={email} />;
}

if (emailExists === false && isSchoolOfficial && schoolInfo) {
  return (
    <SchoolAdminSchoolSelect 
      email={email} 
      schoolInfo={schoolInfo}
      onSchoolSelected={(schoolId) => {
        // This callback is no longer used since link is sent
        // But keeping it for consistency
      }}
    />
  );
}

  // Default: show email entry form (+ no-account dialog when triggered)
  return (
    <>
      <Dialog open={showNoAccountDialog} onOpenChange={setShowNoAccountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-blue-50 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-center text-slate-900">No account found</DialogTitle>
            <DialogDescription className="text-center text-slate-600">
              We couldn't find an account for <span className="font-semibold text-slate-800">{email}</span>. You'll need to create a student account to access the exam portal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => navigate('/students/register')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
            >
              Create Student Account
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNoAccountDialog(false)}
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Try a different email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-lg sm:px-7 sm:py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Welcome to Argus</h2>
          <p className="mt-1 text-sm text-slate-600">Sign in to continue to your exam portal</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-slate-900">Email address</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white border-slate-300 focus-visible:ring-blue-600 placeholder:text-slate-400 text-slate-900"
                      type="email"
                      placeholder="you@school.edu"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">
                    Students should use their <span className="font-semibold">school email address</span> (not Gmail/Yahoo/etc.).
                  </FormDescription>
                  <FormMessage className="text-red-500">{form.formState.errors.email?.message}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isSchoolOfficial"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-slate-300"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm text-slate-800 cursor-pointer">
                      I am a school official logging into the school dashboard
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={isSubmitted} 
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md font-semibold transition-all duration-300"
            >
              {isSubmitted ? <Spinner /> : 'Continue'}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
};

export default EmailEntryForm;
