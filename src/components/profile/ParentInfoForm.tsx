import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { updateStudent } from '../../db/studentCollection';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, EditIcon } from 'lucide-react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { Button } from '../ui/button';
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
import { PhoneInput } from '../ui/phone-input';
import * as Sentry from '@sentry/react';

const ParentInfoSchema = z.object({
    parent_name: z.string(),
    parent_phone: z.string().optional().refine(
        (data) => data === "" || isValidPhoneNumber(data||''),
        { message: "Invalid phone number" }
    ),
    parent_email: z.string().optional().refine(
        (data) => data === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data||''),
        { message: "Invalid email address" }
    ),
});

interface ParentInfoFormProps {
    user_id: string;
    parent_name: string;
    parent_phone: string;
    parent_email: string;
    setParentName: (name: string) => void;
    setParentPhone: (phone: string) => void;
    setParentEmail: (email: string) => void;
}

const ParentInfoForm: React.FC<ParentInfoFormProps> = ({ user_id, parent_name, parent_email, parent_phone, setParentName, setParentEmail, setParentPhone }) => {
    const [isEditingField, setIsEditingField] = useState<string | null>(null);
    
    const form = useForm<ParentInfoFormProps>({
        resolver: zodResolver(ParentInfoSchema),
        defaultValues: {
            parent_name: parent_name,
            parent_phone: parent_phone,
            parent_email: parent_email,
        },
    });

    // To enable the save button only if there are changes
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            if (JSON.stringify(value) !== JSON.stringify({parent_name, parent_phone, parent_email})) {
                setIsDirty(true);
            } else {
                setIsDirty(false);
            }
        });
        return () => subscription.unsubscribe();
    }, [form, parent_name, parent_phone, parent_email]);

    const toggleEdit = (field: string) => {
        setIsEditingField(isEditingField === field ? null : field);
    };

    const onSubmit: SubmitHandler<ParentInfoFormProps> = async data => {
        try {
            await updateStudent(user_id, data);
            setIsEditingField(null);
            setParentName(data.parent_name);
            setParentEmail(data.parent_email);
            setParentPhone(data.parent_phone);
            setIsDirty(false);
        } catch (error) {
            Sentry.withScope((scope) => {
                scope.setTag("location", "ParentInfoForm.onSubmit");
                scope.setLevel("error");
                scope.setExtra("user_id", user_id);
                scope.setExtra("data", data);
                Sentry.captureException(error);
            });
        } finally {
            setIsSubmitted(false);
        }
    };

    return (
        <div>
            <Card x-chunk="dashboard-04-chunk-1" className="bg-gray-800 text-white">
                <CardHeader>
                    <CardTitle>Parent Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField
                                name="parent_name"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parent's Name</FormLabel>
                                        <FormControl>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Input
                                                    {...field}
                                                    disabled={!isEditingField || isEditingField !== 'parent_name'}
                                                    className="bg-gray-700 text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEdit('parent_name')}
                                                    className="ml-2 text-white"
                                                >
                                                    {isEditingField==='parent_name' ? <Check /> : <EditIcon />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="parent_phone"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parent's Phone</FormLabel>
                                        <FormControl>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <PhoneInput
                                                    {...field}
                                                    disabled={!isEditingField || isEditingField !== 'parent_phone'}
                                                    className="bg-gray-700 text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEdit('parent_phone')}
                                                    className="ml-2 text-white"
                                                >
                                                    {isEditingField==='parent_phone' ? <Check /> : <EditIcon />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="parent_email"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parent's Email</FormLabel>
                                        <FormControl>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Input
                                                    {...field}
                                                    disabled={!isEditingField || isEditingField !== 'parent_email'}
                                                    className="bg-gray-700 text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEdit('parent_email')}
                                                    className="ml-2 text-white"
                                                >
                                                    {isEditingField==='parent_email' ? <Check /> : <EditIcon />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="mt-4 flex justify-end">
                                <Button 
                                    type="submit" 
                                    disabled={!isDirty||isSubmitted} 
                                    className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md">
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

export default ParentInfoForm;
