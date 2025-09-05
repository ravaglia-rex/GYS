import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import PastPaymentsTable from "./PastPaymentsTable";
import PendingPaymentsTable from "./PendingPaymentsTable";
import { getPayments } from '../../db/studentPaymentMappings';
import { setPayments } from '../../state_data/studentPaymentsSlice';
import { getExamIds } from "../../db/studentExamMappings";
import { getExamDetails } from "../../db/examDetailsCollection";
import { setExamDetails, ExamDetailsPayload } from '../../state_data/examDetailsSlice';
import { RootState } from "../../state_data/reducer";
import { auth } from "../../firebase/firebase";

import * as Sentry from '@sentry/react';
import segment from '../../segment/segment';

type PaymentsTabsProps = {
  uid: string;
  highlightPaymentsEntry?: string;
};

const PaymentsTabs: React.FC<PaymentsTabsProps> = ({ uid, highlightPaymentsEntry }) => {
  const dispatch = useDispatch();
  const payments = useSelector((state: RootState) => state.studentPayments.payments);
  const paymentsLoaded = useSelector((state: RootState) => state.studentPayments.paymentsLoaded);
  const examDetails = useSelector((state: RootState) => state.examDetails.examDetails);
  const examDetailsLoaded = useSelector((state: RootState) => state.examDetails.examDetailsLoaded);
  const [loading, setLoading] = useState(!paymentsLoaded || !examDetailsLoaded);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pendingPayments");

  const transformPaymentData = (paymentData: any) => {
    return {
      paidOn: new Date(paymentData.paid_on),
      paymentMethod: paymentData.payment_method,
      paymentStatus: paymentData.payment_status,
      transactionId: paymentData.transaction_id,
      uid: paymentData.uid,
      formId: paymentData.form_id,
      amount: paymentData.amount,
    };
  };

  useEffect(() => {
    const loadPayments = async () => {
      const startTime = performance.now();
      try {
        const paymentsData = await getPayments(uid);
        if(paymentsData.length === 0) {
          dispatch(setPayments([]));
          setLoading(false);
          return;
        }
        const transformedData = paymentsData.map(transformPaymentData);
        dispatch(setPayments(transformedData));
        setLoading(false);
      } catch (error: any) {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'PaymentsTabs.loadPayments');
          scope.setExtra('email', auth.currentUser?.email);
          Sentry.captureException(error);
        });
        setError(error.message);
        setLoading(false);
      } finally {
        const endTime = performance.now();
        const fetchTime = endTime - startTime;
        segment.track('Fetch Payments Data Time', {
          fetchTime: fetchTime,
          email: auth.currentUser?.email,
          url: window.location.href
        });
      }
    };

    const loadExamDetails = async () => {
      const startTime = performance.now();
      try {
        const { formLinks, completed, eligibility_at, result } = await getExamIds(uid);
        if (formLinks.length > 0) {
          const details = await getExamDetails(formLinks);
          const validDetails: ExamDetailsPayload[] = details
            .filter((detail: any): detail is any => detail !== null && typeof detail === 'object')
            .map((detail: any, index: number) => ({
              formId: formLinks[index],
              additionalInstructions: detail.additional_instructions,
              examDetails: detail.exam_details,
              cardTitle: detail.card_title,
              cardDescription: detail.card_description,
              paymentNeeded: detail.payment_needed,
              completed: completed[index],
              cost: detail.cost,
              currency: detail.currency,
              isProctored: detail.is_proctored,
              eligibility_at: eligibility_at[index],
              result: result[index],
              type_questions: detail.type_questions ? JSON.parse(detail.type_questions) : {},
              duration: detail.duration,
            }));

          dispatch(setExamDetails({ examDetails: validDetails, examDetailsLoaded: true }));
        }
        setLoading(false);
      } catch (error: any) {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'PaymentsTabs.loadExamDetails');
          scope.setExtra('email', auth.currentUser?.email);
          Sentry.captureException(error);
        });
        setError(error.message);
        setLoading(false);
      } finally {
        const endTime = performance.now();
        const fetchTime = endTime - startTime;
        segment.track('Fetch Exam Details Data Time', {
          fetchTime: fetchTime,
          email: auth.currentUser?.email,
          url: window.location.href
        });
      }
    };

    if (!paymentsLoaded) {
      loadPayments();
    }

    if (!examDetailsLoaded) {
      loadExamDetails();
    }
  }, [uid, dispatch, paymentsLoaded, examDetailsLoaded]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const paidExamIds = payments.map(payment => payment.formId);
  const pendingPayments = examDetails.filter(exam => !paidExamIds.includes(exam.formId) && exam.paymentNeeded);

  return (
    <div className="w-full payments-tabs">
     
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[rgba(30,41,59,0.6)] border-b border-[rgba(255,255,255,0.1)] relative">
          <TabsTrigger 
            value="pendingPayments" 
            className="data-[state=active]:text-[#8b5cf6] data-[state=active]:!bg-transparent text-[rgba(255,255,255,0.7)] hover:text-white transition-colors relative z-10"
          >
            Pending Payments
          </TabsTrigger>
          <TabsTrigger 
            value="paymentsHistory"
            className="data-[state=active]:text-[#8b5cf6] data-[state=active]:!bg-transparent text-[rgba(255,255,255,0.7)] hover:text-white transition-colors relative z-10"
          >
            Payments History
          </TabsTrigger>
          {/* Active tab indicator */}
          <div className="absolute bottom-0 h-0.5 bg-[#8b5cf6] transition-all duration-300 ease-in-out z-0" 
               style={{
                 width: '50%',
                 transform: activeTab === 'pendingPayments' ? 'translateX(0%)' : 'translateX(100%)'
               }}>
          </div>
        </TabsList>
        <TabsContent value="pendingPayments" className="mt-0">
          <PendingPaymentsTable payments={pendingPayments} highlightPaymentsEntry={highlightPaymentsEntry}/>
        </TabsContent>
        <TabsContent value="paymentsHistory" className="mt-0">
          <PastPaymentsTable payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PaymentsTabs;
