import React, { useState } from "react";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    // FormDescription,
} from '../ui/form';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { useStepper } from "../ui/stepper";
// import { Checkbox } from '../ui/checkbox';
import { checkExamIDExists } from '../../db/phase1UIDCollection';
import { getUserData } from '../../db/phase1ResponsesCollection';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import * as Sentry from '@sentry/react';

const personalInfoSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    hasExamId: z.boolean(),
    examId: z.string().optional(),
}).refine(data => !data.hasExamId || (data.hasExamId && data.examId), {
    message: 'Exam ID is required',
    path: ['examId'],
});

interface PersonalInformationProps {
    setFirstName: (firstName: string) => void;
    setLastName: (lastName: string) => void;
    setExamID: (examID: string) => void;
    setIsQualified: (qualified: boolean | null) => void;
    setEligibilityDateTime: (dateTime: string) => void;
}

const PersonalInformationForm: React.FC<PersonalInformationProps> = ({ setFirstName, setLastName, setExamID, setIsQualified, setEligibilityDateTime }) => {
    const { toast } = useToast();
    const { nextStep } = useStepper();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(personalInfoSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            hasExamId: false,
            examId: '',
        },
    });

    const onSubmit = async (data: z.infer<typeof personalInfoSchema>) => {
        setIsLoading(true);
        try {    
            setFirstName(data.first_name);
            setLastName(data.last_name);
            if (data.hasExamId && data.examId) {
                try {
                    const examIDExists = await checkExamIDExists(data.examId);
                    if (examIDExists) {
                        // This isn't an error but we want to log it
                        Sentry.withScope((scope) => {
                            scope.setTag('location', 'PersonalInformationForm.onSubmit');
                            scope.setExtra('first_name', data.first_name);
                            scope.setExtra('last_name', data.last_name);
                            scope.setExtra('examId', data.examId);
                            Sentry.captureMessage("Exam ID already used");
                        });

                        form.setError("examId", {
                            type: "manual",
                            message: "Exam ID already used! If you think this is a mistake, please contact us at talentsearch@argus.ai"
                        });
                        setIsLoading(false);
                        return;
                    }
                    const result = await getUserData(data.examId);
                    if ('message' in result) {
                        if (result.message === "User not created yet") {
                            // We are now transparent to this error. I will simply allow this user to continue as a phase 1 participant.
                            // This isn't an error but we want to log it
                            Sentry.withScope((scope) => {
                                scope.setTag('location', 'PersonalInformationForm.onSubmit');
                                scope.setExtra('first_name', data.first_name);
                                scope.setExtra('last_name', data.last_name);
                                scope.setExtra('examId', data.examId);
                                Sentry.captureMessage("User not created yet");
                            });
                            toast({
                                variant: 'destructive',
                                title: 'We haven\'t seen you before!',
                                description: 'If you aren\'t a phase 1 participant, you should probably think harder what was that exam ID you entered previously.',
                                duration: 9000,
                            });
                        } else if (result.message === "User has to be waitlisted") {
                            setExamID(data.examId);
                            setIsQualified(false);
                        }
                    } else if ('eligibleDateTime' in result) {
                        setExamID(data.examId);
                        setIsQualified(true);
                        setEligibilityDateTime(result.eligibleDateTime||"");
                    }
                } catch (error: any) {
                    Sentry.withScope((scope) => {
                        scope.setTag('location', 'PersonalInformationForm.onSubmit');
                        scope.setExtra('first_name', data.first_name);
                        scope.setExtra('last_name', data.last_name);
                        scope.setExtra('examId', data.examId);
                        Sentry.captureException(error);
                    });
                    toast({
                        variant: 'destructive',
                        title: 'Uh oh!',
                        description: error.message||'An unexpected error occurred',
                        duration: 2000,
                    });
                    setIsLoading(false);
                    return;
                }
            }
            nextStep();
        } catch (error: any) {
            Sentry.withScope((scope) => {
                scope.setTag('location', 'PersonalInformationForm.onSubmit');
                scope.setExtra('first_name', data.first_name);
                scope.setExtra('last_name', data.last_name);
                scope.setExtra('examId', data.examId);
                Sentry.captureException(error);
            });
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error?.message || 'An error occurred while capturing that information. Please try again.',
            });
        } finally {
            setIsLoading(false); // Set loading state to false once submission is complete
        }
    };

    return (
        <div>
            <br/>
            <h2 className="text-2xl font-semibold text-center mb-6">Who Am I? - The Eternal Question</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="First Name" />
                                </FormControl>
                                <FormMessage>{form.formState.errors.first_name?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Last Name" />
                                </FormControl>
                                <FormMessage>{form.formState.errors.last_name?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    {/* <FormField
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
                                    <FormDescription className="text-xs">Only for students who used an Exam ID previously and are now creating an account to check their results</FormDescription>
                                    <FormMessage>{form.formState.errors.examId?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                    )} */}
                    <Button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex justify-center items-center">
                        {isLoading ? <Spinner /> : 'Continue'}
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default PersonalInformationForm;
