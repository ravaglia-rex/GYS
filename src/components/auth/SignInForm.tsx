import React, { useState } from 'react';
import ResendVerificationButton from './ResendVerificationButton';
import { UserCredential, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../firebase/firebase';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
}

const SignInForm: React.FC<SignInFormProps> = ({ email }) => {
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

    const signIn = async (data: z.infer<typeof signinSchema>) => {
        setIsSubmitted(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, data.password);
            setUserCredential(userCredential);
            if (!userCredential.user.emailVerified) {
                setLoadResendVerification(true);
                const {formLinks, completed} = await getExamIds(userCredential.user.uid);
                const hasPermission = formLinks.includes('npByEB') && !completed[formLinks.indexOf('npByEB')];
                if(!hasPermission){
                    toast({
                        variant: 'destructive',
                        title: 'Email not verified',
                        description: 'Please verify your email to continue.',
                    });
                    
                    await signOut(auth);
                    navigate('/');
                    setIsSubmitted(false);
                    return;
                }
            }
            toast({
                variant: 'default',
                title: 'Signed in successfully!',
                description: `Welcome back, ${userCredential.user.email}`,
            });
            navigate('/dashboard');
        } catch (error: any) {
            analytics.track('Sign In Failed', {
                email,
                error: error.message,
            });
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error.message || 'An error occurred while signing in. Please try again.',
            });
            setIsSubmitted(false);
        }
    };

    return (
        <div className="bg-white bg-opacity-75 backdrop-filter backdrop-blur-lg p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-2xl font-semibold text-center mb-6">Sign in to Argus</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(signIn)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormDescription className="text-xs">Minimum of 6 characters</FormDescription>
                                <FormMessage>{form.formState.errors.password?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSubmitted} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
                        {isSubmitted ? <Spinner /> : 'Sign In'}
                    </Button>
                </form>
            </Form>
            
            <div className='text-center mt-4'>
                {loadResendVerification && <ResendVerificationButton userCredential={userCred}/>}
                <Link to='/reset-password' className='text-sm text-blue-600 hover:underline'>
                    Forgot password?
                </Link>
            </div>
        </div>
    );
};

export default SignInForm;
