import React, {useState} from "react";
import {useForm} from "react-hook-form";

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, getAuthActionCodeSettings } from '../../firebase/firebase';
import { Link, useNavigate } from 'react-router-dom';
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

    const cardClass =
        "w-full rounded-2xl border border-white/15 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-md sm:p-10";

    return (
        <div className={cardClass}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(sendResetEmail)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-slate-200">Email address</FormLabel>
                                <FormControl>
                                    <Input
                                        className="h-11 border-white/15 bg-slate-950/50 text-base text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@school.edu"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs text-slate-500">
                                    Use the same email as your Argus account (student or school admin).
                                </FormDescription>
                                <FormMessage className="text-red-400" />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        disabled={isSubmitted}
                        className="h-12 w-full text-base font-semibold shadow-lg transition-all bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
                    >
                        {isSubmitted ? <Spinner /> : "Send reset link"}
                    </Button>
                </form>
            </Form>

            <div className="mt-6 text-center">
                <Link
                    to="/"
                    className="text-sm font-medium text-indigo-300 hover:text-indigo-200 hover:underline"
                >
                    Back to sign in
                </Link>
            </div>
        </div>
    );
};

export default ResetPasswordForm;
