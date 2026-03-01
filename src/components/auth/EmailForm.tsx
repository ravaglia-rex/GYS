
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

import * as Sentry from '@sentry/react';
import analytics from '../../segment/segment';

import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import SchoolAdminSignUpForm from './SchoolAdminSignUpForm';
import SchoolAdminSchoolSelect from './SchoolAdminSchoolSelect';
import SchoolAdminPasswordSetup from './SchoolAdminPasswordSetup';

const EmailSchema = z.object({
  email: z.string().email().min(1, 'Email is required'),
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

      const exists = await checkEmailExists(data.email.toLowerCase());
      setEmail(data.email.toLowerCase());
      setEmailExists(exists);
  
      if (!exists) {
        analytics.track('[DIRECT] New User Flow', { email: data.email });
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
  /// Update the render section
if (emailExists === true) {
  if (isSchoolOfficial && schoolInfo) {
    return <SignInForm email={email} isSchoolAdmin={true} schoolInfo={schoolInfo} />;
  }
  return <SignInForm email={email} />;
}

if (emailExists === false) {
  if (isSchoolOfficial && schoolInfo) {
    // School selection - no longer goes directly to password setup
    // Password setup happens via email link
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
  return <SignUpForm email={email} setEmailExists={setEmailExists} />;
}
  // Default: show email entry form
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Welcome to Argus</h2>
        <p className="mt-1 text-sm text-gray-400">Sign in to continue to your exam portal</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-300">Email address</FormLabel>
                <FormControl>
                  <Input
                    className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white"
                    type="email"
                    placeholder="you@school.edu"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-gray-500">
                  We'll never share your email.
                </FormDescription>
                <FormMessage className="text-red-400">{form.formState.errors.email?.message}</FormMessage>
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
                    className="border-white/10"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm text-gray-300 cursor-pointer">
                    I am a school official logging into the school dashboard
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            disabled={isSubmitted} 
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            {isSubmitted ? <Spinner /> : 'Continue'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EmailEntryForm;
