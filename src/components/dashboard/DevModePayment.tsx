import React, { useEffect } from 'react';
import { useToast } from '../ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { devModePayment } from '../../functions/payment_handling/razorpay_functions';
import * as Sentry from '@sentry/react';

interface DevModePaymentProps {
  address_line_1: string;
  amount: number;
  city: string;
  currency: string;
  email: string;
  membership_level?: number;
  payee_email: string;
  payee_name: string;
  state: string;
  student_name: string;
  uid: string;
  zipcode: string;
}

const DevModePayment: React.FC<DevModePaymentProps> = ({
  address_line_1,
  amount,
  city,
  currency,
  email,
  membership_level = 1,
  payee_email,
  payee_name,
  state,
  student_name,
  uid,
  zipcode,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const processDevPayment = async () => {

      try {
        // Show processing message
        toast({
          variant: 'default',
          title: 'Processing Dev Payment...',
          description: 'Simulating payment processing...',
          duration: 2000,
        });


        // Call dev mode payment function
        const result = await devModePayment(
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
          student_name,
          zipcode
        );


        if (result.success) {

          toast({
            variant: 'default',
            title: 'Dev Payment Successful! 🎉',
            description: 'Payment completed in dev mode with mock data',
            duration: 5000,
          });

          // Log dev mode payment for debugging
        } else {
          throw new Error('Dev payment failed');
        }
      } catch (error) {

        Sentry.withScope((scope) => {
          scope.setTag('location', 'DevModePayment.processDevPayment');
          scope.setExtra('paymentData', {
            amount, currency, membership_level, uid, payee_name, payee_email
          });
          Sentry.captureException(error);
        });

        toast({
          variant: 'destructive',
          title: 'Dev Payment Failed',
          description: 'There was an error processing the dev payment. Please try again.',
          duration: 5000,
        });
      }

      // Navigate to payments page after processing

      setTimeout(() => {
        navigate('/payments');
        window.location.reload();
      }, 2000);
    };

    processDevPayment();
  }, [
    address_line_1, amount, city, currency, email, membership_level,
    payee_email, payee_name, state, student_name, uid, zipcode,
    toast, navigate, dispatch
  ]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Dev Mode Payment</h3>
      <p className="text-gray-600 text-center">
        Processing payment in development mode...<br/>
        This will create mock payment data in the database.
      </p>
    </div>
  );
};

export default DevModePayment;
