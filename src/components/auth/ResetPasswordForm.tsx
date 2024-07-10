import React, {useState} from "react";
import {useForm} from "react-hook-form";

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
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
            await sendPasswordResetEmail(auth, data.email);
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
        <div className="bg-white bg-opacity-75 backdrop-filter backdrop-blur-lg p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-2xl font-semibold text-center mb-6">Reset Your Password</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(sendResetEmail)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="hello@argus.ai" {...field} />
                                </FormControl>
                                <FormDescription className="text-xs">Enter the email address associated with your account.</FormDescription>
                                <FormMessage>{form.formState.errors.email?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSubmitted} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                        {isSubmitted ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default ResetPasswordForm;
