import React, { useEffect, useRef } from 'react';
import { useToast } from '../ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { markPaymentPending } from '../../functions/payment_handling/razorpay_functions';

import * as Sentry from '@sentry/react';

const loadScript = (src: string): Promise<boolean> =>
  new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });

interface RenderRazorpayProps {
  id: string;
  keyID: string;
  order_id: string;
  currency: string;
  amount: number;
  checkout_config_id?: string;
  membership_level?: number;
  payee_name: string;
  payee_email: string;
  payee_contact: string;
  uid: string;
  email: string;
  address_line_1: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

const RenderRazorpay: React.FC<RenderRazorpayProps> = ({
  id,
  keyID,
  order_id,
  currency,
  amount,
  checkout_config_id,
  membership_level = 1,
  payee_name,
  payee_email,
  payee_contact,
  uid,
  email,
  address_line_1,
  city,
  state,
  zipcode,
  country,
}) => {
  const paymentId = useRef<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const displayRazorpay = async (options: any) => {
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

    if (!res) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'RenderRazorpay.displayRazorpay');
        Sentry.captureException(new Error('Razorpay SDK failed to load'));
      });
      return;
    }

    const rzp1 = new (window as any).Razorpay(options);

    rzp1.on('payment.failed', (response: any) => {
      const pid = response?.error?.metadata?.payment_id;
      paymentId.current = typeof pid === 'string' ? pid : null;

      Sentry.withScope((scope) => {
        scope.setTag('location', 'RenderRazorpay.payment.failed');
        scope.setContext('razorpay', { error: response?.error });
        Sentry.captureMessage(
          typeof response?.error?.description === 'string'
            ? `Payment failed: ${response.error.description}`
            : 'Payment failed'
        );
      });
    });

    rzp1.open();
  };

  const handlePayment = async (status: string, orderDetails: any) => {
    if (status === 'success') {
      try {
        // Record the payment in the backend
        await markPaymentPending(
          uid,
          address_line_1,
          amount / 100, // Convert from paise to rupees
          city,
          currency,
          email,
          membership_level,
          payee_email,
          payee_name,
          state,
          payee_name, // student_name
          order_id,   // transaction_id
          zipcode
        );

        toast({
          variant: 'default',
          title: 'Payment Successful',
          description: 'Your payment was successful',
          duration: 9000,
        });
      } catch (error) {
        console.error('Error recording payment:', error);
        toast({
          variant: 'destructive',
          title: 'Payment Recorded',
          description: 'Payment successful but there was an issue recording it. Please contact support.',
          duration: 9000,
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Oops! Payment Failed',
        description: 'We couldn\'t process that payment. If the amount has been deducted, it will be refunded within 7 working days.',
        duration: 9000,
      });
    }

    // Close the Razorpay script and redirect to the payments page
    setTimeout(() => {
      navigate('/payments');
      // Reload the page to refresh payment data
      window.location.reload();
    }, 1000);
  };

  const options = {
    key: keyID,
    currency: currency,
    amount: String(Math.round(Number(amount))),
    order_id: order_id,
    ...(checkout_config_id ? {checkout_config_id} : {}),
    customer_id: id,
    name: 'Argus',
    description: `Argus Membership`,
    image: 'https://argus-s3-bucket.s3.us-east-1.amazonaws.com/logos/argus.png',
    handler: async (response: any) => {
      if (response.razorpay_payment_id) {
        await handlePayment('success', response);
      } else {
        await handlePayment('failed', response);
      }
    },
    prefill: {
      name: payee_name,
      email: payee_email,
      contact: payee_contact,
    },
    notes: {
      invoice_number: order_id.replace('order_', 'argus'),
      email: email,
      user_id: uid,
      address_line_1: address_line_1,
      city: city,
      state: state,
      country: country,
      zipcode: zipcode,
      membership_level: membership_level,
      payee_name: payee_name,
      payee_email: payee_email,
    },
    modal: {
      ondismiss: () => {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'RenderRazorpay.modal.ondismiss');
          Sentry.captureMessage('Razorpay checkout dismissed');
        });
      },
    },
    theme: {
      color: '#000000',
    },
  };

  useEffect(() => {
    displayRazorpay(options);
    // eslint-disable-next-line
  }, []);

  return null;
};

export default RenderRazorpay;
