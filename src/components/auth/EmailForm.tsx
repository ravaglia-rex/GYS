import React, { useState, useEffect } from 'react';
import { checkEmailExists } from '../../db/emailMappingCollection';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
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
import { useToast } from '../ui/use-toast';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import * as Sentry from '@sentry/react';

interface EmailEntryFormProps {
    setEmail: (email: string) => void;
    setEmailExists: (emailExists: boolean|null) => void;
}

const EmailSchema = z.object({
    email: z.string().email().min(1, 'Email is required'),
})

const EmailEntryForm: React.FC<EmailEntryFormProps> = ({ setEmail, setEmailExists }) => {
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const navigate = useNavigate();
    const form = useForm({
        resolver: zodResolver(EmailSchema),
        defaultValues: {
            email: '',
        },
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/dashboard');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const onSubmit = async (data: z.infer<typeof EmailSchema>) => {
        setIsSubmitted(true);
        try {
            const emailExists = await checkEmailExists(data.email);
            setEmail(data.email);
            setEmailExists(emailExists);
        } catch (error) {
            Sentry.withScope((scope) => {
                scope.setTag('location', 'EmailEntryForm.onSubmit');
                scope.setExtra('email', data.email);
                Sentry.captureException(error);
            });
            toast({
                variant: 'destructive',
                title: 'Whoops!',
                description: 'There was an issue checking your email. Please try again later or email us at talentsearch@argus.ai',
                duration: 2000,
            });
        } finally {
            setIsSubmitted(false);
        }
    };

    return (
        <div className="bg-white bg-opacity-75 backdrop-filter backdrop-blur-lg p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-2xl font-semibold text-center mb-6">Welcome to Argus</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="hello@argus.ai" {...field} />
                                </FormControl>
                                <FormDescription className="text-xs">We'll never share your email.</FormDescription>
                                <FormMessage>{form.formState.errors.email?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSubmitted} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex justify-center items-center">
                        {isSubmitted ? <Spinner /> : 'Continue'}
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default EmailEntryForm;
