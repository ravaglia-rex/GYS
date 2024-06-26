import React, { useState } from "react";
import { UserCredential, createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { runSignUpTransaction } from "../../db/signupTransaction";

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
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import TnCDialog from "./TnCDialog";
import { useStepper } from "../ui/stepper";
import { LoadingSpinner as Spinner } from "../ui/spinner";
import { useNavigate } from "react-router-dom";

const signupSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Password must be at least 6 characters'),
    terms: z.boolean().refine((val) => val === true, { message: "You must agree to the terms and conditions" }),
}).refine(data => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"]
});

interface TnCPassProps {
    first_name: string;
    last_name: string;
    school: string;
    grade: number;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    email: string;
    examID: string;
    isQualified: boolean | null;
    eligibleDateTime: string;
    setEmailExists: (emailExists: boolean|null) => void;
}

const TnCPassForm: React.FC<TnCPassProps> = ({ first_name, last_name, school, grade, parent_name, parent_email, parent_phone, email, examID, isQualified, eligibleDateTime, setEmailExists }) => {
    const { toast } = useToast();
    const { prevStep } = useStepper();
    const [isSubmitted, setSubmitted] = useState<boolean>(false);
    const navigate = useNavigate();

    const form = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            password: '',
            confirm_password: '',
            terms: false,
        },
    });

    const onSubmit = async (data: z.infer<typeof signupSchema>) => {
        try {
            setSubmitted(true);
            // Step 1: Create the user in Firebase Auth
            const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, data.password);

            // Step 2: Send email verification
            await sendEmailVerification(userCredential.user);

            const new_student = {
                uid: userCredential.user.uid,
                first_name: first_name,
                last_name: last_name,
                school_id: school,
                grade: grade,
                parent_name: parent_name,
                parent_email: parent_email,
                parent_phone: parent_phone,
            };

            // Step 3: Run the sign up transaction
            await runSignUpTransaction(new_student, email, examID, isQualified, eligibleDateTime);

            // Sign out and redirect to home page
            await signOut(auth);
            setEmailExists(null);
            navigate("/");

            toast({
                variant: 'default',
                title: 'Account created successfully!',
                description: `Welcome to Argus, ${first_name}! A verification email has been sent to ${email}.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error?.message || 'An error occurred while signing up. Please try again.',
            });
        } finally {
            setSubmitted(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold text-center mb-6">And One Last Thing ....</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input {...field} type="password" placeholder="Password" />
                                </FormControl>
                                <FormDescription className='text-xs'>Set your password</FormDescription>
                                <FormMessage>{form.formState.errors.password?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirm_password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                    <Input {...field} type="password" placeholder="Confirm Password" />
                                </FormControl>
                                <FormDescription className='text-xs'>Confirm your password</FormDescription>
                                <FormMessage>{form.formState.errors.confirm_password?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="terms"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                        <TnCDialog />
                                    </div>
                                </FormControl>
                                <FormMessage>{form.formState.errors.terms?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSubmitted} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
                        {isSubmitted ? <Spinner /> : 'Sign Up!'}
                    </Button>
                    <Button type="button" onClick={() => prevStep()} className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">Previous</Button>
                </form>
            </Form>
        </div>
    );
};

export default TnCPassForm;