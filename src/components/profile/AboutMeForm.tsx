import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { updateStudent } from '../../db/studentCollection';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, EditIcon } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form';
import {
    Card,
    CardTitle,
    CardHeader,
    CardContent,
} from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import * as Sentry from '@sentry/react';
import { Button } from '../ui/button';

const AboutMeSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    about_me: z.string().optional(),
});

interface AboutMeFormProps {
    user_id: string;
    first_name: string;
    last_name: string;
    setFirstName: (name: string) => void;
    setLastName: (name: string) => void;
}

const AboutMeForm: React.FC<AboutMeFormProps> = ({ user_id, first_name, last_name, setFirstName, setLastName }) => {
    const [isEditingFirstName, setIsEditingFirstName] = useState(false);
    const [isEditingLastName, setIsEditingLastName] = useState(false);

    const form = useForm<AboutMeFormProps>({
        resolver: zodResolver(AboutMeSchema),
        defaultValues: {
            first_name: first_name,
            last_name: last_name,
        },
    });
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            if (JSON.stringify(value) !== JSON.stringify({first_name, last_name})) {
                setIsDirty(true);
            } else {
                setIsDirty(false);
            }
        });
        return () => subscription.unsubscribe();
    }, [form, first_name, last_name]);


    const toggleEdit = async (field: 'first_name' | 'last_name') => {
        if (field === 'first_name') {
            setIsEditingFirstName(!isEditingFirstName);
        } else if (field === 'last_name') {
            setIsEditingLastName(!isEditingLastName);
        }
    };

    const onSubmit: SubmitHandler<AboutMeFormProps> = async data => {
        try {
            await updateStudent(user_id, data);
            setIsEditingFirstName(false);
            setIsEditingLastName(false);
            setFirstName(data.first_name);
            setLastName(data.last_name);
            setIsDirty(false);
        } catch (error) {
            Sentry.withScope((scope) => {
                scope.setTag("location", "AboutMeForm.onSubmit");
                scope.setLevel("error");
                scope.setExtra("user_id", user_id);
                scope.setExtra("data", data);
                Sentry.captureException(error);
            });
        } finally {
            setIsSubmitted(false);
        }
    };

    const handleCancel = () => {
        form.reset({ first_name, last_name });
        setIsEditingFirstName(false);
        setIsEditingLastName(false);
        setIsDirty(false);
    };

    return (
        <div className='profile-about'>
            <Card x-chunk="dashboard-04-chunk-1" className="bg-gray-800 text-white">
                <CardHeader>
                    <CardTitle>About Me</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField
                                name="first_name"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Input
                                                    {...field}
                                                    disabled={!isEditingFirstName}
                                                    className="bg-gray-700 text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEdit('first_name')}
                                                    className="ml-2 text-white"
                                                >
                                                    {isEditingFirstName ? <Check /> : <EditIcon />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="last_name"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Input
                                                    {...field}
                                                    disabled={!isEditingLastName}
                                                    className="bg-gray-700 text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEdit('last_name')}
                                                    className="ml-2 text-white"
                                                >
                                                    {isEditingLastName ? <Check /> : <EditIcon />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className='mt-4 flex justify-end'>
                                <Button 
                                    type="button" 
                                    onClick={handleCancel}
                                    disabled={!isDirty||isSubmitted}
                                    className="mr-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md">
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={!isDirty||isSubmitted} 
                                    className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md save-button">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AboutMeForm;
