import React from "react";
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

import { PhoneInput } from "../ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { useStepper } from "../ui/stepper";

const signupSchema = z.object({
    parent_name: z.string().min(2, 'Parent name is required'),
    parent_email: z.string().email(),
    parent_phone: z.string().refine(isValidPhoneNumber, { message: "Invalid phone number" }),
});

interface ParentInfoFormProps {
    setParentName: (parentName: string) => void;
    setParentEmail: (parentEmail: string) => void;
    setParentPhone: (parentPhone: string) => void;
}

const ParentInfoForm: React.FC<ParentInfoFormProps> = ({setParentName, setParentEmail, setParentPhone}) => {
    const { toast } = useToast();
    const { nextStep, prevStep } = useStepper();

    const form = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            parent_name: '',
            parent_email: '',
            parent_phone: '',
        },
    });

    const onSubmit = async (data: z.infer<typeof signupSchema>) => {
        try {
            setParentName(data.parent_name);
            setParentEmail(data.parent_email);
            setParentPhone(data.parent_phone);
            nextStep();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error?.message || 'An error occurred while signing up. Please try again.',
            });
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold text-center mb-6">Your First Teacher 👪</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="parent_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parent's Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormDescription className='text-xs'>The bow that bends for you to fly far</FormDescription>
                                <FormMessage>{form.formState.errors.parent_name?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="parent_email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parent's Email</FormLabel>
                                <FormControl>
                                    <Input {...field} type="email" placeholder="parent@argus.ai"/>
                                </FormControl>
                                <FormMessage>{form.formState.errors.parent_email?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="parent_phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parent's Phone</FormLabel>
                                <FormControl>
                                    <PhoneInput 
                                        {...field}
                                        placeholder="+911234567890"
                                    />
                                </FormControl>
                                <FormMessage>{form.formState.errors.parent_phone?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Next</Button>
                    <Button type="button" onClick={() => prevStep()} className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">Previous</Button>
                </form>
            </Form>
        </div>
    );
};

export default ParentInfoForm;