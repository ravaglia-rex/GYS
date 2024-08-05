import React, {useState} from "react";
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

import { Input } from '../ui/input';
import { PhoneInput } from "../ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";

import { auth } from "../../firebase/firebase";
import { handleCreateCustomer, handleOrderExam } from "../../functions/payment_handling/razorpay_functions";

import { Button } from "../ui/button";
import { Checkbox } from '../ui/checkbox';
import { useToast } from "../ui/use-toast";
import CountriesInput from "../autocomplete/CountriesInput";
import RenderRazorpay from "./RenderRazorpay";
import { LoadingSpinner as Spinner } from "../ui/spinner";

import * as Sentry from '@sentry/react';

const payeeSchema = z.object({
    payee_name: z.string().min(2, 'Payee name is required'),
    payee_email: z.string().email(),
    payee_contact: z.string().refine(isValidPhoneNumber, { message: "Invalid phone number" }),
    payee_address_line1: z.string().min(2, 'Address is required'),
    payee_address_line2: z.string().min(2, 'Address is required'),
    payee_city: z.string().min(2, 'City is required'),
    payee_state: z.string().min(2, 'State is required'),
    payee_country: z.string().length(3, 'Country code must be 3 characters long'),
    payee_zipcode: z.string().min(6, 'Zipcode is required'),
    payee_has_gstin: z.boolean(),
    payee_gstin: z.string().length(15, 'GSTIN must be 15 characters long').optional().or(z.literal('')),
});

interface PayeeDetailsFormProps {
    formId: string;
    currency: string;
    cost: number;
    title: string;
}

const PayeeDetailsForm: React.FC<PayeeDetailsFormProps> = ({formId, currency, cost, title}) => {
    const { toast } = useToast();
    const [displayRazorpay, setDisplayRazorpay] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
    const [orderDetails, setOrderDetails] = useState({
        amount: -1,
        form_id: "",
        title: "",
        id: "",
        currency: "",
        uid: auth.currentUser?.uid || "",
    });

    const form = useForm({
        resolver: zodResolver(payeeSchema),
        defaultValues: {
            payee_name: '',
            payee_email: '',
            payee_contact: '',
            payee_address_line1: '',
            payee_address_line2: '',
            payee_city: '',
            payee_state: '',
            payee_country: '',
            payee_zipcode: '',
            payee_has_gstin: false,
            payee_gstin: '',
        },
    });

    const handlePayNow = async (
        payee_name: string, 
        payee_email: string, 
        payee_contact: string, 
        payee_gstin: string,
        payee_address_line1: string,
        payee_address_line2: string,
        payee_city: string,
        payee_state: string,
        payee_zipcode: string,
        payee_country: string
      ) => {
        setSubmitted(true);
        try {
          await handleCreateCustomer(
            payee_name,
            payee_email,
            payee_contact,
            payee_gstin
          );
          
          const data = await handleOrderExam(
            cost,
            currency,
            payee_name,
            payee_contact,
            payee_email,
            payee_address_line1,
            payee_address_line2,
            payee_city,
            payee_state,
            payee_zipcode,
            payee_country,
            formId,
            title,
            auth.currentUser?.uid || ""
          )
    
          if (data && data.id) {
            setOrderDetails({
              amount: data.amount,
              form_id: formId,
              title: title,
              id: data.id,
              currency: data.currency,
              uid: auth.currentUser?.uid || "",
            });
            setDisplayRazorpay(true);
          }
        } catch (error) {
          Sentry.withScope((scope) => {
            scope.setTag('location', 'PendingPaymentsTable.handlePayNow');
            Sentry.captureException(error);
          });
          console.error("Error creating order:", error);
        } finally {
          setSubmitted(false);
        }
      };

    const onSubmit = async (data: z.infer<typeof payeeSchema>) => {
        try {
            await handlePayNow(
                data.payee_name,
                data.payee_email,
                data.payee_contact,
                data.payee_gstin||'',
                data.payee_address_line1,
                data.payee_address_line2,
                data.payee_city,
                data.payee_state,
                data.payee_zipcode,
                data.payee_country
            )
        } catch (error: any) {
            Sentry.withScope((scope) => {
                scope.setTag('location', 'PayeeDetailsForm.onSubmit');
                Sentry.captureException(error);
            });
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error?.message || 'An error occurred while processing your details. Please try again.',
            });
        }
    };

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="payee_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payee's Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage>{form.formState.errors.payee_name?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payee_email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payee's Email</FormLabel>
                                <FormControl>
                                    <Input {...field} type="email" />
                                </FormControl>
                                <FormMessage>{form.formState.errors.payee_email?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payee_contact"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payee's Phone</FormLabel>
                                <FormControl>
                                    <PhoneInput 
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage>{form.formState.errors.payee_contact?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payee_address_line1"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address Line 1</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage>{form.formState.errors.payee_address_line1?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payee_address_line2"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address Line 2</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage>{form.formState.errors.payee_address_line2?.message}</FormMessage>
                            </FormItem>
                        )}
                    />
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <FormField
                            control={form.control}
                            name="payee_city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage>{form.formState.errors.payee_city?.message}</FormMessage>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="payee_state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage>{form.formState.errors.payee_state?.message}</FormMessage>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="payee_country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel style={{display: 'block'}}>Payee's Country</FormLabel>
                                    <FormControl style={{display: 'block'}}>
                                        <CountriesInput onSelect={(country) => field.onChange(country)}/>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="payee_zipcode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zipcode</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage>{form.formState.errors.payee_zipcode?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="payee_has_gstin"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                        <FormLabel>Have a GSTIN?</FormLabel>
                                    </div>
                                </FormControl>
                                <FormMessage>{form.formState.errors.payee_has_gstin?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    {form.watch('payee_has_gstin') && (
                        <FormField
                            control={form.control}
                            name="payee_gstin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payee's GSTIN</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormDescription className='text-xs'>GSTIN must be 15 characters long</FormDescription>
                                    <FormMessage>{form.formState.errors.payee_gstin?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                    )}

                    <Button 
                        type="submit" 
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                        disabled={submitted}
                    >
                        {submitted? <Spinner /> : <p>Pay Now</p>}
                    </Button>
                </form>
            </Form>
            {displayRazorpay && (
                <RenderRazorpay
                amount={orderDetails.amount}
                currency={orderDetails.currency}
                form_id={orderDetails.form_id}
                title={orderDetails.title}
                id={orderDetails.id}
                uid={orderDetails.uid}
                keyID={process.env.REACT_APP_RAZORPAY_KEY_ID || ""}
                />
            )}
        </div>
    );
};

export default PayeeDetailsForm;
