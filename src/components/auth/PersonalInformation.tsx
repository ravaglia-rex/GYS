import React, { useState } from "react";
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
import { useStepper } from "../ui/stepper";
import { LoadingSpinner as Spinner } from '../ui/spinner';
import * as Sentry from '@sentry/react';

const personalInfoSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
});

interface PersonalInformationProps {
    setFirstName: (firstName: string) => void;
    setLastName: (lastName: string) => void;
}

const PersonalInformationForm: React.FC<PersonalInformationProps> = ({ setFirstName, setLastName }) => {
    const { toast } = useToast();
    const { nextStep } = useStepper();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(personalInfoSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
        },
    });

    const onSubmit = async (data: z.infer<typeof personalInfoSchema>) => {
        setIsLoading(true);
        try {    
            setFirstName(data.first_name);
            setLastName(data.last_name);
            nextStep();
        } catch (error: any) {
            Sentry.withScope((scope) => {
                scope.setTag('location', 'PersonalInformationForm.onSubmit');
                scope.setExtra('first_name', data.first_name);
                scope.setExtra('last_name', data.last_name);
                Sentry.captureException(error);
            });
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error?.message || 'An error occurred while capturing that information. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold text-center mb-6 text-white mt-8">Let's Get To Know You!</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm text-gray-300">First Name</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="First Name" 
                                        className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white"
                                    />
                                </FormControl>
                                <FormMessage className="text-red-400">{form.formState.errors.first_name?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm text-gray-300">Last Name</FormLabel>
                                <FormControl>
                                    <Input 
                                        {...field} 
                                        placeholder="Last Name" 
                                        className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white"
                                    />
                                </FormControl>
                                <FormMessage className="text-red-400">{form.formState.errors.last_name?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button 
                        type="submit" 
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex justify-center items-center"
                    >
                        {isLoading ? <Spinner /> : 'Continue'}
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default PersonalInformationForm;
