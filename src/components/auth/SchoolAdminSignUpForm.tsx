import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { fetchSchoolNamesAndIds } from '../../db/schoolCollection';
import { createSchoolAdmin } from '../../db/schoolAdminCollection';
import VerifyEmailDialog from './VerifyEmailDialog';
import * as Sentry from '@sentry/react';

const schoolAdminSignupSchema = z.object({
  school: z.string().min(1, 'School is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

interface SchoolAdminSignUpFormProps {
  email: string;
  schoolInfo: { schoolId: string; schoolName: string };
}

const SchoolAdminSignUpForm: React.FC<SchoolAdminSignUpFormProps> = ({ email, schoolInfo }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [schoolsList, setSchoolsList] = useState<{ id: string; name: string }[]>([]);
  const [isVerifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [userCred, setUserCred] = useState<any>(null);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true); // Add loading state

  const form = useForm({
    resolver: zodResolver(schoolAdminSignupSchema),
    defaultValues: {
      school: schoolInfo.schoolId,
      password: '',
      confirm_password: '',
    },
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoadingSchools(true); // Set loading to true
        const schools = await fetchSchoolNamesAndIds();
        // Sort schools alphabetically by name
        const sortedSchools = schools.sort((a: { id: string; name: string }, b: { id: string; name: string }) => 
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
        setSchoolsList(sortedSchools);
      } catch (error) {
        console.error('Error fetching schools:', error);
      } finally {
        setIsLoadingSchools(false); // Set loading to false when done
      }
    };
    fetchSchools();
  }, []);

  const onSubmit = async (data: z.infer<typeof schoolAdminSignupSchema>) => {
    try {
      setIsSubmitted(true);

      // Validate that selected school matches the email's school
      if (data.school !== schoolInfo.schoolId) {
        toast({
          variant: 'destructive',
          title: 'School Mismatch',
          description: 'The selected school does not match your email. Please contact us at talentsearch@argus.ai',
        });
        setIsSubmitted(false);
        return;
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, data.password);
      setUserCred(userCredential);

      // Create school admin document
      await createSchoolAdmin(email, schoolInfo.schoolId, data.password);

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Sign out and show verification dialog
      await signOut(auth);
      setVerifyDialogOpen(true);

      toast({
        variant: 'default',
        title: 'Account Created',
        description: 'Please verify your email to complete registration.',
      });
    } catch (error: any) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'SchoolAdminSignUpForm.onSubmit');
        Sentry.captureException(error);
      });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred. Please try again.',
      });
      setIsSubmitted(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-8 shadow-2xl">
        <h2 className="text-2xl font-semibold text-center mb-6">Let's Get Your Account Setup</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-300">School</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoadingSchools} // Disable while loading
                    >
                      <SelectTrigger className="bg-gray-900/60 border-white/10 text-white">
                        <SelectValue placeholder={isLoadingSchools ? "Loading schools..." : "Select school"} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10">
                        {isLoadingSchools ? (
                          <div className="p-4 text-center text-gray-400">
                            <Spinner />
                            <p className="mt-2">Loading schools...</p>
                          </div>
                        ) : (
                          schoolsList.map((school) => (
                            <SelectItem key={school.id} value={school.id} className="text-white">
                              {school.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
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
              disabled={isSubmitted || isLoadingSchools} // Disable button while loading
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              {isSubmitted ? <Spinner /> : 'Create Account'}
            </Button>
          </form>
        </Form>
      </div>
      <VerifyEmailDialog
        isOpen={isVerifyDialogOpen}
        onClose={() => {
          setVerifyDialogOpen(false);
          navigate('/');
        }}
      />
    </>
  );
};

export default SchoolAdminSignUpForm;