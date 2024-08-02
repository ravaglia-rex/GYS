import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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
    CardFooter,
} from '../ui/card';
import { Input } from '../ui/input';

const SchoolInfoSchema = z.object({
    grade: z.number().int().min(6, 'Grade is required').max(12, 'Grade is required'),
    school_name: z.string().min(1, 'School name is required'),
});

interface SchoolInfoFormProps {
    grade: number;
    school_name: string;
}

const SchoolInfoForm: React.FC<SchoolInfoFormProps> = ({ grade, school_name }) => {
    const form = useForm<SchoolInfoFormProps>({
        resolver: zodResolver(SchoolInfoSchema),
        defaultValues: {
            grade: grade,
            school_name: school_name,
        },
    });

    return (
        <div className='profile-school'>
            <Card x-chunk="dashboard-04-chunk-1" className="bg-gray-800 text-white">
                <CardHeader>
                    <CardTitle>School Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(() => {})}>
                            <FormField
                                name="school_name"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>School Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={school_name}
                                                disabled
                                                className="bg-gray-700 text-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="grade"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Grade</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={grade.toString()}
                                                disabled
                                                className="bg-gray-700 text-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </CardContent>
                <CardFooter>
                    <p>We currently don't allow editing these fields. If you believe there's a mistake please email <a href="mailto:talentsearch@argus.ai">talentsearch@argus.ai</a>.</p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default SchoolInfoForm;
