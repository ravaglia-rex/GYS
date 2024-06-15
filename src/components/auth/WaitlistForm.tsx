import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { createExpeditedSchool } from "../../db/schoolCollection";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createWaitlistedStudent } from "../../db/waitlistStudentCollection";
// import { fetchSchools } from "../../db/schoolCollection";
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
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import AutocompleteInput from "../autocomplete/AutocompleteInput";
import { useStepper } from "../ui/stepper";

const waitlistSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    school: z.string().min(1, 'School is required'),
    grade: z.number().int().min(1, 'Grade is required'),
    email: z.string().email(),
});

const WaitlistPage: React.FC = () => {
    const [schools, setSchools] = useState<{ id: string, name: string }[]>([]);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { nextStep } = useStepper();

    const form = useForm({
        resolver: zodResolver(waitlistSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            school: '',
            grade: 0,
            email: ''
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

    const onSubmit = async (data: z.infer<typeof waitlistSchema>) => {
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
            
            // Step 4: Create the student record
            createWaitlistedStudent({
                first_name: data.first_name,
                last_name: data.last_name,
                school_id: schoolId,
                grade: data.grade,
            });
    
            toast({
                variant: 'default',
                title: 'We\'ve added you to the waitlist! 🎉',
                description: `We'll send you an email when you can create your account.`,
            });
            nextStep();
            navigate('/waitlist-success');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error?.message || 'An error occurred while adding you to the waitlist. Please try again later.',
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
                    <Button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Add me to Waitlist ⏱️</Button>
                </form>
            </Form>
            <p className="text-sm text-center text-gray-600 mt-4">
                Already have an account?{" "}
                <NavLink to="/login" className="text-green-600 hover:underline">Sign in</NavLink>
            </p>
        </div>
    );
};

export default WaitlistPage;