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
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../ui/use-toast';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import { checkExamIDExists } from '../../db/phase1UIDCollection';
import { getUserData } from '../../db/phase1ResponsesCollection';

interface EmailEntryFormProps {
    setEmail: (email: string) => void;
    setEmailExists: (emailExists: boolean|null) => void;
    setExamID: (examID: string) => void;
    setIsQualified: (qualified: boolean | null) => void;
    setEligibilityDateTime: (dateTime: string) => void;
}

const EmailSchema = z.object({
    email: z.string().email().min(1, 'Email is required'),
    hasExamId: z.boolean(),
    examId: z.string().optional(),
}).refine(data => !data.hasExamId || (data.hasExamId && data.examId), {
    message: 'Exam ID is required',
    path: ['examId'],
});

const EmailEntryForm: React.FC<EmailEntryFormProps> = ({ setEmail, setEmailExists, setExamID, setIsQualified, setEligibilityDateTime }) => {
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const navigate = useNavigate();
    const form = useForm({
        resolver: zodResolver(EmailSchema),
        defaultValues: {
            email: '',
            hasExamId: false,
            examId: '',
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
            if(emailExists) {
                setEmailExists(emailExists);
            }
            if (!emailExists) {
                if (data.hasExamId && data.examId) {
                    try {
                        const examIDExists = await checkExamIDExists(data.examId);
                        if (examIDExists) {
                            form.setError("examId", {
                                type: "manual",
                                message: "Exam ID already used! If you think this is a mistake, please contact us at talentsearch@argus.ai"
                            });
                        }
                        const result = await getUserData(data.examId);
                        if ('message' in result) {
                            if (result.message === "User not created yet") {
                                form.setError("examId", {
                                    type: "manual",
                                    message: "User hasn't been created yet. Please check back later or email talentsearch@argus.ai"
                                });
                                setIsSubmitted(false);
                                return;
                            } else if (result.message === "User has to be waitlisted") {
                                setExamID(data.examId);
                                setIsQualified(false);
                                setEmailExists(false);
                            }
                        } else if ('eligibleDateTime' in result) {
                            setExamID(data.examId);
                            setIsQualified(true);
                            setEmailExists(false);
                            setEligibilityDateTime(result.eligibleDateTime);
                        }
                    } catch (error) {
                        toast({
                            variant: 'destructive',
                            title: 'Uh oh!',
                            description: 'There was an issue checking your exam ID. Please try again later or email us at talentsearch@argus.ai',
                            duration: 2000,
                        });
                        setIsSubmitted(false);
                        return;
                    }
                } else {
                    setEmailExists(false);
                }
            }
        } catch (error) {
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
                    <FormField
                        control={form.control}
                        name="hasExamId"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="hasExamId"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                        <FormLabel htmlFor="hasExamId">I was assigned an exam ID by my school</FormLabel>
                                    </div>
                                </FormControl>
                                <FormMessage>{form.formState.errors.hasExamId?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    {form.watch('hasExamId') && (
                        <FormField
                            control={form.control}
                            name="examId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Exam ID</FormLabel>
                                    <FormControl>
                                        <Input type="text" placeholder="Enter your exam ID" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-xs">This is only needed while registering for the first time!</FormDescription>
                                    <FormMessage>{form.formState.errors.examId?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                    )}
                    <Button type="submit" disabled={isSubmitted} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex justify-center items-center">
                        {isSubmitted ? <Spinner /> : 'Continue'}
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default EmailEntryForm;
