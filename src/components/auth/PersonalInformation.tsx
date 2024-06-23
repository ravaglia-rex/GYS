import React from "react";

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
} from '../ui/form';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { useStepper } from "../ui/stepper";

const personalInfoSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
})

interface PersonalInformationProps {
    setFirstName: (firstName: string) => void;
    setLastName: (lastName: string) => void;
}

const PersonalInformationForm: React.FC<PersonalInformationProps> = ({setFirstName, setLastName}) => {
    const { toast } = useToast();
    const { nextStep } = useStepper();

    const form = useForm({
        resolver: zodResolver(personalInfoSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
        },
    });

    const onSubmit = async (data: z.infer<typeof personalInfoSchema>) => {
        try {    
            setFirstName(data.first_name);
            setLastName(data.last_name);
            nextStep();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error?.message || 'An error occurred while capturing that information. Please try again.',
            });
        }
    };

    return (
        <div>
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
                    <Button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
                        Continue
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default PersonalInformationForm;