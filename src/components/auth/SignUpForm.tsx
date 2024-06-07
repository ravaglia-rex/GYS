import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { UserCredential, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { app } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createStudent } from "../../db/studentCollection";
import { fetchSchools } from "../../db/schoolCollection";

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
import AutocompleteInput from "../autocomplete/AutocompleteInput";

const signupSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    school: z.string().min(1, 'School is required'),
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Password must be at least 6 characters'),
    terms: z.boolean().refine((val) => val === true, { message: "You must agree to the terms and conditions" }),
}).refine(data => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"]
});

const SignUpPage: React.FC = () => {
    const [schools, setSchools] = useState<{ id: string, name: string }[]>([]);
    const auth = getAuth(app);
    const navigate = useNavigate();
    const {toast} = useToast();

    const form = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            school: '',
            email: '',
            password: '',
            confirm_password: '',
            terms: false,
        },
    });

    useEffect(() => {
        const fetchSchoolsData = async () => {
            const schoolsData = await fetchSchools();
            setSchools(schoolsData);
        };

        fetchSchoolsData();
    }, []);

    const onSubmit = async (data: z.infer<typeof signupSchema>) => {
        try {
            // Step 1: Create the user in Firebase Auth
            const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

            // Step 2: Send email verification
            await sendEmailVerification(userCredential.user);

            // Step 3: Create the student record in Firestore
            await createStudent({
                uid: userCredential.user.uid,
                first_name: data.first_name,
                last_name: data.last_name,
                school_id: data.school,
            });

            toast({
                variant: 'default',
                title: 'Account created successfully!',
                description: `Welcome to Argus, ${data.first_name}! A verification email has been sent to ${data.email}.`,
            });

            navigate('/account-creation-success');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error?.message || 'An error occurred while signing up. Please try again.',
            });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(/assets/sign-up-background.jpg)` }}
        >
            <div className="bg-white bg-opacity-75 backdrop-filter backdrop-blur-lg p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-semibold text-center mb-6">Join Argus 🚀</h2>
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
                        <FormField
                            control={form.control}
                            name="school"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>School</FormLabel>
                                    <FormControl>
                                        <AutocompleteInput 
                                            schools={schools} 
                                            onSelect={(selectedSchoolId) => field.onChange(selectedSchoolId)}
                                            className="bg-transparent rounded-lg w-full"
                                        />
                                    </FormControl>
                                    <FormDescription>Take me from darkness to light</FormDescription>
                                    <FormMessage>{form.formState.errors.school?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" placeholder="hello@argus.ai" />
                                    </FormControl>
                                    <FormDescription>We'll never share your email.</FormDescription>
                                    <FormMessage>{form.formState.errors.email?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="password" placeholder="Password" />
                                    </FormControl>
                                    <FormDescription>Set your password</FormDescription>
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
                                    <FormDescription>Confirm your password</FormDescription>
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
                        <Button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Sign Up</Button>
                    </form>
                </Form>
                <p className="text-sm text-center text-gray-600 mt-4">
                    Already have an account?{" "}
                    <NavLink to="/login" className="text-green-600 hover:underline">Sign in</NavLink>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;
