import React, { useEffect, useRef } from 'react';
import { useToast } from '../ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { resetPayments } from '../../state_data/studentPaymentsSlice';
import { useDispatch } from 'react-redux';
import * as Sentry from '@sentry/react';

const loadScript = (src: string): Promise<boolean> =>
  new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      console.log('razorpay loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      console.log('error in loading razorpay');
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
  form_id: string;
  title: string;
  payee_name: string;
  payee_email: string;
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
  form_id,
  title,
  payee_name,
  payee_email,
  uid,
  email,
  address_line_1,
  city,
  state,
  zipcode,
  country,
}) => {
  const paymentId = useRef<string | null>(null);
  const paymentMethod = useRef<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const displayRazorpay = async (options: any) => {
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

    if (!res) {
      console.log('Razorpay SDK failed to load. Are you online?');
      Sentry.withScope((scope) => {
        scope.setTag('location', 'RenderRazorpay.displayRazorpay');
        Sentry.captureException(new Error('Razorpay SDK failed to load'));
      });
      return;
    }

    const rzp1 = new (window as any).Razorpay(options);

    rzp1.on('payment.submit', (response: any) => {
      paymentMethod.current = response.method;
    });

    rzp1.on('payment.failed', (response: any) => {
      paymentId.current = response.error.metadata.payment_id;
      Sentry.withScope((scope) => {
        scope.setTag('location', 'RenderRazorpay.payment.failed');
        Sentry.captureException(new Error('Payment failed'));
      });
    });

    rzp1.open();
  };

  const handlePayment = async (status: string, orderDetails: any) => {
    if (status === 'success') {
      toast({
        variant: 'default',
        title: 'Payment Successful',
        description: 'Your payment was successful',
        duration: 9000,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: 'Your payment failed',
        duration: 9000,
      });
    }

    // Close the Razorpay script and redirect to the payments page
    setTimeout(() => {
      navigate('/payments');
      dispatch(resetPayments());
      window.location.reload();
    }, 1000);
  };

  const options = {
    key: keyID,
    currency: currency,
    amount: amount,
    order_id: order_id,
    customer_id: id,
    name: 'Argus',
    description: `Payment for exam: ${title}`,
    image: 'https://argus-s3-bucket.s3.us-east-1.amazonaws.com/logos/argus.png',
    handler: async (response: any) => {
      if (response.razorpay_payment_id) {
        await handlePayment('success', response);
      } else {
        await handlePayment('failed', response);
      }
    },
    notes: {
      email: email,
      user_id: uid,
      line1: address_line_1,
      city: city,
      state: state,
      country: country,
      zipcode: zipcode,
      form_id: form_id,
      payee_name: payee_name,
      payee_email: payee_email,
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
