import React, { useCallback, useState } from 'react';
import { UserCredential, reload, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../firebase/firebase';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  checkSchoolEmail,
  listSchoolsForAdminEmail,
  verifySchoolEmail,
  type SchoolEmailCheck,
} from '../../db/schoolAdminCollection';
import {
  listSchoolsForStudentEmail,
  setStudentActiveSchool,
  type StudentSchoolOption,
} from '../../db/studentCollection';
import { isHiddenStaffStudentEmail } from '../../constants/hiddenStaffStudents';
import { checkUserRole, setRole, setSchoolAdmin } from '../../state_data/authSlice';
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
import SchoolAdminSchoolPicker, { type SchoolAdminPickerOption } from './SchoolAdminSchoolPicker';

const signinSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

function getFirebaseAuthErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
}

function describeSignInError(error: unknown, isSchoolAdmin?: boolean): { title: string; description: string } {
  const code = getFirebaseAuthErrorCode(error);
  if (!isSchoolAdmin && ['auth/invalid-credential', 'auth/invalid-login-credentials'].includes(code)) {
    return {
      title: 'Set up your password first',
      description:
        'Before signing in, create your password using the setup link we sent to your email. If the link expired, use Forgot password to get a new one.',
    };
  }

  const message = error instanceof Error ? error.message : '';
  return {
    title: 'Sign in failed',
    description: message || 'An error occurred. Please try again.',
  };
}

async function revertPartialStudentSignIn(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    /* ignore */
  }
  authTokenHandler.clearToken();
}

interface SignInFormProps {
    email: string;
    isSchoolAdmin?: boolean;
    schoolInfo?: { schoolId: string; schoolName: string; verified?: boolean };
}
const SignInForm: React.FC<SignInFormProps> = ({ email, isSchoolAdmin }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            password: '',
        },
    });
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [multiSchoolOptions, setMultiSchoolOptions] = useState<SchoolEmailCheck[] | null>(null);
    const [multiStudentSchoolOptions, setMultiStudentSchoolOptions] = useState<StudentSchoolOption[] | null>(null);
    const dispatch = useDispatch<AppDispatch>();

    const enterSchoolPortal = useCallback(
      (school: Pick<SchoolEmailCheck, 'schoolId' | 'schoolName'>, signedInEmail: string) => {
        dispatch(
          setSchoolAdmin({
            email: signedInEmail,
            schoolId: school.schoolId,
            role: 'admin',
          })
        );
        dispatch(setRole('schooladmin'));
        toast({
          variant: 'default',
          title: 'Signed in successfully!',
          description: `Welcome to ${school.schoolName || 'your school'} portal`,
        });
        navigate('/school-admin/dashboard');
      },
      [dispatch, navigate, toast]
    );

    const finishStudentSignIn = useCallback(
      async (schoolName?: string) => {
        toast({
          variant: 'default',
          title: 'Signed in successfully!',
          description: schoolName
            ? `Welcome back - ${schoolName}`
            : `Welcome back, ${email}`,
        });
        navigate('/dashboard');
        return true;
      },
      [email, navigate, toast]
    );

    const enterStudentSchool = useCallback(
      async (school: SchoolAdminPickerOption) => {
        await setStudentActiveSchool(school.schoolId);
        setMultiStudentSchoolOptions(null);
        await finishStudentSignIn(school.schoolName);
      },
      [finishStudentSignIn]
    );

    const completeStudentSignIn = useCallback(
      async (userCredential: UserCredential) => {
        const signedInEmail = (userCredential.user.email || email).toLowerCase().trim();
        const roleResult = await dispatch(checkUserRole(signedInEmail)).unwrap();
        if (roleResult.role === 'schooladmin') {
          toast({
            variant: 'destructive',
            title: 'Use the school official sign-in',
            description:
              'This email is registered for a school official account and cannot be used to enter the student dashboard.',
          });
          await revertPartialStudentSignIn();
          return false;
        }

        if (isHiddenStaffStudentEmail(signedInEmail)) {
          let schools: StudentSchoolOption[] = [];
          try {
            schools = await listSchoolsForStudentEmail();
          } catch (listErr) {
            console.warn('listSchoolsForStudentEmail failed:', listErr);
            return finishStudentSignIn();
          }

          if (schools.length > 1) {
            setMultiStudentSchoolOptions(schools);
            setIsSubmitted(false);
            return true;
          }

          if (schools.length === 1) {
            await setStudentActiveSchool(schools[0].schoolId);
            return finishStudentSignIn(schools[0].schoolName);
          }
        }

        return finishStudentSignIn();
      },
      [dispatch, email, finishStudentSignIn, toast]
    );

    const signIn = async (data: z.infer<typeof signinSchema>) => {
        setIsSubmitted(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, data.password);
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
                    'School dashboard unlocks after your registration payment completes. Finish checkout on the school registration page, then sign in.',
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

              let schools: SchoolEmailCheck[] = [];
              try {
                schools = await listSchoolsForAdminEmail();
              } catch (listErr) {
                console.warn('listSchoolsForAdminEmail failed, falling back to checkSchoolEmail:', listErr);
                schools = schoolCheck ? [schoolCheck] : [];
                toast({
                  variant: 'default',
                  title: 'Could not load all schools',
                  description:
                    'Signed into one school only. Log out and try again, or use Switch school after the multi-school list loads.',
                });
              }

              if (schools.length === 0) {
                toast({
                  variant: 'destructive',
                  title: 'No school access',
                  description:
                    'No paid school portals are linked to this email yet. Finish registration payment, then try again.',
                });
                await signOut(auth);
                setIsSubmitted(false);
                return;
              }

              if (schools.length === 1) {
                enterSchoolPortal(schools[0], signedInEmail);
                return;
              }

              setMultiSchoolOptions(schools);
              setIsSubmitted(false);
              return;
            }
    
            // Password setup links prove mailbox access for student accounts created during signup.
            const signedInAsStudent = await completeStudentSignIn(userCredential);
            if (!signedInAsStudent) {
                setIsSubmitted(false);
            }
        } catch (error: unknown) {
            console.error('Sign in error:', error);
            await revertPartialStudentSignIn();
            const signInError = describeSignInError(error, isSchoolAdmin);
            toast({
                variant: 'destructive',
                title: signInError.title,
                description: signInError.description,
            });
            setIsSubmitted(false);
        }
    };

    if (multiSchoolOptions && multiSchoolOptions.length > 1) {
      return (
        <SchoolAdminSchoolPicker
          schools={multiSchoolOptions}
          email={email}
          onConfirm={(school) => {
            enterSchoolPortal(school, email);
          }}
        />
      );
    }

    if (multiStudentSchoolOptions && multiStudentSchoolOptions.length > 1) {
      return (
        <SchoolAdminSchoolPicker
          schools={multiStudentSchoolOptions}
          email={email}
          subtitle="Your staff student alias is linked to more than one school. Select which school to open."
          onConfirm={(school) => {
            void enterStudentSchool(school);
          }}
        />
      );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-lg sm:px-7 sm:py-8">
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
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md font-semibold transition-all duration-300"
                    >
                        {isSubmitted ? <Spinner /> : 'Sign In'}
                    </Button>
                </form>
            </Form>
            
            <div className='text-center mt-4'>
                <Link to='/reset-password' className='text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-300'>
                    Forgot password?
                </Link>
            </div>
        </div>
    );
};


export default SignInForm;
