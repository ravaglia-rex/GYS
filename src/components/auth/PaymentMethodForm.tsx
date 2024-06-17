import React from 'react';
import { useForm } from 'react-hook-form';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { createPaymentRecord } from '../../db/paymentMethodCollection';
import { useToast } from '../ui/use-toast';

interface UserObj {
    uid: string;
    parentEmail: string;
}

const paymentSchema = z.object({
    payment_method: z.string().min(1, 'Payment method is required'),
});

const PaymentForm: React.FC<UserObj> = ({ uid, parentEmail }) => {
    const form = useForm({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            payment_method: '',
        },
    });
    const paymentMethod = form.watch('payment_method');
    const {toast} = useToast();
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        try{
            await createPaymentRecord({
                student_uid: uid,
                payment_method: data.payment_method,
            });
            navigate('/account-creation-success');
        } catch(e: any){
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Error recording payment method`
            });
        }

    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <FormControl>
                                <Select 
                                    {...field}
                                    onValueChange={value => form.setValue('payment_method', value)}
                                    defaultValue={field.value.toString()}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="credit_card">Credit Card</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="wise">Wise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage>{form.formState.errors.payment_method?.message}</FormMessage>
                        </FormItem>
                    )}
                />
                {paymentMethod === 'credit_card' && (
                    <div className="flex items-center space-x-2">
                        <Input readOnly value="https://buy.stripe.com/5kA8xG7NtfkL3SwcMO" className="flex-1 bg-gray-100 cursor-pointer" />
                        <span className="material-icons cursor-pointer text-gray-600" onClick={() => window.open('https://buy.stripe.com/5kA8xG7NtfkL3SwcMO', '_blank')}>
                            launch
                        </span>
                    </div>
                )}
                {paymentMethod && paymentMethod !== 'credit_card' && (
                    <FormDescription>
                        We'll email you with payment instructions for your selected payment method.
                    </FormDescription>)}
                <FormDescription>
                    Please note: once you submit, you will not be able to change your payment option later.
                </FormDescription>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Confirm Payment Method
                </Button>
            </form>
        </Form>
    );
};

export default PaymentForm;
