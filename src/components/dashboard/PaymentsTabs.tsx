import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, CircularProgress, Typography } from "@mui/material";

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

  const transformPaymentData = (paymentData: {
    paid_on: string;
    payment_method: string;
    payment_status: string;
    transaction_id: string;
    uid: string;
    form_id: string;
    amount: number;
  }) => {
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
    if (!uid?.trim()) {
      setLoading(false);
      return;
    }

    const needPayments = !paymentsLoaded;
    const needExams = !examDetailsLoaded;
    if (!needPayments && !needExams) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadPayments = async () => {
      const startTime = performance.now();
      try {
        const paymentsData = await getPayments(uid);
        const transformed =
          paymentsData.length === 0 ? [] : paymentsData.map(transformPaymentData);
        dispatch(setPayments(transformed));
      } catch (error: unknown) {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'PaymentsTabs.loadPayments');
          scope.setExtra('email', auth.currentUser?.email);
          Sentry.captureException(error);
        });
        throw error;
      } finally {
        const endTime = performance.now();
        segment.track('Fetch Payments Data Time', {
          fetchTime: endTime - startTime,
          email: auth.currentUser?.email,
          url: window.location.href
        });
      }
    };

    const loadExamDetails = async () => {
      const startTime = performance.now();
      try {
        const { formLinks, completed, eligibility_at, result } = await getExamIds(uid);
        if (formLinks.length === 0) {
          dispatch(setExamDetails({ examDetails: [], examDetailsLoaded: true }));
          return;
        }
        const details = await getExamDetails(formLinks);
        const validDetails: ExamDetailsPayload[] = details
          .filter((detail: unknown): detail is Record<string, unknown> => detail !== null && typeof detail === 'object')
          .map((detail: Record<string, unknown>, index: number) => ({
            formId: formLinks[index],
            additionalInstructions: detail.additional_instructions as string[],
            examDetails: detail.exam_details as string[],
            cardTitle: detail.card_title as string,
            cardDescription: detail.card_description as string,
            paymentNeeded: detail.payment_needed as boolean,
            completed: completed[index],
            cost: detail.cost as number,
            currency: detail.currency as string,
            isProctored: detail.is_proctored as boolean,
            eligibility_at: eligibility_at[index],
            result: result[index],
            type_questions: detail.type_questions ? JSON.parse(detail.type_questions as string) : {},
            duration: detail.duration as number | undefined,
          }));

        dispatch(setExamDetails({ examDetails: validDetails, examDetailsLoaded: true }));
      } catch (error: unknown) {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'PaymentsTabs.loadExamDetails');
          scope.setExtra('email', auth.currentUser?.email);
          Sentry.captureException(error);
        });
        throw error;
      } finally {
        const endTime = performance.now();
        segment.track('Fetch Assessment Details Data Time', {
          fetchTime: endTime - startTime,
          email: auth.currentUser?.email,
          url: window.location.href
        });
      }
    };

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          needPayments ? loadPayments() : Promise.resolve(),
          needExams ? loadExamDetails() : Promise.resolve(),
        ]);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Something went wrong';
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [uid, dispatch, paymentsLoaded, examDetailsLoaded]);

  if (!uid?.trim()) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          Sign in to load your payments.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 6 }}>
        <CircularProgress size={28} sx={{ color: '#8b5cf6' }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Loading payments…
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" sx={{ color: '#fecaca' }}>
          {error}
        </Typography>
      </Box>
    );
  }

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
