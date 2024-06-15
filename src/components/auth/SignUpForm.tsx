import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { UserCredential, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { createExpeditedSchool } from "../../db/schoolCollection";
import { auth } from "../../firebase/firebase";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createStudent } from "../../db/studentCollection";
import { fetchSchools } from "../../airtable/schoolData";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form';

import {
    Select,
    SelectItem,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import TnCDialog from "./TnCDialog";
import AutocompleteInput from "../autocomplete/AutocompleteInput";
import { useStepper } from "../ui/stepper";

const signupSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    school: z.string().min(1, 'School is required'),
    grade: z.number().int().min(1, 'Grade is required'),
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Password must be at least 6 characters'),
    parent_name: z.string().min(2, 'Parent name is required'),
    parent_email: z.string().email(),
    parent_phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    terms: z.boolean().refine((val) => val === true, { message: "You must agree to the terms and conditions" }), 
}).refine(data => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"]
});

interface UserObj {
    uid: string;
    parentEmail: string;
}

interface SignUpFormProps {
    userData: string;
    setUserObj: (userObj: UserObj) => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({userData, setUserObj}) => {
    const [schools, setSchools] = useState<{ id: string, name: string }[]>([]);
    const { toast } = useToast();
    const { nextStep } = useStepper();

    const form = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            school: '',
            grade: 0,
            email: '',
            password: '',
            confirm_password: '',
            parent_name: '',
            parent_email: '',
            parent_phone: '',
            terms: false,
        },
    });

    useEffect(() => {
        const fetchSchoolsData = async () => {
            try {
                const schoolsData = await fetchSchools();
                if(schoolsData.data){
                    setSchools(schoolsData.data);
                }
            } catch (error: any) {
                return null;
            }
        };

        fetchSchoolsData();
    }, []);

    const onSubmit = async (data: z.infer<typeof signupSchema>) => {
        try {    
            // Step 1: Find the school record
            let schoolId = data.school;
    
            const matchedSchool = schools.find(school => school.name === data.school);
            if (matchedSchool) {
                schoolId = matchedSchool.id;
            } else {
                // Create a new school and assign the returned ID
                schoolId = await createExpeditedSchool({ school_name: data.school });
            }

            // Step 2: Create the user in Firebase Auth
            const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

            // Step 3: Send email verification
            await sendEmailVerification(userCredential.user);
            
            // Step 4: Create the student record
            createStudent({
                uid: userCredential.user.uid,
                first_name: data.first_name,
                last_name: data.last_name,
                school_id: schoolId,
                grade: data.grade,
                parent_name: data.parent_name,
                parent_email: data.parent_email,
                parent_phone: data.parent_phone,
            });
            
            setUserObj({
                uid: userCredential.user.uid,
                parentEmail: data.parent_email,
            });

            toast({
                variant: 'default',
                title: 'Account created successfully!',
                description: `Welcome to Argus, ${data.first_name}! A verification email has been sent to ${data.email}.`,
            });
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
                                <FormDescription className='text-xs'>Take me from darkness to light</FormDescription>
                                <FormMessage>{form.formState.errors.school?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="grade"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Grade</FormLabel>
                                <FormControl>
                                    <Select 
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        defaultValue={field.value.toString()}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="6">6th Grade</SelectItem>
                                            <SelectItem value="7">7th Grade</SelectItem>
                                            <SelectItem value="8">8th Grade</SelectItem>
                                            <SelectItem value="9">9th Grade</SelectItem>
                                            <SelectItem value="10">10th Grade</SelectItem>
                                            <SelectItem value="11">11th Grade</SelectItem>
                                            <SelectItem value="12">12th Grade</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage>{form.formState.errors.grade?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
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
                                    <Input {...field} type="tel" placeholder="123-456-7890"/>
                                </FormControl>
                                <FormMessage>{form.formState.errors.parent_phone?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Email Address</FormLabel>
                                <FormControl>
                                    <Input {...field} type="email" placeholder="hello@argus.ai" />
                                </FormControl>
                                <FormDescription className='text-xs'>We'll never share your email.</FormDescription>
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
                    <Button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Sign Up</Button>
                </form>
            </Form>
            <p className="text-sm text-center text-gray-600 mt-4">
                Already have an account?{" "}
                <NavLink to="/login" className="text-green-600 hover:underline">Sign in</NavLink>
            </p>
        </div>
    );
};

export default SignUpForm;