import React, { useEffect, useState } from 'react';
import ResendVerificationButton from './ResendVerificationButton';
import { UserCredential, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../firebase/firebase';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { fetchSchoolNamesAndIds } from '../../db/schoolCollection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { checkUserRole } from '../../state_data/authSlice';
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
import { Input } from '../ui/input';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import { useToast } from '../ui/use-toast';
import { getExamIds } from '../../db/studentExamMappings';
import analytics from '../../segment/segment';

const signinSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

interface SignInFormProps {
    email: string;
    isSchoolAdmin?: boolean;
    schoolInfo?: { schoolId: string; schoolName: string };
}
const SignInForm: React.FC<SignInFormProps> = ({ email, isSchoolAdmin, schoolInfo }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            password: '',
        },
    });
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [loadResendVerification, setLoadResendVerification] = useState<boolean>(false);
    const [userCred, setUserCredential] = useState<UserCredential | null>(null);
    const dispatch = useDispatch<AppDispatch>();

    const signIn = async (data: z.infer<typeof signinSchema>) => {
        setIsSubmitted(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, data.password);
            setUserCredential(userCredential);
            const authToken = await userCredential.user.getIdToken();
            authTokenHandler.setAuthToken(authToken);
            
            // For school admins, email must be verified
            if (isSchoolAdmin) {
              if (!userCredential.user.emailVerified) {
                toast({
                  variant: 'destructive',
                  title: 'Email not verified',
                  description: 'Please verify your email to continue.',
                });
                await signOut(auth);
                setIsSubmitted(false);
                return;
              }
    
              // Use schoolInfo.schoolId directly - no need for user selection
              // schoolInfo is already validated from email check
    
              // Check user role and redirect
              await dispatch(checkUserRole(userCredential.user.email || ''));
              navigate('/school-admin/dashboard');
              return;
            }
    
            // Existing student flow...
            if (!userCredential.user.emailVerified) {
                toast({
                    variant: 'destructive',
                    title: 'Email not verified',
                    description: 'Please verify your email to continue.',
                });
                setLoadResendVerification(true);
                setIsSubmitted(false);
                return;
            }
            
            // Check user role and redirect accordingly
            await dispatch(checkUserRole(userCredential.user.email || ''));
            
            toast({
                variant: 'default',
                title: 'Signed in successfully!',
                description: `Welcome back, ${userCredential.user.email}`,
            });
            
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Sign in error:', error);
            toast({
                variant: 'destructive',
                title: 'Sign in failed',
                description: error.message || 'An error occurred. Please try again.',
            });
            setIsSubmitted(false);
        }
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-center mb-6">Sign in to Argus</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(signIn)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm text-gray-300">Password</FormLabel>
                                <FormControl>
                                    <Input className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white" type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">Minimum of 6 characters</FormDescription>
                                <FormMessage className="text-red-400">{form.formState.errors.password?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button 
                        type="submit" 
                        disabled={isSubmitted} 
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                    >
                        {isSubmitted ? <Spinner /> : 'Sign In'}
                    </Button>
                </form>
            </Form>
            
            <div className='text-center mt-4'>
                {loadResendVerification && <ResendVerificationButton userCredential={userCred}/>}
                <Link to='/reset-password' className='text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors duration-300'>
                    Forgot password?
                </Link>
            </div>
        </div>
    );
};


export default SignInForm;
