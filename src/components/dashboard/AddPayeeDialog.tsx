import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import { Input } from "../ui/input";
import { PhoneInput } from "../ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";

import { auth } from "../../firebase/firebase";
import { handleCreateCustomer } from "../../functions/payment_handling/razorpay_functions";

import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import CountriesInput from "../autocomplete/CountriesInput";

import { LoadingSpinner as Spinner } from "../ui/spinner";

import * as Sentry from "@sentry/react";

interface Payee {
    id: string;
    name: string;
    email: string;
    contact: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
}

interface AddPayeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPayee: (newPayee: Payee) => void;
}

const payeeSchema = z.object({
  payee_name: z.string().min(2, "Payee name is required"),
  payee_email: z.string().email(),
  payee_contact: z.string().refine(isValidPhoneNumber, { message: "Invalid phone number" }),
  payee_address_line1: z.string().min(2, "Address is required"),
  payee_address_line2: z.string().min(2, "Address is required"),
  payee_city: z.string().min(2, "City is required"),
  payee_state: z.string().min(2, "State is required"),
  payee_country: z.string().length(3, "Country code must be 3 characters long"),
  payee_zipcode: z.string().min(6, "Zipcode is required"),
});

const AddPayeeDialog: React.FC<AddPayeeDialogProps> = ({ isOpen, onClose, onAddPayee }) => {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(payeeSchema),
    defaultValues: {
      payee_name: "",
      payee_email: "",
      payee_contact: "",
      payee_address_line1: "",
      payee_address_line2: "",
      payee_city: "",
      payee_state: "",
      payee_country: "",
      payee_zipcode: "",
    },
  });
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (data: z.infer<typeof payeeSchema>) => {
    setSubmitted(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const newPayee = await handleCreateCustomer(
        user.uid,
        data.payee_name,
        data.payee_email,
        data.payee_contact,
        data.payee_address_line1,
        data.payee_address_line2,
        data.payee_city,
        data.payee_state,
        data.payee_country,
        data.payee_zipcode
      );
      
      toast({
        variant: "default",
        title: "Payee added",
        description: "Payee has been added successfully",
      });
      onAddPayee(newPayee);
      onClose(); // Close the dialog on success
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag("location", "AddPayeeDialog");
        Sentry.captureException(error);
      });

      toast({
        variant: "destructive",
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setSubmitted(false); // Re-enable the button
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-6"
        style={{
            boxSizing: "border-box",
        }}
        >
        <DialogHeader>
          <DialogTitle>Payee Details</DialogTitle>
          <DialogDescription>Please enter the payee details.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
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

                    <Button 
                        type="button"
                        onClick={async () => {
                            const isValid = await form.trigger();
                            if(isValid) {
                                form.handleSubmit(onSubmit)();
                            }
                        }}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                        disabled={submitted}
                    >
                        {submitted? <Spinner /> : <p>Add Payee</p>}
                    </Button>
                </form>
            </Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPayeeDialog;
