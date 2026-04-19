import React, {useState} from "react";
import {useForm} from "react-hook-form";

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, getAuthActionCodeSettings } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/use-toast';
import * as Sentry from '@sentry/react';

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

const resetPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

const ResetPasswordForm: React.FC = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const form = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            email: '',
        },
    });
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    const sendResetEmail = async (data: z.infer<typeof resetPasswordSchema>) => {
        setIsSubmitted(true);
        try {
            await sendPasswordResetEmail(auth, data.email, getAuthActionCodeSettings());
            toast({
                variant: 'default',
                title: 'Password Reset Email Sent',
                description: 'A link to reset your password has been sent to your email address.',
            });
            navigate('/');
        } catch (error: any) {
            Sentry.withScope((scope) => {
                scope.setTag('location', 'ResetPassword.sendResetEmail');
                scope.setExtra('email', data.email);
                Sentry.captureException(error);
            });
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error.message || 'An error occurred while sending the reset email. Please try again.',
            });
            setIsSubmitted(false);
        }
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-center mb-6 text-white">Reset Your Password</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(sendResetEmail)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm text-gray-300">Email Address</FormLabel>
                                <FormControl>
                                    <Input 
                                        className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white" 
                                        type="email" 
                                        placeholder="hello@argus.ai" 
                                        {...field} 
                                    />
                                </FormControl>
                                <FormDescription className="text-xs text-gray-500">Enter the email address associated with your account.</FormDescription>
                                <FormMessage className="text-red-400">{form.formState.errors.email?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button 
                        type="submit" 
                        disabled={isSubmitted} 
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                    >
                        {isSubmitted ? <Spinner /> : 'Send Reset Link'}
                    </Button>
                </form>
            </Form>
            
            <div className='text-center mt-4'>
                <button 
                    onClick={() => navigate('/')} 
                    className='text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors duration-300'
                >
                    Back to Sign In
                </button>
            </div>
        </div>
    );
};

export default ResetPasswordForm;
