import React, {Dispatch, SetStateAction} from "react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getUserData } from "../../airtable/studentPhase";
import { useStepper } from "../ui/stepper";

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

const uidSchema = z.object({
    uid: z.string().optional(),
});

interface UIDValidationFormProps {
    setUserData: Dispatch<SetStateAction<string>>;
}

const UIDValidationForm: React.FC<UIDValidationFormProps> = ({setUserData}) => {
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const form = useForm({
        resolver: zodResolver(uidSchema),
        defaultValues: {
            uid: '',
        },
    });
    const {nextStep} = useStepper();

    const onSubmit = async (data: z.infer<typeof uidSchema>) => {
        setIsSubmitted(true);
        try {
            if(data.uid && data.uid!==''){
                
                const result = await getUserData(data.uid);
                if (result.success) {
                    setUserData(data.uid);
                    nextStep();
                }
                else {
                    setUserData("");
                    nextStep();
                }
            }
        } catch (error: any) {
            setUserData("");
            nextStep();
        }
        setIsSubmitted(false);
    };

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="uid"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Exam ID</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="eg. AB12345" />
                                </FormControl>
                                <FormDescription>Your exam id from GYS Talent Search</FormDescription>
                                <FormMessage>{form.formState.errors.uid?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button disabled={isSubmitted} type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Look me up!</Button>
                </form>
            </Form>
            <p className="text-sm text-center text-gray-600 mt-4">
                Already have an account?{" "}
                <NavLink to="/login" className="text-green-600 hover:underline">Sign in</NavLink>
            </p>
        </div>
    );
};

export default UIDValidationForm;