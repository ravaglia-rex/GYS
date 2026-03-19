import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkActionCode, confirmPasswordReset, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useToast } from "../ui/use-toast";

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
import { LoadingSpinner as Spinner } from "../ui/spinner";

import * as Sentry from "@sentry/react";

interface PasswordResetProps {
    actionCode: string;
}

const passwordResetSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"]
});

const NewPasswordForm: React.FC<PasswordResetProps> = ({ actionCode }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isSubmitted, setSubmitted] = useState<boolean>(false);
    const form = useForm({
        resolver: zodResolver(passwordResetSchema),
        defaultValues: {
            password: '',
            confirm_password: '',
        }
    });

    const onSubmit = async (data: { password: string, confirm_password: string }) => {
        try {
            setSubmitted(true);

            // Get email from action code (confirmPasswordReset does not sign the user in)
            const actionCodeInfo = await checkActionCode(auth, actionCode);
            const email = actionCodeInfo.data?.email;
            if (!email) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not determine email from link. Please use the link from your email again.',
                });
                setSubmitted(false);
                return;
            }

            await confirmPasswordReset(auth, actionCode, data.password);

            // Sign in so we have a token to call verifySchoolEmail for school admins
            const { user } = await signInWithEmailAndPassword(auth, email, data.password);
            try {
                const { checkSchoolEmail, verifySchoolEmail } = await import('../../db/schoolAdminCollection');
                const schoolInfo = await checkSchoolEmail(user.email!);
                if (schoolInfo && !schoolInfo.verified) {
                    const authToken = await user.getIdToken();
                    const { default: authTokenHandler } = await import('../../functions/auth_token/auth_token_handler');
                    authTokenHandler.setAuthToken(authToken);
                    await verifySchoolEmail(user.email!);
                }
            } catch (err: any) {
                console.error('Error verifying school email:', err);
                toast({
                    variant: 'destructive',
                    title: 'Verification update failed',
                    description: err.response?.data?.error ?? err.message ?? 'Could not mark school as verified.',
                });
            }

            await signOut(auth);
            toast({
                variant: 'default',
                title: 'Password Reset Successful',
                description: 'You have successfully reset your password. Redirecting to login...'
            });
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error: any) {
            Sentry.withScope((scope) => {
                scope.setTag('location', 'PasswordResetForm.confirmPasswordReset');
                Sentry.captureException(error);
            });
            toast({
                variant: 'destructive',
                title: 'Password Reset Error',
                description: error.message
            });
        } finally {
            setSubmitted(false);
        }
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-8 shadow-2xl">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm text-gray-300">New Password</FormLabel>
                                <FormControl>
                                    <Input 
                                        className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white" 
                                        {...field} 
                                        type="password" 
                                        placeholder="••••••••" 
                                    />
                                </FormControl>
                                <FormDescription className='text-xs text-gray-500'>Pick something unique...something memorable</FormDescription>
                                <FormMessage className="text-red-400">{form.formState.errors.password?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirm_password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm text-gray-300">Confirm New Password</FormLabel>
                                <FormControl>
                                    <Input 
                                        className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white" 
                                        {...field} 
                                        type="password" 
                                        placeholder="••••••••" 
                                    />
                                </FormControl>
                                <FormDescription className='text-xs text-gray-500'>Confirm your new password</FormDescription>
                                <FormMessage className="text-red-400">{form.formState.errors.confirm_password?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button 
                        type="submit" 
                        disabled={isSubmitted} 
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                    >
                        {isSubmitted ? <Spinner /> : 'Reset Password'}
                    </Button>
                </form>
            </Form>
        </div>
    );
}

export default NewPasswordForm;
