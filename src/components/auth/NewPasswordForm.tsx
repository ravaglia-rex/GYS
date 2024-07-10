import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
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
            await confirmPasswordReset(auth, actionCode, data.password);
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
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white bg-opacity-75 backdrop-filter backdrop-blur-lg p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-semibold text-center mb-6">Reset Your Password</h2>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="password" placeholder="••••••••" />
                                    </FormControl>
                                    <FormDescription className='text-xs'>Pick something unique...something memorable</FormDescription>
                                    <FormMessage>{form.formState.errors.password?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirm_password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="password" placeholder="••••••••" />
                                    </FormControl>
                                    <FormDescription className='text-xs'>Confirm your new password</FormDescription>
                                    <FormMessage>{form.formState.errors.confirm_password?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                        <FormControl>
                            <Button type="submit" disabled={isSubmitted} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
                                {isSubmitted ? <Spinner /> : 'Reset Password'}
                            </Button>
                        </FormControl>
                    </form>
                </Form>
            </div>
        </div>
    );
}

export default NewPasswordForm;
